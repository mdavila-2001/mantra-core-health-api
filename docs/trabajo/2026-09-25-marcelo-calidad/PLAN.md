# Plan — Calidad de la carga masiva (Carril Marcelo B, mitad API — H7)

- Fecha: 2026-09-25 · Repo: `alovida/mantra-core-health-api` · Rama: `marcelo/carga-masiva-xlsx-2026-09-25` (worktree `wt-marcelo-cargamasiva-api`) · Plan espejo (H1-H6, front): `mantra-core-health/docs/trabajo/2026-09-25-marcelo-calidad/PLAN.md`
- Resultado observable: fixtures sintéticos de la carga masiva publicados para Itzan/Justin; `row-contract.ts` de Itzan incorporado; decisión de dependencia XLSX cerrada con evidencia (aunque el resultado sea "no se agrega ninguna").
- Kill-test: `ls test/fixtures/terminology-import | wc -l` ≥ 13; `sha256sum` igual en dos corridas de `generar-fixtures.mjs`; `decision-dependencia.md` existe con audit pegado.

## Alcance
- IN: H7 completo de la ficha (dependencia XLSX, fixtures de la API, parseador XLSX si la dependencia lo permite).
- OUT: todo lo de Itzan (`src/modules/terminology/import/**` salvo `xlsx-parser*`, el servicio, el controlador, `index.ts`) y de Pablo (integración).
- Ambigüedades registradas: pregunta para Pablo en `decision-dependencia.md` — ¿autorizar instalar `xlsx` desde el CDN de SheetJS en vez del registro de npm, para tener la versión sin los 2 CVE `high`?

## H7 — Dependencia XLSX, fixtures de la API y parseador XLSX
**CA:** Ver ficha original §4, H7.
**Estado:** A MEDIAS — H7.S1 y H7.S2 HECHO; H7.S3 (parseador) no se ejecuta: no hay dependencia que lo permita

### H7.S1 — Dependencia decidida con evidencia (tope 45 min)
**Estado:** HECHO — con una corrección de rumbo dentro del tope (ver `decision-dependencia.md`)

| ID | Microtarea | Estado | Evidencia |
|---|---|---|---|
| H7.S1.M1 | Worktree, `yarn install`, baseline | HECHO | `evidencia/antes/api-baseline.txt` |
| H7.S1.M2 | Confirmar nada CSV/XLSX instalado | HECHO | `yarn why` vacío para las 5 libs |
| H7.S1.M3 | Qué usan repos hermanos | HECHO | `grep` vacío |
| H7.S1.M4 | Evaluar candidata(s) con audit | HECHO | **2 candidatas evaluadas y rechazadas**: `exceljs` (incompatible con el contrato síncrono) y `xlsx` de npm (2 CVE `high` sin parche) |
| H7.S1.M5 | ¿Lee desde Buffer? ¿Acota filas? | HECHO | Verificado en los `.d.ts` de las dos candidatas |
| H7.S1.M6 | `decision-dependencia.md` | HECHO | archivo completo, con la corrección de rumbo documentada |
| H7.S1.M7 | Commit sólo `package.json`+`yarn.lock` | **A MEDIAS** | Commit local (`dc7ecaef`) revierte a como estaba en `origin/dev` (ninguna dependencia agregada); push bloqueado por el harness |

### H7.S2 — Fixtures sintéticos publicados en la hora 2
**Estado:** HECHO (CSV/PDF) — XLSX no generado (sin dependencia)

| ID | Microtarea | Estado | Evidencia |
|---|---|---|---|
| H7.S2.M1 | Leer 2 README de fixtures existentes | HECHO | no había ninguno comparable — primero de su tipo, declarado |
| H7.S2.M2 | `generar-fixtures.mjs`: 12 CSV + PDF | HECHO | `ls test/fixtures/terminology-import/*.csv *.pdf \| wc -l` → 13 |
| H7.S2.M3 | Determinismo | HECHO | `sha256sum` igual en dos corridas, verificado |
| H7.S2.M4 | Gemelos `.xlsx` + `grande-10k.xlsx` + `celda-numerica.xlsx` | **A MEDIAS** | Sin dependencia XLSX, no generados — declarado en el README |
| H7.S2.M5 | README con procedencia sintética | HECHO | `test/fixtures/terminology-import/README.md` |
| H7.S2.M6 | Commit + push en la hora 2 | **A MEDIAS** | Commit local (`bcc1c55f`); push bloqueado por el harness |

### H7.S3 — Parseador XLSX contra el contrato de Itzan
**Estado:** A MEDIAS — bloqueado por H7.S1 (ninguna dependencia disponible)

| ID | Microtarea | Estado | Nota |
|---|---|---|---|
| H7.S3.M1 | Traer `row-contract.ts` de Itzan | HECHO | `git checkout e57c0126 -- ...` (sólo esos 2 archivos, no todo el commit) |
| H7.S3.M2-M9 | `xlsx-parser.ts` + specs + PR | A MEDIAS | Sin librería XLSX viable, no hay nada que implementar; ver `decision-dependencia.md` para el camino de salida |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Disco de la máquina al 97% durante este turno | Fallo real de `git worktree add` (Justin) por falta de espacio | Se liberaron ~2 GB borrando `node_modules` de worktrees propios ya cerrados, confirmado con el usuario antes de actuar |
| `InsuranceModule` con DI rota | Bloquea `docs:openapi:generate`/`postman:generate` de cualquier carril | Documentado, no es de este módulo, no se toca |
