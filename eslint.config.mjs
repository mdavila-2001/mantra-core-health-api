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
      '@typescript-eslint/no-explicit-any': 'off',
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
]);
