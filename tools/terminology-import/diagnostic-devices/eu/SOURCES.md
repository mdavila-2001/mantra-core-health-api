# Fuentes — equipos de diagnóstico, registros de Europa

Registro canónico en código: [`lib/sources.mjs`](lib/sources.mjs). Esta tabla lo resume con el
estado de acceso comprobado el 2026-10-24.

«Términos verificados» = el texto de términos se leyó en la fuente oficial. Hasta la pasada 6 la
política de red del entorno devolvía 403 para todos los hosts oficiales; en la pasada 7 (red
abierta) se leyeron en vivo y se descargaron las fuentes con descarga automática.

| Fuente | Qué aporta | Acceso | Términos | Verificados | Descarga automática | Estado 2026-10-24 (pasada 7) |
|---|---|---|---|---|---|---|
| **EMDN** (Comisión Europea) | Nomenclatura completa con jerarquía; criterio de alcance | Excel `EMDN v2026_EN` enlazado desde `webgate.ec.europa.eu/dyna2/emdn/M90` | Accesible a todos y sin costo; aviso legal de la Comisión: CC BY 4.0 (Decisión 2011/833/UE) | **Sí** (en vivo) | Sí | Descargada (v2026) |
| **EUDAMED Public API v1.0** (Data Lake DG SANTE) | Equipos por UDI-DI: EMDN, fabricante y SRN, marca, modelo/referencia, clase, estado; actores | `GET /udi`, `/actors`, `/reference`; paginación `nextLink` con `$after`; sin clave | Aviso legal general de la Comisión (CC BY 4.0); el aviso propio de EUDAMED no se pudo leer (aplicación JavaScript) | Parcial | Sí | Descargado: `/udi` por cada código EMDN en alcance, `/actors` fabricantes, `/reference` |
| **EUDAMED portal** (API interna de la interfaz) | Certificado, revisión, fechas y organismo notificado por Basic UDI-DI | `basicUdiData/{uuid}` documentado por openregulatory/eudamed-api (MIT) | Sin términos propios leídos | No | No (los certificados salen de la réplica firstbase por UUID) | Hueco: no se descarga en bloque. `sourceUrl` de cada UDI apunta a su ficha pública `udiDiData/{uuid}` |
| **MHRA PARD** (Reino Unido) | Fabricantes registrados, tipos GMDN, marcas | Búsqueda con «Download CSV» por resultado; sin API ni descarga completa | Solo «© Crown Copyright», sin OGL declarada; nombres GMDN con uso comercial restringido | **Sí** (en vivo) | No | Hueco por licencia |
| **swissdamed** (Swissmedic) | Actores con SRN y mandatarios suizos; UDI-DI con EMDN | API pública de la interfaz | **Las condiciones de Swissmedic prohíben reproducir y extraer automáticamente (scraping/data mining) sin autorización expresa**; no hay términos propios de swissdamed | **Sí** (en vivo) | **No** | Excluido hasta que Swissmedic autorice |
| **BD/RDM** (Ministero della Salute, Italia) | ~2,4 millones de dispositivos con CND, fabricante, código de catálogo y nombre comercial | ZIP semanal `DISPO_RDM_1_<fecha>_csv.zip` + diccionario v2.0 | Italian Open Data Licence v2.0 | **Sí** (en vivo) | Sí | Descargado (corte 2026-10-19); 216 848 dispositivos en alcance |
| **CND** (Ministero della Salute, Italia) | Clasificación nacional, base de la EMDN | CSV mensual | IODL v2.0 (ficha leída por buscador) | No | Sí | Descargado, no se carga (la EMDN es la clasificación) |
| **NANDO** (DG GROW) | Nombre y número de los organismos notificados | Búsqueda web, sin descarga masiva | Reutilización con atribución, sin confirmar | No | No | Hueco (responde vacío sin navegador) |
| **BfArM** (Alemania) | — | Sin descarga pública de registros identificada | — | — | No | Hueco |
| **AEMPS / CCPS** (España) | — | Consulta pública, sin descarga masiva | — | — | No | Hueco |
| **ANSM** (Francia) | — | Sin registro nacional descargable (remite a EUDAMED) | — | — | No | Hueco |

Minimización de datos personales: de los actores de EUDAMED solo se publican nombre, país,
ciudad, tipo, estado y SRN de la organización (nunca PRRC, correo ni teléfono). De la BD/RDM, el
`cod_fiscale` solo se publica si tiene 11 dígitos (persona jurídica); el de 16 caracteres es de
una persona física y se descarta.

## Réplicas públicas en git (respaldo cuando una fuente oficial no está en el caché)

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
de la categoría W (IVD, entera) y de los 80 tipos listados en `INCLUDED_TYPE_PREFIXES`, decididos
uno por uno contra la EMDN v2026; `extra.dxScope` dice qué regla incluyó cada fila. No se exportan
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
