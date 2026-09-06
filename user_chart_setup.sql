-- ============================================================
-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE
-- Recria a tabela user_chart com a estrutura correta para o backend
-- ============================================================

-- 1. Remover tabela antiga se existir (cuidado: apaga dados existentes)
DROP TABLE IF EXISTS public.user_chart CASCADE;

-- 2. Criar tabela com estrutura correta
CREATE TABLE public.user_chart (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_date TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  raw_data JSONB,
  astrology_provider TEXT CHECK (astrology_provider IS NULL OR astrology_provider IN ('jhora', 'astrologyapi')),
  astrology_cache_completeness TEXT CHECK (astrology_cache_completeness IS NULL OR astrology_cache_completeness IN ('full', 'partial')),
  astrology_schema_version INTEGER NOT NULL DEFAULT 1,
  astrology_cached_at TIMESTAMPTZ,
  jhora_retry_after TIMESTAMPTZ,
  birth_data JSONB,
  tropical_natal JSONB,
  tropical_transits JSONB,
  vedic_natal JSONB,
  vedic_specifics JSONB,
  vedic_balas JSONB,
  vedic_timing JSONB,
  vedic_vargas JSONB,
  visual_state JSONB,
  highlights JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Habilitar RLS
ALTER TABLE public.user_chart ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de segurança (usuário lê apenas o próprio chart; backend escreve via service_role)
DROP POLICY IF EXISTS "Permitir leitura do próprio chart" ON public.user_chart;
CREATE POLICY "Permitir leitura do próprio chart"
  ON public.user_chart FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir inserção do próprio chart" ON public.user_chart;
DROP POLICY IF EXISTS "Permitir atualização do próprio chart" ON public.user_chart;
DROP POLICY IF EXISTS "Service role pode tudo" ON public.user_chart;

-- 5. Permitir que o service_role (backend) faça upsert sem restrição de RLS
CREATE POLICY "Service role pode tudo em user_chart"
  ON public.user_chart FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. Índice de performance
CREATE INDEX IF NOT EXISTS idx_user_chart_user_id ON public.user_chart(user_id);

-- 7. Trigger de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_chart_updated_at ON public.user_chart;
CREATE TRIGGER update_user_chart_updated_at
  BEFORE UPDATE ON public.user_chart
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- APÓS EXECUTAR: corrija também a tabela profiles
-- Garante que a policy de INSERT existe (evita erro 409)
-- ============================================================
-- Garante que o service_role possa gerenciar perfis, mas usuários comuns não possam
-- escalar privilégios inserindo/atualizando has_access/is_admin. A política completa e
-- segura para INSERT/UPDATE de usuários está na migration 20260912000000_prelaunch_rls_and_user_paths.sql.
DROP POLICY IF EXISTS "Permitir inserção de novos perfis" ON public.profiles;
DROP POLICY IF EXISTS "Service role pode tudo em profiles" ON public.profiles;

CREATE POLICY "Service role pode tudo em profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
