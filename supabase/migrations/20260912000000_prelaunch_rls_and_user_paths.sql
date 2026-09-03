-- ============================================================
-- FASE PRE-LANÇAMENTO: auditoria de segurança e schema
-- Correções:
-- 1. Cria tabela user_paths (faltava)
-- 2. Corrige RLS de profiles para impedir escalação de privilégios
-- 3. Corrige RLS de user_chart e remove políticas abertas
-- 4. Garante que service_role consiga escrever nas tabelas de usuário
-- ============================================================

-- 1. Tabela user_paths (diário, meditação e progresso do usuário)
CREATE TABLE IF NOT EXISTS public.user_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id TEXT NOT NULL,
  path_title TEXT,
  source_text TEXT,
  source_text_hash TEXT,
  journal_text TEXT,
  meditation_script TEXT,
  meditation_audio_url TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, path_id)
);

ALTER TABLE public.user_paths ENABLE ROW LEVEL SECURITY;

-- Usuários só leem seus próprios caminhos (backend usa service_role)
DROP POLICY IF EXISTS "Users can select own paths" ON public.user_paths;
CREATE POLICY "Users can select own paths"
  ON public.user_paths FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Corrige RLS de profiles

-- Remove políticas abertas/perigosas
DROP POLICY IF EXISTS "Service role pode tudo em profiles" ON public.profiles;
DROP POLICY IF EXISTS "Permitir inserção de novos perfis" ON public.profiles;
DROP POLICY IF EXISTS "Permitir leitura do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permitir atualização do próprio perfil" ON public.profiles;

-- Mantém leitura do próprio perfil
CREATE POLICY "Permitir leitura do próprio perfil"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Inserção só com valores default (não permite is_admin/has_access)
CREATE POLICY "Permitir inserção de novos perfis"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND COALESCE(is_admin, false) = false
    AND COALESCE(has_access, false) = false
    AND COALESCE(subscription_tier, 'FREE') = 'FREE'
    AND access_expires_at IS NULL
    AND current_plan_id IS NULL
  );

-- Atualização do próprio perfil, mas sem alterar campos sensíveis
CREATE POLICY "Permitir atualização segura do próprio perfil"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND COALESCE(has_access, false) = COALESCE((SELECT has_access FROM public.profiles p2 WHERE p2.id = auth.uid()), false)
    AND COALESCE(is_admin, false) = COALESCE((SELECT is_admin FROM public.profiles p2 WHERE p2.id = auth.uid()), false)
    AND COALESCE(subscription_tier, 'FREE') = COALESCE((SELECT subscription_tier FROM public.profiles p2 WHERE p2.id = auth.uid()), 'FREE')
    AND COALESCE(access_expires_at, '1970-01-01'::timestamptz) = COALESCE((SELECT access_expires_at FROM public.profiles p2 WHERE p2.id = auth.uid()), '1970-01-01'::timestamptz)
    AND COALESCE(current_plan_id, '') = COALESCE((SELECT current_plan_id FROM public.profiles p2 WHERE p2.id = auth.uid()), '')
  );

-- Service role consegue tudo
CREATE POLICY "Service role pode tudo em profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Corrige RLS de user_chart

-- Remove política aberta
DROP POLICY IF EXISTS "Service role pode tudo" ON public.user_chart;
DROP POLICY IF EXISTS "Permitir leitura do próprio chart" ON public.user_chart;
DROP POLICY IF EXISTS "Permitir inserção do próprio chart" ON public.user_chart;
DROP POLICY IF EXISTS "Permitir atualização do próprio chart" ON public.user_chart;

-- Usuário só lê o próprio chart (backend gera e salva via service_role)
CREATE POLICY "Permitir leitura do próprio chart"
  ON public.user_chart FOR SELECT
  USING (auth.uid() = user_id);

-- Service role consegue tudo
CREATE POLICY "Service role pode tudo em user_chart"
  ON public.user_chart
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. user_readings: service_role escreve, usuário só lê
DROP POLICY IF EXISTS "Permitir leitura das próprias leituras" ON public.user_readings;
DROP POLICY IF EXISTS "Permitir escrita das próprias leituras" ON public.user_readings;

CREATE POLICY "Permitir leitura das próprias leituras"
  ON public.user_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role pode tudo em user_readings"
  ON public.user_readings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. user_insights: service_role escreve, usuário só lê
DROP POLICY IF EXISTS "Users can insert their own insights" ON public.user_insights;
DROP POLICY IF EXISTS "Users can select their own insights" ON public.user_insights;
DROP POLICY IF EXISTS "Users can delete their own insights" ON public.user_insights;

CREATE POLICY "Users can select their own insights"
  ON public.user_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role pode tudo em user_insights"
  ON public.user_insights
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. user_paths: service_role escreve, usuário só lê
DROP POLICY IF EXISTS "Users can select own paths" ON public.user_paths;
CREATE POLICY "Users can select own paths"
  ON public.user_paths FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role pode tudo em user_paths"
  ON public.user_paths
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. transactions: service_role escreve, usuário só lê
DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;

CREATE POLICY "Users can read own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role pode tudo em transactions"
  ON public.transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 8. chat_usage: service_role escreve, usuário só lê
DROP POLICY IF EXISTS "Users can read own chat_usage" ON public.chat_usage;

CREATE POLICY "Users can read own chat_usage"
  ON public.chat_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role pode tudo em chat_usage"
  ON public.chat_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 9. Índices de performance
CREATE INDEX IF NOT EXISTS idx_user_paths_user_id ON public.user_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_user_paths_path_id ON public.user_paths(path_id);

-- 10. Trigger de updated_at para user_paths
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_paths_updated_at ON public.user_paths;
CREATE TRIGGER update_user_paths_updated_at
  BEFORE UPDATE ON public.user_paths
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Recarrega cache do PostgREST
NOTIFY pgrst, 'reload schema';
