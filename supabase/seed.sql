-- Datos mínimos para que el Supabase LOCAL sirva para algo apenas arranca.
--
-- Lo aplica la CLI sola en `supabase start` y en `supabase db reset` (está
-- declarado en config.toml, `[db.seed]`). En la nube no corre nunca: allá los
-- tiers los maneja quien abre y cierra la venta.
--
-- Existe porque las migraciones crean la tabla `tiers` pero no la llenan, y sin
-- una fila activa `/api/tiers` devuelve `[]`; con eso el checkout contesta
-- `tier_no_disponible` y el sitio manda el botón a Startup Grind. O sea: sin
-- esto, la venta propia es imposible de probar en local, y el motivo no se ve
-- por ningún lado.

insert into public.tiers (id, nombre, price_ars, stock_total, activo) values
  ('general', 'Última tanda', 35000, 20, true),
  ('vip',     'Entrada VIP',  65000, 10, true)
on conflict (id) do update set
  nombre      = excluded.nombre,
  price_ars   = excluded.price_ars,
  stock_total = excluded.stock_total,
  activo      = true;
