-- Venta de entradas propia (Mercado Pago).
--
-- Correr en el SQL Editor de Supabase, o con `supabase db push` si tenés la CLI.
--
-- Contexto: Startup Grind sigue vendiendo por su lado. Acá vive SÓLO el cupo
-- reservado para la web, así que los dos stocks son independientes y no se
-- pisan.

-- ---------------------------------------------------------------------------
-- tiers — fuente de verdad del precio y del stock
-- ---------------------------------------------------------------------------
-- El precio vive acá y NO en src/content/tickets.json. El JSON pinta las cards
-- (incluidas las tandas agotadas, que son historia); el cobro siempre sale de
-- esta tabla. Si los dos números difieren, éste es el que manda.
create table if not exists public.tiers (
  id          text primary key,             -- 'general' | 'vip'
  nombre      text    not null,
  price_ars   integer not null check (price_ars > 0),  -- pesos enteros, sin centavos
  stock_total integer not null check (stock_total >= 0),
  activo      boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- orders — una fila por intento de compra
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  tier_id          text    not null references public.tiers (id),
  quantity         integer not null default 1 check (quantity between 1 and 5),

  -- Precio congelado al crear la orden: si mañana sube, esta compra ya cerrada
  -- tiene que seguir mostrando lo que la persona efectivamente pagó.
  unit_price_ars   integer not null check (unit_price_ars > 0),

  buyer_name       text not null,
  buyer_email      text not null,
  buyer_dni        text,

  status           text not null default 'pending'
                   check (status in ('pending', 'paid', 'rejected', 'expired', 'refunded')),

  -- Mientras esté 'pending' y no haya vencido, esta orden RESERVA su cupo.
  -- Sin la reserva, dos personas pagan la última entrada al mismo tiempo y
  -- terminamos debiendo un reembolso.
  expires_at       timestamptz not null,

  mp_preference_id text,
  -- UNIQUE = idempotencia. Mercado Pago reintenta las notificaciones, y sin
  -- esto la misma aprobación se acreditaría varias veces.
  mp_payment_id    text unique,
  mp_status_detail text,

  -- Se generan recién cuando el pago se aprueba.
  ticket_token     text unique,
  ticket_used_at   timestamptz,
  email_sent_at    timestamptz,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- El índice que usa stock_disponible() en su join.
create index if not exists orders_tier_status_expires_idx
  on public.orders (tier_id, status, expires_at);

create index if not exists orders_email_idx on public.orders (buyer_email);

-- ---------------------------------------------------------------------------
-- stock_disponible() — el cálculo, una sola vez y del lado de la base
-- ---------------------------------------------------------------------------
-- Ocupan cupo las pagadas y las pendientes que todavía no vencieron. Las
-- vencidas se liberan solas por el `expires_at > now()`: no hace falta un job
-- que las barra.
--
-- Devuelve NULL si el tier no existe (el caller lo trata como sin stock).
create or replace function public.stock_disponible(p_tier text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select t.stock_total - coalesce((
    select sum(o.quantity)
    from public.orders o
    where o.tier_id = t.id
      and (o.status = 'paid'
           or (o.status = 'pending' and o.expires_at > now()))
  ), 0)
  from public.tiers t
  where t.id = p_tier;
$$;

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: cerrado
-- ---------------------------------------------------------------------------
-- Se activa RLS y NO se crea ninguna política. Con eso, la anon key no lee ni
-- escribe nada: `orders` tiene mails, DNI y los tokens de las entradas.
--
-- Todo el acceso pasa por las funciones serverless, que usan la service_role
-- (que saltea RLS por diseño). Si en algún momento hace falta leer desde el
-- cliente, se agrega una política explícita y acotada — nunca un `using (true)`.
alter table public.tiers  enable row level security;
alter table public.orders enable row level security;

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------
-- OJO: `stock_total` es cuántas entradas querés vender POR LA WEB, que no es lo
-- mismo que el cupo total del evento. Ajustá estos dos números antes de abrir
-- la venta en producción.
--
-- Los precios espejan src/content/tickets.json al 2026-08-01: tanda-4 $35.000 y
-- VIP $65.000. Si cambiás uno, cambiá el otro.
insert into public.tiers (id, nombre, price_ars, stock_total) values
  ('general', 'Última tanda', 35000, 20),
  ('vip',     'Entrada VIP',  65000, 10)
on conflict (id) do update
  set nombre      = excluded.nombre,
      price_ars   = excluded.price_ars,
      stock_total = excluded.stock_total,
      updated_at  = now();
