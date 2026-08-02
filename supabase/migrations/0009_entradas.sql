-- Una entrada por asistente, con su nombre y su QR.
--
-- Hasta acá la entrada ERA la orden: un `orders.ticket_token` para toda la
-- compra, y `quantity` como un número al costado. Con eso, quien compraba tres
-- aparecía en la puerta como UNA persona con "3 entradas", y sus dos
-- acompañantes no figuraban por nombre en ningún lado — ni en la lista, ni en el
-- mail, ni en el PDF.
--
-- Ahora cada asistente tiene su fila, su nombre y su token. En la puerta se lo
-- busca por su apellido, que es como se acredita de verdad.

create table if not exists public.entradas (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,

  -- 1..N dentro de la compra. La 1 es la del comprador.
  numero     int  not null check (numero > 0),

  -- El asistente, NO el comprador. Puede venir vacío si se compró antes de que
  -- el checkout pidiera los nombres.
  nombre     text,

  -- Se emite recién cuando el pago se aprueba, igual que hacía
  -- `orders.ticket_token`: una orden pendiente no tiene entrada válida.
  -- Nullable a propósito, y es lo que hace idempotente a la acreditación.
  token      text unique,

  usada_en   timestamptz,
  creado_en  timestamptz not null default now(),

  unique (order_id, numero)
);

create index if not exists entradas_order_idx on public.entradas (order_id);

alter table public.entradas enable row level security;

comment on table public.entradas is
  'Una fila por asistente. El token es la credencial: quien lo tiene, tiene la entrada.';

-- ---------------------------------------------------------------------------
-- Backfill
-- ---------------------------------------------------------------------------
-- Hay entradas VENDIDAS con QR ya emitidos y mails ya mandados que apuntan a
-- /entrada/<token>. La entrada nº 1 de cada orden hereda ese token exacto: si se
-- generara uno nuevo, todos esos QR dejarían de abrir.
--
-- Las demás quedan sin token. No es un olvido: nunca se emitió uno para ellas,
-- y `acreditar()` las completa la próxima vez que pase por esa orden. Para las
-- órdenes viejas ya acreditadas hay que emitirlos a mano (ver abajo).
insert into public.entradas (order_id, numero, nombre, token, usada_en)
select o.id,
       g.n,
       case when g.n = 1 then o.buyer_name end,
       case when g.n = 1 then o.ticket_token end,
       case when g.n = 1 then o.ticket_used_at end
from public.orders o
cross join generate_series(1, o.quantity) as g(n)
where o.status = 'paid'
  and not exists (select 1 from public.entradas e where e.order_id = o.id);

-- Tokens para las entradas 2..N de órdenes ya pagadas antes de esta migración.
-- 32 bytes aleatorios en base64url, la misma forma que genera `acreditar.js`
-- (`crypto.randomBytes(32).toString('base64url')`) y que valida el TOKEN_RE de
-- la API: [A-Za-z0-9_-]{20,64}.
update public.entradas
   set token = replace(translate(encode(gen_random_bytes(32), 'base64'), '+/', '-_'), '=', '')
 where token is null
   and order_id in (select id from public.orders where status = 'paid');

-- `orders.ticket_token` y `orders.ticket_used_at` NO se tocan: quedan como
-- registro de lo que se emitió antes. Nada nuevo los escribe.
comment on column public.orders.ticket_token is
  'Histórico. La credencial vive en entradas.token desde la migración 0009.';

-- ---------------------------------------------------------------------------
-- checkins — el ingreso es de una persona, no de una compra
-- ---------------------------------------------------------------------------
alter table public.checkins
  add column if not exists entrada_id uuid references public.entradas (id) on delete cascade;

-- Lo ya anotado contra una orden pasa a su primera entrada.
update public.checkins c
   set entrada_id = e.id
  from public.entradas e
 where c.order_id is not null
   and c.entrada_id is null
   and e.order_id = c.order_id
   and e.numero = 1;

alter table public.checkins drop constraint if exists checkins_una_fuente;
alter table public.checkins drop column if exists order_id;

-- Una fila = una persona, así que la columna que las contaba pierde sentido.
alter table public.checkins drop column if exists personas;

alter table public.checkins
  add constraint checkins_una_fuente check (num_nonnulls(entrada_id, externo_id) = 1);

drop index if exists public.checkins_order_idx;
create index if not exists checkins_entrada_idx on public.checkins (entrada_id);

-- ---------------------------------------------------------------------------
-- acreditacion — la rama web sale de `entradas`
-- ---------------------------------------------------------------------------
-- `cantidad` se va: con una fila por persona siempre valía 1, en los tres
-- canales. Una columna que nunca cambia no es un dato, es ruido.
drop view if exists public.acreditacion_ambos_canales;
drop view if exists public.acreditacion;

create view public.acreditacion as
  select
    e.id                                as id,
    'web'::text                         as origen,
    -- El asistente. Si la compra es anterior a que se pidieran los nombres, cae
    -- al del comprador con su número, que es mejor que una fila en blanco.
    coalesce(e.nombre, o.buyer_name || ' (' || e.numero || ')') as nombre,
    lower(o.buyer_email)                as email,
    o.buyer_telefono                    as telefono,
    o.buyer_empresa                     as empresa,
    case o.tier_id when 'vip' then 'Entrada VIP' else 'Última tanda' end as entrada,
    'Jue 6 + Vie 7'::text               as dias,
    e.token                             as token,
    e.usada_en                          as usada_en,
    o.created_at                        as registrado_en
  from public.entradas e
  join public.orders o on o.id = e.order_id
  where o.status = 'paid'

  union all

  select
    a.id                                as id,
    a.origen,
    a.nombre,
    lower(a.email)                      as email,
    coalesce(
      a.extra ->> 'phone_number',
      a.extra ->> 'phone',
      a.extra ->> 'Phone',
      a.extra ->> 'telefono',
      a.extra ->> 'Teléfono'
    )                                   as telefono,
    coalesce(
      a.extra ->> 'company',
      a.extra ->> 'Company',
      a.extra ->> 'empresa',
      a.extra ->> 'Empresa',
      a.extra ->> 'organization'
    )                                   as empresa,
    coalesce(a.ticket, 'Entrada')       as entrada,
    coalesce(a.dias, '—')               as dias,
    null                                as token,
    a.checkin_en                        as usada_en,
    a.registrado_en
  from public.asistentes_externos a
  where a.estado_norm = 'confirmado';

create view public.acreditacion_ambos_canales as
  select email, min(nombre) as nombre,
         count(distinct origen) as canales,
         string_agg(distinct origen, ' + ' order by origen) as origenes,
         string_agg(distinct dias, ' / ') as dias
  from public.acreditacion
  group by email
  having count(distinct origen) > 1;

-- Igual que en 0008: que la anon key no las lea. Rehacer la vista pierde tanto
-- el `security_invoker` como los revokes.
alter view public.acreditacion               set (security_invoker = on);
alter view public.acreditacion_ambos_canales set (security_invoker = on);

revoke all on public.acreditacion               from anon, authenticated;
revoke all on public.acreditacion_ambos_canales from anon, authenticated;
