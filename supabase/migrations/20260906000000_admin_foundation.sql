-- Fase 1: Fundação do Painel Administrativo

-- 1. Adiciona flag de administrador em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Tabela de configurações globais (Kill Switch)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Service role/admin acessa diretamente; usuários comuns não leem configurações sensíveis
CREATE POLICY "No direct settings reads"
  ON public.system_settings
  FOR SELECT
  USING (false);

-- 3. Chaves padrão: chat e checkout ativos
INSERT INTO public.system_settings (key, value)
VALUES
  ('chat_active', 'true'),
  ('checkout_active', 'true')
ON CONFLICT (key) DO NOTHING;

-- 4. Define a conta principal como administradora
UPDATE public.profiles
SET is_admin = true
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE email = 'nathiecf@gmail.com'
  LIMIT 1
);
