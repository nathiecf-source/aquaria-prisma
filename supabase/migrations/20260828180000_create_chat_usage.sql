create table if not exists public.chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  count integer not null default 0,
  updated_at timestamp with time zone default now(),
  primary key (user_id, month)
);

comment on table public.chat_usage is 'Controle de uso do chat astrológico (30 perguntas/mês por usuário)';

alter table public.chat_usage enable row level security;

create policy "Users can read own chat_usage"
  on public.chat_usage
  for select
  using (auth.uid() = user_id);
