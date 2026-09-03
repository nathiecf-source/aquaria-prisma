-- Migração: adiciona categoria aos insights para suportar filtros (Pausa de Presença, Ciclos, Caminhos)
alter table if exists public.user_insights
  add column if not exists category text;

-- Backfill: copia transit_key legado para category quando existir
update public.user_insights
  set category = transit_key
  where category is null and transit_key is not null;

-- Índice para filtragem por usuário e categoria
create index if not exists user_insights_user_category_created_idx
  on public.user_insights (user_id, category, created_at desc);
