# Notas para agentes

## `.env.local` NO se sobrescribe. Nunca.

Ese archivo tiene credenciales que **no existen en ningún otro lado**: no está en
git (`*.local` en .gitignore, a propósito), el Vercel del proyecto es de otra
persona, y no hay Time Machine en esta máquina. Si se pisa, cada valor hay que
volver a sacarlo a mano del panel de Supabase, del de Mercado Pago y del de
Resend — y algunos, como `PUERTA_TEST_SECRET`, no salen de ningún panel porque
se generaron con `openssl` una vez.

Ya pasó: el 14/08 a las 17:26 una sesión lo reemplazó por una plantilla mínima
de cuatro claves —dos de ellas vacías— y se perdieron las otras veinte. El
síntoma llegó al día siguiente, como un 500 en `/api/puerta` que parecía un bug
del dev server.

Lo permitido es **agregar** una clave que falta, con Edit y dejando el resto
intacto. Escribir el archivo entero, no. Si hace falta una plantilla nueva, va a
`.env.example`, que sí está versionado y es justamente para eso.

## Después de editar `.env.local`, hay que reiniciar el dev server

Ctrl-C y `npm run dev` de nuevo. Un reinicio en caliente de Vite no alcanza:
`process.loadEnvFile` no pisa una clave que ya está en el proceso, **aunque esté
vacía**, así que editar el archivo parece no hacer nada. Está explicado en
`scripts/vite-plugin-api.mjs:137`, que además avisa al arrancar cuando el
proceso no tiene lo que dice el archivo.

## Para no tocar la base de producción

Supabase no conmuta por entorno: `SUPABASE_URL` apunta a la misma base en
desarrollo y en producción, así que en local se ve el padrón de verdad.

`npm run dev:local` levanta el Postgres de Docker con las migraciones y el seed,
e inyecta las variables por environment **sin tocar `.env.local`**. Es el modo
por defecto para desarrollar cualquier cosa que escriba en la base.
