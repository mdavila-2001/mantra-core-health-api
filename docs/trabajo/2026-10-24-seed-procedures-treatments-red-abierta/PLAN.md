# Plan — Procedimientos y tratamientos no farmacológicos: fase 2 y pasadas con la red abierta

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` (rama `justin/seed-procedures-treatments`, reiniciada desde `dev` tras el merge de #689; PR nuevo contra `dev`) · Predecesor: PR #689 (fase 1, pasadas 1–4; su plan y reporte los borró la limpieza `268f43c7` de `dev`, siguen en el historial de git)
- Resultado observable: el corpus de `tools/terminology-import/procedures-treatments/` suma las fuentes que estaban bloqueadas por la red (ClinicalTrials.gov + MeSH, ICD-10-PCS, NCIt oficial, …) con el mismo contrato, y la bitácora `docs/seed-research/procedures-treatments.md` trae la fase 2 medida contra lo que cargan las sesiones hermanas.
- Kill-test: una relación de ClinicalTrials.gov con `relationType.assertion` distinto de `investigational`, o sin NCT en la evidencia.

## Alcance
- IN: `tools/terminology-import/procedures-treatments/**`, `docs/seed-research/procedures-treatments.md`, este plan y su reporte.
- OUT: DDL y migraciones (ADR-0021); fármacos (`seed-drug-treatments`); los importadores y datos de las sesiones hermanas (solo se leen sus `data/`).
- Ambigüedades registradas:
  1. ICD-10-PCS e ICHI no los cargó `seed-specialty-services` (cargó arancel BO, FONASA y 186 CUPS). Supuesto: esta sesión crea los conceptos de procedimiento que referencia en `icd10pcs`/`ichi`, resolviendo por `internal_code` (índice único), igual que con NCIt. Confirmar con Justin.
  2. ClinicalTrials.gov publica el MeSH derivado por NLM a nivel de **estudio**, no de intervención. Supuesto: la relación es «intervención MeSH y condición MeSH registradas en el mismo ensayo intervencional», siempre `investigational` («en estudio»), una afirmación por par con todos los NCT de respaldo en la evidencia (sin truncar).
  3. Dos propuestas de procedencia para el modelo (`concept_relationship_assertions` de esta sesión, `concept_relationship_provenance` de `seed-drug-treatments`). No se elige acá: se documentan juntas para que decida el repo del modelo.

## H5 — Fase 2 con las ramas hermanas
**CA:** Dado lo que cargan `seed-diseases`, `seed-medical-dictionaries` y `seed-specialty-services` (ya en `dev`), cuando se cruzan sus claves con el corpus, entonces queda medido cuántas relaciones resuelven.
**DoD:** `node tools/terminology-import/procedures-treatments/validate-siblings.mjs --keys <claves de sus data/>`.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H5.S1.M1 | Claves de las hermanas desde sus `data/` en git | TSV `system<TAB>code` con mondo, mesh, orphanet, uberon, fma… | `cut -f1 claves.tsv \| sort \| uniq -c` | HECHO |
| H5.S1.M2 | Medición del corpus de la fase 1 | reporte por tipo de relación | `validate-siblings.mjs --keys` → 250/250 enfermedad, 439/453 sitio | HECHO |
| H5.S1.M3 | Medición del corpus final (tras H6) | ídem con las fuentes nuevas | `validate-siblings.mjs --keys` | HECHO |

## H6 — Pasadas con la red abierta
**CA:** Dado que el entorno alcanza las fuentes antes bloqueadas, cuando se normalizan, entonces el corpus suma sus relaciones con tipo literal y procedencia por relación, y la bitácora registra pasadas hasta dos seguidas con 0.
**DoD:** tests dirigidos en verde; `build.mjs` determinista (sha256 igual en dos corridas); tabla de pasadas; push después de cada pasada.
**Estado:** EN CURSO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H6.S1.M1 | Rama reiniciada desde `dev` | `git log origin/dev..HEAD` solo trae commits nuevos | `git log --oneline origin/dev..HEAD` | HECHO |
| H6.S1.M2 | MeSH 2026 clasificado por árbol | intervención no farmacológica = árbol E salvo E02.319 «Drug Therapy», o F04.754 «Psychotherapy»; condición = árbol C o F03 | `node --test …` | HECHO |
| H6.S1.M3 | ClinicalTrials.gov: intervención MeSH ↔ condición MeSH | `investigational`, etiqueta «En estudio», NCT en la evidencia | `node --test …` + `build.mjs` | HECHO |
| H6.S1.M4 | ICD-10-PCS: procedimiento → parte del cuerpo | `by-definition`, eje Body Part de las tablas oficiales | `node --test …` + `build.mjs` | HECHO |
| H6.S1.M5 | NCIt oficial: roles de procedimiento | roles R163/R165–R171/R180 de la edición vigente | diff por código contra la OBO Edition | HECHO |
| H6.S1.M6 | Fuentes restantes (ICHI, CUPS, NICE, Wikidata, Europe PMC) | aporta o descartada con motivo | tabla de pasadas | EN CURSO |
| H6.S1.M7 | Cargador con los code systems nuevos | dry-run con conteos; `--apply` ×2 en PG desechable → 2.ª corrida 0 | `load.mjs --apply` ×2 | HECHO |
| H6.S1.M8 | Gates | typecheck y lint exit 0, tests dirigidos en verde | `corepack yarn typecheck`, `corepack yarn lint`, `node --test …` | TODO |
| H6.S1.M9 | PR nuevo contra `dev`, listo para revisión, sin mergear | URL del PR | `mcp__github__create_pull_request` | HECHO |
| H6.S2.M1 | Clasificación MeSH depurada (sin métodos de investigación ni conceptos de tiempo/estrategia) | «Control Groups», «Placebos», «Randomized Controlled Trials as Topic», «Operative Time» no son procedimientos; «Biopsy», «Laparoscopy» sí | `node --test …` | HECHO |
| H6.S2.M2 | Pasada 6: revisiones Cochrane por la indexación MeSH de NLM | `literature-indexing`, PMID en la evidencia, retractadas fuera | `fetch-pubmed-cochrane.mjs` + `build.mjs` | HECHO |
| H6.S2.M3 | Pasadas 7+ hasta dos seguidas con 0 | dos filas consecutivas con 0 en la tabla de pasadas | tabla de pasadas | EN CURSO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Volumen de ClinicalTrials.gov (~608 000 estudios) | Descarga larga, archivo grande | Solo campos necesarios, caché por página, NDJSON comprimido en partes < 45 MB |
| Rate limit de la API de ClinicalTrials.gov | 429 | Pausa entre páginas y reintentos con espera |
| El modelo sigue sin procedencia por relación | Relaciones sin cargar | Compuerta del cargador (sin cambios) |
