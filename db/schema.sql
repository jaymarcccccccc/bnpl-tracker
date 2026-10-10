-- Buy now, pay later tracker: schema for Supabase (PostgreSQL)
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- A purchase owns a schedule of installments. Status (upcoming / due soon /
-- overdue / paid) is derived from due_date and paid_on, so it never goes stale.

create table if not exists public.purchases (
    id               integer generated always as identity primary key,
    item_name        varchar(200)  not null,
    provider         varchar(100)  not null,
    total_amount     numeric(12,2) not null check (total_amount > 0),
    num_installments integer       not null check (num_installments between 1 and 60),
    first_due_date   date          not null,
    notes            text,
    created_at       timestamptz   not null default now()
);

create table if not exists public.installments (
    id          integer generated always as identity primary key,
    purchase_id integer       not null references public.purchases(id) on delete cascade,
    number      integer       not null check (number >= 1),
    due_date    date          not null,
    amount      numeric(12,2) not null check (amount > 0),
    paid_on     date,
    unique (purchase_id, number)
);

create index if not exists idx_installments_due_date on public.installments (due_date);
create index if not exists idx_installments_unpaid   on public.installments (due_date) where paid_on is null;

-- Row Level Security.
-- Supabase exposes every table in the public schema through its Data API, using the
-- public anon key. This app never uses that API: the Python backend connects straight
-- to Postgres, and that role bypasses RLS. Enabling RLS with no policies therefore locks
-- the Data API out of these tables while the backend keeps working.
-- If you later add Supabase Auth and call the tables from the browser, add policies here.
alter table public.purchases    enable row level security;
alter table public.installments enable row level security;
