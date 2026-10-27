# Fuentes — tratamientos farmacológicos por enfermedad

Hay dos tipos de fuente:

- **GitHub** (pasadas del 2026-10-24): se bajan con `git clone` **en un commit fijado** (`lib/sources.mjs`) a
  `glossary-data-build/cache/drug-treatments/` (fuera de git). `manifest.json` guarda, por clon, el commit, la fecha
  del commit, la fecha de descarga y el SHA-256 de cada archivo leído. Licencias verificadas el 2026-10-24 contra el
  archivo de licencia o el aviso del propio repositorio.
- **HTTP** (pasadas del 2026-10-27, `lib/open-sources.mjs`): las baja `fetch-open-sources.mjs` a
  `glossary-data-build/cache/drug-treatments-http/`. Su `manifest.json` guarda por archivo la URL, la fecha de descarga,
  el SHA-256, los bytes y, si el servidor los da, ETag y Last-Modified; los archivos que se extraen de un crudo grande
  (zip de MED-RT, `desc2026.xml`, volcado de DrugCentral, Parquet de Open Targets, xlsx de la EMA) llevan el SHA-256 del crudo
  en `derivedFrom`. Estas fuentes no tienen commit: la «versión» es la que declara la fuente más la fecha de descarga, y lo
  normalizado de `data/` es lo que queda versionado. Licencias leídas el 2026-10-27 en la fuente (URL en cada fila).

## Fuentes cargadas

| Clave | Qué publica | Repositorio @ commit | Versión | Licencia (dónde se verificó) |
|---|---|---|---|---|
| `labeledin` | Indicaciones rotuladas en fichas de la FDA (DailyMed 2012-08-28), anotadas por expertos (500 fichas) y por crowdsourcing (3 004 HIT). Fármaco: RxCUI de ingrediente; enfermedad: UMLS CUI. | `dhimmel/indications@11d535ba` (copia íntegra del FTP de NCBI, carpeta `labeledin/download/`) | LabeledIn 2014-09-04 / 2015-01-31 | Dominio público, US Government Work (`labeledin/download/README.txt`, «PUBLIC DOMAIN NOTICE») |
| `pharmacotherapydb` | 1 388 pares fármaco–enfermedad clasificados por médicos: `DM` (modificador de la enfermedad), `SYM` (sintomático), `NOT` (no indicación). DOID + DrugBank. | `dhimmel/indications@11d535ba` (`catalog/indications.tsv`) | PharmacotherapyDB 1.0 | CC0 1.0 (`README.md`, sección License) |
| `drugcentral-2016` | Tabla de indicaciones de DrugCentral (texto `INDICATION_FDB` de OMOP v4, UMLS CUI, DOID) y tabla de identificadores (RxNorm, DrugBank, ChEMBL, UNII, MeSH, CHEBI). | `olegursu/drugtarget@64630f7c` (repositorio del autor de DrugCentral) | 2016-11-16 | CC BY 4.0 (`LICENSE`); atribución: DrugCentral |
| `drugmechdb` | 4 846 caminos mecanísticos curados, cada uno dentro de una indicación. Fármaco: MeSH (+ DrugBank); enfermedad: MeSH. | `SuLab/DrugMechDB@aef22421` | 2.0.1 (`CITATION.cff`) | CC0 1.0 (`LICENSE`) |
| `maxo` | Anotaciones MAxO de enfermedades raras; sólo se usan las 38 con extensión CHEBI (sustancia). Enfermedad: MONDO. Relación literal (`treats`, `prevents`, `contraindicated`, …) y cita (PMID). | `monarch-initiative/maxo-annotations@42edd966` | 2026-08-18 | CC BY 4.0 (`LICENSE`); atribución: Monarch Initiative |

## Fuentes HTTP cargadas (2026-10-27)

| Clave | Qué publica | Versión | Licencia (dónde se leyó) |
|---|---|---|---|
| `medrt` | MED-RT del VA: `may_treat`, `may_prevent`, `may_diagnose` y `CI_with` (ingrediente RxNorm o clase farmacológica → concepto MeSH `M#`), con la autoridad que lo afirma (MEDRT, FMTSME, FDASPL) | 2026.10.05 (`Core_MEDRT_XML.zip`, NCI EVS) | Obra del VA (gobierno federal de EE. UU.). **El paquete no trae aviso de licencia**: se trata como dominio público por lo que declara el pedido; a confirmar por el propietario. Las relaciones con SNOMED CT no se cargan |
| `chembl` | `drug_indication` de ChEMBL: 60 055 indicaciones con fase máxima, MeSH y EFO/HP/Orphanet y referencias (ClinicalTrials, DailyMed, ATC, FDA, EMA…) | ChEMBL_37 (2026-05-01), API del EBI | **CC BY-SA 3.0** (README y LICENSE del FTP de ChEMBL). Compartir igual y atribución «ChEMBL data is from http://www.ebi.ac.uk/chembl - the version of ChEMBL is chembl_37». Code system propio para poder retirarlo. **Decisión del propietario** (ver reporte) |
| `drugcentral` | `omop_relationship` de DrugCentral 2027: indicación, contraindicación, uso fuera de indicación, tratamiento sintomático, reduce el riesgo, diagnóstico (UMLS CUI). Más identificadores y ATC por fármaco | volcado 2026-09-25 (dbversion 56) | **CC BY-SA 4.0** (https://drugcentral.org/privacy). Compartir igual; code system propio. Las columnas SNOMED CT no se guardan. **Decisión del propietario** |
| `wikidata` | P2176 «drug or therapy used for treatment» (en la enfermedad) y P2175 «medical condition treated» (en el fármaco), con rango y «stated in» | consulta del 2026-10-27 | CC0 1.0 (Wikidata:Licensing) |
| `eeml` | WHO eEML: recomendaciones medicamento ↔ indicación con ATC e ICD-11 (sin formulaciones ni concentraciones) | páginas del 2026-10-27 | **CC BY 3.0 IGO** (https://list.essentialmeds.org/licencing): uso comercial permitido con la atribución que exige; no se usa el logo de la OMS |
| `ema` | Informe de medicamentos de la EMA (EPAR): medicamentos humanos autorizados, ATC y área terapéutica (encabezado MeSH) | informe del 2026-10-27 18:05 | Aviso legal de la EMA: reproducción y distribución, comercial o no, citando a la EMA como fuente |
| `opentargets` | Open Targets Plataforma 26.09, `clinical_report`: solo los informes de provider EMA, tipo INDICATION y etapa APPROVAL (ChEMBL + MONDO/EFO) | 26.09 (2026-09-24) | CC0 1.0 (docs de la Plataforma). Los de TTD, PMDA y los derivados de ChEMBL no se cargan |
| `clinicaltrials` | ClinicalTrials.gov API v2: estudios intervencionales con intervención DRUG o BIOLOGICAL; pares (término MeSH de intervención, término MeSH de condición) con fase y estado | API 2.0.5, dataTimestamp 2026-10-27T09:00:04 | Obra de la NLM (https://www.nlm.nih.gov/web_policies.html): «Please acknowledge NLM as the source». Solo campos estructurados |
| `civic` | CIViC: evidencia PREDICTIVA aceptada (terapia NCIt ↔ enfermedad DOID, condicionada a un perfil molecular) | consulta del 2026-10-27 | CC0 1.0 (docs.civicdb.org, FAQ) |

## Cruces (no aportan relaciones)

| Clave | Uso | Origen | Licencia |
|---|---|---|---|
| `mesh-concepts` | concepto MeSH (`M#`) → descriptor (`D#`) solo si es el concepto **preferido** del descriptor; y encabezado principal → descriptor solo por igualdad exacta con un único `DescriptorName` (EMA) | `desc2026.xml` (NLM) | Obra de la NLM (términos de uso de MeSH) |
| `rxclass-atc` | RxCUI → **código** ATC nivel 5 | RxClass `classMembers?relaSource=ATC`, 939 clases ATC de nivel 4 | API pública de la NLM. De la OMS **solo el código**: no se guardan nombres de clase ni DDD |
| `chembl-atc` | molécula ChEMBL → código ATC | ChEMBL_37 `molecule.atc_classifications` | CC BY-SA 3.0 (solo el código) |
| `wikidata-ids` | RxCUI, ChEMBL, DrugBank, UNII o MeSH → código ATC (P267) del mismo ítem; solo si el código pertenece a un único ítem con ATC | Wikidata | CC0 1.0 |
| `drugcentral-ids` | `struct_id` → identificadores (RxCUI, ChEMBL, DrugBank, UNII, MeSH, ChEBI) y ATC | DrugCentral 2027 | CC BY-SA 4.0 (solo el código ATC) |

### Qué se puede guardar de ATC

Se guardan **códigos ATC de nivel 5** (la sustancia química) como código del fármaco en las fuentes que los publican
(eEML, EMA, Wikidata) o como código agregado por un cruce publicado (`crosswalk.drug`, con `via`, `predicate` y `from`).
**No** se guardan nombres de clases ATC ni DDD (derechos de la OMS / WHO Collaborating Centre). El propio catálogo del
producto ya ancla por código ATC (`vademecum`, `medicine_atc`); si el propietario concluye que ni el código se puede
redistribuir sin permiso de la OMS, se filtran las filas de `crosswalk.drug` con `system = 'ATC'` y las de las fuentes que
traen ATC como código del fármaco (`eeml`, `ema`).

### Cruces de GitHub

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
