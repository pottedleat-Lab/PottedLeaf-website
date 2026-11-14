-- thePottedLeaf — Supabase schema
-- Run this whole file once in Supabase Dashboard → SQL Editor.

-- ─────────────────────────────────────────────
-- Profiles (one per auth user)
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- Emails listed here are made admin automatically when they sign up
create table if not exists public.admin_emails (
  email text primary key
);
alter table public.admin_emails enable row level security; -- no policies: not readable from the browser
insert into public.admin_emails (email) values ('thepottedleafs@gmail.com')
on conflict (email) do nothing;

-- Auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    case when exists (select 1 from public.admin_emails where lower(email) = lower(new.email))
         then 'admin' else 'customer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- If an admin email already has an account, upgrade it now
insert into public.profiles (id, full_name, role)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), 'admin'
from auth.users u
join public.admin_emails a on lower(a.email) = lower(u.email)
on conflict (id) do update set role = 'admin';

-- ─────────────────────────────────────────────
-- Products
-- ─────────────────────────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in (
    'tools', 'fruit-plants', 'vegetable-plants', 'flower-plants',
    'showcase-plants', 'office-plants', 'pots', 'seeds'
  )),
  price numeric(10,2) not null check (price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  bio text not null default '',
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category);

-- ─────────────────────────────────────────────
-- Orders
-- ─────────────────────────────────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  items jsonb not null,               -- [{product_id, name, price, quantity, image_url}]
  amount numeric(10,2) not null,      -- rupees
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipped', 'delivered', 'failed')),
  payment_method text,                -- 'upi_qr' | 'credit_card' | 'debit_card'
  razorpay_order_id text unique,
  razorpay_payment_id text,
  shipping_address jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id);

-- ─────────────────────────────────────────────
-- Feedback, gallery, vlogs
-- ─────────────────────────────────────────────
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  rating integer not null check (rating between 1 and 5),
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.vlogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  video_url text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- Atomic stock decrement + mark order paid.
-- Called by the backend after Razorpay signature is verified.
-- Fails (and changes nothing) if any item is out of stock.
-- ─────────────────────────────────────────────
create or replace function public.fulfil_order(p_order_id uuid, p_payment_id text)
returns void language plpgsql security definer set search_path = public as $$
declare
  item jsonb;
  updated int;
begin
  -- idempotent: do nothing if already paid
  if exists (select 1 from orders where id = p_order_id and status <> 'pending') then
    return;
  end if;

  for item in select * from jsonb_array_elements((select items from orders where id = p_order_id))
  loop
    update products
       set quantity = quantity - (item->>'quantity')::int
     where id = (item->>'product_id')::uuid
       and quantity >= (item->>'quantity')::int;
    get diagnostics updated = row_count;
    if updated = 0 then
      raise exception 'Insufficient stock for %', item->>'name';
    end if;
  end loop;

  update orders
     set status = 'paid', razorpay_payment_id = p_payment_id
   where id = p_order_id;
end;
$$;

revoke all on function public.fulfil_order(uuid, text) from public, anon, authenticated;

-- ─────────────────────────────────────────────
-- Row Level Security
-- The backend uses the service-role key (bypasses RLS).
-- These policies protect the tables if the anon key is ever used directly.
-- ─────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.feedback       enable row level security;
alter table public.gallery_images enable row level security;
alter table public.vlogs          enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "public products" on public.products;
create policy "public products" on public.products for select using (is_active);

drop policy if exists "own orders" on public.orders;
create policy "own orders" on public.orders for select using (auth.uid() = user_id);

drop policy if exists "public feedback" on public.feedback;
create policy "public feedback" on public.feedback for select using (true);

drop policy if exists "public gallery" on public.gallery_images;
create policy "public gallery" on public.gallery_images for select using (true);

drop policy if exists "public vlogs" on public.vlogs;
create policy "public vlogs" on public.vlogs for select using (true);

-- ─────────────────────────────────────────────
-- Storage buckets (public read; writes only via backend service role)
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true), ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────
-- Sample products (optional — delete if not wanted)
-- ─────────────────────────────────────────────
insert into public.products (name, category, price, quantity, bio) values
  ('Snake Plant (Sansevieria)', 'office-plants', 349, 25, 'Nearly unkillable air purifier. Thrives in low light and needs water only every 2–3 weeks.'),
  ('ZZ Plant', 'office-plants', 499, 18, 'Glossy, upright leaves that tolerate neglect and fluorescent office light.'),
  ('Fiddle Leaf Fig', 'showcase-plants', 1299, 6, 'A statement plant with large violin-shaped leaves. Bright indirect light.'),
  ('Monstera Deliciosa', 'showcase-plants', 899, 10, 'Iconic split leaves. Fast-growing and easy-going.'),
  ('Dwarf Lemon Tree', 'fruit-plants', 749, 12, 'Grafted lemon that fruits in a pot. Needs 6 hours of sun.'),
  ('Guava (Allahabad Safeda)', 'fruit-plants', 399, 15, 'Hardy grafted guava, fruits within 1–2 years.'),
  ('Cherry Tomato Seedling', 'vegetable-plants', 79, 60, 'Prolific sweet tomatoes for a sunny balcony.'),
  ('Green Chilli Plant', 'vegetable-plants', 69, 50, 'Spicy, productive and perfect for containers.'),
  ('Hibiscus (Red)', 'flower-plants', 249, 20, 'Big red blooms almost all year in full sun.'),
  ('Rose (Desi Gulab)', 'flower-plants', 199, 30, 'Fragrant Indian rose, great for pots and beds.'),
  ('Terracotta Pot — 8 inch', 'pots', 299, 40, 'Hand-thrown breathable clay pot with drainage hole.'),
  ('Ceramic Planter — Matte White', 'pots', 549, 22, 'Minimal glazed planter for indoor plants. Includes saucer.'),
  ('Pruning Shears', 'tools', 399, 35, 'Sharp bypass pruner with a soft-grip handle.'),
  ('Watering Can — 1.5 L', 'tools', 349, 28, 'Long-spout can for precise indoor watering.'),
  ('Marigold Seeds (50 seeds)', 'seeds', 49, 100, 'Easy, cheerful orange marigolds. Germinates in 5–7 days.'),
  ('Basil Seeds', 'seeds', 59, 80, 'Sweet basil for your kitchen garden.');
