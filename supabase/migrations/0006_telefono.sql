-- Suma el teléfono al checkout. La empresa se queda.
--
-- El campo opcional venía siendo DNI → empresa (0005). Ahora son los dos:
-- teléfono para poder avisar de un cambio de último momento, y empresa para el
-- networking y la lista de acreditación.
--
-- Los dos opcionales: nada de esto hace falta para completar una compra, y cada
-- campo obligatorio de más es gente que abandona el checkout.
alter table public.orders
  add column if not exists buyer_telefono text;

comment on column public.orders.buyer_telefono is
  'Teléfono del comprador. Opcional, para avisos sobre el evento.';

-- La lista de la puerta lo muestra: si alguien no aparece, es por dónde
-- llamarlo sin tener que ir a buscar el mail.
drop view if exists public.acreditacion_ambos_canales;
drop view if exists public.acreditacion;

create view public.acreditacion as
  select
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
    a.origen,
    a.nombre,
    lower(a.email)                      as email,
    -- Luma y Startup Grind lo traen entre las preguntas custom, que quedan en
    -- `extra`: se prueban los nombres más comunes.
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
