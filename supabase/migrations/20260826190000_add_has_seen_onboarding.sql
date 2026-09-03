-- Adiciona flag de tutorial de primeiro acesso visto
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_seen_onboarding BOOLEAN DEFAULT FALSE;
