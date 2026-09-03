-- ============================================================
-- MIGRAÇÃO: Adiciona colunas ausentes à tabela user_chart existente
-- Execute no SQL Editor do Supabase para não perder dados dos usuários
-- ============================================================

ALTER TABLE public.user_chart
  ADD COLUMN IF NOT EXISTS birth_data JSONB,
  ADD COLUMN IF NOT EXISTS tropical_natal JSONB,
  ADD COLUMN IF NOT EXISTS tropical_transits JSONB,
  ADD COLUMN IF NOT EXISTS vedic_natal JSONB,
  ADD COLUMN IF NOT EXISTS vedic_specifics JSONB,
  ADD COLUMN IF NOT EXISTS vedic_balas JSONB,
  ADD COLUMN IF NOT EXISTS vedic_timing JSONB,
  ADD COLUMN IF NOT EXISTS vedic_vargas JSONB,
  ADD COLUMN IF NOT EXISTS visual_state JSONB,
  ADD COLUMN IF NOT EXISTS highlights JSONB;

-- Garante que prokerala_raw_data seja opcional se ainda existir
ALTER TABLE public.user_chart
  ALTER COLUMN prokerala_raw_data DROP NOT NULL;

-- Garante políticas de acesso para service_role/backend
DROP POLICY IF EXISTS "Service role pode tudo" ON public.user_chart;
CREATE POLICY "Service role pode tudo"
  ON public.user_chart FOR ALL
  USING (true)
  WITH CHECK (true);

