-- Relatórios védicos estruturais gerados sob demanda pelo painel admin
CREATE TABLE IF NOT EXISTS public.admin_vedic_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  gender TEXT NOT NULL DEFAULT 'neutro',
  birth_data JSONB NOT NULL,
  profile_snapshot JSONB NOT NULL,
  structural JSONB NOT NULL,
  report JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'jhora',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_vedic_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role pode tudo em admin_vedic_reports" ON public.admin_vedic_reports;
CREATE POLICY "Service role pode tudo em admin_vedic_reports"
  ON public.admin_vedic_reports FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_admin_vedic_reports_created_at ON public.admin_vedic_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_vedic_reports_target_user ON public.admin_vedic_reports(target_user_id);
