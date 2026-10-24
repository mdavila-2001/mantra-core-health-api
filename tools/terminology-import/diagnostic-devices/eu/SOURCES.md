# Fuentes — equipos de diagnóstico, registros de Europa

Registro canónico en código: [`lib/sources.mjs`](lib/sources.mjs). Esta tabla lo resume con el
estado de acceso comprobado desde la sesión del 2026-10-24.

«Términos verificados» = el texto de términos se leyó en la fuente oficial. En esta sesión
**ningún** host oficial fue alcanzable (la política de red del entorno devuelve 403), así que
ninguno está verificado en origen: lo que se escribe abajo es lo que se pudo confirmar por
buscador o por documentos oficiales citados por terceros, y queda marcado como pendiente.

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
