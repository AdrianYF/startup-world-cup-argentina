-- Cargo de servicio, espejando el de Startup Grind (precio × 5,575% + $1,02).
--
-- Se guarda en la orden en vez de recalcularlo al leer: si mañana cambia la
-- fórmula, las compras ya cerradas tienen que seguir mostrando lo que la persona
-- efectivamente pagó. Misma razón por la que ya se congela `unit_price_ars`.
--
-- Va en numeric(12,2) y no en integer: el cargo tiene centavos ($1.952,27).

alter table public.orders
  add column if not exists service_fee_ars numeric(12,2) not null default 0
    check (service_fee_ars >= 0);

comment on column public.orders.service_fee_ars is
  'Cargo de servicio TOTAL de la orden (ya multiplicado por quantity), congelado al crearla.';

-- El total cobrado, para no repetir la suma en cada consulta.
create or replace view public.orders_totales as
  select
    o.*,
    (o.unit_price_ars * o.quantity) as subtotal_ars,
    (o.unit_price_ars * o.quantity + o.service_fee_ars) as total_ars
  from public.orders o;
