-- Adiciona chat_free_quota a profiles para permitir que o admin libere
-- uma quantidade limitada de perguntas no chat para usuários FREE.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS chat_free_quota integer DEFAULT 0;

COMMENT ON COLUMN public.profiles.chat_free_quota IS 'Créditos gratuitos de chat concedidos pelo admin (1-5). Decrementado a cada pergunta.';
