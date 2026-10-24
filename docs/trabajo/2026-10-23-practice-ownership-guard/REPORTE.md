# Reporte — Un médico solo ve las prácticas donde tiene una vinculación ACTIVE

- Fecha: 2026-10-23 · Plan: [PLAN.md](./PLAN.md) · Rama: `claude/adoring-fermat-cfc4zb` · PR: [#678](https://github.com/mdavila-2001/mantra-core-health-api/pull/678) (**mergeado** en `dev` el 2026-10-24, commit `00a07330`) · Base: `origin/dev`
- Este plan, el reporte y la evidencia se subieron un minuto después del merge de #678 y no entraron; llegan en un PR aparte desde `justin/practice-ownership-report`.
- Peldaño de evidencia alcanzado: **TESTED**. Pasan los tests unitarios dirigidos al cambio, typecheck y lint dan 0, y la suite completa no tiene fallos nuevos atribuibles al cambio. **No es VERIFIED:** el camino real (HTTP + Postgres) no se ejercitó, porque el int-spec no se pudo correr.
- Avance: 9 / 10 microtareas HECHO (90 %). 1 BLOQUEADO (H1.S2.M4).

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Regla `practiceAccessScope` + `PracticeAccessService` | `jest --testPathPatterns=practice-access` | verde (ver `evidencia/yarn-test-practice-accounting.txt`) |
| H1.S1.M2 | Contabilidad usa la regla compartida, mismos 422 | `yarn test --testPathPatterns='src/modules/(practice\|accounting)/'` | `Tests: 285 passed, 285 total` |
| H1.S2.M1 | `GET /practices` filtra para PRACTITIONER | ídem | verde |
| H1.S2.M2 | La consola responde 404 sin vinculación ACTIVE, sin leer plantilla, legajo ni inventario | ídem | verde |
| H1.S2.M3 | El controlador pasa el actor | ídem | verde |
| H1.S3.M1 | Typecheck | `yarn typecheck` | `TYPECHECK_EXIT=0` |
| H1.S3.M2 | Lint | `yarn lint --max-warnings=0` | `LINT_EXIT=0` |
| H1.S3.M3 | OpenAPI regenerado | `node tools/openapi/generate-openapi.mjs` | `openapi.json`/`.yaml`: solo la `description` de `GET /practices`; `endpoints/practice.md` regenerado |
| H1.S3.M4 | Documentación de autorización | — | nueva sección en `docs/api/authorization.md` |
| H1.S3.M5 | Suite completa | `yarn test` | `Tests: 2 failed, 1 skipped, 10703 passed`; los 2 fallos se explican en Riesgos residuales |

## A medias

### H1 — Las lecturas de práctica respetan la vinculación del médico
- Qué anda: la regla y los dos endpoints, probados con unitarios. Esos unitarios usan los servicios de acceso reales sobre un repositorio de vinculaciones en memoria que filtra por estado y vigencia.
- Qué no anda: nada que se haya observado.
- Qué falta exactamente: correr `test/integration/practice-ownership.int-spec.ts` contra Postgres (`yarn test:integration --testPathPatterns=practice-ownership`). Es la única prueba que ejercita JWT real, el auto-registro en `DEFAULT` y la consulta real de vinculaciones.
- Dónde quedó: en `dev`, por el merge de #678. El int-spec está en `test/integration/practice-ownership.int-spec.ts`.

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H1.S2.M4 | BLOQUEADO | (1) Arreglar en `dev` el arranque roto por `choiceOptionsOf` (ver Riesgos residuales); (2) correrlo con el stack del compose (Postgres con TimescaleDB/pgvector, Mongo, Redis, OpenSearch) |
| Merge de #678 | HECHO | Aprobado por PabloArauzCaballero y mergeado el 2026-10-24 |

## Evidencia

Salidas en `evidencia/`. Extractos literales:

```
$ yarn test --testPathPatterns='src/modules/(practice|accounting)/'
Test Suites: 29 passed, 29 total
Tests:       285 passed, 285 total
EXIT=0

$ yarn typecheck            → TYPECHECK_EXIT=0
$ yarn lint --max-warnings=0 → LINT_EXIT=0

$ yarn test
  ● Artículos enciclopédicos de autoría propia del glosario › cada artículo llega al piso de 2.000 palabras
  ● XlsxParser · celda-numerica (sólo XLSX, sin gemelo CSV) › reporta un problema cuando la fórmula no tiene valor cacheado
Test Suites: 2 failed, 1 skipped, 870 passed, 872 of 873 total
Tests:       2 failed, 1 skipped, 10703 passed, 10706 total
```

## No cubierto

- `test/integration/practice-ownership.int-spec.ts`: escrito y compila (entra en `tsc`), pero **no llegó a pasar**. El 2026-10-24 se intentó sobre Postgres 16 local, sin Docker. Sin parche, el arranque cae por `choiceOptionsOf`. Con un parche local temporal de `forms` (no commiteado), el arranque no termina en 180 s porque faltan Mongo, Redis y OpenSearch. Ver `evidencia/int-spec-intento-postgres-local.txt`.
- `yarn build`, `yarn docs:validate` y `yarn docs:build` no se corrieron (MkDocs no está en el contenedor).
- El flujo en el front («Mis organizaciones → Organización médica») no se observó.

## Desvíos del plan

- `PLAN.md` y este reporte se escribieron después del código y del PR: la sesión no leyó `AGENTS.md` hasta que el propietario pidió vigilar el PR.
- Rama: se usó `claude/adoring-fermat-cfc4zb`, la asignada a la sesión, en lugar de `justin/practice-ownership-guard`. La base es la misma (`origin/dev`).
- Un `prettier --write` sobre directorios enteros reformateó varios README de tablas; se revirtieron a `dev` antes del push.

## Riesgos residuales

- **`dev` no arranca (2026-10-24, encontrado al intentar el int-spec; ajeno a este trabajo).** Desde `7f2aa3d8` («chore(db): database/ vuelve a ser una copia exacta del modelo»), `src/modules/forms/entities/index.ts` exporta la función `choiceOptionsOf`. `forms.module.ts` registra `MikroOrmModule.forFeature(Object.values(entities))`, y la función entra como si fuera una entidad. Resultado: `MetadataError: Metadata for entity choiceOptionsOf not found` al compilar el `AppModule`. Se reprodujo con la app compilada (`yarn build` da 0 y luego `generate-openapi.mjs` falla) y en el arnés de integración: `admin-listados.int-spec.ts`, que ya existía, falla 7/7 con el mismo error. **Bloquea todos los int-specs y, con toda probabilidad, el arranque del despliegue.** No se arregló aquí porque está fuera de alcance (§1.3). Arreglo propuesto, de una línea: filtrar `forFeature` a las clases de entidad, o sacar `choiceOptionsOf` del barrel `entities/index.ts` e importarla desde `dynamic_field_definitions.types.ts`. Evidencia: `evidencia/int-spec-intento-postgres-local.txt`.

- `xlsx-parser.spec.ts` falla **solo en este entorno**: `cdn.sheetjs.com` está bloqueado y se instaló `xlsx@0.18.5` de npm en local, en vez de 0.20.3. `package.json` y `yarn.lock` no se tocaron en el PR. Hay que confirmarlo en CI o en local con la dependencia real.
- `glossary-articles.catalog.spec.ts` (hipertensión, menos de 2000 palabras): fallo preexistente conocido.
- `redocly lint` da 3 errores y 1 warning, los mismos que en `origin/dev` (regla `security-defined` en rutas públicas ajenas).
- tsc y eslint necesitaron `NODE_OPTIONS=--max-old-space-size=8192` en este contenedor; con el heap por defecto, tsc se quedó sin memoria.

## Decisiones y ambigüedades

- **404 y no 403** ante una práctica sin vinculación: es el patrón que ya usan el servicio de la consola y el int-spec H6. Con 403, un médico podría sondear qué ids existen en el tenant compartido. A confirmar con Justin.
- **Sin perfil profesional en el token** → ninguna práctica en `practice`, en lugar de «todas». Contabilidad conserva su 422.
- **Contabilidad no cambia de comportamiento:** solo reutiliza `practiceAccessScope`. La resolución de vinculaciones y los errores siguen siendo suyos, y sus constructores no cambian.
