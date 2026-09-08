-- Adiciona flags para controle de popups vistos pelo usuario
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_seen_community BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_seen_feedback BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_seen_pwa BOOLEAN DEFAULT FALSE;
