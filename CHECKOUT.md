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
               le pregunta a MP)      orden 'paid' + mail con QR
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
2. En el SQL Editor, corré `supabase/migrations/0001_checkout.sql`.
3. **Ajustá el `stock_total` del seed.** Está en 20 generales / 10 VIP, que es un
   número de ejemplo. Es cuántas entradas querés vender *por la web* — Startup
   Grind sigue vendiendo su propio cupo, y los dos stocks son independientes.

```sql
update tiers set stock_total = 25 where id = 'general';
```

## 2 · Mercado Pago

App **startupworldcupar** (`1003572338407990`) en
[Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app).

1. Copiá la **public key** y el **access token**. Arrancá con los de *test*.
2. Webhooks → Configurar notificación:
   - URL: `https://<tu-dominio>/api/mp-webhook`
   - Evento: **Pagos**
   - Revelá la **clave secreta** → esa es `MP_WEBHOOK_SECRET`.

Ver **[Probar en local](#probar-en-local)** más abajo.

## 3 · Resend

El mail está hecho con [React Email](https://react.email/docs/integrations/resend):
el template es un componente en `api/_lib/emails/entrada.tsx` y se le pasa a
Resend por la prop `react`, que lo renderiza a HTML del lado de ellos. Los
componentes ya resuelven las tablas anidadas y los estilos inline que los
clientes de mail necesitan — el render sale con 14 tablas, 48 estilos inline y
cero bloques `<style>`, que es lo que Gmail descarta.

1. Alta en [resend.com](https://resend.com), API key → `RESEND_API_KEY`.
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

Copiá `.env.example` a `.env.local` y completalo. Después, las mismas en Vercel:

```bash
vercel env add MP_ACCESS_TOKEN production
```

Sólo `VITE_MP_PUBLIC_KEY` lleva el prefijo `VITE_`. Todo lo prefijado así se
inlinea en el JavaScript público: si le ponés `VITE_` a un secreto, queda
expuesto en el bundle.

## Probar en local

Dos procesos, y con eso `npm run dev` en **:5173** sirve el sitio *y* las
funciones:

```bash
supabase start   # Postgres local en Docker; aplica supabase/migrations/ solo
npm run dev      # http://localhost:5173
```

Las funciones corren dentro del dev server gracias a `scripts/vite-plugin-api.mjs`.
Sin ese plugin, Vite no conoce `/api/*` y cae al fallback de la SPA: un GET
devuelve el index.html con 200 pero **un POST devuelve 404**, porque el fallback
sólo aplica a GET/HEAD. Ese 404 parecía un bug del checkout y no lo era.

`supabase start` imprime la **API URL** y la **Secret key**: van a `SUPABASE_URL`
y `SUPABASE_SERVICE_ROLE_KEY`. Son de un Postgres en tu máquina, no tocan nada
remoto. `supabase stop` lo baja.

Comprobá que están vivas:

```bash
curl localhost:5173/api/tiers
# {"tiers":[{"id":"general","precio":35000,"disponible":20}, …]}   ← ok
# {"error":"tiers_unavailable"}   ← falta SUPABASE_URL / SERVICE_ROLE_KEY
# <!doctype html>                 ← el plugin no cargó; reiniciá el dev server
```

### Sin túnel

Con `PUBLIC_SITE_URL=http://localhost:5173` el pago funciona de punta a punta.

No llegan webhooks (MP no alcanza `localhost`), pero **no hace falta**: al volver
al sitio, la reconciliación de `/api/orden` le pregunta a MP y acredita sola. La
única diferencia es que el mail no se manda hasta que haya `RESEND_API_KEY`.

El límite real es de Mercado Pago: **no hay `auto_return`**, porque lo rechaza si
`back_urls.success` no es pública (la preferencia falla entera con
`invalid_auto_return`). O sea que al terminar de pagar hay que tocar "Volver al
sitio" a mano; ahí sí se abre el modal de felicitaciones.

### Con túnel, para probar el webhook de verdad

```bash
cloudflared tunnel --url http://localhost:5173
```

1. Poné esa URL en `PUBLIC_SITE_URL` y reiniciá `npm run dev`. Sin esto las
   `back_urls` apuntan a localhost y al pagar no volvés a ningún lado.
2. Cargala en el panel de MP como `https://<túnel>/api/mp-webhook`, evento
   **Pagos**.
3. Copiá la clave secreta que revela el panel a `MP_WEBHOOK_SECRET`.

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

Antes de pasar a producción, pasá el `quality_checklist` del MCP de Mercado Pago
contra la app.

## La lista de la puerta

El evento entra por dos canales y hasta la acreditación viven separados:

| día | canal | de dónde sale |
|---|---|---|
| Miércoles 5 (side events) | Luma, con aprobación del host | CSV importado |
| Jueves 6 y viernes 7 | venta propia | tabla `orders` |

```bash
# 1. Bajá el CSV de Luma: evento → pestaña Guests → ícono Download.
#    (Si filtrás la lista antes, te deja exportar sólo lo filtrado.)
node scripts/importar-luma.mjs ~/Downloads/guests.csv --evento quzhnee8

# 2. La lista unificada
node scripts/lista-puerta.mjs             # tabla, ordenada por apellido
node scripts/lista-puerta.mjs --dia mie   # sólo un día (mie|jue|vie)
node scripts/lista-puerta.mjs --csv       # para imprimir o mandar
```

El importador **no necesita la API paga de Luma**: trabaja sobre el CSV que el
panel exporta gratis. Detecta las columnas por nombre —Luma las cambia entre
versiones y cada evento suma sus preguntas custom— y lo que no mapea lo guarda en
`extra`, así no se pierde nada del archivo. Reimportar actualiza en vez de
duplicar. Con `--dry` te muestra qué detectó sin escribir.

De Luma sólo entran a la lista los **aprobados**: los pendientes y rechazados
quedan afuera. Quien viene por los dos canales aparece dos veces a propósito (son
días distintos), y el script lo avisa aparte para que no lo cuentes doble.

**Marcar una entrada como usada**: hoy se hace a mano. El QR abre
`/entrada/<token>`, que muestra el ticket y avisa si ya está usada, pero no hay
app de escaneo que la marque sola.

```sql
update orders set ticket_used_at = now() where ticket_token = '<token>';
```

**Cerrar la venta**: `update tiers set activo = false;`

## Lo que queda afuera del código

- **Facturación.** Startup Grind factura lo suyo; lo que se venda acá lo facturás
  vos.
- **Reembolsos.** Se ejecutan desde el panel de Mercado Pago; después conviene
  poner la orden en `refunded`.
- **Términos y privacidad.** El modal pide nombre, mail y DNI: corresponde
  linkear términos y política de datos.
