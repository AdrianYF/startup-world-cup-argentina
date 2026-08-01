# Venta de entradas — puesta en marcha

Qué hay que hacer, una vez, para que la sección de Entradas cobre de verdad.
El código ya está; lo que falta son credenciales y configuración.

## Cómo funciona

```
Modal (datos)  →  POST /api/checkout  →  orden 'pending' + preferencia MP
                                              ↓
                                     Wallet Brick → Mercado Pago
                                              ↓
        /gracias?orden=…  ←  back_url          │
              ↓ poletea                        ↓
        GET /api/orden          POST /api/mp-webhook  ← valida firma, acredita
                                              ↓
                                    orden 'paid' + mail con QR
```

**El redirect a `/gracias` no acredita nada.** Esa URL se puede escribir a mano.
Lo único que pasa una orden a `paid` es el webhook, y sólo después de validar la
firma HMAC contra `MP_WEBHOOK_SECRET`.

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

Para probar en local hace falta que MP llegue a tu máquina:

```bash
npm run dev
cloudflared tunnel --url http://localhost:5173
# la URL que devuelve va como notification_url y como PUBLIC_SITE_URL
```

> `vite dev` **no** sirve las funciones de `api/`. Para probar el flujo completo
> en local hay que usar `vercel dev`. Sin eso, el sitio anda pero el modal corta
> con "El pago online no está disponible": es esperable.

## 3 · Resend

1. Alta en [resend.com](https://resend.com), API key.
2. Verificá el dominio (SPF + DKIM). **Son registros DNS que tenés que cargar
   donde esté hosteado el dominio** — es el paso más lento, conviene arrancarlo
   primero. Hasta que esté verificado, Resend sólo entrega a tu propia casilla.

## 4 · Variables

Copiá `.env.example` a `.env.local` y completalo. Después, las mismas en Vercel:

```bash
vercel env add MP_ACCESS_TOKEN production
```

Sólo `VITE_MP_PUBLIC_KEY` lleva el prefijo `VITE_`. Todo lo prefijado así se
inlinea en el JavaScript público: si le ponés `VITE_` a un secreto, queda
expuesto en el bundle.

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

## Operación

**Lista de quién compró** (para la puerta):

```sql
select buyer_name, buyer_email, tier_id, quantity, created_at
from orders where status = 'paid' order by created_at;
```

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
