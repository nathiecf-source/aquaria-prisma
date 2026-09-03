-- Adiciona restrição opcional de plano aos cupons

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS plan_id text;

COMMENT ON COLUMN public.coupons.plan_id IS 'Plano ao qual o cupom se aplica. NULL = qualquer plano.';
