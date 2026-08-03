# Venta de entradas — puesta en marcha

Qué hay que hacer, una vez, para que la sección de Entradas cobre de verdad.
El código ya está; lo que falta son credenciales y configuración.

## Precios

| tier | precio | cargo de servicio | total |
|---|---|---|---|
| `general` — Última tanda | $35.000 | $1.952,27 | **$36.952,27** |
| `vip` — Entrada VIP | $65.000 | $3.624,77 | **$68.624,77** |

El cargo espeja el de Startup Grind — `precio × 5,575% + $1,02`, despejado de
sus dos precios publicados y exacto al centavo — para que comprar por acá cueste
lo mismo que por allá. Si un canal saliera más barato, competiríamos con nuestro
propio partner.

Vive en `api/_lib/precios.js`, en un solo lugar: el modal muestra lo que el
backend calculó (`/api/tiers`), no lo recalcula. El cargo se congela en
`orders.service_fee_ars` al crear la orden, así una compra vieja sigue mostrando
lo que la persona pagó aunque después cambie la fórmula.

Es **por entrada**: dos entradas pagan dos cargos.

Se pueden comprar hasta **5 por compra** (`MAX_UNIDADES` en `api/checkout.js`, y
el mismo tope en el CHECK de la tabla). El selector del modal se corta antes si
queda menos cupo web.

## Una entrada es una persona

Cada asistente tiene su fila en `entradas`, con **su nombre y su QR**. Quien
compra tres carga tres nombres en el checkout y recibe un mail con tres códigos.

No es un detalle de forma: en la puerta se busca por apellido. Con un solo QR
por compra, los dos acompañantes no figuraban por nombre en ningún lado y había
que acreditarlos "a cuenta" del que compró.

```
orders (la compra: quién pagó, cuánto, estado del pago)
  └── entradas (una por asistente: nombre, token, usada_en)
        └── checkins (una por ingreso: qué día, quién acreditó)
```

El token se emite **al aprobarse el pago**, no al crear la orden: hasta que
Mercado Pago confirma, la entrada existe pero no tiene credencial.

## Cómo funciona

```
Modal (datos)  →  POST /api/checkout  →  orden 'pending' + preferencia MP
                                              ↓
                                     Wallet Brick → Mercado Pago
                                              ↓
         /?compra=<id>  ←  back_url            │
              ↓                                ↓
     modal de felicitaciones     POST /api/mp-webhook  ← firma + acredita
              ↓ poletea                        ↓
        GET /api/orden ──────────────→  _lib/acreditar.js
              (si sigue pendiente,             ↓
               le pregunta a MP)      orden 'paid' + un token por
                                      entrada + mail con los N QR
```

Hay **dos caminos** que acreditan, y los dos terminan en `_lib/acreditar.js`:

1. **El webhook**, cuando MP nos avisa. Es el normal.
2. **La reconciliación**: si el comprador vuelve y su orden sigue `pending`,
   `/api/orden` le pregunta a Mercado Pago por `external_reference` y acredita en
   el acto. No es un lujo — en local el webhook no llega nunca (MP no alcanza
   `localhost`) y en producción puede demorar o fallar. Sin esto, alguien que
   pagó se queda mirando "confirmando" para siempre.

Los dos son seguros por lo mismo: **el estado del pago se lo pedimos a Mercado
Pago con nuestro access token**. El cliente sólo aporta el id de la orden; los
query params que MP agrega al volver (`status`, `payment_id`) se ignoran, porque
esa URL se escribe a mano.

## 1 · Supabase

1. Creá el proyecto desde la integración de Vercel (Storage → Supabase). Eso deja
   `SUPABASE_URL` y las keys ya cargadas en el proyecto de Vercel.
2. En el SQL Editor, corré las migraciones de `supabase/migrations/` **en orden**
   (`0001` … `0009`). O `supabase db push` si tenés la CLI linkeada.

   `0009` hace un backfill sobre entradas ya vendidas: la primera entrada de
   cada orden hereda el `ticket_token` que ya se mandó por mail, así los QR
   emitidos siguen abriendo. Después de correrla, chequealo:

   ```sql
   select count(*) from orders o join entradas e on e.order_id=o.id and e.numero=1
    where o.status='paid' and o.ticket_token is distinct from e.token;  -- 0
   ```
3. **Ajustá el `stock_total` del seed.** Está en 20 generales / 10 VIP, que es un
   número de ejemplo. Es cuántas entradas querés vender *por la web* — Startup
   Grind sigue vendiendo su propio cupo, y los dos stocks son independientes.

```sql
update tiers set stock_total = 25 where id = 'general';
```

## 2 · Mercado Pago

App **startupworldcupar** (`1003572338407990`) en
[Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app).

Hay dos solapas de credenciales, *producción* y *prueba*, y son dos juegos que no
se mezclan: las de prueba (`TEST-`) van a `MP_TEST_*` y las de producción
(`APP_USR-`) a `MP_*`. Ver [la regla](#dos-entornos-una-regla).

1. Copiá la **public key** y el **access token**. Arrancá con los de *prueba*.
2. Webhooks → Configurar notificación:
   - URL: `https://<tu-dominio>/api/mp-webhook`
   - Evento: **Pagos**
   - Revelá la **clave secreta** → `MP_WEBHOOK_SECRET`, o `MP_TEST_WEBHOOK_SECRET`
     si la URL que cargaste es la de un túnel.

Ver **[Probar en local](#probar-en-local)** más abajo.

## 3 · Resend

El mail está hecho con [React Email](https://react.email/docs/integrations/resend):
el template es un componente en `api/_lib/emails/entrada.tsx` y se le pasa a
Resend por la prop `react`, que lo renderiza a HTML del lado de ellos. Los
componentes ya resuelven las tablas anidadas y los estilos inline que los
clientes de mail necesitan — el render sale con 14 tablas, 48 estilos inline y
cero bloques `<style>`, que es lo que Gmail descarta.

1. Alta en [resend.com](https://resend.com), API key → `RESEND_API_KEY` (en
   desarrollo, `RESEND_TEST_API_KEY`; vacía = no sale ningún mail, que es el
   default a propósito).
2. Verificá el dominio (SPF + DKIM). **Son registros DNS que tenés que cargar
   donde esté hosteado el dominio** — es el paso más lento, conviene arrancarlo
   primero.

Sin dominio verificado, Resend sólo deja mandar **desde `onboarding@resend.dev`
y hacia la casilla de tu cuenta**. Para probar:

```bash
RESEND_FROM="Startup World Cup Argentina <onboarding@resend.dev>"
```

> Los dos `.tsx` empiezan con `@jsxRuntime automatic` / `@jsxImportSource react`.
> No sacar: el `tsconfig.json` de la raíz es sólo un archivo de referencias, sin
> `compilerOptions`, así que el bundler que compila `api/` no encuentra ningún
> `jsx` configurado y cae al transform clásico — que revienta con "React is not
> defined" en runtime, y sólo en producción.

## 4 · Variables

Copiá `.env.example` a `.env.local` y completalo.

### Dos entornos, una regla

`ENTORNO` decide con qué juego de credenciales corre todo — Mercado Pago, Resend,
el PIN de la puerta, la URL del sitio. Se nombran igual, con `TEST_` metido
después del servicio:

| producción | desarrollo |
| --- | --- |
| `MP_ACCESS_TOKEN` | `MP_TEST_ACCESS_TOKEN` |
| `MP_PUBLIC_KEY` | `MP_TEST_PUBLIC_KEY` |
| `MP_WEBHOOK_SECRET` | `MP_TEST_WEBHOOK_SECRET` |
| `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_REPLY_TO` | `RESEND_TEST_*` |
| `PUERTA_PIN`, `PUERTA_SECRET` | `PUERTA_TEST_*` |
| `PUBLIC_SITE_URL` | `PUBLIC_TEST_SITE_URL` |

Si en desarrollo falta la `_TEST_`, **no se cae a la de producción**: corta y
dice cuál falta. Ese silencio es el que cobró $147.809 de verdad — ver
`api/_lib/entorno.js`.

Supabase es la excepción a propósito: una sola base para los dos entornos. Para
no escribir en la del evento está `npm run dev:local`.

```bash
npm run entorno   # qué tiene cargado cada entorno y qué falta
```

### Producción

Los valores de producción **no van en `.env.local`**: viven en Vercel, así un
local mal arrancado no puede usarlos. El checklist es este, con los nombres SIN
prefijo:

```bash
vercel env add MP_ACCESS_TOKEN production      # APP_USR-… de la cuenta que cobra
vercel env add MP_PUBLIC_KEY production        # APP_USR-…
vercel env add MP_WEBHOOK_SECRET production    # el de la app, no el de otra cuenta
vercel env add PUERTA_PIN production
vercel env add PUERTA_SECRET production        # openssl rand -base64 32
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM production
vercel env add RESEND_REPLY_TO production
vercel env add PUBLIC_SITE_URL production      # el dominio real
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SECRET_KEY production
```

> El `MP_WEBHOOK_SECRET` tiene que ser el de **la misma app** que emitió el
> access token. Si se cambia de cuenta de Mercado Pago y no se cambia este, las
> notificaciones fallan la firma, `api/mp-webhook.js` contesta 401 y el pago
> entra sin que la entrada se acredite sola.

Un cambio de variable en Vercel no toca lo que está deployado: recién aplica en
el próximo deploy.

Sólo `VITE_MP_PUBLIC_KEY` lleva el prefijo `VITE_`. Todo lo prefijado así se
inlinea en el JavaScript público: si le ponés `VITE_` a un secreto, queda
expuesto en el bundle.

## Probar en local

Para probar una **compra**, un comando:

```bash
npm run dev:local
```

Levanta el Supabase de Docker si no está, siembra los tiers (`supabase/seed.sql`,
que es lo que hace que la venta propia exista y el botón no se vaya a Startup
Grind) y arranca el dev server apuntando ahí. Mercado Pago sigue con las
credenciales de prueba de `.env.local`, así que se puede comprar sin mover un
peso y sin escribir en la base del evento.

Para trabajar contra la base de la nube —lo que hace falta para ver los datos
reales— es `npm run dev`, y ahí la venta propia depende de que los tiers estén
`activo = true` en esa base.

Las funciones corren dentro del dev server gracias a `scripts/vite-plugin-api.mjs`.
Sin ese plugin, Vite no conoce `/api/*` y cae al fallback de la SPA: un GET
devuelve el index.html con 200 pero **un POST devuelve 404**, porque el fallback
sólo aplica a GET/HEAD. Ese 404 parecía un bug del checkout y no lo era.

`supabase start` imprime la **API URL** y la **Secret key**: van a `SUPABASE_URL`
y `SUPABASE_SECRET_KEY`. Son de un Postgres en tu máquina, no tocan nada remoto.
`supabase stop` lo baja. Más cómodo todavía: `npm run dev:local` las lee de
`supabase status` y las inyecta sin tocar `.env.local`.

Supabase es lo único que NO conmuta con `ENTORNO` — una sola base para los dos
entornos, así que en desarrollo se escribe en la del evento salvo que uses el
Postgres local.

Comprobá que están vivas:

```bash
curl localhost:5173/api/tiers
# {"tiers":[{"id":"general","precio":35000,"disponible":20}, …]}   ← ok
# {"error":"tiers_unavailable"}   ← falta SUPABASE_URL / SERVICE_ROLE_KEY
# <!doctype html>                 ← el plugin no cargó; reiniciá el dev server
```

### Sin túnel

Con `PUBLIC_TEST_SITE_URL=http://localhost:5173` el pago funciona de punta a
punta.

No llegan webhooks (MP no alcanza `localhost`), pero **no hace falta**: al volver
al sitio, la reconciliación de `/api/orden` le pregunta a MP y acredita sola. La
única diferencia es que el mail no se manda hasta que haya
`RESEND_TEST_API_KEY`.

El límite real es de Mercado Pago: **no hay `auto_return`**, porque lo rechaza si
`back_urls.success` no es pública (la preferencia falla entera con
`invalid_auto_return`). O sea que al terminar de pagar hay que tocar "Volver al
sitio" a mano; ahí sí se abre el modal de felicitaciones.

### Con túnel, para probar el webhook de verdad

```bash
npm run tunel            # contra :5173
npm run tunel -- 5175    # si Vite se corrió de puerto
```

Levanta `cloudflared`, escribe la URL en `PUBLIC_TEST_SITE_URL` y te dice lo que
falta. Sin esa variable las `back_urls` apuntan a localhost y al pagar no volvés
a ningún lado.

1. Reiniciá `npm run dev`: el env se lee al arrancar.
2. Cargá `https://<túnel>/api/mp-webhook` en el panel de MP, evento **Pagos**.
3. Copiá la clave secreta que revela el panel a `MP_TEST_WEBHOOK_SECRET`.

> El túnel es público mientras el proceso viva: cualquiera con el link entra a tu
> máquina. Cortalo cuando termines.

## 5 · Probar antes de cobrar en serio

Con credenciales de **test**:

- Comprá con [tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/additional-content/test-cards).
  Probá aprobada, rechazada y pendiente.
- Mandale al webhook un POST con una firma inventada: tiene que devolver **401**.
- Mandá la misma notificación válida dos veces: la orden se acredita **una** vez
  y el mail sale **una** vez.
- Poné `stock_total = 1` y lanzá dos checkouts: el segundo tiene que dar 409.
- Escribí `/gracias?orden=<uuid>` a mano sin haber pagado: no debe acreditar.
- Comprá **dos** entradas con nombres distintos: tienen que llegar dos QR, cada
  uno con su nombre, y en `/puerta` tienen que aparecer **dos filas** que se
  acreditan por separado.

Antes de pasar a producción, pasá el `quality_checklist` del MCP de Mercado Pago
contra la app.

## La lista de la puerta

Las entradas salen por **tres** canales:

| día | canal | de dónde sale la lista |
|---|---|---|
| Miércoles 5 (side events) | Luma, con aprobación del host | CSV del panel |
| Jueves 6 y viernes 7 | **Startup Grind** (la mayoría) | CSV del panel |
| Jueves 6 y viernes 7 | venta propia | tabla `orders`, sola |

```bash
# Luma: evento → pestaña Guests → ícono Download
node scripts/importar-asistentes.mjs guests.csv --origen luma --evento quzhnee8

# Startup Grind: panel del evento → asistentes → export
node scripts/importar-asistentes.mjs attendees.csv --origen startupgrind --evento 31263

# La lista unificada
node scripts/lista-puerta.mjs             # tabla, ordenada por apellido
node scripts/lista-puerta.mjs --dia jue   # un día (mie|jue|vie)
node scripts/lista-puerta.mjs --csv       # para imprimir o mandar
```

**Ninguna API paga.** Las dos plataformas exportan CSV gratis desde su panel de
organizador. El API público de Startup Grind
(`GET /api/event/31263/`) sólo da conteos —`total_attendees` y el vendido por
tanda—, sirve para chequear stock pero no trae nombres ni mails.

El importador no asume las columnas: las detecta por nombre, arma el nombre
completo si viene partido en `First Name` / `Last Name`, y lo que no mapea lo
guarda en `extra`. Si alguna no la reconoce, la lista y la forzás con
`--map email="Attendee Email"`. Con `--dry` muestra el mapeo y los estados sin
escribir. Reimportar actualiza en vez de duplicar.

Cada plataforma tiene su vocabulario de estados (`approved`, `Completed`,
`Refunded`…) y el importador los traduce a uno solo. **A la puerta entran sólo
los confirmados**; pendientes y rechazados quedan afuera.

Sumar un canal nuevo es agregar una entrada a `CANALES` en el importador: la
tabla y la vista no se tocan.

> Como Startup Grind y la venta propia venden **la misma entrada**, alguien puede
> pagar dos veces. El script marca a quien aparece en los dos canales con un
> aviso, para revisar el reembolso.

**Cerrar la venta**: `update tiers set activo = false;`

## La pantalla de la puerta

`/puerta`. Se abre en el celular de cada persona del staff, se pone el PIN una
vez y queda.

Es **otra app**: su propio `index.html` y su propio bundle (`puerta/`), no una
ruta más del sitio. Comparte las funciones de `api/` y la paleta de
`src/marca.css`, y nada más — abrir la puerta en la fila de entrada no tiene por
qué bajar el Three.js del landing para mostrar una lista de nombres.

**Se busca por apellido; el QR es el atajo.** Al revés de lo que parece: la
mayoría compró por Startup Grind o se anotó en Luma y **no tiene QR nuestro**
(`acreditacion` les devuelve `token = null`). Un escáner solo dejaría afuera al
grueso de la fila. El botón de cámara sirve para quien compró por la web.

Tocar una fila abre su ficha; el botón grande la acredita; queda unos segundos
un **Deshacer**. Si ya entró, lo dice con la hora y ofrece acreditarla igual —
el caso real es alguien que vuelve de fumar, no un fraude.

**Se registra por día.** La entrada web habilita jueves *y* viernes: quien entró
el jueves tiene que poder entrar el viernes. Por eso hay una tabla `checkins`
—una fila por ingreso, con `dia`, `personas` y `por`— y no un booleano. Deshacer
no borra: anula (`anulado_en`), así se puede reconstruir qué pasó en la puerta.

`orders.ticket_used_at` y `asistentes_externos.checkin_en` siguen existiendo: se
escriben en el **primer** ingreso, y son lo que leen `/entrada/<token>` y
`scripts/lista-puerta.mjs`.

**Está hecha para que el wifi se caiga**, porque se va a caer:

- La lista del día se baja entera y se busca en memoria. Sin señal se sigue
  buscando y acreditando.
- Lo que no sale queda en una cola en el teléfono y se reintenta al volver la
  conexión. El `id` de cada ingreso lo genera el cliente, así que reintentar no
  duplica: el servidor hace upsert.
- Cada 10 s pregunta por lo que anotaron las otras puertas, para que dos
  personas no dejen entrar dos veces a la misma.

Lo único que necesita red es el escaneo: el token no viaja al celular del staff
—es la credencial de quien compró—, así que lo resuelve el servidor.

**Configuración**: `PUERTA_PIN` y `PUERTA_SECRET` en producción,
`PUERTA_TEST_PIN` y `PUERTA_TEST_SECRET` en desarrollo (ver `.env.example`). El
PIN tiene que ser largo: detrás está la lista completa con mails y teléfonos. Sin
las dos variables del entorno activo, el login devuelve 503.

```bash
vercel env add PUERTA_PIN production
vercel env add PUERTA_SECRET production
```

## Lo que queda afuera del código

- **Facturación.** Startup Grind factura lo suyo; lo que se venda acá lo facturás
  vos.
- **Reembolsos.** Se ejecutan desde el panel de Mercado Pago; después conviene
  poner la orden en `refunded`.
- **Términos y privacidad.** El modal pide nombre y mail (obligatorios) y
  teléfono y empresa (opcionales): corresponde linkear términos y
  política de datos.
