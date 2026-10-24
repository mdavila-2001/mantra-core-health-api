# Fuentes del catálogo de análisis médicos

Los datos **normalizados** están en git, comprimidos en [`data/`](data/) (ver README). Las
descargas crudas viven **fuera de git**, en `<GLOSSARY_BUILD_DIR>/lab-tests-sources/<dir>/`
(por omisión `../glossary-data-build/`, hermana del repo), y se reproducen con los scripts
`fetch-*.mjs`. Cada uno anota URL o spec, SHA-256 y fecha en
`lab-tests-sources/manifest.json`, que se versiona copiado como `data/sources-manifest.json`.
Cada concepto cargado lleva su procedencia como propiedades: `source`, `source_name`,
`source_id`, `source_version`, `source_url`, `source_retrieved_at`, `source_license`,
`source_file` y `source_file_sha256`.

Verificado el 2026-10-24. Las licencias se leyeron en la fuente: portal, `package.json`,
`LICENSE` o `metadata.json`. Lo que no se pudo leer está marcado.

## Cargadas

| Fuente (`codeSystem`) | Vía y versión | Licencia | Cotejo con el original | Conceptos |
|---|---|---|---|---|
| **LOINC** (`loinc`) | **tx.fhir.org** (LOINC 2.82: clases, CLASSTYPE, STATUS, ORDER_OBS, nombres en-US/es-MX/es-AR) + **NLM Clinical Table Search Service** (componente, propiedad, método, unidades UCUM, tipo de dato, miembros de paneles). Scripts `fetch-loinc-txfhir.mjs` y `fetch-loinc-ctss.mjs` | LOINC © Regenstrief, licencia gratuita con aviso: https://loinc.org/license (el aviso va en `source_license`) | Las dos vías son servidores oficiales de terceros (HL7, NLM), no el zip de Regenstrief, que exige cuenta | 79 462 de 109 325 términos |
| **NCBI GTR** (`gtr-ncbi`) | FTP de NCBI: `test_version.gz`, `test_condition_gene.txt`, `tests_by_method_category.txt` (`fetch-gtr.mjs`) | Dominio público (NCBI/NLM); atribución pedida a GTR y a NAR 2013;41:D925 | Fuente primaria | 63 919 tests vigentes |
| **ICD-10-PCS FY2027** (`icd10pcs-cms`) | cms.gov: order file y code tables 2027 (`fetch-direct-sources.mjs`) | Obra del gobierno de EE. UU., dominio público | Fuente primaria. La copia FY2026 del paquete npm usada antes coincidía al 100 % con el order file 2026 de CMS | 4 402 de 79 256 válidos |
| **CIE-10-ES Procedimientos 2026** (designaciones ES de `icd10pcs-cms`) | sanidad.gob.es, `Procedimientos_Tabla_Referencia_CIE10ES_2026.xlsx` | Ministerio de Sanidad: reutilización autorizada, incluso comercial, citando la fuente | Fuente primaria | 4 397 designaciones (5 códigos nuevos de FY2027 sin traducción) |
| **CUPS — MinSalud Colombia** (`cups-co`) | datos.gov.co: `POSPOPULI-LABORATORIO` (s5f2-yivs) y `Procedimiento del PBS` (9zcz-bjue) | **CC BY-SA 4.0** (metadatos del portal) | Fuente primaria | 2 158 |
| **PAMI — Nomenclador Común** (`pami-nomenclador`) | datos.pami.org.ar, `nomenclador-comun.csv` (estructura de unidades feb. 2019) | **CC-BY-4.0** (API CKAN de datos.gob.ar) | Fuente primaria. El paquete npm usado antes tenía los mismos 4 739 códigos, pero con la caja de los nombres cambiada | 3 034 de 4 739 |
| **TUSS, tabla 22** (`tuss-ans`) | `@br-health-kit/tuss@1.0.0` (npm) | Dados abertos da ANS, redistribuidos sin modificación; paquete MIT | **Cotejado**: el ZIP oficial `pda-049-tuss.zip` de la ANS tiene el mismo SHA-256 que declara el paquete y 0 diferencias en 5 966 códigos | 2 211 de 5 966 |
| **SIGTAP, grupo 02** (`sigtap-sus`) | `@br-health-kit/sigtap@1.0.0` (npm; competencia 2026.08) | Dados públicos do Ministério da Saúde (DATASUS); paquete MIT | **No cotejado**: DATASUS publica sólo por FTP y el proxy del entorno sólo admite HTTPS | 1 108 |
| **FONASA, arancel MLE 2026** (`fonasa-mle`) | `@mariohealthbits/fonasa-mle-open@1.0.0` (npm) | Arancel público de FONASA; paquete MIT | **No cotejado**: fonasa.cl responde 403 | 648 de 2 515 |
| **HL7 Terminology**: tablas v2 0487, 0371, 0488, 0493, 0074 y `observation-category` | `hl7.terminology.r4@7.0.1` (npm, paquete oficial de HL7) | CC0-1.0 | Fuente primaria (paquete publicado por HL7) | 479 |
| **UCUM** (`ucum`) | `@lhncbc/ucum-lhc@8.0.1` (NLM-LHNCBC) + `ValueSet-ucum-common` de THO | UCUM: https://ucum.org/license; código LHC tipo BSD | **No cotejado**: ucum.org no expone `ucum-essence.xml` por URL directa | 888 |

Qué entra de cada arancel y por qué: `lib/tariffs.mjs` (`TARIFF_RULES` y `TARIFF_EXCLUSIONS`,
cada regla con la evidencia que la justifica). Para LOINC, `lib/domains.mjs`, con reglas
comprobadas contra las 435 clases reales. Ninguna fuente se fusiona con otra: no hay mapeo
publicado entre ellas, y no se inventa uno. La única excepción es la designación CIE-10-ES de
ICD-10-PCS, que es su traducción oficial con el mismo código.

## Soportadas pero no cargadas

| Fuente | Qué hace falta |
|---|---|
| **LOINC, zip oficial** | Cuenta en loinc.org. Agrega lo que no dan tx.fhir.org ni NLM: TIME_ASPCT, SYSTEM y SCALE_TYP en inglés, partes LP, Universal Lab Orders, Top 2000, RSNA Playbook y los 3 080 términos posteriores a 2.82. `build-lab-tests.mjs --loinc-release <v>` usa el zip si está en `lab-tests-sources/loinc/`. |

## Evaluadas y no cargadas

El detalle con motivo, por pasada, está en `docs/seed-research/lab-tests.md`, y la lista
estructurada en `GAPS` de `lib/sources.mjs`, que va al reporte de cobertura.
