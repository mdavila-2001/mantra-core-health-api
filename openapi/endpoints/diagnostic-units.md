<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `diagnostic_units`

Referencia exhaustiva de 47 operación(es) del módulo `diagnostic_units`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `diagnostic-equipment`, `diagnostic-pricing`, `diagnostic-unit-accreditations`, `diagnostic-unit-sites`, `diagnostic-units`, `diagnostics-lab-portal`, `diagnostics-patient-results`
- **Controladores:** `CenterScheduleController`, `DiagnosticEquipmentController`, `DiagnosticPricingController`, `DiagnosticUnitAccreditationsController`, `DiagnosticUnitSitesController`, `DiagnosticUnitsController`, `LabPortalServicesController`, `OrderBookingController`, `StudyAvailabilityController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /diagnostic-equipment/{id}](#1-get-diagnostic-equipment-id) — Detalle de un equipo con su sala (F5a)
2. [PATCH /diagnostic-equipment/{id}](#2-patch-diagnostic-equipment-id) — Actualizar estado/calibración de un equipo
3. [GET /diagnostic-equipment/{id}/mwl-station](#3-get-diagnostic-equipment-id-mwl-station) — Estación MWL del equipo (F5a)
4. [POST /diagnostic-equipment/{id}/resource](#4-post-diagnostic-equipment-id-resource) — Crear el recurso agendable del equipo (F5a)
5. [DELETE /diagnostic-results/me/orders/{orderId}/booking](#5-delete-diagnostic-results-me-orders-orderid-booking) — Cancel the appointment of my order
6. [POST /diagnostic-results/me/orders/{orderId}/booking](#6-post-diagnostic-results-me-orders-orderid-booking) — Book my order at a center, confirmed
7. [GET /diagnostic-results/me/orders/{orderId}/booking-options](#7-get-diagnostic-results-me-orders-orderid-booking-options) — Centers that perform the study of my order
8. [DELETE /diagnostic-study-offerings/{id}](#8-delete-diagnostic-study-offerings-id) — Retirar (soft-delete) una oferta de estudio
9. [POST /diagnostic-unit-accreditations/{id}/renew](#9-post-diagnostic-unit-accreditations-id-renew) — Renovar/registrar acreditación con evidencia
10. [PATCH /diagnostic-unit-sites/{siteId}](#10-patch-diagnostic-unit-sites-siteid) — Actualizar un sitio operativo de la unidad
11. [POST /diagnostic-unit-sites/{siteId}/equipment](#11-post-diagnostic-unit-sites-siteid-equipment) — Registrar equipamiento y calibración del sitio
12. [GET /diagnostic-units](#12-get-diagnostic-units) — Listar unidades diagnósticas publicadas
13. [POST /diagnostic-units](#13-post-diagnostic-units) — Alta de unidad diagnóstica con sitios y acreditaciones
14. [GET /diagnostic-units/{id}](#14-get-diagnostic-units-id) — Consultar el perfil de una unidad diagnóstica
15. [POST /diagnostic-units/{id}/accreditations](#15-post-diagnostic-units-id-accreditations) — Registrar una acreditación con evidencia
16. [GET /diagnostic-units/{id}/administration](#16-get-diagnostic-units-id-administration) — Consola de administración de una unidad diagnóstica
17. [POST /diagnostic-units/{id}/practitioner-assignments](#17-post-diagnostic-units-id-practitioner-assignments) — Asignar un especialista a la unidad/sitio
18. [POST /diagnostic-units/{id}/price-schedules](#18-post-diagnostic-units-id-price-schedules) — Crear un cronograma de precios
19. [POST /diagnostic-units/{id}/reproject](#19-post-diagnostic-units-id-reproject) — Reconstruir la proyección del perfil público
20. [POST /diagnostic-units/{id}/sites](#20-post-diagnostic-units-id-sites) — Registrar un sitio operativo de la unidad
21. [PUT /diagnostic-units/{id}/specialties](#21-put-diagnostic-units-id-specialties) — Declarar las especialidades de la unidad
22. [POST /diagnostic-units/{id}/study-offerings](#22-post-diagnostic-units-id-study-offerings) — Publicar oferta de estudio con componentes (panel)
23. [POST /diagnostic-units/{id}/verify-and-publish](#23-post-diagnostic-units-id-verify-and-publish) — Verificar la unidad y publicar su perfil público
24. [POST /diagnostic-units/{unitId}/equipment](#24-post-diagnostic-units-unitid-equipment) — Register a device (a production line)
25. [DELETE /diagnostic-units/{unitId}/equipment/{equipmentId}](#25-delete-diagnostic-units-unitid-equipment-equipmentid) — Remove a device registered by mistake
26. [PATCH /diagnostic-units/{unitId}/equipment/{equipmentId}](#26-patch-diagnostic-units-unitid-equipment-equipmentid) — Mark a device operational or not
27. [PUT /diagnostic-units/{unitId}/equipment/{equipmentId}](#27-put-diagnostic-units-unitid-equipment-equipmentid) — Edit a device: name, maker, serial, modality
28. [GET /diagnostic-units/{unitId}/schedule](#28-get-diagnostic-units-unitid-schedule) — Schedule, studies and equipment of a center
29. [PUT /diagnostic-units/{unitId}/schedule](#29-put-diagnostic-units-unitid-schedule) — Publish the whole schedule of a center
30. [GET /diagnostic-units/{unitId}/study-availability](#30-get-diagnostic-units-unitid-study-availability) — Free starts of a study in a center
31. [GET /diagnostic-units/administration](#31-get-diagnostic-units-administration) — Listar las unidades del tenant, publicadas o no
32. [GET /diagnostic-units/me/bookings](#32-get-diagnostic-units-me-bookings) — Appointments booked at my center, by start
33. [GET /diagnostic-units/me/schedule](#33-get-diagnostic-units-me-schedule) — Schedule, studies and equipment of my center
34. [GET /diagnostic-units/search](#34-get-diagnostic-units-search) — Buscar centros de diagnóstico, laboratorio e imagen
35. [GET /diagnostics/lab/catalog](#35-get-diagnostics-lab-catalog) — Catálogo de análisis (LOINC) con componentes y precio sugerido
36. [POST /diagnostics/lab/catalog/import](#36-post-diagnostics-lab-catalog-import) — Sumar análisis del catálogo, con sus componentes y precio sugerido
37. [GET /diagnostics/lab/categories](#37-get-diagnostics-lab-categories) — Categorías del laboratorio, con su conteo
38. [POST /diagnostics/lab/categories](#38-post-diagnostics-lab-categories) — Crear una categoría (409 si el nombre ya existe, sin importar mayúsculas)
39. [DELETE /diagnostics/lab/categories/{id}](#39-delete-diagnostics-lab-categories-id) — Eliminar una categoría (409 mientras agrupe servicios no retirados)
40. [PATCH /diagnostics/lab/categories/{id}](#40-patch-diagnostics-lab-categories-id) — Renombrar una categoría (409 si el nombre ya existe)
41. [GET /diagnostics/lab/services](#41-get-diagnostics-lab-services) — Catálogo de servicios del laboratorio
42. [POST /diagnostics/lab/services](#42-post-diagnostics-lab-services) — Dar de alta un servicio con su precio
43. [DELETE /diagnostics/lab/services/{id}](#43-delete-diagnostics-lab-services-id) — Retirar un servicio (no se borra)
44. [PATCH /diagnostics/lab/services/{id}](#44-patch-diagnostics-lab-services-id) — Editar un servicio (un precio nuevo es una versión nueva)
45. [POST /diagnostics/lab/services/import](#45-post-diagnostics-lab-services-import) — Carga masiva por código, fila por fila
46. [POST /price-schedules/{scheduleId}/study-prices](#46-post-price-schedules-scheduleid-study-prices) — Fijar/versionar el precio de un estudio (append-only)
47. [POST /study-prices/{priceId}/close](#47-post-study-prices-priceid-close) — Cerrar una versión de precio vigente

---

## 1. GET /diagnostic-equipment/{id}

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-equipment`
- **Nombre:** Detalle de un equipo con su sala (F5a)
- **Operation ID:** `DiagnosticEquipmentController_detail`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticEquipmentController.detail](../../src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts)

### Descripción de negocio

Detalle de un equipo con su sala (F5a). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: F5a: detalle del equipo con su sala, AE Title y recurso.

### Descripción del sistema

NestJS resuelve `GET /diagnostic-equipment/{id}` en `DiagnosticEquipmentController_detail`. El controlador delega en `EquipmentF5aService.detail`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-equipment/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-equipment/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-unit-scope.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-equipment/{id}"
}
```

---

## 2. PATCH /diagnostic-equipment/{id}

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-equipment`
- **Nombre:** Actualizar estado/calibración de un equipo
- **Operation ID:** `DiagnosticEquipmentController_updateEquipment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticEquipmentController.updateEquipment](../../src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts)

### Descripción de negocio

Actualizar estado/calibración de un equipo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /diagnostic-equipment/{id}` en `DiagnosticEquipmentController_updateEquipment`. El controlador delega en `DiagnosticEquipmentService.updateEquipment`. Valida el body como `UpdateEquipmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<EquipmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateEquipmentDto`; los campos opcionales se omiten.

```http
PATCH /diagnostic-equipment/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `careSpaceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `aeTitle` | No | `string` | longitud máxima 16; admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `stationName` | No | `string` | longitud máxima 16; admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `manufacturer` | No | `string` | longitud máxima 200 | Fabricante | `valor-ejemplo` |
| `model` | No | `string` | longitud máxima 200 | Modelo | `valor-ejemplo` |
| `lastCalibrationAt` | No | `string` | formato `date-time` | Última calibración | `2026-07-31T12:00:00.000Z` |
| `nextCalibrationDueAt` | No | `string` | formato `date-time` | Próxima calibración | `2026-07-31T12:00:00.000Z` |
| `operationalStatusConceptId` | No | `string` | formato `uuid` | Estado operativo (concept id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /diagnostic-equipment/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "aeTitle": "valor-ejemplo",
  "stationName": "Nombre de ejemplo",
  "manufacturer": "valor-ejemplo",
  "model": "valor-ejemplo",
  "lastCalibrationAt": "2026-07-31T12:00:00.000Z",
  "nextCalibrationDueAt": "2026-07-31T12:00:00.000Z",
  "operationalStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EquipmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "diagnosticUnitSiteId": "00000000-0000-4000-8000-000000000001",
  "operationalStatus": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "aeTitle": "valor-ejemplo",
  "stationName": "Nombre de ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `diagnosticUnitSiteId` | Sí | `string` | formato `uuid` | Identificador asociado a diagnostic unit site. | `00000000-0000-4000-8000-000000000001` |
| `operationalStatus` | Sí | `string` | formato `uuid` | Concept id de estado operativo | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | No | `string` | formato `uuid`; admite null | F5a: sala del equipo. | `00000000-0000-4000-8000-000000000001` |
| `aeTitle` | No | `string` | admite null | F5a: DICOM AE Title. | `valor-ejemplo` |
| `stationName` | No | `string` | admite null | F5a: DICOM Station Name. | `Nombre de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-unit-scope.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 409 | `CONFLICT` | El AE Title ya está en uso en la sede | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-equipment.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La sala es de otra sede | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-equipment.service.ts |
| 422 | `PRECONDITION_FAILED` | El espacio no aloja equipos | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-equipment.service.ts |
| 422 | `PRECONDITION_FAILED` | AE Title inválido (≤ 16 caracteres ASCII, sin barra invertida) | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-equipment.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-equipment/{id}"
}
```

---

## 3. GET /diagnostic-equipment/{id}/mwl-station

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-equipment`
- **Nombre:** Estación MWL del equipo (F5a)
- **Operation ID:** `DiagnosticEquipmentController_mwlStation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticEquipmentController.mwlStation](../../src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts)

### Descripción de negocio

Estación MWL del equipo (F5a). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: F5a: estación de la Worklist DICOM (Scheduled Station AE Title/Name, SPS Location).

### Descripción del sistema

NestJS resuelve `GET /diagnostic-equipment/{id}/mwl-station` en `DiagnosticEquipmentController_mwlStation`. El controlador delega en `EquipmentF5aService.mwlStation`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-equipment/00000000-0000-4000-8000-000000000001/mwl-station HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-equipment/00000000-0000-4000-8000-000000000001/mwl-station HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-unit-scope.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-equipment/{id}/mwl-station"
}
```

---

## 4. POST /diagnostic-equipment/{id}/resource

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-equipment`
- **Nombre:** Crear el recurso agendable del equipo (F5a)
- **Operation ID:** `DiagnosticEquipmentController_createResource`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticEquipmentController.createResource](../../src/modules/diagnostic_units/controllers/diagnostic-equipment.controller.ts)

### Descripción de negocio

Crear el recurso agendable del equipo (F5a). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: F5a: recurso agendable `RES_EQUIPMENT` del equipo (409 si ya existe).

### Descripción del sistema

NestJS resuelve `POST /diagnostic-equipment/{id}/resource` en `DiagnosticEquipmentController_createResource`. El controlador delega en `EquipmentF5aService.createResource`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /diagnostic-equipment/00000000-0000-4000-8000-000000000001/resource HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /diagnostic-equipment/00000000-0000-4000-8000-000000000001/resource HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-unit-scope.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 409 | `CONFLICT` | El equipo ya tiene un recurso agendable | Excepción explícita en src/modules/diagnostic_units/services/equipment-f5a.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-equipment/{id}/resource"
}
```

---

## 5. DELETE /diagnostic-results/me/orders/{orderId}/booking

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostics-patient-results`
- **Nombre:** Cancel the appointment of my order
- **Operation ID:** `OrderBookingController_cancel`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrderBookingController.cancel](../../src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts)

### Descripción de negocio

Cancel the appointment of my order. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `DELETE /diagnostic-results/me/orders/{orderId}/booking` en `OrderBookingController_cancel`. El controlador delega en `CancelOrderBookingUseCase.execute`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `orderId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /diagnostic-results/me/orders/00000000-0000-4000-8000-000000000001/booking HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Deben ser UUID válidos: `orderId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /diagnostic-results/me/orders/00000000-0000-4000-8000-000000000001/booking HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 204 | Operación completada sin cuerpo de respuesta. | `Promise<void>` | No |
| 400 | Operación completada correctamente. | `Promise<void>` | No |
| 401 | Operación completada correctamente. | `Promise<void>` | No |
| 403 | Operación completada correctamente. | `Promise<void>` | No |
| 404 | Operación completada correctamente. | `Promise<void>` | No |
| 409 | Operación completada correctamente. | `Promise<void>` | No |
| 422 | Operación completada correctamente. | `Promise<void>` | No |
| 429 | Operación completada correctamente. | `Promise<void>` | No |
| 500 | Operación completada correctamente. | `Promise<void>` | No |
| 504 | Operación completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La orden no tiene cita | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/cancel-order-booking.use-case.ts |
| 404 | `NOT_FOUND` | Orden no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/order-booking-access.service.ts |
| 409 | `CONFLICT` | Esta orden ya tiene su resultado: no hace falta reservar. | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/order-booking-access.service.ts |
| 422 | `PRECONDITION_FAILED` | Ese turno ya pasó. | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/cancel-order-booking.use-case.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene perfil de paciente | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/order-booking-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-results/me/orders/{orderId}/booking"
}
```

---

## 6. POST /diagnostic-results/me/orders/{orderId}/booking

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostics-patient-results`
- **Nombre:** Book my order at a center, confirmed
- **Operation ID:** `OrderBookingController_book`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrderBookingController.book](../../src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts)

### Descripción de negocio

Book my order at a center, confirmed. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostic-results/me/orders/{orderId}/booking` en `OrderBookingController_book`. El controlador delega en `BookOrderUseCase.execute`. Valida el body como `BookOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<OrderAppointmentDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `orderId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BookOrderDto`; los campos opcionales se omiten.

```http
POST /diagnostic-results/me/orders/00000000-0000-4000-8000-000000000001/booking HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "unitId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-11-05T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Deben ser UUID válidos: `orderId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `unitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteId` | No | `string` | formato `uuid` | The site (branch) chosen; absent, the main site. | `00000000-0000-4000-8000-000000000001` |
| `startAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026-11-05T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostic-results/me/orders/00000000-0000-4000-8000-000000000001/booking HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "unitId": "00000000-0000-4000-8000-000000000001",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-11-05T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<OrderAppointmentDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<OrderAppointmentDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OrderAppointmentDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OrderAppointmentDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OrderAppointmentDto>` | No |
| 409 | `details.slotTaken`: the start filled up meanwhile; without it, the order already has an appointment. | `Promise<OrderAppointmentDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OrderAppointmentDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OrderAppointmentDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OrderAppointmentDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OrderAppointmentDto>` | No |
| 504 | Operación completada correctamente. | `Promise<OrderAppointmentDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OrderAppointmentDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "bookingId": "00000000-0000-4000-8000-000000000001",
  "unitId": "00000000-0000-4000-8000-000000000001",
  "unitName": "Nombre de ejemplo",
  "addressText": "valor-ejemplo",
  "startAt": "valor-ejemplo",
  "endAt": "valor-ejemplo",
  "studyName": "Nombre de ejemplo",
  "price": 1,
  "currency": "BOB",
  "preparation": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bookingId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `unitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `unitName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `addressText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `startAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `endAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `studyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `price` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `currency` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `preparation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Centro no encontrado | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/book-order.use-case.ts |
| 404 | `NOT_FOUND` | El centro no hace ese estudio | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/book-order.use-case.ts |
| 404 | `NOT_FOUND` | Orden no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/order-booking-access.service.ts |
| 404 | `NOT_FOUND` | Sucursal no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/center-context.service.ts |
| 409 | `CONFLICT` | Esta orden ya tiene un turno. Cancélelo para elegir otro. | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/book-order.use-case.ts |
| 409 | `CONFLICT` | Ese horario se acaba de ocupar. Elija otro. | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/book-order.use-case.ts |
| 409 | `CONFLICT` | Esta orden ya tiene su resultado: no hace falta reservar. | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/order-booking-access.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene perfil de paciente | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/order-booking-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-results/me/orders/{orderId}/booking"
}
```

---

## 7. GET /diagnostic-results/me/orders/{orderId}/booking-options

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostics-patient-results`
- **Nombre:** Centers that perform the study of my order
- **Operation ID:** `OrderBookingController_bookingOptions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrderBookingController.bookingOptions](../../src/modules/diagnostic_units/center-schedule/presentation/order-booking.controller.ts)

### Descripción de negocio

Centers that perform the study of my order. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /diagnostic-results/me/orders/{orderId}/booking-options` en `OrderBookingController_bookingOptions`. El controlador delega en `GetBookingOptionsUseCase.execute`. No recibe body. El tipo de retorno estático es `Promise<OrderBookingOptionsDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `orderId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-results/me/orders/00000000-0000-4000-8000-000000000001/booking-options HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Deben ser UUID válidos: `orderId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-results/me/orders/00000000-0000-4000-8000-000000000001/booking-options HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OrderBookingOptionsDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<OrderBookingOptionsDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<OrderBookingOptionsDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<OrderBookingOptionsDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<OrderBookingOptionsDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<OrderBookingOptionsDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<OrderBookingOptionsDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<OrderBookingOptionsDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OrderBookingOptionsDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "orderId": "00000000-0000-4000-8000-000000000001",
  "studyCode": "CODIGO_EJEMPLO",
  "studyName": "Nombre de ejemplo",
  "modalityCode": "ECO",
  "modalityLabel": "valor-ejemplo",
  "options": [
    {
      "unitId": "00000000-0000-4000-8000-000000000001",
      "unitName": "Nombre de ejemplo",
      "siteId": "00000000-0000-4000-8000-000000000001",
      "siteName": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "price": 1,
      "currency": "BOB",
      "distanceKm": 1,
      "nextStartAt": "valor-ejemplo",
      "preparation": "valor-ejemplo",
      "operationalEquipment": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `orderId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `studyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `modalityLabel` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `options` | Sí | `array<OrderBookingOptionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"unitId":"00000000-0000-4000-8000-000000000001","unitName":"Nombre de ejemplo","siteId":"00000000-0000-4000-8000-000000000001","siteName":"Nombre de ejemplo","addressText":"valor-ejemplo","price":1,"currency":"BOB","distanceKm":1,"nextStartAt":"valor-ejemplo","preparation":"valor-ejemplo","operationalEquipment":1}]` |
| `options[].unitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `options[].unitName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `options[].siteId` | Sí | `string` | formato `uuid`; admite null | The site (branch) of this option: each site has its schedule. | `00000000-0000-4000-8000-000000000001` |
| `options[].siteName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `options[].addressText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `options[].price` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `options[].currency` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `options[].distanceKm` | Sí | `number` | admite null | Straight line from the patient home; `null` if a location is missing. | `1` |
| `options[].nextStartAt` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `options[].preparation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `options[].operationalEquipment` | Sí | `number` | Sin restricción adicional declarada | Patients per slot for the modality. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Orden no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/order-booking-access.service.ts |
| 404 | `NOT_FOUND` | Sucursal no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/center-context.service.ts |
| 409 | `CONFLICT` | Esta orden ya tiene su resultado: no hace falta reservar. | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/order-booking-access.service.ts |
| 422 | `PRECONDITION_FAILED` | Esta orden no es de un estudio que se reserve en un centro. | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/get-booking-options.use-case.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene perfil de paciente | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/order-booking-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-results/me/orders/{orderId}/booking-options"
}
```

---

## 8. DELETE /diagnostic-study-offerings/{id}

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-pricing`
- **Nombre:** Retirar (soft-delete) una oferta de estudio
- **Operation ID:** `DiagnosticPricingController_retireOffering`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticPricingController.retireOffering](../../src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts)

### Descripción de negocio

Retirar (soft-delete) una oferta de estudio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `DELETE /diagnostic-study-offerings/{id}` en `DiagnosticPricingController_retireOffering`. El controlador delega en `DiagnosticStudiesService.retireOffering`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /diagnostic-study-offerings/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /diagnostic-study-offerings/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | La oferta ya está retirada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-studies.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-study-offerings/{id}"
}
```

---

## 9. POST /diagnostic-unit-accreditations/{id}/renew

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-unit-accreditations`
- **Nombre:** Renovar/registrar acreditación con evidencia
- **Operation ID:** `DiagnosticUnitAccreditationsController_renew`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitAccreditationsController.renew](../../src/modules/diagnostic_units/controllers/diagnostic-unit-accreditations.controller.ts)

### Descripción de negocio

Renovar/registrar acreditación con evidencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostic-unit-accreditations/{id}/renew` en `DiagnosticUnitAccreditationsController_renew`. El controlador delega en `DiagnosticUnitsService.renewAccreditation`. Valida el body como `RenewAccreditationDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccreditationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RenewAccreditationDto`; los campos opcionales se omiten.

```http
POST /diagnostic-unit-accreditations/00000000-0000-4000-8000-000000000001/renew HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `accreditationNumber` | No | `string` | longitud máxima 100 | Nuevo nº de acreditación | `valor-ejemplo` |
| `evidenceFileId` | No | `string` | formato `uuid` | Nuevo archivo de evidencia | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Nueva vigencia desde | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Nueva vigencia hasta | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostic-unit-accreditations/00000000-0000-4000-8000-000000000001/renew HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "accreditationNumber": "valor-ejemplo",
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccreditationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "verificationStatus": "valor-ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `verificationStatus` | Sí | `string` | Sin restricción adicional declarada | Valor de verification status mantenido por la instancia. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-unit-accreditations/{id}/renew"
}
```

---

## 10. PATCH /diagnostic-unit-sites/{siteId}

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-unit-sites`
- **Nombre:** Actualizar un sitio operativo de la unidad
- **Operation ID:** `DiagnosticUnitSitesController_updateSite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitSitesController.updateSite](../../src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts)

### Descripción de negocio

Actualizar un sitio operativo de la unidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /diagnostic-unit-sites/{siteId}` en `DiagnosticUnitSitesController_updateSite`. El controlador delega en `DiagnosticUnitsService.updateSite`. Valida el body como `UpdateSiteDto` y consume `application/json`. El tipo de retorno estático es `Promise<SiteResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateSiteDto`; los campos opcionales se omiten.

```http
PATCH /diagnostic-unit-sites/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `siteRoleConceptId` | No | `string` | formato `uuid` | Rol del sitio (concept id) | `00000000-0000-4000-8000-000000000001` |
| `accessionPrefix` | No | `string` | longitud máxima 20 | Prefijo de accesión | `valor-ejemplo` |
| `sampleCollectionAvailable` | No | `boolean` | Sin restricción adicional declarada | Toma de muestras disponible | `true` |
| `imagingAvailable` | No | `boolean` | Sin restricción adicional declarada | Imagenología disponible | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /diagnostic-unit-sites/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "siteRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "accessionPrefix": "valor-ejemplo",
  "sampleCollectionAvailable": true,
  "imagingAvailable": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "status": "ok",
  "operationalStatus": "valor-ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `operationalStatus` | Sí | `string` | Sin restricción adicional declarada | Valor de operational status mantenido por la instancia. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-unit-sites/{siteId}"
}
```

---

## 11. POST /diagnostic-unit-sites/{siteId}/equipment

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-unit-sites`
- **Nombre:** Registrar equipamiento y calibración del sitio
- **Operation ID:** `DiagnosticUnitSitesController_addEquipment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitSitesController.addEquipment](../../src/modules/diagnostic_units/controllers/diagnostic-unit-sites.controller.ts)

### Descripción de negocio

Registrar equipamiento y calibración del sitio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostic-unit-sites/{siteId}/equipment` en `DiagnosticUnitSitesController_addEquipment`. El controlador delega en `DiagnosticEquipmentService.addEquipment`. Valida el body como `CreateEquipmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<EquipmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateEquipmentDto`; los campos opcionales se omiten.

```http
POST /diagnostic-unit-sites/00000000-0000-4000-8000-000000000001/equipment HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "equipmentTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `equipmentTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de equipo (concept id) | `00000000-0000-4000-8000-000000000001` |
| `manufacturer` | No | `string` | longitud máxima 200 | Fabricante | `valor-ejemplo` |
| `model` | No | `string` | longitud máxima 200 | Modelo | `valor-ejemplo` |
| `serialNumber` | No | `string` | longitud máxima 200 | Nº de serie | `valor-ejemplo` |
| `modalityConceptId` | No | `string` | formato `uuid` | Modalidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `lastCalibrationAt` | No | `string` | formato `date-time` | Última calibración | `2026-07-31T12:00:00.000Z` |
| `nextCalibrationDueAt` | No | `string` | formato `date-time` | Próxima calibración | `2026-07-31T12:00:00.000Z` |
| `operationalStatusConceptId` | No | `string` | formato `uuid` | Estado operativo (concept id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostic-unit-sites/00000000-0000-4000-8000-000000000001/equipment HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "equipmentTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "manufacturer": "valor-ejemplo",
  "model": "valor-ejemplo",
  "serialNumber": "valor-ejemplo",
  "modalityConceptId": "00000000-0000-4000-8000-000000000001",
  "lastCalibrationAt": "2026-07-31T12:00:00.000Z",
  "nextCalibrationDueAt": "2026-07-31T12:00:00.000Z",
  "operationalStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<EquipmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EquipmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "diagnosticUnitSiteId": "00000000-0000-4000-8000-000000000001",
  "operationalStatus": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "aeTitle": "valor-ejemplo",
  "stationName": "Nombre de ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `diagnosticUnitSiteId` | Sí | `string` | formato `uuid` | Identificador asociado a diagnostic unit site. | `00000000-0000-4000-8000-000000000001` |
| `operationalStatus` | Sí | `string` | formato `uuid` | Concept id de estado operativo | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | No | `string` | formato `uuid`; admite null | F5a: sala del equipo. | `00000000-0000-4000-8000-000000000001` |
| `aeTitle` | No | `string` | admite null | F5a: DICOM AE Title. | `valor-ejemplo` |
| `stationName` | No | `string` | admite null | F5a: DICOM Station Name. | `Nombre de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un equipo con ese número de serie en el sitio | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-equipment.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El sitio no está activo | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-equipment.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-unit-sites/{siteId}/equipment"
}
```

---

## 12. GET /diagnostic-units

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Listar unidades diagnósticas publicadas
- **Operation ID:** `DiagnosticUnitsController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.list](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Listar unidades diagnósticas publicadas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Directorio publicado del tenant activo.

### Descripción del sistema

NestJS resuelve `GET /diagnostic-units` en `DiagnosticUnitsController_list`. El controlador delega en `DiagnosticUnitsReadService.list`. No recibe body. El tipo de retorno estático es `Promise<DiagnosticUnitDirectoryResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-units HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-units HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DiagnosticUnitDirectoryResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<DiagnosticUnitDirectoryResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DiagnosticUnitDirectoryResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DiagnosticUnitDirectoryResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DiagnosticUnitDirectoryResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DiagnosticUnitDirectoryResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<DiagnosticUnitDirectoryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosticUnitDirectoryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "type": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "siteCount": 1,
      "equipmentCount": 1,
      "studyCount": 1,
      "acceptsExternalOrders": {},
      "walkInAvailable": {},
      "homeCollectionAvailable": {}
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<DiagnosticUnitDirectoryItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"siteCount":1,"equipmentCount":1,"studyCount":1,"acceptsExternalOrders":{},"walkInAvailable":{},"homeCollectionAvailable":{}}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].type` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].type.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].type.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].siteCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].equipmentCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].studyCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].acceptsExternalOrders` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].walkInAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].homeCollectionAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units"
}
```

---

## 13. POST /diagnostic-units

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Alta de unidad diagnóstica con sitios y acreditaciones
- **Operation ID:** `DiagnosticUnitsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.create](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Alta de unidad diagnóstica con sitios y acreditaciones. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostic-units` en `DiagnosticUnitsController_create`. El controlador delega en `DiagnosticUnitsService.create`. Valida el body como `CreateDiagnosticUnitDto` y consume `application/json`. El tipo de retorno estático es `Promise<DiagnosticUnitResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDiagnosticUnitDto`; los campos opcionales se omiten.

```http
POST /diagnostic-units HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Se ignora como propietario: la unidad pertenece al tenant activo (X-Tenant-Id). Si se envía y no coincide, responde 404. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 60 | Código único de la unidad en el tenant | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre de la unidad | `Nombre de ejemplo` |
| `diagnosticUnitTypeConceptId` | No | `string` | formato `uuid` | Tipo de unidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `ownershipTypeConceptId` | No | `string` | formato `uuid` | Tipo de propiedad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | No | `string` | formato `uuid` | Practice asociado | `00000000-0000-4000-8000-000000000001` |
| `primaryPracticeSiteId` | No | `string` | formato `uuid` | Sitio principal del practice | `00000000-0000-4000-8000-000000000001` |
| `acceptsExternalOrders` | No | `boolean` | Sin restricción adicional declarada | Acepta órdenes externas | `true` |
| `sites` | No | `array<CreateUnitSiteDto>` | Sin restricción adicional declarada | Sitios operativos (1..N) | `[{"practiceSiteId":"00000000-0000-4000-8000-000000000001","siteRoleConceptId":"00000000-0000-4000-8000-000000000001","accessionPrefix":"valor-ejemplo","sampleCollectionAvailable":true,"imagingAvailable":true}]` |
| `sites[].practiceSiteId` | No | `string` | formato `uuid` | Sitio del practice donde opera la unidad | `00000000-0000-4000-8000-000000000001` |
| `sites[].siteRoleConceptId` | No | `string` | formato `uuid` | Rol del sitio (concept id) | `00000000-0000-4000-8000-000000000001` |
| `sites[].accessionPrefix` | No | `string` | longitud máxima 20 | Prefijo de accesión del sitio | `valor-ejemplo` |
| `sites[].sampleCollectionAvailable` | No | `boolean` | Sin restricción adicional declarada | Toma de muestras disponible | `true` |
| `sites[].imagingAvailable` | No | `boolean` | Sin restricción adicional declarada | Imagenología disponible | `true` |
| `accreditations` | No | `array<CreateUnitAccreditationDto>` | Sin restricción adicional declarada | Acreditaciones (0..N) | `[{"accreditationConceptId":"00000000-0000-4000-8000-000000000001","accreditationNumber":"valor-ejemplo","issuerTenantId":"00000000-0000-4000-8000-000000000001","evidenceFileId":"00000000-0000-4000-8000-000000000001"}]` |
| `accreditations[].accreditationConceptId` | No | `string` | formato `uuid` | Tipo de acreditación (concept id) | `00000000-0000-4000-8000-000000000001` |
| `accreditations[].accreditationNumber` | No | `string` | longitud máxima 100 | Nº de acreditación | `valor-ejemplo` |
| `accreditations[].issuerTenantId` | No | `string` | formato `uuid` | Tenant emisor | `00000000-0000-4000-8000-000000000001` |
| `accreditations[].evidenceFileId` | No | `string` | formato `uuid` | Archivo de evidencia | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostic-units HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "diagnosticUnitTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "ownershipTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "primaryPracticeSiteId": "00000000-0000-4000-8000-000000000001",
  "acceptsExternalOrders": true,
  "sites": [
    {
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "siteRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "accessionPrefix": "valor-ejemplo",
      "sampleCollectionAvailable": true,
      "imagingAvailable": true
    }
  ],
  "accreditations": [
    {
      "accreditationConceptId": "00000000-0000-4000-8000-000000000001",
      "accreditationNumber": "valor-ejemplo",
      "issuerTenantId": "00000000-0000-4000-8000-000000000001",
      "evidenceFileId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosticUnitResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "publicProfileId": "00000000-0000-4000-8000-000000000001",
  "siteCount": 1,
  "accreditationCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id de estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id de estado | `00000000-0000-4000-8000-000000000001` |
| `publicProfileId` | No | `string` | formato `uuid` | Perfil público asignado | `00000000-0000-4000-8000-000000000001` |
| `siteCount` | Sí | `number` | Sin restricción adicional declarada | Nº de sitios creados en el alta | `1` |
| `accreditationCount` | Sí | `number` | Sin restricción adicional declarada | Nº de acreditaciones creadas en el alta | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-unit-scope.service.ts |
| 409 | `CONFLICT` | El código ya existe en el tenant | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units"
}
```

---

## 14. GET /diagnostic-units/{id}

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Consultar el perfil de una unidad diagnóstica
- **Operation ID:** `DiagnosticUnitsController_getById`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.getById](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Consultar el perfil de una unidad diagnóstica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Perfil publicado; el servicio acota el id al tenant activo.

### Descripción del sistema

NestJS resuelve `GET /diagnostic-units/{id}` en `DiagnosticUnitsController_getById`. El controlador delega en `DiagnosticUnitsReadService.getById`. No recibe body. El tipo de retorno estático es `Promise<DiagnosticUnitDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-units/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-units/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DiagnosticUnitDetailDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<DiagnosticUnitDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DiagnosticUnitDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DiagnosticUnitDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<DiagnosticUnitDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DiagnosticUnitDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DiagnosticUnitDetailDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<DiagnosticUnitDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosticUnitDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "type": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "siteCount": 1,
  "equipmentCount": 1,
  "studyCount": 1,
  "acceptsExternalOrders": {},
  "walkInAvailable": {},
  "homeCollectionAvailable": {},
  "sites": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "role": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "sampleCollectionAvailable": {},
      "imagingAvailable": {},
      "latitude": {},
      "longitude": {}
    }
  ],
  "equipment": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "siteId": "00000000-0000-4000-8000-000000000001",
      "type": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "manufacturer": {},
      "model": {},
      "modality": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "operationalStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "lastCalibrationAt": {},
      "nextCalibrationDueAt": {}
    }
  ],
  "studies": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "description": {},
      "siteId": {},
      "modality": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "preparationInstructions": {},
      "expectedDurationMinutes": {},
      "expectedTurnaroundMinutes": {},
      "requiresMedicalOrder": {},
      "prices": [
        {
          "amount": "valor-ejemplo",
          "currency": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "scheduleCode": "CODIGO_EJEMPLO",
          "siteId": {}
        }
      ]
    }
  ],
  "accreditations": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "type": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "number": {},
      "siteId": {},
      "validFrom": {},
      "validTo": {}
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `type` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `type.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `type.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `siteCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `equipmentCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `studyCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `acceptsExternalOrders` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `walkInAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `homeCollectionAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sites` | Sí | `array<DiagnosticUnitSiteDetailDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"sampleCollectionAvailable":{},"imagingAvailable":{},"latitude":{},"longitude":{}}]` |
| `sites[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sites[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].role` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `sites[].role.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sites[].role.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sites[].sampleCollectionAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sites[].imagingAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sites[].latitude` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sites[].longitude` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `equipment` | Sí | `array<DiagnosticEquipmentDetailDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","siteId":"00000000-0000-4000-8000-000000000001","type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"manufacturer":{},"model":{},"modality":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"lastCalibrationAt":{},"nextCalibrationDueAt":{}}]` |
| `equipment[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipment[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipment[].type` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `equipment[].type.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `equipment[].type.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].manufacturer` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `equipment[].model` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `equipment[].modality` | No | `DiagnosticConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `equipment[].modality.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `equipment[].modality.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].operationalStatus` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `equipment[].operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `equipment[].operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].lastCalibrationAt` | No | `object` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `equipment[].nextCalibrationDueAt` | No | `object` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies` | Sí | `array<DiagnosticStudyDetailDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","description":{},"siteId":{},"modality":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"preparationInstructions":{},"expectedDurationMinutes":{},"expectedTurnaroundMinutes":{},"requiresMedicalOrder":{},"prices":[{"amount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"scheduleCode":"CODIGO_EJEMPLO","siteId":{}}]}]` |
| `studies[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `studies[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `studies[].description` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].siteId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].modality` | No | `DiagnosticConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `studies[].modality.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].modality.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `studies[].preparationInstructions` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].expectedDurationMinutes` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].expectedTurnaroundMinutes` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].requiresMedicalOrder` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].prices` | Sí | `array<DiagnosticPublicPriceDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"amount":"valor-ejemplo","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"scheduleCode":"CODIGO_EJEMPLO","siteId":{}}]` |
| `studies[].prices[].amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `studies[].prices[].currency` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `studies[].prices[].currency.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].prices[].currency.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `studies[].prices[].scheduleCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].prices[].siteId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `accreditations` | Sí | `array<DiagnosticAccreditationDetailDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"number":{},"siteId":{},"validFrom":{},"validTo":{}}]` |
| `accreditations[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `accreditations[].type` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `accreditations[].type.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `accreditations[].type.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `accreditations[].number` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `accreditations[].siteId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `accreditations[].validFrom` | No | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `accreditations[].validTo` | No | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Unidad diagnóstica no encontrada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{id}"
}
```

---

## 15. POST /diagnostic-units/{id}/accreditations

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Registrar una acreditación con evidencia
- **Operation ID:** `DiagnosticUnitsController_addAccreditation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.addAccreditation](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Registrar una acreditación con evidencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostic-units/{id}/accreditations` en `DiagnosticUnitsController_addAccreditation`. El controlador delega en `DiagnosticUnitsService.addAccreditation`. Valida el body como `DiagnosticUnitsCreateAccreditationDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccreditationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DiagnosticUnitsCreateAccreditationDto`; los campos opcionales se omiten.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/accreditations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "accreditationConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `accreditationConceptId` | Sí | `string` | formato `uuid` | Tipo de acreditación (concept id) | `00000000-0000-4000-8000-000000000001` |
| `diagnosticUnitSiteId` | No | `string` | formato `uuid` | Sitio de la unidad | `00000000-0000-4000-8000-000000000001` |
| `accreditationNumber` | No | `string` | longitud máxima 100 | Nº de acreditación | `valor-ejemplo` |
| `issuerTenantId` | No | `string` | formato `uuid` | Tenant emisor | `00000000-0000-4000-8000-000000000001` |
| `evidenceFileId` | No | `string` | formato `uuid` | Archivo de evidencia | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Vigente desde | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Vigente hasta | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/accreditations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "accreditationConceptId": "00000000-0000-4000-8000-000000000001",
  "diagnosticUnitSiteId": "00000000-0000-4000-8000-000000000001",
  "accreditationNumber": "valor-ejemplo",
  "issuerTenantId": "00000000-0000-4000-8000-000000000001",
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccreditationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "verificationStatus": "valor-ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `verificationStatus` | Sí | `string` | Sin restricción adicional declarada | Valor de verification status mantenido por la instancia. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-unit-scope.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La unidad no está activa | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{id}/accreditations"
}
```

---

## 16. GET /diagnostic-units/{id}/administration

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Consola de administración de una unidad diagnóstica
- **Operation ID:** `DiagnosticUnitsController_getForAdministration`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.getForAdministration](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Consola de administración de una unidad diagnóstica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ficha administrativa completa de una unidad — CARRIL 16. Sedes, equipamiento con su calibración, catálogo de estudios con todos sus precios —también los de cronogramas internos—, legajo y personal con sus permisos de validación y firma. Una unidad de otro tenant responde el mismo 404 que una inexistente.

### Descripción del sistema

NestJS resuelve `GET /diagnostic-units/{id}/administration` en `DiagnosticUnitsController_getForAdministration`. El controlador delega en `DiagnosticUnitsAdminReadService.getById`. No recibe body. El tipo de retorno estático es `Promise<DiagnosticUnitAdminDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-units/00000000-0000-4000-8000-000000000001/administration HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-units/00000000-0000-4000-8000-000000000001/administration HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DiagnosticUnitAdminDetailDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<DiagnosticUnitAdminDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DiagnosticUnitAdminDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DiagnosticUnitAdminDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<DiagnosticUnitAdminDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DiagnosticUnitAdminDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DiagnosticUnitAdminDetailDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<DiagnosticUnitAdminDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosticUnitAdminDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "type": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "verificationStatus": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "publiclyListed": true,
  "siteCount": 1,
  "studyCount": 1,
  "equipmentCount": 1,
  "acceptsExternalOrders": {},
  "walkInAvailable": {},
  "homeCollectionAvailable": {},
  "sites": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "role": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "accessionPrefix": {},
      "sampleCollectionAvailable": {},
      "imagingAvailable": {},
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ],
  "equipment": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "siteId": "00000000-0000-4000-8000-000000000001",
      "type": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "manufacturer": {},
      "model": {},
      "serialNumber": {},
      "modality": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "operationalStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "lastCalibrationAt": {},
      "nextCalibrationDueAt": {},
      "daysToCalibration": {}
    }
  ],
  "studies": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "description": {},
      "siteId": {},
      "modality": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "specimenType": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "preparationInstructions": {},
      "expectedDurationMinutes": {},
      "expectedTurnaroundMinutes": {},
      "requiresMedicalOrder": {},
      "requiresPriorAuthorization": {},
      "homeCollectionEligible": {},
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "prices": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "scheduleId": "00000000-0000-4000-8000-000000000001",
          "scheduleCode": "CODIGO_EJEMPLO",
          "schedulePublic": true,
          "versionNumber": 1,
          "baseAmount": "120.00",
          "patientAmount": {},
          "insurerAmount": {},
          "currency": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "effectiveFrom": "2026-07-31T12:00:00.000Z",
          "effectiveTo": {},
          "status": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          }
        }
      ]
    }
  ],
  "accreditations": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "siteId": {},
      "type": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "number": {},
      "evidenceFileId": {},
      "validFrom": {},
      "validTo": {},
      "daysToExpiry": {},
      "verificationStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ],
  "staff": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": {},
      "practitionerName": {},
      "siteId": {},
      "assignmentRole": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "specialty": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "mayValidateResults": {},
      "maySignReports": {},
      "validFrom": {},
      "validTo": {},
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `type` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `type.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `type.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `verificationStatus` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `verificationStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `verificationStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `publiclyListed` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `siteCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `studyCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `equipmentCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `acceptsExternalOrders` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `walkInAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `homeCollectionAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sites` | Sí | `array<DiagnosticUnitAdminSiteDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","practiceSiteId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"accessionPrefix":{},"sampleCollectionAvailable":{},"imagingAvailable":{},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `sites[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sites[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].role` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `sites[].role.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sites[].role.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sites[].accessionPrefix` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sites[].sampleCollectionAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sites[].imagingAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sites[].status` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `sites[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sites[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment` | Sí | `array<DiagnosticUnitAdminEquipmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","siteId":"00000000-0000-4000-8000-000000000001","type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"manufacturer":{},"model":{},"serialNumber":{},"modality":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"lastCalibrationAt":{},"nextCalibrationDueAt":{},"daysToCalibration":{}}]` |
| `equipment[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipment[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipment[].type` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `equipment[].type.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `equipment[].type.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].manufacturer` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `equipment[].model` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `equipment[].serialNumber` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `equipment[].modality` | No | `DiagnosticConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `equipment[].modality.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `equipment[].modality.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].operationalStatus` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `equipment[].operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `equipment[].operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].lastCalibrationAt` | No | `object` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `equipment[].nextCalibrationDueAt` | No | `object` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `equipment[].daysToCalibration` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies` | Sí | `array<DiagnosticUnitAdminStudyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","description":{},"siteId":{},"modality":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"specimenType":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"preparationInstructions":{},"expectedDurationMinutes":{},"expectedTurnaroundMinutes":{},"requiresMedicalOrder":{},"requiresPriorAuthorization":{},"homeCollectionEligible":{},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"prices":[{"id":"00000000-0000-4000-8000-000000000001","scheduleId":"00000000-0000-4000-8000-000000000001","scheduleCode":"CODIGO_EJEMPLO","schedulePublic":true,"versionNumber":1,"baseAmount":"120.00","patientAmount":{},"insurerAmount":{},"currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"effectiveFrom":"2026-07-31T12:00:00.000Z","effectiveTo":{},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]}]` |
| `studies[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `studies[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `studies[].description` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].siteId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].modality` | No | `DiagnosticConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `studies[].modality.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].modality.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `studies[].specimenType` | No | `DiagnosticConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `studies[].specimenType.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].specimenType.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `studies[].preparationInstructions` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].expectedDurationMinutes` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].expectedTurnaroundMinutes` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].requiresMedicalOrder` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].requiresPriorAuthorization` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].homeCollectionEligible` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].status` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `studies[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `studies[].prices` | Sí | `array<DiagnosticUnitAdminPriceDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","scheduleId":"00000000-0000-4000-8000-000000000001","scheduleCode":"CODIGO_EJEMPLO","schedulePublic":true,"versionNumber":1,"baseAmount":"120.00","patientAmount":{},"insurerAmount":{},"currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"effectiveFrom":"2026-07-31T12:00:00.000Z","effectiveTo":{},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `studies[].prices[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `studies[].prices[].scheduleId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `studies[].prices[].scheduleCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].prices[].schedulePublic` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `studies[].prices[].versionNumber` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `studies[].prices[].baseAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `120.00` |
| `studies[].prices[].patientAmount` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].prices[].insurerAmount` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].prices[].currency` | No | `DiagnosticConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `studies[].prices[].currency.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].prices[].currency.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `studies[].prices[].effectiveFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `studies[].prices[].effectiveTo` | No | `object` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `studies[].prices[].status` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `studies[].prices[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].prices[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `accreditations` | Sí | `array<DiagnosticUnitAdminAccreditationDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","siteId":{},"type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"number":{},"evidenceFileId":{},"validFrom":{},"validTo":{},"daysToExpiry":{},"verificationStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `accreditations[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `accreditations[].siteId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `accreditations[].type` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `accreditations[].type.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `accreditations[].type.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `accreditations[].number` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `accreditations[].evidenceFileId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `accreditations[].validFrom` | No | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `accreditations[].validTo` | No | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `accreditations[].daysToExpiry` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `accreditations[].verificationStatus` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `accreditations[].verificationStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `accreditations[].verificationStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `staff` | Sí | `array<DiagnosticUnitAdminStaffDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerRoleAssignmentId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":{},"practitionerName":{},"siteId":{},"assignmentRole":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"specialty":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"mayValidateResults":{},"maySignReports":{},"validFrom":{},"validTo":{},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `staff[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `staff[].practitionerRoleAssignmentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `staff[].practitionerProfileId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `staff[].practitionerName` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `staff[].siteId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `staff[].assignmentRole` | No | `DiagnosticConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `staff[].assignmentRole.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `staff[].assignmentRole.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `staff[].specialty` | No | `DiagnosticConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `staff[].specialty.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `staff[].specialty.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `staff[].mayValidateResults` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `staff[].maySignReports` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `staff[].validFrom` | No | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `staff[].validTo` | No | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `staff[].status` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `staff[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `staff[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Unidad diagnóstica no encontrada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units-admin-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{id}/administration"
}
```

---

## 17. POST /diagnostic-units/{id}/practitioner-assignments

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Asignar un especialista a la unidad/sitio
- **Operation ID:** `DiagnosticUnitsController_assignPractitioner`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.assignPractitioner](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Asignar un especialista a la unidad/sitio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostic-units/{id}/practitioner-assignments` en `DiagnosticUnitsController_assignPractitioner`. El controlador delega en `DiagnosticUnitsService.assignPractitioner`. Valida el body como `CreatePractitionerAssignmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<AssignmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePractitionerAssignmentDto`; los campos opcionales se omiten.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/practitioner-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practitionerRoleAssignmentId` | Sí | `string` | formato `uuid` | Asignación de rol del profesional (RRHH) | `00000000-0000-4000-8000-000000000001` |
| `diagnosticUnitSiteId` | No | `string` | formato `uuid` | Sitio de la unidad | `00000000-0000-4000-8000-000000000001` |
| `specialtyConceptId` | No | `string` | formato `uuid` | Especialidad aportada (concept id) | `00000000-0000-4000-8000-000000000001` |
| `assignmentRoleConceptId` | No | `string` | formato `uuid` | Rol de la asignación (concept id) | `00000000-0000-4000-8000-000000000001` |
| `mayValidateResults` | No | `boolean` | Sin restricción adicional declarada | Puede validar resultados | `true` |
| `maySignReports` | No | `boolean` | Sin restricción adicional declarada | Puede firmar informes | `true` |
| `validFrom` | No | `string` | formato `date-time` | Vigente desde | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Vigente hasta | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/practitioner-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "diagnosticUnitSiteId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "assignmentRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "mayValidateResults": true,
  "maySignReports": true,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AssignmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id de estado | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-unit-scope.service.ts |
| 409 | `CONFLICT` | El profesional ya tiene una asignación activa en ese rol/sitio | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La unidad no está activa | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{id}/practitioner-assignments"
}
```

---

## 18. POST /diagnostic-units/{id}/price-schedules

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Crear un cronograma de precios
- **Operation ID:** `DiagnosticUnitsController_createSchedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.createSchedule](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Crear un cronograma de precios. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostic-units/{id}/price-schedules` en `DiagnosticUnitsController_createSchedule`. El controlador delega en `DiagnosticPricingService.createSchedule`. Valida el body como `CreatePriceScheduleDto` y consume `application/json`. El tipo de retorno estático es `Promise<PriceScheduleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePriceScheduleDto`; los campos opcionales se omiten.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/price-schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 60 | Código único del cronograma en la unidad | `CODIGO_EJEMPLO` |
| `priceScheduleTypeConceptId` | No | `string` | formato `uuid` | Tipo de cronograma (concept id) | `00000000-0000-4000-8000-000000000001` |
| `diagnosticUnitSiteId` | No | `string` | formato `uuid` | Sitio de la unidad | `00000000-0000-4000-8000-000000000001` |
| `insurerTenantId` | No | `string` | formato `uuid` | Tenant aseguradora | `00000000-0000-4000-8000-000000000001` |
| `brokerTenantId` | No | `string` | formato `uuid` | Tenant broker | `00000000-0000-4000-8000-000000000001` |
| `currencyConceptId` | No | `string` | formato `uuid` | Moneda (concept id) | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Vigente desde | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Vigente hasta | `2026-07-31T12:00:00.000Z` |
| `publicVisibility` | No | `boolean` | Sin restricción adicional declarada | Visible al público | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/price-schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "priceScheduleTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "diagnosticUnitSiteId": "00000000-0000-4000-8000-000000000001",
  "insurerTenantId": "00000000-0000-4000-8000-000000000001",
  "brokerTenantId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "publicVisibility": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PriceScheduleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PriceScheduleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PriceScheduleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PriceScheduleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PriceScheduleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PriceScheduleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PriceScheduleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PriceScheduleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PriceScheduleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PriceScheduleResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PriceScheduleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PriceScheduleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `status` | Sí | `string` | formato `uuid` | Concept id de estado | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-unit-scope.service.ts |
| 409 | `CONFLICT` | El código de cronograma ya existe en la unidad | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-pricing.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La unidad no está activa | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-pricing.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{id}/price-schedules"
}
```

---

## 19. POST /diagnostic-units/{id}/reproject

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Reconstruir la proyección del perfil público
- **Operation ID:** `DiagnosticUnitsController_reproject`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.reproject](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Reconstruir la proyección del perfil público. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostic-units/{id}/reproject` en `DiagnosticUnitsController_reproject`. El controlador delega en `DiagnosticUnitsService.reproject`. No recibe body. El tipo de retorno estático es `Promise<ReprojectResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/reproject HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/reproject HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReprojectResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReprojectResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReprojectResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReprojectResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReprojectResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReprojectResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReprojectResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReprojectResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReprojectResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ReprojectResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReprojectResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "diagnosticUnitId": "00000000-0000-4000-8000-000000000001",
  "projected": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `diagnosticUnitId` | Sí | `string` | formato `uuid` | Identificador asociado a diagnostic unit. | `00000000-0000-4000-8000-000000000001` |
| `projected` | Sí | `boolean` | Sin restricción adicional declarada | true si se (re)proyectó el perfil público | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{id}/reproject"
}
```

---

## 20. POST /diagnostic-units/{id}/sites

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Registrar un sitio operativo de la unidad
- **Operation ID:** `DiagnosticUnitsController_addSite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.addSite](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Registrar un sitio operativo de la unidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostic-units/{id}/sites` en `DiagnosticUnitsController_addSite`. El controlador delega en `DiagnosticUnitsService.addSite`. Valida el body como `AddSiteDto` y consume `application/json`. El tipo de retorno estático es `Promise<SiteResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddSiteDto`; los campos opcionales se omiten.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/sites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sitio del practice donde opera la unidad | `00000000-0000-4000-8000-000000000001` |
| `siteRoleConceptId` | No | `string` | formato `uuid` | Rol del sitio (concept id) | `00000000-0000-4000-8000-000000000001` |
| `accessionPrefix` | No | `string` | longitud máxima 20 | Prefijo de accesión | `valor-ejemplo` |
| `sampleCollectionAvailable` | No | `boolean` | Sin restricción adicional declarada | Toma de muestras disponible | `true` |
| `imagingAvailable` | No | `boolean` | Sin restricción adicional declarada | Imagenología disponible | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/sites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "siteRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "accessionPrefix": "valor-ejemplo",
  "sampleCollectionAvailable": true,
  "imagingAvailable": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SiteResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SiteResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "status": "ok",
  "operationalStatus": "valor-ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `operationalStatus` | Sí | `string` | Sin restricción adicional declarada | Valor de operational status mantenido por la instancia. | `valor-ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La unidad no está activa | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{id}/sites"
}
```

---

## 21. PUT /diagnostic-units/{id}/specialties

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Declarar las especialidades de la unidad
- **Operation ID:** `DiagnosticUnitsController_setSpecialties`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.setSpecialties](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Declarar las especialidades de la unidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /diagnostic-units/{id}/specialties` en `DiagnosticUnitsController_setSpecialties`. El controlador delega en `DiagnosticUnitsService.setSpecialties`. Valida el body como `SetSpecialtiesDto` y consume `application/json`. El tipo de retorno estático es `Promise<SpecialtiesResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetSpecialtiesDto`; los campos opcionales se omiten.

```http
PUT /diagnostic-units/00000000-0000-4000-8000-000000000001/specialties HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "specialties": [
    {
      "specialtyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `specialties` | Sí | `array<SpecialtyItemDto>` | mínimo 1 elemento(s) | Conjunto vigente de especialidades | `[{"specialtyConceptId":"00000000-0000-4000-8000-000000000001","isPrimary":true}]` |
| `specialties[].specialtyConceptId` | Sí | `string` | formato `uuid` | Especialidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `specialties[].isPrimary` | No | `boolean` | Sin restricción adicional declarada | Especialidad primaria de la unidad | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /diagnostic-units/00000000-0000-4000-8000-000000000001/specialties HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "specialties": [
    {
      "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
      "isPrimary": true
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SpecialtiesResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SpecialtiesResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SpecialtiesResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SpecialtiesResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SpecialtiesResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SpecialtiesResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SpecialtiesResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SpecialtiesResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SpecialtiesResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SpecialtiesResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SpecialtiesResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SpecialtiesResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "active": 1,
  "closed": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `active` | Sí | `number` | Sin restricción adicional declarada | Nº de especialidades vigentes tras el cambio | `1` |
| `closed` | Sí | `number` | Sin restricción adicional declarada | Nº de especialidades cerradas (soft) | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | A lo sumo una especialidad puede ser primaria | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
| 422 | `PRECONDITION_FAILED` | La unidad no está activa | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{id}/specialties"
}
```

---

## 22. POST /diagnostic-units/{id}/study-offerings

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Publicar oferta de estudio con componentes (panel)
- **Operation ID:** `DiagnosticUnitsController_createOffering`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.createOffering](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Publicar oferta de estudio con componentes (panel). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostic-units/{id}/study-offerings` en `DiagnosticUnitsController_createOffering`. El controlador delega en `DiagnosticStudiesService.createOffering`. Valida el body como `CreateStudyOfferingDto` y consume `application/json`. El tipo de retorno estático es `Promise<StudyOfferingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateStudyOfferingDto`; los campos opcionales se omiten.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/study-offerings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "studyCode": "CODIGO_EJEMPLO",
  "studyConceptId": "00000000-0000-4000-8000-000000000001",
  "displayName": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `studyCode` | Sí | `string` | longitud mínima 1; longitud máxima 60 | Código del estudio en la unidad | `CODIGO_EJEMPLO` |
| `studyConceptId` | Sí | `string` | formato `uuid` | Estudio (concept id) | `00000000-0000-4000-8000-000000000001` |
| `displayName` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre visible del estudio | `Nombre de ejemplo` |
| `diagnosticUnitSiteId` | No | `string` | formato `uuid` | Sitio de la unidad donde se ofrece | `00000000-0000-4000-8000-000000000001` |
| `modalityConceptId` | No | `string` | formato `uuid` | Modalidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `bodySiteConceptId` | No | `string` | formato `uuid` | Zona anatómica (concept id) | `00000000-0000-4000-8000-000000000001` |
| `specimenTypeConceptId` | No | `string` | formato `uuid` | Tipo de muestra (concept id) | `00000000-0000-4000-8000-000000000001` |
| `description` | No | `string` | Sin restricción adicional declarada | Descripción | `Texto descriptivo de ejemplo` |
| `preparationInstructions` | No | `string` | Sin restricción adicional declarada | Instrucciones de preparación | `valor-ejemplo` |
| `expectedDurationMinutes` | No | `number` | mínimo 0 | Duración esperada (min) | `1` |
| `expectedTurnaroundMinutes` | No | `number` | mínimo 0 | Turnaround esperado (min) | `1` |
| `requiresMedicalOrder` | No | `boolean` | Sin restricción adicional declarada | Requiere orden médica | `true` |
| `requiresPriorAuthorization` | No | `boolean` | Sin restricción adicional declarada | Requiere autorización previa | `true` |
| `homeCollectionEligible` | No | `boolean` | Sin restricción adicional declarada | Elegible para toma domiciliaria | `true` |
| `components` | No | `array<StudyComponentDto>` | Sin restricción adicional declarada | Componentes del panel (0..N) | `[{"componentOfferingId":"00000000-0000-4000-8000-000000000001","componentRoleConceptId":"00000000-0000-4000-8000-000000000001","quantity":"1","ordinal":1}]` |
| `components[].componentOfferingId` | No | `string` | formato `uuid` | Oferta que actúa como componente | `00000000-0000-4000-8000-000000000001` |
| `components[].componentRoleConceptId` | No | `string` | formato `uuid` | Rol del componente (concept id) | `00000000-0000-4000-8000-000000000001` |
| `components[].quantity` | No | `string` | Sin restricción adicional declarada | Cantidad | `1` |
| `components[].ordinal` | No | `number` | Sin restricción adicional declarada | Orden en el panel | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/study-offerings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "studyCode": "CODIGO_EJEMPLO",
  "studyConceptId": "00000000-0000-4000-8000-000000000001",
  "displayName": "Nombre de ejemplo",
  "diagnosticUnitSiteId": "00000000-0000-4000-8000-000000000001",
  "modalityConceptId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "preparationInstructions": "valor-ejemplo",
  "expectedDurationMinutes": 1,
  "expectedTurnaroundMinutes": 1,
  "requiresMedicalOrder": true,
  "requiresPriorAuthorization": true,
  "homeCollectionEligible": true,
  "components": [
    {
      "componentOfferingId": "00000000-0000-4000-8000-000000000001",
      "componentRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "quantity": "1",
      "ordinal": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<StudyOfferingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StudyOfferingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StudyOfferingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StudyOfferingResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StudyOfferingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StudyOfferingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StudyOfferingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StudyOfferingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StudyOfferingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StudyOfferingResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<StudyOfferingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StudyOfferingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "studyCode": "CODIGO_EJEMPLO",
  "status": "00000000-0000-4000-8000-000000000001",
  "componentCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `studyCode` | Sí | `string` | Sin restricción adicional declarada | Valor de study code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `status` | Sí | `string` | formato `uuid` | Concept id de estado | `00000000-0000-4000-8000-000000000001` |
| `componentCount` | Sí | `number` | Sin restricción adicional declarada | Nº de componentes del panel | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-unit-scope.service.ts |
| 409 | `CONFLICT` | El código de estudio ya existe en la unidad | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-studies.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La unidad no está activa | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-studies.service.ts |
| 422 | `PRECONDITION_FAILED` | Un panel no puede referenciarse a sí mismo como componente | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-studies.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{id}/study-offerings"
}
```

---

## 23. POST /diagnostic-units/{id}/verify-and-publish

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Verificar la unidad y publicar su perfil público
- **Operation ID:** `DiagnosticUnitsController_verifyAndPublish`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.verifyAndPublish](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Verificar la unidad y publicar su perfil público. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostic-units/{id}/verify-and-publish` en `DiagnosticUnitsController_verifyAndPublish`. El controlador delega en `DiagnosticUnitsService.verifyAndPublish`. No recibe body. El tipo de retorno estático es `Promise<DiagnosticUnitResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/verify-and-publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/verify-and-publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<DiagnosticUnitResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosticUnitResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "publicProfileId": "00000000-0000-4000-8000-000000000001",
  "siteCount": 1,
  "accreditationCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id de estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id de estado | `00000000-0000-4000-8000-000000000001` |
| `publicProfileId` | No | `string` | formato `uuid` | Perfil público asignado | `00000000-0000-4000-8000-000000000001` |
| `siteCount` | Sí | `number` | Sin restricción adicional declarada | Nº de sitios creados en el alta | `1` |
| `accreditationCount` | Sí | `number` | Sin restricción adicional declarada | Nº de acreditaciones creadas en el alta | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La unidad no tiene ningún sitio activo para publicar | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
| 422 | `PRECONDITION_FAILED` | La unidad no está activa | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
| 422 | `PRECONDITION_FAILED` | El laboratorio no se publica hasta que la plataforma verifique a su organización con la matrícula del SEPREC, la licencia de funcionamiento y el certificado del SEDES | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{id}/verify-and-publish"
}
```

---

## 24. POST /diagnostic-units/{unitId}/equipment

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Register a device (a production line)
- **Operation ID:** `CenterScheduleController_addEquipment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CenterScheduleController.addEquipment](../../src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts)

### Descripción de negocio

Register a device (a production line). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostic-units/{unitId}/equipment` en `CenterScheduleController_addEquipment`. El controlador delega en `ManageCenterEquipmentUseCase.create`. Valida el body como `CenterEquipmentInputDto` y consume `application/json`. El tipo de retorno estático es `Promise<CenterScheduleViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `unitId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteId` | query | No | `string` | formato `uuid` | `diagnostic_unit_sites.id`; absent, the main site. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CenterEquipmentInputDto`; los campos opcionales se omiten.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/equipment HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Ecógrafo sala 2"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `unitId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Ecógrafo sala 2` |
| `manufacturer` | No | `string` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `serialNumber` | No | `string` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `modalityCode` | No | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB`; admite null | `null`: an analyzer, which never limits appointments. | `ECO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostic-units/00000000-0000-4000-8000-000000000001/equipment?siteId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Ecógrafo sala 2",
  "manufacturer": "valor-ejemplo",
  "serialNumber": "valor-ejemplo",
  "modalityCode": "ECO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CenterScheduleViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "unitId": "00000000-0000-4000-8000-000000000001",
  "unitName": "Nombre de ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "sites": [
    {
      "siteId": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "main": true
    }
  ],
  "kind": "LABORATORY",
  "schedule": {
    "general": {
      "windows": [
        {
          "dayOfWeek": 1,
          "startTime": "08:00",
          "endTime": "12:00",
          "slotMinutes": 5,
          "gapMinutes": 1
        }
      ],
      "slotMinutes": 30
    },
    "modalities": [
      {
        "modalityCode": "ECO",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ],
    "studies": [
      {
        "studyCode": "STUDY-ECO-OBSTETRICA",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ],
    "equipment": [
      {
        "equipmentId": "00000000-0000-4000-8000-000000000001",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ]
  },
  "studies": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "modalityCode": "ECO",
      "price": 1,
      "currency": "BOB",
      "preparation": "valor-ejemplo"
    }
  ],
  "equipment": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "manufacturer": "valor-ejemplo",
      "model": "valor-ejemplo",
      "modalityCode": "ECO",
      "status": "OPERATIONAL",
      "glossaryConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "updatedAt": "valor-ejemplo",
  "bookingsWithoutEquipment": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `unitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `unitName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `siteId` | Sí | `string` | formato `uuid`; admite null | The site this schedule and equipment belong to. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites` | Sí | `array<CenterSiteDto>` | Sin restricción adicional declarada | Main site first. | `[{"siteId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","main":true}]` |
| `sites[].siteId` | Sí | `string` | formato `uuid` | `diagnostic_unit_sites.id`. | `00000000-0000-4000-8000-000000000001` |
| `sites[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].addressText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sites[].main` | Sí | `boolean` | Sin restricción adicional declarada | The main site: the one used without `siteId`. | `true` |
| `kind` | Sí | `string` | valores: `LABORATORY`, `IMAGING` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `schedule` | Sí | `SaveCenterScheduleDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"general":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30},"modalities":[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}],"studies":[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}],"equipment":[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]}` |
| `schedule.general` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.general.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.general.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.general.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.general.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.general.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.general.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.general.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.modalities` | Sí | `array<ModalityScheduleDto>` | máximo MODALITY_CODES.length elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.modalities[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `schedule.modalities[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.modalities[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.modalities[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.modalities[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.modalities[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.modalities[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.modalities[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.modalities[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.studies` | Sí | `array<StudyScheduleDto>` | máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.studies[].studyCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `STUDY-ECO-OBSTETRICA` |
| `schedule.studies[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.studies[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.studies[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.studies[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.studies[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.studies[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.studies[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.studies[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.equipment` | No | `array<EquipmentScheduleDto>` | máximo 200 elemento(s) | Devices with a shift of their own; the rest follow their study. Omitted = none. | `[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.equipment[].equipmentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `schedule.equipment[].schedule` | No | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.equipment[].schedule.windows` | No | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.equipment[].schedule.windows[].dayOfWeek` | No | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.equipment[].schedule.windows[].startTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.equipment[].schedule.windows[].endTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.equipment[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.equipment[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.equipment[].schedule.slotMinutes` | No | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `studies` | Sí | `array<CenterStudyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","modalityCode":"ECO","price":1,"currency":"BOB","preparation":"valor-ejemplo"}]` |
| `studies[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `studies[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `studies[].price` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `studies[].currency` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `studies[].preparation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment` | Sí | `array<CenterEquipmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","manufacturer":"valor-ejemplo","model":"valor-ejemplo","modalityCode":"ECO","status":"OPERATIONAL","glossaryConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `equipment[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipment[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `equipment[].manufacturer` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].model` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB`; admite null | `null`: does not limit appointments (an analyzer). | `ECO` |
| `equipment[].status` | Sí | `string` | valores: `OPERATIONAL`, `MAINTENANCE`, `OUT_OF_SERVICE` | Sin descripción específica en el contrato OpenAPI. | `OPERATIONAL` |
| `equipment[].glossaryConceptId` | Sí | `string` | admite null | Always `null` for now. | `00000000-0000-4000-8000-000000000001` |
| `updatedAt` | Sí | `string` | admite null | `null` while the center has never published a schedule. | `valor-ejemplo` |
| `bookingsWithoutEquipment` | No | `number` | Sin restricción adicional declarada | Future bookings left without an operational device. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/get-center-schedule.use-case.ts |
| 404 | `NOT_FOUND` | Sucursal no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/center-context.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El centro no tiene una sucursal activa donde registrar el equipo. | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case.ts |
| 422 | `PRECONDITION_FAILED` | El catálogo todavía no tiene un tipo de equipo para esa modalidad. | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{unitId}/equipment"
}
```

---

## 25. DELETE /diagnostic-units/{unitId}/equipment/{equipmentId}

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Remove a device registered by mistake
- **Operation ID:** `CenterScheduleController_removeEquipment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CenterScheduleController.removeEquipment](../../src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts)

### Descripción de negocio

Remove a device registered by mistake. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `DELETE /diagnostic-units/{unitId}/equipment/{equipmentId}` en `CenterScheduleController_removeEquipment`. El controlador delega en `ManageCenterEquipmentUseCase.remove`. No recibe body. El tipo de retorno estático es `Promise<CenterScheduleViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `unitId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipmentId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /diagnostic-units/00000000-0000-4000-8000-000000000001/equipment/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `unitId`, `equipmentId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /diagnostic-units/00000000-0000-4000-8000-000000000001/equipment/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 409 | Already referenced: mark it out of service instead. | `Promise<CenterScheduleViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CenterScheduleViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "unitId": "00000000-0000-4000-8000-000000000001",
  "unitName": "Nombre de ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "sites": [
    {
      "siteId": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "main": true
    }
  ],
  "kind": "LABORATORY",
  "schedule": {
    "general": {
      "windows": [
        {
          "dayOfWeek": 1,
          "startTime": "08:00",
          "endTime": "12:00",
          "slotMinutes": 5,
          "gapMinutes": 1
        }
      ],
      "slotMinutes": 30
    },
    "modalities": [
      {
        "modalityCode": "ECO",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ],
    "studies": [
      {
        "studyCode": "STUDY-ECO-OBSTETRICA",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ],
    "equipment": [
      {
        "equipmentId": "00000000-0000-4000-8000-000000000001",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ]
  },
  "studies": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "modalityCode": "ECO",
      "price": 1,
      "currency": "BOB",
      "preparation": "valor-ejemplo"
    }
  ],
  "equipment": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "manufacturer": "valor-ejemplo",
      "model": "valor-ejemplo",
      "modalityCode": "ECO",
      "status": "OPERATIONAL",
      "glossaryConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "updatedAt": "valor-ejemplo",
  "bookingsWithoutEquipment": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `unitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `unitName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `siteId` | Sí | `string` | formato `uuid`; admite null | The site this schedule and equipment belong to. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites` | Sí | `array<CenterSiteDto>` | Sin restricción adicional declarada | Main site first. | `[{"siteId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","main":true}]` |
| `sites[].siteId` | Sí | `string` | formato `uuid` | `diagnostic_unit_sites.id`. | `00000000-0000-4000-8000-000000000001` |
| `sites[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].addressText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sites[].main` | Sí | `boolean` | Sin restricción adicional declarada | The main site: the one used without `siteId`. | `true` |
| `kind` | Sí | `string` | valores: `LABORATORY`, `IMAGING` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `schedule` | Sí | `SaveCenterScheduleDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"general":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30},"modalities":[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}],"studies":[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}],"equipment":[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]}` |
| `schedule.general` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.general.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.general.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.general.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.general.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.general.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.general.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.general.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.modalities` | Sí | `array<ModalityScheduleDto>` | máximo MODALITY_CODES.length elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.modalities[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `schedule.modalities[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.modalities[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.modalities[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.modalities[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.modalities[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.modalities[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.modalities[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.modalities[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.studies` | Sí | `array<StudyScheduleDto>` | máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.studies[].studyCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `STUDY-ECO-OBSTETRICA` |
| `schedule.studies[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.studies[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.studies[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.studies[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.studies[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.studies[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.studies[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.studies[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.equipment` | No | `array<EquipmentScheduleDto>` | máximo 200 elemento(s) | Devices with a shift of their own; the rest follow their study. Omitted = none. | `[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.equipment[].equipmentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `schedule.equipment[].schedule` | No | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.equipment[].schedule.windows` | No | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.equipment[].schedule.windows[].dayOfWeek` | No | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.equipment[].schedule.windows[].startTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.equipment[].schedule.windows[].endTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.equipment[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.equipment[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.equipment[].schedule.slotMinutes` | No | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `studies` | Sí | `array<CenterStudyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","modalityCode":"ECO","price":1,"currency":"BOB","preparation":"valor-ejemplo"}]` |
| `studies[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `studies[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `studies[].price` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `studies[].currency` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `studies[].preparation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment` | Sí | `array<CenterEquipmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","manufacturer":"valor-ejemplo","model":"valor-ejemplo","modalityCode":"ECO","status":"OPERATIONAL","glossaryConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `equipment[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipment[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `equipment[].manufacturer` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].model` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB`; admite null | `null`: does not limit appointments (an analyzer). | `ECO` |
| `equipment[].status` | Sí | `string` | valores: `OPERATIONAL`, `MAINTENANCE`, `OUT_OF_SERVICE` | Sin descripción específica en el contrato OpenAPI. | `OPERATIONAL` |
| `equipment[].glossaryConceptId` | Sí | `string` | admite null | Always `null` for now. | `00000000-0000-4000-8000-000000000001` |
| `updatedAt` | Sí | `string` | admite null | `null` while the center has never published a schedule. | `valor-ejemplo` |
| `bookingsWithoutEquipment` | No | `number` | Sin restricción adicional declarada | Future bookings left without an operational device. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Equipo no encontrado | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case.ts |
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/get-center-schedule.use-case.ts |
| 404 | `NOT_FOUND` | Sucursal no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/center-context.service.ts |
| 409 | `CONFLICT` | El equipo ya tiene registros asociados: márquelo «Fuera de servicio» en lugar de quitarlo. | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{unitId}/equipment/{equipmentId}"
}
```

---

## 26. PATCH /diagnostic-units/{unitId}/equipment/{equipmentId}

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Mark a device operational or not
- **Operation ID:** `CenterScheduleController_setEquipmentStatus`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CenterScheduleController.setEquipmentStatus](../../src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts)

### Descripción de negocio

Mark a device operational or not. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /diagnostic-units/{unitId}/equipment/{equipmentId}` en `CenterScheduleController_setEquipmentStatus`. El controlador delega en `SetEquipmentStatusUseCase.execute`. Valida el body como `SetEquipmentStatusDto` y consume `application/json`. El tipo de retorno estático es `Promise<CenterScheduleViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `unitId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipmentId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetEquipmentStatusDto`; los campos opcionales se omiten.

```http
PATCH /diagnostic-units/00000000-0000-4000-8000-000000000001/equipment/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "OPERATIONAL"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `unitId`, `equipmentId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `OPERATIONAL`, `MAINTENANCE`, `OUT_OF_SERVICE` | Sin descripción específica en el contrato OpenAPI. | `OPERATIONAL` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /diagnostic-units/00000000-0000-4000-8000-000000000001/equipment/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "OPERATIONAL"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CenterScheduleViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "unitId": "00000000-0000-4000-8000-000000000001",
  "unitName": "Nombre de ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "sites": [
    {
      "siteId": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "main": true
    }
  ],
  "kind": "LABORATORY",
  "schedule": {
    "general": {
      "windows": [
        {
          "dayOfWeek": 1,
          "startTime": "08:00",
          "endTime": "12:00",
          "slotMinutes": 5,
          "gapMinutes": 1
        }
      ],
      "slotMinutes": 30
    },
    "modalities": [
      {
        "modalityCode": "ECO",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ],
    "studies": [
      {
        "studyCode": "STUDY-ECO-OBSTETRICA",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ],
    "equipment": [
      {
        "equipmentId": "00000000-0000-4000-8000-000000000001",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ]
  },
  "studies": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "modalityCode": "ECO",
      "price": 1,
      "currency": "BOB",
      "preparation": "valor-ejemplo"
    }
  ],
  "equipment": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "manufacturer": "valor-ejemplo",
      "model": "valor-ejemplo",
      "modalityCode": "ECO",
      "status": "OPERATIONAL",
      "glossaryConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "updatedAt": "valor-ejemplo",
  "bookingsWithoutEquipment": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `unitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `unitName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `siteId` | Sí | `string` | formato `uuid`; admite null | The site this schedule and equipment belong to. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites` | Sí | `array<CenterSiteDto>` | Sin restricción adicional declarada | Main site first. | `[{"siteId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","main":true}]` |
| `sites[].siteId` | Sí | `string` | formato `uuid` | `diagnostic_unit_sites.id`. | `00000000-0000-4000-8000-000000000001` |
| `sites[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].addressText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sites[].main` | Sí | `boolean` | Sin restricción adicional declarada | The main site: the one used without `siteId`. | `true` |
| `kind` | Sí | `string` | valores: `LABORATORY`, `IMAGING` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `schedule` | Sí | `SaveCenterScheduleDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"general":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30},"modalities":[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}],"studies":[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}],"equipment":[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]}` |
| `schedule.general` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.general.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.general.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.general.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.general.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.general.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.general.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.general.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.modalities` | Sí | `array<ModalityScheduleDto>` | máximo MODALITY_CODES.length elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.modalities[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `schedule.modalities[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.modalities[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.modalities[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.modalities[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.modalities[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.modalities[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.modalities[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.modalities[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.studies` | Sí | `array<StudyScheduleDto>` | máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.studies[].studyCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `STUDY-ECO-OBSTETRICA` |
| `schedule.studies[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.studies[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.studies[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.studies[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.studies[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.studies[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.studies[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.studies[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.equipment` | No | `array<EquipmentScheduleDto>` | máximo 200 elemento(s) | Devices with a shift of their own; the rest follow their study. Omitted = none. | `[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.equipment[].equipmentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `schedule.equipment[].schedule` | No | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.equipment[].schedule.windows` | No | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.equipment[].schedule.windows[].dayOfWeek` | No | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.equipment[].schedule.windows[].startTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.equipment[].schedule.windows[].endTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.equipment[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.equipment[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.equipment[].schedule.slotMinutes` | No | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `studies` | Sí | `array<CenterStudyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","modalityCode":"ECO","price":1,"currency":"BOB","preparation":"valor-ejemplo"}]` |
| `studies[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `studies[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `studies[].price` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `studies[].currency` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `studies[].preparation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment` | Sí | `array<CenterEquipmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","manufacturer":"valor-ejemplo","model":"valor-ejemplo","modalityCode":"ECO","status":"OPERATIONAL","glossaryConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `equipment[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipment[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `equipment[].manufacturer` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].model` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB`; admite null | `null`: does not limit appointments (an analyzer). | `ECO` |
| `equipment[].status` | Sí | `string` | valores: `OPERATIONAL`, `MAINTENANCE`, `OUT_OF_SERVICE` | Sin descripción específica en el contrato OpenAPI. | `OPERATIONAL` |
| `equipment[].glossaryConceptId` | Sí | `string` | admite null | Always `null` for now. | `00000000-0000-4000-8000-000000000001` |
| `updatedAt` | Sí | `string` | admite null | `null` while the center has never published a schedule. | `valor-ejemplo` |
| `bookingsWithoutEquipment` | No | `number` | Sin restricción adicional declarada | Future bookings left without an operational device. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Equipo no encontrado | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/set-equipment-status.use-case.ts |
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/get-center-schedule.use-case.ts |
| 404 | `NOT_FOUND` | Sucursal no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/center-context.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{unitId}/equipment/{equipmentId}"
}
```

---

## 27. PUT /diagnostic-units/{unitId}/equipment/{equipmentId}

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Edit a device: name, maker, serial, modality
- **Operation ID:** `CenterScheduleController_editEquipment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CenterScheduleController.editEquipment](../../src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts)

### Descripción de negocio

Edit a device: name, maker, serial, modality. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /diagnostic-units/{unitId}/equipment/{equipmentId}` en `CenterScheduleController_editEquipment`. El controlador delega en `ManageCenterEquipmentUseCase.update`. Valida el body como `CenterEquipmentInputDto` y consume `application/json`. El tipo de retorno estático es `Promise<CenterScheduleViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `unitId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipmentId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CenterEquipmentInputDto`; los campos opcionales se omiten.

```http
PUT /diagnostic-units/00000000-0000-4000-8000-000000000001/equipment/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Ecógrafo sala 2"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `unitId`, `equipmentId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Ecógrafo sala 2` |
| `manufacturer` | No | `string` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `serialNumber` | No | `string` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `modalityCode` | No | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB`; admite null | `null`: an analyzer, which never limits appointments. | `ECO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /diagnostic-units/00000000-0000-4000-8000-000000000001/equipment/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Ecógrafo sala 2",
  "manufacturer": "valor-ejemplo",
  "serialNumber": "valor-ejemplo",
  "modalityCode": "ECO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CenterScheduleViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "unitId": "00000000-0000-4000-8000-000000000001",
  "unitName": "Nombre de ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "sites": [
    {
      "siteId": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "main": true
    }
  ],
  "kind": "LABORATORY",
  "schedule": {
    "general": {
      "windows": [
        {
          "dayOfWeek": 1,
          "startTime": "08:00",
          "endTime": "12:00",
          "slotMinutes": 5,
          "gapMinutes": 1
        }
      ],
      "slotMinutes": 30
    },
    "modalities": [
      {
        "modalityCode": "ECO",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ],
    "studies": [
      {
        "studyCode": "STUDY-ECO-OBSTETRICA",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ],
    "equipment": [
      {
        "equipmentId": "00000000-0000-4000-8000-000000000001",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ]
  },
  "studies": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "modalityCode": "ECO",
      "price": 1,
      "currency": "BOB",
      "preparation": "valor-ejemplo"
    }
  ],
  "equipment": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "manufacturer": "valor-ejemplo",
      "model": "valor-ejemplo",
      "modalityCode": "ECO",
      "status": "OPERATIONAL",
      "glossaryConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "updatedAt": "valor-ejemplo",
  "bookingsWithoutEquipment": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `unitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `unitName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `siteId` | Sí | `string` | formato `uuid`; admite null | The site this schedule and equipment belong to. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites` | Sí | `array<CenterSiteDto>` | Sin restricción adicional declarada | Main site first. | `[{"siteId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","main":true}]` |
| `sites[].siteId` | Sí | `string` | formato `uuid` | `diagnostic_unit_sites.id`. | `00000000-0000-4000-8000-000000000001` |
| `sites[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].addressText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sites[].main` | Sí | `boolean` | Sin restricción adicional declarada | The main site: the one used without `siteId`. | `true` |
| `kind` | Sí | `string` | valores: `LABORATORY`, `IMAGING` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `schedule` | Sí | `SaveCenterScheduleDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"general":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30},"modalities":[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}],"studies":[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}],"equipment":[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]}` |
| `schedule.general` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.general.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.general.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.general.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.general.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.general.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.general.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.general.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.modalities` | Sí | `array<ModalityScheduleDto>` | máximo MODALITY_CODES.length elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.modalities[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `schedule.modalities[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.modalities[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.modalities[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.modalities[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.modalities[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.modalities[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.modalities[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.modalities[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.studies` | Sí | `array<StudyScheduleDto>` | máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.studies[].studyCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `STUDY-ECO-OBSTETRICA` |
| `schedule.studies[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.studies[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.studies[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.studies[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.studies[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.studies[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.studies[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.studies[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.equipment` | No | `array<EquipmentScheduleDto>` | máximo 200 elemento(s) | Devices with a shift of their own; the rest follow their study. Omitted = none. | `[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.equipment[].equipmentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `schedule.equipment[].schedule` | No | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.equipment[].schedule.windows` | No | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.equipment[].schedule.windows[].dayOfWeek` | No | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.equipment[].schedule.windows[].startTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.equipment[].schedule.windows[].endTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.equipment[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.equipment[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.equipment[].schedule.slotMinutes` | No | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `studies` | Sí | `array<CenterStudyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","modalityCode":"ECO","price":1,"currency":"BOB","preparation":"valor-ejemplo"}]` |
| `studies[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `studies[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `studies[].price` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `studies[].currency` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `studies[].preparation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment` | Sí | `array<CenterEquipmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","manufacturer":"valor-ejemplo","model":"valor-ejemplo","modalityCode":"ECO","status":"OPERATIONAL","glossaryConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `equipment[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipment[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `equipment[].manufacturer` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].model` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB`; admite null | `null`: does not limit appointments (an analyzer). | `ECO` |
| `equipment[].status` | Sí | `string` | valores: `OPERATIONAL`, `MAINTENANCE`, `OUT_OF_SERVICE` | Sin descripción específica en el contrato OpenAPI. | `OPERATIONAL` |
| `equipment[].glossaryConceptId` | Sí | `string` | admite null | Always `null` for now. | `00000000-0000-4000-8000-000000000001` |
| `updatedAt` | Sí | `string` | admite null | `null` while the center has never published a schedule. | `valor-ejemplo` |
| `bookingsWithoutEquipment` | No | `number` | Sin restricción adicional declarada | Future bookings left without an operational device. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Equipo no encontrado | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case.ts |
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/get-center-schedule.use-case.ts |
| 404 | `NOT_FOUND` | Sucursal no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/center-context.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El catálogo todavía no tiene un tipo de equipo para esa modalidad. | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/manage-center-equipment.use-case.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{unitId}/equipment/{equipmentId}"
}
```

---

## 28. GET /diagnostic-units/{unitId}/schedule

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Schedule, studies and equipment of a center
- **Operation ID:** `CenterScheduleController_schedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CenterScheduleController.schedule](../../src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts)

### Descripción de negocio

Schedule, studies and equipment of a center. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /diagnostic-units/{unitId}/schedule` en `CenterScheduleController_schedule`. El controlador delega en `GetCenterScheduleUseCase.forUnit`. No recibe body. El tipo de retorno estático es `Promise<CenterScheduleViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `unitId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteId` | query | No | `string` | formato `uuid` | `diagnostic_unit_sites.id`; absent, the main site. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-units/00000000-0000-4000-8000-000000000001/schedule HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `unitId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-units/00000000-0000-4000-8000-000000000001/schedule?siteId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<CenterScheduleViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CenterScheduleViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "unitId": "00000000-0000-4000-8000-000000000001",
  "unitName": "Nombre de ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "sites": [
    {
      "siteId": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "main": true
    }
  ],
  "kind": "LABORATORY",
  "schedule": {
    "general": {
      "windows": [
        {
          "dayOfWeek": 1,
          "startTime": "08:00",
          "endTime": "12:00",
          "slotMinutes": 5,
          "gapMinutes": 1
        }
      ],
      "slotMinutes": 30
    },
    "modalities": [
      {
        "modalityCode": "ECO",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ],
    "studies": [
      {
        "studyCode": "STUDY-ECO-OBSTETRICA",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ],
    "equipment": [
      {
        "equipmentId": "00000000-0000-4000-8000-000000000001",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ]
  },
  "studies": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "modalityCode": "ECO",
      "price": 1,
      "currency": "BOB",
      "preparation": "valor-ejemplo"
    }
  ],
  "equipment": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "manufacturer": "valor-ejemplo",
      "model": "valor-ejemplo",
      "modalityCode": "ECO",
      "status": "OPERATIONAL",
      "glossaryConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "updatedAt": "valor-ejemplo",
  "bookingsWithoutEquipment": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `unitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `unitName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `siteId` | Sí | `string` | formato `uuid`; admite null | The site this schedule and equipment belong to. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites` | Sí | `array<CenterSiteDto>` | Sin restricción adicional declarada | Main site first. | `[{"siteId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","main":true}]` |
| `sites[].siteId` | Sí | `string` | formato `uuid` | `diagnostic_unit_sites.id`. | `00000000-0000-4000-8000-000000000001` |
| `sites[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].addressText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sites[].main` | Sí | `boolean` | Sin restricción adicional declarada | The main site: the one used without `siteId`. | `true` |
| `kind` | Sí | `string` | valores: `LABORATORY`, `IMAGING` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `schedule` | Sí | `SaveCenterScheduleDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"general":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30},"modalities":[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}],"studies":[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}],"equipment":[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]}` |
| `schedule.general` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.general.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.general.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.general.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.general.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.general.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.general.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.general.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.modalities` | Sí | `array<ModalityScheduleDto>` | máximo MODALITY_CODES.length elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.modalities[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `schedule.modalities[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.modalities[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.modalities[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.modalities[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.modalities[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.modalities[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.modalities[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.modalities[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.studies` | Sí | `array<StudyScheduleDto>` | máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.studies[].studyCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `STUDY-ECO-OBSTETRICA` |
| `schedule.studies[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.studies[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.studies[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.studies[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.studies[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.studies[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.studies[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.studies[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.equipment` | No | `array<EquipmentScheduleDto>` | máximo 200 elemento(s) | Devices with a shift of their own; the rest follow their study. Omitted = none. | `[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.equipment[].equipmentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `schedule.equipment[].schedule` | No | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.equipment[].schedule.windows` | No | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.equipment[].schedule.windows[].dayOfWeek` | No | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.equipment[].schedule.windows[].startTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.equipment[].schedule.windows[].endTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.equipment[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.equipment[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.equipment[].schedule.slotMinutes` | No | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `studies` | Sí | `array<CenterStudyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","modalityCode":"ECO","price":1,"currency":"BOB","preparation":"valor-ejemplo"}]` |
| `studies[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `studies[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `studies[].price` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `studies[].currency` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `studies[].preparation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment` | Sí | `array<CenterEquipmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","manufacturer":"valor-ejemplo","model":"valor-ejemplo","modalityCode":"ECO","status":"OPERATIONAL","glossaryConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `equipment[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipment[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `equipment[].manufacturer` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].model` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB`; admite null | `null`: does not limit appointments (an analyzer). | `ECO` |
| `equipment[].status` | Sí | `string` | valores: `OPERATIONAL`, `MAINTENANCE`, `OUT_OF_SERVICE` | Sin descripción específica en el contrato OpenAPI. | `OPERATIONAL` |
| `equipment[].glossaryConceptId` | Sí | `string` | admite null | Always `null` for now. | `00000000-0000-4000-8000-000000000001` |
| `updatedAt` | Sí | `string` | admite null | `null` while the center has never published a schedule. | `valor-ejemplo` |
| `bookingsWithoutEquipment` | No | `number` | Sin restricción adicional declarada | Future bookings left without an operational device. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/get-center-schedule.use-case.ts |
| 404 | `NOT_FOUND` | Sucursal no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/center-context.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{unitId}/schedule"
}
```

---

## 29. PUT /diagnostic-units/{unitId}/schedule

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Publish the whole schedule of a center
- **Operation ID:** `CenterScheduleController_saveSchedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CenterScheduleController.saveSchedule](../../src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts)

### Descripción de negocio

Publish the whole schedule of a center. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /diagnostic-units/{unitId}/schedule` en `CenterScheduleController_saveSchedule`. El controlador delega en `SaveCenterScheduleUseCase.execute`. Valida el body como `SaveCenterScheduleDto` y consume `application/json`. El tipo de retorno estático es `Promise<CenterScheduleViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `unitId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteId` | query | No | `string` | formato `uuid` | `diagnostic_unit_sites.id`; absent, the main site. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SaveCenterScheduleDto`; los campos opcionales se omiten.

```http
PUT /diagnostic-units/00000000-0000-4000-8000-000000000001/schedule HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "general": {
    "windows": [
      {
        "dayOfWeek": 1,
        "startTime": "08:00",
        "endTime": "12:00"
      }
    ],
    "slotMinutes": 30
  },
  "modalities": [
    {
      "modalityCode": "ECO",
      "schedule": {
        "windows": [
          {
            "dayOfWeek": 1,
            "startTime": "08:00",
            "endTime": "12:00"
          }
        ],
        "slotMinutes": 30
      }
    }
  ],
  "studies": [
    {
      "studyCode": "STUDY-ECO-OBSTETRICA",
      "schedule": {
        "windows": [
          {
            "dayOfWeek": 1,
            "startTime": "08:00",
            "endTime": "12:00"
          }
        ],
        "slotMinutes": 30
      }
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `unitId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `general` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `general.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `general.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `general.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `general.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `general.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `general.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `general.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `modalities` | Sí | `array<ModalityScheduleDto>` | máximo MODALITY_CODES.length elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `modalities[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `modalities[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `modalities[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `modalities[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `modalities[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `modalities[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `modalities[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `modalities[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `modalities[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `studies` | Sí | `array<StudyScheduleDto>` | máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `studies[].studyCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `STUDY-ECO-OBSTETRICA` |
| `studies[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `studies[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `studies[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `studies[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `studies[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `studies[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `studies[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `studies[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `equipment` | No | `array<EquipmentScheduleDto>` | máximo 200 elemento(s) | Devices with a shift of their own; the rest follow their study. Omitted = none. | `[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `equipment[].equipmentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipment[].schedule` | No | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `equipment[].schedule.windows` | No | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `equipment[].schedule.windows[].dayOfWeek` | No | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `equipment[].schedule.windows[].startTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `equipment[].schedule.windows[].endTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `equipment[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `equipment[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `equipment[].schedule.slotMinutes` | No | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /diagnostic-units/00000000-0000-4000-8000-000000000001/schedule?siteId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "general": {
    "windows": [
      {
        "dayOfWeek": 1,
        "startTime": "08:00",
        "endTime": "12:00",
        "slotMinutes": 5,
        "gapMinutes": 1
      }
    ],
    "slotMinutes": 30
  },
  "modalities": [
    {
      "modalityCode": "ECO",
      "schedule": {
        "windows": [
          {
            "dayOfWeek": 1,
            "startTime": "08:00",
            "endTime": "12:00",
            "slotMinutes": 5,
            "gapMinutes": 1
          }
        ],
        "slotMinutes": 30
      }
    }
  ],
  "studies": [
    {
      "studyCode": "STUDY-ECO-OBSTETRICA",
      "schedule": {
        "windows": [
          {
            "dayOfWeek": 1,
            "startTime": "08:00",
            "endTime": "12:00",
            "slotMinutes": 5,
            "gapMinutes": 1
          }
        ],
        "slotMinutes": 30
      }
    }
  ],
  "equipment": [
    {
      "equipmentId": "00000000-0000-4000-8000-000000000001",
      "schedule": {
        "windows": [
          {
            "dayOfWeek": 1,
            "startTime": "08:00",
            "endTime": "12:00",
            "slotMinutes": 5,
            "gapMinutes": 1
          }
        ],
        "slotMinutes": 30
      }
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 409 | `details.affectedBookings`: booked appointments left outside. | `Promise<CenterScheduleViewDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CenterScheduleViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "unitId": "00000000-0000-4000-8000-000000000001",
  "unitName": "Nombre de ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "sites": [
    {
      "siteId": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "main": true
    }
  ],
  "kind": "LABORATORY",
  "schedule": {
    "general": {
      "windows": [
        {
          "dayOfWeek": 1,
          "startTime": "08:00",
          "endTime": "12:00",
          "slotMinutes": 5,
          "gapMinutes": 1
        }
      ],
      "slotMinutes": 30
    },
    "modalities": [
      {
        "modalityCode": "ECO",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ],
    "studies": [
      {
        "studyCode": "STUDY-ECO-OBSTETRICA",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ],
    "equipment": [
      {
        "equipmentId": "00000000-0000-4000-8000-000000000001",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ]
  },
  "studies": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "modalityCode": "ECO",
      "price": 1,
      "currency": "BOB",
      "preparation": "valor-ejemplo"
    }
  ],
  "equipment": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "manufacturer": "valor-ejemplo",
      "model": "valor-ejemplo",
      "modalityCode": "ECO",
      "status": "OPERATIONAL",
      "glossaryConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "updatedAt": "valor-ejemplo",
  "bookingsWithoutEquipment": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `unitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `unitName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `siteId` | Sí | `string` | formato `uuid`; admite null | The site this schedule and equipment belong to. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites` | Sí | `array<CenterSiteDto>` | Sin restricción adicional declarada | Main site first. | `[{"siteId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","main":true}]` |
| `sites[].siteId` | Sí | `string` | formato `uuid` | `diagnostic_unit_sites.id`. | `00000000-0000-4000-8000-000000000001` |
| `sites[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].addressText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sites[].main` | Sí | `boolean` | Sin restricción adicional declarada | The main site: the one used without `siteId`. | `true` |
| `kind` | Sí | `string` | valores: `LABORATORY`, `IMAGING` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `schedule` | Sí | `SaveCenterScheduleDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"general":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30},"modalities":[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}],"studies":[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}],"equipment":[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]}` |
| `schedule.general` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.general.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.general.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.general.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.general.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.general.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.general.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.general.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.modalities` | Sí | `array<ModalityScheduleDto>` | máximo MODALITY_CODES.length elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.modalities[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `schedule.modalities[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.modalities[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.modalities[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.modalities[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.modalities[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.modalities[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.modalities[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.modalities[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.studies` | Sí | `array<StudyScheduleDto>` | máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.studies[].studyCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `STUDY-ECO-OBSTETRICA` |
| `schedule.studies[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.studies[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.studies[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.studies[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.studies[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.studies[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.studies[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.studies[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.equipment` | No | `array<EquipmentScheduleDto>` | máximo 200 elemento(s) | Devices with a shift of their own; the rest follow their study. Omitted = none. | `[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.equipment[].equipmentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `schedule.equipment[].schedule` | No | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.equipment[].schedule.windows` | No | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.equipment[].schedule.windows[].dayOfWeek` | No | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.equipment[].schedule.windows[].startTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.equipment[].schedule.windows[].endTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.equipment[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.equipment[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.equipment[].schedule.slotMinutes` | No | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `studies` | Sí | `array<CenterStudyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","modalityCode":"ECO","price":1,"currency":"BOB","preparation":"valor-ejemplo"}]` |
| `studies[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `studies[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `studies[].price` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `studies[].currency` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `studies[].preparation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment` | Sí | `array<CenterEquipmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","manufacturer":"valor-ejemplo","model":"valor-ejemplo","modalityCode":"ECO","status":"OPERATIONAL","glossaryConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `equipment[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipment[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `equipment[].manufacturer` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].model` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB`; admite null | `null`: does not limit appointments (an analyzer). | `ECO` |
| `equipment[].status` | Sí | `string` | valores: `OPERATIONAL`, `MAINTENANCE`, `OUT_OF_SERVICE` | Sin descripción específica en el contrato OpenAPI. | `OPERATIONAL` |
| `equipment[].glossaryConceptId` | Sí | `string` | admite null | Always `null` for now. | `00000000-0000-4000-8000-000000000001` |
| `updatedAt` | Sí | `string` | admite null | `null` while the center has never published a schedule. | `valor-ejemplo` |
| `bookingsWithoutEquipment` | No | `number` | Sin restricción adicional declarada | Future bookings left without an operational device. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/get-center-schedule.use-case.ts |
| 404 | `NOT_FOUND` | Sucursal no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/center-context.service.ts |
| 409 | `CONFLICT` | affected === 1             ? 'Hay 1 turno reservado que quedaría fuera del horario nuevo.'             : `Hay ${affected} turnos reservados que quedarían fuera del horario nuevo.` | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/save-center-schedule.use-case.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El horario tiene datos incompletos. | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/save-center-schedule.use-case.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{unitId}/schedule"
}
```

---

## 30. GET /diagnostic-units/{unitId}/study-availability

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Free starts of a study in a center
- **Operation ID:** `StudyAvailabilityController_studyAvailability`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StudyAvailabilityController.studyAvailability](../../src/modules/diagnostic_units/center-schedule/presentation/study-availability.controller.ts)

### Descripción de negocio

Free starts of a study in a center. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /diagnostic-units/{unitId}/study-availability` en `StudyAvailabilityController_studyAvailability`. El controlador delega en `GetStudyAvailabilityUseCase.execute`. No recibe body. El tipo de retorno estático es `Promise<StudyAvailabilityDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `unitId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteId` | query | No | `string` | formato `uuid` | `diagnostic_unit_sites.id`; absent, the main site. | `00000000-0000-4000-8000-000000000001` |
| `studyCode` | query | Sí | `string` | longitud máxima 100 | Sin descripción específica en OpenAPI. | `STUDY-ECO-ABD` |
| `from` | query | No | `string` | Sin restricción adicional declarada | ISO instant; defaults to now. | `valor-ejemplo` |
| `to` | query | No | `string` | Sin restricción adicional declarada | ISO instant; defaults to from + 14 days. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-units/00000000-0000-4000-8000-000000000001/study-availability?studyCode=STUDY-ECO-ABD HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `unitId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-units/00000000-0000-4000-8000-000000000001/study-availability?siteId=00000000-0000-4000-8000-000000000001&studyCode=STUDY-ECO-ABD&from=valor-ejemplo&to=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StudyAvailabilityDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<StudyAvailabilityDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<StudyAvailabilityDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<StudyAvailabilityDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<StudyAvailabilityDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<StudyAvailabilityDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<StudyAvailabilityDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<StudyAvailabilityDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StudyAvailabilityDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "unitId": "00000000-0000-4000-8000-000000000001",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "studyCode": "CODIGO_EJEMPLO",
  "origin": "STUDY",
  "items": [
    {
      "startAt": "2026-11-05T12:00:00.000Z",
      "endAt": "2026-11-05T12:30:00.000Z",
      "remaining": 1,
      "capacity": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `unitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `studyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `origin` | Sí | `string` | valores: `STUDY`, `MODALITY`, `GENERAL` | Sin descripción específica en el contrato OpenAPI. | `STUDY` |
| `items` | Sí | `array<StudyStartDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"startAt":"2026-11-05T12:00:00.000Z","endAt":"2026-11-05T12:30:00.000Z","remaining":1,"capacity":1}]` |
| `items[].startAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026-11-05T12:00:00.000Z` |
| `items[].endAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026-11-05T12:30:00.000Z` |
| `items[].remaining` | Sí | `number` | Sin restricción adicional declarada | Places left in this slot. | `1` |
| `items[].capacity` | Sí | `number` | Sin restricción adicional declarada | Patients per slot. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Centro no encontrado | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/get-study-availability.use-case.ts |
| 404 | `NOT_FOUND` | El centro no hace ese estudio | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/get-study-availability.use-case.ts |
| 404 | `NOT_FOUND` | Sucursal no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/center-context.service.ts |
| 422 | `PRECONDITION_FAILED` | Pida una ventana de hasta ${MAX_WINDOW_DAYS} días, con «to» posterior a «from». | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/get-study-availability.use-case.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/{unitId}/study-availability"
}
```

---

## 31. GET /diagnostic-units/administration

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Listar las unidades del tenant, publicadas o no
- **Operation ID:** `DiagnosticUnitsController_listForAdministration`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.listForAdministration](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Listar las unidades del tenant, publicadas o no. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Consola de administración: **todas** las unidades del tenant — CARRIL 16. Va declarada **antes** de `@Get(':id')` a propósito. El router de Nest prueba en orden de declaración y ese parámetro lleva `ParseUUIDPipe`: declarada después, `administration` entraría por la ruta del parámetro y el pipe respondería 400 en vez de servir el listado. A diferencia del directorio, no filtra por publicación: quien administra necesita ver el borrador que todavía no publicó — que es justamente lo que el directorio esconde.

### Descripción del sistema

NestJS resuelve `GET /diagnostic-units/administration` en `DiagnosticUnitsController_listForAdministration`. El controlador delega en `DiagnosticUnitsAdminReadService.list`. No recibe body. El tipo de retorno estático es `Promise<DiagnosticUnitAdminListDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-units/administration HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-units/administration HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DiagnosticUnitAdminListDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<DiagnosticUnitAdminListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DiagnosticUnitAdminListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DiagnosticUnitAdminListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DiagnosticUnitAdminListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DiagnosticUnitAdminListDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<DiagnosticUnitAdminListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosticUnitAdminListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "type": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "verificationStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "publiclyListed": true,
      "siteCount": 1,
      "studyCount": 1,
      "equipmentCount": 1,
      "acceptsExternalOrders": {},
      "walkInAvailable": {},
      "homeCollectionAvailable": {}
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<DiagnosticUnitAdminItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"verificationStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"publiclyListed":true,"siteCount":1,"studyCount":1,"equipmentCount":1,"acceptsExternalOrders":{},"walkInAvailable":{},"homeCollectionAvailable":{}}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].type` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].type.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].type.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].status` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].verificationStatus` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].verificationStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].verificationStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].publiclyListed` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].siteCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].studyCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].equipmentCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].acceptsExternalOrders` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].walkInAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].homeCollectionAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/administration"
}
```

---

## 32. GET /diagnostic-units/me/bookings

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Appointments booked at my center, by start
- **Operation ID:** `CenterScheduleController_myBookings`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CenterScheduleController.myBookings](../../src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts)

### Descripción de negocio

Appointments booked at my center, by start. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /diagnostic-units/me/bookings` en `CenterScheduleController_myBookings`. El controlador delega en `ListCenterBookingsUseCase.execute`. No recibe body. El tipo de retorno estático es `Promise<CenterBookingsDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | query | No | `string` | formato `uuid` | `diagnostic_unit_sites.id`; absent, the main site. | `00000000-0000-4000-8000-000000000001` |
| `from` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `2026-11-04T04:00:00.000Z` |
| `to` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `2026-11-05T04:00:00.000Z` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-units/me/bookings?from=2026-11-04T04%3A00%3A00.000Z&to=2026-11-05T04%3A00%3A00.000Z HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-units/me/bookings?siteId=00000000-0000-4000-8000-000000000001&from=2026-11-04T04%3A00%3A00.000Z&to=2026-11-05T04%3A00%3A00.000Z HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CenterBookingsDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<CenterBookingsDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<CenterBookingsDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<CenterBookingsDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<CenterBookingsDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<CenterBookingsDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<CenterBookingsDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CenterBookingsDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "bookingId": "00000000-0000-4000-8000-000000000001",
      "orderId": "00000000-0000-4000-8000-000000000001",
      "patientName": "Nombre de ejemplo",
      "studyName": "Nombre de ejemplo",
      "startsAt": "valor-ejemplo",
      "endsAt": "valor-ejemplo",
      "siteName": "Nombre de ejemplo",
      "status": "REQUESTED",
      "equipmentId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<CenterBookingDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"bookingId":"00000000-0000-4000-8000-000000000001","orderId":"00000000-0000-4000-8000-000000000001","patientName":"Nombre de ejemplo","studyName":"Nombre de ejemplo","startsAt":"valor-ejemplo","endsAt":"valor-ejemplo","siteName":"Nombre de ejemplo","status":"REQUESTED","equipmentId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].bookingId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].orderId` | Sí | `string` | admite null | `null` for a booking made outside the order flow. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].studyName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].startsAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].endsAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].siteName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].status` | Sí | `string` | valores: `REQUESTED`, `PENDING_CONFIRMATION`, `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`, `COMPLETED` | Sin descripción específica en el contrato OpenAPI. | `REQUESTED` |
| `items[].equipmentId` | Sí | `string` | formato `uuid`; admite null | Device (production line) that attends it; `null` when no open line can. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Su organización no tiene un centro de diagnóstico con agenda. | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/get-center-schedule.use-case.ts |
| 404 | `NOT_FOUND` | Sucursal no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/center-context.service.ts |
| 422 | `PRECONDITION_FAILED` | Pida una ventana de hasta 31 días, con «to» posterior a «from». | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/list-center-bookings.use-case.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/me/bookings"
}
```

---

## 33. GET /diagnostic-units/me/schedule

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Schedule, studies and equipment of my center
- **Operation ID:** `CenterScheduleController_mySchedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CenterScheduleController.mySchedule](../../src/modules/diagnostic_units/center-schedule/presentation/center-schedule.controller.ts)

### Descripción de negocio

Schedule, studies and equipment of my center. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /diagnostic-units/me/schedule` en `CenterScheduleController_mySchedule`. El controlador delega en `GetCenterScheduleUseCase.forMe`. No recibe body. El tipo de retorno estático es `Promise<CenterScheduleViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | query | No | `string` | formato `uuid` | `diagnostic_unit_sites.id`; absent, the main site. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-units/me/schedule HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-units/me/schedule?siteId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CenterScheduleViewDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<CenterScheduleViewDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<CenterScheduleViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CenterScheduleViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "unitId": "00000000-0000-4000-8000-000000000001",
  "unitName": "Nombre de ejemplo",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "siteName": "Nombre de ejemplo",
  "sites": [
    {
      "siteId": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "main": true
    }
  ],
  "kind": "LABORATORY",
  "schedule": {
    "general": {
      "windows": [
        {
          "dayOfWeek": 1,
          "startTime": "08:00",
          "endTime": "12:00",
          "slotMinutes": 5,
          "gapMinutes": 1
        }
      ],
      "slotMinutes": 30
    },
    "modalities": [
      {
        "modalityCode": "ECO",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ],
    "studies": [
      {
        "studyCode": "STUDY-ECO-OBSTETRICA",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ],
    "equipment": [
      {
        "equipmentId": "00000000-0000-4000-8000-000000000001",
        "schedule": {
          "windows": [
            {
              "dayOfWeek": 1,
              "startTime": "08:00",
              "endTime": "12:00",
              "slotMinutes": 5,
              "gapMinutes": 1
            }
          ],
          "slotMinutes": 30
        }
      }
    ]
  },
  "studies": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "modalityCode": "ECO",
      "price": 1,
      "currency": "BOB",
      "preparation": "valor-ejemplo"
    }
  ],
  "equipment": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "manufacturer": "valor-ejemplo",
      "model": "valor-ejemplo",
      "modalityCode": "ECO",
      "status": "OPERATIONAL",
      "glossaryConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "updatedAt": "valor-ejemplo",
  "bookingsWithoutEquipment": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `unitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `unitName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `siteId` | Sí | `string` | formato `uuid`; admite null | The site this schedule and equipment belong to. | `00000000-0000-4000-8000-000000000001` |
| `siteName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites` | Sí | `array<CenterSiteDto>` | Sin restricción adicional declarada | Main site first. | `[{"siteId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","main":true}]` |
| `sites[].siteId` | Sí | `string` | formato `uuid` | `diagnostic_unit_sites.id`. | `00000000-0000-4000-8000-000000000001` |
| `sites[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].addressText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sites[].main` | Sí | `boolean` | Sin restricción adicional declarada | The main site: the one used without `siteId`. | `true` |
| `kind` | Sí | `string` | valores: `LABORATORY`, `IMAGING` | Sin descripción específica en el contrato OpenAPI. | `LABORATORY` |
| `schedule` | Sí | `SaveCenterScheduleDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"general":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30},"modalities":[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}],"studies":[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}],"equipment":[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]}` |
| `schedule.general` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.general.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.general.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.general.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.general.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.general.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.general.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.general.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.modalities` | Sí | `array<ModalityScheduleDto>` | máximo MODALITY_CODES.length elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"modalityCode":"ECO","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.modalities[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `schedule.modalities[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.modalities[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.modalities[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.modalities[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.modalities[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.modalities[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.modalities[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.modalities[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.studies` | Sí | `array<StudyScheduleDto>` | máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"studyCode":"STUDY-ECO-OBSTETRICA","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.studies[].studyCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `STUDY-ECO-OBSTETRICA` |
| `schedule.studies[].schedule` | Sí | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.studies[].schedule.windows` | Sí | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.studies[].schedule.windows[].dayOfWeek` | Sí | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.studies[].schedule.windows[].startTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.studies[].schedule.windows[].endTime` | Sí | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.studies[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.studies[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.studies[].schedule.slotMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `schedule.equipment` | No | `array<EquipmentScheduleDto>` | máximo 200 elemento(s) | Devices with a shift of their own; the rest follow their study. Omitted = none. | `[{"equipmentId":"00000000-0000-4000-8000-000000000001","schedule":{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}}]` |
| `schedule.equipment[].equipmentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `schedule.equipment[].schedule` | No | `ScheduleBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"windows":[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}],"slotMinutes":30}` |
| `schedule.equipment[].schedule.windows` | No | `array<ScheduleWindowDto>` | máximo 28 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"dayOfWeek":1,"startTime":"08:00","endTime":"12:00","slotMinutes":5,"gapMinutes":1}]` |
| `schedule.equipment[].schedule.windows[].dayOfWeek` | No | `number` | mínimo 1; máximo 7 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `schedule.equipment[].schedule.windows[].startTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `schedule.equipment[].schedule.windows[].endTime` | No | `string` | patrón `^([01]\d\|2[0-3]):[0-5]\d$`; patrón runtime `HH_MM` | Sin descripción específica en el contrato OpenAPI. | `12:00` |
| `schedule.equipment[].schedule.windows[].slotMinutes` | No | `number` | mínimo 5; máximo 240 | This window's appointment length; absent, the block's. | `5` |
| `schedule.equipment[].schedule.windows[].gapMinutes` | No | `number` | mínimo 0; máximo 120 | Rest after each appointment; absent, none. | `1` |
| `schedule.equipment[].schedule.slotMinutes` | No | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `30` |
| `studies` | Sí | `array<CenterStudyDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","modalityCode":"ECO","price":1,"currency":"BOB","preparation":"valor-ejemplo"}]` |
| `studies[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `studies[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `studies[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB` | Sin descripción específica en el contrato OpenAPI. | `ECO` |
| `studies[].price` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `studies[].currency` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `studies[].preparation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment` | Sí | `array<CenterEquipmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","manufacturer":"valor-ejemplo","model":"valor-ejemplo","modalityCode":"ECO","status":"OPERATIONAL","glossaryConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `equipment[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `equipment[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `equipment[].manufacturer` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].model` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `equipment[].modalityCode` | Sí | `string` | valores: `ECO`, `RX`, `RM`, `TC`, `MG`, `DXA`, `LAB`; admite null | `null`: does not limit appointments (an analyzer). | `ECO` |
| `equipment[].status` | Sí | `string` | valores: `OPERATIONAL`, `MAINTENANCE`, `OUT_OF_SERVICE` | Sin descripción específica en el contrato OpenAPI. | `OPERATIONAL` |
| `equipment[].glossaryConceptId` | Sí | `string` | admite null | Always `null` for now. | `00000000-0000-4000-8000-000000000001` |
| `updatedAt` | Sí | `string` | admite null | `null` while the center has never published a schedule. | `valor-ejemplo` |
| `bookingsWithoutEquipment` | No | `number` | Sin restricción adicional declarada | Future bookings left without an operational device. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Su organización no tiene un centro de diagnóstico con agenda. | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/get-center-schedule.use-case.ts |
| 404 | `NOT_FOUND` | Sucursal no encontrada | Excepción explícita en src/modules/diagnostic_units/center-schedule/application/center-context.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/me/schedule"
}
```

---

## 34. GET /diagnostic-units/search

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Buscar centros de diagnóstico, laboratorio e imagen
- **Operation ID:** `DiagnosticUnitsController_search`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.search](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Filtra por texto, tipo, estudio ofrecido, convenio con aseguradora, prestaciones, precio y calificación. A diferencia del directorio, no se acota a la organización de la sesión: quien busca dónde hacerse un estudio busca en la ciudad, no en su institución. Con `studyConceptIds` responde por cobertura —cada centro con `complete`, `missingStudyConceptIds` y `distanceKm`—: completos primero, después por distancia en línea recta desde `lat`/`lng`.

Contexto declarado en el controlador: El buscador del paciente: centros publicados de toda la plataforma — CARRIL 11. Va declarado **antes** que `:id` por el mismo motivo que la consola de administración: el parámetro lleva `ParseUUIDPipe` y se comería `search`. No lleva `@Roles` porque es un directorio de prestadores publicados, no datos de nadie: qué centros hay, qué hacen y cuánto cuestan. Exigir un rol lo dejaría fuera del alcance del paciente, que es para quien existe. Con `studyConceptIds` responde por cobertura: si cada centro tiene todos los estudios pedidos, cuáles le faltan y a qué distancia queda. Sin ese parámetro la respuesta es la de siempre.

### Descripción del sistema

NestJS resuelve `GET /diagnostic-units/search` en `DiagnosticUnitsController_search`. El controlador delega en `DiagnosticUnitsSearchService.searchCoverage`, `DiagnosticUnitsSearchService.search`. No recibe body. El tipo de retorno estático es `Promise<SearchDiagnosticUnitsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en nombre o código | `valor-ejemplo` |
| `tenantId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `kind` | query | No | `string` | valores: `LABORATORY`, `IMAGING` | Sin descripción específica en OpenAPI. | `LABORATORY` |
| `studyCode` | query | No | `string` | Sin restricción adicional declarada | Código del estudio buscado | `CODIGO_EJEMPLO` |
| `studyConceptIds` | query | No | `string` | Sin restricción adicional declarada | Conceptos de estudio separados por coma (uuid). Activa la búsqueda por cobertura. | `1f0c5b6e-2a1d-4c3e-9b8a-7d6e5f4a3b2c,2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d` |
| `lat` | query | No | `number` | mínimo -90; máximo 90 | Sin descripción específica en OpenAPI. | `1` |
| `lng` | query | No | `number` | mínimo -180; máximo 180 | Sin descripción específica en OpenAPI. | `1` |
| `insurerTenantId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `homeCollection` | query | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `true` |
| `walkIn` | query | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `true` |
| `acceptsExternalOrders` | query | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `true` |
| `maxAmount` | query | No | `number` | Sin restricción adicional declarada | Tope del importe publicado | `1` |
| `minRating` | query | No | `number` | Sin restricción adicional declarada | Nota mínima (0 a 5) | `1` |
| `limit` | query | No | `number` | máximo 100 | Sin descripción específica en OpenAPI. | `20` |
| `offset` | query | No | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `0` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-units/search HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-units/search?q=valor-ejemplo&tenantId=00000000-0000-4000-8000-000000000001&kind=LABORATORY&studyCode=CODIGO_EJEMPLO&studyConceptIds=1f0c5b6e-2a1d-4c3e-9b8a-7d6e5f4a3b2c%2C2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d&lat=1&lng=1&insurerTenantId=00000000-0000-4000-8000-000000000001&homeCollection=true&walkIn=true&acceptsExternalOrders=true&maxAmount=1&minRating=1&limit=20&offset=0 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SearchDiagnosticUnitsResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<SearchDiagnosticUnitsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SearchDiagnosticUnitsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SearchDiagnosticUnitsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SearchDiagnosticUnitsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SearchDiagnosticUnitsResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<SearchDiagnosticUnitsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SearchDiagnosticUnitsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "type": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "siteCount": 1,
      "equipmentCount": 1,
      "studyCount": 1,
      "acceptsExternalOrders": {},
      "walkInAvailable": {},
      "homeCollectionAvailable": {},
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "rating": {},
      "ratingCount": 1,
      "minAmount": {},
      "minAmountCurrency": {},
      "cities": [
        "valor-ejemplo"
      ],
      "complete": true,
      "missingStudyConceptIds": [
        "00000000-0000-4000-8000-000000000001"
      ],
      "distanceKm": 1,
      "addressText": "valor-ejemplo",
      "latitude": 1,
      "longitude": 1
    }
  ],
  "total": 1,
  "limit": 1,
  "offset": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<DiagnosticUnitSearchItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"siteCount":1,"equipmentCount":1,"studyCount":1,"acceptsExternalOrders":{},"walkInAvailable":{},"homeCollectionAvailable":{},"tenantId":"00000000-0000-4000-8000-000000000001","rating":{},"ratingCount":1,"minAmount":{},"minAmountCurrency":{},"cities":["valor-ejemplo"],"complete":true,"missingStudyConceptIds":["00000000-0000-4000-8000-000000000001"],"distanceKm":1,"addressText":"valor-ejemplo","latitude":1,"longitude":1}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].type` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `items[].type.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].type.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].siteCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].equipmentCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].studyCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].acceptsExternalOrders` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].walkInAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].homeCollectionAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].rating` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].ratingCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].minAmount` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].minAmountCurrency` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `items[].cities` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `items[].complete` | No | `boolean` | Sin restricción adicional declarada | Solo con `studyConceptIds`: ofrece todos los estudios pedidos | `true` |
| `items[].missingStudyConceptIds` | No | `array<string>` | Sin restricción adicional declarada | Solo con `studyConceptIds`: los estudios pedidos que no ofrece | `["00000000-0000-4000-8000-000000000001"]` |
| `items[].distanceKm` | No | `number` | admite null | Solo con `studyConceptIds`: km en línea recta desde `lat`/`lng` hasta la sede principal | `1` |
| `items[].addressText` | No | `string` | admite null | Solo con `studyConceptIds`: dirección de la sede principal | `valor-ejemplo` |
| `items[].latitude` | No | `number` | admite null | Solo con `studyConceptIds`: latitud de la sede principal | `1` |
| `items[].longitude` | No | `number` | admite null | Solo con `studyConceptIds`: longitud de la sede principal | `1` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `offset` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-units/search"
}
```

---

## 35. GET /diagnostics/lab/catalog

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Catálogo de análisis (LOINC) con componentes y precio sugerido
- **Operation ID:** `LabPortalServicesController_studyCatalogItems`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LabPortalServicesController.studyCatalogItems](../../src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts)

### Descripción de negocio

Catálogo de análisis (LOINC) con componentes y precio sugerido. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /diagnostics/lab/catalog` en `LabPortalServicesController_studyCatalogItems`. El controlador delega en `LabPortalStudyCatalogService.catalog`. No recibe body. El tipo de retorno estático es `Promise<LabCatalogDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/lab/catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostics/lab/catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabCatalogDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<LabCatalogDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<LabCatalogDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<LabCatalogDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<LabCatalogDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<LabCatalogDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<LabCatalogDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabCatalogDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "sections": [
    {
      "code": "HEMATO",
      "name": "Hematología",
      "items": [
        {
          "conceptId": "00000000-0000-4000-8000-000000000001",
          "code": "HEMOGRAMA",
          "name": "Nombre de ejemplo",
          "loinc": "valor-ejemplo",
          "specimen": "valor-ejemplo",
          "sampleType": "BLOOD",
          "suggestedPrice": {
            "source": "INLASA",
            "sourceCode": "LAC-030",
            "sourceName": "Nombre de ejemplo",
            "priceBs": "60.00"
          },
          "offeredServiceId": "00000000-0000-4000-8000-000000000001",
          "components": [
            {
              "conceptId": "00000000-0000-4000-8000-000000000001",
              "code": "HEMOGRAMA.HB",
              "name": "Nombre de ejemplo",
              "loinc": "valor-ejemplo",
              "unit": "valor-ejemplo",
              "suggestedPrice": {
                "source": "INLASA",
                "sourceCode": "LAC-030",
                "sourceName": "Nombre de ejemplo",
                "priceBs": "60.00"
              }
            }
          ]
        }
      ]
    }
  ],
  "sampleTypes": [
    {
      "code": "BLOOD",
      "name": "Análisis de sangre"
    }
  ],
  "count": 1,
  "priceRule": "valor-ejemplo",
  "catalogVersion": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sections` | Sí | `array<LabCatalogSectionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"HEMATO","name":"Hematología","items":[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"HEMOGRAMA","name":"Nombre de ejemplo","loinc":"valor-ejemplo","specimen":"valor-ejemplo","sampleType":"BLOOD","suggestedPrice":{"source":"INLASA","sourceCode":"LAC-030","sourceName":"Nombre de ejemplo","priceBs":"60.00"},"offeredServiceId":"00000000-0000-4000-8000-000000000001","components":[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"HEMOGRAMA.HB","name":"Nombre de ejemplo","loinc":"valor-ejemplo","unit":"valor-ejemplo","suggestedPrice":{"source":"INLASA","sourceCode":"LAC-030","sourceName":"Nombre de ejemplo","priceBs":"60.00"}}]}]}]` |
| `sections[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `HEMATO` |
| `sections[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Hematología` |
| `sections[].items` | Sí | `array<LabCatalogItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"HEMOGRAMA","name":"Nombre de ejemplo","loinc":"valor-ejemplo","specimen":"valor-ejemplo","sampleType":"BLOOD","suggestedPrice":{"source":"INLASA","sourceCode":"LAC-030","sourceName":"Nombre de ejemplo","priceBs":"60.00"},"offeredServiceId":"00000000-0000-4000-8000-000000000001","components":[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"HEMOGRAMA.HB","name":"Nombre de ejemplo","loinc":"valor-ejemplo","unit":"valor-ejemplo","suggestedPrice":{"source":"INLASA","sourceCode":"LAC-030","sourceName":"Nombre de ejemplo","priceBs":"60.00"}}]}]` |
| `sections[].items[].conceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sections[].items[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `HEMOGRAMA` |
| `sections[].items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sections[].items[].loinc` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sections[].items[].specimen` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sections[].items[].sampleType` | Sí | `string` | valores: `BLOOD`, `URINE`, `STOOL`, `FLUID`, `SWAB`, `OTHER` | What is drawn from the patient, to browse by sample type | `BLOOD` |
| `sections[].items[].suggestedPrice` | Sí | `LabSuggestedPriceDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"source":"INLASA","sourceCode":"LAC-030","sourceName":"Nombre de ejemplo","priceBs":"60.00"}` |
| `sections[].items[].suggestedPrice.source` | Sí | `string` | valores: `INLASA`, `FONASA` | Sin descripción específica en el contrato OpenAPI. | `INLASA` |
| `sections[].items[].suggestedPrice.sourceCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `LAC-030` |
| `sections[].items[].suggestedPrice.sourceName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sections[].items[].suggestedPrice.priceBs` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `60.00` |
| `sections[].items[].offeredServiceId` | Sí | `string` | formato `uuid`; admite null | The lab service already made from this item, if any | `00000000-0000-4000-8000-000000000001` |
| `sections[].items[].components` | Sí | `array<LabCatalogComponentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"HEMOGRAMA.HB","name":"Nombre de ejemplo","loinc":"valor-ejemplo","unit":"valor-ejemplo","suggestedPrice":{"source":"INLASA","sourceCode":"LAC-030","sourceName":"Nombre de ejemplo","priceBs":"60.00"}}]` |
| `sections[].items[].components[].conceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sections[].items[].components[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `HEMOGRAMA.HB` |
| `sections[].items[].components[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sections[].items[].components[].loinc` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sections[].items[].components[].unit` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sections[].items[].components[].suggestedPrice` | Sí | `LabSuggestedPriceDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"source":"INLASA","sourceCode":"LAC-030","sourceName":"Nombre de ejemplo","priceBs":"60.00"}` |
| `sections[].items[].components[].suggestedPrice.source` | Sí | `string` | valores: `INLASA`, `FONASA` | Sin descripción específica en el contrato OpenAPI. | `INLASA` |
| `sections[].items[].components[].suggestedPrice.sourceCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `LAC-030` |
| `sections[].items[].components[].suggestedPrice.sourceName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sections[].items[].components[].suggestedPrice.priceBs` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `60.00` |
| `sampleTypes` | Sí | `array<LabSampleTypeDto>` | Sin restricción adicional declarada | Sample types in display order (blood first) | `[{"code":"BLOOD","name":"Análisis de sangre"}]` |
| `sampleTypes[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BLOOD` |
| `sampleTypes[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Análisis de sangre` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `priceRule` | Sí | `string` | Sin restricción adicional declarada | How suggested prices were chosen | `valor-ejemplo` |
| `catalogVersion` | Sí | `string` | admite null | Version of the LOINC study catalog loaded in this database (laboratorio.json), or null when only the basic boot análisis are there: no sections, LOINC nor components until `yarn catalog:studies:load` runs | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La organización activa no tiene un laboratorio registrado | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/catalog"
}
```

---

## 36. POST /diagnostics/lab/catalog/import

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Sumar análisis del catálogo, con sus componentes y precio sugerido
- **Operation ID:** `LabPortalServicesController_importCatalog`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LabPortalServicesController.importCatalog](../../src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts)

### Descripción de negocio

Sumar análisis del catálogo, con sus componentes y precio sugerido. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/lab/catalog/import` en `LabPortalServicesController_importCatalog`. El controlador delega en `LabPortalStudyCatalogService.importCatalog`. Valida el body como `LabCatalogImportDto` y consume `application/json`. El tipo de retorno estático es `Promise<LabCatalogImportResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LabCatalogImportDto`; los campos opcionales se omiten.

```http
POST /diagnostics/lab/catalog/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "conceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `conceptIds` | Sí | `array<string>` | formato `uuid`; mínimo 1 elemento(s); máximo 600 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |
| `skipComponentIds` | No | `array<string>` | formato `uuid`; máximo 5000 elemento(s) | Components the lab does not offer: no service is made for them. Absent or empty: every component of each chosen análisis | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/lab/catalog/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "conceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "skipComponentIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabCatalogImportResultDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<LabCatalogImportResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabCatalogImportResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabCatalogImportResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LabCatalogImportResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LabCatalogImportResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabCatalogImportResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabCatalogImportResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabCatalogImportResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabCatalogImportResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabCatalogImportResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "created": 1,
  "republished": 1,
  "linked": 1,
  "skipped": 1,
  "rejected": 1,
  "rows": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "outcome": "CREATED",
      "serviceId": "00000000-0000-4000-8000-000000000001",
      "reason": "Texto descriptivo de ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `created` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `republished` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `linked` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rejected` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rows` | Sí | `array<LabCatalogImportRowDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","outcome":"CREATED","serviceId":"00000000-0000-4000-8000-000000000001","reason":"Texto descriptivo de ejemplo"}]` |
| `rows[].conceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `rows[].outcome` | Sí | `string` | valores: `CREATED`, `LINKED`, `REPUBLISHED`, `SKIPPED`, `REJECTED` | LINKED: a free-form service with the same code now points to the catalog item | `CREATED` |
| `rows[].serviceId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `rows[].reason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La organización activa no tiene un laboratorio registrado | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 409 | `CONFLICT` | El tarifario público del laboratorio existe pero no está vigente | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-pricing.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/catalog/import"
}
```

---

## 37. GET /diagnostics/lab/categories

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Categorías del laboratorio, con su conteo
- **Operation ID:** `LabPortalServicesController_listCategories`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LabPortalServicesController.listCategories](../../src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts)

### Descripción de negocio

Categorías del laboratorio, con su conteo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /diagnostics/lab/categories` en `LabPortalServicesController_listCategories`. El controlador delega en `LabPortalCategoriesService.list`. No recibe body. El tipo de retorno estático es `Promise<LabCategoryPageDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/lab/categories HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostics/lab/categories HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabCategoryPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<LabCategoryPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<LabCategoryPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<LabCategoryPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<LabCategoryPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<LabCategoryPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<LabCategoryPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabCategoryPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "serviceCount": 1
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<LabCategoryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","serviceCount":1}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].serviceCount` | Sí | `number` | Sin restricción adicional declarada | Services of the category that are not withdrawn | `1` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La organización activa no tiene un laboratorio registrado | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/categories"
}
```

---

## 38. POST /diagnostics/lab/categories

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Crear una categoría (409 si el nombre ya existe, sin importar mayúsculas)
- **Operation ID:** `LabPortalServicesController_createCategory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LabPortalServicesController.createCategory](../../src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts)

### Descripción de negocio

Crear una categoría (409 si el nombre ya existe, sin importar mayúsculas). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/lab/categories` en `LabPortalServicesController_createCategory`. El controlador delega en `LabPortalCategoriesService.create`. Valida el body como `LabCategoryNameDto` y consume `application/json`. El tipo de retorno estático es `Promise<LabCategoryDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LabCategoryNameDto`; los campos opcionales se omiten.

```http
POST /diagnostics/lab/categories HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Hematología"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud máxima 60; patrón runtime `/\S/` | Sin descripción específica en el contrato OpenAPI. | `Hematología` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/lab/categories HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Hematología"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabCategoryDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabCategoryDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "serviceCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `serviceCount` | Sí | `number` | Sin restricción adicional declarada | Services of the category that are not withdrawn | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La organización activa no tiene un laboratorio registrado | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/categories"
}
```

---

## 39. DELETE /diagnostics/lab/categories/{id}

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Eliminar una categoría (409 mientras agrupe servicios no retirados)
- **Operation ID:** `LabPortalServicesController_deleteCategory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LabPortalServicesController.deleteCategory](../../src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts)

### Descripción de negocio

Eliminar una categoría (409 mientras agrupe servicios no retirados). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `DELETE /diagnostics/lab/categories/{id}` en `LabPortalServicesController_deleteCategory`. El controlador delega en `LabPortalCategoriesService.remove`. No recibe body. El tipo de retorno estático es `Promise<{ ok: true }>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /diagnostics/lab/categories/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /diagnostics/lab/categories/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<{ ok: true }>` | No |
| 400 | Operación completada correctamente. | `Promise<{ ok: true }>` | No |
| 401 | Operación completada correctamente. | `Promise<{ ok: true }>` | No |
| 403 | Operación completada correctamente. | `Promise<{ ok: true }>` | No |
| 404 | Operación completada correctamente. | `Promise<{ ok: true }>` | No |
| 409 | Operación completada correctamente. | `Promise<{ ok: true }>` | No |
| 422 | Operación completada correctamente. | `Promise<{ ok: true }>` | No |
| 429 | Operación completada correctamente. | `Promise<{ ok: true }>` | No |
| 500 | Operación completada correctamente. | `Promise<{ ok: true }>` | No |
| 504 | Operación completada correctamente. | `Promise<{ ok: true }>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ ok: true }`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": {}
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: true | `{}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La organización activa no tiene un laboratorio registrado | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 404 | `NOT_FOUND` | Categoría no encontrada | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 409 | `CONFLICT` | «${category.name}» tiene ${live.length} servicios. Muévalos a otra categoría antes de borrarla. | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-categories.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/categories/{id}"
}
```

---

## 40. PATCH /diagnostics/lab/categories/{id}

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Renombrar una categoría (409 si el nombre ya existe)
- **Operation ID:** `LabPortalServicesController_renameCategory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LabPortalServicesController.renameCategory](../../src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts)

### Descripción de negocio

Renombrar una categoría (409 si el nombre ya existe). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /diagnostics/lab/categories/{id}` en `LabPortalServicesController_renameCategory`. El controlador delega en `LabPortalCategoriesService.rename`. Valida el body como `LabCategoryNameDto` y consume `application/json`. El tipo de retorno estático es `Promise<LabCategoryDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LabCategoryNameDto`; los campos opcionales se omiten.

```http
PATCH /diagnostics/lab/categories/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Hematología"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud máxima 60; patrón runtime `/\S/` | Sin descripción específica en el contrato OpenAPI. | `Hematología` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /diagnostics/lab/categories/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Hematología"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabCategoryDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabCategoryDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabCategoryDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "serviceCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `serviceCount` | Sí | `number` | Sin restricción adicional declarada | Services of the category that are not withdrawn | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La organización activa no tiene un laboratorio registrado | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 404 | `NOT_FOUND` | Categoría no encontrada | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/categories/{id}"
}
```

---

## 41. GET /diagnostics/lab/services

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Catálogo de servicios del laboratorio
- **Operation ID:** `LabPortalServicesController_listServices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LabPortalServicesController.listServices](../../src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts)

### Descripción de negocio

Catálogo de servicios del laboratorio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /diagnostics/lab/services` en `LabPortalServicesController_listServices`. El controlador delega en `LabPortalCatalogService.list`. No recibe body. El tipo de retorno estático es `Promise<LabServicePageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `categoryId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | query | No | `string` | valores: `PUBLISHED`, `DRAFT`, `WITHDRAWN` | Sin descripción específica en OpenAPI. | `PUBLISHED` |
| `available` | query | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `true` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/lab/services HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostics/lab/services?q=valor-ejemplo&categoryId=00000000-0000-4000-8000-000000000001&status=PUBLISHED&available=true HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabServicePageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<LabServicePageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<LabServicePageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<LabServicePageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<LabServicePageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<LabServicePageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<LabServicePageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabServicePageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "HEMOGRAMA",
      "name": "Nombre de ejemplo",
      "kind": "SERVICE",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "catalogConceptId": "00000000-0000-4000-8000-000000000001",
      "hasPrice": true,
      "categoryId": "00000000-0000-4000-8000-000000000001",
      "categoryName": "Nombre de ejemplo",
      "sampleType": "valor-ejemplo",
      "preparation": "valor-ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "turnaroundHours": 1,
      "requiresMedicalOrder": true,
      "homeCollection": true,
      "price": "45.00",
      "alovidaDiscountPercent": 10,
      "alovidaPrice": "40.50",
      "currency": "BOB",
      "status": "PUBLISHED",
      "available": true,
      "updatedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<LabServiceDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"HEMOGRAMA","name":"Nombre de ejemplo","kind":"SERVICE","parentId":"00000000-0000-4000-8000-000000000001","catalogConceptId":"00000000-0000-4000-8000-000000000001","hasPrice":true,"categoryId":"00000000-0000-4000-8000-000000000001","categoryName":"Nombre de ejemplo","sampleType":"valor-ejemplo","preparation":"valor-ejemplo","description":"Texto descriptivo de ejemplo","turnaroundHours":1,"requiresMedicalOrder":true,"homeCollection":true,"price":"45.00","alovidaDiscountPercent":10,"alovidaPrice":"40.50","currency":"BOB","status":"PUBLISHED","available":true,"updatedAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `HEMOGRAMA` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].kind` | Sí | `string` | valores: `SERVICE`, `MODALITY` | MODALITY: the generic placeholder created per modality at registration; it is not priced. | `SERVICE` |
| `items[].parentId` | Sí | `string` | formato `uuid`; admite null | Panel this service is a component of | `00000000-0000-4000-8000-000000000001` |
| `items[].catalogConceptId` | Sí | `string` | formato `uuid`; admite null | Study catalog concept; null for free-form services | `00000000-0000-4000-8000-000000000001` |
| `items[].hasPrice` | Sí | `boolean` | Sin restricción adicional declarada | False until a price version exists | `true` |
| `items[].categoryId` | Sí | `string` | admite null | Category of the lab, or null when the service has none | `00000000-0000-4000-8000-000000000001` |
| `items[].categoryName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].sampleType` | Sí | `string` | admite null | The lab's free text (`specimen_description`); falls back to the display of the specimen concept | `valor-ejemplo` |
| `items[].preparation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `items[].turnaroundHours` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].requiresMedicalOrder` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].homeCollection` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].price` | Sí | `string` | admite null | null when the service has no current price | `45.00` |
| `items[].alovidaDiscountPercent` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `10` |
| `items[].alovidaPrice` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `40.50` |
| `items[].currency` | Sí | `string` | valores: `BOB` | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `items[].status` | Sí | `string` | valores: `PUBLISHED`, `DRAFT`, `WITHDRAWN` | Sin descripción específica en el contrato OpenAPI. | `PUBLISHED` |
| `items[].available` | Sí | `boolean` | Sin restricción adicional declarada | "Available today" switch of the service | `true` |
| `items[].updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La organización activa no tiene un laboratorio registrado | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/services"
}
```

---

## 42. POST /diagnostics/lab/services

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Dar de alta un servicio con su precio
- **Operation ID:** `LabPortalServicesController_createService`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LabPortalServicesController.createService](../../src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts)

### Descripción de negocio

Dar de alta un servicio con su precio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/lab/services` en `LabPortalServicesController_createService`. El controlador delega en `LabPortalCatalogService.create`. Valida el body como `LabServiceDraftDto` y consume `application/json`. El tipo de retorno estático es `Promise<LabServiceDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LabServiceDraftDto`; los campos opcionales se omiten.

```http
POST /diagnostics/lab/services HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "HEMOGRAMA",
  "name": "Nombre de ejemplo",
  "price": "45.00"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `categoryId` | No | `string` | formato `uuid`; admite null | A category of this lab (`GET /diagnostics/lab/categories`); null clears it. Another lab's id is rejected as non-existent. | `00000000-0000-4000-8000-000000000001` |
| `sampleType` | No | `string` | admite null | Sample type as free text, stored in `specimen_description`; blank or null clears it | `valor-ejemplo` |
| `preparation` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `turnaroundHours` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `requiresMedicalOrder` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `homeCollection` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `alovidaDiscountPercent` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `10` |
| `available` | No | `boolean` | Sin restricción adicional declarada | "Available today": false hides the service from the public directory, the coverage search and order booking; it keeps its status and price | `true` |
| `code` | Sí | `string` | longitud máxima 40; patrón runtime `NOT_BLANK` | Sin descripción específica en el contrato OpenAPI. | `HEMOGRAMA` |
| `name` | Sí | `string` | longitud máxima 200; patrón runtime `NOT_BLANK` | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `price` | Sí | `string` | patrón runtime `PRICE` | Sin descripción específica en el contrato OpenAPI. | `45.00` |
| `status` | No | `string` | valores: `PUBLISHED`, `DRAFT` | Sin descripción específica en el contrato OpenAPI. | `PUBLISHED` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/lab/services HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "categoryId": "00000000-0000-4000-8000-000000000001",
  "sampleType": "valor-ejemplo",
  "preparation": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "turnaroundHours": 1,
  "requiresMedicalOrder": true,
  "homeCollection": true,
  "alovidaDiscountPercent": 10,
  "available": true,
  "code": "HEMOGRAMA",
  "name": "Nombre de ejemplo",
  "price": "45.00",
  "status": "PUBLISHED"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabServiceDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabServiceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "HEMOGRAMA",
  "name": "Nombre de ejemplo",
  "kind": "SERVICE",
  "parentId": "00000000-0000-4000-8000-000000000001",
  "catalogConceptId": "00000000-0000-4000-8000-000000000001",
  "hasPrice": true,
  "categoryId": "00000000-0000-4000-8000-000000000001",
  "categoryName": "Nombre de ejemplo",
  "sampleType": "valor-ejemplo",
  "preparation": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "turnaroundHours": 1,
  "requiresMedicalOrder": true,
  "homeCollection": true,
  "price": "45.00",
  "alovidaDiscountPercent": 10,
  "alovidaPrice": "40.50",
  "currency": "BOB",
  "status": "PUBLISHED",
  "available": true,
  "updatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `HEMOGRAMA` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `kind` | Sí | `string` | valores: `SERVICE`, `MODALITY` | MODALITY: the generic placeholder created per modality at registration; it is not priced. | `SERVICE` |
| `parentId` | Sí | `string` | formato `uuid`; admite null | Panel this service is a component of | `00000000-0000-4000-8000-000000000001` |
| `catalogConceptId` | Sí | `string` | formato `uuid`; admite null | Study catalog concept; null for free-form services | `00000000-0000-4000-8000-000000000001` |
| `hasPrice` | Sí | `boolean` | Sin restricción adicional declarada | False until a price version exists | `true` |
| `categoryId` | Sí | `string` | admite null | Category of the lab, or null when the service has none | `00000000-0000-4000-8000-000000000001` |
| `categoryName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sampleType` | Sí | `string` | admite null | The lab's free text (`specimen_description`); falls back to the display of the specimen concept | `valor-ejemplo` |
| `preparation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `turnaroundHours` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `requiresMedicalOrder` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `homeCollection` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `price` | Sí | `string` | admite null | null when the service has no current price | `45.00` |
| `alovidaDiscountPercent` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `10` |
| `alovidaPrice` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `40.50` |
| `currency` | Sí | `string` | valores: `BOB` | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `status` | Sí | `string` | valores: `PUBLISHED`, `DRAFT`, `WITHDRAWN` | Sin descripción específica en el contrato OpenAPI. | `PUBLISHED` |
| `available` | Sí | `boolean` | Sin restricción adicional declarada | "Available today" switch of the service | `true` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La organización activa no tiene un laboratorio registrado | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 409 | `CONFLICT` | problem.message | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-catalog.service.ts |
| 409 | `CONFLICT` | El tarifario público del laboratorio existe pero no está vigente | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-pricing.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | problem.message | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/services"
}
```

---

## 43. DELETE /diagnostics/lab/services/{id}

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Retirar un servicio (no se borra)
- **Operation ID:** `LabPortalServicesController_withdrawService`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LabPortalServicesController.withdrawService](../../src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts)

### Descripción de negocio

Retirar un servicio (no se borra). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `DELETE /diagnostics/lab/services/{id}` en `LabPortalServicesController_withdrawService`. El controlador delega en `LabPortalCatalogService.withdraw`. No recibe body. El tipo de retorno estático es `Promise<LabServiceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /diagnostics/lab/services/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /diagnostics/lab/services/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabServiceDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabServiceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "HEMOGRAMA",
  "name": "Nombre de ejemplo",
  "kind": "SERVICE",
  "parentId": "00000000-0000-4000-8000-000000000001",
  "catalogConceptId": "00000000-0000-4000-8000-000000000001",
  "hasPrice": true,
  "categoryId": "00000000-0000-4000-8000-000000000001",
  "categoryName": "Nombre de ejemplo",
  "sampleType": "valor-ejemplo",
  "preparation": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "turnaroundHours": 1,
  "requiresMedicalOrder": true,
  "homeCollection": true,
  "price": "45.00",
  "alovidaDiscountPercent": 10,
  "alovidaPrice": "40.50",
  "currency": "BOB",
  "status": "PUBLISHED",
  "available": true,
  "updatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `HEMOGRAMA` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `kind` | Sí | `string` | valores: `SERVICE`, `MODALITY` | MODALITY: the generic placeholder created per modality at registration; it is not priced. | `SERVICE` |
| `parentId` | Sí | `string` | formato `uuid`; admite null | Panel this service is a component of | `00000000-0000-4000-8000-000000000001` |
| `catalogConceptId` | Sí | `string` | formato `uuid`; admite null | Study catalog concept; null for free-form services | `00000000-0000-4000-8000-000000000001` |
| `hasPrice` | Sí | `boolean` | Sin restricción adicional declarada | False until a price version exists | `true` |
| `categoryId` | Sí | `string` | admite null | Category of the lab, or null when the service has none | `00000000-0000-4000-8000-000000000001` |
| `categoryName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sampleType` | Sí | `string` | admite null | The lab's free text (`specimen_description`); falls back to the display of the specimen concept | `valor-ejemplo` |
| `preparation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `turnaroundHours` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `requiresMedicalOrder` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `homeCollection` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `price` | Sí | `string` | admite null | null when the service has no current price | `45.00` |
| `alovidaDiscountPercent` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `10` |
| `alovidaPrice` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `40.50` |
| `currency` | Sí | `string` | valores: `BOB` | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `status` | Sí | `string` | valores: `PUBLISHED`, `DRAFT`, `WITHDRAWN` | Sin descripción específica en el contrato OpenAPI. | `PUBLISHED` |
| `available` | Sí | `boolean` | Sin restricción adicional declarada | "Available today" switch of the service | `true` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La organización activa no tiene un laboratorio registrado | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 404 | `NOT_FOUND` | Servicio no encontrado | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 409 | `CONFLICT` | La oferta ya está retirada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-studies.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/services/{id}"
}
```

---

## 44. PATCH /diagnostics/lab/services/{id}

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Editar un servicio (un precio nuevo es una versión nueva)
- **Operation ID:** `LabPortalServicesController_updateService`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LabPortalServicesController.updateService](../../src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts)

### Descripción de negocio

Editar un servicio (un precio nuevo es una versión nueva). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /diagnostics/lab/services/{id}` en `LabPortalServicesController_updateService`. El controlador delega en `LabPortalCatalogService.update`. Valida el body como `LabServiceChangesDto` y consume `application/json`. El tipo de retorno estático es `Promise<LabServiceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LabServiceChangesDto`; los campos opcionales se omiten.

```http
PATCH /diagnostics/lab/services/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `categoryId` | No | `string` | formato `uuid`; admite null | A category of this lab (`GET /diagnostics/lab/categories`); null clears it. Another lab's id is rejected as non-existent. | `00000000-0000-4000-8000-000000000001` |
| `sampleType` | No | `string` | admite null | Sample type as free text, stored in `specimen_description`; blank or null clears it | `valor-ejemplo` |
| `preparation` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `turnaroundHours` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `requiresMedicalOrder` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `homeCollection` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `alovidaDiscountPercent` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `10` |
| `available` | No | `boolean` | Sin restricción adicional declarada | "Available today": false hides the service from the public directory, the coverage search and order booking; it keeps its status and price | `true` |
| `code` | No | `string` | longitud máxima 40; patrón runtime `NOT_BLANK` | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | No | `string` | longitud máxima 200; patrón runtime `NOT_BLANK` | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `price` | No | `string` | patrón runtime `PRICE` | Sin descripción específica en el contrato OpenAPI. | `45.00` |
| `status` | No | `string` | valores: `PUBLISHED`, `DRAFT`, `WITHDRAWN` | Sin descripción específica en el contrato OpenAPI. | `PUBLISHED` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /diagnostics/lab/services/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "categoryId": "00000000-0000-4000-8000-000000000001",
  "sampleType": "valor-ejemplo",
  "preparation": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "turnaroundHours": 1,
  "requiresMedicalOrder": true,
  "homeCollection": true,
  "alovidaDiscountPercent": 10,
  "available": true,
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "price": "45.00",
  "status": "PUBLISHED"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabServiceDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabServiceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabServiceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "HEMOGRAMA",
  "name": "Nombre de ejemplo",
  "kind": "SERVICE",
  "parentId": "00000000-0000-4000-8000-000000000001",
  "catalogConceptId": "00000000-0000-4000-8000-000000000001",
  "hasPrice": true,
  "categoryId": "00000000-0000-4000-8000-000000000001",
  "categoryName": "Nombre de ejemplo",
  "sampleType": "valor-ejemplo",
  "preparation": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "turnaroundHours": 1,
  "requiresMedicalOrder": true,
  "homeCollection": true,
  "price": "45.00",
  "alovidaDiscountPercent": 10,
  "alovidaPrice": "40.50",
  "currency": "BOB",
  "status": "PUBLISHED",
  "available": true,
  "updatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `HEMOGRAMA` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `kind` | Sí | `string` | valores: `SERVICE`, `MODALITY` | MODALITY: the generic placeholder created per modality at registration; it is not priced. | `SERVICE` |
| `parentId` | Sí | `string` | formato `uuid`; admite null | Panel this service is a component of | `00000000-0000-4000-8000-000000000001` |
| `catalogConceptId` | Sí | `string` | formato `uuid`; admite null | Study catalog concept; null for free-form services | `00000000-0000-4000-8000-000000000001` |
| `hasPrice` | Sí | `boolean` | Sin restricción adicional declarada | False until a price version exists | `true` |
| `categoryId` | Sí | `string` | admite null | Category of the lab, or null when the service has none | `00000000-0000-4000-8000-000000000001` |
| `categoryName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sampleType` | Sí | `string` | admite null | The lab's free text (`specimen_description`); falls back to the display of the specimen concept | `valor-ejemplo` |
| `preparation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `turnaroundHours` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `requiresMedicalOrder` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `homeCollection` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `price` | Sí | `string` | admite null | null when the service has no current price | `45.00` |
| `alovidaDiscountPercent` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `10` |
| `alovidaPrice` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `40.50` |
| `currency` | Sí | `string` | valores: `BOB` | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `status` | Sí | `string` | valores: `PUBLISHED`, `DRAFT`, `WITHDRAWN` | Sin descripción específica en el contrato OpenAPI. | `PUBLISHED` |
| `available` | Sí | `boolean` | Sin restricción adicional declarada | "Available today" switch of the service | `true` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La organización activa no tiene un laboratorio registrado | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 404 | `NOT_FOUND` | Servicio no encontrado | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 409 | `CONFLICT` | problem.message | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-catalog.service.ts |
| 409 | `CONFLICT` | El tarifario público del laboratorio existe pero no está vigente | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-pricing.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | problem.message | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/services/{id}"
}
```

---

## 45. POST /diagnostics/lab/services/import

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Carga masiva por código, fila por fila
- **Operation ID:** `LabPortalServicesController_importServices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LabPortalServicesController.importServices](../../src/modules/diagnostic_units/controllers/lab-portal-services.controller.ts)

### Descripción de negocio

Carga masiva por código, fila por fila. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/lab/services/import` en `LabPortalServicesController_importServices`. El controlador delega en `LabPortalImportService.import`. Valida el body como `LabImportDto` y consume `application/json`. El tipo de retorno estático es `Promise<LabImportResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LabImportDto`; los campos opcionales se omiten.

```http
POST /diagnostics/lab/services/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mode": "CREATE_OR_UPDATE",
  "rows": [
    {
      "line": 1,
      "service": {}
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `mode` | Sí | `string` | valores: `CREATE_OR_UPDATE`, `UPDATE_ONLY` | Sin descripción específica en el contrato OpenAPI. | `CREATE_OR_UPDATE` |
| `rows` | Sí | `array<LabImportRowDto>` | mínimo 1 elemento(s); máximo 2000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"line":1,"service":{}}]` |
| `rows[].line` | Sí | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rows[].service` | Sí | `object` | Sin restricción adicional declarada | A LabServiceDraft | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/lab/services/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mode": "CREATE_OR_UPDATE",
  "rows": [
    {
      "line": 1,
      "service": {}
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabImportResultDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<LabImportResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabImportResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabImportResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LabImportResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LabImportResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabImportResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabImportResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabImportResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabImportResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabImportResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "created": 1,
  "updated": 1,
  "unchanged": 1,
  "rejected": 1,
  "rows": [
    {
      "line": 1,
      "code": "CODIGO_EJEMPLO",
      "outcome": "CREATED",
      "reason": "Texto descriptivo de ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `created` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `updated` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `unchanged` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rejected` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rows` | Sí | `array<LabImportRowResultDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"line":1,"code":"CODIGO_EJEMPLO","outcome":"CREATED","reason":"Texto descriptivo de ejemplo"}]` |
| `rows[].line` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rows[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `rows[].outcome` | Sí | `string` | valores: `CREATED`, `UPDATED`, `UNCHANGED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `CREATED` |
| `rows[].reason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La organización activa no tiene un laboratorio registrado | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-context.service.ts |
| 409 | `CONFLICT` | El tarifario público del laboratorio existe pero no está vigente | Excepción explícita en src/modules/diagnostic_units/services/lab-portal-pricing.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/services/import"
}
```

---

## 46. POST /price-schedules/{scheduleId}/study-prices

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-pricing`
- **Nombre:** Fijar/versionar el precio de un estudio (append-only)
- **Operation ID:** `DiagnosticPricingController_addStudyPrice`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticPricingController.addStudyPrice](../../src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts)

### Descripción de negocio

Fijar/versionar el precio de un estudio (append-only). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /price-schedules/{scheduleId}/study-prices` en `DiagnosticPricingController_addStudyPrice`. El controlador delega en `DiagnosticPricingService.addStudyPrice`. Valida el body como `CreateStudyPriceDto` y consume `application/json`. El tipo de retorno estático es `Promise<StudyPriceResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `scheduleId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateStudyPriceDto`; los campos opcionales se omiten.

```http
POST /price-schedules/00000000-0000-4000-8000-000000000001/study-prices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "diagnosticStudyOfferingId": "00000000-0000-4000-8000-000000000001",
  "baseAmount": "120.00"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `scheduleId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `diagnosticStudyOfferingId` | Sí | `string` | formato `uuid` | Oferta de estudio a tarificar | `00000000-0000-4000-8000-000000000001` |
| `baseAmount` | Sí | `string` | Sin restricción adicional declarada | Importe base | `120.00` |
| `patientAmount` | No | `string` | Sin restricción adicional declarada | Importe a paciente | `120.00` |
| `insurerAmount` | No | `string` | Sin restricción adicional declarada | Importe a aseguradora | `80.00` |
| `taxAmount` | No | `string` | Sin restricción adicional declarada | Impuesto | `18.00` |
| `discountFactor` | No | `string` | Sin restricción adicional declarada | Factor de descuento | `0.10` |
| `pricingRuleJson` | No | `object` | Sin restricción adicional declarada | Reglas de precio (JSON) | `{}` |
| `effectiveFrom` | No | `string` | formato `date-time` | Vigente desde | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /price-schedules/00000000-0000-4000-8000-000000000001/study-prices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "diagnosticStudyOfferingId": "00000000-0000-4000-8000-000000000001",
  "baseAmount": "120.00",
  "patientAmount": "120.00",
  "insurerAmount": "80.00",
  "taxAmount": "18.00",
  "discountFactor": "0.10",
  "pricingRuleJson": {},
  "effectiveFrom": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<StudyPriceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StudyPriceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StudyPriceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StudyPriceResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StudyPriceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StudyPriceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StudyPriceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StudyPriceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StudyPriceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StudyPriceResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<StudyPriceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StudyPriceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "status": "00000000-0000-4000-8000-000000000001",
  "effectiveFrom": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Nº de versión (append-only) | `1` |
| `status` | Sí | `string` | formato `uuid` | Concept id de estado | `00000000-0000-4000-8000-000000000001` |
| `effectiveFrom` | Sí | `string` | formato `date-time` | Valor de effective from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El cronograma no está activo | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-pricing.service.ts |
| 422 | `PRECONDITION_FAILED` | La oferta no pertenece a la misma unidad que el cronograma | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-pricing.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/price-schedules/{scheduleId}/study-prices"
}
```

---

## 47. POST /study-prices/{priceId}/close

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-pricing`
- **Nombre:** Cerrar una versión de precio vigente
- **Operation ID:** `DiagnosticPricingController_closePrice`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticPricingController.closePrice](../../src/modules/diagnostic_units/controllers/diagnostic-pricing.controller.ts)

### Descripción de negocio

Cerrar una versión de precio vigente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /study-prices/{priceId}/close` en `DiagnosticPricingController_closePrice`. El controlador delega en `DiagnosticPricingService.closePrice`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `priceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /study-prices/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `priceId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /study-prices/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-unit-scope.service.ts |
| 422 | `PRECONDITION_FAILED` | Solo se puede cerrar una versión de precio activa y aún abierta | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-pricing.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/study-prices/{priceId}/close"
}
```

---

