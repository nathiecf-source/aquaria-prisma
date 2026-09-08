-- Tabela de notas do Diário Alquímico (múltiplas notas por usuário)
create table if not exists public.journal_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_notes_user_id_idx
  on public.journal_notes (user_id, created_at desc);

alter table public.journal_notes enable row level security;

create policy "Users can select their own journal notes"
  on public.journal_notes for select
  using (auth.uid() = user_id);

create policy "Service role pode tudo em journal_notes"
  on public.journal_notes
  for all
  to service_role
  using (true)
  with check (true);
