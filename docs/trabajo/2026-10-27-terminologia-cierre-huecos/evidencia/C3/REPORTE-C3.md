# Reporte C3 — laboratorio + procedimientos (cierre de huecos de terminología)

- Fecha: 2026-10-28 · Plan: [PLAN.md](../../PLAN.md) (H1.C3) · Rama: `claude/adoring-heisenberg-1rl29k` (commits locales, sin push)
- Peldaño de evidencia alcanzado: **VERIFIED contra Postgres 16 desechable** para conceptos, propiedades, designaciones y value sets de ambos dominios; **WRITTEN/TESTED** (no cargado) para las 109 569 relaciones de procedimientos. No es `REGRESSION_VERIFIED`: no se corrió contra la base real del stack ni con la API.
- Avance: 5 microtareas × 2 dominios = 10; HECHO 9, A MEDIAS 1 (M4 de procedimientos: relaciones) → 9/10 = 90 %.

## Completado
| ID | Qué se logró | Comando / evidencia | Resultado |
|---|---|---|---|
| C3.M1 | Re-sondeo de hosts | `sondeo-2026-10-28.tsv` | cms.gov, clinicaltrials, nlmpubs, sanidad, datos.gov.co, ncbi ftp, dicom, radlex, pami: 200. 403: loinc.org, datos.gob.mx, fonasa. Sin respuesta: minsalud.gob.bo, sispro. SIGTAP: descargas indisponibles en el portal |
| C3.M2 | Parsers contra archivo real, fixtures reales | `revalidacion.txt` | lab-tests 45/45, procedures 28/28 (se agregó `corpus-data.test.mjs`), 0 skip |
| C3.M3 lab | Build reproducible | `build-lab-tests-cmp-completo-run2.txt` | 8/10 capas con el mismo SHA-256 que lo versionado; PAMI y RadLex difieren sólo en `provenance.retrievedAt` (y SHA compuesto de entrada; la API de RSNA regenera el .xlsx en cada pedido): 0 filas distintas ignorando `provenance` |
| C3.M3 proc | Build reproducible | `build-procedures-cmp.txt` | `procedures` f1aeaebd…, `assertions` 64bb14c0…, `maps` 0e2eb33a… idénticos a lo versionado (fuentes re-descargadas; `meta.json` y `studies.ndjson` de ClinicalTrials fijados a los versionados porque la API cambia a diario) |
| C3.M3 integridad de `data/` | `gzip -t`, `SHA256SUMS` (nuevos) | `revalidacion.txt` | 35 gz OK; 30 + 32 sumas OK; 0 archivos > 45 MB; lab 23 MB, proc 54 MB |
| C3.M4 lab | Carga + 2.ª corrida | `carga-lab-tests-run1/2.txt`, `integridad-salida.txt` | 1.ª: 81 502 conceptos, 2 091 449 propiedades, 3 682 designaciones, 167 value sets, 334 668 miembros. **2.ª: 0 nuevas** (sólo 15 lotes de auditoría) |
| C3.M4 proc | Carga de conceptos + 2.ª corrida | `carga-procedures-run1/2.txt` | 1.ª: 85 012 conceptos, 1 237 894 propiedades, 78 869 designaciones. **2.ª: 0 nuevas** |
| C3.M4 integridad | Consultas | `integridad-salida.txt` | 0 huérfanos, 0 duplicados por (versión, código), 0 código/display nulos, 0 propiedades nulas |
| C3.M5 | `SOURCES.md` (ambos), `docs/seed-research/lab-tests.md` y `procedures-treatments.md`, `GAPS` y `data/lab-tests-coverage.json` actualizados | diff de los commits | sin «403» sin re-sondeo de hoy |

## A medias
### C3.M4 proc — relaciones procedimiento → enfermedad / sitio
- Qué anda: el plan arma 109 569 relaciones y 109 612 filas de procedencia (`load.mjs` dry-run y `--apply`); los conceptos se cargan. Con el parche del modelo y extremos simulados se probó el 2026-10-27 (commit d371977), 2.ª corrida 0.
- Qué no anda: `--apply` informa «RELACIONES NO CARGADAS»: faltan `concept_relationship_evidence` y `concept_relationship_assertions` en la base desechable.
- Qué falta exactamente: `/home/user/mantra-core-health-model` no existe en esta máquina, así que el parche `2026-10-25_v4250_…sql` no se pudo aplicar; escribir ese DDL acá contradice el brief (regla 3). Hace falta el parche (o la tabla de asertos) y los code systems `mondo`, `uberon`, `ncit` y `mesh` de C1/C7 para resolver los extremos.
- Dónde quedó: relaciones en `procedures-treatments/data/out/assertions.part*.ndjson.gz` (SHA en `SHA256SUMS`).

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| CUPS (datos.gov.co: 1 339 lab + 8 114 proc) | BLOQUEADO por licencia | CC BY-SA 4.0 (leído en el portal hoy): decisión del propietario; luego `build-lab-tests.mjs --include-share-alike`. La CUPS 2025 oficial ya la carga C8 |
| México | BLOQUEADO (red/fuente) | `datos.gob.mx` 403; DGIS 200 por http pero sin catálogo descargable |
| SUS Bolivia | BLOQUEADO (red) | `minsalud.gob.bo` sin respuesta (curl 000 ×3; el sondeo de `fetch.mjs` lo marcó 200: contradicción sin resolver) |
| Cotejo FONASA / SIGTAP con originales | BLOQUEADO | fonasa 403; portal SIGTAP con descargas «indisponíveis», ftp2 503 |
| LOINC completo | BLOQUEADO (licencia/cuenta) | cuenta en loinc.org (403). Novedad: `clinicaltables.nlm.nih.gov` 200 → `import-loinc.mjs` (subconjunto público) puede correr; no se corrió (fuera de mis rutas, cientos de pedidos) |
| ICHI, ICD-11, NCIt oficial, SNOMED, CPT | no cargados | CC BY-ND / cuenta / normalizador / licencia |
| Subgrupos mixtos de aranceles (~1 000) | curaduría | clasificación humana ítem por ítem |

## Evidencia
Todo en este directorio (`carga-*.txt`, `integridad-salida.txt`, `build-*-cmp*.txt`, `revalidacion.txt`, `sondeo-2026-10-28.tsv`, `licencia-cups-datos-gov-co.txt`, `cotejo-originales.json`). Conteos antes → después:
- lab-tests: 12 765 → **81 502** conceptos (GTR 63 914, RadLex 4 772, DICOM 51 nuevos); value sets 119 → 167.
- procedures-treatments: 1 988 → **84 990** procedimientos (ICD-10-PCS FY2027 79 256, sitios 1 745, MeSH E 2 001); afirmaciones 746 → 109 612; designaciones ES 78 869.
- Base desechable completa: 166 520 conceptos, 3 329 343 propiedades.

## No cubierto
- Carga contra la base real o con la API; consumo por producto (nada lo lee).
- Reconstrucción de FONASA/SIGTAP/TUSS/PAMI/UCUM/THO/ICD-10-PCS FY2026 se hizo (8/10 bit a bit), pero no se re-empaquetó `data/` (innecesario: contenido igual).
- Relaciones en la base (ver A medias). `validate-siblings.mjs --db` no corrido.
- No se revisó en esta pasada la licencia de DICOM (sin texto de redistribución) ni de TUSS (ANS sin licencia propia): siguen «a confirmar».
- Sin revisión independiente (la hace otro agente).

## Desvíos del plan
- `load.mjs` de procedimientos leía sólo un build fuera del repo: se le agregó lectura de `data/` con verificación de SHA (cambio en mi ruta, con prueba).
- Se agregó `test/disposable-db/seed-internal.mjs` (guarda `DB_NAME=desechable_*`) porque el cargador de lab-tests exige conceptos internos que siembra la API. Los cargadores por omisión apuntan a puerto 5433 / `mantra_redesa_health`: **riesgo de apuntar a la base real si falta el `.env`**; se corrió siempre con `DB_*` explícitos.
- `GAPS` y `lab-tests-coverage.json` (sólo el campo `gaps`) se actualizaron a mano en lugar de re-empaquetar.

## Riesgos residuales
- Tamaño versionado 77 MB (< 300 MB). Crudos grandes (NCIt 283 MB, MONDO, Uberon) no se versionan; se reproducen con `fetch.mjs` (SHA coincidieron hoy).
- ClinicalTrials cambia a diario: el corpus está fijado por `dataTimestamp 2026-10-27T09:00:04` y SHA, no es re-obtenible idéntico.

## Decisiones y ambigüedades (propietario)
1. **ICD-10-PCS en dos versiones**: `lab-tests` carga 4 397 códigos FY2026 y `procedures-treatments` el FY2027 oficial, mismo code system, otros ids (los 4 397 existen en FY2027 con igual texto). Propuesta: retirar la capa FY2026 y apuntar los value sets de dominio a conceptos FY2027.
2. CUPS CC BY-SA 4.0 (cargar o no). 3. DICOM «free to download and use» sin texto de redistribución. 4. TUSS (ANS sin licencia propia). 5. ICHI/ICD-11 (CC BY-ND). 6. SCDO GPL-3.0 (pendiente de antes).
- Propuesta al modelo: aplicar el parche de evidencia de relaciones en el repo del modelo y la tabla de asertos; relacionar versión y concepto para que un código existente no se duplique al cambiar de versión; concepto de idioma `pt` para SIGTAP/TUSS.
- Supuesto tomado: que la ausencia del repo del modelo en esta máquina es del entorno y no un parche aún no escrito (confirmar con quien coordina).
