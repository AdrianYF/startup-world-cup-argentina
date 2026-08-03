-- Lista de acreditación unificada: los que compraron por el sitio + los
-- aprobados en Luma.
--
-- El evento tiene dos canales de entrada y hasta ahora vivían separados:
--   · miércoles (side events) → Luma, con aprobación del host
--   · jueves y viernes        → venta propia, tabla `orders`
--
-- En la puerta hace falta UNA lista, no dos.

-- ---------------------------------------------------------------------------
-- asistentes_luma — lo que se importa del CSV que exporta Luma
-- ---------------------------------------------------------------------------
-- Sólo se mapean las columnas que usamos; el resto del CSV se guarda entero en
-- `extra`. Luma cambia y agrega columnas (y cada evento suma las respuestas a
-- sus preguntas custom), así que no vale la pena declararlas una por una: lo
-- que no se mapea igual queda guardado.
create table if not exists public.asistentes_luma (
  id            uuid primary key default gen_random_uuid(),
  evento        text not null,              -- slug del evento (ej. 'quzhnee8')
  luma_id       text,                       -- api_id del guest en Luma
  nombre        text,
  email         text not null,
  -- Tal cual lo exporta Luma: 'approved', 'pending_approval', 'declined'…
  estado        text,
  ticket        text,
  registrado_en timestamptz,
  checkin_en    timestamptz,
  extra         jsonb not null default '{}'::jsonb,
  importado_en  timestamptz not null default now(),

  -- Reimportar el CSV actualiza en vez de duplicar.
  unique (evento, email)
);

create index if not exists asistentes_luma_estado_idx on public.asistentes_luma (evento, estado);
create index if not exists asistentes_luma_email_idx on public.asistentes_luma (email);

alter table public.asistentes_luma enable row level security;

-- ---------------------------------------------------------------------------
-- acreditacion — la lista de la puerta, de los dos canales
-- ---------------------------------------------------------------------------
-- `documento` y `token` sólo existen del lado web: en Luma no pedimos DNI y no
-- emitimos entrada con QR propia.
create or replace view public.acreditacion as
  select
    'web'::text                         as origen,
    o.buyer_name                        as nombre,
    lower(o.buyer_email)                as email,
    case o.tier_id when 'vip' then 'Entrada VIP' else 'Última tanda' end as entrada,
    o.quantity                          as cantidad,
    'Jue 6 + Vie 7'::text               as dias,
    o.buyer_dni                         as documento,
    o.ticket_token                      as token,
    o.ticket_used_at                    as usada_en,
    o.created_at                        as registrado_en
  from public.orders o
  where o.status = 'paid'

  union all

  select
    'luma'::text                        as origen,
    l.nombre,
    lower(l.email)                      as email,
    coalesce(l.ticket, 'Side event')    as entrada,
    1                                   as cantidad,
    'Mié 5'::text                       as dias,
    null                                as documento,
    null                                as token,
    l.checkin_en                        as usada_en,
    l.registrado_en
  from public.asistentes_luma l
  -- Sólo los aceptados: los pendientes y rechazados no entran.
  where l.estado in ('approved', 'Approved', 'going', 'Going');

-- Quién viene los tres días: aparece en los dos canales con el mismo mail.
create or replace view public.acreditacion_ambos_canales as
  select email, min(nombre) as nombre, count(*) as canales,
         string_agg(distinct origen, ' + ' order by origen) as origenes
  from public.acreditacion
  group by email
  having count(distinct origen) > 1;
