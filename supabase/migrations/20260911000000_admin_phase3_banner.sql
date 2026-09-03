-- Fase 3 ajuste: banner personalizável do Chamado

INSERT INTO public.system_settings (key, value)
VALUES
  ('chamado_banner_text', '""')
ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
