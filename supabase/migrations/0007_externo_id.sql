-- `luma_id` pasa a llamarse `externo_id`.
--
-- Cuando `asistentes_luma` se generalizó a `asistentes_externos` (0004) quedó
-- una columna con el nombre viejo. El importador ya escribe `externo_id`
-- (`scripts/importar-asistentes.mjs`), así que hoy el upsert falla con
-- `PGRST204: could not find the 'externo_id' column` y NO entra nadie de Luma
-- ni de Startup Grind — que son la mayoría de la puerta.
--
-- `rename` y no drop + add: si ya hubiera filas importadas, renombrar conserva
-- el contenido. Va en un DO por si la migración se corre dos veces.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'asistentes_externos'
      and column_name = 'luma_id'
  ) then
    alter table public.asistentes_externos rename column luma_id to externo_id;
  end if;
end $$;

comment on column public.asistentes_externos.externo_id is
  'Id del asistente en la plataforma de origen: api_id en Luma, order_id en Startup Grind.';
