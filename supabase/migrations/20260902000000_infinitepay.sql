-- InfinitePay checkout: controle de acesso e histórico de transações

-- 1. Estende campos de acesso na tabela profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_access boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_expires_at timestamp with time zone;

COMMENT ON COLUMN public.profiles.has_access IS 'Flag de acesso pago ativo';
COMMENT ON COLUMN public.profiles.access_expires_at IS 'Data/hora de expiração do acesso pago';

-- 2. Tabela de transações de pagamento
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  order_nsu text UNIQUE NOT NULL,
  transaction_nsu text,
  slug text,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'infinitepay',
  checkout_url text,
  payload jsonb,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

COMMENT ON TABLE public.transactions IS 'Histórico de pedidos e pagamentos da InfinitePay';

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own transactions" ON public.transactions;
CREATE POLICY "Users can read own transactions"
  ON public.transactions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions"
  ON public.transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Função para estender o acesso com base no plano (idempotente)
CREATE OR REPLACE FUNCTION public.extend_user_access(p_user_id uuid, p_plan_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  interval_to_add interval;
BEGIN
  interval_to_add := CASE
    WHEN p_plan_id IN ('annual-launch', 'annual-official') THEN '1 year'::interval
    WHEN p_plan_id = 'semester' THEN '6 months'::interval
    ELSE '1 year'::interval
  END;

  UPDATE public.profiles
  SET
    has_access = true,
    subscription_tier = 'PLUS',
    access_expires_at = GREATEST(COALESCE(access_expires_at, now()), now()) + interval_to_add,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

COMMENT ON FUNCTION public.extend_user_access(uuid, text) IS 'Estende access_expires_at a partir da data atual ou da expiração existente, conforme o plano';
