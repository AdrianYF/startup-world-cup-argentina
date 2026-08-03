-- Que dos compras simultáneas no vendan la misma entrada.
--
-- El bug, reproducible y con test: con UNA entrada disponible, dos checkouts en
-- paralelo devolvían 201 los dos. Se vendía una entrada que no existe.
--
-- `api/checkout.js` hacía esto:
--
--     const libre = await stockDisponible(tierId)   -- lee
--     if (libre < quantity) return 409
--     await db().from('orders').insert(...)         -- escribe
--
-- Entre la lectura y la escritura no hay nada. Su comentario decía que «la
-- ventana es de milisegundos y la orden pendiente que se crea abajo reserva el
-- cupo, así que el segundo comprador rebota acá», y eso es falso: las dos
-- lecturas ocurren antes de que cualquiera de las dos escriba, así que las dos
-- ven el mismo cupo libre y las dos siguen de largo. Milisegundos alcanzan —es
-- exactamente el caso de la última entrada, que es cuando dos personas están
-- comprando a la vez.
--
-- No se puede arreglar desde JavaScript: no hay forma de leer y escribir sin que
-- otra request se meta en el medio. Tiene que pasar adentro de una transacción.
--
-- Es el chequeo que CHECKOUT.md ya pedía en su lista de pre-producción:
--   «Poné `stock_total = 1` y lanzá dos checkouts: el segundo tiene que dar 409».

create or replace function public.crear_orden(
  p_tier     text,
  p_cantidad int,
  p_precio   int,
  p_cargo    numeric,
  p_nombre   text,
  p_email    text,
  p_telefono text,
  p_empresa  text,
  -- Un nombre por entrada. El primero es el del comprador.
  p_nombres  text[],
  p_expira   timestamptz
)
returns table (orden_id uuid, disponible int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_libre int;
  v_orden uuid;
begin
  -- El cerrojo, y es toda la migración.
  --
  -- Serializa por TIER: dos compras de `general` se hacen fila, una de `vip` no
  -- espera a ninguna. `xact` = se suelta solo al terminar la transacción, sin
  -- `unlock` que se pueda olvidar y sin dejar nada trabado si esto explota.
  --
  -- Va ANTES de leer el stock. Al revés no sirve de nada: el problema es
  -- justamente que dos lecturas pasen antes de la primera escritura.
  perform pg_advisory_xact_lock(hashtext(p_tier));

  -- Ahora sí. Esta lectura ve lo que escribió quien tenía el cerrojo antes,
  -- porque no lo soltó hasta commitear.
  --
  -- La cuenta no se reimplementa acá: es `stock_disponible()`, la misma que
  -- usan `/api/tiers` y el backoffice. Dos versiones de «cuántas quedan» es
  -- cómo se termina vendiendo de más por otro lado.
  v_libre := stock_disponible(p_tier);

  if v_libre is null or v_libre < p_cantidad then
    -- Sin insertar nada. El caller lo traduce a 409 `sin_stock` y muestra
    -- cuántas quedan, que es lo que deja al comprador bajar la cantidad en vez
    -- de irse.
    return query select null::uuid, coalesce(v_libre, 0);
    return;
  end if;

  insert into public.orders (
    tier_id, quantity, unit_price_ars, service_fee_ars,
    buyer_name, buyer_email, buyer_telefono, buyer_empresa,
    status, expires_at
  ) values (
    p_tier, p_cantidad, p_precio, p_cargo,
    p_nombre, p_email, nullif(p_telefono, ''), nullif(p_empresa, ''),
    'pending', p_expira
  )
  returning id into v_orden;

  -- Las entradas, en la MISMA transacción que la orden.
  --
  -- Antes eran dos requests separadas, así que un fallo entre medio dejaba una
  -- orden pagable con cero entradas — y `acreditar()` le habría emitido cero
  -- tokens a alguien que pagó. Acá o entran las dos cosas o no entra ninguna.
  insert into public.entradas (order_id, numero, nombre)
  select v_orden, i, p_nombres[i]
  from generate_subscripts(p_nombres, 1) as i;

  return query select v_orden, v_libre - p_cantidad;
end;
$$;

comment on function public.crear_orden is
  'Reserva cupo y crea la orden con sus entradas, atómicamente. Devuelve '
  'orden_id NULL cuando no hay stock, con `disponible` para el mensaje.';

-- Igual que el resto: sólo la entra la service_role desde las funciones
-- serverless. `security definer` sin esto la dejaría llamable con la anon key,
-- que es pública por diseño — y esta función ESCRIBE.
revoke all on function public.crear_orden from anon, authenticated;
