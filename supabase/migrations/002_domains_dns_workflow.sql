alter table public.domains
  add column if not exists verification_token text;

update public.domains
set verification_token = substring(replace(gen_random_uuid()::text, '-', '') from 1 for 16)
where verification_token is null;

alter table public.domains
  alter column verification_token set not null;

alter table public.domains
  alter column verification_token set default substring(replace(gen_random_uuid()::text, '-', '') from 1 for 16);

alter table public.domains
  add column if not exists dns_check_passed boolean not null default false;

alter table public.domains
  add column if not exists last_dns_check_at timestamptz;

alter table public.domains
  add column if not exists dns_check_details jsonb not null default '{}'::jsonb;
