-- Adiciona chat_free_quota a profiles para contabilizar perguntas
-- gratuitas de chat concedidas pelo Chamado. O valor é decrementado
-- a cada pergunta e reinicializado quando um novo Chamado ativo com
-- a feature 'chat' for ativado.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS chat_free_quota integer DEFAULT 0;

COMMENT ON COLUMN public.profiles.chat_free_quota IS 'Créditos gratuitos de chat por usuário. Definido pelo Chamado e decrementado a cada pergunta.';
