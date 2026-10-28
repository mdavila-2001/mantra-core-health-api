# Fuentes — equipos de diagnóstico, registros de Europa

## Estado 2026-10-27 (re-sondeo del carril C10): las fuentes oficiales responden

El 2026-10-24 esta sesión no alcanzaba ningún host oficial. Hoy sí. Lo que sigue
reemplaza a la tabla «Estado 2026-10-24» más abajo (que queda como historia). El
sondeo completo, host por host, está en
`docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C10/M1-sondeo-2026-10-27.tsv`
(`node ../probe-sources.mjs`).

| Fuente | Resultado de hoy | Licencia / términos (leídos hoy) | Qué se hizo |
|---|---|---|---|
| **EMDN v2026** (`webgate.ec.europa.eu/dyna2/emdn/build/EMDN v2026_EN..xlsx`, Last-Modified 2026-09-25) | 200, 382 642 B, 8 516 códigos | Comisión Europea: contenido «licensed under CC BY 4.0» salvo aviso (`commission.europa.eu/legal-notice_en`) | Oficial reemplaza a las réplicas de la V2 (8 453). La página `health.ec.europa.eu/...emdn_en` ya no enlaza el Excel: lo enlaza la app de la EMDN. La v2026 **retiró** el código `Z120306` que la V2 tenía (telemetría de signos vitales): sigue en `INCLUDED_TYPE_PREFIXES` para clasificar equipos antiguos. |
| **EUDAMED Data Lake** `/udi`, `/actors`, `/reference` (`api.datalake.sante.service.ec.europa.eu/eudamed`) | 200 sin clave, 1 000 filas por página, `api-version=v1.0` obligatorio | Portal de desarrolladores: «Open Access: All data is freely available for use and consumption»; datos de la Comisión: CC BY 4.0 | `fetch-eudamed.mjs` recorre todo `/udi` por `nextLink`; `fetch-official.mjs` baja `/actors` y `/reference`. Hallazgos contra el servicio real: los filtros son de igualdad exacta, `NOMENCLATURE_CODE` trae un espacio inicial y a veces varios códigos separados por coma (por eso no se filtra por código en el servidor), y el cursor `$after` cambia en cada página. `/actors` trae e-mail, teléfono y la persona responsable (PRRC): se descartan. |
| **EUDAMED portal** (`ec.europa.eu/tools/eudamed/api/...`) | 200 | Sin términos específicos leídos | Solo se usa `udiDiData/{uuid}` como `sourceUrl` verificable de cada fila (200). Certificados y organismo notificado (`basicUdiData`) siguen sin descargarse. |
| **BD/RDM** (Ministero della Salute, `DISPO_RDM_1_20261026_csv.zip`, 57 MB, 2 437 994 registros) | 200 | IODL v2.0 (ficha leída hoy) | Se exportan los registros con CND categoría **W** («DISPOSITIVI MEDICO-DIAGNOSTICI IN VITRO (D. Lgs. 332/2000)», título publicado en la CND). El resto (Z11/Z12 y demás) queda sin exportar: curaduría. El código fiscal de 16 caracteres (persona física) no se conserva. |
| **CND** (`DISPO_RDM_74_20261001.csv`, 11 115 filas con vigencias) | 200 | IODL v2.0 | Descargada y registrada; entra a la taxonomía de `master/` a través de los códigos que traen los registros. |
| **MHRA PARD** | 200, es una app React sin descarga masiva | Su FAQ «What is GMDN?» (leída hoy): extraer contenido GMDN «for creating and supporting commercial services such as alternative categorisation, mapping … or AI training» exige licencia de la GMDN Agency | **Hueco por licencia.** No se raspa. |
| **swissdamed** | 200, app Vue; sin archivo abierto | Las condiciones de Swissmedic prohíben la extracción automatizada sin autorización (leídas el 2026-10-24); hoy no se encontró un texto de reutilización específico de swissdamed | **Hueco por términos.** No se descarga. |
| **NANDO** | 200 | Reutilización con atribución (Decisión 2011/833/UE) | No es un registro de equipos (organismos notificados). |
| **BfArM, AEMPS, ANSM** | 200 | — | Sin registro nacional descargable (remiten a EUDAMED). |

Registro canónico en código: [`lib/sources.mjs`](lib/sources.mjs). Esta tabla lo resume con el
estado de acceso comprobado desde la sesión del 2026-10-24.

«Términos verificados» = el texto de términos se leyó en la fuente oficial. En esta sesión
**ningún** host oficial fue alcanzable (la política de red del entorno devuelve 403), así que
ninguno está verificado en origen: lo que se escribe abajo es lo que se pudo confirmar por
buscador o por documentos oficiales citados por terceros, y queda marcado como no verificado.

| Fuente | Qué aporta | Acceso | Términos | Descarga automática | Estado 2026-10-24 |
|---|---|---|---|---|---|
| **EMDN** (Comisión Europea) | Nomenclatura completa con jerarquía; criterio de alcance | Excel completo enlazado desde la página oficial | Accesible a todos y sin costo; reutilización con atribución (Decisión 2011/833/UE). Pendiente leer el aviso del sitio | Sí | Bloqueado (403) |
| **EUDAMED Public API v1.0** (Data Lake DG SANTE) | Equipos por UDI-DI: EMDN, fabricante y SRN, marca, modelo/referencia, clase, estado | `GET /udi`, `/actors`, `/reference`; paginación `nextLink`; `format=json\|csv` | API pública oficial; reutilización con atribución (2011/833/UE). Pendiente leer condiciones del portal de desarrolladores | Sí | Bloqueado (403) |
| **EUDAMED portal** (API interna de la interfaz) | Certificado, revisión, fechas y organismo notificado por Basic UDI-DI | `basicUdiData/{uuid}` documentado por openregulatory/eudamed-api (MIT) | Sin términos propios leídos | No (solo enriquecimiento puntual tras verificar términos) | Bloqueado (403) |
| **MHRA PARD** (Reino Unido) | Fabricantes registrados, tipos GMDN, marcas | Búsqueda con «Download CSV» por resultado; sin API ni descarga completa documentadas | Posible OGL v3.0, sin confirmar para PARD | No | Bloqueado (403) |
| **swissdamed** (Swissmedic) | Actores con SRN y mandatarios suizos; UDI-DI con EMDN | API pública de la interfaz (contrato verificado en zdavatz/swissdamed2sqlite@45cd947) | **Las condiciones del sitio de Swissmedic prohíben reproducir y extraer automáticamente sin autorización expresa**; sin confirmar si rigen para swissdamed | **No** | Bloqueado (403) y en espera de términos |
| **BD/RDM** (Ministero della Salute, Italia) | Más de un millón de dispositivos con CND, fabricante y repertorio | CSV semanal + diccionario v2.0 | Italian Open Data License v2.0 (ficha leída por buscador) | Sí (normaliza solo tras mapear columnas) | Bloqueado (403) |
| **CND** (Ministero della Salute, Italia) | Clasificación nacional, base de la EMDN | CSV mensual | IODL v2.0 (ficha leída por buscador) | Sí | Bloqueado (403) |
| **NANDO** (DG GROW) | Nombre y número de los organismos notificados | Búsqueda web, sin descarga masiva | Reutilización con atribución, sin confirmar | No | Bloqueado (403) |
| **BfArM** (Alemania) | — | Sin descarga pública de registros identificada | — | No | Hueco |
| **AEMPS / CCPS** (España) | — | Consulta pública, sin descarga masiva | — | No | Hueco |
| **ANSM** (Francia) | — | Sin registro nacional descargable (remite a EUDAMED) | — | No | Hueco |

## Réplicas públicas en git (de dónde salen los datos mientras los hosts oficiales están bloqueados)

Fijadas por commit en [`lib/mirrors.mjs`](lib/mirrors.mjs); `fetch-mirrors.mjs` las clona y anota
el sha256. Cada fila cita la ficha oficial en `sourceUrl` y la réplica en `extra.mirror`.

| Réplica | Commit | Qué aporta | Licencia del repo | Datos |
|---|---|---|---|---|
| `zdavatz/eudamed2firstbase` · `firstbase_json/processed/` | `48f93836` (2026-10-22) | 22 865 UDI-DI de EUDAMED (detalle + Basic UDI-DI) en GS1 firstbase | GPL-3.0 (código) | EUDAMED, reutilización con atribución (Decisión 2011/833/UE) |
| `DLinRT-eu/dlinrteu-website` · `docs/audits/eudamed/2026-09-22-eudamed-emdn-discovery.csv` | `f096a477` (2026-10-23) | 116 dispositivos del portal de EUDAMED consultados por código EMDN | AGPL-3.0 | EUDAMED, ídem |
| `BatirMedical/nomenclature-emdn` · `EMDN_BatirMedical.csv` | `e0131762` (2025-04-02) | EMDN V2 completa, 8 453 términos | MIT (estructura) | EMDN de la Comisión, acceso libre y gratuito |
| `longtran00/EUDAMED_ManufacturersScraper` · `Eudamed_Manufacturers.xlsx` | `44ff9f90` (2025-02-18) | 43 669 filas de actores fabricantes (con historial) | sin licencia declarada (el código no se usa) | EUDAMED, ídem |

Límites conocidos: el convertidor de `eudamed2firstbase` rellena la referencia con el GTIN cuando
falta (se descarta) y pone clase I por defecto si le faltaba la Basic UDI-DI (se marca en
`extra.riskClassMayBeConverterDefault`). Las réplicas cubren solo lo que sus autores descargaron:
no son EUDAMED completo.

## Claves de fuente en el formato común y recorte

Claves (`source`): `eudamed-udi`, `eudamed-certificates`, `ec-emdn`, `mhra-pard`,
`swissmedic-swissdamed`, `it-salute-bdrdm`, `it-salute-cnd`, `ec-nando`, `de-bfarm`,
`es-aemps-ccps`, `fr-ansm`. Actores aparte: `eudamed-actors` (en `out/actors/`, no son filas de
equipos).

Recorte aplicado por esta región (lo pide el README común): se exportan filas con código EMDN/CND
de la categoría W (IVD, entera) y de los 79 tipos listados en `INCLUDED_TYPE_PREFIXES`, decididos
uno por uno contra la EMDN V2; `extra.dxScope` dice qué regla incluyó cada fila. No se exportan
las categorías A, B, D, F, H, J, K, L, M, P, S, T, X, Y ni los tipos no diagnósticos o mixtos de
C, G, N, Q, R, U, V y Z (motivos en `lib/emdn-scope.mjs` y árbol en `out/emdn-scope-review.md`).

## Documentación de terceros usada para fijar contratos (no para datos)

| Recurso | Licencia | Para qué |
|---|---|---|
| `Arya012-UvA/Eudamed_Lookup@fe5bd47` · `docs/eudamed-public-openapi-v1.0.json` | sin licencia declarada en el archivo; es copia del OpenAPI oficial | Operaciones y filtros oficiales del Data Lake |
| `@t4dhg/mcp-eudamed@0.1.1` (npm) / `t4dhg/mcp-eudamed@aec476f` | MIT | Sobre `{value,nextLink}`, `api-version=v1.0`, nombres de campo observados |
| `openregulatory/eudamed-api` | MIT | Contrato de la API interna del portal (certificados, organismo notificado) |
| `openregulatory/eudamed-audit` | — | Duplicación de certificados en `basicUdiData` (por qué se deduplica) |
| `zdavatz/swissdamed2sqlite@45cd947` | GPL-3.0 | Contrato de la API pública de swissdamed |
| Presentación del Ministero della Salute (2025) «Understanding, Consulting and Using EMDN» | — | Columnas del Excel de la EMDN |
| UDI Helpdesk de la Comisión, «EMDN codes» | — | Estructura del código (7 niveles, 13 caracteres) |

## Fuentes descartadas

| Fuente | Motivo |
|---|---|
| `zdavatz/swissdamed2sqlite` · `csv/srn_unique.csv` (4 203 fabricantes con SRN y mandatario suizo) | Datos reales, pero derivados de extraer swissdamed automáticamente; las condiciones de Swissmedic lo prohíben sin autorización hasta que se confirme lo contrario |
| `zdavatz/swissdamed2sqlite` · `tests/fixtures/golden_set.tsv` | Conjunto curado de prueba, sin UDI-DI ni id de registro: no es trazable a una ficha |
| Actores de Apify que exportan EUDAMED/NANDO | Servicios pagos de terceros que raspan la fuente; no son fuente primaria |
| Copias de la EMDN en Scribd | Copias no oficiales |
| `register-dynamics/notified-body-registers` | Copia de NANDO de 2018, anterior a las designaciones MDR/IVDR |
| `anamnesi.na.icar.cnr.it` CodeSystem CND | Un solo código; no es la CND completa |
| Mapeos GMDN↔EMDN de `lisadonlon/GMDNEMDN`, `Kilanopi`, `cl-tud` | Automáticos por similitud de texto, no oficiales: un mapeo entre nomenclaturas solo vale si lo publica una fuente |
