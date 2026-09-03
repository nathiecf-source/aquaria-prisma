-- Cupons de desconto para planos

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  is_active boolean DEFAULT true,
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.coupons IS 'Cupons de desconto para os passes de acesso';

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- O service role acessa sem RLS; anons/users não leem cupons diretamente
CREATE POLICY "No direct coupon reads"
  ON public.coupons
  FOR SELECT
  USING (false);

-- Cupom de teste: 10% OFF
INSERT INTO public.coupons (code, discount_type, discount_value, is_active, max_uses)
VALUES ('TESTE10', 'percentage', 10, true, 100)
ON CONFLICT (code) DO NOTHING;

-- Campos de cupom nas transações
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS original_amount integer;

-- Função para incrementar o contador de usos de um cupom
CREATE OR REPLACE FUNCTION public.increment_coupon_uses(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coupons
  SET
    current_uses = current_uses + 1,
    updated_at = now()
  WHERE
    code = p_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);
END;
$$;
