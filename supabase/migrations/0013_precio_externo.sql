-- Cuánto pagó cada asistente externo.
--
-- Hasta acá la plata del evento era sólo la de `orders`, porque era la única
-- que pasaba por nuestra cuenta. El problema es que la pantalla de Ventas dice
-- "Recaudado" y muestra ese número: con 4 entradas propias y 37 vendidas por
-- Startup Grind, el cartel decía $147.809,08 sobre un evento que movió cinco
-- veces eso. No estaba mal calculado — estaba contestando otra pregunta que la
-- que el título prometía.
--
-- Los dos canales externos exportan el precio y lo estábamos tirando: Startup
-- Grind en «Ticket Price Paid» —lo efectivamente pagado, con descuentos ya
-- aplicados— y Luma en `amount`, que en las listas de invitados es $0.
--
-- Nullable a propósito: una lista importada antes de esto, o un canal que no
-- exporte precio, tiene que poder distinguirse de una entrada que salió $0.
alter table public.asistentes_externos
  add column if not exists precio_ars numeric(12, 2);

comment on column public.asistentes_externos.precio_ars is
  'Lo que la persona pagó por esta entrada, en pesos y con el cargo del canal '
  'incluido — que es como lo exportan. NULL = el canal no informó precio, que '
  'no es lo mismo que gratis.';
