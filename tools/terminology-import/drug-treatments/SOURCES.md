# Fuentes — tratamientos farmacológicos por enfermedad

Cada fuente se baja con `git clone` **en un commit fijado** (`lib/sources.mjs`) a
`glossary-data-build/cache/drug-treatments/` (fuera de git). `manifest.json` guarda,
por clon, el commit, la fecha del commit, la fecha de descarga y el SHA-256 de cada archivo leído.
Verificación de licencias: 2026-10-24, contra el archivo de licencia o el aviso del propio repositorio.

## Fuentes cargadas

| Clave | Qué publica | Repositorio @ commit | Versión | Licencia (dónde se verificó) |
|---|---|---|---|---|
| `labeledin` | Indicaciones rotuladas en fichas de la FDA (DailyMed 2012-08-28), anotadas por expertos (500 fichas) y por crowdsourcing (3 004 HIT). Fármaco: RxCUI de ingrediente; enfermedad: UMLS CUI. | `dhimmel/indications@11d535ba` (copia íntegra del FTP de NCBI, carpeta `labeledin/download/`) | LabeledIn 2014-09-04 / 2015-01-31 | Dominio público, US Government Work (`labeledin/download/README.txt`, «PUBLIC DOMAIN NOTICE») |
| `pharmacotherapydb` | 1 388 pares fármaco–enfermedad clasificados por médicos: `DM` (modificador de la enfermedad), `SYM` (sintomático), `NOT` (no indicación). DOID + DrugBank. | `dhimmel/indications@11d535ba` (`catalog/indications.tsv`) | PharmacotherapyDB 1.0 | CC0 1.0 (`README.md`, sección License) |
| `drugcentral-2016` | Tabla de indicaciones de DrugCentral (texto `INDICATION_FDB` de OMOP v4, UMLS CUI, DOID) y tabla de identificadores (RxNorm, DrugBank, ChEMBL, UNII, MeSH, CHEBI). | `olegursu/drugtarget@64630f7c` (repositorio del autor de DrugCentral) | 2016-11-16 | CC BY 4.0 (`LICENSE`); atribución: DrugCentral |
| `drugmechdb` | 4 846 caminos mecanísticos curados, cada uno dentro de una indicación. Fármaco: MeSH (+ DrugBank); enfermedad: MeSH. | `SuLab/DrugMechDB@aef22421` | 2.0.1 (`CITATION.cff`) | CC0 1.0 (`LICENSE`) |
| `maxo` | Anotaciones MAxO de enfermedades raras; sólo se usan las 38 con extensión CHEBI (sustancia). Enfermedad: MONDO. Relación literal (`treats`, `prevents`, `contraindicated`, …) y cita (PMID). | `monarch-initiative/maxo-annotations@42edd966` | 2026-08-18 | CC BY 4.0 (`LICENSE`); atribución: Monarch Initiative |

## Cruces (no aportan relaciones)

| Clave | Uso | Repositorio @ commit | Licencia |
|---|---|---|---|
| `mondo` | `skos:exactMatch` MONDO ↔ MeSH, UMLS, DOID, OMIM, Orphanet, ICD-10 (OMS y CM), ICD-11, NCIt, EFO (`mondo.sssom.tsv`) | `monarch-initiative/mondo@a645ab57` | CC BY 4.0 (ontología MONDO) |
| DrugCentral `identifiers.tsv` | DRUG_ID ↔ RxCUI, DrugBank, ChEMBL, UNII, MeSH, CHEBI | `olegursu/drugtarget@64630f7c` | CC BY 4.0 |

## Qué se descarta de cada fuente cargada (y por qué)

- **SNOMED CT**: la columna `SNOMEDCT_CUI` de DrugCentral y las filas `SCTID` de MONDO no se guardan. Bolivia no es miembro de SNOMED International.
- **LabeledIn crowd**: sólo la respuesta mayoritaria `yes` es una indicación. `no-contra`, `no-char_risk`, `no-not-disease`, `no-unrelated` y `uncertain` se cuentan y se excluyen (no se reinterpretan como contraindicación ni como nada).
- **DrugCentral**: 2 788 filas sin UMLS CUI ni DOID (sin código de enfermedad, sólo texto).
- **MAxO**: 938 anotaciones sin sustancia CHEBI (acciones no farmacológicas: les corresponden a `justin/seed-procedures-treatments`).
- **UMLS CUI**: se guardan tal cual las publican fuentes de dominio público / CC BY como identificadores; no se carga contenido de UMLS. Riesgo residual anotado en `docs/seed-research/drug-treatments.md`.

## Evaluadas y no usadas

Ver la tabla completa, con el host bloqueado o la cláusula de licencia, en
`docs/seed-research/drug-treatments.md` («Fuentes descartadas y huecos»).
