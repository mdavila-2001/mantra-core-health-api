# Farmacología clínica — fuentes, licencias y encaje en el modelo

Monografías por principio activo (ATC nivel 5) con texto **literal** de fuentes oficiales. Este
archivo dice de dónde sale cada dato, bajo qué licencia y qué queda afuera. El registro de pasadas
(protocolo de saturación) está en `docs/seed-research/clinical-pharmacology.md`.

> **Estado al 2026-10-30.**
>
> - **Corridas:** diez pasadas — openFDA + GSRS, RxNav, CIMA, EMA, eEML, DailyMed, CIMA exhaustiva,
>   LactMed, LiverTox e información de producto de la EMA en PDF (extracción verificada).
> - **Resultado por vía:** 2 883 monografías y 81 075 secciones. 45 669 en castellano (CIMA y EMA
>   PDF); el resto en inglés, idioma de origen, sin traducir. 1 754 punteros sin texto (DailyMed, eEML,
>   EMA PDF).
> - **Licencias:** todas las de las fuentes usadas se leyeron en su página, con fecha.
> - **Decisiones del propietario (2026-10-26, issue 824):** posología solo `professional`; `data/` solo con
>   el corpus por principio activo; de la eEML solo referencias; las fichas de CIMA sin fecha se cargan
>   marcadas. Detalle en `docs/seed-research/clinical-pharmacology.md`.
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
| Contenido en el idioma de la fuente (`language: 'es'` CIMA; `'en'` openFDA, EMA, eEML) | normalizadores | las tres suites |
| Sin versión ni fecha la sección no se publica; única excepción, fichas que CIMA publica **sin** fecha: `versionUnpublished: true` + nota en la cita, vale la fecha de consulta. La API las expone como `sourceAge.known: false` | `lib/monograph.mjs#hasVersion`, `lib/cima.mjs#cimaSections`, `src/modules/terminology/pharmacology-audience.ts` | `cima-monograph.test.mjs`, `decisiones-824.test.mjs`, specs de `src/modules/terminology` |
| Toda sección (la posología incluida) es `audience: 'professional'`; sin ella no se publica ni se carga. La API solo la entrega a un rol clínico | `lib/monograph.mjs#assertSection`, `lib/load-plan.mjs#loadableMonograph`, `pharmacology-audience.ts` | `decisiones-824.test.mjs`, specs de `src/modules/terminology` |
| De la eEML solo referencias (ids y enlaces), nunca su texto: no hay filas de sección de la eEML | `lib/eml.mjs#emlReference`, `lib/load-plan.mjs#loadableMonograph` (también convierte un corpus anterior con texto) | `gsrs-openfda-real.test.mjs`, `decisiones-824.test.mjs` |
| El corpus por producto (`--granularity product`) no entra en `data/`: se arma en `out/product/`, `pack-data.mjs` empaqueta una lista cerrada y `.gitignore` cierra `data/*product*` | `lib/paths.mjs#monographsOutputs`, `pack-data.mjs#assertPackable` | `decisiones-824.test.mjs` |
| Una sección cuyo texto ya está publicado para el mismo ATC (misma clave y sha256) no se repite: se anota en `document.alsoIn` | `build-monographs.mjs` (CIMA, LactMed y LiverTox) | medido: 1 107 (CIMA) |
| Sin DDL, sin `synchronize`, sin migraciones | `load-clinical-pharmacology.mjs` sólo hace `INSERT … ON CONFLICT DO NOTHING` y un `DELETE` acotado | carga medida en Postgres desechable |

**Público:** estas secciones incluyen **posología (4.2)**. Son para profesionales
(`audience: 'professional'` en cada fila, decisión del propietario del 2026-10-26). La API entrega esas
filas solo a un rol clínico (`$lookup` y la ficha por id de `terminology`). El corte S3 del glosario para
pacientes prohíbe la posología (`encyclopedia/s3-farmacos/lib/sections.mjs`); este code system no es
miembro de ningún value set del glosario y no debe agregarse a uno sin filtrar esas secciones.

## Fuentes usadas

| Fuente | Qué aporta | Acceso | Licencia | Estado |
|---|---|---|---|---|
| **CIMA (AEMPS, España)** — `https://cima.aemps.es/cima/rest/` | Fichas técnicas por sección (2, 3, 4.1–4.9, 5.1–5.3, 6.1, 6.2; la 10 sólo para fecha de revisión), **en castellano**; nombres ATC de los 5 niveles (maestra 7, que exige `codigo`: 7 358 códigos); formas y vías; notas de seguridad | API REST pública, sin cuenta | Aviso legal AEMPS (`https://www.aemps.gob.es/aviso-legal/`, leído el 2026-10-24): «Se autoriza la reproducción total o parcial de los contenidos de la web, siempre que se cite expresamente su origen. El usuario queda obligado a mencionar la fecha de la última actualización de los documentos objeto de la reutilización.» La cita de cada fila lleva origen y fecha de revisión de la ficha | **Usada (pasadas 3 y 7).** **788 fichas no publican fecha de revisión** (`versionUnpublished`): se cargan marcadas, con la cita «sin fecha de versión publicada por CIMA» y la fecha de consulta; la API las expone como antigüedad desconocida (decisión del propietario, issue 824) |
| **openFDA drug labels** — `https://api.fda.gov/download.json` → `download.open.fda.gov/drug/label/` | Etiquetas SPL por campo: indicaciones, posología, contraindicaciones, advertencias, recuadro, interacciones, reacciones adversas (+ tablas), poblaciones especiales, sobredosis, mecanismo, farmacodinamia/cinética, farmacogenómica; clases EPC/MoA | Descarga masiva, sin cuenta | Dominio público / CC0 1.0 (`https://open.fda.gov/license/`, leída el 2026-10-24; advierte que puede haber derechos de terceros). Aviso de `meta.disclaimer` («Do not rely on openFDA to make decisions regarding medical care…») **literal en cada sección** | **Usada (pasada 1).** Export 2026-10-23, 14 particiones con sha256 en `fetch.meta.json` |
| **FDA GSRS (sustancias)** — `download.open.fda.gov/other/substance/` | Puente **por código**: UNII → fracción activa → códigos WHO-ATC; CAS PRIMARY → UNII (para LiverTox). Los nombres ATC de la OMS que trae en `comments` **no se copian**; el nombre de sustancia de la FDA es la designación EN de último recurso | Descarga masiva, sin cuenta | Régimen de openFDA (dominio público) | **Usada (pasada 1).** Export 2026-10-21, 167 385 sustancias; normalizado en `data/gsrs-entries.part-*.ndjson.gz` |
| **RxNav (NLM)** — `https://rxnav.nlm.nih.gov/REST/` | Puente ATC 5 → RxCUI (IN/MIN) → UNII para desambiguar el GSRS | API pública, sin cuenta | Términos de servicio de RxNav (`https://lhncbc.nlm.nih.gov/RxNav/TermsofService.html`, leídos el 2026-10-24): la RxNorm API da «non-proprietary content from RxNorm»; «With one exception, no license is needed to use these APIs» (la excepción es SNOMED CT en RxClass, **que no se usa**); ≤ 20 pedidos/s por IP. Sólo se guardan identificadores | **Usada (pasada 2).** Parsers validados con respuestas reales (`test/fixtures/rxnav-real/`) |
| **EMA — «Medicines output»** — `https://www.ema.europa.eu/en/documents/report/medicines-output-medicines-report_en.xlsx` | Indicación terapéutica literal (inglés) de cada medicamento de uso humano autorizado, por el ATC que asigna la EMA | Un xlsx público | Aviso legal de la EMA (leído el 2026-10-24): reproducción permitida, también comercial, «provided that EMA is always acknowledged as the source … in each copy». **La cita va en cada fila** | **Usada (pasada 4).** URL, bytes, sha256 y fecha de generación en `fetch.meta.json` |
| **OMS — eEML** — `https://list.essentialmeds.org/` (JSON-LD por recomendación) | **Solo referencias** a cada recomendación vigente, por el ATC que asigna la OMS: id, URL, URL del JSON-LD, fecha (`guidelineDate`), ATC 5, ids de medicamentos y código CIE-11 con su URI. **Sin su texto** (indicación, formulaciones, nombres) | Portada + `/recommendations/<id>.jsonld`, sin cuenta (`robots.txt` sin restricciones) | **CC BY 3.0 IGO** (`/licencing`, leída el 2026-10-24): uso comercial permitido salvo «In conjunction with the advertising or promotion of commercial products» y sugerir respaldo de la OMS. No está confirmado con la OMS que esta aplicación quede fuera de ese supuesto, por eso no se copia su texto; cada referencia lleva el nombre de la licencia y su enlace | **Usada (pasada 5), como referencias.** 1 132 recomendaciones; sha256 de la portada en `fetch.meta.json` |
| **DailyMed (NLM)** — `https://dailymed.nlm.nih.gov/dailymed/services/v2/` | UNII de los principios activos (ingredientes ACTI*) del SPL, para enlazar por código las etiquetas que openFDA trae **sin** bloque `openfda`; puntero citable a las que sólo están en DailyMed | API pública, sin cuenta | Políticas de la NLM (`https://www.nlm.nih.gov/web_policies.html`, leída el 2026-10-24): obras del Gobierno de EE. UU. de libre uso; **el contenido aportado por terceros puede tener copyright**. Por eso, de las etiquetas que sólo están en DailyMed **no se redistribuye el texto**: sólo identidad, versión y URL (`externalDocuments`) | **Usada (pasada 6).** 17 729 identidades SPL; se guarda sólo la identidad, no el XML. 275 punteros sin texto |
| **LactMed (NICHD/NLM)** — paquete `lactmed_NBK501922.tar.gz` de `https://ftp.ncbi.nlm.nih.gov/pub/litarch/` (lo indica la propia LactMed) + E-utilities (`db=books`) para el accession NBK de cada capítulo | Secciones de lactancia («Summary of Use during Lactation», «Drug Levels», «Effects in Breastfed Infants», «Effects on Lactation and Breastmilk», «Alternate Drugs to Consider»), enlazadas por los UNII del registro | Descarga masiva y API pública, sin cuenta. La web de Bookshelf exige reCAPTCHA: no se usa | Políticas de NCBI (leídas el 2026-10-24): «Information that is created by or for the US government on this site is within the public domain.» Términos de descarga de la NLM (leídos el 2026-10-24): atribuir con «Courtesy of the U.S. National Library of Medicine», no sugerir respaldo, avisar si lo redistribuido no es la versión vigente. **Atribución y aviso de LactMed en cada fila** | **Usada (pasada 8).** 1 976 registros, sha256 en `fetch.meta.json` |
| **LiverTox (NIDDK/NLM)** — paquete `livertox_NBK547852.tar.gz` del mismo archivo + E-utilities | Hepatotoxicidad («Hepatotoxicity», «Mechanism of Injury», «Outcome and Management»), enlazada por CAS → UNII (CAS PRIMARY del GSRS) | Ídem | El propio libro (leído el 2026-10-24): «LiverTox is produced by the National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK) and is copyright free. It is requested that use of LiverTox data in publications be given appropriate acknowledgment.» Más los términos de la NLM. **Atribución y aviso en cada fila** | **Usada (pasada 9).** 1 387 registros, sha256 en `fetch.meta.json` |
| **EMA — información de producto (PDF del EPAR, castellano)** — `https://www.ema.europa.eu/es/documents/product-information/<slug>-epar-product-information_es.pdf` (enlace de la página del EPAR) | Ficha técnica (anexo I) por sección QRD, **en castellano**, de los medicamentos centralizados con ATC 5 cuyo nº EU no está en CIMA; los demás ya entran por CIMA (mismo documento por nº de registro). Sólo se publican las secciones de extracción verificada (`py/ema_pi_extract.py`): sin glifos sin resolver, sin tablas, sin trazos dibujados dentro del texto, sin guiones de fin de línea ambiguos y con consenso de `pdftotext`; el resto queda como puntero | PDF público, sin cuenta; `pdfminer.six` 20260107 + tabla «Adobe Symbol Encoding to Unicode» (unicode.org, sha256 fijado) | Aviso legal de la EMA, igual que el informe «Medicines output» | **Usada (pasada 10):** 3 671 secciones de 352 medicamentos y 491 punteros. 1 397 PDF con sha256 en `fetch.meta.json`. Fidelidad medida contra CIMA: 646 diferencias chicas revisadas, 0 errores del extractor (ver el registro de pasadas) |
| **LINAME 2022-2024 (Bolivia)** — `tools/bolivia-datasets/data/liname-2022-2024.json` | Universo de ATC 5 esenciales de Bolivia; hueco «esencial sin monografía» | Ya en el repo | «Documento público del Estado Plurinacional de Bolivia; se cita la fuente» | Usada. Sin texto clínico |
| **vademecum (dataset de la app)** — `src/common/seed/data/vademecum/vademecum.dataset.json` | ATC 5 de la receta; destino de los `concept_maps` | Ya en el repo | — | Usada (sólo códigos e ids) |

## Fuentes evaluadas y no usadas

| Fuente | Motivo |
|---|---|
| vademecum.es, PLM, BNF, Martindale, Lexicomp, Medscape, UpToDate | Comerciales con copyright. Sólo para detectar huecos; nunca se copia contenido. |
| MedDRA | Licencia por suscripción del MSSO. La reacción adversa queda literal, con su tabla y frecuencia. |
| WHO ATC/DDD Index (WHOCC) | Sin distribución comercial sin permiso del WHOCC. Los nombres vienen de la AEMPS; los de la OMS que trae el GSRS **no se copian**; **las DDD no se cargan**. |
| WHO Model Formulary (2008) | © OMS, sin licencia abierta verificada. |
| NCI Thesaurus (definiciones con `FDA_UNII_Code`) | Una definición del agente no es una sección de monografía; forzarla en una clave cambiaría su sentido. |
| Health Canada (monografías) | En PDF; la licencia de reproducción no se verificó. |
| MedlinePlus, información de medicamentos | El texto es de AHFS (ASHP) con copyright: no se redistribuye. |
| DDInter | CC BY-NC-SA 4.0 (no comercial). Las interacciones quedan como texto literal de 4.5 / `drug_interactions`. |
| ONC High-Priority DDI list | Sin archivo oficial legible por máquina ni licencia explícita. |
| PharmGKB/ClinPGx | CC BY-SA 4.0 con términos de uso sólo para investigación; `api.pharmgkb.org` sin salida. La farmacogenómica de la FDA sí está mapeada. |
| CPIC | La página de licencia redirige y no se pudo leer. |
| AGEMED (Bolivia) | El portal consulta de a un registro y exige reCAPTCHA: **no se elude**. Hay que pedir la base por acceso a información pública. |
| Formulario Terapéutico Nacional (Bolivia) | `www.minsalud.gob.bo` sin salida; licencia sin confirmar. |
| SNOMED CT | Bolivia no es miembro de SNOMED International. |
| PubMed / Europe PMC | Literatura: sirve para descubrir fuentes, no es contenido de monografía. |

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
  `pharmacology_safety_notes`, `pharmacology_fda_pharm_classes`, `pharmacology_section_coverage`,
  `pharmacology_external_documents` (punteros a documentos cuyo texto no se redistribuye: SPL
  que sólo están en DailyMed y recomendaciones de la eEML).
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

Responden (2026-10-24, tarde):

- FDA: `api.fda.gov`, `download.open.fda.gov`, `open.fda.gov`.
- Fuentes europeas y de la OMS: `cima.aemps.es`, `www.ema.europa.eu`, `list.essentialmeds.org`.
- NLM/NCBI: `rxnav.nlm.nih.gov`, `dailymed.nlm.nih.gov`, `ftp.ncbi.nlm.nih.gov`,
  `eutils.ncbi.nlm.nih.gov`.

Responden con reCAPTCHA y no se usan: `agemed.gob.bo` y la web de NCBI Bookshelf
(`www.ncbi.nlm.nih.gov/books/…`).

Sin salida: `www.minsalud.gob.bo`, `api.pharmgkb.org`.
