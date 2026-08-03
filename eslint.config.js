import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // `api/` y `scripts/` también. Hasta acá el glob de arriba era `**/*.{ts,tsx}`
  // y nada más, así que 33 archivos versionados —toda la lógica de cobro
  // incluida— no los miraba el linter.
  //
  // Sin las reglas de React ni las de TypeScript: son Node plano. Lo que importa
  // acá es lo que atrapa `js.configs.recommended` — variables que no existen,
  // `case` sin `break`, promesas mal escritas.
  {
    files: ['api/**/*.js', 'scripts/**/*.mjs', '*.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // `const { registrado_en: _, ...f } = fila` es cómo se saca una clave de un
      // objeto, y el `_` que queda no es una variable olvidada: es la forma del
      // idioma. `ignoreRestSiblings` es exactamente ese caso.
      'no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
    },
  },
])
