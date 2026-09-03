-- Tabela para armazenar os insights do usuário gerados na aba Ciclos
create table if not exists public.user_insights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  insight_text text not null,
  transit_key  text,
  created_at  timestamptz not null default now()
);

-- Index para busca rápida por usuário
create index if not exists user_insights_user_id_idx
  on public.user_insights (user_id, created_at desc);

-- RLS: cada usuário acessa apenas seus próprios insights
alter table public.user_insights enable row level security;

create policy "Users can insert their own insights"
  on public.user_insights for insert
  with check (auth.uid() = user_id);

create policy "Users can select their own insights"
  on public.user_insights for select
  using (auth.uid() = user_id);

create policy "Users can delete their own insights"
  on public.user_insights for delete
  using (auth.uid() = user_id);
