-- El ingreso a la puerta, registrado.
--
-- Hasta acá `orders.ticket_used_at` y `asistentes_externos.checkin_en` existían
-- pero no los escribía nadie: marcar una entrada como usada era un `update` a
-- mano. Esto le da a la puerta una tabla donde anotar.
--
-- Un LIBRO de ingresos y no un booleano, por tres razones concretas:
--
--   1. La entrada web habilita DOS días (Jue 6 + Vie 7). Con un solo timestamp,
--      quien entró el jueves aparecería como "ya usada" el viernes.
--   2. `orders.quantity` llega hasta 5: hace falta poder anotar "de 3 entraron 2".
--   3. En la puerta se equivocan. Deshacer tiene que dejar rastro, no borrar.

create table if not exists public.checkins (
  id          uuid primary key default gen_random_uuid(),

  -- Redundante con los FK de abajo, pero es por lo que se agrupa y se filtra.
  origen      text not null,          -- 'web' | 'luma' | 'startupgrind'

  order_id    uuid references public.orders (id) on delete cascade,
  externo_id  uuid references public.asistentes_externos (id) on delete cascade,

  -- La fecha del evento, no la de la anotación: si alguien acredita a las 00:30
  -- del viernes a la fila del jueves, la que manda es la que eligió en la app.
  dia         date not null,

  personas    int  not null default 1 check (personas > 0),

  -- Alias de quien acreditó. Sirve para desempatar cuando dos puertas anotan a
  -- la misma persona con segundos de diferencia.
  por         text,

  -- Deshacer = anular. La fila queda, con su hora, para poder reconstruir qué
  -- pasó en la puerta.
  anulado_en  timestamptz,

  creado_en   timestamptz not null default now(),

  -- Apunta a `orders` o a `asistentes_externos`, nunca a los dos ni a ninguno.
  constraint checkins_una_fuente check (num_nonnulls(order_id, externo_id) = 1)
);

-- El índice de la consulta de la puerta: los ingresos vigentes de un día.
create index if not exists checkins_dia_idx
  on public.checkins (dia) where anulado_en is null;

-- El del delta: "qué se anotó desde tal hora", que es como se sincronizan dos
-- dispositivos entre sí.
create index if not exists checkins_creado_idx on public.checkins (creado_en);

create index if not exists checkins_order_idx   on public.checkins (order_id);
create index if not exists checkins_externo_idx on public.checkins (externo_id);

-- RLS activo y sin políticas, igual que el resto: sólo entran las funciones
-- serverless con la secret key.
alter table public.checkins enable row level security;

-- ---------------------------------------------------------------------------
-- acreditacion — ahora con un id estable
-- ---------------------------------------------------------------------------
-- La vista no tenía identificador: la puerta podía leer la lista pero no decir
-- "acreditá a ESTA fila". El `id` es el de la tabla de origen, que es
-- justamente lo que `checkins` referencia.
drop view if exists public.acreditacion_ambos_canales;
drop view if exists public.acreditacion;

create view public.acreditacion as
  select
    o.id                                as id,
    'web'::text                         as origen,
    o.buyer_name                        as nombre,
    lower(o.buyer_email)                as email,
    o.buyer_telefono                    as telefono,
    o.buyer_empresa                     as empresa,
    case o.tier_id when 'vip' then 'Entrada VIP' else 'Última tanda' end as entrada,
    o.quantity                          as cantidad,
    'Jue 6 + Vie 7'::text               as dias,
    o.ticket_token                      as token,
    o.ticket_used_at                    as usada_en,
    o.created_at                        as registrado_en
  from public.orders o
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
    1                                   as cantidad,
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

-- ---------------------------------------------------------------------------
-- Y que las vistas no queden abiertas a la anon key
-- ---------------------------------------------------------------------------
-- `orders` y `asistentes_externos` tienen RLS sin políticas, pero una vista sin
-- `security_invoker` corre con los permisos de su dueño y se saltea ese RLS. Y
-- en Supabase los roles `anon` / `authenticated` reciben SELECT sobre `public`
-- por default privileges. O sea: la anon key —que es pública por diseño— podía
-- leer mail, teléfono, empresa y el `token` de cada entrada de todo el evento.
--
-- Hoy no la usa nadie desde el cliente (el front no tiene cliente de Supabase),
-- pero eso es una casualidad, no una defensa.
alter view public.acreditacion               set (security_invoker = on);
alter view public.acreditacion_ambos_canales set (security_invoker = on);

revoke all on public.acreditacion               from anon, authenticated;
revoke all on public.acreditacion_ambos_canales from anon, authenticated;
