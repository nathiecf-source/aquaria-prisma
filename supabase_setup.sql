-- Script SQL para atualizar o banco de dados Supabase

-- 1. Criação do ENUM para o nível de assinatura (opcional, pode ser texto simples para flexibilidade)
-- CREATE TYPE public.subscription_tier_enum AS ENUM ('FREE', 'PLUS');

-- 2. Criação da tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  whatsapp_number TEXT NOT NULL,
  subscription_tier TEXT DEFAULT 'FREE', -- 'FREE' ou 'PLUS'
  has_access BOOLEAN DEFAULT false,
  access_expires_at TIMESTAMPTZ,
  current_plan_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Garante colunas adicionais mesmo se a tabela já existir sem elas
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_plan_id text,
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 3. Habilitação de RLS (Row Level Security) na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criação de Políticas de Segurança (Policies) para profiles
-- Service_role consegue gerenciar tudo (backend)
CREATE POLICY "Service role pode tudo em profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Usuário autenticado lê seu próprio perfil
CREATE POLICY "Permitir leitura do próprio perfil" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Usuário só pode atualizar campos não sensíveis (has_access/is_admin não podem mudar)
-- A lógica completa de segurança por colunas está na migration prelaunch.
CREATE POLICY "Permitir atualização segura do próprio perfil" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Novos registros só são inseridos com valores default (sem privilégios)
CREATE POLICY "Permitir inserção de novos perfis" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 5. Trigger Automatizado para preenchimento de Perfis na criação de conta
-- NOTA: Caso use metadados customizados na criação de conta (como full_name e whatsapp_number),
-- esta trigger irá lê-los e gravar na tabela pública profiles automaticamente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, whatsapp_number, subscription_tier, has_access, access_expires_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário Astrológico'),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp_number', '+55 00 00000-0000'),
    'FREE',
    false,
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associa o Trigger à tabela auth.users do Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Tabela de transações InfinitePay
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  order_nsu TEXT UNIQUE NOT NULL,
  transaction_nsu TEXT,
  slug TEXT,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'infinitepay',
  checkout_url TEXT,
  payload JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Apenas o backend via service_role gerencia transações
CREATE POLICY "Service role pode tudo em transactions"
  ON public.transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. Função para estender o acesso ao confirmar pagamento
CREATE OR REPLACE FUNCTION public.extend_user_access(p_user_id UUID, p_plan_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  interval_to_add interval;
BEGIN
  interval_to_add := CASE
    WHEN p_plan_id IN ('annual-launch', 'annual-official') THEN '1 year'::interval
    WHEN p_plan_id = 'semester' THEN '6 months'::interval
    WHEN p_plan_id = 'monthly' THEN '1 month'::interval
    ELSE '1 year'::interval
  END;

  UPDATE public.profiles
  SET
    has_access = true,
    subscription_tier = 'PLUS',
    current_plan_id = p_plan_id,
    access_expires_at = GREATEST(COALESCE(access_expires_at, now()), now()) + interval_to_add,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- 8. Tabela de cupons de desconto
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  plan_id text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  is_active boolean DEFAULT true,
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct coupon reads"
  ON public.coupons
  FOR SELECT
  USING (false);

-- Cupom de teste: 10% OFF
INSERT INTO public.coupons (code, discount_type, discount_value, is_active, max_uses)
VALUES ('TESTE10', 'percentage', 10, true, 100)
ON CONFLICT (code) DO NOTHING;

-- 9. Campos de cupom nas transações
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS original_amount integer;

-- 10. Função para incrementar o contador de usos de um cupom
CREATE OR REPLACE FUNCTION public.increment_coupon_uses(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coupons
  SET
    current_uses = current_uses + 1,
    updated_at = now()
  WHERE
    code = p_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);
END;
$$;

-- 11. Coluna de administrador em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 12. Tabela de configurações globais (Kill Switch)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct settings reads"
  ON public.system_settings
  FOR SELECT
  USING (false);

INSERT INTO public.system_settings (key, value)
VALUES
  ('chat_active', 'true'),
  ('checkout_active', 'true')
ON CONFLICT (key) DO NOTHING;

-- 13. Define a conta principal como administradora (cria perfil se ausente)
INSERT INTO public.profiles (id, full_name, whatsapp_number, subscription_tier, has_access, is_admin, current_plan_id, access_expires_at)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Administrador'),
  COALESCE(au.raw_user_meta_data->>'whatsapp_number', '+55 00 00000-0000'),
  'FREE',
  false,
  true,
  NULL,
  NULL
FROM auth.users au
WHERE au.email = 'nathiecf@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET is_admin = true,
      updated_at = now();

-- 14. Recarrega o cache de schema do PostgREST automaticamente após DDLs
CREATE OR REPLACE FUNCTION public.pgrst_watch()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$;

DROP EVENT TRIGGER IF EXISTS pgrst_schema_update;
CREATE EVENT TRIGGER pgrst_schema_update
  ON ddl_command_end
  EXECUTE FUNCTION public.pgrst_watch();

-- 15. Configurações de banner global
INSERT INTO public.system_settings (key, value)
VALUES
  ('banner_active', 'false'),
  ('banner_text', '""')
ON CONFLICT (key) DO NOTHING;

-- 16. Tabela de eventos de analytics
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public reads on analytics"
  ON public.analytics_events
  FOR SELECT
  USING (false);

-- 17. Recarrega cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- 18. Configurações do Chamado
INSERT INTO public.system_settings (key, value)
VALUES
  ('chamado_active', 'false'),
  ('chamado_expires_at', 'null'),
  ('chamado_features', '[]'),
  ('chamado_banner_text', '""')
ON CONFLICT (key) DO NOTHING;

-- 19. Tabela de depoimentos / prova social
CREATE TABLE IF NOT EXISTS public.user_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating int CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public reads on feedbacks"
  ON public.user_feedbacks
  FOR SELECT
  USING (false);

-- 20. Depoimentos de teste (anônimos)
INSERT INTO public.user_feedbacks (user_id, rating, content)
VALUES
  (NULL, 5, 'A leitura dos eixos explodiu minha mente. Nunca vi tanta clareza.'),
  (NULL, 5, 'Entendi padrões que eu carregava há anos. Incrível.'),
  (NULL, 4, 'O visual e a profundidade das leituras são surpreendentes.')
ON CONFLICT DO NOTHING;

-- 21. Recarrega cache do PostgREST
NOTIFY pgrst, 'reload schema';
