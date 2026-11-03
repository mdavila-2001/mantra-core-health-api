// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    // El catálogo generado (`yarn orm:catalog`) queda fuera del linter por el
    // mismo motivo que fuera de Prettier: son ~13 300 tuplas de una línea y
    // reformatearlas multiplica por siete el tamaño de cada archivo, rompiendo
    // el límite de 300 líneas del proyecto. Ver .prettierignore.
    ignores: [
      'eslint.config.mjs',
      'tools/**/*.js',
      'tools/**/*.mjs',
      'src/orm/catalog/indexes/**',
      'src/orm/catalog/foreign-keys/**',
      'src/orm/catalog/schemas.catalog.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // L-3 · ningún `any` nuevo. `recommendedTypeChecked` ya la trae en
      // `error`; se declara para que no dependa del preset. Las únicas
      // excepciones son los bloques de abajo: specs y `test/**` (fuera del
      // alcance de L-3) y la lista cerrada de `*.testing.ts` que ya los tenían.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],
      // Callbacks transaccionales y adapters implementan contratos Promise aun
      // cuando una rama concreta resuelve sin I/O. `async` conserva el contrato
      // de la interfaz; exigir un `await` artificial no aporta seguridad.
      '@typescript-eslint/require-await': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    // Los dobles/mocks de prueba modelan dependencias grandes mediante objetos
    // parciales. Exigir tipado type-aware exhaustivo en esos fixtures generaba
    // más de 23 000 falsos positivos sin proteger el runtime. Las reglas siguen
    // activas y bloqueantes en todo archivo productivo.
    files: ['**/*.spec.ts', '**/*.testing.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    // Specs e integración: los dobles parciales siguen pudiendo usar `any`.
    // Un `*.testing.ts` nuevo, en cambio, cae en la regla general (L-3).
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // L-3 · lista CERRADA de los `*.testing.ts` que al 2026-10-31 tienen `any`
    // (131 usos según ESLint; detalle en docs/calidad/any-existentes.md).
    // VENCE el 2027-01-15: para esa fecha cada archivo se tipa y sale de la
    // lista. No se agregan archivos: un `any` nuevo es un error de lint.
    files: [
      'src/common/seed/glossary-seed.testing.ts',
      'src/modules/accounting/services/accounting-scope.testing.ts',
      'src/modules/authz/services/authz-clinical-scope.testing.ts',
      'src/modules/consent/services/consent-scope.testing.ts',
      'src/modules/delegated_access/services/delegation-scope.testing.ts',
      'src/modules/delegated_access/services/prescription-shares.testing.ts',
      'src/modules/pharmacy_inventory/application/scope/pharmacy-inventory-scope.testing.ts',
      'src/modules/scheduling/application/bookings/payment-receipts.testing.ts',
      'src/modules/scheduling/application/bookings/scheduling-bookings.testing.ts',
      'src/modules/scheduling/application/catalog/scheduling-catalog.testing.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
