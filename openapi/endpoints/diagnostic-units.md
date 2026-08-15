<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `diagnostic_units`

Referencia exhaustiva de 21 operación(es) del módulo `diagnostic_units`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `diagnostic-equipment`, `diagnostic-pricing`, `diagnostic-unit-accreditations`, `diagnostic-unit-sites`, `diagnostic-units`
- **Controladores:** `DiagnosticEquipmentController`, `DiagnosticPricingController`, `DiagnosticUnitAccreditationsController`, `DiagnosticUnitSitesController`, `DiagnosticUnitsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [PATCH /diagnostic-equipment/{id}](#1-patch-diagnostic-equipment-id) — Actualizar estado/calibración de un equipo
2. [DELETE /diagnostic-study-offerings/{id}](#2-delete-diagnostic-study-offerings-id) — Retirar (soft-delete) una oferta de estudio
3. [POST /diagnostic-unit-accreditations/{id}/renew](#3-post-diagnostic-unit-accreditations-id-renew) — Renovar/registrar acreditación con evidencia
4. [PATCH /diagnostic-unit-sites/{siteId}](#4-patch-diagnostic-unit-sites-siteid) — Actualizar un sitio operativo de la unidad
5. [POST /diagnostic-unit-sites/{siteId}/equipment](#5-post-diagnostic-unit-sites-siteid-equipment) — Registrar equipamiento y calibración del sitio
6. [GET /diagnostic-units](#6-get-diagnostic-units) — Listar unidades diagnósticas publicadas
7. [POST /diagnostic-units](#7-post-diagnostic-units) — Alta de unidad diagnóstica con sitios y acreditaciones
8. [GET /diagnostic-units/{id}](#8-get-diagnostic-units-id) — Consultar el perfil de una unidad diagnóstica
9. [POST /diagnostic-units/{id}/accreditations](#9-post-diagnostic-units-id-accreditations) — Registrar una acreditación con evidencia
10. [GET /diagnostic-units/{id}/administration](#10-get-diagnostic-units-id-administration) — Consola de administración de una unidad diagnóstica
11. [POST /diagnostic-units/{id}/practitioner-assignments](#11-post-diagnostic-units-id-practitioner-assignments) — Asignar un especialista a la unidad/sitio
12. [POST /diagnostic-units/{id}/price-schedules](#12-post-diagnostic-units-id-price-schedules) — Crear un cronograma de precios
13. [POST /diagnostic-units/{id}/reproject](#13-post-diagnostic-units-id-reproject) — Reconstruir la proyección del perfil público
14. [POST /diagnostic-units/{id}/sites](#14-post-diagnostic-units-id-sites) — Registrar un sitio operativo de la unidad
15. [PUT /diagnostic-units/{id}/specialties](#15-put-diagnostic-units-id-specialties) — Declarar las especialidades de la unidad
16. [POST /diagnostic-units/{id}/study-offerings](#16-post-diagnostic-units-id-study-offerings) — Publicar oferta de estudio con componentes (panel)
17. [POST /diagnostic-units/{id}/verify-and-publish](#17-post-diagnostic-units-id-verify-and-publish) — Verificar la unidad y publicar su perfil público
18. [GET /diagnostic-units/administration](#18-get-diagnostic-units-administration) — Listar las unidades del tenant, publicadas o no
19. [GET /diagnostic-units/search](#19-get-diagnostic-units-search) — Buscar centros de diagnóstico, laboratorio e imagen
20. [POST /price-schedules/{scheduleId}/study-prices](#20-post-price-schedules-scheduleid-study-prices) — Fijar/versionar el precio de un estudio (append-only)
21. [POST /study-prices/{priceId}/close](#21-post-study-prices-priceid-close) — Cerrar una versión de precio vigente

---

## 1. PATCH /diagnostic-equipment/{id}

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
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

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EquipmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "diagnosticUnitSiteId": "00000000-0000-4000-8000-000000000001",
  "operationalStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `diagnosticUnitSiteId` | Sí | `string` | formato `uuid` | Identificador asociado a diagnostic unit site. | `00000000-0000-4000-8000-000000000001` |
| `operationalStatus` | Sí | `string` | formato `uuid` | Concept id de estado operativo | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Equipo no encontrado | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-equipment.service.ts |
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
  "path": "/diagnostic-equipment/{id}"
}
```

---

## 2. DELETE /diagnostic-study-offerings/{id}

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
| 404 | `NOT_FOUND` | Oferta no encontrada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-studies.service.ts |
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

## 3. POST /diagnostic-unit-accreditations/{id}/renew

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
| 404 | `NOT_FOUND` | Acreditación no encontrada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
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

## 4. PATCH /diagnostic-unit-sites/{siteId}

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
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
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

## 5. POST /diagnostic-unit-sites/{siteId}/equipment

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

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EquipmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "diagnosticUnitSiteId": "00000000-0000-4000-8000-000000000001",
  "operationalStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `diagnosticUnitSiteId` | Sí | `string` | formato `uuid` | Identificador asociado a diagnostic unit site. | `00000000-0000-4000-8000-000000000001` |
| `operationalStatus` | Sí | `string` | formato `uuid` | Concept id de estado operativo | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-equipment.service.ts |
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

## 6. GET /diagnostic-units

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

## 7. POST /diagnostic-units

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
  "tenantId": "00000000-0000-4000-8000-000000000001",
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant propietario de la unidad | `00000000-0000-4000-8000-000000000001` |
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

## 8. GET /diagnostic-units/{id}

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
      "imagingAvailable": {}
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
| `sites` | Sí | `array<DiagnosticUnitSiteDetailDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"sampleCollectionAvailable":{},"imagingAvailable":{}}]` |
| `sites[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sites[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].role` | Sí | `DiagnosticConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `sites[].role.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sites[].role.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sites[].sampleCollectionAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sites[].imagingAvailable` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
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

## 9. POST /diagnostic-units/{id}/accreditations

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
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
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

## 10. GET /diagnostic-units/{id}/administration

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

## 11. POST /diagnostic-units/{id}/practitioner-assignments

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
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
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

## 12. POST /diagnostic-units/{id}/price-schedules

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
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-pricing.service.ts |
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

## 13. POST /diagnostic-units/{id}/reproject

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
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
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

## 14. POST /diagnostic-units/{id}/sites

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
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
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

## 15. PUT /diagnostic-units/{id}/specialties

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
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
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

## 16. POST /diagnostic-units/{id}/study-offerings

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
| `components[].ordinal` | No | `number` | mínimo 0 | Orden en el panel | `1` |

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
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-studies.service.ts |
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

## 17. POST /diagnostic-units/{id}/verify-and-publish

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
| 404 | `NOT_FOUND` | Unidad no encontrada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
| 422 | `PRECONDITION_FAILED` | La unidad no tiene ningún sitio activo para publicar | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-units.service.ts |
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
  "path": "/diagnostic-units/{id}/verify-and-publish"
}
```

---

## 18. GET /diagnostic-units/administration

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

## 19. GET /diagnostic-units/search

- **Módulo:** `diagnostic_units`
- **Etiqueta OpenAPI:** `diagnostic-units`
- **Nombre:** Buscar centros de diagnóstico, laboratorio e imagen
- **Operation ID:** `DiagnosticUnitsController_search`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticUnitsController.search](../../src/modules/diagnostic_units/controllers/diagnostic-units.controller.ts)

### Descripción de negocio

Filtra por texto, tipo, estudio ofrecido, convenio con aseguradora, prestaciones, precio y calificación. A diferencia del directorio, no se acota a la organización de la sesión: quien busca dónde hacerse un estudio busca en la ciudad, no en su institución.

Contexto declarado en el controlador: El buscador del paciente: centros publicados de toda la plataforma — CARRIL 11. Va declarado **antes** que `:id` por el mismo motivo que la consola de administración: el parámetro lleva `ParseUUIDPipe` y se comería `search`. No lleva `@Roles` porque es un directorio de prestadores publicados, no datos de nadie: qué centros hay, qué hacen y cuánto cuestan. Exigir un rol lo dejaría fuera del alcance del paciente, que es para quien existe.

### Descripción del sistema

NestJS resuelve `GET /diagnostic-units/search` en `DiagnosticUnitsController_search`. El controlador delega en `DiagnosticUnitsSearchService.search`. No recibe body. El tipo de retorno estático es `Promise<SearchDiagnosticUnitsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en nombre o código | `valor-ejemplo` |
| `tenantId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `kind` | query | No | `string` | valores: `LABORATORY`, `IMAGING` | Sin descripción específica en OpenAPI. | `LABORATORY` |
| `studyCode` | query | No | `string` | Sin restricción adicional declarada | Código del estudio buscado | `CODIGO_EJEMPLO` |
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
GET /diagnostic-units/search?q=valor-ejemplo&tenantId=00000000-0000-4000-8000-000000000001&kind=LABORATORY&studyCode=CODIGO_EJEMPLO&insurerTenantId=00000000-0000-4000-8000-000000000001&homeCollection=true&walkIn=true&acceptsExternalOrders=true&maxAmount=1&minRating=1&limit=20&offset=0 HTTP/1.1
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
      "minAmount": {}
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
| `items` | Sí | `array<DiagnosticUnitSearchItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"siteCount":1,"equipmentCount":1,"studyCount":1,"acceptsExternalOrders":{},"walkInAvailable":{},"homeCollectionAvailable":{},"tenantId":"00000000-0000-4000-8000-000000000001","rating":{},"ratingCount":1,"minAmount":{}}]` |
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

## 20. POST /price-schedules/{scheduleId}/study-prices

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
| 404 | `NOT_FOUND` | Cronograma no encontrado | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-pricing.service.ts |
| 404 | `NOT_FOUND` | Oferta de estudio no encontrada | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-pricing.service.ts |
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

## 21. POST /study-prices/{priceId}/close

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
| 404 | `NOT_FOUND` | Precio no encontrado | Excepción explícita en src/modules/diagnostic_units/services/diagnostic-pricing.service.ts |
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

