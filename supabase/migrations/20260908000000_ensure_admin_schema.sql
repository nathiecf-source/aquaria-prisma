-- Catch-up: garante que as colunas de admin e current_plan_id existam em profiles,
-- e que a conta principal tenha is_admin = true e um perfil correspondente.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_plan_id text,
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.current_plan_id IS 'Identificador do plano vigente (annual-launch, annual-official, semester, monthly)';
COMMENT ON COLUMN public.profiles.is_admin IS 'Indica se a conta tem acesso ao painel administrativo';

-- Garante que a conta nathiecf@gmail.com tenha um perfil e seja admin
INSERT INTO public.profiles (id, full_name, whatsapp_number, subscription_tier, has_access, is_admin, current_plan_id, access_expires_at)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Administrador'),
  COALESCE(au.raw_user_meta_data->>'whatsapp_number', '+55 00 00000-0000'),
  'FREE',
  false,
  true,
  NULL,
  NULL
FROM auth.users au
WHERE au.email = 'nathiecf@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET is_admin = true,
      updated_at = now();

-- Recarrega o cache do PostgREST
NOTIFY pgrst, 'reload schema';
