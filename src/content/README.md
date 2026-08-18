# Contenido editable - Startup World Cup Argentina

Esta carpeta contiene **todo el contenido del sitio** en archivos JSON. Editá estos archivos para actualizar la web sin tocar código.

## Cómo editar

1. Abrí el archivo `.json` que quieras modificar (ver tabla abajo).
2. Cambiá los textos, precios, links, etc.
3. Hacé commit y push - el sitio se reconstruye automáticamente.

> 💡 Si nunca editaste JSON: respetá comillas dobles `"..."`, comas entre items, y no toques los `{` `}` `[` `]`.

## Archivos

| Archivo | Qué controla |
|---|---|
| `config.json` | Datos del evento (fechas, lugar, premio), links externos (Startup Grind, emails, redes), copies del Hero. |
| `etapas.json` | La Ruta de Evolución (5 etapas). |
| `tickets.json` | Planes de tickets (Básico, Básico Plus, Pro). Si cambian los precios o las features, editar acá. |
| `pitchBattle.json` | Las 3 stats del Pitch Battle (premio, jurado, top 10). |
| `buildersArena.json` | Las 3 cards de Builders Arena. |
| `partners.json` | Tiers de partners disponibles para vender. |
| `apoyan.json` | Partners ya confirmados con logo (3 categorías: Presenting / Community / Institutional). |
| `faqs.json` | Preguntas frecuentes. |
| `agenda.json` | Agenda de los 3 días (5/6/7 ago). |
| `blog.json` | Las notas del blog (`/blog`). La más nueva por fecha es la que se ve en el landing. |
| `speakers.json` | Speakers del evento. Cada entrada tiene `slug`, `nombre`, `rol`, `image`, `linkedin?`, `bio?`. |

## Agregar un speaker

1. Diseñá la tarjeta promo (vertical 4:5, mismo template que `/public/speakers/adrian-vilas.jpg`).
2. Subí la imagen a `/public/speakers/<slug>.jpg`.
3. Sumá una entrada a `speakers.json`:

```json
{
  "slug": "nombre-apellido",
  "nombre": "Nombre Apellido",
  "rol": "Rol · Empresa",
  "image": "/speakers/nombre-apellido.jpg",
  "linkedin": "https://linkedin.com/in/...",
  "bio": "Una frase corta sobre la persona."
}
```

Si dejás `linkedin` vacío, la tarjeta no es clickable. Cuando agregás un segundo speaker, el grid se autoexpande de 1 → 2 → 3 columnas.

## Links importantes en `config.json`

- `links.startupGrindUrl` - URL del evento en Startup Grind (no cambiar a menos que cambien la URL del evento).
- `links.formStartup` - URL del Google Form para que aplique una startup (pendiente).
- `links.formVoluntario` - URL del Google Form para voluntarios (pendiente).
- `links.formPartner` - URL del Google Form para partners interesados (pendiente).
- `links.emailPartners` - email de contacto comercial.

## Google Analytics

En `config.json`:

```json
"analytics": {
  "googleAnalyticsId": "G-XXXXXXXXXX",
  "anonymizeIp": true
}
```

- `googleAnalyticsId`: pegá acá tu Measurement ID de GA4 (formato `G-XXXXXXXXXX`). Si está vacío `""`, no se carga ningún tracking.
- `anonymizeIp`: dejar en `true` por buena práctica de privacidad.

**Eventos que se trackean automáticamente** (los vas a ver en GA4 → Reports → Engagement → Events):

| Evento | Cuándo se dispara | Parámetros |
|---|---|---|
| `page_view` | Carga de la página | (automático) |
| `ticket_click` | Click en cualquier botón "Conseguir Ticket" o "Tickets" | `source` (ej: `tickets-basico`, `hero`, `navbar`) |
| `apply_startup_click` | Click en "Aplicá tu Startup" | `has_form` (true/false según si está el Google Form configurado) |
| `apply_volunteer_click` | Click en "Quiero ser voluntari@" | `has_form` |
| `apply_partner_click` | Click en "Quiero ser Partner" | `has_form` |

## Logos y assets

Los logos viven en `/public/`. Para agregar uno nuevo:
1. Subí la imagen (PNG con fondo transparente) a `/public/` (ej: `/public/uai-logo.png`).
2. En `apoyan.json` cambiá `"img": null` por `"img": "/uai-logo.png"`.

## Validación

Si rompés el JSON, el sitio falla al buildear. Para validar antes de commitear:
- Pegá el contenido en https://jsonlint.com/ y verificá que diga "Valid JSON".

## Agregar una nota al blog

1. Sumá un objeto a `blog.json`. La nota más nueva por `fecha` es la que sale en el landing y arriba de todo en `/blog`, así que el orden dentro del archivo no importa.

```json
{
  "slug": "como-se-ve-en-la-url",
  "fecha": "2026-08-07",
  "titulo": "El título de la nota",
  "copete": "Una o dos líneas que resumen de qué se trata.",
  "imagen": "/startups/cromodata.jpg",
  "alt": "Qué se ve en la imagen, para quien no la ve",
  "cuerpo": ["Un párrafo.", "Otro párrafo."]
}
```

2. `felicitacion` es opcional: el saludo grande en dorado. Una nota sin él se ve igual de bien, sólo con título, copete y cuerpo.
3. El `slug` es la URL (`/blog/como-se-ve-en-la-url`). Una vez que se compartió, no lo cambies: el link viejo deja de funcionar.
