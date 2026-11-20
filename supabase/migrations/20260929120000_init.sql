-- Aisle retail operations schema.
-- Run once in the Supabase SQL editor for an empty project.
-- Stock, sales, receipts, and transfers change only through the functions below.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.memberships (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'buyer', 'store_manager')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  code text not null,
  name text not null,
  city text not null,
  region text not null,
  format text not null check (format in ('hypermarket', 'supermarket', 'convenience')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (org_id, code)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  email text,
  lead_time_days integer not null default 5 check (lead_time_days >= 0),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  name text not null,
  brand text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

create table public.skus (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  supplier_id uuid references public.suppliers (id),
  sku text not null,
  barcode text,
  name text not null,
  cost numeric(12,2) not null default 0 check (cost >= 0),
  price numeric(12,2) not null default 0 check (price >= 0),
  reorder_point integer not null default 8 check (reorder_point >= 0),
  reorder_qty integer not null default 12 check (reorder_qty >= 0),
  created_at timestamptz not null default now(),
  unique (org_id, sku)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.inventory_levels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  sku_id uuid not null references public.skus (id),
  on_hand integer not null default 0 check (on_hand >= 0),
  unique (store_id, sku_id)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  store_id uuid not null references public.stores (id),
  sku_id uuid not null references public.skus (id),
  qty integer not null check (qty <> 0),
  movement_type text not null check (movement_type in ('opening', 'receipt', 'sale', 'adjustment', 'void', 'transfer')),
  reference text not null,
  created_at timestamptz not null default now()
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  supplier_id uuid not null references public.suppliers (id),
  store_id uuid not null references public.stores (id),
  number text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'received', 'cancelled')),
  expected_at date,
  created_at timestamptz not null default now(),
  unique (org_id, number)
);

create table public.purchase_order_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders (id) on delete cascade,
  sku_id uuid not null references public.skus (id),
  qty integer not null check (qty > 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0),
  qty_received integer not null default 0 check (qty_received >= 0)
);

create table public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  store_id uuid not null references public.stores (id),
  customer_id uuid references public.customers (id),
  number text not null,
  channel text not null check (channel in ('store', 'web', 'marketplace')),
  status text not null check (status in ('fulfilled', 'void')),
  total numeric(12,2) not null default 0,
  placed_at timestamptz not null default now(),
  unique (org_id, number)
);

create table public.sales_order_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  order_id uuid not null references public.sales_orders (id) on delete cascade,
  sku_id uuid not null references public.skus (id),
  qty integer not null check (qty > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0)
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  status text not null check (status in ('open', 'closed')),
  opening_float numeric(12,2) not null default 0,
  closing_cash numeric(12,2),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations (id) on delete cascade,
  system text not null,
  name text not null,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected')),
  endpoint text,
  created_at timestamptz not null default now()
);

create index memberships_user_idx on public.memberships (user_id);
create index movements_org_created_idx on public.inventory_movements (org_id, created_at desc);
create index sales_org_placed_idx on public.sales_orders (org_id, placed_at desc);
create index levels_org_idx on public.inventory_levels (org_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'operator'), '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.memberships where user_id = auth.uid()
$$;

create or replace function public.create_organization(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in before creating a network';
  end if;
  if char_length(trim(p_name)) < 2 then
    raise exception 'Give the retailer a name';
  end if;
  insert into public.organizations (name) values (trim(p_name)) returning id into new_id;
  insert into public.memberships (org_id, user_id, role) values (new_id, auth.uid(), 'owner');
  return new_id;
end;
$$;

create or replace function public.protect_po_receipt()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(current_setting('aisle.allow_receipt', true), '') = 'on' then
    return new;
  end if;

  if tg_table_name = 'purchase_orders' then
    if new.status = 'received' and (tg_op = 'INSERT' or old.status is distinct from 'received') then
      raise exception 'Receive goods from Purchasing so stock is updated';
    end if;
  end if;

  if tg_table_name = 'purchase_order_lines' then
    if tg_op = 'INSERT' and coalesce(new.qty_received, 0) <> 0 then
      raise exception 'Received quantity is posted when the order is received';
    end if;
    if tg_op = 'UPDATE' and new.qty_received is distinct from old.qty_received then
      raise exception 'Received quantity is posted when the order is received';
    end if;
  end if;

  return new;
end;
$$;

create trigger purchase_orders_protect
  before insert or update on public.purchase_orders
  for each row execute function public.protect_po_receipt();

create trigger purchase_order_lines_protect
  before insert or update on public.purchase_order_lines
  for each row execute function public.protect_po_receipt();

create or replace function public.create_sale(
  p_org_id uuid,
  p_store_id uuid,
  p_customer_id uuid,
  p_channel text,
  p_lines jsonb,
  p_placed_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order uuid;
  v_total numeric(12,2) := 0;
  v_number text;
  v_seq integer;
  v_store_name text;
  rec record;
  v_on integer;
  v_price numeric(12,2);
  v_sku_name text;
  v_qty integer;
begin
  if auth.uid() is null or not exists (
    select 1 from public.memberships where org_id = p_org_id and user_id = auth.uid()
  ) then
    raise exception 'Forbidden';
  end if;

  if p_channel not in ('store', 'web', 'marketplace') then
    raise exception 'Unknown channel';
  end if;

  select name into v_store_name from public.stores where id = p_store_id and org_id = p_org_id;
  if v_store_name is null then
    raise exception 'Unknown store';
  end if;

  if p_customer_id is not null and not exists (
    select 1 from public.customers where id = p_customer_id and org_id = p_org_id
  ) then
    raise exception 'Unknown customer';
  end if;

  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Add at least one line';
  end if;

  select coalesce(max((regexp_replace(number, '\D', '', 'g'))::integer), 1000) + 1
    into v_seq
  from public.sales_orders
  where org_id = p_org_id;

  v_number := 'SO-' || v_seq::text;

  insert into public.sales_orders (org_id, store_id, customer_id, number, channel, status, total, placed_at)
  values (p_org_id, p_store_id, p_customer_id, v_number, p_channel, 'fulfilled', 0, coalesce(p_placed_at, now()))
  returning id into v_order;

  for rec in
    select value
    from jsonb_array_elements(p_lines) as lines(value)
    order by (value->>'sku_id')
  loop
    v_qty := (rec.value->>'qty')::integer;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Quantity must be positive';
    end if;

    select name, price into v_sku_name, v_price
    from public.skus
    where id = (rec.value->>'sku_id')::uuid and org_id = p_org_id;

    if v_sku_name is null then
      raise exception 'Unknown product';
    end if;

    select on_hand into v_on
    from public.inventory_levels
    where store_id = p_store_id and sku_id = (rec.value->>'sku_id')::uuid
    for update;

    if v_on is null or v_on < v_qty then
      raise exception 'Not enough % at % (on hand %, ordered %)', v_sku_name, v_store_name, coalesce(v_on, 0), v_qty;
    end if;

    update public.inventory_levels
      set on_hand = on_hand - v_qty
      where store_id = p_store_id and sku_id = (rec.value->>'sku_id')::uuid;

    insert into public.sales_order_lines (org_id, order_id, sku_id, qty, unit_price)
    values (p_org_id, v_order, (rec.value->>'sku_id')::uuid, v_qty, v_price);

    insert into public.inventory_movements (org_id, store_id, sku_id, qty, movement_type, reference, created_at)
    values (p_org_id, p_store_id, (rec.value->>'sku_id')::uuid, -v_qty, 'sale', v_number, coalesce(p_placed_at, now()));

    v_total := v_total + (v_price * v_qty);
  end loop;

  update public.sales_orders set total = v_total where id = v_order;
  return v_order;
end;
$$;

create or replace function public.void_sale(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.sales_orders%rowtype;
  rec record;
begin
  if auth.uid() is null then
    raise exception 'Forbidden';
  end if;

  select * into v_order from public.sales_orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'Unknown order';
  end if;
  if not exists (
    select 1 from public.memberships where org_id = v_order.org_id and user_id = auth.uid()
  ) then
    raise exception 'Forbidden';
  end if;
  if v_order.status <> 'fulfilled' then
    raise exception 'Only a fulfilled order can be voided';
  end if;

  for rec in
    select * from public.sales_order_lines where order_id = v_order.id order by sku_id
  loop
    insert into public.inventory_levels (org_id, store_id, sku_id, on_hand)
    values (v_order.org_id, v_order.store_id, rec.sku_id, rec.qty)
    on conflict (store_id, sku_id) do update
      set on_hand = public.inventory_levels.on_hand + excluded.on_hand;

    insert into public.inventory_movements (org_id, store_id, sku_id, qty, movement_type, reference)
    values (v_order.org_id, v_order.store_id, rec.sku_id, rec.qty, 'void', v_order.number);
  end loop;

  update public.sales_orders set status = 'void' where id = v_order.id;
end;
$$;

create or replace function public.receive_purchase_order(p_po_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_po public.purchase_orders%rowtype;
  rec record;
  v_remaining integer;
begin
  if auth.uid() is null then
    raise exception 'Forbidden';
  end if;

  select * into v_po from public.purchase_orders where id = p_po_id for update;
  if v_po.id is null then
    raise exception 'Unknown purchase order';
  end if;
  if not exists (
    select 1 from public.memberships where org_id = v_po.org_id and user_id = auth.uid()
  ) then
    raise exception 'Forbidden';
  end if;
  if v_po.status <> 'sent' then
    raise exception 'Only a sent purchase order can be received';
  end if;

  perform set_config('aisle.allow_receipt', 'on', true);

  for rec in
    select * from public.purchase_order_lines where purchase_order_id = v_po.id order by sku_id
  loop
    v_remaining := rec.qty - rec.qty_received;
    if v_remaining > 0 then
      insert into public.inventory_levels (org_id, store_id, sku_id, on_hand)
      values (v_po.org_id, v_po.store_id, rec.sku_id, v_remaining)
      on conflict (store_id, sku_id) do update
        set on_hand = public.inventory_levels.on_hand + excluded.on_hand;

      insert into public.inventory_movements (org_id, store_id, sku_id, qty, movement_type, reference)
      values (v_po.org_id, v_po.store_id, rec.sku_id, v_remaining, 'receipt', v_po.number);

      update public.purchase_order_lines
        set qty_received = qty
        where id = rec.id;
    end if;
  end loop;

  update public.purchase_orders set status = 'received' where id = v_po.id;
  perform set_config('aisle.allow_receipt', 'off', true);
end;
$$;

create or replace function public.transfer_stock(
  p_org_id uuid,
  p_sku_id uuid,
  p_from_store uuid,
  p_to_store uuid,
  p_qty integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_on integer;
  v_name text;
  v_ref text;
  v_first uuid;
  v_second uuid;
begin
  if auth.uid() is null or not exists (
    select 1 from public.memberships where org_id = p_org_id and user_id = auth.uid()
  ) then
    raise exception 'Forbidden';
  end if;
  if p_from_store = p_to_store then
    raise exception 'Choose two different stores';
  end if;
  if p_qty is null or p_qty <= 0 then
    raise exception 'Quantity must be positive';
  end if;
  if not exists (select 1 from public.stores where id = p_from_store and org_id = p_org_id)
     or not exists (select 1 from public.stores where id = p_to_store and org_id = p_org_id) then
    raise exception 'Unknown store';
  end if;

  select name into v_name from public.skus where id = p_sku_id and org_id = p_org_id;
  if v_name is null then
    raise exception 'Unknown product';
  end if;

  if p_from_store < p_to_store then
    v_first := p_from_store;
    v_second := p_to_store;
  else
    v_first := p_to_store;
    v_second := p_from_store;
  end if;

  perform 1 from public.inventory_levels where store_id = v_first and sku_id = p_sku_id for update;
  perform 1 from public.inventory_levels where store_id = v_second and sku_id = p_sku_id for update;

  select on_hand into v_on
  from public.inventory_levels
  where store_id = p_from_store and sku_id = p_sku_id;

  if v_on is null or v_on < p_qty then
    raise exception 'Not enough % to move (on hand %)', v_name, coalesce(v_on, 0);
  end if;

  update public.inventory_levels
    set on_hand = on_hand - p_qty
    where store_id = p_from_store and sku_id = p_sku_id;

  insert into public.inventory_levels (org_id, store_id, sku_id, on_hand)
  values (p_org_id, p_to_store, p_sku_id, p_qty)
  on conflict (store_id, sku_id) do update
    set on_hand = public.inventory_levels.on_hand + excluded.on_hand;

  v_ref := 'XFER-' || to_char(now(), 'MMDD-HH24MISS');

  insert into public.inventory_movements (org_id, store_id, sku_id, qty, movement_type, reference)
  values
    (p_org_id, p_from_store, p_sku_id, -p_qty, 'transfer', v_ref),
    (p_org_id, p_to_store, p_sku_id, p_qty, 'transfer', v_ref);
end;
$$;

create or replace function public.seed_harbor_and_rye(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  rec record;
  v_cat uuid;
  v_sup uuid;
  v_product uuid;
  v_store_id uuid;
  v_sku_id uuid;
  v_sku_b uuid;
  v_customer_id uuid;
  v_channel text;
  v_qty integer;
  v_when timestamptz;
  v_po uuid;
  v_n integer := 0;
  v_catalog jsonb := $json$[
    {"cat":"Dairy","name":"Harbor Whole Milk 1L","brand":"Harbor","sku":"HRB-MILK-1L","cost":1.10,"price":2.40,"supplier":"Valley Creamery"},
    {"cat":"Dairy","name":"Saltmarsh Butter 250g","brand":"Saltmarsh","sku":"HRB-BTR-250","cost":2.20,"price":4.50,"supplier":"Valley Creamery"},
    {"cat":"Dairy","name":"Keen White Cheddar 400g","brand":"Keen","sku":"HRB-CHD-400","cost":3.40,"price":6.80,"supplier":"Valley Creamery"},
    {"cat":"Dairy","name":"Rye Free-Range Eggs 12","brand":"Rye","sku":"HRB-EGG-12","cost":2.80,"price":5.40,"supplier":"Valley Creamery"},
    {"cat":"Bakery","name":"Harbor Sourdough Loaf","brand":"Harbor","sku":"HRB-BRD-SRD","cost":1.40,"price":3.80,"supplier":"Hearth Bake Co"},
    {"cat":"Bakery","name":"Morning Rolls 4pk","brand":"Hearth","sku":"HRB-ROL-4","cost":1.10,"price":2.90,"supplier":"Hearth Bake Co"},
    {"cat":"Produce","name":"Orchard Apples 1kg","brand":"Orchard Direct","sku":"HRB-APL-1K","cost":1.60,"price":3.20,"supplier":"Orchard Direct"},
    {"cat":"Produce","name":"Market Bananas 1kg","brand":"Market","sku":"HRB-BAN-1K","cost":0.90,"price":1.80,"supplier":"Orchard Direct"},
    {"cat":"Produce","name":"Red Lane Tomatoes 500g","brand":"Red Lane","sku":"HRB-TOM-500","cost":1.30,"price":2.70,"supplier":"Orchard Direct"},
    {"cat":"Produce","name":"Greenrow Spinach 200g","brand":"Greenrow","sku":"HRB-SPN-200","cost":1.20,"price":2.90,"supplier":"Orchard Direct"},
    {"cat":"Beverages","name":"Glasshouse Orange Juice 1L","brand":"Glasshouse","sku":"HRB-OJ-1L","cost":1.50,"price":3.60,"supplier":"Valley Creamery"},
    {"cat":"Beverages","name":"Daybreak Coffee Beans 250g","brand":"Daybreak","sku":"HRB-COF-250","cost":4.20,"price":8.50,"supplier":"Pantry Wholesale"},
    {"cat":"Beverages","name":"Still Spring Water 6x1.5L","brand":"Still Spring","sku":"HRB-WAT-6","cost":1.80,"price":3.90,"supplier":"Pantry Wholesale"},
    {"cat":"Grocery","name":"Hearth Pasta 500g","brand":"Hearth","sku":"HRB-PST-500","cost":0.80,"price":1.90,"supplier":"Pantry Wholesale"},
    {"cat":"Grocery","name":"Pantry Basmati Rice 2kg","brand":"Pantry","sku":"HRB-RIC-2K","cost":2.40,"price":4.80,"supplier":"Pantry Wholesale"},
    {"cat":"Grocery","name":"Cold Mill Olive Oil 500ml","brand":"Cold Mill","sku":"HRB-OIL-500","cost":4.60,"price":9.40,"supplier":"Pantry Wholesale"},
    {"cat":"Household","name":"Bright Dish Soap 1L","brand":"Bright","sku":"HRB-SOP-1L","cost":1.30,"price":2.80,"supplier":"Pantry Wholesale"},
    {"cat":"Household","name":"Paper Lane Towels 2pk","brand":"Paper Lane","sku":"HRB-TWL-2","cost":1.70,"price":3.50,"supplier":"Pantry Wholesale"}
  ]$json$;
begin
  if auth.uid() is null or not exists (
    select 1 from public.memberships where org_id = p_org_id and user_id = auth.uid()
  ) then
    raise exception 'Forbidden';
  end if;
  if exists (select 1 from public.stores where org_id = p_org_id) then
    raise exception 'This network already has stores. Load the sample into an empty organization.';
  end if;

  insert into public.stores (org_id, code, name, city, region, format) values
    (p_org_id, 'HM-01', 'Harbor Market', 'Portland', 'Oregon', 'supermarket'),
    (p_org_id, 'RS-02', 'Rye Street', 'Portland', 'Oregon', 'convenience'),
    (p_org_id, 'DK-03', 'Dockside', 'Seattle', 'Washington', 'supermarket'),
    (p_org_id, 'MC-04', 'Mill Court', 'Seattle', 'Washington', 'convenience');

  insert into public.suppliers (org_id, name, email, lead_time_days) values
    (p_org_id, 'Valley Creamery', 'orders@valleycreamery.example', 2),
    (p_org_id, 'Hearth Bake Co', 'desk@hearthbake.example', 1),
    (p_org_id, 'Orchard Direct', 'buy@orcharddirect.example', 3),
    (p_org_id, 'Pantry Wholesale', 'trade@pantrywholesale.example', 5);

  insert into public.categories (org_id, name) values
    (p_org_id, 'Dairy'),
    (p_org_id, 'Bakery'),
    (p_org_id, 'Produce'),
    (p_org_id, 'Beverages'),
    (p_org_id, 'Grocery'),
    (p_org_id, 'Household');

  for rec in select value from jsonb_array_elements(v_catalog) as elems(value)
  loop
    v_n := v_n + 1;
    select id into v_cat from public.categories where org_id = p_org_id and name = rec.value->>'cat';
    select id into v_sup from public.suppliers where org_id = p_org_id and name = rec.value->>'supplier';
    if v_cat is null or v_sup is null then
      raise exception 'Sample catalog is missing a category or supplier';
    end if;

    insert into public.products (org_id, category_id, name, brand)
    values (p_org_id, v_cat, rec.value->>'name', rec.value->>'brand')
    returning id into v_product;

    insert into public.skus (
      org_id, product_id, supplier_id, sku, barcode, name, cost, price, reorder_point, reorder_qty
    ) values (
      p_org_id,
      v_product,
      v_sup,
      rec.value->>'sku',
      '200' || lpad(v_n::text, 8, '0'),
      rec.value->>'name',
      (rec.value->>'cost')::numeric,
      (rec.value->>'price')::numeric,
      12,
      24
    );
  end loop;

  insert into public.customers (org_id, name, email, phone) values
    (p_org_id, 'Mina Alvarez', 'mina.alvarez@example.com', '503-555-0142'),
    (p_org_id, 'Jonah Peck', 'jonah.peck@example.com', '503-555-0177'),
    (p_org_id, 'Priya Shah', 'priya.shah@example.com', '206-555-0118'),
    (p_org_id, 'Ellen Voss', 'ellen.voss@example.com', '206-555-0190'),
    (p_org_id, 'Chris Adeyemi', 'chris.adeyemi@example.com', '503-555-0164'),
    (p_org_id, 'Noah Berg', 'noah.berg@example.com', '206-555-0133');

  insert into public.integrations (org_id, system, name, status, endpoint) values
    (p_org_id, 'POS', 'Store registers', 'connected', 'https://pos.harbor.example/v1'),
    (p_org_id, 'Ecommerce', 'Harbor web shop', 'connected', 'https://shop.harbor.example/orders'),
    (p_org_id, 'Marketplace', 'Northmarket channel', 'connected', 'https://market.north.example/seller'),
    (p_org_id, 'Accounting', 'Ledger export', 'disconnected', '');

  insert into public.inventory_levels (org_id, store_id, sku_id, on_hand)
  select p_org_id, s.id, k.id, 40
  from public.stores s
  cross join public.skus k
  where s.org_id = p_org_id and k.org_id = p_org_id;

  insert into public.inventory_movements (org_id, store_id, sku_id, qty, movement_type, reference, created_at)
  select p_org_id, s.id, k.id, 40, 'opening', 'OPENING', now() - interval '30 days'
  from public.stores s
  cross join public.skus k
  where s.org_id = p_org_id and k.org_id = p_org_id;

  insert into public.purchase_orders (org_id, supplier_id, store_id, number, status, expected_at, created_at)
  select p_org_id, sup.id, st.id, 'PO-1001', 'sent', current_date - 6, now() - interval '8 days'
  from public.suppliers sup, public.stores st
  where sup.org_id = p_org_id and sup.name = 'Valley Creamery'
    and st.org_id = p_org_id and st.code = 'HM-01'
  returning id into v_po;

  insert into public.purchase_order_lines (org_id, purchase_order_id, sku_id, qty, unit_cost)
  select p_org_id, v_po, k.id, 24, k.cost
  from public.skus k
  where k.org_id = p_org_id and k.sku in ('HRB-MILK-1L', 'HRB-BTR-250', 'HRB-EGG-12');

  perform public.receive_purchase_order(v_po);

  insert into public.purchase_orders (org_id, supplier_id, store_id, number, status, expected_at)
  select p_org_id, sup.id, st.id, 'PO-1002', 'sent', current_date + 4
  from public.suppliers sup, public.stores st
  where sup.org_id = p_org_id and sup.name = 'Pantry Wholesale'
    and st.org_id = p_org_id and st.code = 'HM-01'
  returning id into v_po;

  insert into public.purchase_order_lines (org_id, purchase_order_id, sku_id, qty, unit_cost)
  select p_org_id, v_po, k.id, 36, k.cost
  from public.skus k
  where k.org_id = p_org_id and k.sku in ('HRB-PST-500', 'HRB-SOP-1L', 'HRB-TWL-2', 'HRB-WAT-6');

  insert into public.purchase_orders (org_id, supplier_id, store_id, number, status, expected_at)
  select p_org_id, sup.id, st.id, 'PO-1003', 'draft', current_date + 2
  from public.suppliers sup, public.stores st
  where sup.org_id = p_org_id and sup.name = 'Orchard Direct'
    and st.org_id = p_org_id and st.code = 'DK-03'
  returning id into v_po;

  insert into public.purchase_order_lines (org_id, purchase_order_id, sku_id, qty, unit_cost)
  select p_org_id, v_po, k.id, 30, k.cost
  from public.skus k
  where k.org_id = p_org_id and k.sku in ('HRB-APL-1K', 'HRB-BAN-1K', 'HRB-SPN-200');

  for v_n in 1..56 loop
    select id into v_store_id from public.stores where org_id = p_org_id order by random() limit 1;
    select id into v_sku_id from public.skus where org_id = p_org_id order by random() limit 1;
    if random() < 0.75 then
      select id into v_customer_id from public.customers where org_id = p_org_id order by random() limit 1;
    else
      v_customer_id := null;
    end if;
    v_qty := 1 + floor(random() * 3)::integer;
    v_when := now() - make_interval(days => floor(random() * 27)::integer, hours => floor(random() * 18)::integer);
    v_channel := case floor(random() * 5)::integer
      when 0 then 'store'
      when 1 then 'store'
      when 2 then 'store'
      when 3 then 'web'
      else 'marketplace'
    end;

    begin
      perform public.create_sale(
        p_org_id,
        v_store_id,
        v_customer_id,
        v_channel,
        jsonb_build_array(jsonb_build_object('sku_id', v_sku_id, 'qty', v_qty)),
        v_when
      );
    exception
      when others then
        if sqlerrm not like 'Not enough%' then
          raise;
        end if;
    end;
  end loop;

  for v_n in 1..12 loop
    select id into v_store_id from public.stores where org_id = p_org_id order by random() limit 1;
    select id into v_sku_id from public.skus where org_id = p_org_id order by random() limit 1;
    select id into v_sku_b from public.skus where org_id = p_org_id and id <> v_sku_id order by random() limit 1;
    select id into v_customer_id from public.customers where org_id = p_org_id order by random() limit 1;
    v_when := now() - make_interval(days => floor(random() * 20)::integer, hours => floor(random() * 10)::integer);
    v_channel := case floor(random() * 3)::integer
      when 0 then 'store'
      when 1 then 'web'
      else 'marketplace'
    end;

    begin
      perform public.create_sale(
        p_org_id,
        v_store_id,
        v_customer_id,
        v_channel,
        jsonb_build_array(
          jsonb_build_object('sku_id', v_sku_id, 'qty', 1),
          jsonb_build_object('sku_id', v_sku_b, 'qty', 2)
        ),
        v_when
      );
    exception
      when others then
        if sqlerrm not like 'Not enough%' then
          raise;
        end if;
    end;
  end loop;

  for rec in
    select il.id, il.on_hand, il.store_id, il.sku_id, il.org_id
    from public.inventory_levels il
    join public.skus k on k.id = il.sku_id
    join public.stores s on s.id = il.store_id
    where il.org_id = p_org_id
      and (
        (k.sku in ('HRB-MILK-1L', 'HRB-EGG-12', 'HRB-OJ-1L') and s.code in ('RS-02', 'MC-04'))
        or k.sku in ('HRB-OIL-500', 'HRB-RIC-2K')
      )
      and il.on_hand > 4
  loop
    insert into public.inventory_movements (org_id, store_id, sku_id, qty, movement_type, reference)
    values (rec.org_id, rec.store_id, rec.sku_id, 4 - rec.on_hand, 'adjustment', 'COUNT');
    update public.inventory_levels set on_hand = 4 where id = rec.id;
  end loop;

  insert into public.shifts (org_id, store_id, status, opening_float, opened_at)
  select p_org_id, id, 'open', 250, now() - interval '2 hours'
  from public.stores
  where org_id = p_org_id and code = 'HM-01';
end;
$fn$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.stores enable row level security;
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.skus enable row level security;
alter table public.customers enable row level security;
alter table public.inventory_levels enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_lines enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_lines enable row level security;
alter table public.shifts enable row level security;
alter table public.integrations enable row level security;

create policy "members read organizations" on public.organizations
  for select using (id in (select public.user_org_ids()));

create policy "read own profile" on public.profiles
  for select using (id = auth.uid());
create policy "update own profile" on public.profiles
  for update using (id = auth.uid());

create policy "read own membership" on public.memberships
  for select using (user_id = auth.uid());

create policy "members manage stores" on public.stores
  for all using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));
create policy "members manage categories" on public.categories
  for all using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));
create policy "members manage suppliers" on public.suppliers
  for all using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));
create policy "members manage products" on public.products
  for all using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));
create policy "members manage skus" on public.skus
  for all using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));
create policy "members manage customers" on public.customers
  for all using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));
create policy "members manage shifts" on public.shifts
  for all using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));
create policy "members manage integrations" on public.integrations
  for all using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));
create policy "members manage purchase orders" on public.purchase_orders
  for all using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));
create policy "members manage purchase lines" on public.purchase_order_lines
  for all using (org_id in (select public.user_org_ids()))
  with check (org_id in (select public.user_org_ids()));

create policy "members read stock" on public.inventory_levels
  for select using (org_id in (select public.user_org_ids()));
create policy "members read movements" on public.inventory_movements
  for select using (org_id in (select public.user_org_ids()));
create policy "members read sales" on public.sales_orders
  for select using (org_id in (select public.user_org_ids()));
create policy "members read sale lines" on public.sales_order_lines
  for select using (org_id in (select public.user_org_ids()));

revoke all on function public.handle_new_user() from public;
revoke all on function public.user_org_ids() from public;
revoke all on function public.create_organization(text) from public;
revoke all on function public.create_sale(uuid, uuid, uuid, text, jsonb, timestamptz) from public;
revoke all on function public.void_sale(uuid) from public;
revoke all on function public.receive_purchase_order(uuid) from public;
revoke all on function public.transfer_stock(uuid, uuid, uuid, uuid, integer) from public;
revoke all on function public.seed_harbor_and_rye(uuid) from public;
revoke all on function public.protect_po_receipt() from public;

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.organizations,
  public.profiles,
  public.memberships,
  public.stores,
  public.categories,
  public.suppliers,
  public.products,
  public.skus,
  public.customers,
  public.purchase_orders,
  public.purchase_order_lines,
  public.shifts,
  public.integrations
to authenticated;
grant select on
  public.inventory_levels,
  public.inventory_movements,
  public.sales_orders,
  public.sales_order_lines
to authenticated;

grant execute on function public.user_org_ids() to authenticated;
grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.create_sale(uuid, uuid, uuid, text, jsonb, timestamptz) to authenticated;
grant execute on function public.void_sale(uuid) to authenticated;
grant execute on function public.receive_purchase_order(uuid) to authenticated;
grant execute on function public.transfer_stock(uuid, uuid, uuid, uuid, integer) to authenticated;
grant execute on function public.seed_harbor_and_rye(uuid) to authenticated;
