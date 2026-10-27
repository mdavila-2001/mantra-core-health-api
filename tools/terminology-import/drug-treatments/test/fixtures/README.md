# Fixtures de `drug-treatments`

Filas **reales y literales** copiadas de los archivos fijados en `lib/sources.mjs`
(mismo commit). Sirven para probar los parsers sin red. Atribución y licencias:

| Archivo | Origen | Licencia |
|---|---|---|
| `labeledin-expert.txt`, `labeledin-crowd.txt` | LabeledIn (NLM/NCBI), copia en `dhimmel/indications@11d535ba` | Dominio público (US Government Work) |
| `pharmacotherapydb.tsv` | PharmacotherapyDB 1.0, `dhimmel/indications@11d535ba` | CC0 1.0 |
| `drugcentral-indications.tsv`, `drugcentral-identifiers.tsv` | DrugCentral, `olegursu/drugtarget@64630f7c` | CC BY 4.0 — atribución: DrugCentral |
| `drugmechdb.yaml` | DrugMechDB, `SuLab/DrugMechDB@aef22421` | CC0 1.0 |
| `maxo.tsv` | MAxO annotations, `monarch-initiative/maxo-annotations@42edd966` | CC BY 4.0 — atribución: Monarch Initiative |
| `mondo.sssom.tsv` | MONDO SSSOM, `monarch-initiative/mondo@a645ab57` (sin las filas `SCTID`) | CC BY 4.0 — atribución: Monarch Initiative |

`drugcentral-indications.tsv` conserva la columna `SNOMEDCT_CUI` tal cual la publica la fuente
porque la prueba verifica que el parser la **descarta**.

## Fuentes HTTP (pasadas del 2026-10-27, carril C6)

Filas **reales y literales** de los archivos que baja `fetch-open-sources.mjs` (URL, fecha y SHA-256 de cada
uno en `glossary-data-build/cache/drug-treatments-http/manifest.json`; los de las fuentes que se extraen de un
crudo grande conservan el SHA-256 del crudo en `derivedFrom`). Licencias: `lib/open-sources.mjs` y `SOURCES.md`.

| Archivo | Origen | Qué recorta |
|---|---|---|
| `medrt.xml` | MED-RT 2026.10.05 (`Core_MEDRT_XML.zip`, NCI EVS) | cabecera + 9 asociaciones reales: `may_treat` (palivizumab → VRS, dos autoridades), `may_prevent` (clase EPC y clesrovimab), sertralina, `CI_with`, `may_diagnose`, y una `induces` y una `has_MoA` que el parser debe excluir |
| `mesh-concepts.tsv` | MeSH 2026 `desc2026.xml` (concepto → descriptor, con el nombre del descriptor) | conceptos preferidos (de 7 y de 9 dígitos) y un concepto NO preferido |
| `rxclass-atc.tsv` | RxClass (NLM) `classMembers?relaSource=ATC`, sin los nombres de la OMS | RxCUI 161, 1191, 36437 y una combinación (MIN) |
| `chembl-drug-indication.ndjson`, `chembl-molecule-atc.tsv` | ChEMBL_37, API `drug_indication` y `molecule` | fases 4, 3, 2, 0.5 y -1, y `efo_id` con prefijos EFO, HP, Orphanet y MP |
| `drugcentral2027-*.tsv` | DrugCentral 2027, volcado 2026-09-25 (extracto de `omop_relationship`, `structures`, `identifier`, `struct2atc`) | fármacos 4275, 1540, 348, 466, 4830, 1311, 5271: todos los tipos de relación, una fila sin UMLS CUI |
| `ema-medicines.tsv` | EMA, `medicines-output-medicines-report_en.xlsx` (2026-10-27) | autorizados con uno y dos ATC, retirado, veterinario, sin ATC y con ATC de nivel 2 |
| `opentargets-ema.ndjson` | Open Targets 26.09 `clinical_report` (provider EMA) | MONDO, una combinación de dos fármacos, ids `GO` y nulo, y un informe `WITHDRAWAL` |
| `civic-predictive.ndjson` | CIViC, GraphQL `evidenceItems` (PREDICTIVE, ACCEPTED) | sensibilidad, resistencia, no apoya, COMBINATION, SUBSTITUTES, SEQUENTIAL, sin DOID, sin NCIt |
| `wikidata-statements.ndjson`, `wikidata-item-ids.ndjson` | Wikidata Query Service (P2175, P2176 e identificadores externos) | declaraciones de ambas propiedades, una de rango deprecated, y un código MeSH compartido por dos ítems con ATC |
| `clinicaltrials-studies.ndjson` | ClinicalTrials.gov API v2 | estudios con dos intervenciones, el mismo par en dos estudios, fase 1/2, fase vacía, sin condición, sin intervención |
| `eeml-recommendation-298.html`, `eeml-recommendation-17.html` | WHO eEML (`/recommendations/298` y `/17`) | página completa con ATC e ICD-11, y una con ATC «Pending» |

