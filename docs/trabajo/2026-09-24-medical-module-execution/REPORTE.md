# Reporte — actualización segura de credenciales profesionales propias

- Fecha: 2026-09-24 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/medical-module-execution-20260924` (API)
- Peldaño de evidencia alcanzado: `VERIFIED` para H1.S1.M3 en la API; no representa el cierre del plan Médico global.
- Avance de este tramo: 5 / 5 microtareas API `HECHO`; 3 / 3 microtareas frontend verificadas. El plan Médico maestro sigue abierto.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M3-API-01 | Se escribieron antes de implementar los tests de servicio, repositorio y controlador para PATCH, propietario, estado y serialización. | `corepack yarn test --runInBand src/modules/profiles/services/profiles-practitioners.service.spec.ts src/modules/profiles/repositories/professional-credentials.repository.spec.ts src/modules/profiles/controllers/profiles-practitioners.controller.spec.ts` | RED inicial: `Test Suites: 3 failed, 3 total`; `Tests: 13 failed, 135 passed, 148 total`. Faltaban caso de uso, ruta y lectura con bloqueo. |
| H1.S1.M3-API-02 | Se agregó DTO allowlist, caso de uso autenticado, validación del archivo propio, serialización con verificación/retiro y specs de las capas. | `corepack yarn test --runInBand src/modules/profiles`; `corepack yarn typecheck`; `corepack yarn eslint --max-warnings=0 <archivos tocados>`; `corepack yarn build` | `Test Suites: 18 passed, 18 total`; `Tests: 402 passed, 402 total`; typecheck, ESLint y build terminaron con exit code `0`. |
| H1.S1.M3-API-03 | Se incorporaron PATCH y DTO al contrato OpenAPI versionado. | `DB_HOST=127.0.0.1 DB_PORT=55439 DB_USER=josejeremias DB_PASSWORD=ephemeral DB_NAME=postgres ORM_SCHEMA_SYNC=off RATE_LIMIT_DISABLED=true node tools/openapi/generate-openapi.mjs`; `corepack yarn docs:openapi:lint` | `OpenAPI generado: 1251 paths, 1361 operaciones, 1215 esquemas.`; `openapi/openapi.yaml: validated in 309ms`; `Your API description is valid.` |
| H1.S1.M3-API-04 | La prueba HTTP en PostgreSQL 18 temporal probó persistencia, mass assignment, aislamiento entre cuentas, autenticación y espera de bloqueo real. | `DB_HOST=127.0.0.1 DB_PORT=55440 DB_USER=josejeremias DB_PASSWORD=ephemeral DB_NAME=mch_medical_test ORM_SCHEMA_SYNC=safe RATE_LIMIT_DISABLED=true SEED_ON_BOOT=false node --experimental-vm-modules node_modules/jest-cli/bin/jest.js --config ./test/jest-integration.json --runInBand test/integration/practitioner-own-credential.int-spec.ts` | `Test Suites: 1 passed, 1 total`; `Tests: 4 passed, 4 total`. |
| H1.S1.M3-API-05 | La API admite el PDF por fila, reclama sólo precargas anónimas PDF/`DOCUMENT` y guarda tres credenciales con archivos distintos dentro del alta transaccional. Reutilizar un archivo ya reclamado devuelve 422 y no crea la segunda cuenta. | `corepack yarn test --runInBand src/modules/iam/dto/register-practitioner.dto.spec.ts src/modules/iam/services/iam-practitioner-self-registration.service.spec.ts`; `DB_HOST=127.0.0.1 DB_PORT=55440 DB_USER=josejeremias DB_PASSWORD=ephemeral DB_NAME=mch_medical_test ORM_SCHEMA_SYNC=safe RATE_LIMIT_DISABLED=true SEED_ON_BOOT=false node --experimental-vm-modules node_modules/jest-cli/bin/jest.js --config ./test/jest-integration.json --runInBand test/integration/practitioner-credential-registration-files.int-spec.ts` | `2 suites / 98 tests passed`; integración `1 suite / 1 test passed`; typecheck, lint dirigido y build exit 0. |
| H1-FE.S1 | La pantalla médica sube PDFs secuencialmente, asocia cada respuesta a su fila, conserva cargas completadas al reintentar y no envía el alta si una carga falla. | En worktree temporal sin `.env`: `corepack yarn test --watch=false --include=src/app/features/auth/register-practitioner/register-practitioner.spec.ts`; `corepack yarn typecheck`; ESLint dirigido; `corepack yarn build`; `E2E_BASE_URL=http://127.0.0.1:4387 corepack yarn pw playwright/registro-doctor-universidad-y-profesiones.spec.ts --workers=1 --reporter=list` | `97/97` tests de componente; `4/4` Playwright; typecheck, ESLint y build exit 0; captura móvil revisada en el plan frontend. |

## A medias

Ninguna de las cinco microtareas API ni las tres frontend de este tramo. No se ejecutó todavía una corrida compuesta de navegador contra la API real; el alcance médico restante sigue en el plan maestro.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| MED-E01 — recorrido navegador con API real | EN CURSO | La pantalla y la API se probaron por separado; falta componer ambos servicios en una corrida del alta real. |
| H1.S1.M2 y H2–H8 | TODO | Seguir el plan maestro en orden, con auditoría del contrato y DoD de cada microtarea antes de editar. |
| MED-E02 — catálogo normativo de colegio/matrícula | BLOQUEADO | Confirmación del catálogo oficial y sus reglas por el responsable funcional/regulatorio. |

## Evidencia

Salida de la suite de perfiles, repetida sobre el diff final:

```text
Test Suites: 18 passed, 18 total
Tests:       402 passed, 402 total
Snapshots:   0 total
Time:        4.293 s, estimated 5 s
Ran all test suites matching src/modules/profiles.
```

Los siguientes comandos finalizaron con `exit_code: 0` (sin salida estándar):

```text
corepack yarn typecheck
corepack yarn eslint --max-warnings=0 <archivos tocados>
corepack yarn build
git diff --check
```

Salida del linter OpenAPI:

```text
validating openapi/openapi.yaml using lint rules for api 'alovida-health@v1'...
openapi/openapi.yaml: validated in 309ms
Your API description is valid.
```

La integración usó base temporal local aislada, tablas creadas desde el esquema canónico y catálogos sintéticos del repositorio. El test leyó el cambio por HTTP después de persistirlo y comprobó una espera observada en `pg_stat_activity` mientras otra transacción sostenía el lock. Salida literal del runner:

```text
Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Time:        6.63 s, estimated 21 s
Ran all test suites matching test/integration/practitioner-own-credential.int-spec.ts.
```

La generación ejecutada en la instancia temporal informó:

```text
44/44 rutas públicas marcadas, 232 tags globales, 932 descripciones y 10506 respuestas de error añadidas.
OpenAPI generado: 1251 paths, 1361 operaciones, 1215 esquemas.
```

El artefacto versionado conserva la operación y el esquema de esta ruta, incluido el nuevo `fileId`, sin arrastrar diferencias históricas ajenas que la generación completa habría reescrito. El linter OpenAPI volvió a validar el artefacto final.

La pantalla se navegó en Chromium con una trabajadora y se comprobó el texto de persistencia, el filtro PDF y el diseño a 390 px. Captura inspeccionada: `wt-medical-execution-fe/docs/trabajo/2026-09-24-medical-credential-attachments/evidence/alta-titulos-movil.png`.

## No cubierto

La subida de PDF por navegador hacia un servidor API real aún no se probó como recorrido compuesto. El resto del plan médico y el catálogo normativo de matrícula/colegio siguen abiertos según la matriz maestra.

## Desvíos del plan

- El `AGENTS.md` de la raíz del workspace limita el trabajo ordinario a cambios visuales; la instrucción posterior del propietario fue ejecutar el plan Médico completo. Por esa autorización explícita se abrió esta microtarea API aislada, derivada del archivo médico indicado, y se registró la ampliación de alcance en el ledger del plan maestro.
- Docker no estaba disponible y PostgreSQL 16 local no tenía la extensión `vector`; el primer bootstrap falló antes de llegar al endpoint. Se levantó PostgreSQL 18 temporal en `/tmp`, se instaló localmente `pgvector 0.8.6` y se repitió la prueba HTTP con PostgreSQL real. No se cambió DDL ni se omitió una dependencia.
- La generación completa de OpenAPI exponía diffs históricos no relacionados; tras generar y validar el resultado, se integró sólo PATCH y su DTO en YAML/JSON versionados.
- La integración de credenciales usó sólo tres PDF sintéticos; la limpieza por cuenta eliminó los archivos de la base temporal. Las precargas abandonadas conservan la deuda ya existente del endpoint y no se amplió a retención/limpieza.

## Riesgos residuales

- El catálogo normativo de colegio/matrícula y el catálogo SEGIP siguen sin confirmar; esta ruta reutiliza tipos de credencial ya existentes y no los redefine.
- Los warnings preexistentes de importación JSON de Jest y nombres DTO duplicados del generador OpenAPI permanecen fuera del alcance.
- La prueba ejercita la API real sobre base local sintética; no certifica proveedor documental externo, frontend, despliegue ni datos de producción.

## Decisiones y ambigüedades

- La identidad del propietario se obtiene de la sesión autenticada; un ID ajeno devuelve 404 como el caso inexistente. El cliente no puede modificar estado, propietario ni datos de verificación.
- Se reutilizan `professional_credentials.file_id` y `AttachableFileService.assertUsableBy`; sólo se acepta archivo utilizable del mismo actor.
- Durante el registro, cada `credentials[].fileId` debe ser una precarga PDF de `DOCUMENT`; `claimAnonymousUpload` asigna owner y tenant DEFAULT dentro de la transacción.
- Se bloquea la fila al actualizar, verificar y retirar para serializar la edición con decisiones de revisión concurrentes.
- No se resuelven aquí la denominación normativa de matrícula/colegio ni el catálogo oficial de ocupaciones; deben confirmarse con el propietario funcional/regulatorio registrado en la matriz maestra.
- No se leyeron ni guardaron datos de pacientes o credenciales reales. No se editaron `.env`, `proxy.conf.json`, `mantra-core-health-model`, DDL ni archivos de propiedad del trabajo Paciente.
