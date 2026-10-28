# Investigación de semillas — análisis médicos

Pedido del propietario: «todos los análisis médicos que existen, con sus features posibles,
clasificados por la categoría». Varias pasadas, hasta que no se pueda encontrar más.

Importador: [`tools/terminology-import/lab-tests/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/tools/terminology-import/lab-tests/README.md) ·
fuentes y licencias: [`SOURCES.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/tools/terminology-import/lab-tests/SOURCES.md) ·
pruebas: `tools/terminology-import/test/lab-tests.test.mjs`.

## Resumen (2026-10-24)

- **11 398 prestaciones diagnósticas** de 5 fuentes oficiales de 4 países, más **1 367
  conceptos de descripción** (479 de muestra y sección de HL7, 888 unidades UCUM).
  **12 765 conceptos** en total, 221 139 propiedades, 3 682 designaciones en castellano,
  119 value sets y 36 139 membresías.
- **LOINC no está cargado.** El parser y la carga existen y están probados con CSV sintéticos,
  pero la distribución exige cuenta en loinc.org. Además, desde esta sesión loinc.org, NLM Clinical
  Tables, NCBI GTR, RSNA Playbook y tx.fhir.org responden 403 (política de red del entorno). Es el
  hueco principal: con LOINC, el laboratorio pasaría de miles a decenas de miles de términos, con sus
  6 ejes, unidades, paneles y variante en castellano.
- La saturación se alcanzó **dentro de lo alcanzable** desde la sesión (npm, PyPI, Maven): las
  pasadas 7 y 8 aportaron 0 conceptos nuevos. No es la saturación de internet: las fuentes primarias
  siguen bloqueadas.

## Cómo se modela hoy (paso 0)

- La orden de estudios (`clinical.service_requests.code_concept_id`) usa **92 códigos locales**
  (`LAB_*`, `IMG_*`… en `clinical.concepts.ts`, value set `service-request-code`). Está documentado
  que **no** usa LOINC a propósito: un código LOINC es una *medición*, no el *servicio* que se pide.
  Este catálogo **no toca** ese binding: enlazar un estudio local con un código de catálogo es una
  decisión clínica de quien gobierne el nomenclador.
- Laboratorio: `diagnostics.laboratory_work_order_tests.test_code_concept_id` y
  `diagnostic_units.diagnostic_study_offerings.study_concept_id` apuntan a `terminology.catalog_concepts`
  sin value set que los acote. Este catálogo les da contenido real.
- Espécimen y contenedor: `specimen-type` (subconjunto de HL7 0487) y `specimen-container-type`
  (color de tapa ISO 6710) ya los siembra el boot. Acá se carga la tabla 0487 **completa** (315)
  y la 0371 de aditivos (57) como code systems aparte, sin pisar los conceptos del boot.
- Patrón de corpus grande: `tools/terminology-import/` (glosario, medicamentos). Se replicó: fuentes
  fuera de git, NDJSON intermedio, plan puro y cargador idempotente con dry-run.

## Protocolo de saturación — pasadas

| # | Fuentes | Nuevos tras deduplicar | Descartado (motivo) |
|---|---|---|---|
| 0 | Sondeo de red: loinc.org, clinicaltables.nlm.nih.gov, tx.fhir.org, fhir.loinc.org, ftp.ncbi.nlm.nih.gov (GTR), playbook.radlex.org, ucum.org, datos.gov.co, fonasa.cl, argentina.gob.ar, datos.gob.mx, minsalud.gob.bo, inlasa.gob.bo, sanidad.gob.es, wikidata, medlineplus, mayocliniclabs | — | **Todos 403** (CONNECT rechazado por la política de red del entorno). Llegan: registry.npmjs.org, pypi.org, repo1.maven.org. |
| 1 | HL7 Terminology `hl7.terminology.r4@7.0.1` (npm, CC0): tablas v2 0487, 0371, 0488, 0493, 0074 y `observation-category` | **479** | v2-0070 (fuente del espécimen, reemplazada por 0487 desde v2.5); designaciones en alemán (no hay concepto de idioma y no sirven). |
| 2 | UCUM: `@lhncbc/ucum-lhc@8.0.1` (`ucumDefs.min.json`) + `ValueSet-ucum-common` de THO | **888** (772 + 116 que sólo están en ucum-common; 732 coinciden por código) | 24 prefijos UCUM (no son unidades). |
| 3 | Value sets con códigos LOINC en paquetes HL7 de npm: THO, FHIR R4 core (vía `@medplum/definitions@5.2.7`), `hl7.fhir.uv.genomics-reporting@3.0.0`, `hl7.fhir.uv.livd@1.0.0-ballot` | **0** | 6 512 códigos LOINC encontrados: 6 401 + 691 son la ontología de **documentos**, no análisis; 13 de signos vitales y 16 de biomarcadores de genómica con el `display` de HL7, que no es el nombre oficial de LOINC. Cargarlos le ganaría al nombre oficial (mismo id, `ON CONFLICT DO NOTHING`): se espera a `Loinc.csv`. Los de LIVD son ejemplos (`example.org`). DICOM DCM (3 156 conceptos en `@medplum`): sin la lista de miembros de CID 29 no se distinguen las modalidades sin adivinar. |
| 4 | Búsqueda en npm («loinc», «radlex», «genetic testing registry», «ucum», «specimen», «hl7 v2 tables», «fonasa»…) → `@mariohealthbits/fonasa-mle-open@1.0.0` (arancel MLE 2026, extraído de los XLSX oficiales de FONASA) | **648** | Wrappers/MCP de APIs bloqueadas (`@ncbijs/*`, `@pipeworx/*`, `@omophub/*`), SDK sin datos, `@precisa-saude/fhir` (rangos de referencia de un tercero, no oficiales). FONASA: 1 863 fuera por prefijo (consultas, cirugías, días cama…). |
| 5 | Búsqueda de aranceles nacionales → `@br-health-kit/sigtap@1.0.0` (SIGTAP 2026.08), `@br-health-kit/tuss@1.0.0` (TUSS 2026.06.26), `nomenclador-salud-js@1.0.2` (PAMI 2022). **Barrido de nombres terapéuticos** («tratamiento», «angioplastía», «drenaje», «ablación»…) sobre lo incluido. | **6 353** (1 108 + 2 211 + 3 034) | TUSS: 3 613 fuera por prefijo y 142 por exclusión explícita (4.08.09, 4.08.13, 4.08.14, 40502210). PAMI: 1 702 fuera por prefijo y 3 drenajes. FONASA: 4 códigos terapéuticos del subgrupo 04-02. `br.go.ses.exame` (IG FHIR de Goiás): perfiles, sin catálogo. |
| 6 | `@cyanheads/medical-codes-mcp-server@0.4.1` → ICD-10-PCS FY2026 (CMS, dominio público), secciones B, C1–C6, 4 y F0–F5 | **4 397** | 74 718 códigos PCS no diagnósticos (médico-quirúrgicos, terapias, C7 = terapia con radionúclidos, F6–FF = tratamientos). HCPCS P/R (61): casi todos hemoderivados y traslados, y HCPCS ya tiene `import-hcpcs.mjs`. ICD-10-CM: diagnósticos, fuera de alcance. |
| 7 | npm («examenes de laboratorio», «analisis clinicos», «laboratorio clinico», «dicom modality/cid/dictionary», «genetic tests», «orphanet», «hpo», «obo», «mesh», «snomed spanish», «cie-10-es») y PyPI (`pysus`, `pronto`, `obonet`, `pyobo`, `bioontologies`, `medcat`, `scispacy`, `pymedtermino`, `hpo3`, `pyhpo`, `mondo`) | **0** | Las bibliotecas de PyPI bajan sus datos en tiempo de ejecución desde hosts bloqueados. Las de npm no traen catálogos (o son de otros dominios). |
| 8 | Maven: `ca.uhn.hapi.fhir:hapi-fhir-validation-resources-r4:8.12.1` (recursos de la especificación FHIR R4), en busca de DICOM CID 29 | **0** | Sólo trae la *referencia* a `ValueSet/dicom-cid29`, no su contenido. `org.hl7.fhir.r4:core` no existe en Maven. |
| 9 | Re-sondeo de los hosts primarios (2026-10-24T01:09Z) | — | Siguen bloqueados: loinc.org, clinicaltables.nlm.nih.gov, ftp.ncbi.nlm.nih.gov, playbook.radlex.org, tx.fhir.org, ucum.org, fonasa.cl, datos.gov.co, datos.gob.ar, dadosabertos.ans.gov.br, minsalud.gob.bo, inlasa.gob.bo, dicom.nema.org, cms.gov. |

**Las pasadas 7 y 8 aportan 0 → corte.** Para seguir hacen falta las fuentes primarias (abajo).

## Cobertura

### Prestaciones diagnósticas por dominio y fuente

| Dominio | FONASA (CL) | SIGTAP (BR) | TUSS (BR) | ICD-10-PCS (US) | PAMI (AR) | **Total** |
|---|---:|---:|---:|---:|---:|---:|
| Laboratorio clínico | 443 | 527 | 1 456 | — | 2 658 | **5 084** |
| Imagenología | 187 | 233 | 369 | 3 356 | 315 | **4 460** |
| Anatomía patológica | 13 | 14 | 44 | — | 41 | **112** |
| Genética y molecular | — | 25 | 144 | — | 20 | **189** |
| Pruebas funcionales | 5 | 127 | 198 | 961 | — | **1 291** |
| Sin dominio (diagnósticos, sin dominio claro) | — | 182 | — | 80 | — | **262** |
| **Total** | **648** | **1 108** | **2 211** | **4 397** | **3 034** | **11 398** |

«Sin dominio» son procedimientos del grupo diagnóstico oficial que no caben en los cinco dominios:
SIGTAP 02.01 coleta de material, 02.09 endoscopia, 02.12 hemoterapia y 02.13 vigilancia; PCS C4–C6
y 4B. Entran al catálogo con su categoría, pero no a un value set de dominio.

### Categorías

112 categorías con nombre de fuente: 60 formas de organización de SIGTAP con su nombre oficial
(p. ej. «Diagnóstico em laboratório clínico › Exames de genética»), 20 sección›tipo de ICD-10-PCS
(«Imaging › Computerized Tomography (CT Scan)»; en la sección F sólo «tipo 0…5», porque el texto
oficial no nombra el tipo de forma uniforme), las 6 tablas HL7, 5 categorías de UCUM y los prefijos
de FONASA, TUSS y PAMI. Esos aranceles no publican el nombre del capítulo en sus datos, así que la
categoría es el prefijo, sin nombre inventado. Cada categoría es un value set
(`lab-catalog-<fuente>-cat-<código>`).

### Features por concepto

| Fuente | Qué trae |
|---|---|
| LOINC (si se carga) | 6 ejes, clase y tipo de clase, estado, unidades UCUM de ejemplo, pedible/observación, tipo de panel y miembros con orden y obligatoriedad, partes LP, rangos de uso frecuente, Universal Lab Orders, Top 2000, partes RadLex del Playbook, nombre y ejes en castellano. |
| SIGTAP | Subgrupo y forma oficiales, complejidad, restricción de sexo, edad mínima/máxima (meses), valores SUS (ambulatorio, hospitalario, profesional, en centavos de BRL). |
| FONASA | Precio y copago por nivel 1–3 (CLP), nombre oficial verbatim. |
| TUSS | Vigencia (`startsAt`, `endsAt`, `implementedUntil`). |
| ICD-10-PCS | Sección oficial, tipo, descripción corta y larga. |
| HL7 | Estado, versión en que se deprecó, comentario oficial, URL canónica. |
| UCUM | Símbolo, propiedad, dimensión, magnitud, métrica/base/especial/arbitraria, sinónimos, origen (UCUM o LOINC), nombre común de HL7. |

**Rangos de referencia: ninguno.** Ninguna fuente cargada los publica, y no se inventan.
**Tubo/contenedor por análisis: ninguno.** Sólo lo publican los catálogos de laboratorios de
referencia (Mayo, ARUP, Quest), que no sirven como fuente.

### Lo que se carga y hoy no lee ninguna consulta de producto

Todo el catálogo se puede leer por los endpoints genéricos públicos (`GET /terminology/value-sets?code=…`,
`/:id/$expand?includeProperties=true`, `GET /terminology/CodeSystem/$lookup`). Pero **ningún flujo de
producto lo consume todavía**: la orden de estudios sigue con sus 92 códigos locales y la recepción de
muestras con su subconjunto de 0487. Tamaño medido en Postgres 16 desechable: 12 765 conceptos,
221 139 propiedades, 3 682 designaciones, 36 139 membresías; **≈71 MB** en el schema `terminology`
(tablas + índices, sólo este catálogo).

## Calidad y decisiones

- **Prefijos homogéneos, verificados ítem por ítem.** Un subgrupo de arancel entra entero sólo si todo
  su contenido es diagnóstico del mismo dominio (evidencia por regla en `TARIFF_RULES`). Los subgrupos
  mixtos quedan fuera con su tamaño. FONASA: 11-01 (38), 12-01 (39), 13-01 (37), 17-01 (54: ECG junto a
  angioplastía y ablación), 17-07 (42: espirometría junto a aerosolterapia), 18-01 (37), 19-01 (25),
  20-01 (18). TUSS: 4.02 endoscopia (115), 4.04 hemoterapia (156), 4.07 medicina nuclear con terapia
  (97), 4.12 radioterapia (50), 4.13 (56) y 4.15 (30). PAMI: 17, 26, 28, 29, 30, 31… Contienen pruebas
  funcionales reales que **requieren curaduría humana** para entrar.
- **FONASA en mayúsculas:** `display` aplica `displayCase` (sólo cambia la caja, como en INLASA) y el
  original va en `tariff_official_name`. Quedan artefactos menores de la regla de siglas («ÓSEA», «PH», «IGM»).
- **Redistribuciones.** FONASA, SIGTAP, TUSS, PAMI e ICD-10-PCS se tomaron de paquetes npm que
  republican los archivos oficiales. SIGTAP, TUSS e ICD-10-PCS declaran el archivo oficial, la versión y
  el checksum de origen; FONASA y PAMI no. Ninguna se pudo cotejar con el original (403): queda dicho en
  `source_license` de cada concepto.
- **PAMI es de 2022** y publica 295 análisis con el mismo nombre en los capítulos 66 y 77, como prácticas
  distintas. Se cargan tal cual, sin deduplicar por nombre, porque son dos códigos oficiales.
- **Sin traducciones propias.** Castellano sólo donde la fuente lo es (FONASA, PAMI) o lo será (variante
  LOINC). SIGTAP y TUSS quedan en portugués, e ICD-10-PCS, HL7 y UCUM en inglés. CIE-10-ES Procedimientos
  (Ministerio de Sanidad) es la traducción oficial de ICD-10-PCS y ya tiene importador en el glosario
  (`import-cie10es.mjs`). Sus designaciones no están enlazadas a estos conceptos (sanidad.gob.es, 403).

## Huecos

| Hueco | Causa | Acceso necesario |
|---|---|---|
| **LOINC completo** (laboratorio con 6 ejes, paneles, unidades, variante ES, Playbook RSNA, Universal Lab Orders, Top 2000) | cuenta de usuario + red | Cuenta en loinc.org y el zip en `lab-tests-sources/loinc/`; o habilitar `loinc.org` en la red del entorno. Alternativa sin cuenta (subconjunto público, sin paneles ni ES): habilitar `clinicaltables.nlm.nih.gov` y correr `import-loinc.mjs`; este catálogo enriquece los mismos ids. |
| NCBI GTR (genética) | red | Habilitar `ftp.ncbi.nlm.nih.gov`. Parser a escribir contra el archivo real (no a ciegas). |
| RSNA RadLex Playbook | red | Viene dentro de LOINC (`LoincRsnaRadiologyPlaybook.csv`, ya soportado) o habilitando `playbook.radlex.org`. |
| DICOM CID 29 (modalidades) | red | `dicom.nema.org`. |
| CUPS (Colombia), México, SUS Bolivia | red | `datos.gov.co`, `datos.gob.mx`, `minsalud.gob.bo`. INLASA (Bolivia) ya tiene `import-inlasa.mjs`; el HTML necesita `inlasa.gob.bo`. |
| Cotejo de FONASA, TUSS, PAMI con sus originales | red | `fonasa.cl`, `dadosabertos.ans.gov.br`, `datos.gob.ar`. |
| Subgrupos mixtos (≈ 1 000 prestaciones con pruebas funcionales y endoscopias) | curaduría | Clasificación ítem por ítem por una persona. |
| Licencia de los conjuntos TUSS (portal ANS) y PAMI (datos.gob.ar) | a confirmar | Leer la licencia en el portal (403 desde la sesión). |
| SNOMED CT | licencia | Bolivia no es miembro de SNOMED International. |
| CPT | licencia | AMA, comercial. |
| Rangos de referencia, tubo por análisis | sin fuente abierta | — |

## Propuestas para el repo del modelo (sin DDL en la API)

Todo entró en las tablas existentes. Mejoras posibles en el modelo:

1. **`concept_designations` sin procedencia.** No hay columna para la variante o el productor (p. ej.
   LOINC esAR vs. esES) ni para marcar una traducción no oficial. Hoy va como propiedad del concepto
   (`designation_es_source`). Propuesta: `source_id` y/o `use_context` en la designación.
2. **Idioma portugués.** No existe `terminology:language:pt`; SIGTAP y TUSS van sin designación. Es un
   concepto, no DDL: se puede agregar en `concepts.ts` en un cambio aparte.
3. **Versionado de conceptos.** `catalog_concepts` tiene `UNIQUE (code_system_version_id, code)`, pero los
   importadores usan ids independientes de la versión (`md5(code)`), así que una versión nueva no vuelve a
   cargar un código existente. Decidir si un concepto pertenece a una versión o al code system.

## Cómo se midió

- Postgres 16 desechable (sin Docker), con `database/SQL/00_shared/00_types.sql` y `03_terminology/0{1..4}_*.sql`,
  más los 6 conceptos internos que exige el cargador (estado activo, idioma ES, tipos de designación,
  relaciones part-of/is-a), insertados a mano en lugar de arrancar la API.
- Carga parcial (`--layers hl7-tho,ucum`) y luego total: 12 765 conceptos, 221 139 propiedades, 3 682
  designaciones, 119 value sets, 36 139 membresías. **Segunda corrida: 0 filas nuevas** (sólo los 12
  registros de lote, que son auditoría).
- La ruta LOINC (designaciones ES, relaciones part-of con orden, value sets de clase/panel/pedible) se
  cargó en otra base desechable con los CSV sintéticos de las pruebas. Segunda corrida: 0 nuevas.
- `node --test "tools/terminology-import/test/*.test.mjs"`: 46/46 (12 de este catálogo).

## Cierre de huecos — 2026-10-28 (carril C3)

La sección «Huecos» de arriba es la de 2026-10-24 (red bloqueada) y queda como historia. Estado de hoy,
re-sondeado (`docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C3/sondeo-2026-10-28.tsv`).

| Hueco | Estado hoy | Qué se cargó |
|---|---|---|
| NCBI GTR (genética) | `ftp.ncbi.nlm.nih.gov` 200 | **63 914** pruebas vigentes y públicas (condición MedGen/MIM, gen, método, laboratorio), dominio público |
| DICOM CID 29 | `dicom.nema.org` 200 | **51** modalidades DCM, definición verbatim del Annex D; licencia «free to download and use» sin texto de redistribución: capa aislada, a confirmar |
| RSNA RadLex Playbook | `playbook.radlex.org` 200 | **4 772** RPID con atributos, subconjuntos y mapeos a LOINC/RadLex que publica la planilla; RadLex License 2.1 (copia en `data/licenses/`) |
| Cotejo TUSS y PAMI | `dadosabertos.ans.gov.br` 200; `datos.pami.org.ar` 200 (`datos.gob.ar` 502) | Hecho: TUSS byte a byte igual (5 966 filas); PAMI mismos 4 739 códigos, licencia CC-BY-4.0 |
| Cotejo FONASA / SIGTAP | `fonasa.cl` 403; SIGTAP: el portal informa descargas indisponibles, `ftp2.datasus.gov.br` 503 | Sin cotejo; siguen desde la redistribución npm |
| CUPS Colombia | `datos.gov.co` 200 | **No cargada**: el portal declara CC BY-SA 4.0 (CompartirIgual) sin precedente en el repo. Parser y prueba listos (1 339 de laboratorio, 8 114 de procedimientos); se activa con `--include-share-alike` tras decisión del propietario |
| México | `datos.gob.mx` 403; DGIS 200 por http sin catálogo descargable | Nada obtenible |
| SUS Bolivia | `minsalud.gob.bo` sin respuesta | Nada obtenible |
| LOINC completo | `loinc.org` 403; exige cuenta (no se crea) | Sigue siendo el hueco principal. **Novedad:** `clinicaltables.nlm.nih.gov` responde 200 (el subconjunto público de `import-loinc.mjs`, p. ej. 25 169 códigos con prefijo «1»): el importador genérico puede correr; no se corrió en este carril |

**Antes / después (este importador).** 12 765 → **81 502** conceptos (11 398 prestaciones de aranceles e ICD-10-PCS
FY2026 + 1 367 de descripción + 63 914 GTR + 51 DICOM + 4 772 RadLex); 221 139 → **2 091 449** propiedades;
3 682 designaciones; 119 → **167** value sets; 36 139 → **334 668** membresías.

**Carga medida** (Postgres 16 desechable, DDL de `00_shared` + `03_terminology`, 6 conceptos internos sembrados con
`procedures-treatments/test/disposable-db/seed-internal.mjs`): 1.ª corrida 81 502 conceptos en 112 s; **2.ª corrida: 0
filas nuevas** (sólo los 15 lotes de auditoría). Integridad: 0 huérfanos, 0 duplicados por (versión, código), 0 nulos.

**Reproducibilidad.** Reconstruido desde las fuentes re-descargadas: 8 de 10 capas dan el mismo SHA-256 que lo
versionado (HL7, UCUM, FONASA, SIGTAP, TUSS, ICD-10-PCS FY2026, GTR, DICOM). PAMI y RadLex difieren sólo en
`provenance.retrievedAt` (y el SHA compuesto de entrada de RadLex, porque la API de RSNA regenera el `.xlsx` con bytes
distintos en cada pedido); su contenido es idéntico fila por fila.

**Hallazgo: ICD-10-PCS duplicado entre versiones.** `procedures-treatments` carga el FY2027 oficial completo
(79 256) y esta capa trae 4 397 códigos del FY2026 (npm) en el mismo code system `icd10pcs-cms`: los 4 397 existen en
FY2027 con el mismo texto, pero son otros conceptos (otros ids) y los value sets de dominio apuntan a los de FY2026.
No hay duplicados por (versión, código), pero sí 4 397 códigos presentes en dos versiones. Propuesta (decisión del
propietario): retirar la capa FY2026 y que los value sets de dominio apunten a los conceptos FY2027 (que además
tienen el castellano oficial de CIE-10-ES).
