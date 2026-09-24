# Reporte — actualización segura de credenciales profesionales propias

- Fecha: 2026-09-24 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/medical-module-execution-20260924` (API)
- Peldaño de evidencia alcanzado: `VERIFIED` para H1.S1.M3 en la API; no representa el cierre del plan Médico global.
- Avance: 4 / 4 microtareas `HECHO` (100 %).

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M3-API-01 | Se escribieron antes de implementar los tests de servicio, repositorio y controlador para PATCH, propietario, estado y serialización. | `corepack yarn test --runInBand src/modules/profiles/services/profiles-practitioners.service.spec.ts src/modules/profiles/repositories/professional-credentials.repository.spec.ts src/modules/profiles/controllers/profiles-practitioners.controller.spec.ts` | RED inicial: `Test Suites: 3 failed, 3 total`; `Tests: 13 failed, 135 passed, 148 total`. Faltaban caso de uso, ruta y lectura con bloqueo. |
| H1.S1.M3-API-02 | Se agregó DTO allowlist, caso de uso autenticado, validación del archivo propio, serialización con verificación/retiro y specs de las capas. | `corepack yarn test --runInBand src/modules/profiles`; `corepack yarn typecheck`; `corepack yarn eslint --max-warnings=0 <archivos tocados>`; `corepack yarn build` | `Test Suites: 18 passed, 18 total`; `Tests: 402 passed, 402 total`; typecheck, ESLint y build terminaron con exit code `0`. |
| H1.S1.M3-API-03 | Se incorporaron PATCH y DTO al contrato OpenAPI versionado. | `DB_HOST=127.0.0.1 DB_PORT=55439 DB_USER=josejeremias DB_PASSWORD=ephemeral DB_NAME=postgres ORM_SCHEMA_SYNC=off RATE_LIMIT_DISABLED=true node tools/openapi/generate-openapi.mjs`; `corepack yarn docs:openapi:lint` | `OpenAPI generado: 1251 paths, 1361 operaciones, 1215 esquemas.`; `openapi/openapi.yaml: validated in 309ms`; `Your API description is valid.` |
| H1.S1.M3-API-04 | La prueba HTTP en PostgreSQL 18 temporal probó persistencia, mass assignment, aislamiento entre cuentas, autenticación y espera de bloqueo real. | `DB_HOST=127.0.0.1 DB_PORT=55440 DB_USER=josejeremias DB_PASSWORD=ephemeral DB_NAME=mch_medical_test ORM_SCHEMA_SYNC=safe RATE_LIMIT_DISABLED=true SEED_ON_BOOT=false node --experimental-vm-modules node_modules/jest-cli/bin/jest.js --config ./test/jest-integration.json --runInBand test/integration/practitioner-own-credential.int-spec.ts` | `Test Suites: 1 passed, 1 total`; `Tests: 4 passed, 4 total`. |

## A medias

Ninguna de las cuatro microtareas API de este plan local. El alcance funcional médico completo sigue abierto en el plan maestro; ver `Pendiente` y los archivos de trazabilidad compartidos.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H1.S1.M3 (plan maestro Médico) — integración de la pantalla profesional y validación visual | EN CURSO | Continuar en el worktree frontend aislado; ejecutar su spec y la evidencia visual requerida por `AGENTS.md`. |
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

El artefacto versionado conserva la operación y el esquema de esta ruta, sin arrastrar diferencias históricas ajenas que la generación completa habría reescrito.

## No cubierto

Ninguna línea de código de este alcance queda sin las verificaciones declaradas arriba. La UI, el resto del plan médico, el catálogo normativo de matrícula/colegio y las integraciones externas no forman parte de esta entrega API.

## Desvíos del plan

- El `AGENTS.md` de la raíz del workspace limita el trabajo ordinario a cambios visuales; la instrucción posterior del propietario fue ejecutar el plan Médico completo. Por esa autorización explícita se abrió esta microtarea API aislada, derivada del archivo médico indicado, y se registró la ampliación de alcance en el ledger del plan maestro.
- Docker no estaba disponible y PostgreSQL 16 local no tenía la extensión `vector`; el primer bootstrap falló antes de llegar al endpoint. Se levantó PostgreSQL 18 temporal en `/tmp`, se instaló localmente `pgvector 0.8.6` y se repitió la prueba HTTP con PostgreSQL real. No se cambió DDL ni se omitió una dependencia.
- La generación completa de OpenAPI exponía diffs históricos no relacionados; tras generar y validar el resultado, se integró sólo PATCH y su DTO en YAML/JSON versionados.

## Riesgos residuales

- El catálogo normativo de colegio/matrícula y el catálogo SEGIP siguen sin confirmar; esta ruta reutiliza tipos de credencial ya existentes y no los redefine.
- Los warnings preexistentes de importación JSON de Jest y nombres DTO duplicados del generador OpenAPI permanecen fuera del alcance.
- La prueba ejercita la API real sobre base local sintética; no certifica proveedor documental externo, frontend, despliegue ni datos de producción.

## Decisiones y ambigüedades

- La identidad del propietario se obtiene de la sesión autenticada; un ID ajeno devuelve 404 como el caso inexistente. El cliente no puede modificar estado, propietario ni datos de verificación.
- Se reutilizan `professional_credentials.file_id` y `AttachableFileService.assertUsableBy`; sólo se acepta archivo utilizable del mismo actor.
- Se bloquea la fila al actualizar, verificar y retirar para serializar la edición con decisiones de revisión concurrentes.
- No se resuelven aquí la denominación normativa de matrícula/colegio ni el catálogo oficial de ocupaciones; deben confirmarse con el propietario funcional/regulatorio registrado en la matriz maestra.
- No se leyeron ni guardaron datos de pacientes o credenciales reales. No se editaron `.env`, `proxy.conf.json`, `mantra-core-health-model`, DDL ni archivos de propiedad del trabajo Paciente.
