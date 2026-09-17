-- Adiciona controle de destaque e exclusão suave na tabela de depoimentos
ALTER TABLE public.user_feedbacks
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Índice para consulta pública eficiente
CREATE INDEX IF NOT EXISTS user_feedbacks_featured_idx
  ON public.user_feedbacks (is_featured, is_deleted, created_at DESC);
