# Investigación de semillas — análisis médicos

Pedido del propietario: «todos los análisis médicos que existen, con sus features posibles,
clasificados por la categoría». Varias pasadas, hasta que no se pueda encontrar más.

Importador: [`tools/terminology-import/lab-tests/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/tools/terminology-import/lab-tests/README.md) ·
fuentes y licencias: [`SOURCES.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/tools/terminology-import/lab-tests/SOURCES.md) ·
pruebas: `tools/terminology-import/test/lab-tests.test.mjs`.

## Resumen (2026-10-24, cierre de la fase con red abierta)

- **158 309 conceptos** de 10 fuentes oficiales de 5 países y de HL7/NLM/NCBI: **156 942 prestaciones
  diagnósticas** (LOINC 79 462, NCBI GTR 63 919, ICD-10-PCS 4 402, PAMI 3 034, TUSS 2 211, CUPS 2 158,
  SIGTAP 1 108, FONASA 648) y **1 367 conceptos de descripción** (479 tablas HL7 de muestra, aditivo,
  sección; 888 unidades UCUM). 3 864 840 propiedades, 114 065 designaciones en castellano oficiales,
  18 236 relaciones de panel, 313 value sets y 511 404 membresías.
- **LOINC 2.82 está cargado sin cuenta en loinc.org**, desde tx.fhir.org (servidor de terminología de
  HL7) y NLM Clinical Tables: clase como categoría, CLASSTYPE, estado, pedible/observación, los 6 ejes
  (componente, propiedad y método de NLM; tiempo, sistema y escala en castellano, del nombre corto
  es-AR), unidades UCUM, 1 934 paneles con sus miembros en orden y nombres oficiales es-MX/es-AR en
  79 435 términos. Lo que sólo trae el zip oficial queda pendiente (ver Huecos).
- **Saturación: no declarada.** Con la red abierta las pasadas 10–13 aportaron conceptos; la 14
  (re-sondeo) aportó 0; la 15 encontró una fuente candidata alcanzable (CDISC «Laboratory Test Code»,
  2 513 términos) que no se cargó por licencia sin verificar y una duda de alcance que decide el
  propietario. Hasta resolverla no hay dos pasadas seguidas en 0.
- **Rangos de referencia: ninguno**, porque ninguna fuente alcanzable los publica (NLM no trae `range`
  en ninguna unidad). No se inventan.

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
| 10 | **Red del entorno abierta (Full) a las 16:29Z.** Re-sondeo: responden clinicaltables.nlm.nih.gov, ftp.ncbi.nlm.nih.gov, www.ncbi.nlm.nih.gov, tx.fhir.org, ucum.org, dicom.nema.org, cms.gov, sanidad.gob.es, datos.gov.co, datos.gob.ar, dadosabertos.ans.gov.br. Siguen fuera: loinc.org (403 del propio servidor), fonasa.cl (403), inlasa.gob.bo y minsalud.gob.bo (sin respuesta). Fuente nueva: **NCBI GTR** (`test_version.gz`, `test_condition_gene.txt`, `tests_by_method_category.txt`) | **63 919** tests vigentes (`now_current = 1`) | 160 434 filas de versiones anteriores. Los códigos `test_currStat`/`test_pubStat` no están documentados por NCBI: se guardan crudos. 1 categoría de método con caracteres mal codificados en la fuente queda sin categoría mayor. Las páginas de test de GTR piden reCAPTCHA: no se usan (el FTP alcanza). |
| 11 | **CIE-10-ES Procedimientos 2026** (Ministerio de Sanidad; traducción oficial de ICD-10-PCS, mismo código) y **CUPS de MinSalud Colombia** en datos.gov.co: `POSPOPULI-LABORATORIO` (s5f2-yivs) y `Procedimiento del PBS` (9zcz-bjue), CC BY-SA 4.0 | **2 158** CUPS nuevos (1 402 laboratorio, 518 imagen, 170 funcionales, 68 patología), con el «Qué es» oficial como definición; **4 397** designaciones oficiales en castellano para ICD-10-PCS (todas: ningún código PCS falta en CIE-10-ES) | PBS: 811 códigos de 5 dígitos (otra codificación) y los prefijos mixtos o no diagnósticos (consultas 890–890x, cirugías…); exclusiones explícitas 911101, 954610, 954903, 954904. No hay tabla CUPS completa en datos.gov.co (búsquedas «CUPS», «Clasificación Única de Procedimientos»). |
| 12 | **Cotejo de las redistribuciones contra los originales** y cambio a archivos oficiales: TUSS (ZIP `pda-049-tuss.zip` de la ANS), PAMI (`nomenclador-comun.csv` de datos.pami.org.ar), ICD-10-PCS (order files 2026 y 2027 y code tables 2027 de cms.gov), SIGTAP (FTP de DATASUS) | **5** códigos ICD-10-PCS nuevos (FY2027, vigente desde el 2026-10-01; 4 402 en total) | TUSS: el ZIP oficial tiene el **mismo SHA-256** que declara el paquete npm (`8d3bc59e…`); 5 966 códigos, 0 diferencias de nombre o vigencia. PAMI: mismos 4 739 códigos, pero el paquete npm **había cambiado la caja** de los nombres; se pasa al CSV oficial (nombre verbatim, módulo, valor en pesos de febrero 2019; licencia **CC-BY-4.0** verificada en la API del portal). ICD-10-PCS FY2026 de npm = order file 2026 de CMS (79 115 códigos, 0 diferencias); se pasa a **FY2027 oficial** con nombres de tipo oficiales (code tables XML); 5 códigos nuevos sin traducción en CIE-10-ES 2026. SIGTAP: el FTP de DATASUS sólo responde por FTP (el proxy sólo admite HTTPS): **no cotejado**. FONASA: fonasa.cl sigue en 403: **no cotejado**. RSNA Playbook: la descarga exige aceptar la licencia RadLex (no se acepta en nombre del propietario). DICOM CID 29: legible, pero no se encontró la página de licencia de NEMA: no se carga. |
| 13 | **LOINC 2.82 sin cuenta**: tx.fhir.org (servidor de terminología de HL7: 435 clases descubiertas por exclusión, términos por `CLASS` con partición por `COMPONENT` cuando pasa de 3 000, `STATUS` y `ORDER_OBS` por filtros oficiales) + NLM Clinical Tables (112 405 términos: componente, propiedad, método, unidades, tipo de dato; 1 979 definiciones de panel pedidas, 1 747 publicadas) | **79 462** términos LOINC en el catálogo (de 109 325 de tx.fhir.org), 84 298 términos con nombre oficial en castellano (es-MX nombre largo, es-AR nombre corto), 1 934 paneles con 18 236 miembros | 29 863 términos sin dominio por clase (documentos, encuestas, adjuntos de reclamos, antecedentes, signos vitales, administración…; detalle en `excludedByClass`); `CARD.RISK` (puntajes) y `CARD.PROC` (mezcla intervenciones) sin dominio. **3 080** términos presentes en NLM pero no en tx.fhir.org: son posteriores a 2.82 (tx.fhir.org responde «Unknown code») y sin clase no se pueden clasificar. Ningún rango de referencia: NLM no publica `range` en ninguna unidad. tx.fhir.org responde 500 «not supported» ante una regex sin coincidencias (se trata como vacío) y 500 transitorios bajo carga (reintentos). |
| 14 | Re-sondeo de lo que quedó sin acceso (18:04Z): loinc.org, fonasa.cl, datos.gob.mx, dgis.salud.gob.mx, inlasa.gob.bo, minsalud.gob.bo, sigtap.datasus.gov.br, www2/ftp2.datasus.gov.br | **0** | loinc.org 403 (servidor), fonasa.cl 403 (`awselb`), datos.gob.mx 403 (Akamai «Access Denied»), DGIS, INLASA, MinSalud Bolivia y DATASUS sin respuesta por HTTPS. gob.mx/salud responde, pero no publica un catálogo de procedimientos descargable en las páginas sondeadas. |
| 15 | Fuentes abiertas no evaluadas aún: NCI EVS (CDISC SDTM), CMS Clinical Laboratory Fee Schedule, OHDSI Athena, Orphadata | **0 cargados; 1 candidata pendiente** | **CDISC SDTM `C65047` «Laboratory Test Code»** (`SDTM Terminology.txt` de evs.nci.nih.gov, 2 513 términos): alcanzable, pero (a) la licencia de CDISC no se verificó y (b) son códigos de *analito* para ensayos clínicos, sin muestra ni método, sin mapeo publicado a LOINC para deduplicar. Decide el propietario: no se cargan por conveniencia ni se descartan por conveniencia. CMS CLFS: usa códigos y descriptores CPT (AMA, licencia comercial). Athena: la descarga exige cuenta y licencias por vocabulario. Orphadata: no publica un catálogo de tests en sus productos libres. |

**Las pasadas 7 y 8 aportaron 0 con la red cerrada; con la red abierta, la 14 aportó 0 y la 15 dejó
una candidata pendiente de decisión.** No hay dos pasadas seguidas en 0 con todo lo alcanzable
resuelto, así que **no se declara saturación**.

## Cobertura

### Prestaciones diagnósticas por dominio y fuente

| Dominio | LOINC | GTR (NCBI) | ICD-10-PCS (US) | PAMI (AR) | TUSS (BR) | CUPS (CO) | SIGTAP (BR) | FONASA (CL) | **Total** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Laboratorio clínico | 62 668 | — | — | 2 658 | 1 456 | 1 402 | 527 | 443 | **69 154** |
| Imagenología | 8 293 | — | 3 360 | 315 | 369 | 518 | 233 | 187 | **13 275** |
| Anatomía patológica | 939 | — | — | 41 | 44 | 68 | 14 | 13 | **1 119** |
| Genética y molecular | 3 254 | 63 919 | — | 20 | 144 | — | 25 | — | **67 362** |
| Pruebas funcionales | 3 409 | — | 962 | — | 198 | 170 | 127 | 5 | **4 871** |
| Sin dominio | 899 | — | 80 | — | — | — | 182 | — | **1 161** |
| **Total** | **79 462** | **63 919** | **4 402** | **3 034** | **2 211** | **2 158** | **1 108** | **648** | **156 942** |

«Sin dominio»: en LOINC, los 899 son miembros (a cualquier profundidad) de un panel incluido cuya
propia clase no tiene dominio (encuestas CMS dentro de paneles funcionales, `CARD.PROC`, antecedentes…):
entran para que el panel esté completo, pero no a un value set de dominio. En SIGTAP y PCS, los
procedimientos del grupo diagnóstico oficial que no caben en los cinco dominios (SIGTAP 02.01, 02.09,
02.12, 02.13; PCS C4–C6 y 4B).

LOINC 2.82 tiene 109 325 términos en tx.fhir.org: 79 462 entran (con dominio o como miembro de un panel
incluido) y 29 863 quedan fuera por clase (documentos, encuestas, adjuntos de reclamos, signos vitales,
administración…; conteo por clase en `excludedByClass` del reporte de cobertura).

### Categorías

Cada fuente aporta su categoría oficial, como value set `lab-catalog-<fuente>-cat-<código>`: la clase
LOINC (`lab-catalog-loinc-class-<clase>`), la categoría mayor de método de GTR, sección›tipo de
ICD-10-PCS con nombres oficiales de las code tables de CMS, las formas de organización de SIGTAP con su
nombre, el módulo de PAMI y los prefijos de FONASA, TUSS y CUPS. Esos tres aranceles no publican el
nombre del capítulo en sus datos, así que la categoría es el prefijo, sin nombre inventado.

### Features por concepto

| Fuente | Qué trae |
|---|---|
| LOINC | Clase y CLASSTYPE, estado, pedible/observación (ORDER_OBS), componente, propiedad y método (NLM), tiempo, sistema y escala (en castellano, del nombre corto es-AR), unidades UCUM, tipo de dato, nombres relacionados y para el consumidor, miembros de panel con orden, nombre oficial es-MX y es-AR. |
| NCBI GTR | Laboratorio y país, tipo (clínico/investigación), métodos y categoría de método, genes y condiciones, estado crudo de NCBI. |
| ICD-10-PCS | Sección y tipo oficiales, descripción corta y larga, nombre oficial en castellano (CIE-10-ES 2026). |
| SIGTAP | Subgrupo y forma oficiales, complejidad, restricción de sexo, edad mínima/máxima (meses), valores SUS. |
| FONASA | Precio y copago por nivel 1–3 (CLP), nombre oficial verbatim. |
| TUSS | Vigencia (`startsAt`, `endsAt`, `implementedUntil`). |
| CUPS | Nombre oficial y el «Qué es» de MinSalud como definición. |
| PAMI | Módulo y valor en pesos (estructura de febrero de 2019). |
| HL7 | Estado, versión en que se deprecó, comentario oficial, URL canónica. |
| UCUM | Símbolo, propiedad, dimensión, magnitud, métrica/base/especial/arbitraria, sinónimos, nombre común de HL7. |

**Rangos de referencia: ninguno.** Ninguna fuente alcanzable los publica, y no se inventan.
**Tubo/contenedor por análisis: ninguno.** Sólo lo publican los catálogos de laboratorios de
referencia (Mayo, ARUP, Quest), que no sirven como fuente.

### Lo que se carga y hoy no lee ninguna consulta de producto

Todo el catálogo se puede leer por los endpoints genéricos públicos (`GET /terminology/value-sets?code=…`,
`/:id/$expand?includeProperties=true`, `GET /terminology/CodeSystem/$lookup`). Pero **ningún flujo de
producto lo consume todavía**: la orden de estudios sigue con sus 92 códigos locales y la recepción de
muestras con su subconjunto de 0487. Tamaño medido en Postgres 16 desechable: ver «Cómo se midió».

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
- **Redistribuciones, cotejadas donde se pudo.** TUSS: el ZIP oficial de la ANS tiene el mismo SHA-256
  que declara el paquete npm y 0 diferencias. PAMI e ICD-10-PCS se pasaron a los archivos oficiales
  (datos.pami.org.ar; CMS FY2027). SIGTAP (FTP de DATASUS) y FONASA (403) **no se cotejaron**: queda dicho
  en `source_license` de cada concepto y en `SOURCES.md`.
- **PAMI** publica análisis con el mismo nombre en los capítulos 66 y 77, como prácticas distintas. Se
  cargan tal cual, sin deduplicar por nombre, porque son dos códigos oficiales.
- **LOINC por servidores de terceros.** tx.fhir.org (HL7) y NLM sirven LOINC con la licencia de
  Regenstrief; la vía se declara en `source_name` y el aviso de licencia en `source_license`. El eje
  TIME/SYSTEM/SCALE se toma del nombre corto oficial es-AR (único que lo trae sin el zip) y se separa en
  exactamente 6 ejes; si no da 6, no se escribe.
- **Panel con un miembro repetido.** NLM publica 58 casos de un mismo miembro en dos posiciones del mismo
  panel (p. ej. 50546-1 en 41200-7, posiciones 273 y 274). El id de la relación incluye la posición, así
  que se conservan las dos.
- **Sin traducciones propias.** Castellano sólo donde la fuente lo es: LOINC es-MX y es-AR, CIE-10-ES 2026
  (traducción oficial de ICD-10-PCS, mismo código; 5 códigos nuevos de FY2027 sin traducción), FONASA,
  CUPS y PAMI. SIGTAP y TUSS quedan en portugués; GTR, HL7 y UCUM en inglés.

## Huecos

| Hueco | Causa | Qué lo destraba |
|---|---|---|
| **LOINC, lo que sólo trae el zip oficial**: TIME/SYSTEM/SCALE en inglés, partes LP, Universal Lab Orders, Top 2000, RSNA Playbook; 3 080 términos posteriores a 2.82 (en NLM, sin clase en tx.fhir.org) | cuenta en loinc.org | Bajar el zip con una cuenta a `lab-tests-sources/loinc/` y correr `build-lab-tests.mjs --loinc-release <v>`: el parser existe y enriquece los mismos ids. |
| RSNA RadLex Playbook por separado | licencia (click-through RadLex) | Que el propietario acepte la licencia, o el zip LOINC (trae el Playbook armonizado). |
| DICOM CID 29 (modalidades) | licencia no verificada | Ubicar el aviso de copyright de NEMA aplicable. |
| **CDISC «Laboratory Test Code»** (2 513) | licencia sin verificar + decisión de alcance | El propietario decide si los códigos de analito de ensayos clínicos entran; verificar los términos de uso de CDISC. |
| Cotejo de SIGTAP y FONASA con sus originales | FTP sólo por FTP; fonasa.cl 403 | Un entorno con FTP saliente, o acceso a fonasa.cl. |
| CUPS completo (Colombia) | no hay tabla completa en datos.gov.co | Resolución de CUPS vigente de MinSalud en formato tabular. |
| México, SUS Bolivia, INLASA | 403 / sin respuesta | Acceso a datos.gob.mx, minsalud.gob.bo, inlasa.gob.bo. |
| Subgrupos mixtos (≈ 1 000 prestaciones con pruebas funcionales y endoscopias) | curaduría | Clasificación ítem por ítem por una persona. |
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

- Postgres 16 desechable (sin Docker), base nueva, con `database/SQL/00_shared/00_types.sql` y
  `03_terminology/0{1..4}_*.sql`, más los 6 conceptos internos que exige el cargador (estado activo,
  idioma ES, tipos de designación, relaciones part-of/is-a), insertados a mano en lugar de arrancar la API.
- Carga completa **sólo desde `data/`** (`GLOSSARY_BUILD_DIR` apuntando a una carpeta vacía, con
  verificación de SHA-256), dos corridas de `load-lab-tests.mjs --apply`:
  - corrida 1 (218 s): 158 309 conceptos, 3 864 840 propiedades, 114 065 designaciones, 18 236
    relaciones, 313 value sets, 511 404 membresías: igual al plan del dry-run;
  - corrida 2 (138 s): **0 filas nuevas** (sólo los 15 registros de lote, que son auditoría);
  - schema `terminology` después de cargar: **1 193 MB** (tablas + índices).
- Salidas literales en `docs/trabajo/2026-10-24-seed-lab-tests-red/evidencia/`.
- `node --test "tools/terminology-import/test/*.test.mjs"`: 54/54.
