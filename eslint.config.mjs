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
  {
    // E2 · raw SQL must run inside the request transaction, which is where
    // `app.current_tenant_id` (RLS) lives. `em.getConnection().execute(sql, params,
    // method)` without the 4th `ctx` argument leaves it for another pool
    // connection with no tenant; `em.execute(sql, params, method)` stays in it.
    // Specs, `*.testing.ts` and `test/**` are out of scope: integration specs
    // prepare data as the owner role on purpose.
    files: ['src/**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.testing.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name='execute'][callee.object.type='CallExpression'][callee.object.callee.property.name='getConnection'][arguments.length<4]",
          message:
            'Raw SQL through getConnection() skips the request transaction and its RLS tenant. Use em.execute(sql, params, method).',
        },
        {
          selector:
            "CallExpression[callee.property.name='execute'][callee.object.type='CallExpression'][callee.object.callee.property.name='getConnection'][arguments.3.type='Identifier'][arguments.3.name='undefined']",
          message:
            'Passing undefined as ctx to getConnection().execute skips the request transaction. Use em.execute(sql, params, method, loggerContext).',
        },
        {
          selector:
            "CallExpression[callee.property.name='execute'][callee.object.type='CallExpression'][callee.object.callee.property.name='getConnection'][arguments.3.type='UnaryExpression'][arguments.3.operator='void']",
          message:
            'Passing void 0 as ctx to getConnection().execute skips the request transaction. Use em.execute(sql, params, method, loggerContext).',
        },
        {
          selector:
            "CallExpression[callee.property.name='execute'][callee.object.type='CallExpression'][callee.object.callee.property.name='getDriver'][arguments.length<4]",
          message:
            'Raw SQL through getDriver() runs outside the request transaction and its RLS tenant. Use em.execute(sql, params, method).',
        },
        {
          selector:
            "VariableDeclarator[init.type='CallExpression'][init.callee.property.name='getConnection']",
          message:
            'Do not keep getConnection() in a variable: its execute() skips the request transaction and its RLS tenant. Call em.execute(sql, params, method).',
        },
      ],
    },
  },
  {
    // E2 · CLOSED list of the files that still hold raw SQL without ctx, as of
    // 2026-11-04 (40 files). EXPIRES 2027-01-15: by then each file
    // is converted to `em.execute` (or its table is confirmed without RLS and
    // it moves to an explicit `ctx`) and leaves the list. Files are NOT added:
    // new raw SQL without ctx is a lint error. Inline disables are not used
    // because several of these files sit exactly at their max-lines ceiling.
    files: [
      // Not converted in this change: the scan found no RLS-forced table named in
      // these functions, or they belong to another workstream (surveys,
      // permission-drift). Review each before the expiry date.
      'src/app-readiness.service.ts',
      'src/common/auth/session-validator.ts',
      'src/common/seed/glossary-seed.service.ts',
      'src/modules/billing/services/procedure-import.service.ts',
      'src/modules/billing/services/procedure-nomenclature.service.ts',
      'src/modules/billing/services/procedure-reference.reader.ts',
      'src/modules/chart/repositories/clinical-notes.repository.ts',
      'src/modules/clinical/services/terminology-study-catalog.adapter.ts',
      'src/modules/community/repositories/moderation.repository.ts',
      'src/modules/community/repositories/polls.repository.ts',
      'src/modules/community/repositories/reactions.repository.ts',
      'src/modules/data_catalog/application/fit/fit-runs.repository.ts',
      'src/modules/insurance/infrastructure/repositories/prior-auth.repository.ts',
      'src/modules/marketing/repositories/insights-facts.repository.ts',
      'src/modules/medical_centers/repositories/medical-center-offers.repository.ts',
      'src/modules/observability/application/operation-catalog.service.ts',
      'src/modules/pharmacy/repositories/pharmacy-read.repository.ts',
      'src/modules/pharmacy_inventory/infrastructure/repositories/inventory-read.repository.ts',
      'src/modules/platform_ops/repositories/ops-tools.repository.ts',
      'src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts',
      'src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts',
      'src/modules/profiles/infrastructure/repositories/related-persons.repository.ts',
      'src/modules/qa_execution/services/qa-execution.service.ts',
      'src/modules/read_models/services/projection-executor.service.ts',
      'src/modules/read_models/services/public-projections.service.ts',
      'src/modules/read_models/services/read-model-definitions.service.ts',
      'src/modules/study_catalog/repositories/study-catalog.repository.ts',
      'src/modules/terminology/repositories/catalog-concepts.repository.ts',
      'src/modules/terminology/repositories/concept-relationships.repository.ts',
      'src/modules/terminology/repositories/value-sets.repository.ts',
      'src/modules/time_series/repositories/timescale.repository.ts',
      'src/orm/bootstrap/schema-bootstrap.service.ts',
      'src/orm/config/runtime-role.guard.ts',
      'src/orm/fidelity/schema-fidelity.service.ts',
      'src/persistence/adapters/postgres/postgres.connection.ts',
      // No RLS tables in E2 (E2-D3): converting them fixes nothing.
      'src/modules/insurance/application/services/insurance-analytics.service.ts',
      'src/modules/pharmacy_inventory/infrastructure/repositories/prescription-balance.repository.ts',
      'src/modules/scheduling/infrastructure/repositories/scheduling-payment-receipts.repository.ts',
      'src/orm/subscribers/history-mirror.subscriber.ts',
      // Left out of E3 by decision (permission drift); review before the expiry date.
      'src/modules/data_catalog/application/permission-drift.service.ts',
    ],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]);
