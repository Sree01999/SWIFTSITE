create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all"
  on public.profiles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  business_type text,
  status text not null default 'active' check (status in ('active', 'suspended', 'churned')),
  stripe_customer_id text unique,
  billing_status text not null default 'current' check (billing_status in ('current', 'past_due', 'canceled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_owner_id on public.clients(owner_id);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

drop policy if exists "clients_owner_all" on public.clients;
create policy "clients_owner_all"
  on public.clients
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  tech_stack text default 'nextjs',
  repo_url text,
  vercel_project_id text,
  deploy_hook_url text,
  last_deploy_url text,
  last_deploy_status text not null default 'pending',
  status text not null default 'planning' check (status in ('planning', 'building', 'deployed', 'suspended', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_client_id on public.projects(client_id);
create index if not exists idx_projects_owner_id on public.projects(owner_id);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

drop policy if exists "projects_owner_all" on public.projects;
create policy "projects_owner_all"
  on public.projects
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  domain text not null unique,
  status text not null default 'pending' check (status in ('pending', 'verified', 'failed')),
  ssl_status text not null default 'pending',
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_domains_project_id on public.domains(project_id);

alter table public.domains enable row level security;

drop policy if exists "domains_owner_all" on public.domains;
create policy "domains_owner_all"
  on public.domains
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  stripe_invoice_id text unique,
  stripe_payment_intent_id text,
  type text check (type in ('build_fee', 'maintenance', 'change_request', 'addon')),
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'draft' check (status in ('draft', 'open', 'paid', 'void', 'uncollectable')),
  description text,
  period_start date,
  period_end date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_invoices_client_id on public.invoices(client_id);
create index if not exists idx_invoices_status on public.invoices(status);

alter table public.invoices enable row level security;

drop policy if exists "invoices_owner_all" on public.invoices;
create policy "invoices_owner_all"
  on public.invoices
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create table if not exists public.deployments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  vercel_deployment_id text,
  status text,
  deploy_url text,
  commit_sha text,
  triggered_by text not null default 'manual',
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.deployments enable row level security;

drop policy if exists "deployments_owner_all" on public.deployments;
create policy "deployments_owner_all"
  on public.deployments
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create table if not exists public.processed_events (
  id uuid primary key default gen_random_uuid(),
  event_source text not null,
  event_id text not null,
  processed_at timestamptz not null default now(),
  unique(event_source, event_id)
);

alter table public.processed_events enable row level security;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  message text,
  source text,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

drop policy if exists "leads_anon_insert" on public.leads;
create policy "leads_anon_insert"
  on public.leads
  for insert
  to anon
  with check (true);

drop policy if exists "leads_auth_select" on public.leads;
create policy "leads_auth_select"
  on public.leads
  for select
  to authenticated
  using (true);
