alter table public.invoices
  add column if not exists stripe_checkout_session_id text unique;

alter table public.invoices
  add column if not exists stripe_subscription_id text;

alter table public.invoices
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_invoices_checkout_session
  on public.invoices(stripe_checkout_session_id);
