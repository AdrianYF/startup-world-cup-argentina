-- Generaliza `asistentes_luma` a cualquier canal externo.
--
-- Las entradas del evento salen por TRES lugares:
--
--   canal          día              cómo llega la lista
--   ─────────────────────────────────────────────────────────────────
--   Luma           Mié 5            CSV del panel (side events)
--   Startup Grind  Jue 6 + Vie 7    CSV del panel (la mayoría de las ventas)
--   venta propia   Jue 6 + Vie 7    tabla `orders`, sola
--
-- Tener una tabla por plataforma no escala: cada canal nuevo obligaba a tocar
-- el esquema, el importador y la vista. Con `origen` como columna, sumar un
-- canal es importar un CSV más.

alter table if exists public.asistentes_luma rename to asistentes_externos;

alter table public.asistentes_externos
  -- 'luma' | 'startupgrind' | lo que venga
  add column if not exists origen text not null default 'luma',
  -- Qué días habilita esa entrada. Depende del canal, no de la persona.
  add column if not exists dias text,
  -- Estado normalizado por el importador. Cada plataforma tiene su vocabulario
  -- ('approved', 'Completed', 'going'…) y la vista no tiene por qué conocerlos
  -- todos: se traduce al importar y acá queda uno solo.
  add column if not exists estado_norm text
    check (estado_norm in ('confirmado', 'pendiente', 'rechazado'));

-- `evento` pasa a ser el identificador dentro del canal (slug de Luma, id de
-- Startup Grind). La unicidad ahora es por canal + evento + mail.
alter table public.asistentes_externos
  drop constraint if exists asistentes_luma_evento_email_key;

create unique index if not exists asistentes_externos_unico
  on public.asistentes_externos (origen, evento, email);

create index if not exists asistentes_externos_estado_idx
  on public.asistentes_externos (origen, estado_norm);

-- Lo ya importado era todo de Luma y con el vocabulario de Luma.
update public.asistentes_externos
   set origen = 'luma',
       dias = coalesce(dias, 'Mié 5'),
       estado_norm = coalesce(estado_norm,
         case when lower(estado) in ('approved', 'going') then 'confirmado'
              when lower(estado) in ('declined', 'rejected') then 'rechazado'
              else 'pendiente' end)
 where origen is null or estado_norm is null;

-- ---------------------------------------------------------------------------
-- acreditacion — ahora con los tres canales
-- ---------------------------------------------------------------------------
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
    a.origen,
    a.nombre,
    lower(a.email)                      as email,
    coalesce(a.ticket, 'Entrada')       as entrada,
    1                                   as cantidad,
    coalesce(a.dias, '—')               as dias,
    null                                as documento,
    null                                as token,
    a.checkin_en                        as usada_en,
    a.registrado_en
  from public.asistentes_externos a
  -- Sólo los confirmados: pendientes y rechazados no entran a la puerta.
  where a.estado_norm = 'confirmado';

-- Misma persona en más de un canal. Con Startup Grind y la venta propia
-- vendiendo la MISMA entrada, acá aparecen los que pagaron dos veces.
create or replace view public.acreditacion_ambos_canales as
  select email, min(nombre) as nombre,
         count(distinct origen) as canales,
         string_agg(distinct origen, ' + ' order by origen) as origenes,
         string_agg(distinct dias, ' / ') as dias
  from public.acreditacion
  group by email
  having count(distinct origen) > 1;
