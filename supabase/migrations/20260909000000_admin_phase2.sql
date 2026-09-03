-- Fase 2 do Painel Admin: banner global, analytics e cupons

-- 1. Configurações de banner
INSERT INTO public.system_settings (key, value)
VALUES
  ('banner_active', 'false'),
  ('banner_text', '""')
ON CONFLICT (key) DO NOTHING;

-- 2. Tabela de eventos de analytics
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

-- 3. Recarrega cache do PostgREST
NOTIFY pgrst, 'reload schema';
