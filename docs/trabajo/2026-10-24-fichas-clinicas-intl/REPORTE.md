# Reporte — Fichas clínicas: ampliación con estándares internacionales

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `claude/intelligent-johnson-q0ll9g` · PR: [#685](https://github.com/mdavila-2001/mantra-core-health-api/pull/685) contra `dev`, sin mergear
- Peldaño de evidencia alcanzado: **VERIFIED** — verificado: la siembra real del catálogo contra PostgreSQL 16 con el DDL de `database/SQL` y su idempotencia. **No** `REGRESSION_VERIFIED`: el `yarn test` completo no se corrió y `src/common/seed` tiene un rojo preexistente.
- Avance: 16 HECHO / 18 microtareas = **88,9 %** (1 DESCARTADO, 1 TODO).

Detalle del contenido (fichas por especialidad, pasadas, licencias, huecos): [`docs/seed-research/clinical-forms.md`](../../seed-research/clinical-forms.md).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H0.M1 | `build-forms --check` deja de fallar en `dev` | `node tools/clinical-forms/build-forms.mjs --check` | `374 fichas … 0 desactualizadas`, exit 0 |
| H1.M1–M2 | Lector ADL e instantánea del CKM regenerable | `bash tools/clinical-forms/fetch-sources.sh <dir>` | `21 arquetipos · espejo c3fdc43…`; snapshots idénticos a los versionados |
| H1.M3–M6 | 19 escalas itemizadas en 25 fichas + colitis ulcerosa + biopsia de próstata | spec «ampliación internacional» | en verde (ver `specs-dirigidos.txt`) |
| H2.M1–M3 | DAK OMS: 6 fichas mejoradas + ITS + vacunación/ESAVI | `fetch-sources.sh` · spec del descargo | `{'PNC': 24, 'HIV': 14, 'FP': 5, 'ANC': 1, 'IMMZ': 8}` · en verde |
| H3.M1 | Epicrisis con secciones del IPS, sin SNOMED | spec SNOMED | en verde |
| H4.M1 | 10 pasadas registradas; 9 y 10 en 0 | tabla en `docs/seed-research/clinical-forms.md` | presente |
| H5.M1 | Specs dirigidos | `corepack yarn test catalog.spec.ts clinical-forms-seed.service.spec.ts` | `Tests: 49 passed, 49 total` |
| H5.M2 | Siembra e idempotencia contra Postgres | spec temporal de integración (copia en `evidencia/`) | 1.ª: 374 plantillas / 37 especialidades; 2.ª: 0 / 0 en 467 ms |
| H5.M3 | typecheck + lint | `NODE_OPTIONS=--max-old-space-size=8192 corepack yarn typecheck` / `… lint` | exit 0 / exit 0 |
| H5.M4 | Crudos reproducibles con sha256 | `fetch-sources.sh` | `>>> sha256 verificados` |

## A medias
ninguna

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H5.M5 | DESCARTADO | Subir de versión desde una base sembrada con `dev` contra Postgres: costaba ~36 min de siembra; lo cubre el spec unitario `al subir de versión actualiza la ficha de catálogo…` (`clinical-forms-seed.service.spec.ts:293`). Correrlo si se quiere evidencia de integración |
| H5.M6 | TODO | `yarn test` completo, `yarn docs:validate`, `yarn docs:build`: no corridos (MkDocs y Redocly no están en el contenedor; no se tocó OpenAPI/AsyncAPI) |
| — | BLOQUEADO | Pasada con NNAC 15–24, normas 2025 de minsalud.gob.bo, NICE, MINSAL, CENETEC, GuíaSalud, MinSalud Colombia, sociedades, IRIS: política de red (`evidencia/hosts-bloqueados.txt`). Se destraba con una sesión con red abierta |
| — | BLOQUEADO | PHQ-9 / GAD-7: decisión del propietario sobre licencia |

## Evidencia
Salidas literales en [`evidencia/`](https://github.com/mdavila-2001/mantra-core-health-api/tree/dev/docs/trabajo/2026-10-24-fichas-clinicas-intl/evidencia):

- `build-forms-check.txt` — `374 fichas ({"SPECIFIC":334,"BASE":36,"GENERAL":4}) · 6373 campos · 0 desactualizadas` · `exit 0`
- `specs-dirigidos.txt` — `Test Suites: 2 passed, 2 total` · `Tests: 49 passed, 49 total`
- `siembra-postgres.txt` — `{"catalog":374,"campos":6373,"first":{"templates":374,"specialties":37},"second":{"templates":0,"specialties":0},"ms":[1059066,467],"counts":{"templates":{"n":374},"fields":{"n":6747}}}` · `Tests: 1 passed`
- `typecheck-lint.txt` — `yarn typecheck` → `exit 0`; `yarn lint` → `exit 0`
- `fetch-sources.txt` — seis repos en sus commits, `>>> sha256 verificados`, instantáneas y `--check` en 0
- `hosts-bloqueados.txt` — 24 hosts con `000` (CONNECT `403`) el 2026-10-24 00:53 UTC

Gates adicionales corridos durante la sesión (salida en el chat, no archivada): `yarn build` sin errores y las fichas nuevas presentes en `dist/`; `yarn test src/common/seed` → `Tests: 1 failed, 282 passed`, el rojo es `glossary-articles.catalog.spec.ts`, que **falla igual sobre `dev`** («cada artículo llega al piso de 2.000 palabras»).

## No cubierto
- El render de las fichas en el front (`specialty-form-block`): no se abrió la UI; la estructura usada (opciones, `showWhen`, secciones) es la misma que ya dibuja.
- Reconciliación de versión contra Postgres (ver H5.M5).
- Las traducciones propias no tienen revisión clínica (ver «Riesgos residuales»).

## Desvíos del plan
- **El plan se escribió al cierre, no antes del código** (`AGENTS.md` §2.1). Causa: en el discovery se buscó `CLAUDE.md` y `.claude/rules/` y no se abrió `AGENTS.md`. Error de esta sesión.
- Rama `claude/intelligent-johnson-q0ll9g` en vez de `justin/seed-clinical-forms-intl` (instrucción de la sesión de no empujar a otra rama).
- `yarn install` necesitó un desvío local temporal: `repo.yarnpkg.com` y `cdn.sheetjs.com` bloqueados; se instaló desde `registry.npmjs.org` con `xlsx` 0.18.5 sólo en `node_modules`, y `package.json` / `yarn.lock` se restauraron sin cambios.
- `typecheck` y `lint` con `--max-old-space-size=8192`: con el heap por defecto Node se queda sin memoria en este contenedor.
- La base desechable se creó en `/tmp/pgalovida` (el directorio de trabajo temporal de la sesión no era accesible para el usuario `postgres`); se detuvo al terminar.

## Riesgos residuales
- **Licencias**: CC BY-SA (CKM) obliga a compartir igual lo derivado; CC BY-NC-SA 3.0 IGO (OMS, también el material previo del catálogo) es no comercial; el índice de Barthel ya presente figura con © de la Maryland State Medical Society; 19 escalas sin términos de licencia publicados entran como categorías clínicas. Pide revisión legal.
- **Clínicos**: la NIHSS es traducción propia, no la versión certificada; las listas de las DAK y las correcciones a arquetipos en desarrollo (Bishop, HEART, Charlson, NIHSS, SOFA) necesitan revisión profesional.
- La siembra completa tarda ~18 min en una base vacía: no es nuevo de este cambio (≈ 3 s por plantilla), pero conviene saberlo para despliegues.

## Decisiones y ambigüedades
1. Rama de trabajo — supuesto: la de la sesión. Confirmar: Justin.
2. PHQ-9 / GAD-7 fuera — supuesto: rige la regla del README. Confirmar: propietario.
3. Escalas sin términos publicados como categorías clínicas — supuesto: criterio vigente de `fuentes.mjs`. Confirmar: revisión legal.
4. Crudos no versionados: las instantáneas normalizadas sí (JSON, < 200 KB, sin `.gz` porque no hace falta); los crudos se reproducen con `fetch-sources.sh` y `sources.sha256`. Motivo adicional: redistribuir los originales OMS dentro del repo de un producto choca con la cláusula no comercial.
5. La pasada 10 cuenta como 0 por inaccesibilidad, no por saturación del contenido: dicho así en el registro.
