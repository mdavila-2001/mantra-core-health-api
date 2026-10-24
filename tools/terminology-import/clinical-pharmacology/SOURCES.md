# Farmacología clínica — fuentes, licencias y encaje en el modelo

Monografías por principio activo (ATC nivel 5) con texto **literal** de fuentes oficiales. Este
archivo dice de dónde sale cada dato, bajo qué licencia y qué queda afuera. El registro de pasadas
(protocolo de saturación) está en `docs/seed-research/clinical-pharmacology.md`.

> **Estado al 2026-10-24 15:30 UTC.** Se corrió la pasada 1 con **openFDA + GSRS** (los únicos hosts
> que respondían: `api.fda.gov` y `download.open.fda.gov`): 1 033 monografías y 18 853 secciones,
> en inglés. CIMA, RxNav y el resto siguen en 403 (ver «Hosts»). Las licencias marcadas «no
> reverificada» se documentan con lo que se sabía y **no se confirmaron en la página citada**
> (`open.fda.gov` tampoco responde).
>
> En entornos con proxy de salida, los fetchers se corren con `NODE_USE_ENV_PROXY=1`: el `fetch` de
> Node no lee `HTTPS_PROXY` por sí solo.

## Reglas que el código hace cumplir

| Regla | Dónde | Prueba |
|---|---|---|
| Texto literal: HTML → texto sólo quita etiquetas y normaliza espacios; sin traducir ni resumir | `lib/literal.mjs` (reusa `htmlToText` del glosario) | `cima-monograph.test.mjs` compara contra `htmlToText` del fixture real; en la base se verificó `textSha256` = sha256 del texto de la fuente |
| Una fila = una sección de un documento de una fuente; dos fuentes nunca se mezclan | `lib/cima.mjs#cimaSections`, `lib/openfda.mjs#openFdaSections` | `openfda-rxnorm.test.mjs` («sin unir campos distintos») |
| Procedencia por fila: fuente, id del documento, versión, URL de sección, fecha de consulta, licencia, cita | `lib/monograph.mjs#assertSection` (lanza si falta algo; sin versión ni fecha la sección no se publica) | ambas suites |
| Las tablas (p. ej. frecuencias de 4.8) se guardan celda a celda, sin expandir ni reinterpretar | `lib/literal.mjs#extractTables` | test «reacciones adversas conservan las tablas» |
| Enlaces sólo por código (ATC, RxCUI, UNII, nº de registro), nunca por nombre | `lib/rxnorm.mjs`, `lib/openfda.mjs#referenceLabels`, `validate-links.mjs` | test «conjunto EXACTO de UNII» |
| Contenido en el idioma de la fuente (`language: 'es'` CIMA, `'en'` openFDA) | normalizadores | ambas suites |
| Sin DDL, sin `synchronize`, sin migraciones | `load-clinical-pharmacology.mjs` sólo hace `INSERT … ON CONFLICT DO NOTHING` y un `DELETE` acotado | carga medida en Postgres desechable |

**Público:** estas secciones incluyen **posología (4.2)**. Son para profesionales
(`audience: 'professional'` en cada fila). El corte S3 del glosario para pacientes prohíbe la
posología (`encyclopedia/s3-farmacos/lib/sections.mjs`); este code system no es miembro de ningún
value set del glosario y no debe agregarse a uno sin filtrar esas secciones.

## Fuentes usadas

| Fuente | Qué aporta | Acceso | Licencia | Estado |
|---|---|---|---|---|
| **CIMA (AEMPS, España)** — `https://cima.aemps.es/cima/rest/` | Fichas técnicas por sección (2, 3, 4.1–4.9, 5.1–5.3, 6.1, 6.2; la 10 sólo para fecha de revisión), nombres ATC en castellano de los 5 niveles (detalle + maestra 7), formas y vías por producto, notas de seguridad | API REST pública, sin cuenta | Aviso legal AEMPS: «Se autoriza la reproducción total o parcial de los contenidos de la web, siempre que se cite expresamente su origen» (`https://www.aemps.gob.es/aviso-legal/`), citado ya en `lib/glossary-es/cima.mjs` | Licencia verificada por la sesión del glosario (2026-09-30), no reverificada acá. **Sin descargar** (403). Parser validado con respuestas reales versionadas |
| **openFDA drug labels** — `https://api.fda.gov/download.json` → `download.open.fda.gov/drug/label/` | Etiquetas SPL (las de DailyMed) por campo: indicaciones, posología, contraindicaciones, advertencias, recuadro, interacciones, reacciones adversas (+ tablas), poblaciones especiales, sobredosis, mecanismo, farmacodinamia/cinética, farmacogenómica; clases EPC/MoA | Descarga masiva, sin cuenta (evita el tope de 1 000 pedidos/día sin clave) | Dominio público / CC0 1.0 según `https://open.fda.gov/license/` (URL que la propia API declara en `meta.license`). La API declara además, en `meta.disclaimer`: «Do not rely on openFDA to make decisions regarding medical care. While we make every effort to ensure that data is accurate, you should assume all results are unvalidated. …». **Ese aviso viaja literal en cada sección** (`disclaimer`) | **Usada (pasada 1).** Export 2026-10-23, 14 particiones con URL y sha256 en `fetch.meta.json`. Parser validado con etiquetas reales (`test/fixtures/openfda-labels-real.json`). Licencia no reverificada (`open.fda.gov` en 403) |
| **FDA GSRS (sustancias)** — `download.open.fda.gov/other/substance/` (vía el mismo índice de openFDA) | Puente **por código**: UNII → fracción activa (`ACTIVE MOIETY`) → códigos WHO-ATC; también RXCUI. Sólo identificadores; los nombres de la jerarquía ATC de la OMS que trae en `comments` **no se copian**. El nombre de sustancia de la FDA se usa como designación EN cuando el ATC 5 es de un solo principio | Descarga masiva, sin cuenta | Mismo régimen de openFDA (dominio público) | **Usada (pasada 1).** Export 2026-10-21, 167 385 sustancias, sha256 en `out/gsrs-entries.meta.json`; normalizado en `data/gsrs-entries.part-*.ndjson.gz` |
| **RxNav (NLM)** — `https://rxnav.nlm.nih.gov/REST/` | Puente por códigos ATC 5 → RxCUI (IN/MIN/PIN) → UNII, para encontrar las etiquetas de la FDA del mismo principio activo | API pública, sin cuenta (≤ 20 pedidos/s) | Términos de servicio de RxNav (`https://lhncbc.nlm.nih.gov/RxNav/TermsofService.html`); sólo se guardan identificadores | No reverificada. **Sin descargar** (403). Parsers defensivos, **no validados con respuestas reales** |
| **LINAME 2022-2024 (Bolivia)** — `tools/bolivia-datasets/data/liname-2022-2024.json` (sha256 en el archivo) | Universo de ATC 5 esenciales de Bolivia; el hueco «esencial sin monografía» del informe | Ya en el repo | «Documento público del Estado Plurinacional de Bolivia; se cita la fuente» (del propio archivo) | Usada. No aporta texto clínico; no se duplica en propiedades (ya está en `vademecum.liname_presentations`) |
| **vademecum (dataset de la app)** — `src/common/seed/data/vademecum/vademecum.dataset.json` | ATC 5 de la receta; destino de los `concept_maps` | Ya en el repo | — | Usada (sólo códigos e ids) |

## Fuentes evaluadas y no usadas

| Fuente | Motivo |
|---|---|
| vademecum.es, PLM, BNF, Martindale, Lexicomp, Medscape, UpToDate | Comerciales con copyright. Sólo para detectar huecos; nunca se copia contenido. |
| MedDRA (codificación de reacciones adversas) | Licencia por suscripción del MSSO (gratuita sólo para reguladores y uso académico sin fines de lucro). No se codifica: la reacción adversa queda como texto literal de la ficha, con su tabla y su frecuencia tal como están escritas. |
| WHO ATC/DDD Index (WHOCC) | Los códigos ATC se usan como identificadores, pero el índice con nombres y DDD no se redistribuye para uso comercial sin permiso del WHOCC. Los nombres vienen de la AEMPS (CIMA); los nombres ATC de la OMS que el GSRS trae en `comments` **no se copian**; **las DDD no se cargan** (hueco declarado). No reverificado. |
| WHO Model Formulary (2008) y WHO EML/eEML | © OMS; la EML se publica bajo CC BY-NC-SA 3.0 IGO (no comercial). Requiere decisión legal del propietario. Además, `list.essentialmeds.org` y `www.who.int` devolvieron 403. No reverificado. |
| EMA EPAR / SmPC centralizados | Las fichas de los medicamentos centralizados están en PDF (también en castellano). CIMA ya publica la mayoría de esos medicamentos; los que CIMA no segmenta quedan como hueco. **No se escribió un parser de PDF sin un archivo real contra el cual validarlo** (mismo criterio que la fase UMLS del README). `www.ema.europa.eu` devolvió 403. |
| DailyMed (servicio propio) | Publica las mismas SPL que openFDA; sólo aportaría las etiquetas que openFDA no indexa. `dailymed.nlm.nih.gov` devolvió 403 (2026-10-24). |
| DDInter | Licencia no verificada (se sabe que restringe el uso comercial; confirmar). No usado; las interacciones quedan como texto literal de 4.5 / `drug_interactions`. `ddinter2.scbdd.com` devolvió 403. |
| ONC High-Priority DDI list | Publicada en un artículo (Phansalkar et al., JAMIA 2012); no hay un archivo oficial legible por máquina ni licencia explícita. No usado. |
| PharmGKB/ClinPGx, CPIC | ClinPGx publica bajo CC BY-SA 4.0 (share-alike: decisión del propietario); CPIC: licencia por confirmar. Hosts con 403. La farmacogenómica de la FDA (`pharmacogenomics` de openFDA) sí está mapeada. |
| AGEMED (Bolivia) | El portal consulta de a un registro y exige reCAPTCHA: **no se elude**. Hay que pedir la base por acceso a información pública. |
| Formulario Terapéutico Nacional (Bolivia) | PDF del Ministerio de Salud; host bloqueado y licencia sin confirmar. No se parsea PDF sin archivo real. |
| SNOMED CT | Bolivia no es miembro de SNOMED International. |
| PubMed / Europe PMC | Literatura: sirve para descubrir fuentes, no es contenido de monografía. No se carga. |

## Encaje en el modelo (sin DDL)

La monografía por secciones **cabe** en el módulo 03 tal como está:

- `catalog_concepts`: un concepto por código ATC de los 5 niveles en el code system
  `clinical-pharmacology` (versión única `1`; la versión real viaja en cada documento). Niveles 1–4
  abstractos; `display` = nombre AEMPS o, si ninguna fuente lo nombra, el propio código.
- `concept_designations`: nombre AEMPS como designación preferida ES.
- `concept_properties` (`value_json` jsonb, sin unicidad por código): **una fila por sección de cada
  documento** con código `pharmacology_section_<clave>` y la procedencia completa. Datos del
  concepto: `pharmacology_atc_level`, `pharmacology_atc_path`, `pharmacology_name_source`,
  `pharmacology_cima_substances`, `pharmacology_dosage_forms_routes`, `pharmacology_rxnorm_bridge`,
  `pharmacology_safety_notes`, `pharmacology_fda_pharm_classes`, `pharmacology_section_coverage`.
- `concept_relationships`: IS_A de cada nivel ATC a su padre (`terminology:relationship:is-a`).
- `concept_maps`: ATC 5 → concepto `vademecum` del mismo código (`terminology:equivalence:equivalent`).
  El catálogo de productos (`cima/invima/anvisa-medicamentos`) ya enlaza por `medicine_atc`; no se
  duplica.

**Propuestas para el repo del modelo (no bloquean):**

1. Índice `(concept_id, property_code)` en `concept_properties`: las consultas «sección X del
   ATC Y» filtran por los dos; hoy sólo hay índice por `concept_id`.
2. Las interacciones estructuradas por pares (`clinical_ext.drug_interactions`) exigen
   `severity_concept_id`; ninguna fuente libre verificada trae pares con severidad. No se cargan;
   si se consigue una (DDInter con licencia, p. ej.), no hace falta cambiar el modelo.
3. Si se quiere búsqueda de texto completo en las monografías, conviene una columna generada /
   índice GIN sobre `value_json->>'text'` (cambio del modelo, no de la API).

## Hosts

Responden (2026-10-24 15:10 UTC): `api.fda.gov`, `download.open.fda.gov`.

Siguen en 403: `cima.aemps.es` (CIMA, texto en castellano y nombres ATC),
`rxnav.nlm.nih.gov` (puente que resolvería las 26 744 etiquetas ambiguas), `dailymed.nlm.nih.gov`,
`open.fda.gov` (página de licencia), `www.ema.europa.eu`, `www.minsalud.gob.bo`,
`list.essentialmeds.org`, `www.whocc.no`, `api.cpicpgx.org`, `api.pharmgkb.org`,
`ddinter2.scbdd.com`, `www.ebi.ac.uk`, `eutils.ncbi.nlm.nih.gov`.
