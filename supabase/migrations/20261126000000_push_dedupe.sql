-- Dedupe de tokens push e log de idempotência de envio.
-- 1) Remove linhas duplicadas de fcm_token mantendo a mais recente (updated_at).
delete from user_devices a
using user_devices b
where a.fcm_token = b.fcm_token
  and a.updated_at < b.updated_at;

-- 2) Índice único exigido pelo upsert onConflict("fcm_token") no cliente.
create unique index if not exists user_devices_fcm_token_key
  on user_devices (fcm_token);

-- 3) Lock de idempotência dos envios (cron/scheduler retry, multi-instância).
create table if not exists push_send_log (
  dedupe_key text primary key,
  created_at timestamptz not null default now()
);

-- Service role acessa integralmente; clientes anon/auth não precisam ler.
alter table push_send_log enable row level security;
