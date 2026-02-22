create extension if not exists "pgcrypto";

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  loss_date date not null,
  loss_cause text not null,
  location text not null,
  narrative text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  name text not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.damage_items (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  area_id uuid not null references public.areas(id) on delete cascade,
  category text not null,
  description text not null,
  qty numeric not null default 1,
  unit text not null default 'item',
  dimensions text not null default '',
  condition_notes text not null default '',
  status text not null default 'documented',
  est_replacement_cost numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  damage_item_id uuid references public.damage_items(id) on delete set null,
  file_path text not null,
  file_type text not null,
  caption text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.insurer_requests (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  request_text text not null,
  due_date date,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  insurer_request_id uuid references public.insurer_requests(id) on delete set null,
  title text not null,
  status text not null default 'open',
  due_date date,
  created_at timestamptz not null default now()
);

alter table public.claims enable row level security;
alter table public.areas enable row level security;
alter table public.damage_items enable row level security;
alter table public.evidence enable row level security;
alter table public.insurer_requests enable row level security;
alter table public.tasks enable row level security;

create policy "claims owner" on public.claims for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "areas via claim" on public.areas for all
using (exists (select 1 from public.claims c where c.id = claim_id and c.user_id = auth.uid()))
with check (exists (select 1 from public.claims c where c.id = claim_id and c.user_id = auth.uid()));

create policy "damage via claim" on public.damage_items for all
using (exists (select 1 from public.claims c where c.id = claim_id and c.user_id = auth.uid()))
with check (exists (select 1 from public.claims c where c.id = claim_id and c.user_id = auth.uid()));

create policy "evidence via claim" on public.evidence for all
using (exists (select 1 from public.claims c where c.id = claim_id and c.user_id = auth.uid()))
with check (exists (select 1 from public.claims c where c.id = claim_id and c.user_id = auth.uid()));

create policy "requests via claim" on public.insurer_requests for all
using (exists (select 1 from public.claims c where c.id = claim_id and c.user_id = auth.uid()))
with check (exists (select 1 from public.claims c where c.id = claim_id and c.user_id = auth.uid()));

create policy "tasks via claim" on public.tasks for all
using (exists (select 1 from public.claims c where c.id = claim_id and c.user_id = auth.uid()))
with check (exists (select 1 from public.claims c where c.id = claim_id and c.user_id = auth.uid()));

insert into storage.buckets (id, name, public)
values ('claim-evidence', 'claim-evidence', true)
on conflict (id) do nothing;

create policy "claim evidence objects owner" on storage.objects for all
using (
  bucket_id = 'claim-evidence' and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'claim-evidence' and (storage.foldername(name))[1] = auth.uid()::text
);
