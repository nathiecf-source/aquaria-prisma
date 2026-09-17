-- Adiciona timestamp do primeiro acesso real para controle de popups por dias
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_accessed_at timestamptz;

COMMENT ON COLUMN public.profiles.first_accessed_at IS 'Data/hora do primeiro acesso na mandala; base para cronometrar onboarding, comunidade e avaliacao';
