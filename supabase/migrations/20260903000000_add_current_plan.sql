-- Adiciona current_plan_id a profiles e atualiza a função de extensão de acesso

-- 1. Novo campo para identificar o plano vigente
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_plan_id text;

COMMENT ON COLUMN public.profiles.current_plan_id IS 'Identificador do plano vigente (annual-launch, annual-official, semester, monthly)';

-- 2. Atualiza a função para suportar monthly (1 mês) e setar current_plan_id
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
    WHEN p_plan_id = 'monthly' THEN '1 month'::interval
    ELSE '1 year'::interval
  END;

  UPDATE public.profiles
  SET
    has_access = true,
    subscription_tier = 'PLUS',
    current_plan_id = p_plan_id,
    access_expires_at = GREATEST(COALESCE(access_expires_at, now()), now()) + interval_to_add,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;
