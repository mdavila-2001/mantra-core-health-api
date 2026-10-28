# Fuentes — importador de cuidados de enfermería

Consultadas el **2026-10-24**; actualizadas el **2026-10-27** (Omaha System, enlaces LOINC, licencias leídas hoy: ver «Pasada 2026-10-27»). Las descargas crudas viven fuera de git, en
`glossary-data-build/cache/nursing-care/` (ver `GLOSSARY_BUILD_DIR`), con
`sources.meta.json` (commit, fecha, URL, SHA-256 / integridad). Los datos **normalizados** sí se
versionan, comprimidos, en [`data/`](./data/README.md) (orden del propietario del 2026-10-24).

## Cargadas

### 1. openEHR Clinical Knowledge Manager — espejo oficial en GitHub

| Campo | Valor |
|---|---|
| URI | https://github.com/openEHR/CKM-mirror |
| Versión | commit `c3fdc43dcf0eb7ef0cfe60f548fcdebc24c70094` (2026-10-20T15:31:41+02:00) |
| Qué es | Arquetipos ADL 1.4 del *trunk* de CKM internacional (incluye los remotos `uk.org.clinicalmodels` y `no.nasjonalikt`) |
| Licencia del arquetipo | CC-BY-SA 3.0 / 4.0, según `other_details["licence"]` de cada arquetipo (se guarda por fila en `source_license`). El README del espejo: «can be used freely within open source or commercial applications». |
| Licencia del contenido | Puede ser de un tercero (escalas). Se clasifica por arquetipo — ver «Regla de licencia del contenido» abajo. |
| Code system | `openehr-ckm` (versión `2026-10-20+c3fdc43d`) |
| Cargado | 616 arquetipos clínicos + 4 333 nodos + 3 088 respuestas = **8 037 conceptos**; 7 503 relaciones (PART_OF + IS_A). Incluye, desde el 2026-10-27, el contenido de la escala de Glasgow de adultos (22 conceptos; ver «Escalas») |
| No cargado | 73 arquetipos de composición, sección y demográficos (estructura de documento o de personas, no términos clínicos) · contenido de 196 instrumentos con licencia no libre o sin verificar (sólo su fila raíz) · 281 enlaces a SNOMED CT (Bolivia no es miembro) |
| Castellano | 77 arquetipos, 648 nodos, 366 respuestas tienen traducción `es`/`es-ar`/`es-cl`/`es-co` publicada en CKM por traductores nombrados. **No es traducción oficial del instrumento**; se guarda el autor en la propiedad `translation`. Los marcadores `*texto(en)` de CKM se tratan como «sin traducir». |

### 2. Ministerio de Sanidad de España — arquetipos UNE-EN ISO 13606 del CMDIC

| Campo | Valor |
|---|---|
| URI | https://github.com/openEHR/adl-archetypes, carpeta `Reference/ISO_13606/Spanish_MOH/ADL_14` |
| Publicador | Ministerio de Sanidad, «Recursos de Modelado Clínico (arquetipos)»: https://www.sanidad.gob.es/profesionales/hcdsns/areaRecursosSem/Rec_mod_clinico_arquetipos.htm (elaborados por la Universitat Politècnica de València con VeraTech e Indizen) |
| Versión | commit `093c77ea003742b9540e3dd377d615e2b26f2996` (2025-06-27) |
| Qué es | Estructura oficial de los informes del Conjunto Mínimo de Datos de los Informes Clínicos (RD 1093/2010), **incluido el Informe de Cuidados de Enfermería** (anexo VII), y sus entradas (valoración activa, resultados, signos vitales…). Original en castellano. |
| Licencia | **Confirmada el 2026-10-27** con el Aviso legal del Ministerio (https://www.sanidad.gob.es/avisoLegal/home.htm, SHA-256 `cb979d0f…5877`): «La información disponible en este sitio web, salvo indicación expresa en contrario, es susceptible de reutilización; quedando autorizada su reproducción total o parcial, modificación, distribución y comunicación, para usos comerciales y no comerciales», con tres condiciones: no desnaturalizar el contenido, citar la fuente y mencionar la fecha de la última actualización. La página de los arquetipos no declara excepción y el fichero oficial `Arquetipos_13606.zip` (SHA-256 `16c5ad17…315d4a`, 58 `.adl`) da los mismos 617 conceptos que este corpus (0 diferencias en código, nombres, definiciones y padre; `data/cmdic-license-verification.json.gz`). Las 617 filas versionadas en `data/` ya llevan `contentLicense.status = reuse-allowed-with-conditions` con esa evidencia y las 3 condiciones (verificado el 2026-10-28: 617/617, 0 filas con `official-publication-license-not-stated`; el estado anterior a la verificación era ese). Sigue la base legal del RD 1093/2010 y del art. 13 del TRLPI. |
| Code system | `es-msssi-cmdic-13606` (versión `2025-06-27+093c77ea`) |
| Cargado | 58 arquetipos + 559 nodos (secciones, entradas, clusters, elementos y ranuras) = **617 conceptos**; 559 relaciones PART_OF |
| Relación publicada | Las ranuras (`allow_archetype … include`) del informe de enfermería nombran por id 16 arquetipos que lo componen (regla M2). |
| No cargado | Las 58 copias `.adls` (ADL 1.5 convertidas; mismo contenido) y el resto del repositorio `adl-archetypes` (archivos de prueba de herramientas ADL/AML, ejemplos y versiones viejas de arquetipos de CKM). |

### 3. HL7 Terminology (THO) — paquete npm `hl7.terminology`

| Campo | Valor |
|---|---|
| URI | https://registry.npmjs.org/hl7.terminology/-/hl7.terminology-7.0.1.tgz |
| Versión | 7.0.1 (fecha de construcción 2025-12-11); integridad `sha512-78yye6RfOe24Vhro6MqRz7PJ1KhsAVzSKVDH5w8p+SQgkqraekiSykk7j2o8IYnyCIG++B9/pXIXilWQauxI3g==` |
| Licencia | CC0-1.0 (`package.json` del paquete) |
| Qué se usa | Los `NamingSystem` de las 12 terminologías de enfermería reconocidas por la ANA: OID, URI canónica, título, publicador, estado y descripción, verbatim |
| Code system | `nursing-terminology-registry` (versión `7.0.1`) |
| Cargado | **12 conceptos** (uno por terminología) con su estado de licencia verificado (`lib/licenses.mjs`). **No se carga el contenido de ninguna de esas terminologías.** |

### 4. Omaha System (2026-10-27)

| Campo | Valor |
|---|---|
| Fuente oficial | https://www.omahasystem.org/ — `problemclassificationscheme`, `interventionscheme`, `problemratingscaleforoutcomes`, `faq` (HTTP 200 el 2026-10-27; SHA-256 de cada archivo en `data/omaha-meta.json.gz`) |
| Licencia | **Dominio público** para términos, definiciones y códigos (FAQ oficial, pregunta 1, leída hoy y guardada verbatim en la procedencia de cada fila): «The Omaha System has existed in the public domain since 1975, and, therefore, is not held under copyright. The complete terms, definitions, and codes are presented in Appendix A and Appendix E of the 2005 book; they may be used by anyone without permission and without a licensing fee […]. However, the terms and structure must be used as described in the 2005 book, and referenced (ie 2005 book or Website).» Cita obligatoria: Martin KS. (2005). *The Omaha System: A Key to Practice, Documentation, and Information Management* (Reprinted 2nd ed.). Omaha, NE: Health Connections Press. El resto del libro tiene copyright de Health Connections Press, y «developers and companies who design and sell software based on the Omaha System are also required to observe copyright laws related to the book and should contact Health Connections Press» (**decisión del propietario**: confirmar con la editorial que cargar los términos en un producto comercial entra en el uso libre). |
| Qué se cargó | **320 conceptos** en `omaha-system` (versión `2005+sitio-2026-10-27`): 4 dominios con definición; 42 problemas; 2 conjuntos y 6 modificadores de problema; 4 categorías de intervención con definición; 76 objetivos (75 + «other»); la escala PRSO (3 conceptos y 15 niveles con puntaje 1–5); y 168 signos/síntomas de 18 problemas con la definición de esos 18 problemas. 231 relaciones `PART_OF`. |
| Texto | Inglés, verbatim del sitio. No hay traducción oficial al castellano de los términos en el sitio (el sitio ofrece artículos en español, no la lista) y no se tradujo. |
| Qué no | Signos/síntomas de **24** problemas, definiciones de los 76 objetivos, definiciones de los modificadores individuo/familia/comunidad y los **códigos numéricos** oficiales: sólo están en el libro de 2005 (Apéndices A y E), que se vende; ninguna fuente abierta los publica completos. No se guardan códigos inventados: cada concepto lleva `source_order` (orden de publicación). |

Fuentes secundarias usadas (declaradas por fila):

| Fuente | Qué aporta | Licencia |
|---|---|---|
| Minnesota Omaha System Users Group, *Omaha System KBS Rating Supplement* (octubre de 2010), https://www.omahasystemmn.org/booklet/OmahaSystemKBSRatingSupplement2010_8x11.pdf (SHA-256 en `omaha-meta`) | definición y signos/síntomas de 18 problemas (Income, Residence, Neighborhood/workplace safety, Communication with community resources, Interpersonal relationship, Mental health, Caretaking/parenting, Neglect, Abuse, Growth and development, Cognition, Pregnancy, Postpartum, Nutrition, Physical activity, Substance use, Family planning, Health care supervision), la lista de los 42 problemas con sus páginas del libro y las definiciones de los modificadores actual/potencial/promoción de la salud | «Copyright 2010 Minnesota Omaha System Users Group. May be used without permission. Please acknowledge authors when used.» (portada del PDF) |
| Imagen oficial de la PRSO (`Omaha System PRSO.jpg`) | la escala de 3 conceptos × 5 niveles: sólo existe como imagen; la transcripción es **visual** (marcada `transcribedFromImage` en cada fila) y se contrasta con las respuestas LOINC `LA6495-1…LA6494-4` (test `omaha.test.mjs`) | dominio público (misma FAQ) |
| Formulario *Problem Classification Scheme* (Form-I, Univ. de Estambul, alojado por el MOSUG) | **sólo contraste**, no se carga (es una traducción al turco y no declara licencia): 33 de los 42 problemas coinciden en número y nombre con el orden del sitio y los 13 comparables tienen el mismo total de signos/síntomas (`data/omaha-crosscheck.json.gz`) | — |

Reproducir: `fetch-omaha.mjs` → `build-omaha.mjs` (requiere `pdftotext` de poppler) → `verify-omaha-crosscheck.mjs` → `pack-omaha.mjs`.

### 5. LOINC — enlaces por código y términos del Omaha System (2026-10-27)

NLM Clinical Table Search Service, tabla `loinc_items` (el subconjunto público del que ya carga `import-loinc.mjs`; `loinc.org` sigue dando 403 y no se usa). `fetch-loinc-links.mjs`:

- De los **126** enlaces LOINC que declaran los arquetipos (101 códigos distintos): **48 enlaces a 47 términos LOINC, los 47 resueltos** en el subconjunto público; los otros 78 enlaces (54 códigos `LA…`) son **respuestas** de LOINC, no términos de `loinc_items`, y no se resuelven por diseño.
- LOINC publica **403** términos `[OMAHA]` (método `Observed.OMAHA`): 134 × (conocimiento, conducta, estado) por problema y por individuo/familia/comunidad, y el panel `48547-4` «Omaha System 2005 panel». Sus nombres usan la nomenclatura LOINC (p. ej. «Dentition», «Technical procedure»), que **no** coincide uno a uno con los 42 problemas de 2005; **no se cruzan por nombre**. Se guardan en `data/loinc-omaha-terms.json.gz`.
- Licencia LOINC: licencia gratuita con aviso (precedente en `import-loinc.mjs`).

## Licencias de las terminologías de enfermería (registro)

| Terminología | Estado | Por qué no hay contenido | Evidencia |
|---|---|---|---|
| Omaha System | Términos en dominio público (FAQ oficial, leída el 2026-10-27) | **Cargada parcialmente** (320 conceptos; ver sección 4). Faltan los códigos y los signos/síntomas de 24 problemas (sólo en el libro). | **primaria** |
| Clinical Care Classification (CCC) | © V. K. Saba; acuerdo de uso no leído | licencia sin verificar | secundaria |
| ICNP (CIE) | Permiso del CIE para todo uso; tasas para uso comercial | licencia | secundaria |
| NANDA-I | Propietaria; integración en HCE con permiso | licencia | secundaria |
| NIC / NOC | Propietarias (Iowa/Elsevier) | licencia | secundaria |
| PNDS (AORN) | Propietaria sin verificar | licencia | secundaria |
| ABC Codes | Propietaria; retirada en THO | licencia | secundaria |
| NMDS / NMMDS | Conjuntos de variables, no términos | no aplica | secundaria |
| LOINC | Licencia gratuita con términos | ya hay `import-loinc.mjs`; aquí sólo se ENLAZA por código | secundaria |
| SNOMED CT | Requiere licencia; Bolivia no es miembro | licencia | regla del pedido |

## Regla de licencia del contenido (escalas e instrumentos)

`lib/ckm.mjs · classifyContentLicense`, sobre el texto del propio arquetipo:

| Estado | Criterio | ¿Se cargan ítems y respuestas? |
|---|---|---|
| `declared-free` | el arquetipo dice «public domain», «no permission required» o «may be reproduced without permission» | sí |
| `openehr-model` | sin aviso de terceros, sin puntajes ordinales y sin nombre de instrumento | sí |
| `third-party-copyright` | transcribe un aviso de copyright de un tercero («Copyright statement», «All rights reserved»…) | **no** |
| `possible-third-party-copyright` | advierte que «puede» haber copyright | **no** |
| `scoring-instrument-unverified` | tiene puntajes ordinales o nombre de instrumento (scale, score, tool…) y nadie verificó su licencia | **no** |

Las escalas que nombra el pedido quedan así (licencias leídas el **2026-10-27** en el sitio del titular; detalle, cita y URL en `lib/licenses.mjs`):

| Escala | Estado | Evidencia |
|---|---|---|
| **Glasgow (adultos)** | **Contenido cargado** (22 conceptos con puntajes 1–4, 1–5, 1–6) | primaria: https://www.glasgowcomascale.org/permissions/ — «may all be used for clinical care and clinical research at no cost. No license is required. The copywrite of Glasgow University (GCS) […] should be acknowledged.» Se habilita con `LICENSE_OVERRIDES`. La escala pediátrica (otra adaptación) sigue sólo con metadatos. |
| **NEWS2** | Sólo metadatos. **Decisión del propietario** | primaria: https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/ — «there is no copyright restriction on NEWS2. You are therefore free to reproduce material, as long as […] the material must not be modified/amended in any way», cita del RCP y aviso en las traducciones. Re-expresar los parámetros y puntajes como filas de catálogo es, a juicio del importador, una modificación: no se habilita sin que el propietario lo decida. |
| **Braden** | Hueco de licencia | primaria: https://www.bradenscale.com/faqs-braden-scale-ii — se licencia («licensing requirements, terms/conditions and fee», a través de HD Nursing) |
| **Barthel** (modificado) | Hueco de licencia | secundaria (Stroke Engine cita al titular, MedChi): libre para uso no comercial con cita; «Permission is required to modify the Barthel Index or to use it for commercial purposes» |
| **Waterlow** | Hueco de licencia | aviso de copyright en el propio arquetipo |
| **Downton** | Sin verificar | no se encontró declaración del titular |
| **Norton, Morse, EMINA, Cubbin-Jackson** | Hueco | no hay arquetipo en CKM ni fuente abierta con licencia verificable; para EMINA las fuentes secundarias discrepan en el puntaje (0–3 vs 1–4): no se carga nada sin el original |
| **MUST** (BAPEN) | Hueco de licencia | primaria: el sitio de BAPEN pide «How to apply for permission to use ‘MUST’» |

## Evaluadas y descartadas o bloqueadas

| Fuente | Motivo |
|---|---|
| Omaha System (omahasystem.org) | **Ya no está bloqueada**: se cargó el 2026-10-27 (sección 4). Queda como hueco lo que sólo está en el libro. |
| ICNP / CIPE (icn.ch) | Licencia del CIE (tasas comerciales); host bloqueado |
| CCC (SabaCare) | Licencia no verificada; host bloqueado |
| NANDA-I, NIC, NOC, PNDS | Propietarias. No se copia contenido. |
| LOINC (enfermería, paneles de escalas) | Host bloqueado; la base ya puede tener `loinc` vía `import-loinc.mjs`: sólo se enlaza por código |
| openEHR CKM web / API REST (ckm.openehr.org) | Host bloqueado; se usó el espejo oficial en GitHub |
| Region Stockholm, fork del espejo CKM | 687 arquetipos: versiones anteriores de los mismos ids o locales suecos; **0 aportes nuevos** |
| openEHR/adl-archetypes (fuera de `Spanish_MOH`) | Archivos de prueba de ADL/AML, ejemplos y versiones viejas: no son fuente clínica |
| Guías RNAO, NICE, JBI, OMS, CENETEC/IMSS, MINSAL, Ministerio de Salud de Bolivia | Hosts bloqueados desde el contenedor; sin archivo legible por máquina alcanzable |
| PubMed / Europe PMC / CINAHL | Hosts bloqueados; se usó búsqueda web sólo para detectar huecos |
| KL (Dinamarca) FSIII enfermería, Open Nursing Core IG | Paquetes FHIR en hosts bloqueados (packages2.fhir.org, huggingface.co); idioma danés / licencia sin verificar |
| Wikidata | Host bloqueado (`www.wikidata.org`, `query.wikidata.org`) |

## Pasada 2026-10-27 — re-sondeo de los huecos «bloqueados por red» y protocolos de enfermería

Sondeo HTTP del 2026-10-27 (salida literal en `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C8/sondeo-hosts-2026-10-27.txt`). Los 403 de la pasada anterior eran de la política de red de entonces: hoy responden 200 `www.omahasystem.org`, `clinicaltables.nlm.nih.gov`, `www.sanidad.gob.es`, `www.icn.ch`, `ckm.openehr.org`, `www.minsalud.gob.bo`, `www.minsal.cl`, `www.imss.gob.mx`, `www.nice.org.uk`, `www.who.int`, `www.boe.es`; siguen **403** `loinc.org`, `rnao.ca`, `datos.gob.es`, `www.bvsalud.org`; sin respuesta `www.cenetec.salud.gob.mx`.

| Hueco | Hallazgo hoy | Qué se hizo |
|---|---|---|
| Protocolos de enfermería del **Ministerio de Salud y Deportes (Bolivia)** | `www.minsalud.gob.bo` responde 200, pero sus listados de normas y manuales (`/centro-de-prensa/publicaciones/normas`, `/recursos-humanos/manuales-de-procedimientos`, `/normativa/normativa-nacional`) no publican ningún manual de procedimientos de enfermería (0 menciones de «enfermer» en `normativa-nacional`). Lo más cercano son las *Normas Nacionales de Atención Clínica* (2012, 806 págs., alojadas en `comunidad.org.bo`): normas clínicas, no de enfermería; su portada dice «se autoriza su reproducción, total o parcial a condición de citar la fuente o propiedad» (licencia permisiva con cita) | **No se carga**. NNAC queda anotada como fuente con licencia verificada para los carriles de enfermedades y formularios clínicos |
| **IMSS / CENETEC** (México) | las GPC de enfermería se leen en `imss.gob.mx/sites/all/statics/guiasclinicas/<n>GER.pdf` (p. ej. 375GER, descargada y leída): «Este documento puede reproducirse libremente […] con fines de enseñanza y actividades no lucrativas […]. Queda prohibido todo acto […] comercialmente» → **uso no comercial** | **No se carga** (regla de licencias: NC). `cenetec-difusion.com` **ya no es de CENETEC**: sirve una página de casinos en línea; no se usa |
| **España** (Ministerio de Sanidad y GuíaSalud) | el CMDIC ya está cargado (ver sección 2). GuíaSalud (`portal.guiasalud.es/aviso-legal`): sus contenidos están bajo **CC BY-NC-ND 3.0** | **No se carga** (NC y sin obra derivada) |
| **MINSAL** (Chile) | `www.minsal.cl` y `diprece.minsal.cl` responden 200; no se halló un manual de procedimientos de enfermería ni una declaración de licencia legible | Hueco: sin documento ni licencia verificables |
| Escalas Norton, EMINA, Cubbin-Jackson, Morse | sin fuente abierta con licencia verificable (ver «Regla de licencia del contenido») | Hueco de licencia / curaduría |
| CCC, ICNP, NANDA-I, NIC, NOC | `sabacare.com` y `nanda.org` responden 200 pero sin texto de licencia legible; ICNP/NANDA/NIC/NOC siguen propietarias | Fuera de alcance por licencia (sin cambios) |

**Saturación.** Segunda pasada completa de las páginas oficiales del Omaha System (5 páginas + FAQ) y del suplemento del MOSUG: 0 conceptos nuevos respecto de la primera de ese día. Búsquedas de una lista completa de signos/síntomas (GitHub no permite la búsqueda de código desde esta sesión; Europe PMC/PMC: ningún artículo de acceso abierto la reproduce; UMLS y BioPortal exigen cuenta) no encontraron más fuente abierta.
