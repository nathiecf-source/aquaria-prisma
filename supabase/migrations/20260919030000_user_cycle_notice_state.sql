CREATE TABLE IF NOT EXISTS public.user_cycle_notice_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tab TEXT NOT NULL CHECK (tab IN ('dashas', 'portal', 'transits')),
  signature TEXT NOT NULL,
  identities JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tab)
);

ALTER TABLE public.user_cycle_notice_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own cycle notice state" ON public.user_cycle_notice_state;
CREATE POLICY "Users can select own cycle notice state"
  ON public.user_cycle_notice_state FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage cycle notice state" ON public.user_cycle_notice_state;
CREATE POLICY "Service role can manage cycle notice state"
  ON public.user_cycle_notice_state FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_cycle_notice_state_user_id
  ON public.user_cycle_notice_state(user_id);

NOTIFY pgrst, 'reload schema';
