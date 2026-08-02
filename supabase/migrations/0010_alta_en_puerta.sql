-- Poder dar de alta a alguien en la puerta.
--
-- El caso: llega una persona, no está en ninguna de las tres listas —una
-- invitación que nadie cargó, un speaker, prensa, alguien que compró en la
-- puerta— y hay que dejarla entrar igual. Hasta ahora la única salida era
-- anotarla en un papel.
--
-- No hace falta una tabla nueva: `asistentes_externos` ya tiene la forma exacta
-- (origen, nombre, email, dias, estado_norm). El alta entra como un canal más,
-- con `origen = 'puerta'`, y la vista `acreditacion` la levanta sin cambios.

-- ---------------------------------------------------------------------------
-- El mail deja de ser obligatorio
-- ---------------------------------------------------------------------------
-- Los CSV de Luma y Startup Grind siempre traen mail, así que la columna nació
-- `not null`. Pero en la puerta hay una persona parada adelante y cola atrás:
-- pedirle el mail y tipearlo en un celular es fricción que no paga. El nombre
-- alcanza para acreditar.
alter table public.asistentes_externos alter column email drop not null;

comment on column public.asistentes_externos.email is
  'Opcional desde 0010: los altas de puerta pueden no tenerlo. Los CSV siempre lo traen.';

-- El índice único (origen, evento, email) sigue sirviendo: Postgres considera
-- distintos a dos NULL, así que varios altas sin mail conviven sin chocar, y
-- reimportar un CSV sigue actualizando en vez de duplicar.

-- ---------------------------------------------------------------------------
-- Y que los sin-mail no se marquen como pago doble
-- ---------------------------------------------------------------------------
-- `acreditacion_ambos_canales` agrupa por mail para detectar a quien pagó la
-- misma entrada por dos canales. Con el mail nulo, TODOS los altas de puerta
-- caerían en un mismo grupo y, apenas hubiera dos de orígenes distintos, la
-- puerta vería un "⚠ pagó dos veces" que es mentira.
create or replace view public.acreditacion_ambos_canales as
  select email, min(nombre) as nombre,
         count(distinct origen) as canales,
         string_agg(distinct origen, ' + ' order by origen) as origenes,
         string_agg(distinct dias, ' / ') as dias
  from public.acreditacion
  where email is not null and email <> ''
  group by email
  having count(distinct origen) > 1;

alter view public.acreditacion_ambos_canales set (security_invoker = on);
revoke all on public.acreditacion_ambos_canales from anon, authenticated;
