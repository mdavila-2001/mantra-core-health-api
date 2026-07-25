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
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
]);

