-- Fase 3 do Painel Admin: Chamado granular, feedbacks e prova social

-- 1. Configurações do Chamado
INSERT INTO public.system_settings (key, value)
VALUES
  ('chamado_active', 'false'),
  ('chamado_expires_at', 'null'),
  ('chamado_features', '[]')
ON CONFLICT (key) DO NOTHING;

-- 2. Tabela de depoimentos / prova social
CREATE TABLE IF NOT EXISTS public.user_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rating int CHECK (rating >= 1 AND rating <= 5),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public reads on feedbacks"
  ON public.user_feedbacks
  FOR SELECT
  USING (false);

-- 3. Depoimentos de teste (anônimos)
INSERT INTO public.user_feedbacks (user_id, rating, content)
VALUES
  (NULL, 5, 'A leitura dos eixos explodiu minha mente. Nunca vi tanta clareza.'),
  (NULL, 5, 'Entendi padrões que eu carregava há anos. Incrível.'),
  (NULL, 4, 'O visual e a profundidade das leituras são surpreendentes.')
ON CONFLICT DO NOTHING;

-- 4. Recarrega cache do PostgREST
NOTIFY pgrst, 'reload schema';
