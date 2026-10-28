# Fuentes del catálogo de análisis médicos

Los datos **normalizados** sí están en git, comprimidos en [`data/`](data/) (ver README).
Las descargas crudas viven **fuera de git**, en `<GLOSSARY_BUILD_DIR>/lab-tests-sources/<dir>/`
(por omisión `../glossary-data-build/`, hermana del repo). `fetch-lab-tests-sources.mjs`
baja las que llegan por npm (con `npm pack`, que verifica el `dist.integrity` del registro)
y anota spec, SHA-256 del tarball, integridad y fecha en `lab-tests-sources/manifest.json`.
Cada concepto cargado lleva su procedencia como propiedades: `source`, `source_name`,
`source_id`, `source_version`, `source_url`, `source_retrieved_at`, `source_license`,
`source_file` y `source_file_sha256`.

Verificado el 2026-10-24. Todas las licencias de abajo se leyeron en el propio paquete
(`package.json`, `LICENSE`, `metadata.json`). Cuando la licencia del archivo original no
se pudo leer porque el portal respondía 403, se dice así y queda a confirmar.

## Cargadas

| Fuente (`codeSystem`) | Dueño | Paquete npm (tarball SHA-256) | Versión de los datos | Licencia | Conceptos |
|---|---|---|---|---|---|
| HL7 Terminology: tablas v2 0487, 0371, 0488, 0493, 0074 y `observation-category` (`hl7-v2-*`, `hl7-observation-category`) | HL7 International | `hl7.terminology.r4@7.0.1` (`170c546f…12baa`) | CodeSystems 3.0.0 / 2.0.0 | **CC0-1.0** (`package.json`) | 479 |
| UCUM (`ucum`) | Regenstrief / UCUM Org.; tabla de NLM-LHNCBC | `@lhncbc/ucum-lhc@8.0.1` (`cf64e6ad…ca76e`) + `ValueSet-ucum-common` de THO | ucum-lhc 8.0.1 | UCUM: https://ucum.org/license; código LHC tipo BSD (`LICENSE.md`); combinaciones tomadas de LOINC: https://loinc.org/terms-of-use | 888 (772 de ucum-lhc + 116 que sólo están en ucum-common) |
| FONASA, arancel MLE 2026 (`fonasa-mle`) | FONASA (Chile) | `@mariohealthbits/fonasa-mle-open@1.0.0` (`b622019b…9e05c`) | 2026 | Arancel público de FONASA; paquete MIT. **No cotejado con el XLSX oficial** (fonasa.cl, 403) | 648 de 2 515 |
| SIGTAP, grupo 02 (`sigtap-sus`) | Ministério da Saúde / DATASUS (Brasil) | `@br-health-kit/sigtap@1.0.0` (`e5869f74…03d07`) | competencia 2026.08 (`TabelaUnificada_202608_v2608141139.zip`, checksum en `metadata.json`) | «Dados públicos do Ministério da Saúde (DATASUS), redistribuídos sem modificação» (`metadata.json`); paquete MIT | 1 108 de 1 108 del grupo 02 |
| TUSS, tabla 22 (`tuss-ans`) | ANS (Brasil) | `@br-health-kit/tuss@1.0.0` (`5c09f69c…4dd54`) | 2026.06.26 (`pda-049-tuss.zip`, checksum en `metadata.json`) | «Dados abertos da ANS, redistribuídos sem modificação»; paquete MIT. **Cotejado** el 2026-10-27: el ZIP oficial de dadosabertos.ans.gov.br es byte a byte el del paquete (SHA-256 8d3bc59e…). La ANS no declara texto de licencia propio para el conjunto: **a confirmar** | 2 211 de 5 966 |
| ICD-10-PCS FY2026 (`icd10pcs-cms`; **superada** por el FY2027 oficial completo de `procedures-treatments`, mismo code system) | CMS (EE. UU.) | `@cyanheads/medical-codes-mcp-server@0.4.1` (`8b493ed2…a9cbe`), tabla `codes` de `data/medical-codes.db` | ICD-10-PCS FY2026 (2025-10-01 → 2026-09-30, según `build_meta`) | Obra federal de EE. UU., **dominio público**; paquete Apache-2.0 | 4 397 de 79 115 válidos |
| PAMI, nomenclador de prácticas (`pami-nomenclador`) | PAMI (Argentina) | `nomenclador-salud-js@1.0.2` (`cb19be3f…1039e`) | conjunto de datos.gob.ar del 2022-08-03 | Datos abiertos de PAMI; paquete ISC. **Cotejado** con el CSV original de `datos.pami.org.ar` (CC-BY-4.0 según CKAN, SHA-256 07370b31…): mismos 4 739 códigos | 3 034 de 4 739 |
| NCBI Genetic Testing Registry (`gtr-ncbi`) | NCBI / NLM (EE. UU.) | HTTP directo: `ftp.ncbi.nlm.nih.gov/pub/GTR/data/` (`test_version.gz` b9d49d82…, `test_condition_gene.txt` 8ffb7634…, `tests_by_method_category.txt`) | GTR 2026-10-22 (Last-Modified) | **Dominio público** (NCBI); no se cargan SNOMED CT, CLIA ni licencias estatales ni datos personales del XML | 63 914 |
| DICOM PS3.16 CID 29 «Acquisition Modality» (`dicom-dcm`) | NEMA | HTTP: ValueSet FHIR oficial y Annex D de `dicom.nema.org` | PS3.16 2026d; CID 29 20231115 | «free to download and use»; **sin texto de redistribución: a confirmar por el propietario** (capa aislada, se retira sola) | 51 |
| RSNA RadLex Playbook (`radlex-playbook`) | RSNA | HTTP: `playbook.radlex.org` / `api3.rsna.org` (`complete-playbook-dev.csv` 9d83635e…); la hoja de CPT (AMA) no se lee | descarga 2026-10-27 | RadLex License 2.1 (copia en `data/licenses/`): redistribución y adaptación con avisos, sin cambiar RPID, nombres ni descripciones | 4 772 |

Qué entra de cada arancel y por qué: `lib/tariffs.mjs` (`TARIFF_RULES` y `TARIFF_EXCLUSIONS`,
cada regla con la evidencia que la justifica). Ninguna fuente se fusiona con otra: no hay
mapeo publicado entre FONASA, SIGTAP, TUSS, PAMI, ICD-10-PCS y LOINC, y no se inventa uno.

## Soportada, pero no obtenible desde esta sesión

| Fuente | Qué hay que hacer |
|---|---|
| **LOINC** (columna vertebral del laboratorio) | Una persona crea la cuenta gratuita en https://loinc.org/, acepta la licencia, baja «LOINC Table + Accessory Files» y lo descomprime en `lab-tests-sources/loinc/`. Después: `build-lab-tests.mjs --loinc-release <versión>` (opcional `--es-variant <ID>`). El parser lee `Loinc.csv`, `Part.csv`, `LoincPartLink_Primary.csv`, `PanelsAndForms.csv`, `LinguisticVariants.csv` + `es*LinguisticVariant.csv`, `LoincUniversalLabOrdersValueSet.csv`, `LoincRsnaRadiologyPlaybook.csv` y Top 2000. **No se validó contra los archivos reales**: lee por cabecera y aborta mostrando las cabeceras reales si no coinciden. Licencia: https://loinc.org/license (gratuita, con atribución; el aviso va en `source_license`). |

## Obtenible pero NO cargada (decisión del propietario)

| Fuente | Por qué no entra |
|---|---|
| CUPS Colombia, POSpópuli laboratorio (1 339) y procedimientos del PBS (8 114), datos.gov.co `s5f2-yivs` / `9zcz-bjue` | Licencia **CC BY-SA 4.0** declarada por el portal (2026-10-28): CompartirIgual sin precedente aceptado en el repo. `lib/cups-co.mjs` y su prueba existen; se construye sólo con `build-lab-tests.mjs --include-share-alike`. Atribución: «Ministerio de Salud y Protección Social - MinSalud, Bogotá D.C.». La CUPS 2025 oficial (Resolución 2706 de 2025) la carga `specialty-services`. |

## Sin fuente obtenible (re-sondeo 2026-10-28)

México (`datos.gob.mx` 403; DGIS sin catálogo descargable), SUS Bolivia (`minsalud.gob.bo` sin respuesta), originales de FONASA (403) y de SIGTAP (el portal informa que las descargas están indisponibles; `ftp2.datasus.gov.br` 503). Detalle en `GAPS` de `lib/sources.mjs` y en `docs/seed-research/lab-tests.md`.

## Evaluadas y no cargadas

El detalle con motivo, por pasada, está en `docs/seed-research/lab-tests.md`, y la lista
estructurada en `GAPS` de `lib/sources.mjs`, que también va al reporte de cobertura.
