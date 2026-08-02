-- El campo opcional del checkout pasa de DNI a empresa.
--
-- El DNI se pedía para agilizar la acreditación, pero para eso alcanza el
-- nombre contra la lista, y era un dato personal de más que había que
-- custodiar. La empresa, en cambio, sirve al evento: es networking, y es lo
-- que ya traen los otros dos canales (Luma la pregunta en el formulario y
-- Startup Grind la incluye en su export).
--
-- `rename` y no drop + add: si hubiera órdenes con el campo cargado, renombrar
-- conserva el contenido. Va en un DO por si la migración se corre dos veces.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'orders' and column_name = 'buyer_dni'
  ) then
    alter table public.orders rename column buyer_dni to buyer_empresa;
  end if;
end $$;

comment on column public.orders.buyer_empresa is
  'Empresa o startup del comprador. Opcional, para la lista de acreditación.';

-- `create or replace view` no permite renombrar una columna existente
-- ("cannot change name of view column"), así que hay que tirar las vistas y
-- rehacerlas. `acreditacion_ambos_canales` cuelga de `acreditacion`, por eso el
-- orden: primero la que depende.
drop view if exists public.acreditacion_ambos_canales;
drop view if exists public.acreditacion;

create view public.acreditacion as
  select
    'web'::text                         as origen,
    o.buyer_name                        as nombre,
    lower(o.buyer_email)                as email,
    case o.tier_id when 'vip' then 'Entrada VIP' else 'Última tanda' end as entrada,
    o.quantity                          as cantidad,
    'Jue 6 + Vie 7'::text               as dias,
    o.buyer_empresa                     as empresa,
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
    -- Los canales externos la traen entre las preguntas custom, que quedan en
    -- `extra`: se prueban los nombres más comunes.
    coalesce(
      a.extra ->> 'company',
      a.extra ->> 'Company',
      a.extra ->> 'empresa',
      a.extra ->> 'Empresa',
      a.extra ->> 'organization'
    )                                   as empresa,
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
