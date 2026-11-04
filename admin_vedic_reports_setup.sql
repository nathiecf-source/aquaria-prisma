-- ============================================================
-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE
-- Cria a tabela "admin_vedic_reports" para relatórios védicos
-- estruturais gerados sob demanda pelo painel admin
-- (usuários cadastrados OU clientes externos).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_vedic_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,   -- admin que gerou
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- usuário cadastrado (NULL = cliente externo)
  client_name TEXT NOT NULL,
  client_email TEXT,
  gender TEXT NOT NULL DEFAULT 'neutro',
  birth_data JSONB NOT NULL,        -- {birthDate, birthTime, birthPlace{name,latitude,longitude,timezone}}
  profile_snapshot JSONB NOT NULL,  -- {vedic_natal, vedic_specifics, vedic_balas, vedic_vargas, vedic_timing, dataSource}
  structural JSONB NOT NULL,        -- matriz determinística do vedicStructuralEngine
  report JSONB NOT NULL,            -- seções geradas: {summary, planets[9], houses[12]}
  source TEXT NOT NULL DEFAULT 'jhora', -- 'user_chart' | 'jhora' | 'astrologyapi' (+ sufixo de cache)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_vedic_reports ENABLE ROW LEVEL SECURITY;

-- Apenas o service_role (backend) acessa; o requireAdmin do server.ts
-- garante que só admins autenticados disparam as rotas.
DROP POLICY IF EXISTS "Service role pode tudo em admin_vedic_reports" ON public.admin_vedic_reports;
CREATE POLICY "Service role pode tudo em admin_vedic_reports"
  ON public.admin_vedic_reports FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_admin_vedic_reports_created_at ON public.admin_vedic_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_vedic_reports_target_user ON public.admin_vedic_reports(target_user_id);
