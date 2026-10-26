# Plan — TAREA-41 F4: seguridad del fármaco con cita literal (CIMA, LactMed, LINAME)

- Fecha: 2026-10-26 · Repos afectados: mantra-core-health-api · Predecesor: commit WIP `af13a79b` en
  `justin/l41-f4-drug-safety-dev` (agente interrumpido, sin verificar) y TAREA-41 F1.3/F2 (`bulk-copy.mjs`, NNAC).
- Resultado observable: `node tools/terminology-import/import-cima.mjs --safety [--load [--dry-run]]` produce,
  desde las fichas técnicas de CIMA ya descargadas y el corpus LactMed, filas de `bulkLoadRelationships`
  (CONTRAINDICATED_IN, ADVERSE_EFFECT, PREGNANCY_LACTATION_CAUTION) con cita literal, la cola
  `out/cima-unmatched.csv` y los pares de interacción `out/cima-interactions.csv`.
- Kill-test: `node --test tools/terminology-import/test/` en rojo, o una URL de CIMA con `seccion=4.2`.

## Alcance
- IN: `tools/terminology-import/import-cima.mjs`, `lib/glossary-es/cima.mjs`, `lib/glossary-es/cima-safety.mjs`,
  `lib/glossary-es/load-plan.mjs` (sólo el code system `nlm-lactmed`), `sources.json`, fixtures reales en
  `test/fixtures/cima-safety/`, `test/cima-safety.test.mjs`, este plan y su reporte.
- OUT: `src/` (no se crea value set de severidad de interacciones), el importador de `clinical-pharmacology/`
  (sólo se reutiliza `lib/lactmed.mjs` y su corpus), la carga contra una base (no hay base en este entorno).
- Ambigüedades registradas:
  1. `clinical_ext.drug_interactions.severity_concept_id` es obligatorio y no existe concepto/value set de
     severidad con `UNSPECIFIED`. Supuesto: las interacciones se emiten a CSV y NO se cargan (BLOCKED). Confirmar
     con el dueño de TAREA-41 qué value set crear.
  2. Resúmenes de LactMed que citan dosis (286 de 1 148 en el corpus): supuesto conservador, van a la cola
     (`dose-guard`) y no se cargan. Confirmar con el dueño si se acepta citar el resumen completo.
  3. Destino de 4.6 y de LactMed: sólo designaciones exactas de una lista fija (embarazo/lactancia), no
     cualquier término clínico de la oración. Confirmar con el dueño.
  4. «Raras» y «muy raras» → `VERY_RARE` (el value set no tiene un grado intermedio). Documentado en la tabla.

## H1 — Seguridad desde la ficha técnica de CIMA (F4.1, F4.2, F4.5)
**CA:** Dado el HTML real de 4.3/4.5/4.6/4.8, cuando se corre el extractor, entonces cada relación cita la
oración literal, nombra un término exacto del glosario, nunca lleva `ordinal`, su `sourceReference` es única, y
nada de 4.2 se pide ni se lee.
**DoD:** `node --test tools/terminology-import/test/` en verde · `corepack yarn typecheck` · `corepack yarn lint`.
**Estado:** HECHO (sin carga en base)

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Verificar contra CIMA en vivo que los fixtures son la respuesta literal | 7/7 idénticos | script de comparación → `IDENTICAL` ×7 | HECHO |
| H1.S1.M2 | Verificar aviso legal AEMPS y ausencia de límite publicado, registrarlo en `sources.json` | cita literal coincide | `curl aviso-legal` + `pdftotext` del manual → sin límite | HECHO |
| H1.S2.M1 | 4.6 sólo hacia designaciones fijas de embarazo/lactancia | la oración «diarrea en el lactante» no crea relación hacia diarrea | test `4.6 sólo embarazo/lactancia` | HECHO |
| H1.S2.M2 | Tests de 4.3, 4.5, 4.8 sobre fixtures reales | relaciones/frecuencias/severidades esperadas | `node --test` | HECHO |
| H1.S2.M3 | (no previsto) Un subtítulo «- Ciclosporina:» no es una cita | no sale interacción con ese texto | test `simvastatina — Está contraindicada…` | HECHO |
| H1.S3.M1 | Spec F4.5 «Dosis: nunca» | 4.2 lanza en URL, lectura y fila; ningún pedido la contiene | `node --test` | HECHO |

## H2 — LactMed (F4.3)
**CA:** Dado un resumen «Summary of Use during Lactation» de LactMed enlazado por ATC exacto a un principio
activo del catálogo, entonces sale una relación PREGNANCY_LACTATION_CAUTION, CURATED_REFERENCE, que cita el
resumen literal; si el ATC es ambiguo, falta el concepto de lactancia o el resumen cita dosis, va a la cola.
**DoD:** `node --test tools/terminology-import/test/` · registro de términos en `sources.json`.
**Estado:** HECHO (sin carga en base)

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | `lactmedSafety` puro + lector del corpus que descarta todo lo que no es LactMed | test con NXML real LM… | `node --test` | HECHO |
| H2.S1.M2 | Code system `nlm-lactmed` y lote propio en `--load` | `node --check import-cima.mjs` | `node --check` | HECHO |
| H2.S1.M3 | Términos NCBI/NLM y política de peticiones en `sources.json` | entrada `nlm-lactmed` sin PENDING | test `sources.json` | HECHO |

## H3 — LINAME (F4.4)
**CA:** Dada la búsqueda en minsalud.gob.bo, si no hay edición vigente, entonces queda BLOCKED con evidencia y
nada se reconstruye desde terceros.
**DoD:** salida literal de la búsqueda en el reporte. **Estado:** BLOQUEADO (sin edición vigente en minsalud.gob.bo)

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Buscar la edición vigente en minsalud.gob.bo | resultado registrado en `sources.json` | `curl …com_finder…q=LINAME` | HECHO |

## H4 — Entrega
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Gates | salida 0 | `corepack yarn install --immutable`, `typecheck`, `lint` | HECHO |
| H4.S1.M2 | Commits limpios sobre origin/dev y origin/test, push, 2 PR | PR abiertos | `git log`, URLs de PR | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sin base de datos en este entorno | `--load` no se ejecuta | se dice explícitamente; queda la orden exacta para correrlo |
| `cima.ndjson` no está en este entorno | no hay conteos sobre el catálogo completo | conteos sobre fixtures reales y sobre el corpus LactMed |
