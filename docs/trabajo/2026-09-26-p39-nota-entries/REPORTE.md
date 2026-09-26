# Reporte — P39 · filas clave/valor (`entries`) en la nota médica

- Fecha: 2026-09-26 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `justin/nota-entries-p39-test-2026-09-26` (desde `origin/test` @ `6b44f0c0`)
- Peldaño de evidencia alcanzado: **`TESTED`** (Docker apagado: no hubo Postgres local para aplicar el patch ni ejercitar la API)
- Avance: 3 HECHO / 5 total = 60 % (1 A MEDIAS, 1 DESCARTADO)

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.M1 | `NoteEntryInputDto` + `entries?` (máx. 50) en `CreateNoteDto` y `AddVersionDto` | jest dirigido (ver Evidencia) | PASS |
| H1.M3 | `createNote`/`addVersion` guardan `entriesJson` (plano, `null` si no hay); el sello de firma incluye las filas sólo si hay | jest dirigido | PASS |
| H1.M4 | `toChartNoteItem` devuelve `entries` (`[]` por omisión) → `GET /charts/notes` y `GET /charts/patients/:id/chart` | jest dirigido | PASS |

## A medias
### H1.M2 — columna `entries_json`
- Qué anda: entidad (`entriesJson`, `type: 'json'`, `columnType: 'jsonb'`, nullable), `database/SQL/15_chart/02_tables.sql` (+1 columna, 19 → 20) y el patch idempotente `database/SQL/patches/2026-09-26_v4224_clinical_note_entries.sql` (copiado también a `../SQL/patches/`).
- Qué no anda: no se aplicó a ninguna base; no se observó la columna.
- Qué falta exactamente: con el stack arriba, `docker exec -i mantra-redesa-postgres-1 psql -U mantra -d mantra_redesa_health < database/SQL/patches/2026-09-26_v4224_clinical_note_entries.sql` dos veces y `\d chart.clinical_note_versions`.
- Dónde quedó: en la rama, commiteado.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H1.M2 (base) | A MEDIAS | Docker Desktop arriba |
| H1.M5 | DESCARTADO | El workflow `docs.yml` (que regenera y compara openapi/docs) sólo corre en PR a `master`/`dev`; la base es `test`. Además el generador exige `yarn build` + infraestructura Docker. Queda para quien promueva a `dev`. |
| Modelo | TODO | Portar la columna y el patch a `mantra-core-health-model` (fuente canónica de `db:vendor`). |

## Evidencia
- jest dirigido (`evidencia/jest-dirigido.txt`): `Test Suites: 4 passed, 4 total` · `Tests: 90 passed, 90 total` · `JEST_EXIT=0`. Corrido con `--modulePaths` a un `node_modules` auxiliar con `pdfkit`/`qrcode`, porque el `node_modules` enlazado (del checkout principal) no los tiene instalados.
- eslint sobre los 10 archivos TS tocados: `LINT_EXIT=0`.
- typecheck (`evidencia/tsc.txt`): `TSC_EXIT=2`, 23 errores, **todos** `Cannot find module 'pdfkit' | 'qrcode' | 'xlsx'` y sus derivados (`PDFKit` namespace, `any` implícito en `xlsx-parser.ts`): dependencias no instaladas en el `node_modules` compartido. Ninguno en archivos tocados.
- `db:vendor:check`: en modo CI (`MODEL_REPO=/nonexistent`) exit 0. En local compara con `../mantra-core-health-model`, que está ~25 parches atrás: falla igual en `origin/test` limpio (`CLEAN_LOCAL_EXIT=1`), preexistente.

## No cubierto
- Llamada HTTP real con `forbidNonWhitelisted` (sólo se validó el DTO con las opciones del pipe global).
- Persistencia real del jsonb (serialización MikroORM) y lectura de vuelta.

## Desvíos del plan
- El encargo pedía `database/SQL/99_migrations/`; no existe. Se usó `database/SQL/patches/` (convención real) y se declaró la columna en `02_tables.sql`, como hacen los parches previos (p. ej. v4216).
- Tests de DTO: `label: 5` no se rechaza porque el pipe global usa `enableImplicitConversion` y lo convierte a `"5"`; se documentó con un test en vez de fingir un rechazo.

## Riesgos residuales
- Otro agente podría tomar también el número v4224 para su parche; los nombres de archivo no chocan.
- `AmendNoteDto` no acepta `entries`: una enmienda crea una versión sin filas (igual que hoy con el texto que no se reenvía).

## Decisiones y ambigüedades
- A1 carpeta `patches/` (ver Desvíos). A2 `label` y `value` obligatorios tras recortar (máx. 120 / 2000). A3 `entries` siempre presente en la respuesta, `[]` si no hay. A4 hash de firma retrocompatible. A confirmar con el front (A2, A3) y con el dueño del modelo (A1).
- PHI: no se agregó ningún log; las filas nunca se loguean.
