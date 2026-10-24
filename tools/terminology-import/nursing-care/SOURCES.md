# Fuentes — importador de cuidados de enfermería

Consultadas el **2026-10-24**. Las descargas viven fuera de git, en
`glossary-data-build/cache/nursing-care/` (ver `GLOSSARY_BUILD_DIR`), con
`sources.meta.json` (commit, fecha, URL, SHA-256 / integridad).

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
| Cargado | 616 arquetipos clínicos + 4 326 nodos + 3 073 respuestas = **8 015 conceptos**; 7 481 relaciones (PART_OF + IS_A) |
| No cargado | 73 arquetipos de composición, sección y demográficos (estructura de documento o de personas, no términos clínicos) · contenido de 197 instrumentos con licencia no libre o sin verificar (sólo su fila raíz) · 281 enlaces a SNOMED CT (Bolivia no es miembro) |
| Castellano | 77 arquetipos, 648 nodos, 366 respuestas tienen traducción `es`/`es-ar`/`es-cl`/`es-co` publicada en CKM por traductores nombrados. **No es traducción oficial del instrumento**; se guarda el autor en la propiedad `translation`. Los marcadores `*texto(en)` de CKM se tratan como «sin traducir». |

### 2. Ministerio de Sanidad de España — arquetipos UNE-EN ISO 13606 del CMDIC

| Campo | Valor |
|---|---|
| URI | https://github.com/openEHR/adl-archetypes, carpeta `Reference/ISO_13606/Spanish_MOH/ADL_14` |
| Publicador | Ministerio de Sanidad, «Recursos de Modelado Clínico (arquetipos)»: https://www.sanidad.gob.es/profesionales/hcdsns/areaRecursosSem/Rec_mod_clinico_arquetipos.htm (elaborados por la Universitat Politècnica de València con VeraTech e Indizen) |
| Versión | commit `093c77ea003742b9540e3dd377d615e2b26f2996` (2025-06-27) |
| Qué es | Estructura oficial de los informes del Conjunto Mínimo de Datos de los Informes Clínicos (RD 1093/2010), **incluido el Informe de Cuidados de Enfermería** (anexo VII), y sus entradas (valoración activa, resultados, signos vitales…). Original en castellano. |
| Licencia | **No declarada** en los archivos ni en el repositorio. Base legal anotada: RD 1093/2010 (BOE-A-2010-14199) y art. 13 del TRLPI (BOE-A-1996-8930: las disposiciones legales no son objeto de propiedad intelectual). Estado `official-publication-license-not-stated`. **Pendiente de confirmar con el Ministerio.** |
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

## Licencias de las terminologías de enfermería (registro)

| Terminología | Estado | Por qué no hay contenido | Evidencia |
|---|---|---|---|
| Omaha System | Términos en dominio público (FAQ oficial) | **Host inaccesible** desde el contenedor (`www.omahasystem.org` no resuelve). Es la primera candidata a cargar si se habilita el dominio. | secundaria |
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

Las escalas que nombra el pedido quedan así: **Braden** y **Waterlow** con copyright de terceros (aviso en el arquetipo); **Barthel modificado**, **Downton**, **Glasgow** (adulto y pediátrica) y **NEWS2** sin verificar (sólo metadatos); **Norton** y **Morse** no existen en el espejo de CKM (hueco). Detalle y URL en `lib/licenses.mjs`.

## Evaluadas y descartadas o bloqueadas

| Fuente | Motivo |
|---|---|
| Omaha System (omahasystem.org) | Dominio público, pero el host no resuelve desde la red del contenedor. **Habilitar el dominio para cargarla.** |
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
