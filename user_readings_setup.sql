-- ============================================================
-- MIGRAÇÃO: Cria tabela genérica "user_readings" para cache de
-- leituras geradas sob demanda (Caminhos, Casas por aba, Vetores, Lua, Dashas).
-- Execute no SQL Editor do Supabase.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reading_id TEXT NOT NULL,        -- ex: 'eixo-asc', 'casa-3-tropical', 'casa-3-vedic', 'casa-3-sintese', 'petal-fire', 'lua-natal', 'dasha-[uuid]-lua-venus-venus'
  reading_type TEXT NOT NULL,      -- 'caminho' | 'casa-tropical' | 'casa-vedic' | 'casa-sintese' | 'vetor' | 'lua' | 'dasha' | 'profection' | 'rapid-activations'
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ,          -- cache invalidation para leituras temporais (Dashas)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, reading_id)
);

ALTER TABLE public.user_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura das próprias leituras" ON public.user_readings;
CREATE POLICY "Permitir leitura das próprias leituras"
  ON public.user_readings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir escrita das próprias leituras" ON public.user_readings;
CREATE POLICY "Permitir escrita das próprias leituras"
  ON public.user_readings FOR ALL
  USING (auth.uid() = user_id);
