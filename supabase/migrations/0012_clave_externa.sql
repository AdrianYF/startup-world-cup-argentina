-- La clave de un asistente externo deja de ser el mail, y la vista aprende a
-- leer las preguntas de Luma.
--
-- Las dos cosas salieron de importar por primera vez las listas del 6 y 7 de
-- agosto: 101 invitados de cortesía, 6 VIP y 37 tickets de Startup Grind.
--
-- ---------------------------------------------------------------------------
-- 1 · el mail no identifica a nadie
-- ---------------------------------------------------------------------------
-- El índice de `0004` era `(origen, evento, email)` y el importador hace upsert
-- contra él. Eso asume que el mail es la persona, y con el export de Startup
-- Grind no es cierto: los manda **enmascarados** (`a*****@inspiraaccion.com`),
-- así que dos personas distintas pueden llegar con el mismo string.
--
-- No es hipotético. En el export del 6 de agosto:
--
--   c*******@rentify.com.ar   → Felipe Pozo Y Ignacio Leguisa
--   a***********@hotmail.com  → Agustina Becu, dos tickets
--   i*******@yahoo.com        → Isabel Soldano, dos tickets
--
-- Con la clave vieja esas seis filas entraban como tres sin que fallara nada.
-- Uno de los dos de Rentify no existía cuando llegaba a la puerta.
--
-- Las plataformas sí traen un identificador que sirve —el `Ticket number` de
-- Startup Grind es único fila por fila, el `guest_id` de Luma también—, así que
-- la clave pasa a ser ése, y el mail queda de respaldo para el canal que no lo
-- mande.

-- Columna real y `stored`, no un índice por expresión: PostgREST necesita
-- nombres de columna en `on_conflict` y a una expresión no le puede apuntar.
alter table public.asistentes_externos
  add column if not exists clave text
  generated always as (coalesce(externo_id, email)) stored;

comment on column public.asistentes_externos.clave is
  'Identificador dentro del canal: el id de la plataforma si lo manda, si no el '
  'mail. Es la clave del upsert del importador. Existe porque el mail no '
  'identifica a nadie cuando el canal lo exporta enmascarado.';

create unique index if not exists asistentes_externos_unico2
  on public.asistentes_externos (origen, evento, clave);

drop index if exists asistentes_externos_unico;

-- ---------------------------------------------------------------------------
-- 2 · el teléfono y la empresa de Luma
-- ---------------------------------------------------------------------------
-- La rama externa de la vista saca los dos de `extra`, probando una lista de
-- claves en inglés. Luma no usa ninguna: el teléfono real no viene en
-- `phone_number` —que llega vacío— sino en la pregunta custom del evento, y la
-- empresa igual. El dato entraba a `extra` y no lo veía nadie.
--
-- Se agregan las etiquetas tal cual las escribe Luma. Van al final del
-- `coalesce` para que un canal que sí mande la clave estándar siga ganando.
create or replace view public.acreditacion as
  select
    e.id                                as id,
    'web'::text                         as origen,
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
    nullif(coalesce(
      a.extra ->> 'phone_number',
      a.extra ->> 'phone',
      a.extra ->> 'Phone',
      a.extra ->> 'telefono',
      a.extra ->> 'Teléfono',
      a.extra ->> 'Telefono de WhatsApp (no se comparte con nadie)',
      a.extra ->> 'Teléfono de WhatsApp (no se comparte con nadie)'
    ), '')                              as telefono,
    nullif(coalesce(
      a.extra ->> 'company',
      a.extra ->> 'Company',
      a.extra ->> 'empresa',
      a.extra ->> 'Empresa',
      a.extra ->> 'organization',
      a.extra ->> '¿Para qué empresa trabajas?'
    ), '')                              as empresa,
    coalesce(a.ticket, 'Entrada')       as entrada,
    coalesce(a.dias, '—')               as dias,
    null                                as token,
    a.checkin_en                        as usada_en,
    a.registrado_en
  from public.asistentes_externos a
  where a.estado_norm = 'confirmado';

-- Rehacer la vista puede perder el `security_invoker` y los revokes: se
-- reafirman, igual que en 0008 y 0009.
alter view public.acreditacion set (security_invoker = on);
revoke all on public.acreditacion from anon, authenticated;
