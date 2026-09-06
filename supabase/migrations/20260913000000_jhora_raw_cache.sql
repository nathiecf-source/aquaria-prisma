ALTER TABLE public.user_chart
  ADD COLUMN IF NOT EXISTS raw_data JSONB,
  ADD COLUMN IF NOT EXISTS astrology_provider TEXT,
  ADD COLUMN IF NOT EXISTS astrology_cache_completeness TEXT,
  ADD COLUMN IF NOT EXISTS astrology_schema_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS astrology_cached_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS jhora_retry_after TIMESTAMPTZ;

ALTER TABLE public.user_chart
  DROP CONSTRAINT IF EXISTS user_chart_astrology_provider_check,
  ADD CONSTRAINT user_chart_astrology_provider_check
    CHECK (astrology_provider IS NULL OR astrology_provider IN ('jhora', 'astrologyapi')),
  DROP CONSTRAINT IF EXISTS user_chart_astrology_cache_completeness_check,
  ADD CONSTRAINT user_chart_astrology_cache_completeness_check
    CHECK (astrology_cache_completeness IS NULL OR astrology_cache_completeness IN ('full', 'partial'));
