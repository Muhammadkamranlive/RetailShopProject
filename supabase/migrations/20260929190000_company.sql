-- Company profile for any retailer, and store formats beyond grocery.

alter table public.organizations
  add column if not exists currency text not null default 'USD',
  add column if not exists country text not null default '';

alter table public.organizations drop constraint if exists organizations_currency_check;
alter table public.organizations
  add constraint organizations_currency_check check (currency ~ '^[A-Z]{3}$');

alter table public.stores drop constraint if exists stores_format_check;
alter table public.stores
  add constraint stores_format_check check (
    format in ('store', 'supermarket', 'hypermarket', 'convenience', 'department', 'warehouse', 'outlet')
  );

drop function if exists public.create_organization(text);

create or replace function public.create_organization(
  p_name text,
  p_currency text default 'USD',
  p_country text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  v_currency text := upper(trim(coalesce(p_currency, 'USD')));
begin
  if auth.uid() is null then
    raise exception 'Sign in before creating a company';
  end if;
  if char_length(trim(p_name)) < 2 then
    raise exception 'Give the company a name';
  end if;
  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'Currency must be a 3-letter code';
  end if;
  insert into public.organizations (name, currency, country)
  values (trim(p_name), v_currency, trim(coalesce(p_country, '')))
  returning id into new_id;
  insert into public.memberships (org_id, user_id, role)
  values (new_id, auth.uid(), 'owner');
  return new_id;
end;
$$;

create or replace function public.update_organization(
  p_org_id uuid,
  p_name text,
  p_currency text,
  p_country text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_currency text := upper(trim(coalesce(p_currency, 'USD')));
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  if not exists (
    select 1 from public.memberships
    where org_id = p_org_id and user_id = auth.uid() and role = 'owner'
  ) then
    raise exception 'Only an owner can change the company';
  end if;
  if char_length(trim(p_name)) < 2 then
    raise exception 'Give the company a name';
  end if;
  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'Currency must be a 3-letter code';
  end if;
  update public.organizations
  set name = trim(p_name),
      currency = v_currency,
      country = trim(coalesce(p_country, ''))
  where id = p_org_id;
end;
$$;

create or replace function public.list_company_members(p_org_id uuid)
returns table (email text, full_name text, role text, joined_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.memberships m
    where m.org_id = p_org_id and m.user_id = auth.uid()
  ) then
    raise exception 'Not a member of this company';
  end if;

  return query
  select p.email, p.full_name, m.role, m.created_at
  from public.memberships m
  left join public.profiles p on p.id = m.user_id
  where m.org_id = p_org_id
  order by m.created_at;
end;
$$;

revoke all on function public.create_organization(text, text, text) from public;
revoke all on function public.update_organization(uuid, text, text, text) from public;
revoke all on function public.list_company_members(uuid) from public;

grant execute on function public.create_organization(text, text, text) to authenticated;
grant execute on function public.update_organization(uuid, text, text, text) to authenticated;
grant execute on function public.list_company_members(uuid) to authenticated;
