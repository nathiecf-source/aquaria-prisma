-- Refatoração do Admin: Funil de Vendas e CRM escalável
-- Toda agregação e paginação acontece no PostgreSQL via RPCs SECURITY DEFINER.

-- ============================================================
-- 1. Metadata em analytics_events (feature_id do paywall etc.)
-- ============================================================
ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS metadata jsonb;

COMMENT ON COLUMN public.analytics_events.metadata IS 'Metadados do evento (ex: {"feature_id":"casa_8"} para view_paywall)';

-- Índices para agregações do funil e oportunidades
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created
  ON public.analytics_events (event_name, created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_user
  ON public.analytics_events (event_name, user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_paywall_feature
  ON public.analytics_events ((metadata->>'feature_id'))
  WHERE event_name = 'view_paywall';

CREATE INDEX IF NOT EXISTS idx_transactions_status_user_created
  ON public.transactions (status, user_id, created_at);

-- ============================================================
-- 2. profiles: last_sign_in_at + created_at
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

COMMENT ON COLUMN public.profiles.last_sign_in_at IS 'Último login sincronizado de auth.users via trigger';
COMMENT ON COLUMN public.profiles.created_at IS 'Data de cadastro espelhada de auth.users.created_at';

-- Backfill a partir de auth.users
UPDATE public.profiles p
SET
  last_sign_in_at = au.last_sign_in_at,
  created_at = au.created_at
FROM auth.users au
WHERE au.id = p.id;

ALTER TABLE public.profiles
  ALTER COLUMN created_at SET DEFAULT now();

-- Trigger: GoTrue atualiza auth.users.last_sign_in_at a cada login.
-- O trigger só dispara quando essa coluna muda — nenhum outro update é afetado.
CREATE OR REPLACE FUNCTION public.sync_profile_last_sign_in()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    UPDATE public.profiles
      SET last_sign_in_at = NEW.last_sign_in_at
      WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_last_sign_in ON auth.users;
CREATE TRIGGER trg_sync_last_sign_in
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_last_sign_in();

-- ============================================================
-- 3. RPC: Funil com usuários únicos (COUNT DISTINCT user_id)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_funnel_metrics()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'viewPaywall',       (SELECT count(DISTINCT user_id) FROM analytics_events WHERE event_name = 'view_paywall'),
    'viewPlans',         (SELECT count(DISTINCT user_id) FROM analytics_events WHERE event_name = 'view_plans'),
    'checkoutInitiated', (SELECT count(DISTINCT user_id) FROM analytics_events WHERE event_name = 'checkout_initiated'),
    'checkoutCompleted', (SELECT count(DISTINCT user_id) FROM transactions WHERE status = 'paid')
  );
$$;

-- ============================================================
-- 4. RPC: Ranking de barreiras (view_paywall por feature_id)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_paywall_ranking()
RETURNS TABLE(feature_id text, views bigint, unique_users bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(metadata->>'feature_id', '(legado)') AS feature_id,
    count(*) AS views,
    count(DISTINCT user_id) AS unique_users
  FROM analytics_events
  WHERE event_name = 'view_paywall'
  GROUP BY 1
  ORDER BY unique_users DESC, views DESC;
$$;

-- ============================================================
-- 5. RPC: Carrinhos abandonados (checkout_initiated 7d, sem paid)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_abandoned_carts(p_limit int DEFAULT 10, p_offset int DEFAULT 0)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  whatsapp_number text,
  last_attempt timestamptz,
  attempts bigint,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH latest AS (
    SELECT user_id, max(created_at) AS last_attempt, count(*) AS attempts
    FROM analytics_events
    WHERE event_name = 'checkout_initiated'
      AND created_at >= now() - interval '7 days'
    GROUP BY user_id
  )
  SELECT
    l.user_id,
    p.full_name,
    au.email::text,
    p.whatsapp_number,
    l.last_attempt,
    l.attempts,
    count(*) OVER () AS total_count
  FROM latest l
  JOIN profiles p ON p.id = l.user_id
  JOIN auth.users au ON au.id = l.user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.user_id = l.user_id AND t.status = 'paid'
  )
  ORDER BY l.last_attempt DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- ============================================================
-- 6. RPC: Flerteiros (view_plans >= 3 em 7d, sem paid)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_flerteiros(p_limit int DEFAULT 10, p_offset int DEFAULT 0)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  whatsapp_number text,
  plan_views bigint,
  last_view timestamptz,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH frequent AS (
    SELECT user_id, count(*) AS plan_views, max(created_at) AS last_view
    FROM analytics_events
    WHERE event_name = 'view_plans'
      AND created_at >= now() - interval '7 days'
    GROUP BY user_id
    HAVING count(*) >= 3
  )
  SELECT
    f.user_id,
    p.full_name,
    au.email::text,
    p.whatsapp_number,
    f.plan_views,
    f.last_view,
    count(*) OVER () AS total_count
  FROM frequent f
  JOIN profiles p ON p.id = f.user_id
  JOIN auth.users au ON au.id = f.user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.user_id = f.user_id AND t.status = 'paid'
  )
  ORDER BY f.plan_views DESC, f.last_view DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- ============================================================
-- 7. RPC: CRM de assinantes PLUS (paginado)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_users_plus(p_limit int DEFAULT 10, p_offset int DEFAULT 0, p_order text DEFAULT 'desc')
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  whatsapp_number text,
  last_sign_in_at timestamptz,
  access_expires_at timestamptz,
  subscription_started_at timestamptz,
  current_plan_id text,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    au.email::text,
    p.whatsapp_number,
    p.last_sign_in_at,
    p.access_expires_at,
    s.subscription_started_at,
    p.current_plan_id,
    count(*) OVER () AS total_count
  FROM profiles p
  JOIN auth.users au ON au.id = p.id
  LEFT JOIN LATERAL (
    SELECT max(t.created_at) AS subscription_started_at
    FROM transactions t
    WHERE t.user_id = p.id AND t.status = 'paid'
  ) s ON true
  WHERE p.has_access = true
    AND (p.access_expires_at IS NULL OR p.access_expires_at > now())
  ORDER BY
    CASE WHEN p_order = 'asc'  THEN s.subscription_started_at END ASC NULLS LAST,
    CASE WHEN p_order <> 'asc' THEN s.subscription_started_at END DESC NULLS LAST,
    p.access_expires_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- ============================================================
-- 8. RPC: CRM de usuários FREE (paginado)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_users_free(p_limit int DEFAULT 10, p_offset int DEFAULT 0)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  whatsapp_number text,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    au.email::text,
    p.whatsapp_number,
    p.last_sign_in_at,
    p.created_at,
    count(*) OVER () AS total_count
  FROM profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE NOT (p.has_access = true AND (p.access_expires_at IS NULL OR p.access_expires_at > now()))
  ORDER BY p.created_at DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
$$;

-- ============================================================
-- 9. Permissões: apenas service_role executa as RPCs
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.admin_funnel_metrics() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_paywall_ranking() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_abandoned_carts(int, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_flerteiros(int, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_users_plus(int, int, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_users_free(int, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_last_sign_in() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_funnel_metrics() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_paywall_ranking() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_abandoned_carts(int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_flerteiros(int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_users_plus(int, int, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_users_free(int, int) TO service_role;

NOTIFY pgrst, 'reload schema';
