-- Remove broad authenticated access to lead records.
-- Leads should be processed by trusted backend/service-role workflows only.
drop policy if exists "leads_auth_select" on public.leads;

-- Enforce owner consistency between related tables at DB level.
create or replace function public.enforce_project_client_owner_match()
returns trigger
language plpgsql
as $$
declare
  client_owner uuid;
begin
  select owner_id into client_owner
  from public.clients
  where id = new.client_id;

  if client_owner is null then
    raise exception 'Invalid client reference for project';
  end if;

  if client_owner <> new.owner_id then
    raise exception 'Project owner must match client owner';
  end if;

  return new;
end;
$$;

drop trigger if exists projects_owner_integrity on public.projects;
create trigger projects_owner_integrity
before insert or update of client_id, owner_id on public.projects
for each row execute function public.enforce_project_client_owner_match();

create or replace function public.enforce_domain_project_owner_match()
returns trigger
language plpgsql
as $$
declare
  project_owner uuid;
begin
  select owner_id into project_owner
  from public.projects
  where id = new.project_id;

  if project_owner is null then
    raise exception 'Invalid project reference for domain';
  end if;

  if project_owner <> new.owner_id then
    raise exception 'Domain owner must match project owner';
  end if;

  return new;
end;
$$;

drop trigger if exists domains_owner_integrity on public.domains;
create trigger domains_owner_integrity
before insert or update of project_id, owner_id on public.domains
for each row execute function public.enforce_domain_project_owner_match();

create or replace function public.enforce_invoice_client_owner_match()
returns trigger
language plpgsql
as $$
declare
  client_owner uuid;
begin
  select owner_id into client_owner
  from public.clients
  where id = new.client_id;

  if client_owner is null then
    raise exception 'Invalid client reference for invoice';
  end if;

  if client_owner <> new.owner_id then
    raise exception 'Invoice owner must match client owner';
  end if;

  return new;
end;
$$;

drop trigger if exists invoices_owner_integrity on public.invoices;
create trigger invoices_owner_integrity
before insert or update of client_id, owner_id on public.invoices
for each row execute function public.enforce_invoice_client_owner_match();

create or replace function public.enforce_deployment_project_owner_match()
returns trigger
language plpgsql
as $$
declare
  project_owner uuid;
begin
  select owner_id into project_owner
  from public.projects
  where id = new.project_id;

  if project_owner is null then
    raise exception 'Invalid project reference for deployment';
  end if;

  if project_owner <> new.owner_id then
    raise exception 'Deployment owner must match project owner';
  end if;

  return new;
end;
$$;

drop trigger if exists deployments_owner_integrity on public.deployments;
create trigger deployments_owner_integrity
before insert or update of project_id, owner_id on public.deployments
for each row execute function public.enforce_deployment_project_owner_match();
