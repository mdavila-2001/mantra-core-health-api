<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `practice`

Referencia exhaustiva de 84 operación(es) del módulo `practice`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `practice`, `practice-infrastructure`, `practice-operations`
- **Controladores:** `AccreditationsController`, `CareSpaceOpsController`, `CareSpacesController`, `ClinicalUnitsController`, `InfrastructureAccessController`, `InfrastructureCatalogController`, `InventoryItemsController`, `OrganizationPracticesController`, `PracticeInvitationsController`, `PracticesController`, `PractitionerInvitationsController`, `PractitionerSitesController`, `RoleAssignmentsController`, `SiteInfrastructureController`, `SiteLicensesController`, `SitesController`, `SpaceAssetsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /accreditations/{id}/verify](#1-post-accreditations-id-verify) — Verificar o caducar una acreditación (transición de estado)
2. [POST /care-space-blocks/{id}/cancel](#2-post-care-space-blocks-id-cancel) — Cancelar un bloqueo
3. [POST /care-space-blocks/{id}/end](#3-post-care-space-blocks-id-end) — Terminar un bloqueo
4. [GET /care-spaces/{id}](#4-get-care-spaces-id) — Ficha de un espacio de atención
5. [PATCH /care-spaces/{id}](#5-patch-care-spaces-id) — Editar un espacio de atención
6. [POST /care-spaces/{id}/availability](#6-post-care-spaces-id-availability) — Cambiar la disponibilidad de un espacio
7. [GET /care-spaces/{id}/blocks](#7-get-care-spaces-id-blocks) — Bloqueos de un espacio
8. [GET /care-spaces/{id}/equipment](#8-get-care-spaces-id-equipment) — Equipos ubicados en un espacio (F5a)
9. [GET /care-spaces/{id}/history](#9-get-care-spaces-id-history) — Historial de un espacio de atención
10. [POST /care-spaces/{id}/hygiene](#10-post-care-spaces-id-hygiene) — Marcar un espacio sucio o contaminado
11. [POST /care-spaces/{id}/isolation](#11-post-care-spaces-id-isolation) — Cambiar el aislamiento de un espacio
12. [POST /care-spaces/{id}/lifecycle](#12-post-care-spaces-id-lifecycle) — Cambiar el ciclo de vida de un espacio
13. [POST /care-spaces/{id}/move](#13-post-care-spaces-id-move) — Mover un espacio de atención
14. [GET /care-spaces/{id}/operational-state](#14-get-care-spaces-id-operational-state) — Estado operativo de un espacio
15. [GET /care-spaces/{id}/retire-check](#15-get-care-spaces-id-retire-check) — Bloqueos para retirar un espacio
16. [GET /care-spaces/{id}/status-events](#16-get-care-spaces-id-status-events) — Historial de estados de un espacio (A20)
17. [GET /care-spaces/{id}/stock](#17-get-care-spaces-id-stock) — Stock ubicado en un espacio (F5c)
18. [POST /care-spaces/{id}/unit-assignments](#18-post-care-spaces-id-unit-assignments) — Vincular un espacio a una unidad clínica
19. [DELETE /care-spaces/{id}/unit-assignments/{assignmentId}](#19-delete-care-spaces-id-unit-assignments-assignmentid) — Desvincular un espacio de una unidad clínica
20. [POST /cleaning-orders/{id}/assign](#20-post-cleaning-orders-id-assign) — Asignar una orden de limpieza
21. [POST /cleaning-orders/{id}/cancel](#21-post-cleaning-orders-id-cancel) — Cancelar una orden de limpieza
22. [POST /cleaning-orders/{id}/finish](#22-post-cleaning-orders-id-finish) — Terminar una orden de limpieza
23. [POST /cleaning-orders/{id}/inspect](#23-post-cleaning-orders-id-inspect) — Inspeccionar una limpieza
24. [POST /cleaning-orders/{id}/start](#24-post-cleaning-orders-id-start) — Iniciar una orden de limpieza
25. [GET /clinical-units/{id}](#25-get-clinical-units-id) — Ficha de una unidad clínica
26. [PATCH /clinical-units/{id}](#26-patch-clinical-units-id) — Editar una unidad clínica
27. [POST /clinical-units/{id}/lifecycle](#27-post-clinical-units-id-lifecycle) — Cambiar el ciclo de vida de una unidad clínica
28. [POST /internal/practice/blocks-tick](#28-post-internal-practice-blocks-tick) — Aplicar bloqueos programados y avisar vencidos (worker)
29. [POST /inventory-items/{itemId}/movements](#29-post-inventory-items-itemid-movements) — Registrar un movimiento de inventario (ajuste de stock)
30. [GET /practice/infrastructure-access/me](#30-get-practice-infrastructure-access-me) — Acceso del actor a la infraestructura del tenant activo
31. [GET /practice/infrastructure-catalog](#31-get-practice-infrastructure-catalog) — Catálogo de infraestructura hospitalaria
32. [GET /practices](#32-get-practices) — Listar las prácticas activas del tenant
33. [POST /practices](#33-post-practices) — Dar de alta una práctica (organización raíz)
34. [POST /practices/{practiceId}/accreditations](#34-post-practices-practiceid-accreditations) — Registrar una acreditación con evidencia
35. [GET /practices/{practiceId}/healthcare-services](#35-get-practices-practiceid-healthcare-services) — Listar los procedimientos que ofrecen las sedes de la práctica
36. [POST /practices/{practiceId}/healthcare-services](#36-post-practices-practiceid-healthcare-services) — Publicar un procedimiento del nomenclador en una sede
37. [PATCH /practices/{practiceId}/healthcare-services/{id}](#37-patch-practices-practiceid-healthcare-services-id) — Actualizar el precio o el estado de un procedimiento de la sede
38. [POST /practices/{practiceId}/inventory-items](#38-post-practices-practiceid-inventory-items) — Dar de alta un insumo de inventario de práctica
39. [GET /practices/{practiceId}/organization](#39-get-practices-practiceid-organization) — Consola de organización médica: estructura, plantilla y legajo
40. [GET /practices/{practiceId}/role-assignments](#40-get-practices-practiceid-role-assignments) — Listar las vinculaciones profesional-organización de la práctica
41. [POST /practices/{practiceId}/role-assignments](#41-post-practices-practiceid-role-assignments) — Asignar un rol de profesional a sitio/unidad/servicio
42. [POST /practices/{practiceId}/role-assignments/invitations](#42-post-practices-practiceid-role-assignments-invitations) — Invitar a un profesional a procedimientos de una sede
43. [POST /practices/{practiceId}/role-assignments/self-request](#43-post-practices-practiceid-role-assignments-self-request) — Solicitar la propia vinculación a una organización
44. [PUT /practices/{practiceId}/settings/{settingKey}](#44-put-practices-practiceid-settings-settingkey) — Configurar un ajuste de práctica (upsert)
45. [GET /practices/{practiceId}/sites](#45-get-practices-practiceid-sites) — Listar las sedes de una práctica
46. [POST /practices/{practiceId}/sites](#46-post-practices-practiceid-sites) — Dar de alta un sitio de práctica
47. [DELETE /practices/{practiceId}/sites/{siteId}](#47-delete-practices-practiceid-sites-siteid) — Desmantelar un sitio en cascada (soft-delete)
48. [GET /practitioners/{profileId}/sites](#48-get-practitioners-profileid-sites) — Consultorios donde atiende el profesional
49. [GET /practitioners/me/joinable-practices](#49-get-practitioners-me-joinable-practices) — Organizaciones a las que puedo pedir vincularme
50. [GET /practitioners/me/role-assignments](#50-get-practitioners-me-role-assignments) — Mis vinculaciones con organizaciones
51. [POST /practitioners/me/role-assignments/{roleId}/accept](#51-post-practitioners-me-role-assignments-roleid-accept) — Aceptar una invitación de un centro
52. [POST /practitioners/me/role-assignments/{roleId}/decline](#52-post-practitioners-me-role-assignments-roleid-decline) — Declinar una invitación de un centro
53. [POST /practitioners/me/sites](#53-post-practitioners-me-sites) — Registrar un consultorio propio
54. [DELETE /practitioners/me/sites/{siteId}](#54-delete-practitioners-me-sites-siteid) — Retirar un consultorio propio
55. [PATCH /practitioners/me/sites/{siteId}](#55-patch-practitioners-me-sites-siteid) — Corregir un consultorio propio
56. [PUT /practitioners/me/sites/{siteId}/bank-qr](#56-put-practitioners-me-sites-siteid-bank-qr) — Fijar o quitar el QR bancario de una sede
57. [PUT /practitioners/me/sites/{siteId}/contact-phone](#57-put-practitioners-me-sites-siteid-contact-phone) — Guardar o quitar mi teléfono en una sede
58. [PUT /practitioners/me/sites/{siteId}/logo](#58-put-practitioners-me-sites-siteid-logo) — Fijar o quitar el logo del consultorio propio
59. [POST /role-assignments/{roleId}/approve](#59-post-role-assignments-roleid-approve) — Aprobar una vinculación pendiente
60. [POST /role-assignments/{roleId}/end](#60-post-role-assignments-roleid-end) — Finalizar una vinculación
61. [POST /role-assignments/{roleId}/reject](#61-post-role-assignments-roleid-reject) — Rechazar una vinculación pendiente
62. [POST /role-assignments/{roleId}/support-assignments](#62-post-role-assignments-roleid-support-assignments) — Adjuntar personal de apoyo a un rol de profesional
63. [POST /role-assignments/{roleId}/suspend](#63-post-role-assignments-roleid-suspend) — Suspender una vinculación activa
64. [PATCH /site-licenses/{id}](#64-patch-site-licenses-id) — Editar una habilitación del establecimiento
65. [GET /sites/{siteId}/bed-board](#65-get-sites-siteid-bed-board) — Tablero de camas de una sede
66. [GET /sites/{siteId}/capacity](#66-get-sites-siteid-capacity) — Capacidad declarada vs. derivada del establecimiento
67. [GET /sites/{siteId}/care-spaces](#67-get-sites-siteid-care-spaces) — Listar los espacios de atención de la sede
68. [POST /sites/{siteId}/care-spaces](#68-post-sites-siteid-care-spaces) — Crear un espacio de atención bajo una unidad/sitio
69. [POST /sites/{siteId}/care-spaces/bulk](#69-post-sites-siteid-care-spaces-bulk) — Alta masiva de espacios por patrón
70. [POST /sites/{siteId}/care-spaces/import](#70-post-sites-siteid-care-spaces-import) — Importar espacios (dryRun=true valida sin escribir)
71. [GET /sites/{siteId}/cleaning-orders](#71-get-sites-siteid-cleaning-orders) — Cola de limpieza de una sede
72. [POST /sites/{siteId}/cleaning-orders](#72-post-sites-siteid-cleaning-orders) — Crear una orden de limpieza
73. [GET /sites/{siteId}/clinical-units](#73-get-sites-siteid-clinical-units) — Listar las unidades clínicas de la sede
74. [POST /sites/{siteId}/clinical-units](#74-post-sites-siteid-clinical-units) — Crear una unidad clínica jerárquica
75. [POST /sites/{siteId}/declared-capacities](#75-post-sites-siteid-declared-capacities) — Declarar capacidad del establecimiento
76. [GET /sites/{siteId}/diagnostic-equipment](#76-get-sites-siteid-diagnostic-equipment) — Equipos diagnósticos de una sede (F5a)
77. [GET /sites/{siteId}/licenses](#77-get-sites-siteid-licenses) — Habilitaciones del establecimiento
78. [POST /sites/{siteId}/licenses](#78-post-sites-siteid-licenses) — Registrar una habilitación del establecimiento
79. [GET /sites/{siteId}/regulatory](#79-get-sites-siteid-regulatory) — Datos regulatorios del establecimiento
80. [PATCH /sites/{siteId}/regulatory](#80-patch-sites-siteid-regulatory) — Editar los datos regulatorios del establecimiento
81. [POST /sites/{siteId}/regulatory/verify-snis](#81-post-sites-siteid-regulatory-verify-snis) — Verificar el código SNIS del establecimiento (plataforma)
82. [GET /sites/{siteId}/sample-collection-points](#82-get-sites-siteid-sample-collection-points) — Puntos de toma de muestra de una sede (F5b)
83. [GET /sites/{siteId}/structure](#83-get-sites-siteid-structure) — Estructura de la sede (espacios, unidades, vínculos)
84. [POST /tenants/{tenantId}/practices](#84-post-tenants-tenantid-practices) — Crear la práctica y la primera sede de una organización

---

## 1. POST /accreditations/{id}/verify

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Verificar o caducar una acreditación (transición de estado)
- **Operation ID:** `AccreditationsController_verify`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AccreditationsController.verify](../../src/modules/practice/controllers/accreditations.controller.ts)

### Descripción de negocio

Verificar o caducar una acreditación (transición de estado). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /accreditations/{id}/verify` en `AccreditationsController_verify`. El controlador delega en `PracticeAccreditationsService.verify`. Valida el body como `VerifyAccreditationDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccreditationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VerifyAccreditationDto`; los campos opcionales se omiten.

```http
POST /accreditations/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
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
| `decision` | No | `string` | valores: `VERIFIED`, `EXPIRED` | Decisión de la transición (por defecto VERIFIED) | `VERIFIED` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /accreditations/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "VERIFIED"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AccreditationResponseDto>` | No |
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
| 422 | `PRECONDITION_FAILED` | La acreditación no está pendiente de verificación | Excepción explícita en src/modules/practice/services/practice-accreditations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/accreditations/{id}/verify"
}
```

---

## 2. POST /care-space-blocks/{id}/cancel

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Cancelar un bloqueo
- **Operation ID:** `CareSpaceOpsController_cancelBlock`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.cancelBlock](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Cancelar un bloqueo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Cancelar un bloqueo.

### Descripción del sistema

NestJS resuelve `POST /care-space-blocks/{id}/cancel` en `CareSpaceOpsController_cancelBlock`. El controlador delega en `CareSpaceOpsService.cancelBlock`. Valida el body como `CancelBlockDto` y consume `application/json`. El tipo de retorno estático es `Promise<CareSpaceBlockDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CancelBlockDto`; los campos opcionales se omiten.

```http
POST /care-space-blocks/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
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
| `reason` | Sí | `string` | longitud mínima 1; longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /care-space-blocks/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CareSpaceBlockDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CareSpaceBlockDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CareSpaceBlockDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CareSpaceBlockDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CareSpaceBlockDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CareSpaceBlockDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CareSpaceBlockDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CareSpaceBlockDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CareSpaceBlockDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CareSpaceBlockDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CareSpaceBlockDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CareSpaceBlockDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "kindCode": "CODIGO_EJEMPLO",
  "reasonCode": "CODIGO_EJEMPLO",
  "reasonText": "Texto descriptivo de ejemplo",
  "startsAt": "2026-07-31T12:00:00.000Z",
  "expectedEndAt": "2026-07-31T12:00:00.000Z",
  "endedAt": "2026-07-31T12:00:00.000Z",
  "cancelledAt": "2026-07-31T12:00:00.000Z",
  "endNote": "valor-ejemplo",
  "cancelReason": "Texto descriptivo de ejemplo",
  "rowVersion": 1,
  "requestId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `kindCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `reasonCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `reasonText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `startsAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `expectedEndAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `endedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cancelledAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `endNote` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cancelReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `requestId` | No | `string` | Sin restricción adicional declarada | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/care-space-blocks/{id}/cancel"
}
```

---

## 3. POST /care-space-blocks/{id}/end

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Terminar un bloqueo
- **Operation ID:** `CareSpaceOpsController_endBlock`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.endBlock](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Terminar un bloqueo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Terminar un bloqueo (el fin de mantenimiento abre una orden de limpieza).

### Descripción del sistema

NestJS resuelve `POST /care-space-blocks/{id}/end` en `CareSpaceOpsController_endBlock`. El controlador delega en `CareSpaceOpsService.endBlock`. Valida el body como `EndBlockDto` y consume `application/json`. El tipo de retorno estático es `Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EndBlockDto`; los campos opcionales se omiten.

```http
POST /care-space-blocks/00000000-0000-4000-8000-000000000001/end HTTP/1.1
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
| `note` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /care-space-blocks/00000000-0000-4000-8000-000000000001/end HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }>` | Sí |
| 400 | Operación completada correctamente. | `Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }>` | No |
| 401 | Operación completada correctamente. | `Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }>` | No |
| 403 | Operación completada correctamente. | `Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }>` | No |
| 404 | Operación completada correctamente. | `Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }>` | No |
| 409 | Operación completada correctamente. | `Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }>` | No |
| 413 | Operación completada correctamente. | `Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }>` | No |
| 422 | Operación completada correctamente. | `Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }>` | No |
| 429 | Operación completada correctamente. | `Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }>` | No |
| 500 | Operación completada correctamente. | `Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }>` | No |
| 504 | Operación completada correctamente. | `Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ block: CareSpaceBlockDto; cleaningOrderId: string | null }`. Ejemplo completo derivado de ese DTO:

```json
{
  "block": {
    "id": "00000000-0000-4000-8000-000000000001",
    "careSpaceId": "00000000-0000-4000-8000-000000000001",
    "kindCode": "CODIGO_EJEMPLO",
    "reasonCode": "CODIGO_EJEMPLO",
    "reasonText": "Texto descriptivo de ejemplo",
    "startsAt": "2026-07-31T12:00:00.000Z",
    "expectedEndAt": "2026-07-31T12:00:00.000Z",
    "endedAt": "2026-07-31T12:00:00.000Z",
    "cancelledAt": "2026-07-31T12:00:00.000Z",
    "endNote": "valor-ejemplo",
    "cancelReason": "Texto descriptivo de ejemplo",
    "rowVersion": 1,
    "requestId": "00000000-0000-4000-8000-000000000001"
  },
  "cleaningOrderId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `block` | Sí | `CareSpaceBlockDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","kindCode":"CODIGO_EJEMPLO","reasonCode":"CODIGO_EJEMPLO","reasonText":"Texto descriptivo de ejemplo","startsAt":"2026-07-31T12:00:00.000Z","expectedEndAt":"2026-07-31T12:00:00.000Z","endedAt":"2026-07-31T12:00:00.000Z","cancelledAt":"2026-07-31T12:00:00.000Z","endNote":"valor-ejemplo","cancelReason":"Texto descriptivo de ejemplo","rowVersion":1,"requestId":"00000000-0000-4000-8000-000000000001"}` |
| `block.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `block.careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `block.kindCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `block.reasonCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `block.reasonText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `block.startsAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `block.expectedEndAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `block.endedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `block.cancelledAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `block.endNote` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `block.cancelReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `block.rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `block.requestId` | No | `string` | Sin restricción adicional declarada | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `00000000-0000-4000-8000-000000000001` |
| `cleaningOrderId` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/care-space-blocks/{id}/end"
}
```

---

## 4. GET /care-spaces/{id}

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Ficha de un espacio de atención
- **Operation ID:** `CareSpacesController_detail`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpacesController.detail](../../src/modules/practice/controllers/care-spaces.controller.ts)

### Descripción de negocio

Ficha de un espacio de atención. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ficha del espacio: camino, hijos, vínculos y recuentos derivados.

### Descripción del sistema

NestJS resuelve `GET /care-spaces/{id}` en `CareSpacesController_detail`. El controlador delega en `InfrastructureReadService.spaceDetail`. No recibe body. El tipo de retorno estático es `Promise<CareSpaceDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /care-spaces/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /care-spaces/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<CareSpaceDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CareSpaceDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "parentId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "form": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "function": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "operationalStatus": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "clinicalUnitId": {},
  "capacity": 1,
  "rowVersion": 1,
  "childCount": 1,
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "floorNumber": 1,
  "areaM2": 1,
  "asepsis": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pressure": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "airChangesPerHour": 1,
  "hvacValidatedOn": {},
  "sexRestriction": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "ageGroup": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "bedCategory": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "censable": true,
  "gln": "valor-ejemplo",
  "prepMinutes": 1,
  "cleanupMinutes": 1,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "path": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ],
  "children": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "function": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "operationalStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "clinicalUnitId": {},
      "capacity": 1,
      "rowVersion": 1,
      "childCount": 1
    }
  ],
  "assignments": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "role": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "derived": {
    "beds": 1,
    "censableBeds": 1,
    "activeChildren": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `floorNumber` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `areaM2` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `asepsis` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `asepsis.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `asepsis.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pressure` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `pressure.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pressure.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `airChangesPerHour` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `hvacValidatedOn` | Sí | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sexRestriction` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `sexRestriction.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sexRestriction.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `ageGroup` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `ageGroup.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `ageGroup.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `bedCategory` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `bedCategory.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `bedCategory.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `censable` | Sí | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `gln` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `prepMinutes` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `cleanupMinutes` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `validFrom` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `path` | Sí | `array<SpacePathStepDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `path[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `path[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `path[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `path[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `path[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `path[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children` | Sí | `array<CareSpaceNodeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"function":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"clinicalUnitId":{},"capacity":1,"rowVersion":1,"childCount":1}]` |
| `children[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `children[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `children[].capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `children[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `children[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `assignments` | Sí | `array<SpaceUnitAssignmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `assignments[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].clinicalUnitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].role` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `assignments[].role.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `assignments[].role.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `assignments[].validFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignments[].validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `derived` | Sí | `SpaceDerivedDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"beds":1,"censableBeds":1,"activeChildren":1}` |
| `derived.beds` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `derived.censableBeds` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `derived.activeChildren` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/care-spaces/{id}"
}
```

---

## 5. PATCH /care-spaces/{id}

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Editar un espacio de atención
- **Operation ID:** `CareSpacesController_update`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpacesController.update](../../src/modules/practice/controllers/care-spaces.controller.ts)

### Descripción de negocio

Editar un espacio de atención. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Editar descriptivos y atributos; `code`/`formCode` sólo en PLANNED.

### Descripción del sistema

NestJS resuelve `PATCH /care-spaces/{id}` en `CareSpacesController_update`. El controlador delega en `CareSpacesAdminService.update`. Valida el body como `UpdateCareSpaceDto` y consume `application/json`. El tipo de retorno estático es `Promise<CareSpaceDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match` | header | Sí | `string` | Sin restricción adicional declarada | rowVersion leída (3, "3" o W/"3"). Ausente o distinta: 412 | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateCareSpaceDto`; los campos opcionales se omiten.

```http
PATCH /care-spaces/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
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
| `description` | No | `string` | longitud máxima 1000; admite null | Descripción libre | `Texto descriptivo de ejemplo` |
| `capacity` | No | `number` | mínimo 0; admite null | Capacidad (nº de plazas) | `1` |
| `floorNumber` | No | `number` | admite null | Piso (negativo = subsuelo) | `1` |
| `areaM2` | No | `number` | mínimo 0; admite null | Superficie útil en m² | `1` |
| `asepsisCode` | No | `string` | admite null | Asepsia (ASEPSIS_*) | `CODIGO_EJEMPLO` |
| `pressureCode` | No | `string` | admite null | Presión relativa (PRESSURE_*) | `CODIGO_EJEMPLO` |
| `airChangesPerHour` | No | `number` | admite null | Renovaciones de aire por hora (ACH) | `1` |
| `hvacValidatedOn` | No | `string` | formato `date`; admite null | Fecha de validación HVAC (YYYY-MM-DD) | `2026-07-31` |
| `sexRestrictionCode` | No | `string` | admite null | Restricción de sexo (SEX_*) | `CODIGO_EJEMPLO` |
| `ageGroupCode` | No | `string` | admite null | Grupo etario (AGE_*) | `CODIGO_EJEMPLO` |
| `bedCategoryCode` | No | `string` | admite null | Categoría de cama (BED_CAT_*) | `CODIGO_EJEMPLO` |
| `censable` | No | `boolean` | admite null | Cama censable (cuenta para el censo) | `true` |
| `prepMinutes` | No | `number` | mínimo 0; admite null | Minutos de preparación | `1` |
| `cleanupMinutes` | No | `number` | mínimo 0; admite null | Minutos de limpieza | `1` |
| `gln` | No | `string` | admite null | GS1 GLN (13 dígitos) | `valor-ejemplo` |
| `code` | No | `string` | longitud mínima 1; longitud máxima 100 | Código: sólo mientras el espacio está PLANNED | `CODIGO_EJEMPLO` |
| `name` | No | `string` | longitud mínima 1; longitud máxima 200 | Nombre | `Nombre de ejemplo` |
| `formCode` | No | `string` | Sin restricción adicional declarada | Forma: sólo mientras el espacio está PLANNED | `CODIGO_EJEMPLO` |
| `functionCode` | No | `string` | Sin restricción adicional declarada | Función (valida perfil y tipología) | `CODIGO_EJEMPLO` |
| `clinicalUnitId` | No | `string` | formato `uuid`; admite null | Unidad clínica principal (misma sede); null la quita | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /care-spaces/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "description": "Texto descriptivo de ejemplo",
  "capacity": 1,
  "floorNumber": 1,
  "areaM2": 1,
  "asepsisCode": "CODIGO_EJEMPLO",
  "pressureCode": "CODIGO_EJEMPLO",
  "airChangesPerHour": 1,
  "hvacValidatedOn": "2026-07-31",
  "sexRestrictionCode": "CODIGO_EJEMPLO",
  "ageGroupCode": "CODIGO_EJEMPLO",
  "bedCategoryCode": "CODIGO_EJEMPLO",
  "censable": true,
  "prepMinutes": 1,
  "cleanupMinutes": 1,
  "gln": "valor-ejemplo",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "formCode": "CODIGO_EJEMPLO",
  "functionCode": "CODIGO_EJEMPLO",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CareSpaceDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "parentId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "form": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "function": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "operationalStatus": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "clinicalUnitId": {},
  "capacity": 1,
  "rowVersion": 1,
  "childCount": 1,
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "floorNumber": 1,
  "areaM2": 1,
  "asepsis": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pressure": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "airChangesPerHour": 1,
  "hvacValidatedOn": {},
  "sexRestriction": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "ageGroup": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "bedCategory": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "censable": true,
  "gln": "valor-ejemplo",
  "prepMinutes": 1,
  "cleanupMinutes": 1,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "path": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ],
  "children": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "function": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "operationalStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "clinicalUnitId": {},
      "capacity": 1,
      "rowVersion": 1,
      "childCount": 1
    }
  ],
  "assignments": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "role": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "derived": {
    "beds": 1,
    "censableBeds": 1,
    "activeChildren": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `floorNumber` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `areaM2` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `asepsis` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `asepsis.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `asepsis.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pressure` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `pressure.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pressure.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `airChangesPerHour` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `hvacValidatedOn` | Sí | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sexRestriction` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `sexRestriction.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sexRestriction.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `ageGroup` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `ageGroup.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `ageGroup.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `bedCategory` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `bedCategory.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `bedCategory.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `censable` | Sí | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `gln` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `prepMinutes` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `cleanupMinutes` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `validFrom` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `path` | Sí | `array<SpacePathStepDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `path[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `path[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `path[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `path[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `path[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `path[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children` | Sí | `array<CareSpaceNodeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"function":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"clinicalUnitId":{},"capacity":1,"rowVersion":1,"childCount":1}]` |
| `children[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `children[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `children[].capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `children[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `children[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `assignments` | Sí | `array<SpaceUnitAssignmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `assignments[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].clinicalUnitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].role` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `assignments[].role.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `assignments[].role.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `assignments[].validFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignments[].validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `derived` | Sí | `SpaceDerivedDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"beds":1,"censableBeds":1,"activeChildren":1}` |
| `derived.beds` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `derived.censableBeds` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `derived.activeChildren` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere administrar la organización o la sucursal de esta sede | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/care-spaces-admin.service.ts |
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
  "path": "/care-spaces/{id}"
}
```

---

## 6. POST /care-spaces/{id}/availability

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Cambiar la disponibilidad de un espacio
- **Operation ID:** `CareSpaceOpsController_changeAvailability`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.changeAvailability](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Cambiar la disponibilidad de un espacio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bloquear, desbloquear, mantenimiento, cerrar o reabrir.

### Descripción del sistema

NestJS resuelve `POST /care-spaces/{id}/availability` en `CareSpaceOpsController_changeAvailability`. El controlador delega en `CareSpaceOpsService.changeAvailability`. Valida el body como `AvailabilityChangeDto` y consume `application/json`. El tipo de retorno estático es `Promise<AvailabilityResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match-Ops` | header | Sí | `string` | Sin restricción adicional declarada | opsVersion leída (3, "3" o W/"3"). Ausente: 428; distinta: 412 OPS_VERSION_MISMATCH | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AvailabilityChangeDto`; los campos opcionales se omiten.

```http
POST /care-spaces/00000000-0000-4000-8000-000000000001/availability HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match-Ops: valor-ejemplo
Content-Type: application/json

{
  "action": "block"
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
| `action` | Sí | `string` | valores: `block`, `unblock`, `start-maintenance`, `close`, `reopen` | Sin descripción específica en el contrato OpenAPI. | `block` |
| `kindCode` | No | `string` | valores: `BLOCK_CLINICAL`, `BLOCK_ADMIN` | Sólo para `block` (por defecto BLOCK_CLINICAL) | `BLOCK_CLINICAL` |
| `reasonCode` | No | `string` | valores: `BLOCK_RSN_STAFF_SHORTAGE`, `BLOCK_RSN_ISOLATION_COHORT`, `BLOCK_RSN_PATIENT_CONDITION`, `BLOCK_RSN_EQUIPMENT_FAILURE`, `BLOCK_RSN_PREVENTIVE_MAINTENANCE`, `BLOCK_RSN_INFRASTRUCTURE`, `BLOCK_RSN_PEST_CONTROL`, `BLOCK_RSN_ADMIN_DECISION`, `BLOCK_RSN_OTHER` | Sin descripción específica en el contrato OpenAPI. | `BLOCK_RSN_STAFF_SHORTAGE` |
| `reasonText` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `startsAt` | No | `string` | formato `date-time` | Por defecto, ahora | `2026-07-31T12:00:00.000Z` |
| `expectedEndAt` | No | `string` | formato `date-time` | Obligatoria en mantenimiento | `2026-07-31T12:00:00.000Z` |
| `acknowledgeConflicts` | No | `boolean` | Sin restricción adicional declarada | Confirmar el bloqueo aunque haya compromisos futuros en la ventana | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /care-spaces/00000000-0000-4000-8000-000000000001/availability HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match-Ops: valor-ejemplo
Content-Type: application/json

{
  "action": "block",
  "kindCode": "BLOCK_CLINICAL",
  "reasonCode": "BLOCK_RSN_STAFF_SHORTAGE",
  "reasonText": "Texto descriptivo de ejemplo",
  "startsAt": "2026-07-31T12:00:00.000Z",
  "expectedEndAt": "2026-07-31T12:00:00.000Z",
  "acknowledgeConflicts": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AvailabilityResultDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<AvailabilityResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AvailabilityResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AvailabilityResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AvailabilityResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AvailabilityResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AvailabilityResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AvailabilityResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AvailabilityResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AvailabilityResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AvailabilityResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AvailabilityResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "cell": {
    "id": "00000000-0000-4000-8000-000000000001",
    "code": "CODIGO_EJEMPLO",
    "name": "Nombre de ejemplo",
    "path": [
      {
        "id": "00000000-0000-4000-8000-000000000001",
        "code": "CODIGO_EJEMPLO",
        "name": "Nombre de ejemplo",
        "form": "valor-ejemplo"
      }
    ],
    "form": "valor-ejemplo",
    "function": "valor-ejemplo",
    "lifecycle": "valor-ejemplo",
    "availability": {
      "code": "CODIGO_EJEMPLO",
      "reasonCode": "CODIGO_EJEMPLO",
      "reasonText": "Texto descriptivo de ejemplo",
      "expectedUntil": "2026-07-31T12:00:00.000Z",
      "since": "2026-07-31T12:00:00.000Z"
    },
    "hygiene": {
      "code": "CODIGO_EJEMPLO",
      "since": "2026-07-31T12:00:00.000Z",
      "terminalRequired": true
    },
    "isolation": {
      "code": "CODIGO_EJEMPLO",
      "organism": "valor-ejemplo",
      "since": "2026-07-31T12:00:00.000Z"
    },
    "occupancy": {
      "code": "CODIGO_EJEMPLO",
      "since": "2026-07-31T12:00:00.000Z",
      "encounterId": "00000000-0000-4000-8000-000000000001",
      "patient": {
        "initials": "valor-ejemplo",
        "sexCode": "CODIGO_EJEMPLO",
        "ageYears": 1
      },
      "encounterLocationId": "00000000-0000-4000-8000-000000000001"
    },
    "v2Code": "C",
    "assignable": true,
    "openCleaningOrderId": "00000000-0000-4000-8000-000000000001",
    "lastEventAt": "2026-07-31T12:00:00.000Z",
    "opsVersion": 1,
    "unitId": "00000000-0000-4000-8000-000000000001",
    "actions": [
      "valor-ejemplo"
    ]
  },
  "blockId": "00000000-0000-4000-8000-000000000001",
  "conflicts": [
    "valor-ejemplo"
  ],
  "requestId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `cell` | Sí | `BedBoardCellDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","path":[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":"valor-ejemplo"}],"form":"valor-ejemplo","function":"valor-ejemplo","lifecycle":"valor-ejemplo","availability":{"code":"CODIGO_EJEMPLO","reasonCode":"CODIGO_EJEMPLO","reasonText":"Texto descriptivo de ejemplo","expectedUntil":"2026-07-31T12:00:00.000Z","since":"2026-07-31T12:00:00.000Z"},"hygiene":{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","terminalRequired":true},"isolation":{"code":"CODIGO_EJEMPLO","organism":"valor-ejemplo","since":"2026-07-31T12:00:00.000Z"},"occupancy":{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","encounterId":"00000000-0000-4000-8000-000000000001","patient":{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1},"encounterLocationId":"00000000-0000-4000-8000-000000000001"},"v2Code":"C","assignable":true,"openCleaningOrderId":"00000000-0000-4000-8000-000000000001","lastEventAt":"2026-07-31T12:00:00.000Z","opsVersion":1,"unitId":"00000000-0000-4000-8000-000000000001","actions":["valor-ejemplo"]}` |
| `cell.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cell.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `cell.path` | Sí | `array<SpacePathItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":"valor-ejemplo"}]` |
| `cell.path[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cell.path[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.path[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `cell.path[].form` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.form` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.function` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.lifecycle` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.availability` | Sí | `AvailabilityAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","reasonCode":"CODIGO_EJEMPLO","reasonText":"Texto descriptivo de ejemplo","expectedUntil":"2026-07-31T12:00:00.000Z","since":"2026-07-31T12:00:00.000Z"}` |
| `cell.availability.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.availability.reasonCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.availability.reasonText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `cell.availability.expectedUntil` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.availability.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.hygiene` | Sí | `HygieneAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","terminalRequired":true}` |
| `cell.hygiene.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.hygiene.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.hygiene.terminalRequired` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `cell.isolation` | Sí | `IsolationAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","organism":"valor-ejemplo","since":"2026-07-31T12:00:00.000Z"}` |
| `cell.isolation.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.isolation.organism` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.isolation.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.occupancy` | Sí | `OccupancyAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","encounterId":"00000000-0000-4000-8000-000000000001","patient":{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1},"encounterLocationId":"00000000-0000-4000-8000-000000000001"}` |
| `cell.occupancy.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.occupancy.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.occupancy.encounterId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cell.occupancy.patient` | No | `BedPatientDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1}` |
| `cell.occupancy.patient.initials` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.occupancy.patient.sexCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.occupancy.patient.ageYears` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `cell.occupancy.encounterLocationId` | No | `string` | formato `uuid`; admite null | Ubicación ADT vigente; sólo con rol clínico (igual que patient) | `00000000-0000-4000-8000-000000000001` |
| `cell.v2Code` | Sí | `string` | valores: `C`, `H`, `I`, `K`, `O`, `U`, `R` | Sin descripción específica en el contrato OpenAPI. | `C` |
| `cell.assignable` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `cell.openCleaningOrderId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cell.lastEventAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.opsVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `cell.unitId` | Sí | `string` | formato `uuid`; admite null | Unidad dueña de la cama (vínculo OWNER vigente o la del espacio) | `00000000-0000-4000-8000-000000000001` |
| `cell.actions` | Sí | `array<string>` | Sin restricción adicional declarada | Acciones de F2/F3 que el actor puede hacer sobre esta cama (lo que la UI refleja; la API decide en cada endpoint) | `["valor-ejemplo"]` |
| `blockId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `conflicts` | No | `array<string>` | Sin restricción adicional declarada | Compromisos en la ventana (con acknowledgeConflicts) | `["valor-ejemplo"]` |
| `requestId` | No | `string` | Sin restricción adicional declarada | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
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
  "path": "/care-spaces/{id}/availability"
}
```

---

## 7. GET /care-spaces/{id}/blocks

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Bloqueos de un espacio
- **Operation ID:** `CareSpaceOpsController_blocks`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.blocks](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Bloqueos de un espacio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bloqueos de un espacio.

### Descripción del sistema

NestJS resuelve `GET /care-spaces/{id}/blocks` en `CareSpaceOpsController_blocks`. El controlador delega en `BedBoardReadService.blocks`. No recibe body. El tipo de retorno estático es `Promise<CareSpaceBlockDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `includeEnded` | query | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `true` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /care-spaces/00000000-0000-4000-8000-000000000001/blocks HTTP/1.1
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
GET /care-spaces/00000000-0000-4000-8000-000000000001/blocks?includeEnded=true HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CareSpaceBlockDto[]>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<CareSpaceBlockDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<CareSpaceBlockDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<CareSpaceBlockDto[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<CareSpaceBlockDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<CareSpaceBlockDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<CareSpaceBlockDto[]>` | No |
| 504 | Consulta completada correctamente. | `Promise<CareSpaceBlockDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CareSpaceBlockDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "careSpaceId": "00000000-0000-4000-8000-000000000001",
    "kindCode": "CODIGO_EJEMPLO",
    "reasonCode": "CODIGO_EJEMPLO",
    "reasonText": "Texto descriptivo de ejemplo",
    "startsAt": "2026-07-31T12:00:00.000Z",
    "expectedEndAt": "2026-07-31T12:00:00.000Z",
    "endedAt": "2026-07-31T12:00:00.000Z",
    "cancelledAt": "2026-07-31T12:00:00.000Z",
    "endNote": "valor-ejemplo",
    "cancelReason": "Texto descriptivo de ejemplo",
    "rowVersion": 1,
    "requestId": "00000000-0000-4000-8000-000000000001"
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/care-spaces/{id}/blocks"
}
```

---

## 8. GET /care-spaces/{id}/equipment

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-infrastructure`
- **Nombre:** Equipos ubicados en un espacio (F5a)
- **Operation ID:** `SpaceAssetsController_spaceEquipment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SpaceAssetsController.spaceEquipment](../../src/modules/practice/controllers/space-assets.controller.ts)

### Descripción de negocio

Equipos ubicados en un espacio (F5a). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Pestaña «Equipos»: equipos diagnósticos ubicados en el espacio.

### Descripción del sistema

NestJS resuelve `GET /care-spaces/{id}/equipment` en `SpaceAssetsController_spaceEquipment`. El controlador delega en `SpaceAssetsReadService.spaceEquipment`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /care-spaces/00000000-0000-4000-8000-000000000001/equipment HTTP/1.1
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
GET /care-spaces/00000000-0000-4000-8000-000000000001/equipment HTTP/1.1
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
  "path": "/care-spaces/{id}/equipment"
}
```

---

## 9. GET /care-spaces/{id}/history

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Historial de un espacio de atención
- **Operation ID:** `CareSpacesController_history`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpacesController.history](../../src/modules/practice/controllers/care-spaces.controller.ts)

### Descripción de negocio

Historial de un espacio de atención. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Historial de revisiones, de la más nueva a la más vieja.

### Descripción del sistema

NestJS resuelve `GET /care-spaces/{id}/history` en `CareSpacesController_history`. El controlador delega en `InfrastructureReadService.spaceHistory`. No recibe body. El tipo de retorno estático es `Promise<SpaceHistoryEntryDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /care-spaces/00000000-0000-4000-8000-000000000001/history HTTP/1.1
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
GET /care-spaces/00000000-0000-4000-8000-000000000001/history HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SpaceHistoryEntryDto[]>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<SpaceHistoryEntryDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<SpaceHistoryEntryDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<SpaceHistoryEntryDto[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<SpaceHistoryEntryDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<SpaceHistoryEntryDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<SpaceHistoryEntryDto[]>` | No |
| 504 | Consulta completada correctamente. | `Promise<SpaceHistoryEntryDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SpaceHistoryEntryDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "at": "2026-07-31T12:00:00.000Z",
    "action": "valor-ejemplo",
    "actorName": "Nombre de ejemplo",
    "reason": "Texto descriptivo de ejemplo",
    "summary": "valor-ejemplo",
    "rowVersion": 1
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/care-spaces/{id}/history"
}
```

---

## 10. POST /care-spaces/{id}/hygiene

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Marcar un espacio sucio o contaminado
- **Operation ID:** `CareSpaceOpsController_changeHygiene`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.changeHygiene](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Marcar un espacio sucio o contaminado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Marcar sucia o contaminada.

### Descripción del sistema

NestJS resuelve `POST /care-spaces/{id}/hygiene` en `CareSpaceOpsController_changeHygiene`. El controlador delega en `CareSpaceOpsService.changeHygiene`. Valida el body como `HygieneActionDto` y consume `application/json`. El tipo de retorno estático es `Promise<HygieneResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match-Ops` | header | Sí | `string` | Sin restricción adicional declarada | opsVersion leída (3, "3" o W/"3"). Ausente: 428; distinta: 412 OPS_VERSION_MISMATCH | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `HygieneActionDto`; los campos opcionales se omiten.

```http
POST /care-spaces/00000000-0000-4000-8000-000000000001/hygiene HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match-Ops: valor-ejemplo
Content-Type: application/json

{
  "action": "mark-dirty"
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
| `action` | Sí | `string` | valores: `mark-dirty`, `mark-contaminated` | Sin descripción específica en el contrato OpenAPI. | `mark-dirty` |
| `reasonText` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /care-spaces/00000000-0000-4000-8000-000000000001/hygiene HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match-Ops: valor-ejemplo
Content-Type: application/json

{
  "action": "mark-dirty",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<HygieneResultDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<HygieneResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<HygieneResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<HygieneResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<HygieneResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<HygieneResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<HygieneResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<HygieneResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<HygieneResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<HygieneResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<HygieneResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HygieneResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "cell": {
    "id": "00000000-0000-4000-8000-000000000001",
    "code": "CODIGO_EJEMPLO",
    "name": "Nombre de ejemplo",
    "path": [
      {
        "id": "00000000-0000-4000-8000-000000000001",
        "code": "CODIGO_EJEMPLO",
        "name": "Nombre de ejemplo",
        "form": "valor-ejemplo"
      }
    ],
    "form": "valor-ejemplo",
    "function": "valor-ejemplo",
    "lifecycle": "valor-ejemplo",
    "availability": {
      "code": "CODIGO_EJEMPLO",
      "reasonCode": "CODIGO_EJEMPLO",
      "reasonText": "Texto descriptivo de ejemplo",
      "expectedUntil": "2026-07-31T12:00:00.000Z",
      "since": "2026-07-31T12:00:00.000Z"
    },
    "hygiene": {
      "code": "CODIGO_EJEMPLO",
      "since": "2026-07-31T12:00:00.000Z",
      "terminalRequired": true
    },
    "isolation": {
      "code": "CODIGO_EJEMPLO",
      "organism": "valor-ejemplo",
      "since": "2026-07-31T12:00:00.000Z"
    },
    "occupancy": {
      "code": "CODIGO_EJEMPLO",
      "since": "2026-07-31T12:00:00.000Z",
      "encounterId": "00000000-0000-4000-8000-000000000001",
      "patient": {
        "initials": "valor-ejemplo",
        "sexCode": "CODIGO_EJEMPLO",
        "ageYears": 1
      },
      "encounterLocationId": "00000000-0000-4000-8000-000000000001"
    },
    "v2Code": "C",
    "assignable": true,
    "openCleaningOrderId": "00000000-0000-4000-8000-000000000001",
    "lastEventAt": "2026-07-31T12:00:00.000Z",
    "opsVersion": 1,
    "unitId": "00000000-0000-4000-8000-000000000001",
    "actions": [
      "valor-ejemplo"
    ]
  },
  "cleaningOrderId": "00000000-0000-4000-8000-000000000001",
  "requestId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `cell` | Sí | `BedBoardCellDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","path":[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":"valor-ejemplo"}],"form":"valor-ejemplo","function":"valor-ejemplo","lifecycle":"valor-ejemplo","availability":{"code":"CODIGO_EJEMPLO","reasonCode":"CODIGO_EJEMPLO","reasonText":"Texto descriptivo de ejemplo","expectedUntil":"2026-07-31T12:00:00.000Z","since":"2026-07-31T12:00:00.000Z"},"hygiene":{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","terminalRequired":true},"isolation":{"code":"CODIGO_EJEMPLO","organism":"valor-ejemplo","since":"2026-07-31T12:00:00.000Z"},"occupancy":{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","encounterId":"00000000-0000-4000-8000-000000000001","patient":{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1},"encounterLocationId":"00000000-0000-4000-8000-000000000001"},"v2Code":"C","assignable":true,"openCleaningOrderId":"00000000-0000-4000-8000-000000000001","lastEventAt":"2026-07-31T12:00:00.000Z","opsVersion":1,"unitId":"00000000-0000-4000-8000-000000000001","actions":["valor-ejemplo"]}` |
| `cell.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cell.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `cell.path` | Sí | `array<SpacePathItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":"valor-ejemplo"}]` |
| `cell.path[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cell.path[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.path[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `cell.path[].form` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.form` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.function` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.lifecycle` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.availability` | Sí | `AvailabilityAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","reasonCode":"CODIGO_EJEMPLO","reasonText":"Texto descriptivo de ejemplo","expectedUntil":"2026-07-31T12:00:00.000Z","since":"2026-07-31T12:00:00.000Z"}` |
| `cell.availability.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.availability.reasonCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.availability.reasonText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `cell.availability.expectedUntil` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.availability.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.hygiene` | Sí | `HygieneAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","terminalRequired":true}` |
| `cell.hygiene.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.hygiene.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.hygiene.terminalRequired` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `cell.isolation` | Sí | `IsolationAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","organism":"valor-ejemplo","since":"2026-07-31T12:00:00.000Z"}` |
| `cell.isolation.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.isolation.organism` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.isolation.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.occupancy` | Sí | `OccupancyAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","encounterId":"00000000-0000-4000-8000-000000000001","patient":{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1},"encounterLocationId":"00000000-0000-4000-8000-000000000001"}` |
| `cell.occupancy.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.occupancy.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.occupancy.encounterId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cell.occupancy.patient` | No | `BedPatientDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1}` |
| `cell.occupancy.patient.initials` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.occupancy.patient.sexCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.occupancy.patient.ageYears` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `cell.occupancy.encounterLocationId` | No | `string` | formato `uuid`; admite null | Ubicación ADT vigente; sólo con rol clínico (igual que patient) | `00000000-0000-4000-8000-000000000001` |
| `cell.v2Code` | Sí | `string` | valores: `C`, `H`, `I`, `K`, `O`, `U`, `R` | Sin descripción específica en el contrato OpenAPI. | `C` |
| `cell.assignable` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `cell.openCleaningOrderId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cell.lastEventAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.opsVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `cell.unitId` | Sí | `string` | formato `uuid`; admite null | Unidad dueña de la cama (vínculo OWNER vigente o la del espacio) | `00000000-0000-4000-8000-000000000001` |
| `cell.actions` | Sí | `array<string>` | Sin restricción adicional declarada | Acciones de F2/F3 que el actor puede hacer sobre esta cama (lo que la UI refleja; la API decide en cada endpoint) | `["valor-ejemplo"]` |
| `cleaningOrderId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requestId` | No | `string` | Sin restricción adicional declarada | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
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
  "path": "/care-spaces/{id}/hygiene"
}
```

---

## 11. POST /care-spaces/{id}/isolation

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Cambiar el aislamiento de un espacio
- **Operation ID:** `CareSpaceOpsController_changeIsolation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.changeIsolation](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Cambiar el aislamiento de un espacio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Poner o levantar un aislamiento.

### Descripción del sistema

NestJS resuelve `POST /care-spaces/{id}/isolation` en `CareSpaceOpsController_changeIsolation`. El controlador delega en `CareSpaceOpsService.changeIsolation`. Valida el body como `IsolationChangeDto` y consume `application/json`. El tipo de retorno estático es `Promise<IsolationResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match-Ops` | header | Sí | `string` | Sin restricción adicional declarada | opsVersion leída (3, "3" o W/"3"). Ausente: 428; distinta: 412 OPS_VERSION_MISMATCH | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IsolationChangeDto`; los campos opcionales se omiten.

```http
POST /care-spaces/00000000-0000-4000-8000-000000000001/isolation HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match-Ops: valor-ejemplo
Content-Type: application/json

{
  "isolationCode": "ISO_NONE"
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
| `isolationCode` | Sí | `string` | valores: `ISO_NONE`, `ISO_CONTACT`, `ISO_DROPLET`, `ISO_AIRBORNE`, `ISO_PROTECTIVE` | Sin descripción específica en el contrato OpenAPI. | `ISO_NONE` |
| `organismText` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `reasonText` | No | `string` | longitud máxima 500 | Obligatorio | `Texto descriptivo de ejemplo` |
| `cohortApproved` | No | `boolean` | Sin restricción adicional declarada | Cohorte avalada por control de infecciones | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /care-spaces/00000000-0000-4000-8000-000000000001/isolation HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match-Ops: valor-ejemplo
Content-Type: application/json

{
  "isolationCode": "ISO_NONE",
  "organismText": "valor-ejemplo",
  "reasonText": "Texto descriptivo de ejemplo",
  "cohortApproved": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IsolationResultDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<IsolationResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IsolationResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IsolationResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IsolationResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IsolationResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IsolationResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IsolationResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IsolationResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IsolationResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<IsolationResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IsolationResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "cell": {
    "id": "00000000-0000-4000-8000-000000000001",
    "code": "CODIGO_EJEMPLO",
    "name": "Nombre de ejemplo",
    "path": [
      {
        "id": "00000000-0000-4000-8000-000000000001",
        "code": "CODIGO_EJEMPLO",
        "name": "Nombre de ejemplo",
        "form": "valor-ejemplo"
      }
    ],
    "form": "valor-ejemplo",
    "function": "valor-ejemplo",
    "lifecycle": "valor-ejemplo",
    "availability": {
      "code": "CODIGO_EJEMPLO",
      "reasonCode": "CODIGO_EJEMPLO",
      "reasonText": "Texto descriptivo de ejemplo",
      "expectedUntil": "2026-07-31T12:00:00.000Z",
      "since": "2026-07-31T12:00:00.000Z"
    },
    "hygiene": {
      "code": "CODIGO_EJEMPLO",
      "since": "2026-07-31T12:00:00.000Z",
      "terminalRequired": true
    },
    "isolation": {
      "code": "CODIGO_EJEMPLO",
      "organism": "valor-ejemplo",
      "since": "2026-07-31T12:00:00.000Z"
    },
    "occupancy": {
      "code": "CODIGO_EJEMPLO",
      "since": "2026-07-31T12:00:00.000Z",
      "encounterId": "00000000-0000-4000-8000-000000000001",
      "patient": {
        "initials": "valor-ejemplo",
        "sexCode": "CODIGO_EJEMPLO",
        "ageYears": 1
      },
      "encounterLocationId": "00000000-0000-4000-8000-000000000001"
    },
    "v2Code": "C",
    "assignable": true,
    "openCleaningOrderId": "00000000-0000-4000-8000-000000000001",
    "lastEventAt": "2026-07-31T12:00:00.000Z",
    "opsVersion": 1,
    "unitId": "00000000-0000-4000-8000-000000000001",
    "actions": [
      "valor-ejemplo"
    ]
  },
  "companionBlocks": [
    {
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "blockId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "cleaningOrderId": "00000000-0000-4000-8000-000000000001",
  "requestId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `cell` | Sí | `BedBoardCellDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","path":[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":"valor-ejemplo"}],"form":"valor-ejemplo","function":"valor-ejemplo","lifecycle":"valor-ejemplo","availability":{"code":"CODIGO_EJEMPLO","reasonCode":"CODIGO_EJEMPLO","reasonText":"Texto descriptivo de ejemplo","expectedUntil":"2026-07-31T12:00:00.000Z","since":"2026-07-31T12:00:00.000Z"},"hygiene":{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","terminalRequired":true},"isolation":{"code":"CODIGO_EJEMPLO","organism":"valor-ejemplo","since":"2026-07-31T12:00:00.000Z"},"occupancy":{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","encounterId":"00000000-0000-4000-8000-000000000001","patient":{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1},"encounterLocationId":"00000000-0000-4000-8000-000000000001"},"v2Code":"C","assignable":true,"openCleaningOrderId":"00000000-0000-4000-8000-000000000001","lastEventAt":"2026-07-31T12:00:00.000Z","opsVersion":1,"unitId":"00000000-0000-4000-8000-000000000001","actions":["valor-ejemplo"]}` |
| `cell.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cell.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `cell.path` | Sí | `array<SpacePathItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":"valor-ejemplo"}]` |
| `cell.path[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cell.path[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.path[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `cell.path[].form` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.form` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.function` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.lifecycle` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.availability` | Sí | `AvailabilityAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","reasonCode":"CODIGO_EJEMPLO","reasonText":"Texto descriptivo de ejemplo","expectedUntil":"2026-07-31T12:00:00.000Z","since":"2026-07-31T12:00:00.000Z"}` |
| `cell.availability.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.availability.reasonCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.availability.reasonText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `cell.availability.expectedUntil` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.availability.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.hygiene` | Sí | `HygieneAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","terminalRequired":true}` |
| `cell.hygiene.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.hygiene.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.hygiene.terminalRequired` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `cell.isolation` | Sí | `IsolationAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","organism":"valor-ejemplo","since":"2026-07-31T12:00:00.000Z"}` |
| `cell.isolation.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.isolation.organism` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.isolation.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.occupancy` | Sí | `OccupancyAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","encounterId":"00000000-0000-4000-8000-000000000001","patient":{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1},"encounterLocationId":"00000000-0000-4000-8000-000000000001"}` |
| `cell.occupancy.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.occupancy.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.occupancy.encounterId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cell.occupancy.patient` | No | `BedPatientDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1}` |
| `cell.occupancy.patient.initials` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cell.occupancy.patient.sexCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cell.occupancy.patient.ageYears` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `cell.occupancy.encounterLocationId` | No | `string` | formato `uuid`; admite null | Ubicación ADT vigente; sólo con rol clínico (igual que patient) | `00000000-0000-4000-8000-000000000001` |
| `cell.v2Code` | Sí | `string` | valores: `C`, `H`, `I`, `K`, `O`, `U`, `R` | Sin descripción específica en el contrato OpenAPI. | `C` |
| `cell.assignable` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `cell.openCleaningOrderId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cell.lastEventAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cell.opsVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `cell.unitId` | Sí | `string` | formato `uuid`; admite null | Unidad dueña de la cama (vínculo OWNER vigente o la del espacio) | `00000000-0000-4000-8000-000000000001` |
| `cell.actions` | Sí | `array<string>` | Sin restricción adicional declarada | Acciones de F2/F3 que el actor puede hacer sobre esta cama (lo que la UI refleja; la API decide en cada endpoint) | `["valor-ejemplo"]` |
| `companionBlocks` | Sí | `array<CompanionBlockDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"careSpaceId":"00000000-0000-4000-8000-000000000001","blockId":"00000000-0000-4000-8000-000000000001"}]` |
| `companionBlocks[].careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `companionBlocks[].blockId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cleaningOrderId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `requestId` | No | `string` | Sin restricción adicional declarada | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
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
  "path": "/care-spaces/{id}/isolation"
}
```

---

## 12. POST /care-spaces/{id}/lifecycle

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Cambiar el ciclo de vida de un espacio
- **Operation ID:** `CareSpacesController_lifecycle`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpacesController.lifecycle](../../src/modules/practice/controllers/care-spaces.controller.ts)

### Descripción de negocio

Cambiar el ciclo de vida de un espacio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Activar, suspender, reactivar o retirar (409 con bloqueos).

### Descripción del sistema

NestJS resuelve `POST /care-spaces/{id}/lifecycle` en `CareSpacesController_lifecycle`. El controlador delega en `CareSpacesAdminService.changeLifecycle`. Valida el body como `LifecycleChangeDto` y consume `application/json`. El tipo de retorno estático es `Promise<CareSpaceDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match` | header | Sí | `string` | Sin restricción adicional declarada | rowVersion leída (3, "3" o W/"3"). Ausente o distinta: 412 | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LifecycleChangeDto`; los campos opcionales se omiten.

```http
POST /care-spaces/00000000-0000-4000-8000-000000000001/lifecycle HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "action": "activate"
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
| `action` | Sí | `string` | valores: `activate`, `suspend`, `reactivate`, `retire` | Sin descripción específica en el contrato OpenAPI. | `activate` |
| `reason` | No | `string` | longitud máxima 500 | Motivo; obligatorio para suspend y retire | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /care-spaces/00000000-0000-4000-8000-000000000001/lifecycle HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "action": "activate",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CareSpaceDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "parentId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "form": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "function": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "operationalStatus": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "clinicalUnitId": {},
  "capacity": 1,
  "rowVersion": 1,
  "childCount": 1,
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "floorNumber": 1,
  "areaM2": 1,
  "asepsis": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pressure": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "airChangesPerHour": 1,
  "hvacValidatedOn": {},
  "sexRestriction": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "ageGroup": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "bedCategory": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "censable": true,
  "gln": "valor-ejemplo",
  "prepMinutes": 1,
  "cleanupMinutes": 1,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "path": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ],
  "children": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "function": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "operationalStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "clinicalUnitId": {},
      "capacity": 1,
      "rowVersion": 1,
      "childCount": 1
    }
  ],
  "assignments": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "role": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "derived": {
    "beds": 1,
    "censableBeds": 1,
    "activeChildren": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `floorNumber` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `areaM2` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `asepsis` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `asepsis.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `asepsis.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pressure` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `pressure.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pressure.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `airChangesPerHour` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `hvacValidatedOn` | Sí | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sexRestriction` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `sexRestriction.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sexRestriction.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `ageGroup` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `ageGroup.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `ageGroup.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `bedCategory` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `bedCategory.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `bedCategory.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `censable` | Sí | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `gln` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `prepMinutes` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `cleanupMinutes` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `validFrom` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `path` | Sí | `array<SpacePathStepDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `path[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `path[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `path[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `path[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `path[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `path[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children` | Sí | `array<CareSpaceNodeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"function":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"clinicalUnitId":{},"capacity":1,"rowVersion":1,"childCount":1}]` |
| `children[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `children[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `children[].capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `children[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `children[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `assignments` | Sí | `array<SpaceUnitAssignmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `assignments[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].clinicalUnitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].role` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `assignments[].role.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `assignments[].role.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `assignments[].validFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignments[].validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `derived` | Sí | `SpaceDerivedDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"beds":1,"censableBeds":1,"activeChildren":1}` |
| `derived.beds` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `derived.censableBeds` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `derived.activeChildren` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere administrar la organización o la sucursal de esta sede | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
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
  "path": "/care-spaces/{id}/lifecycle"
}
```

---

## 13. POST /care-spaces/{id}/move

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Mover un espacio de atención
- **Operation ID:** `CareSpacesController_move`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpacesController.move](../../src/modules/practice/controllers/care-spaces.controller.ts)

### Descripción de negocio

Mover un espacio de atención. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Mover bajo otro padre (regla padre→hijo y anti-ciclo).

### Descripción del sistema

NestJS resuelve `POST /care-spaces/{id}/move` en `CareSpacesController_move`. El controlador delega en `CareSpacesAdminService.move`. Valida el body como `MoveCareSpaceDto` y consume `application/json`. El tipo de retorno estático es `Promise<CareSpaceDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match` | header | Sí | `string` | Sin restricción adicional declarada | rowVersion leída (3, "3" o W/"3"). Ausente o distinta: 412 | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `MoveCareSpaceDto`; los campos opcionales se omiten.

```http
POST /care-spaces/00000000-0000-4000-8000-000000000001/move HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
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
| `parentSpaceId` | No | `string` | formato `uuid`; admite null | Nuevo padre (misma sede); null o ausente: raíz | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /care-spaces/00000000-0000-4000-8000-000000000001/move HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "parentSpaceId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CareSpaceDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "parentId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "form": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "function": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "operationalStatus": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "clinicalUnitId": {},
  "capacity": 1,
  "rowVersion": 1,
  "childCount": 1,
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "floorNumber": 1,
  "areaM2": 1,
  "asepsis": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pressure": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "airChangesPerHour": 1,
  "hvacValidatedOn": {},
  "sexRestriction": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "ageGroup": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "bedCategory": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "censable": true,
  "gln": "valor-ejemplo",
  "prepMinutes": 1,
  "cleanupMinutes": 1,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "path": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ],
  "children": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "function": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "operationalStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "clinicalUnitId": {},
      "capacity": 1,
      "rowVersion": 1,
      "childCount": 1
    }
  ],
  "assignments": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "role": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "derived": {
    "beds": 1,
    "censableBeds": 1,
    "activeChildren": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `floorNumber` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `areaM2` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `asepsis` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `asepsis.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `asepsis.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pressure` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `pressure.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pressure.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `airChangesPerHour` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `hvacValidatedOn` | Sí | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sexRestriction` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `sexRestriction.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sexRestriction.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `ageGroup` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `ageGroup.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `ageGroup.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `bedCategory` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `bedCategory.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `bedCategory.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `censable` | Sí | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `gln` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `prepMinutes` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `cleanupMinutes` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `validFrom` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `path` | Sí | `array<SpacePathStepDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `path[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `path[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `path[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `path[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `path[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `path[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children` | Sí | `array<CareSpaceNodeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"function":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"clinicalUnitId":{},"capacity":1,"rowVersion":1,"childCount":1}]` |
| `children[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `children[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `children[].capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `children[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `children[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `assignments` | Sí | `array<SpaceUnitAssignmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `assignments[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].clinicalUnitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].role` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `assignments[].role.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `assignments[].role.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `assignments[].validFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignments[].validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `derived` | Sí | `SpaceDerivedDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"beds":1,"censableBeds":1,"activeChildren":1}` |
| `derived.beds` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `derived.censableBeds` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `derived.activeChildren` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere administrar la organización o la sucursal de esta sede | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/care-spaces-admin.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
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
  "path": "/care-spaces/{id}/move"
}
```

---

## 14. GET /care-spaces/{id}/operational-state

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Estado operativo de un espacio
- **Operation ID:** `CareSpaceOpsController_operationalState`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.operationalState](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Estado operativo de un espacio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Estado operativo de un espacio con bloqueos y orden abierta.

### Descripción del sistema

NestJS resuelve `GET /care-spaces/{id}/operational-state` en `CareSpaceOpsController_operationalState`. El controlador delega en `BedBoardReadService.operationalState`. No recibe body. El tipo de retorno estático es `Promise<OperationalStateDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /care-spaces/00000000-0000-4000-8000-000000000001/operational-state HTTP/1.1
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
GET /care-spaces/00000000-0000-4000-8000-000000000001/operational-state HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OperationalStateDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<OperationalStateDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<OperationalStateDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<OperationalStateDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<OperationalStateDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<OperationalStateDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<OperationalStateDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<OperationalStateDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OperationalStateDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "path": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": "valor-ejemplo"
    }
  ],
  "form": "valor-ejemplo",
  "function": "valor-ejemplo",
  "lifecycle": "valor-ejemplo",
  "availability": {
    "code": "CODIGO_EJEMPLO",
    "reasonCode": "CODIGO_EJEMPLO",
    "reasonText": "Texto descriptivo de ejemplo",
    "expectedUntil": "2026-07-31T12:00:00.000Z",
    "since": "2026-07-31T12:00:00.000Z"
  },
  "hygiene": {
    "code": "CODIGO_EJEMPLO",
    "since": "2026-07-31T12:00:00.000Z",
    "terminalRequired": true
  },
  "isolation": {
    "code": "CODIGO_EJEMPLO",
    "organism": "valor-ejemplo",
    "since": "2026-07-31T12:00:00.000Z"
  },
  "occupancy": {
    "code": "CODIGO_EJEMPLO",
    "since": "2026-07-31T12:00:00.000Z",
    "encounterId": "00000000-0000-4000-8000-000000000001",
    "patient": {
      "initials": "valor-ejemplo",
      "sexCode": "CODIGO_EJEMPLO",
      "ageYears": 1
    },
    "encounterLocationId": "00000000-0000-4000-8000-000000000001"
  },
  "v2Code": "C",
  "assignable": true,
  "openCleaningOrderId": "00000000-0000-4000-8000-000000000001",
  "lastEventAt": "2026-07-31T12:00:00.000Z",
  "opsVersion": 1,
  "unitId": "00000000-0000-4000-8000-000000000001",
  "actions": [
    "valor-ejemplo"
  ],
  "openBlocks": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "kindCode": "CODIGO_EJEMPLO",
      "reasonCode": "CODIGO_EJEMPLO",
      "reasonText": "Texto descriptivo de ejemplo",
      "startsAt": "2026-07-31T12:00:00.000Z",
      "expectedEndAt": "2026-07-31T12:00:00.000Z",
      "endedAt": "2026-07-31T12:00:00.000Z",
      "cancelledAt": "2026-07-31T12:00:00.000Z",
      "endNote": "valor-ejemplo",
      "cancelReason": "Texto descriptivo de ejemplo",
      "rowVersion": 1,
      "requestId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "openCleaningOrder": {
    "id": "00000000-0000-4000-8000-000000000001",
    "careSpaceId": "00000000-0000-4000-8000-000000000001",
    "careSpaceCode": "CODIGO_EJEMPLO",
    "careSpaceName": "Nombre de ejemplo",
    "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
    "typeCode": "CODIGO_EJEMPLO",
    "triggerCode": "CODIGO_EJEMPLO",
    "priorityCode": "CODIGO_EJEMPLO",
    "statusCode": "CODIGO_EJEMPLO",
    "requestedAt": "2026-07-31T12:00:00.000Z",
    "dueAt": "2026-07-31T12:00:00.000Z",
    "assignedUserId": "00000000-0000-4000-8000-000000000001",
    "startedAt": "2026-07-31T12:00:00.000Z",
    "finishedAt": "2026-07-31T12:00:00.000Z",
    "finishedByUserId": "00000000-0000-4000-8000-000000000001",
    "inspectedAt": "2026-07-31T12:00:00.000Z",
    "inspectionResult": "valor-ejemplo",
    "rejectionReason": "Texto descriptivo de ejemplo",
    "previousOrderId": "00000000-0000-4000-8000-000000000001",
    "ageMinutes": 1,
    "rowVersion": 1,
    "allowedTransitions": [
      "assign"
    ],
    "inspectionRequired": true,
    "requestId": "00000000-0000-4000-8000-000000000001"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `path` | Sí | `array<SpacePathItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":"valor-ejemplo"}]` |
| `path[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `path[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `path[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `path[].form` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `form` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `function` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `lifecycle` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `availability` | Sí | `AvailabilityAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","reasonCode":"CODIGO_EJEMPLO","reasonText":"Texto descriptivo de ejemplo","expectedUntil":"2026-07-31T12:00:00.000Z","since":"2026-07-31T12:00:00.000Z"}` |
| `availability.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `availability.reasonCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `availability.reasonText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `availability.expectedUntil` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `availability.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `hygiene` | Sí | `HygieneAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","terminalRequired":true}` |
| `hygiene.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `hygiene.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `hygiene.terminalRequired` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `isolation` | Sí | `IsolationAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","organism":"valor-ejemplo","since":"2026-07-31T12:00:00.000Z"}` |
| `isolation.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `isolation.organism` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `isolation.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `occupancy` | Sí | `OccupancyAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","encounterId":"00000000-0000-4000-8000-000000000001","patient":{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1},"encounterLocationId":"00000000-0000-4000-8000-000000000001"}` |
| `occupancy.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `occupancy.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `occupancy.encounterId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `occupancy.patient` | No | `BedPatientDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1}` |
| `occupancy.patient.initials` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `occupancy.patient.sexCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `occupancy.patient.ageYears` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `occupancy.encounterLocationId` | No | `string` | formato `uuid`; admite null | Ubicación ADT vigente; sólo con rol clínico (igual que patient) | `00000000-0000-4000-8000-000000000001` |
| `v2Code` | Sí | `string` | valores: `C`, `H`, `I`, `K`, `O`, `U`, `R` | Sin descripción específica en el contrato OpenAPI. | `C` |
| `assignable` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `openCleaningOrderId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lastEventAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `opsVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `unitId` | Sí | `string` | formato `uuid`; admite null | Unidad dueña de la cama (vínculo OWNER vigente o la del espacio) | `00000000-0000-4000-8000-000000000001` |
| `actions` | Sí | `array<string>` | Sin restricción adicional declarada | Acciones de F2/F3 que el actor puede hacer sobre esta cama (lo que la UI refleja; la API decide en cada endpoint) | `["valor-ejemplo"]` |
| `openBlocks` | Sí | `array<CareSpaceBlockDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","kindCode":"CODIGO_EJEMPLO","reasonCode":"CODIGO_EJEMPLO","reasonText":"Texto descriptivo de ejemplo","startsAt":"2026-07-31T12:00:00.000Z","expectedEndAt":"2026-07-31T12:00:00.000Z","endedAt":"2026-07-31T12:00:00.000Z","cancelledAt":"2026-07-31T12:00:00.000Z","endNote":"valor-ejemplo","cancelReason":"Texto descriptivo de ejemplo","rowVersion":1,"requestId":"00000000-0000-4000-8000-000000000001"}]` |
| `openBlocks[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `openBlocks[].careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `openBlocks[].kindCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `openBlocks[].reasonCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `openBlocks[].reasonText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `openBlocks[].startsAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `openBlocks[].expectedEndAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `openBlocks[].endedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `openBlocks[].cancelledAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `openBlocks[].endNote` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `openBlocks[].cancelReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `openBlocks[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `openBlocks[].requestId` | No | `string` | Sin restricción adicional declarada | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `00000000-0000-4000-8000-000000000001` |
| `openCleaningOrder` | Sí | `CleaningOrderDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","careSpaceCode":"CODIGO_EJEMPLO","careSpaceName":"Nombre de ejemplo","clinicalUnitId":"00000000-0000-4000-8000-000000000001","typeCode":"CODIGO_EJEMPLO","triggerCode":"CODIGO_EJEMPLO","priorityCode":"CODIGO_EJEMPLO","statusCode":"CODIGO_EJEMPLO","requestedAt":"2026-07-31T12:00:00.000Z","dueAt":"2026-07-31T12:00:00.000Z","assignedUserId":"00000000-0000-4000-8000-000000000001","startedAt":"2026-07-31T12:00:00.000Z","finishedAt":"2026-07-31T12:00:00.000Z","finishedByUserId":"00000000-0000-4000-8000-000000000001","inspectedAt":"2026-07-31T12:00:00.000Z","inspectionResult":"valor-ejemplo","rejectionReason":"Texto descriptivo de ejemplo","previousOrderId":"00000000-0000-4000-8000-000000000001","ageMinutes":1,"rowVersion":1,"allowedTransitions":["assign"],"inspectionRequired":true,"requestId":"00000000-0000-4000-8000-000000000001"}` |
| `openCleaningOrder.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `openCleaningOrder.careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `openCleaningOrder.careSpaceCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `openCleaningOrder.careSpaceName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `openCleaningOrder.clinicalUnitId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `openCleaningOrder.typeCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `openCleaningOrder.triggerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `openCleaningOrder.priorityCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `openCleaningOrder.statusCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `openCleaningOrder.requestedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `openCleaningOrder.dueAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `openCleaningOrder.assignedUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `openCleaningOrder.startedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `openCleaningOrder.finishedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `openCleaningOrder.finishedByUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `openCleaningOrder.inspectedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `openCleaningOrder.inspectionResult` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `openCleaningOrder.rejectionReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `openCleaningOrder.previousOrderId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `openCleaningOrder.ageMinutes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `openCleaningOrder.rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `openCleaningOrder.allowedTransitions` | Sí | `array<string>` | Sin restricción adicional declarada | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `["assign"]` |
| `openCleaningOrder.inspectionRequired` | Sí | `boolean` | Sin restricción adicional declarada | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `true` |
| `openCleaningOrder.requestId` | No | `string` | Sin restricción adicional declarada | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/care-spaces/{id}/operational-state"
}
```

---

## 15. GET /care-spaces/{id}/retire-check

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Bloqueos para retirar un espacio
- **Operation ID:** `CareSpacesController_retireCheck`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpacesController.retireCheck](../../src/modules/practice/controllers/care-spaces.controller.ts)

### Descripción de negocio

Bloqueos para retirar un espacio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Lo que impediría retirarlo, para mostrar antes de confirmar.

### Descripción del sistema

NestJS resuelve `GET /care-spaces/{id}/retire-check` en `CareSpacesController_retireCheck`. El controlador delega en `CareSpacesAdminService.retireCheck`. No recibe body. El tipo de retorno estático es `Promise<RetireCheckDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /care-spaces/00000000-0000-4000-8000-000000000001/retire-check HTTP/1.1
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
GET /care-spaces/00000000-0000-4000-8000-000000000001/retire-check HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RetireCheckDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<RetireCheckDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<RetireCheckDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<RetireCheckDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<RetireCheckDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<RetireCheckDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<RetireCheckDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<RetireCheckDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RetireCheckDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "blockers": [
    {
      "kind": "ACTIVE_CHILDREN",
      "count": 1,
      "sampleIds": [
        "valor-ejemplo"
      ],
      "nextAction": {
        "label": "valor-ejemplo",
        "route": "valor-ejemplo"
      }
    }
  ],
  "unverifiable": [
    {
      "kind": "valor-ejemplo",
      "why": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `blockers` | Sí | `array<BlockerDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"kind":"ACTIVE_CHILDREN","count":1,"sampleIds":["valor-ejemplo"],"nextAction":{"label":"valor-ejemplo","route":"valor-ejemplo"}}]` |
| `blockers[].kind` | Sí | `string` | valores: `ACTIVE_CHILDREN`, `ACTIVE_ENCOUNTER`, `FUTURE_PROCEDURE`, `FUTURE_BOOKING`, `SCHEDULABLE_RESOURCE`, `INVENTORY_LOCATION`, `EQUIPMENT`, `ACTIVE_CHILD_UNITS`, `ACTIVE_SPACES`, `ACTIVE_STAFF` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE_CHILDREN` |
| `blockers[].count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `blockers[].sampleIds` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `blockers[].nextAction` | Sí | `NextActionDto` | Sin restricción adicional declarada | Qué hacer para destrabarlo (S3) | `{"label":"valor-ejemplo","route":"valor-ejemplo"}` |
| `blockers[].nextAction.label` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `blockers[].nextAction.route` | No | `string` | Sin restricción adicional declarada | Ruta relativa a la ficha del espacio (p. ej. ?tab=children) | `valor-ejemplo` |
| `unverifiable` | Sí | `array<UnverifiableCheckDto>` | Sin restricción adicional declarada | Bloqueos que todavía no se pueden comprobar (sin FK al espacio) | `[{"kind":"valor-ejemplo","why":"valor-ejemplo"}]` |
| `unverifiable[].kind` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `unverifiable[].why` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/care-spaces/{id}/retire-check"
}
```

---

## 16. GET /care-spaces/{id}/status-events

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Historial de estados de un espacio (A20)
- **Operation ID:** `CareSpaceOpsController_statusEvents`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.statusEvents](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Historial de estados de un espacio (A20). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Historial A20 de un espacio.

### Descripción del sistema

NestJS resuelve `GET /care-spaces/{id}/status-events` en `CareSpaceOpsController_statusEvents`. El controlador delega en `BedBoardReadService.statusEvents`. No recibe body. El tipo de retorno estático es `Promise<StatusEventListDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `axis` | query | No | `string` | valores: `AVAILABILITY`, `HYGIENE`, `ISOLATION`, `OCCUPANCY` | Sin descripción específica en OpenAPI. | `AVAILABILITY` |
| `from` | query | No | `string` | formato `date-time` | Sin descripción específica en OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Sin descripción específica en OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | occurredAt ISO del último evento de la página anterior | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /care-spaces/00000000-0000-4000-8000-000000000001/status-events HTTP/1.1
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
GET /care-spaces/00000000-0000-4000-8000-000000000001/status-events?axis=AVAILABILITY&from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&cursor=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusEventListDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<StatusEventListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<StatusEventListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<StatusEventListDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<StatusEventListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<StatusEventListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<StatusEventListDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<StatusEventListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusEventListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "axis": "valor-ejemplo",
      "from": "valor-ejemplo",
      "to": "valor-ejemplo",
      "v2Code": "CODIGO_EJEMPLO",
      "reasonCode": "CODIGO_EJEMPLO",
      "reasonText": "Texto descriptivo de ejemplo",
      "expectedUntil": "2026-07-31T12:00:00.000Z",
      "source": "valor-ejemplo",
      "sourceRefId": "00000000-0000-4000-8000-000000000001",
      "occurredAt": "2026-07-31T12:00:00.000Z",
      "recordedByUserId": "00000000-0000-4000-8000-000000000001",
      "requestId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<StatusEventDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","axis":"valor-ejemplo","from":"valor-ejemplo","to":"valor-ejemplo","v2Code":"CODIGO_EJEMPLO","reasonCode":"CODIGO_EJEMPLO","reasonText":"Texto descriptivo de ejemplo","expectedUntil":"2026-07-31T12:00:00.000Z","source":"valor-ejemplo","sourceRefId":"00000000-0000-4000-8000-000000000001","occurredAt":"2026-07-31T12:00:00.000Z","recordedByUserId":"00000000-0000-4000-8000-000000000001","requestId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].axis` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].from` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].to` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].v2Code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].reasonCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].reasonText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `items[].expectedUntil` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].source` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].sourceRefId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].occurredAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].recordedByUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].requestId` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/care-spaces/{id}/status-events"
}
```

---

## 17. GET /care-spaces/{id}/stock

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-infrastructure`
- **Nombre:** Stock ubicado en un espacio (F5c)
- **Operation ID:** `SpaceAssetsController_stock`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SpaceAssetsController.stock](../../src/modules/practice/controllers/space-assets.controller.ts)

### Descripción de negocio

Stock ubicado en un espacio (F5c). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Pestaña «Stock»: ubicaciones de inventario del espacio y farmacias de la sede.

### Descripción del sistema

NestJS resuelve `GET /care-spaces/{id}/stock` en `SpaceAssetsController_stock`. El controlador delega en `SpaceAssetsReadService.stock`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /care-spaces/00000000-0000-4000-8000-000000000001/stock HTTP/1.1
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
GET /care-spaces/00000000-0000-4000-8000-000000000001/stock HTTP/1.1
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
  "path": "/care-spaces/{id}/stock"
}
```

---

## 18. POST /care-spaces/{id}/unit-assignments

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Vincular un espacio a una unidad clínica
- **Operation ID:** `CareSpacesController_addAssignment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpacesController.addAssignment](../../src/modules/practice/controllers/care-spaces.controller.ts)

### Descripción de negocio

Vincular un espacio a una unidad clínica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Vincular a una unidad clínica (un solo OWNER vigente).

### Descripción del sistema

NestJS resuelve `POST /care-spaces/{id}/unit-assignments` en `CareSpacesController_addAssignment`. El controlador delega en `CareSpacesAdminService.addAssignment`. Valida el body como `CreateUnitAssignmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<SpaceUnitAssignmentDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateUnitAssignmentDto`; los campos opcionales se omiten.

```http
POST /care-spaces/00000000-0000-4000-8000-000000000001/unit-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "roleCode": "SPACE_UNIT_ROLE_OWNER"
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
| `clinicalUnitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `roleCode` | Sí | `string` | valores: `SPACE_UNIT_ROLE_OWNER`, `SPACE_UNIT_ROLE_SHARED`, `SPACE_UNIT_ROLE_LOAN` | Sin descripción específica en el contrato OpenAPI. | `SPACE_UNIT_ROLE_OWNER` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /care-spaces/00000000-0000-4000-8000-000000000001/unit-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "roleCode": "SPACE_UNIT_ROLE_OWNER"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SpaceUnitAssignmentDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<SpaceUnitAssignmentDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SpaceUnitAssignmentDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SpaceUnitAssignmentDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SpaceUnitAssignmentDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SpaceUnitAssignmentDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SpaceUnitAssignmentDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SpaceUnitAssignmentDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SpaceUnitAssignmentDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SpaceUnitAssignmentDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SpaceUnitAssignmentDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SpaceUnitAssignmentDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "role": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `role` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `role.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `role.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `validFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere administrar la organización o la sucursal de esta sede | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/care-spaces-admin.service.ts |
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
  "path": "/care-spaces/{id}/unit-assignments"
}
```

---

## 19. DELETE /care-spaces/{id}/unit-assignments/{assignmentId}

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Desvincular un espacio de una unidad clínica
- **Operation ID:** `CareSpacesController_removeAssignment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpacesController.removeAssignment](../../src/modules/practice/controllers/care-spaces.controller.ts)

### Descripción de negocio

Desvincular un espacio de una unidad clínica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Cerrar un vínculo vigente (no se borra: queda con `valid_to`).

### Descripción del sistema

NestJS resuelve `DELETE /care-spaces/{id}/unit-assignments/{assignmentId}` en `CareSpacesController_removeAssignment`. El controlador delega en `CareSpacesAdminService.removeAssignment`. No recibe body. El tipo de retorno estático es `Promise<AssignmentRemovedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignmentId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /care-spaces/00000000-0000-4000-8000-000000000001/unit-assignments/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`, `assignmentId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /care-spaces/00000000-0000-4000-8000-000000000001/unit-assignments/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AssignmentRemovedDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<AssignmentRemovedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AssignmentRemovedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AssignmentRemovedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AssignmentRemovedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AssignmentRemovedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AssignmentRemovedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AssignmentRemovedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AssignmentRemovedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AssignmentRemovedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AssignmentRemovedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere administrar la organización o la sucursal de esta sede | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Vínculo no encontrado | Excepción explícita en src/modules/practice/services/care-spaces-admin.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/care-spaces/{id}/unit-assignments/{assignmentId}"
}
```

---

## 20. POST /cleaning-orders/{id}/assign

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Asignar una orden de limpieza
- **Operation ID:** `CareSpaceOpsController_assign`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.assign](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Asignar una orden de limpieza. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Asignar (o desasignar) una orden.

### Descripción del sistema

NestJS resuelve `POST /cleaning-orders/{id}/assign` en `CareSpaceOpsController_assign`. El controlador delega en `CleaningOrdersService.assign`. Valida el body como `AssignCleaningOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<CleaningOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match` | header | Sí | `string` | Sin restricción adicional declarada | rowVersion de la orden. Ausente: 428; distinta: 412 | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AssignCleaningOrderDto`; los campos opcionales se omiten.

```http
POST /cleaning-orders/00000000-0000-4000-8000-000000000001/assign HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001"
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
| `userId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /cleaning-orders/00000000-0000-4000-8000-000000000001/assign HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CleaningOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "careSpaceCode": "CODIGO_EJEMPLO",
  "careSpaceName": "Nombre de ejemplo",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "typeCode": "CODIGO_EJEMPLO",
  "triggerCode": "CODIGO_EJEMPLO",
  "priorityCode": "CODIGO_EJEMPLO",
  "statusCode": "CODIGO_EJEMPLO",
  "requestedAt": "2026-07-31T12:00:00.000Z",
  "dueAt": "2026-07-31T12:00:00.000Z",
  "assignedUserId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "finishedAt": "2026-07-31T12:00:00.000Z",
  "finishedByUserId": "00000000-0000-4000-8000-000000000001",
  "inspectedAt": "2026-07-31T12:00:00.000Z",
  "inspectionResult": "valor-ejemplo",
  "rejectionReason": "Texto descriptivo de ejemplo",
  "previousOrderId": "00000000-0000-4000-8000-000000000001",
  "ageMinutes": 1,
  "rowVersion": 1,
  "allowedTransitions": [
    "assign"
  ],
  "inspectionRequired": true,
  "requestId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `careSpaceName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `clinicalUnitId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `typeCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `triggerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `priorityCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `statusCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `requestedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `dueAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignedUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `startedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `finishedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `finishedByUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `inspectedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `inspectionResult` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `previousOrderId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ageMinutes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `allowedTransitions` | Sí | `array<string>` | Sin restricción adicional declarada | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `["assign"]` |
| `inspectionRequired` | Sí | `boolean` | Sin restricción adicional declarada | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `true` |
| `requestId` | No | `string` | Sin restricción adicional declarada | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/practice/services/ops/use-cases/cleaning-order.use-cases.ts |
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
  "path": "/cleaning-orders/{id}/assign"
}
```

---

## 21. POST /cleaning-orders/{id}/cancel

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Cancelar una orden de limpieza
- **Operation ID:** `CareSpaceOpsController_cancel`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.cancel](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Cancelar una orden de limpieza. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Cancelar una orden.

### Descripción del sistema

NestJS resuelve `POST /cleaning-orders/{id}/cancel` en `CareSpaceOpsController_cancel`. El controlador delega en `CleaningOrdersService.cancel`. Valida el body como `CancelCleaningOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<CleaningOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match` | header | Sí | `string` | Sin restricción adicional declarada | rowVersion de la orden. Ausente: 428; distinta: 412 | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CancelCleaningOrderDto`; los campos opcionales se omiten.

```http
POST /cleaning-orders/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
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
| `reason` | Sí | `string` | longitud mínima 1; longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /cleaning-orders/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CleaningOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "careSpaceCode": "CODIGO_EJEMPLO",
  "careSpaceName": "Nombre de ejemplo",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "typeCode": "CODIGO_EJEMPLO",
  "triggerCode": "CODIGO_EJEMPLO",
  "priorityCode": "CODIGO_EJEMPLO",
  "statusCode": "CODIGO_EJEMPLO",
  "requestedAt": "2026-07-31T12:00:00.000Z",
  "dueAt": "2026-07-31T12:00:00.000Z",
  "assignedUserId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "finishedAt": "2026-07-31T12:00:00.000Z",
  "finishedByUserId": "00000000-0000-4000-8000-000000000001",
  "inspectedAt": "2026-07-31T12:00:00.000Z",
  "inspectionResult": "valor-ejemplo",
  "rejectionReason": "Texto descriptivo de ejemplo",
  "previousOrderId": "00000000-0000-4000-8000-000000000001",
  "ageMinutes": 1,
  "rowVersion": 1,
  "allowedTransitions": [
    "assign"
  ],
  "inspectionRequired": true,
  "requestId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `careSpaceName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `clinicalUnitId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `typeCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `triggerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `priorityCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `statusCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `requestedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `dueAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignedUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `startedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `finishedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `finishedByUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `inspectedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `inspectionResult` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `previousOrderId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ageMinutes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `allowedTransitions` | Sí | `array<string>` | Sin restricción adicional declarada | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `["assign"]` |
| `inspectionRequired` | Sí | `boolean` | Sin restricción adicional declarada | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `true` |
| `requestId` | No | `string` | Sin restricción adicional declarada | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/cleaning-orders/{id}/cancel"
}
```

---

## 22. POST /cleaning-orders/{id}/finish

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Terminar una orden de limpieza
- **Operation ID:** `CareSpaceOpsController_finish`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.finish](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Terminar una orden de limpieza. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Terminar la limpieza.

### Descripción del sistema

NestJS resuelve `POST /cleaning-orders/{id}/finish` en `CareSpaceOpsController_finish`. El controlador delega en `CleaningOrdersService.finish`. Valida el body como `FinishCleaningOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<CleaningOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match` | header | Sí | `string` | Sin restricción adicional declarada | rowVersion de la orden. Ausente: 428; distinta: 412 | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `FinishCleaningOrderDto`; los campos opcionales se omiten.

```http
POST /cleaning-orders/00000000-0000-4000-8000-000000000001/finish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
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
| `note` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /cleaning-orders/00000000-0000-4000-8000-000000000001/finish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CleaningOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "careSpaceCode": "CODIGO_EJEMPLO",
  "careSpaceName": "Nombre de ejemplo",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "typeCode": "CODIGO_EJEMPLO",
  "triggerCode": "CODIGO_EJEMPLO",
  "priorityCode": "CODIGO_EJEMPLO",
  "statusCode": "CODIGO_EJEMPLO",
  "requestedAt": "2026-07-31T12:00:00.000Z",
  "dueAt": "2026-07-31T12:00:00.000Z",
  "assignedUserId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "finishedAt": "2026-07-31T12:00:00.000Z",
  "finishedByUserId": "00000000-0000-4000-8000-000000000001",
  "inspectedAt": "2026-07-31T12:00:00.000Z",
  "inspectionResult": "valor-ejemplo",
  "rejectionReason": "Texto descriptivo de ejemplo",
  "previousOrderId": "00000000-0000-4000-8000-000000000001",
  "ageMinutes": 1,
  "rowVersion": 1,
  "allowedTransitions": [
    "assign"
  ],
  "inspectionRequired": true,
  "requestId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `careSpaceName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `clinicalUnitId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `typeCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `triggerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `priorityCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `statusCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `requestedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `dueAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignedUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `startedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `finishedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `finishedByUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `inspectedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `inspectionResult` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `previousOrderId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ageMinutes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `allowedTransitions` | Sí | `array<string>` | Sin restricción adicional declarada | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `["assign"]` |
| `inspectionRequired` | Sí | `boolean` | Sin restricción adicional declarada | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `true` |
| `requestId` | No | `string` | Sin restricción adicional declarada | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/cleaning-orders/{id}/finish"
}
```

---

## 23. POST /cleaning-orders/{id}/inspect

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Inspeccionar una limpieza
- **Operation ID:** `CareSpaceOpsController_inspect`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.inspect](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Inspeccionar una limpieza. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Inspeccionar (PASS / FAIL).

### Descripción del sistema

NestJS resuelve `POST /cleaning-orders/{id}/inspect` en `CareSpaceOpsController_inspect`. El controlador delega en `CleaningOrdersService.inspect`. Valida el body como `InspectCleaningOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<{ order: CleaningOrderDto; nextOrderId: string | null }>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match` | header | Sí | `string` | Sin restricción adicional declarada | rowVersion de la orden. Ausente: 428; distinta: 412 | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `InspectCleaningOrderDto`; los campos opcionales se omiten.

```http
POST /cleaning-orders/00000000-0000-4000-8000-000000000001/inspect HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "result": "PASS"
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
| `result` | Sí | `string` | valores: `PASS`, `FAIL` | Sin descripción específica en el contrato OpenAPI. | `PASS` |
| `reasonText` | No | `string` | longitud máxima 500 | Obligatorio con FAIL | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /cleaning-orders/00000000-0000-4000-8000-000000000001/inspect HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "result": "PASS",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<{ order: CleaningOrderDto; nextOrderId: string | null }>` | Sí |
| 400 | Operación completada correctamente. | `Promise<{ order: CleaningOrderDto; nextOrderId: string | null }>` | No |
| 401 | Operación completada correctamente. | `Promise<{ order: CleaningOrderDto; nextOrderId: string | null }>` | No |
| 403 | Operación completada correctamente. | `Promise<{ order: CleaningOrderDto; nextOrderId: string | null }>` | No |
| 404 | Operación completada correctamente. | `Promise<{ order: CleaningOrderDto; nextOrderId: string | null }>` | No |
| 409 | Operación completada correctamente. | `Promise<{ order: CleaningOrderDto; nextOrderId: string | null }>` | No |
| 413 | Operación completada correctamente. | `Promise<{ order: CleaningOrderDto; nextOrderId: string | null }>` | No |
| 422 | Operación completada correctamente. | `Promise<{ order: CleaningOrderDto; nextOrderId: string | null }>` | No |
| 429 | Operación completada correctamente. | `Promise<{ order: CleaningOrderDto; nextOrderId: string | null }>` | No |
| 500 | Operación completada correctamente. | `Promise<{ order: CleaningOrderDto; nextOrderId: string | null }>` | No |
| 504 | Operación completada correctamente. | `Promise<{ order: CleaningOrderDto; nextOrderId: string | null }>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ order: CleaningOrderDto; nextOrderId: string | null }`. Ejemplo completo derivado de ese DTO:

```json
{
  "order": {
    "id": "00000000-0000-4000-8000-000000000001",
    "careSpaceId": "00000000-0000-4000-8000-000000000001",
    "careSpaceCode": "CODIGO_EJEMPLO",
    "careSpaceName": "Nombre de ejemplo",
    "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
    "typeCode": "CODIGO_EJEMPLO",
    "triggerCode": "CODIGO_EJEMPLO",
    "priorityCode": "CODIGO_EJEMPLO",
    "statusCode": "CODIGO_EJEMPLO",
    "requestedAt": "2026-07-31T12:00:00.000Z",
    "dueAt": "2026-07-31T12:00:00.000Z",
    "assignedUserId": "00000000-0000-4000-8000-000000000001",
    "startedAt": "2026-07-31T12:00:00.000Z",
    "finishedAt": "2026-07-31T12:00:00.000Z",
    "finishedByUserId": "00000000-0000-4000-8000-000000000001",
    "inspectedAt": "2026-07-31T12:00:00.000Z",
    "inspectionResult": "valor-ejemplo",
    "rejectionReason": "Texto descriptivo de ejemplo",
    "previousOrderId": "00000000-0000-4000-8000-000000000001",
    "ageMinutes": 1,
    "rowVersion": 1,
    "allowedTransitions": [
      "assign"
    ],
    "inspectionRequired": true,
    "requestId": "00000000-0000-4000-8000-000000000001"
  },
  "nextOrderId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `order` | Sí | `CleaningOrderDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","careSpaceCode":"CODIGO_EJEMPLO","careSpaceName":"Nombre de ejemplo","clinicalUnitId":"00000000-0000-4000-8000-000000000001","typeCode":"CODIGO_EJEMPLO","triggerCode":"CODIGO_EJEMPLO","priorityCode":"CODIGO_EJEMPLO","statusCode":"CODIGO_EJEMPLO","requestedAt":"2026-07-31T12:00:00.000Z","dueAt":"2026-07-31T12:00:00.000Z","assignedUserId":"00000000-0000-4000-8000-000000000001","startedAt":"2026-07-31T12:00:00.000Z","finishedAt":"2026-07-31T12:00:00.000Z","finishedByUserId":"00000000-0000-4000-8000-000000000001","inspectedAt":"2026-07-31T12:00:00.000Z","inspectionResult":"valor-ejemplo","rejectionReason":"Texto descriptivo de ejemplo","previousOrderId":"00000000-0000-4000-8000-000000000001","ageMinutes":1,"rowVersion":1,"allowedTransitions":["assign"],"inspectionRequired":true,"requestId":"00000000-0000-4000-8000-000000000001"}` |
| `order.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `order.careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `order.careSpaceCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `order.careSpaceName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `order.clinicalUnitId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `order.typeCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `order.triggerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `order.priorityCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `order.statusCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `order.requestedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `order.dueAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `order.assignedUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `order.startedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `order.finishedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `order.finishedByUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `order.inspectedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `order.inspectionResult` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `order.rejectionReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `order.previousOrderId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `order.ageMinutes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `order.rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `order.allowedTransitions` | Sí | `array<string>` | Sin restricción adicional declarada | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `["assign"]` |
| `order.inspectionRequired` | Sí | `boolean` | Sin restricción adicional declarada | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `true` |
| `order.requestId` | No | `string` | Sin restricción adicional declarada | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `00000000-0000-4000-8000-000000000001` |
| `nextOrderId` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/cleaning-orders/{id}/inspect"
}
```

---

## 24. POST /cleaning-orders/{id}/start

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Iniciar una orden de limpieza
- **Operation ID:** `CareSpaceOpsController_start`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.start](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Iniciar una orden de limpieza. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Iniciar la limpieza.

### Descripción del sistema

NestJS resuelve `POST /cleaning-orders/{id}/start` en `CareSpaceOpsController_start`. El controlador delega en `CleaningOrdersService.start`. No recibe body. El tipo de retorno estático es `Promise<CleaningOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match` | header | Sí | `string` | Sin restricción adicional declarada | rowVersion de la orden. Ausente: 428; distinta: 412 | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /cleaning-orders/00000000-0000-4000-8000-000000000001/start HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /cleaning-orders/00000000-0000-4000-8000-000000000001/start HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CleaningOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "careSpaceCode": "CODIGO_EJEMPLO",
  "careSpaceName": "Nombre de ejemplo",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "typeCode": "CODIGO_EJEMPLO",
  "triggerCode": "CODIGO_EJEMPLO",
  "priorityCode": "CODIGO_EJEMPLO",
  "statusCode": "CODIGO_EJEMPLO",
  "requestedAt": "2026-07-31T12:00:00.000Z",
  "dueAt": "2026-07-31T12:00:00.000Z",
  "assignedUserId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "finishedAt": "2026-07-31T12:00:00.000Z",
  "finishedByUserId": "00000000-0000-4000-8000-000000000001",
  "inspectedAt": "2026-07-31T12:00:00.000Z",
  "inspectionResult": "valor-ejemplo",
  "rejectionReason": "Texto descriptivo de ejemplo",
  "previousOrderId": "00000000-0000-4000-8000-000000000001",
  "ageMinutes": 1,
  "rowVersion": 1,
  "allowedTransitions": [
    "assign"
  ],
  "inspectionRequired": true,
  "requestId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `careSpaceName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `clinicalUnitId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `typeCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `triggerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `priorityCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `statusCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `requestedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `dueAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignedUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `startedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `finishedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `finishedByUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `inspectedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `inspectionResult` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `previousOrderId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ageMinutes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `allowedTransitions` | Sí | `array<string>` | Sin restricción adicional declarada | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `["assign"]` |
| `inspectionRequired` | Sí | `boolean` | Sin restricción adicional declarada | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `true` |
| `requestId` | No | `string` | Sin restricción adicional declarada | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `00000000-0000-4000-8000-000000000001` |

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
  "path": "/cleaning-orders/{id}/start"
}
```

---

## 25. GET /clinical-units/{id}

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Ficha de una unidad clínica
- **Operation ID:** `ClinicalUnitsController_detail`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalUnitsController.detail](../../src/modules/practice/controllers/clinical-units.controller.ts)

### Descripción de negocio

Ficha de una unidad clínica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ficha de la unidad: hijas, espacios y vínculos.

### Descripción del sistema

NestJS resuelve `GET /clinical-units/{id}` en `ClinicalUnitsController_detail`. El controlador delega en `ClinicalUnitsAdminService.detail`. No recibe body. El tipo de retorno estático es `Promise<ClinicalUnitDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /clinical-units/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /clinical-units/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClinicalUnitDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "parentId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "responsibleUserId": {},
  "rowVersion": 1,
  "childCount": 1,
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "children": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "responsibleUserId": {},
      "rowVersion": 1,
      "childCount": 1
    }
  ],
  "spaces": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "function": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "operationalStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "clinicalUnitId": {},
      "capacity": 1,
      "rowVersion": 1,
      "childCount": 1
    }
  ],
  "assignments": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "role": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `responsibleUserId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `children` | Sí | `array<ClinicalUnitNodeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","description":"Texto descriptivo de ejemplo","status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"responsibleUserId":{},"rowVersion":1,"childCount":1}]` |
| `children[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `children[].description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `children[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].responsibleUserId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `children[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `children[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `spaces` | Sí | `array<CareSpaceNodeDto>` | Sin restricción adicional declarada | Espacios con esta unidad principal | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"function":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"clinicalUnitId":{},"capacity":1,"rowVersion":1,"childCount":1}]` |
| `spaces[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `spaces[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `spaces[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `spaces[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `spaces[].capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `spaces[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `spaces[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `assignments` | Sí | `array<SpaceUnitAssignmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `assignments[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].clinicalUnitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].role` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `assignments[].role.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `assignments[].role.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `assignments[].validFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignments[].validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/clinical-units/{id}"
}
```

---

## 26. PATCH /clinical-units/{id}

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Editar una unidad clínica
- **Operation ID:** `ClinicalUnitsController_update`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalUnitsController.update](../../src/modules/practice/controllers/clinical-units.controller.ts)

### Descripción de negocio

Editar una unidad clínica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Editar la unidad.

### Descripción del sistema

NestJS resuelve `PATCH /clinical-units/{id}` en `ClinicalUnitsController_update`. El controlador delega en `ClinicalUnitsAdminService.update`. Valida el body como `UpdateClinicalUnitDto` y consume `application/json`. El tipo de retorno estático es `Promise<ClinicalUnitDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match` | header | Sí | `string` | Sin restricción adicional declarada | rowVersion leída. Ausente o distinta: 412 | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateClinicalUnitDto`; los campos opcionales se omiten.

```http
PATCH /clinical-units/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
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
| `code` | No | `string` | longitud mínima 1; longitud máxima 100 | Código: sólo mientras está PLANNED | `CODIGO_EJEMPLO` |
| `name` | No | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `description` | No | `string` | longitud máxima 1000; admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `parentUnitId` | No | `string` | formato `uuid`; admite null | Unidad padre (misma sede); null: raíz | `00000000-0000-4000-8000-000000000001` |
| `responsibleUserId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specialtyConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /clinical-units/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "parentUnitId": "00000000-0000-4000-8000-000000000001",
  "responsibleUserId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClinicalUnitDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "parentId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "responsibleUserId": {},
  "rowVersion": 1,
  "childCount": 1,
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "children": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "responsibleUserId": {},
      "rowVersion": 1,
      "childCount": 1
    }
  ],
  "spaces": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "function": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "operationalStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "clinicalUnitId": {},
      "capacity": 1,
      "rowVersion": 1,
      "childCount": 1
    }
  ],
  "assignments": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "role": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `responsibleUserId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `children` | Sí | `array<ClinicalUnitNodeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","description":"Texto descriptivo de ejemplo","status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"responsibleUserId":{},"rowVersion":1,"childCount":1}]` |
| `children[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `children[].description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `children[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].responsibleUserId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `children[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `children[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `spaces` | Sí | `array<CareSpaceNodeDto>` | Sin restricción adicional declarada | Espacios con esta unidad principal | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"function":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"clinicalUnitId":{},"capacity":1,"rowVersion":1,"childCount":1}]` |
| `spaces[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `spaces[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `spaces[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `spaces[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `spaces[].capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `spaces[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `spaces[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `assignments` | Sí | `array<SpaceUnitAssignmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `assignments[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].clinicalUnitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].role` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `assignments[].role.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `assignments[].role.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `assignments[].validFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignments[].validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere administrar la organización o la sucursal de esta sede | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
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
  "path": "/clinical-units/{id}"
}
```

---

## 27. POST /clinical-units/{id}/lifecycle

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Cambiar el ciclo de vida de una unidad clínica
- **Operation ID:** `ClinicalUnitsController_lifecycle`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ClinicalUnitsController.lifecycle](../../src/modules/practice/controllers/clinical-units.controller.ts)

### Descripción de negocio

Cambiar el ciclo de vida de una unidad clínica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Cambiar el ciclo de vida (409 con bloqueos).

### Descripción del sistema

NestJS resuelve `POST /clinical-units/{id}/lifecycle` en `ClinicalUnitsController_lifecycle`. El controlador delega en `ClinicalUnitsAdminService.changeLifecycle`. Valida el body como `LifecycleChangeDto` y consume `application/json`. El tipo de retorno estático es `Promise<ClinicalUnitDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match` | header | Sí | `string` | Sin restricción adicional declarada | rowVersion leída. Ausente o distinta: 412 | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LifecycleChangeDto`; los campos opcionales se omiten.

```http
POST /clinical-units/00000000-0000-4000-8000-000000000001/lifecycle HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "action": "activate"
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
| `action` | Sí | `string` | valores: `activate`, `suspend`, `reactivate`, `retire` | Sin descripción específica en el contrato OpenAPI. | `activate` |
| `reason` | No | `string` | longitud máxima 500 | Motivo; obligatorio para suspend y retire | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /clinical-units/00000000-0000-4000-8000-000000000001/lifecycle HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "action": "activate",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ClinicalUnitDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClinicalUnitDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "parentId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "responsibleUserId": {},
  "rowVersion": 1,
  "childCount": 1,
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "children": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "responsibleUserId": {},
      "rowVersion": 1,
      "childCount": 1
    }
  ],
  "spaces": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "function": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "operationalStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "clinicalUnitId": {},
      "capacity": 1,
      "rowVersion": 1,
      "childCount": 1
    }
  ],
  "assignments": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "role": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `responsibleUserId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `children` | Sí | `array<ClinicalUnitNodeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","description":"Texto descriptivo de ejemplo","status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"responsibleUserId":{},"rowVersion":1,"childCount":1}]` |
| `children[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `children[].description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `children[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].responsibleUserId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `children[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `children[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `spaces` | Sí | `array<CareSpaceNodeDto>` | Sin restricción adicional declarada | Espacios con esta unidad principal | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"function":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"clinicalUnitId":{},"capacity":1,"rowVersion":1,"childCount":1}]` |
| `spaces[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `spaces[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `spaces[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `spaces[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `spaces[].capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `spaces[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `spaces[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `assignments` | Sí | `array<SpaceUnitAssignmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `assignments[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].clinicalUnitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].role` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `assignments[].role.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `assignments[].role.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `assignments[].validFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignments[].validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere administrar la organización o la sucursal de esta sede | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
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
  "path": "/clinical-units/{id}/lifecycle"
}
```

---

## 28. POST /internal/practice/blocks-tick

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Aplicar bloqueos programados y avisar vencidos (worker)
- **Operation ID:** `CareSpaceOpsController_blocksTick`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.blocksTick](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Aplicar bloqueos programados y avisar vencidos (worker). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Tick del worker: aplica bloqueos programados y avisa vencidos.

### Descripción del sistema

NestJS resuelve `POST /internal/practice/blocks-tick` en `CareSpaceOpsController_blocksTick`. El controlador delega en `CareSpaceOpsService.runBlocksTick`. No recibe body. El tipo de retorno estático es `Promise<BlocksTickResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /internal/practice/blocks-tick HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SYSTEM_WORKER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /internal/practice/blocks-tick HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BlocksTickResultDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<BlocksTickResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BlocksTickResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BlocksTickResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BlocksTickResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BlocksTickResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BlocksTickResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BlocksTickResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<BlocksTickResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BlocksTickResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "applied": 1,
  "overdue": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `applied` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `overdue` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SYSTEM_WORKER. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/practice/blocks-tick"
}
```

---

## 29. POST /inventory-items/{itemId}/movements

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Registrar un movimiento de inventario (ajuste de stock)
- **Operation ID:** `InventoryItemsController_recordMovement`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InventoryItemsController.recordMovement](../../src/modules/practice/controllers/inventory-items.controller.ts)

### Descripción de negocio

Registrar un movimiento de inventario (ajuste de stock). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /inventory-items/{itemId}/movements` en `InventoryItemsController_recordMovement`. El controlador delega en `PracticeInventoryService.recordMovement`. Valida el body como `CreateMovementDto` y consume `application/json`. El tipo de retorno estático es `Promise<MovementResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `itemId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateMovementDto`; los campos opcionales se omiten.

```http
POST /inventory-items/00000000-0000-4000-8000-000000000001/movements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "direction": "IN",
  "quantity": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `itemId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `direction` | Sí | `string` | valores: `IN`, `OUT`, `ADJUST` | Sentido del movimiento | `IN` |
| `quantity` | Sí | `number` | mayor que 0 | Cantidad (positiva) | `1` |
| `relatedResourceType` | No | `string` | longitud máxima 100 | Tipo de recurso relacionado | `valor-ejemplo` |
| `relatedResourceId` | No | `string` | formato `uuid` | Id del recurso relacionado | `00000000-0000-4000-8000-000000000001` |
| `occurredAt` | No | `string` | formato `date-time` | Momento en que ocurrió (ISO datetime) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /inventory-items/00000000-0000-4000-8000-000000000001/movements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "direction": "IN",
  "quantity": 1,
  "relatedResourceType": "valor-ejemplo",
  "relatedResourceId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MovementResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<MovementResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MovementResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "inventoryItemId": "00000000-0000-4000-8000-000000000001",
  "quantityOnHand": "valor-ejemplo",
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `inventoryItemId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a inventory item. | `00000000-0000-4000-8000-000000000001` |
| `quantityOnHand` | Sí | `string` | Sin restricción adicional declarada | Valor de quantity on hand mantenido por la instancia. | `valor-ejemplo` |
| `recordedAt` | Sí | `string` | formato `date-time` | Valor de recorded at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El insumo no está activo | Excepción explícita en src/modules/practice/services/practice-inventory.service.ts |
| 422 | `PRECONDITION_FAILED` | Stock insuficiente para la salida | Excepción explícita en src/modules/practice/services/practice-inventory.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/inventory-items/{itemId}/movements"
}
```

---

## 30. GET /practice/infrastructure-access/me

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Acceso del actor a la infraestructura del tenant activo
- **Operation ID:** `InfrastructureAccessController_read`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InfrastructureAccessController.read](../../src/modules/practice/controllers/infrastructure-access.controller.ts)

### Descripción de negocio

Acceso del actor a la infraestructura del tenant activo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Sedes, roles, asignaciones y acciones del actor (lo que la UI refleja).

### Descripción del sistema

NestJS resuelve `GET /practice/infrastructure-access/me` en `InfrastructureAccessController_read`. El controlador delega en `InfrastructureAccessMeService.me`. No recibe body. El tipo de retorno estático es `Promise<InfraAccessMeDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /practice/infrastructure-access/me HTTP/1.1
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
GET /practice/infrastructure-access/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<InfraAccessMeDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<InfraAccessMeDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<InfraAccessMeDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<InfraAccessMeDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<InfraAccessMeDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<InfraAccessMeDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<InfraAccessMeDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InfraAccessMeDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sites": [
    {
      "siteId": "00000000-0000-4000-8000-000000000001",
      "practiceId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "timeZone": "America/La_Paz",
      "roles": [
        "valor-ejemplo"
      ],
      "globalRoles": [
        "valor-ejemplo"
      ],
      "actions": [
        "valor-ejemplo"
      ],
      "grants": [
        {
          "scope": "UNIT",
          "role": "valor-ejemplo",
          "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
          "careSpaceId": "00000000-0000-4000-8000-000000000001",
          "actions": [
            "valor-ejemplo"
          ]
        }
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites` | Sí | `array<InfraAccessSiteDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"siteId":"00000000-0000-4000-8000-000000000001","practiceId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","timeZone":"America/La_Paz","roles":["valor-ejemplo"],"globalRoles":["valor-ejemplo"],"actions":["valor-ejemplo"],"grants":[{"scope":"UNIT","role":"valor-ejemplo","clinicalUnitId":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","actions":["valor-ejemplo"]}]}]` |
| `sites[].siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sites[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sites[].timeZone` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `sites[].roles` | Sí | `array<string>` | Sin restricción adicional declarada | Roles de nivel sede u organización (plataforma, admin, asignaciones TENANT/PRACTICE/SITE) | `["valor-ejemplo"]` |
| `sites[].globalRoles` | Sí | `array<string>` | Sin restricción adicional declarada | Roles globales equivalentes (BILLING, OR_MANAGER, ACCOUNTING) | `["valor-ejemplo"]` |
| `sites[].actions` | Sí | `array<string>` | Sin restricción adicional declarada | Acciones permitidas sobre la sede entera | `["valor-ejemplo"]` |
| `sites[].grants` | Sí | `array<InfraAccessGrantDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"scope":"UNIT","role":"valor-ejemplo","clinicalUnitId":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","actions":["valor-ejemplo"]}]` |
| `sites[].grants[].scope` | Sí | `string` | valores: `UNIT`, `SPACE` | Sin descripción específica en el contrato OpenAPI. | `UNIT` |
| `sites[].grants[].role` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sites[].grants[].clinicalUnitId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].grants[].careSpaceId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sites[].grants[].actions` | Sí | `array<string>` | Sin restricción adicional declarada | Acciones que esta asignación permite sobre su unidad o espacio | `["valor-ejemplo"]` |

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
  "path": "/practice/infrastructure-access/me"
}
```

---

## 31. GET /practice/infrastructure-catalog

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Catálogo de infraestructura hospitalaria
- **Operation ID:** `InfrastructureCatalogController_catalog`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InfrastructureCatalogController.catalog](../../src/modules/practice/controllers/infrastructure-catalog.controller.ts)

### Descripción de negocio

Catálogo de infraestructura hospitalaria. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Formas, funciones con su perfil, reglas, ciclo de vida y atributos.

### Descripción del sistema

NestJS resuelve `GET /practice/infrastructure-catalog` en `InfrastructureCatalogController_catalog`. El controlador delega en `InfrastructureReadService.catalog`. No recibe body. El tipo de retorno estático es `Promise<InfrastructureCatalogDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /practice/infrastructure-catalog HTTP/1.1
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
GET /practice/infrastructure-catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<InfrastructureCatalogDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<InfrastructureCatalogDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<InfrastructureCatalogDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<InfrastructureCatalogDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<InfrastructureCatalogDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<InfrastructureCatalogDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<InfrastructureCatalogDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InfrastructureCatalogDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "forms": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "fhirCode": "CODIGO_EJEMPLO"
    }
  ],
  "functions": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "key": "valor-ejemplo",
      "forms": [
        "valor-ejemplo"
      ],
      "schedulable": true,
      "inpatient": true,
      "billable": true,
      "allowOverlap": true,
      "isolationCapable": true,
      "stockPoint": true,
      "hostsEquipment": true,
      "requiresTerminalCleaning": true,
      "requiresArea": true,
      "requiresHvac": true
    }
  ],
  "parentRules": [
    {
      "parent": "valor-ejemplo",
      "child": "valor-ejemplo"
    }
  ],
  "typologyRules": [
    {
      "typology": "valor-ejemplo",
      "function": "valor-ejemplo",
      "rule": "TYPO_ALLOWED"
    }
  ],
  "lifecycle": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ],
  "unitLifecycle": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ],
  "attributes": {
    "asepsis": [
      {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    ],
    "pressure": [
      {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    ],
    "sex": [
      {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    ],
    "ageGroup": [
      {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    ],
    "bedCategory": [
      {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    ],
    "unitRole": [
      {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    ]
  },
  "regulatory": {
    "subsector": [
      {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    ],
    "careLevel": [
      {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    ],
    "typology": [
      {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    ],
    "sedes": [
      {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    ],
    "licenseStatus": [
      {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    ],
    "capacityKind": [
      {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    ]
  },
  "availability": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ],
  "hygiene": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ],
  "isolation": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ],
  "occupancy": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ],
  "blockReasons": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "kinds": [
        "valor-ejemplo"
      ]
    }
  ],
  "cleaningTypes": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ],
  "cleaningPriorities": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ],
  "v2Map": [
    {
      "order": 1,
      "condition": "valor-ejemplo",
      "v2Code": "C"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `forms` | Sí | `array<FormConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo","fhirCode":"CODIGO_EJEMPLO"}]` |
| `forms[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `forms[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `forms[].fhirCode` | Sí | `string` | Sin restricción adicional declarada | Código FHIR R5 Location.form | `CODIGO_EJEMPLO` |
| `functions` | Sí | `array<FunctionProfileDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo","key":"valor-ejemplo","forms":["valor-ejemplo"],"schedulable":true,"inpatient":true,"billable":true,"allowOverlap":true,"isolationCapable":true,"stockPoint":true,"hostsEquipment":true,"requiresTerminalCleaning":true,"requiresArea":true,"requiresHvac":true}]` |
| `functions[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `functions[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `functions[].key` | Sí | `string` | Sin restricción adicional declarada | Clave estable (GENERIC para SPACE_TYPE_ROOM) | `valor-ejemplo` |
| `functions[].forms` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `functions[].schedulable` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `functions[].inpatient` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `functions[].billable` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `functions[].allowOverlap` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `functions[].isolationCapable` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `functions[].stockPoint` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `functions[].hostsEquipment` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `functions[].requiresTerminalCleaning` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `functions[].requiresArea` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `functions[].requiresHvac` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `parentRules` | Sí | `array<ParentRuleDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"parent":"valor-ejemplo","child":"valor-ejemplo"}]` |
| `parentRules[].parent` | Sí | `string` | admite null | null = raíz de la sede | `valor-ejemplo` |
| `parentRules[].child` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `typologyRules` | Sí | `array<TypologyRuleDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"typology":"valor-ejemplo","function":"valor-ejemplo","rule":"TYPO_ALLOWED"}]` |
| `typologyRules[].typology` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `typologyRules[].function` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `typologyRules[].rule` | Sí | `string` | valores: `TYPO_ALLOWED`, `TYPO_REQUIRED` | Sin descripción específica en el contrato OpenAPI. | `TYPO_ALLOWED` |
| `lifecycle` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `lifecycle[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `lifecycle[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `unitLifecycle` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `unitLifecycle[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `unitLifecycle[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `attributes` | Sí | `CatalogAttributesDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"asepsis":[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}],"pressure":[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}],"sex":[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}],"ageGroup":[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}],"bedCategory":[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}],"unitRole":[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]}` |
| `attributes.asepsis` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `attributes.asepsis[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `attributes.asepsis[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `attributes.pressure` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `attributes.pressure[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `attributes.pressure[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `attributes.sex` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `attributes.sex[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `attributes.sex[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `attributes.ageGroup` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `attributes.ageGroup[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `attributes.ageGroup[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `attributes.bedCategory` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `attributes.bedCategory[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `attributes.bedCategory[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `attributes.unitRole` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `attributes.unitRole[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `attributes.unitRole[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory` | Sí | `CatalogRegulatoryDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"subsector":[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}],"careLevel":[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}],"typology":[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}],"sedes":[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}],"licenseStatus":[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}],"capacityKind":[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]}` |
| `regulatory.subsector` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `regulatory.subsector[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.subsector[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.careLevel` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `regulatory.careLevel[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.careLevel[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.typology` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `regulatory.typology[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.typology[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.sedes` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `regulatory.sedes[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.sedes[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.licenseStatus` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `regulatory.licenseStatus[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.licenseStatus[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.capacityKind` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `regulatory.capacityKind[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.capacityKind[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `availability` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `availability[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `availability[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `hygiene` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `hygiene[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `hygiene[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `isolation` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `isolation[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `isolation[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `occupancy` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `occupancy[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `occupancy[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `blockReasons` | Sí | `array<BlockReasonConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo","kinds":["valor-ejemplo"]}]` |
| `blockReasons[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `blockReasons[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `blockReasons[].kinds` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `cleaningTypes` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `cleaningTypes[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cleaningTypes[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cleaningPriorities` | Sí | `array<ConceptDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}]` |
| `cleaningPriorities[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cleaningPriorities[].display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `v2Map` | Sí | `array<V2MapRuleDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"order":1,"condition":"valor-ejemplo","v2Code":"C"}]` |
| `v2Map[].order` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `v2Map[].condition` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `v2Map[].v2Code` | Sí | `string` | valores: `C`, `K`, `I`, `O`, `R`, `H`, `U` | Sin descripción específica en el contrato OpenAPI. | `C` |

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
  "path": "/practice/infrastructure-catalog"
}
```

---

## 32. GET /practices

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Listar las prácticas activas del tenant
- **Operation ID:** `PracticesController_listPractices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.listPractices](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Sin `@Roles`: el servicio autoriza por rol clínico o por ser OWNER/ADMIN de la organización (A-6). Un PRACTITIONER sólo recibe las prácticas donde tiene una vinculación ACTIVE; quien administra la organización recibe todas las suyas.

Contexto declarado en el controlador: Prácticas activas del tenant. Abierta a los actores clínicos y de programación, no sólo a `SECURITY_ADMIN`: es el primer paso para resolver el quirófano que exige programar una intervención, y sin él ese uuid había que averiguarlo fuera del sistema. Sólo devuelve identificación y estado, no configuración.

### Descripción del sistema

NestJS resuelve `GET /practices` en `PracticesController_listPractices`. El controlador delega en `PracticeSitesService.listPractices`. No recibe body. El tipo de retorno estático es `Promise<PracticeSummaryDto[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /practices HTTP/1.1
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
GET /practices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PracticeSummaryDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<PracticeSummaryDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<PracticeSummaryDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<PracticeSummaryDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<PracticeSummaryDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<PracticeSummaryDto[]>` | No |
| 504 | Consulta completada correctamente. | `Promise<PracticeSummaryDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PracticeSummaryDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "code": "CODIGO_EJEMPLO",
    "name": "Nombre de ejemplo",
    "status": "00000000-0000-4000-8000-000000000001"
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

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
  "path": "/practices"
}
```

---

## 33. POST /practices

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Dar de alta una práctica (organización raíz)
- **Operation ID:** `PracticesController_createPractice`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.createPractice](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Dar de alta una práctica (organización raíz). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /practices` en `PracticesController_createPractice`. El controlador delega en `PracticeSitesService.createPractice`. Valida el body como `CreatePracticeDto` y consume `application/json`. El tipo de retorno estático es `Promise<PracticeResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePracticeDto`; los campos opcionales se omiten.

```http
POST /practices HTTP/1.1
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant gestor (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único de la práctica | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre de la práctica | `Nombre de ejemplo` |
| `typeConceptId` | No | `string` | formato `uuid` | Concepto de tipo de práctica | `00000000-0000-4000-8000-000000000001` |
| `adminUserId` | No | `string` | formato `uuid` | Usuario administrador (por defecto el actor) | `00000000-0000-4000-8000-000000000001` |
| `currencyConceptId` | No | `string` | formato `uuid` | Concepto de moneda | `00000000-0000-4000-8000-000000000001` |
| `timeZone` | No | `string` | longitud máxima 100 | Zona horaria IANA | `America/La_Paz` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "typeConceptId": "00000000-0000-4000-8000-000000000001",
  "adminUserId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "timeZone": "America/La_Paz"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PracticeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PracticeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PracticeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PracticeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PracticeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PracticeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PracticeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PracticeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PracticeResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PracticeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PracticeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "status": "ok",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
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
  "path": "/practices"
}
```

---

## 34. POST /practices/{practiceId}/accreditations

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Registrar una acreditación con evidencia
- **Operation ID:** `PracticesController_createAccreditation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.createAccreditation](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Registrar una acreditación con evidencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /practices/{practiceId}/accreditations` en `PracticesController_createAccreditation`. El controlador delega en `PracticeAccreditationsService.create`. Valida el body como `PracticeCreateAccreditationDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccreditationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PracticeCreateAccreditationDto`; los campos opcionales se omiten.

```http
POST /practices/00000000-0000-4000-8000-000000000001/accreditations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `practiceId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceSiteId` | No | `string` | formato `uuid` | Sitio acreditado (opcional) | `00000000-0000-4000-8000-000000000001` |
| `accreditationTypeConceptId` | No | `string` | formato `uuid` | Concepto de tipo de acreditación | `00000000-0000-4000-8000-000000000001` |
| `accreditationNumber` | No | `string` | longitud máxima 100 | Número de acreditación | `valor-ejemplo` |
| `issuerTenantId` | No | `string` | formato `uuid` | Tenant emisor (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `issuerName` | No | `string` | longitud máxima 200 | Nombre del emisor | `Nombre de ejemplo` |
| `validFrom` | No | `string` | Sin restricción adicional declarada | Vigente desde (ISO date) | `valor-ejemplo` |
| `validTo` | No | `string` | Sin restricción adicional declarada | Vigente hasta (ISO date) | `valor-ejemplo` |
| `evidenceFileId` | No | `string` | formato `uuid` | Archivo de evidencia (common.files) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practices/00000000-0000-4000-8000-000000000001/accreditations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "accreditationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "accreditationNumber": "valor-ejemplo",
  "issuerTenantId": "00000000-0000-4000-8000-000000000001",
  "issuerName": "Nombre de ejemplo",
  "validFrom": "valor-ejemplo",
  "validTo": "valor-ejemplo",
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
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
| 422 | `PRECONDITION_FAILED` | El sitio no pertenece a la práctica | Excepción explícita en src/modules/practice/services/practice-accreditations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practices/{practiceId}/accreditations"
}
```

---

## 35. GET /practices/{practiceId}/healthcare-services

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Listar los procedimientos que ofrecen las sedes de la práctica
- **Operation ID:** `PracticesController_listHealthcareServices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.listHealthcareServices](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Listar los procedimientos que ofrecen las sedes de la práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Lo que la práctica ofrece del nomenclador, con precio y referencia.

### Descripción del sistema

NestJS resuelve `GET /practices/{practiceId}/healthcare-services` en `PracticesController_listHealthcareServices`. El controlador delega en `HealthcareServiceOffersService.listOffers`. No recibe body. El tipo de retorno estático es `Promise<HealthcareServiceOffersResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceSiteId` | query | No | `string` | Sin restricción adicional declarada | Solo la oferta de esa sede | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /practices/00000000-0000-4000-8000-000000000001/healthcare-services HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `practiceId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /practices/00000000-0000-4000-8000-000000000001/healthcare-services?practiceSiteId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<HealthcareServiceOffersResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<HealthcareServiceOffersResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<HealthcareServiceOffersResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<HealthcareServiceOffersResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<HealthcareServiceOffersResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<HealthcareServiceOffersResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<HealthcareServiceOffersResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<HealthcareServiceOffersResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HealthcareServiceOffersResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "serviceDisplay": "valor-ejemplo",
      "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
      "price": 1,
      "currencyConceptId": "00000000-0000-4000-8000-000000000001",
      "referencePrice": 1,
      "referenceUnit": "UMA",
      "overMargin": true,
      "visibleInSearch": true,
      "active": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<HealthcareServiceOfferDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","practiceSiteId":"00000000-0000-4000-8000-000000000001","serviceConceptId":"00000000-0000-4000-8000-000000000001","serviceDisplay":"valor-ejemplo","serviceCatalogId":"00000000-0000-4000-8000-000000000001","price":1,"currencyConceptId":"00000000-0000-4000-8000-000000000001","referencePrice":1,"referenceUnit":"UMA","overMargin":true,"visibleInSearch":true,"active":true}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].serviceConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].serviceDisplay` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].serviceCatalogId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].price` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].currencyConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].referencePrice` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].referenceUnit` | Sí | `string` | valores: `UMA`, `USD`; admite null | Sin descripción específica en el contrato OpenAPI. | `UMA` |
| `items[].overMargin` | Sí | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].visibleInSearch` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].active` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practices/{practiceId}/healthcare-services"
}
```

---

## 36. POST /practices/{practiceId}/healthcare-services

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Publicar un procedimiento del nomenclador en una sede
- **Operation ID:** `PracticesController_publishHealthcareService`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.publishHealthcareService](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

El concepto debe ser del nomenclador (`VS_BO_MEDICAL_PROCEDURE`) y coincidir con el del ítem de catálogo que fija el precio. Una sede no puede ofrecer dos veces el mismo procedimiento (409).

Contexto declarado en el controlador: UC-14-06. Sin `@Roles`: lo publica quien administra **esa** organización (A-6) o un rol de plataforma, y eso lo decide el servicio por la membresía.

### Descripción del sistema

NestJS resuelve `POST /practices/{practiceId}/healthcare-services` en `PracticesController_publishHealthcareService`. El controlador delega en `ClinicalStructureService.publishHealthcareService`. Valida el body como `CreateHealthcareServiceDto` y consume `application/json`. El tipo de retorno estático es `Promise<HealthcareServiceResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateHealthcareServiceDto`; los campos opcionales se omiten.

```http
POST /practices/00000000-0000-4000-8000-000000000001/healthcare-services HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `practiceId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sitio donde se presta | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid` | Unidad clínica que lo presta | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | Sí | `string` | formato `uuid` | Procedimiento del nomenclador (`VS_BO_MEDICAL_PROCEDURE`) que se ofrece | `00000000-0000-4000-8000-000000000001` |
| `serviceCatalogId` | Sí | `string` | formato `uuid` | Ítem del catálogo de precios de la práctica; su concepto debe ser el mismo `serviceConceptId` | `00000000-0000-4000-8000-000000000001` |
| `specialtyConceptId` | No | `string` | formato `uuid` | Concepto de especialidad | `00000000-0000-4000-8000-000000000001` |
| `referralRequired` | No | `boolean` | Sin restricción adicional declarada | ¿Requiere derivación? | `true` |
| `appointmentRequired` | No | `boolean` | Sin restricción adicional declarada | ¿Requiere cita? | `true` |
| `telehealthAvailable` | No | `boolean` | Sin restricción adicional declarada | ¿Disponible por telesalud? | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practices/00000000-0000-4000-8000-000000000001/healthcare-services HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "referralRequired": true,
  "appointmentRequired": true,
  "telehealthAvailable": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<HealthcareServiceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<HealthcareServiceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<HealthcareServiceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<HealthcareServiceResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<HealthcareServiceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<HealthcareServiceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<HealthcareServiceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<HealthcareServiceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<HealthcareServiceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<HealthcareServiceResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<HealthcareServiceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HealthcareServiceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La práctica no está activa | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
| 422 | `PRECONDITION_FAILED` | El sitio no pertenece a la práctica | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
| 422 | `PRECONDITION_FAILED` | La unidad clínica no existe | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
| 422 | `PRECONDITION_FAILED` | El concepto no es un procedimiento del nomenclador | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practices/{practiceId}/healthcare-services"
}
```

---

## 37. PATCH /practices/{practiceId}/healthcare-services/{id}

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Actualizar el precio o el estado de un procedimiento de la sede
- **Operation ID:** `PracticesController_updateHealthcareService`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.updateHealthcareService](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Actualizar el precio o el estado de un procedimiento de la sede. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Cambia el precio de la sede o activa/desactiva el procedimiento.

### Descripción del sistema

NestJS resuelve `PATCH /practices/{practiceId}/healthcare-services/{id}` en `PracticesController_updateHealthcareService`. El controlador delega en `HealthcareServiceOffersService.updateOffer`. Valida el body como `UpdateHealthcareServiceDto` y consume `application/json`. El tipo de retorno estático es `Promise<HealthcareServiceOfferDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateHealthcareServiceDto`; los campos opcionales se omiten.

```http
PATCH /practices/00000000-0000-4000-8000-000000000001/healthcare-services/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `practiceId`, `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `serviceCatalogId` | No | `string` | formato `uuid` | Nuevo ítem del catálogo de precios de la práctica; su concepto debe coincidir con el del servicio | `00000000-0000-4000-8000-000000000001` |
| `active` | No | `boolean` | Sin restricción adicional declarada | ¿El procedimiento está activo? | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /practices/00000000-0000-4000-8000-000000000001/healthcare-services/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "active": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<HealthcareServiceOfferDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<HealthcareServiceOfferDto>` | No |
| 401 | Operación completada correctamente. | `Promise<HealthcareServiceOfferDto>` | No |
| 403 | Operación completada correctamente. | `Promise<HealthcareServiceOfferDto>` | No |
| 404 | Operación completada correctamente. | `Promise<HealthcareServiceOfferDto>` | No |
| 409 | Operación completada correctamente. | `Promise<HealthcareServiceOfferDto>` | No |
| 413 | Operación completada correctamente. | `Promise<HealthcareServiceOfferDto>` | No |
| 422 | Operación completada correctamente. | `Promise<HealthcareServiceOfferDto>` | No |
| 429 | Operación completada correctamente. | `Promise<HealthcareServiceOfferDto>` | No |
| 500 | Operación completada correctamente. | `Promise<HealthcareServiceOfferDto>` | No |
| 504 | Operación completada correctamente. | `Promise<HealthcareServiceOfferDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HealthcareServiceOfferDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceDisplay": "valor-ejemplo",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "price": 1,
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "referencePrice": 1,
  "referenceUnit": "UMA",
  "overMargin": true,
  "visibleInSearch": true,
  "active": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceDisplay` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `serviceCatalogId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `price` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `currencyConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `referencePrice` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `referenceUnit` | Sí | `string` | valores: `UMA`, `USD`; admite null | Sin descripción específica en el contrato OpenAPI. | `UMA` |
| `overMargin` | Sí | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `visibleInSearch` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `active` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
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
  "path": "/practices/{practiceId}/healthcare-services/{id}"
}
```

---

## 38. POST /practices/{practiceId}/inventory-items

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Dar de alta un insumo de inventario de práctica
- **Operation ID:** `PracticesController_createInventoryItem`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.createInventoryItem](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Dar de alta un insumo de inventario de práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /practices/{practiceId}/inventory-items` en `PracticesController_createInventoryItem`. El controlador delega en `PracticeInventoryService.createItem`. Valida el body como `CreateInventoryItemDto` y consume `application/json`. El tipo de retorno estático es `Promise<InventoryItemResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateInventoryItemDto`; los campos opcionales se omiten.

```http
POST /practices/00000000-0000-4000-8000-000000000001/inventory-items HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `practiceId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre del insumo | `Nombre de ejemplo` |
| `productConceptId` | No | `string` | formato `uuid` | Concepto de producto | `00000000-0000-4000-8000-000000000001` |
| `lotNumber` | No | `string` | longitud máxima 100 | Número de lote | `valor-ejemplo` |
| `expiryDate` | No | `string` | formato `date-time` | Fecha de caducidad (ISO date) | `2026-07-31T12:00:00.000Z` |
| `unitConceptId` | No | `string` | formato `uuid` | Concepto de unidad de medida | `00000000-0000-4000-8000-000000000001` |
| `reorderLevel` | No | `string` | Sin restricción adicional declarada | Nivel de reorden (numérico) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practices/00000000-0000-4000-8000-000000000001/inventory-items HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "productConceptId": "00000000-0000-4000-8000-000000000001",
  "lotNumber": "valor-ejemplo",
  "expiryDate": "2026-07-31T12:00:00.000Z",
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "reorderLevel": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<InventoryItemResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<InventoryItemResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<InventoryItemResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<InventoryItemResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<InventoryItemResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<InventoryItemResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<InventoryItemResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<InventoryItemResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<InventoryItemResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<InventoryItemResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<InventoryItemResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InventoryItemResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "quantityOnHand": "valor-ejemplo",
  "status": "ok",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `quantityOnHand` | Sí | `string` | Sin restricción adicional declarada | Valor de quantity on hand mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
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
  "path": "/practices/{practiceId}/inventory-items"
}
```

---

## 39. GET /practices/{practiceId}/organization

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Consola de organización médica: estructura, plantilla y legajo
- **Operation ID:** `PracticesController_getOrganizationConsole`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.getOrganizationConsole](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Consola de organización médica: estructura, plantilla y legajo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El árbol completo de una organización médica — CARRIL 13. Sedes, áreas, infraestructura, servicios, plantilla, documentación legal e inventario en una sola lectura. Existe porque el módulo tenía once escrituras y tres lecturas: se podían dar de alta quirófanos, áreas, servicios y personal, y ninguna operación los volvía a mencionar. Los roles son los mismos que ya admite `GET /practices`: quien puede enumerar las prácticas del tenant puede ver la estructura de la suya. El aislamiento real lo hace el servicio, que responde 404 ante una práctica de otra organización o, para un `PRACTITIONER`, sin vinculación ACTIVE.

### Descripción del sistema

NestJS resuelve `GET /practices/{practiceId}/organization` en `PracticesController_getOrganizationConsole`. El controlador delega en `PracticeOrganizationReadService.getConsole`. No recibe body. El tipo de retorno estático es `Promise<MedicalOrganizationConsoleDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /practices/00000000-0000-4000-8000-000000000001/organization HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PERIOP_ADMIN`, `SURGERY_SCHEDULER`, `SCHEDULING_ADMIN`, `PRACTITIONER`, `CLINICIAN`, `ACCOUNTING_APPROVER`.
- Deben ser UUID válidos: `practiceId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /practices/00000000-0000-4000-8000-000000000001/organization HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MedicalOrganizationConsoleDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<MedicalOrganizationConsoleDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MedicalOrganizationConsoleDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MedicalOrganizationConsoleDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<MedicalOrganizationConsoleDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MedicalOrganizationConsoleDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MedicalOrganizationConsoleDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<MedicalOrganizationConsoleDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicalOrganizationConsoleDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "organization": {
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
    "timeZone": "America/La_Paz",
    "currency": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  },
  "sites": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "type": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "physicalType": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "operationalStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "timeZone": "America/La_Paz",
      "branchId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitCount": 1,
      "careSpaceCount": 1
    }
  ],
  "clinicalUnits": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "siteId": "00000000-0000-4000-8000-000000000001",
      "parentUnitId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "type": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "specialty": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "serviceMode": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ],
  "careSpaces": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "siteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "parentSpaceId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "type": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "capacity": 1,
      "operationalStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ],
  "healthcareServices": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "siteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "service": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "specialty": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "referralRequired": true,
      "appointmentRequired": true,
      "telehealthAvailable": true,
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ],
  "staff": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "practitionerName": "Nombre de ejemplo",
      "siteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
      "role": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "specialty": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "isPrimary": true,
      "validFrom": "2026-07-31",
      "validTo": "2026-07-31",
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ],
  "legalDocuments": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "siteId": "00000000-0000-4000-8000-000000000001",
      "type": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "number": "valor-ejemplo",
      "issuerName": "Nombre de ejemplo",
      "evidenceFileId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31",
      "validTo": "2026-07-31",
      "daysToExpiry": 1,
      "verificationStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ],
  "inventory": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "lotNumber": "valor-ejemplo",
      "expiryDate": "2026-07-31",
      "quantityOnHand": 12,
      "unit": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "reorderLevel": "valor-ejemplo",
      "belowReorderLevel": true,
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
| `organization` | Sí | `OrganizationHeaderDto` | Sin restricción adicional declarada | La organización. | `{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"timeZone":"America/La_Paz","currency":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}` |
| `organization.id` | Sí | `string` | formato `uuid` | Identificador de la práctica. | `00000000-0000-4000-8000-000000000001` |
| `organization.code` | Sí | `string` | Sin restricción adicional declarada | Código único dentro del tenant. | `CODIGO_EJEMPLO` |
| `organization.name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Nombre de ejemplo` |
| `organization.type` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Tipo de organización: hospital, clínica, centro médico, consultorio… | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `organization.type.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `organization.type.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `organization.status` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Estado de la práctica. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `organization.status.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `organization.status.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `organization.timeZone` | No | `string` | admite null | Zona horaria IANA declarada, si la tiene. | `America/La_Paz` |
| `organization.currency` | No | `PracticeConceptDto` | Sin restricción adicional declarada | Moneda de la práctica, si la declara. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `organization.currency.code` | No | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `organization.currency.display` | No | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `sites` | Sí | `array<OrganizationSiteDto>` | Sin restricción adicional declarada | Sus sedes. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"physicalType":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"timeZone":"America/La_Paz","branchId":"00000000-0000-4000-8000-000000000001","clinicalUnitCount":1,"careSpaceCount":1}]` |
| `sites[].id` | Sí | `string` | formato `uuid` | Identificador de la sede. | `00000000-0000-4000-8000-000000000001` |
| `sites[].code` | Sí | `string` | Sin restricción adicional declarada | Código único dentro de la práctica. | `CODIGO_EJEMPLO` |
| `sites[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Nombre de ejemplo` |
| `sites[].type` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Tipo de sede. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `sites[].type.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `sites[].type.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `sites[].physicalType` | No | `PracticeConceptDto` | Sin restricción adicional declarada | Tipo físico del emplazamiento, si lo declara. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `sites[].physicalType.code` | No | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `sites[].physicalType.display` | No | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `sites[].operationalStatus` | No | `PracticeConceptDto` | Sin restricción adicional declarada | Estado operativo (planificada, abierta, cerrada), si lo declara. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `sites[].operationalStatus.code` | No | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `sites[].operationalStatus.display` | No | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `sites[].status` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Estado de ciclo de vida. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `sites[].status.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `sites[].status.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `sites[].timeZone` | No | `string` | admite null | Zona horaria IANA de la sede, si la declara. | `America/La_Paz` |
| `sites[].branchId` | No | `string` | formato `uuid`; admite null | Sucursal de `directory` con la que se corresponde, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `sites[].clinicalUnitCount` | Sí | `number` | Sin restricción adicional declarada | Áreas registradas en la sede. | `1` |
| `sites[].careSpaceCount` | Sí | `number` | Sin restricción adicional declarada | Espacios de atención registrados en la sede. | `1` |
| `clinicalUnits` | Sí | `array<OrganizationClinicalUnitDto>` | Sin restricción adicional declarada | Sus áreas y sub-áreas. | `[{"id":"00000000-0000-4000-8000-000000000001","siteId":"00000000-0000-4000-8000-000000000001","parentUnitId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"specialty":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"serviceMode":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `clinicalUnits[].id` | Sí | `string` | formato `uuid` | Identificador del área. | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnits[].siteId` | Sí | `string` | formato `uuid` | Sede a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnits[].parentUnitId` | No | `string` | formato `uuid`; admite null | Área padre, cuando es una sub-área. | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnits[].code` | Sí | `string` | Sin restricción adicional declarada | Código único dentro de la sede. | `CODIGO_EJEMPLO` |
| `clinicalUnits[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Nombre de ejemplo` |
| `clinicalUnits[].type` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Tipo de unidad. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `clinicalUnits[].type.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `clinicalUnits[].type.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `clinicalUnits[].specialty` | No | `PracticeConceptDto` | Sin restricción adicional declarada | Especialidad del área, si la declara. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `clinicalUnits[].specialty.code` | No | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `clinicalUnits[].specialty.display` | No | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `clinicalUnits[].serviceMode` | No | `PracticeConceptDto` | Sin restricción adicional declarada | Modalidad de servicio, si la declara. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `clinicalUnits[].serviceMode.code` | No | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `clinicalUnits[].serviceMode.display` | No | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `clinicalUnits[].status` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Estado de ciclo de vida. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `clinicalUnits[].status.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `clinicalUnits[].status.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `careSpaces` | Sí | `array<OrganizationCareSpaceDto>` | Sin restricción adicional declarada | Su infraestructura: quirófanos, consultorios y demás espacios. | `[{"id":"00000000-0000-4000-8000-000000000001","siteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","parentSpaceId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"capacity":1,"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `careSpaces[].id` | Sí | `string` | formato `uuid` | Identificador del espacio. | `00000000-0000-4000-8000-000000000001` |
| `careSpaces[].siteId` | Sí | `string` | formato `uuid` | Sede a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `careSpaces[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Área a la que pertenece, si cuelga de una. | `00000000-0000-4000-8000-000000000001` |
| `careSpaces[].parentSpaceId` | No | `string` | formato `uuid`; admite null | Espacio contenedor, cuando es una subdivisión. | `00000000-0000-4000-8000-000000000001` |
| `careSpaces[].code` | Sí | `string` | Sin restricción adicional declarada | Código único dentro de la sede. | `CODIGO_EJEMPLO` |
| `careSpaces[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Nombre de ejemplo` |
| `careSpaces[].type` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Tipo de espacio. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `careSpaces[].type.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `careSpaces[].type.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `careSpaces[].capacity` | No | `number` | admite null | Capacidad declarada, si la tiene. | `1` |
| `careSpaces[].operationalStatus` | No | `PracticeConceptDto` | Sin restricción adicional declarada | Disponibilidad operativa (disponible, en limpieza, fuera de servicio…). | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `careSpaces[].operationalStatus.code` | No | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `careSpaces[].operationalStatus.display` | No | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `careSpaces[].status` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Estado de ciclo de vida. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `careSpaces[].status.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `careSpaces[].status.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `healthcareServices` | Sí | `array<OrganizationHealthcareServiceDto>` | Sin restricción adicional declarada | Los servicios que ofrece. | `[{"id":"00000000-0000-4000-8000-000000000001","siteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","service":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"specialty":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"referralRequired":true,"appointmentRequired":true,"telehealthAvailable":true,"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `healthcareServices[].id` | Sí | `string` | formato `uuid` | Identificador del servicio. | `00000000-0000-4000-8000-000000000001` |
| `healthcareServices[].siteId` | No | `string` | formato `uuid`; admite null | Sede donde se presta, si está acotado a una. | `00000000-0000-4000-8000-000000000001` |
| `healthcareServices[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Área que lo presta, si cuelga de una. | `00000000-0000-4000-8000-000000000001` |
| `healthcareServices[].service` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Servicio del catálogo. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `healthcareServices[].service.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `healthcareServices[].service.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `healthcareServices[].specialty` | No | `PracticeConceptDto` | Sin restricción adicional declarada | Especialidad asociada, si la declara. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `healthcareServices[].specialty.code` | No | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `healthcareServices[].specialty.display` | No | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `healthcareServices[].referralRequired` | No | `boolean` | admite null | Si exige derivación previa. | `true` |
| `healthcareServices[].appointmentRequired` | No | `boolean` | admite null | Si exige turno previo. | `true` |
| `healthcareServices[].telehealthAvailable` | No | `boolean` | admite null | Si admite atención remota. | `true` |
| `healthcareServices[].status` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Estado de ciclo de vida. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `healthcareServices[].status.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `healthcareServices[].status.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `staff` | Sí | `array<OrganizationStaffMemberDto>` | Sin restricción adicional declarada | Su plantilla profesional. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","practitionerName":"Nombre de ejemplo","siteId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","healthcareServiceId":"00000000-0000-4000-8000-000000000001","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"specialty":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"isPrimary":true,"validFrom":"2026-07-31","validTo":"2026-07-31","status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `staff[].id` | Sí | `string` | formato `uuid` | Identificador de la asignación. | `00000000-0000-4000-8000-000000000001` |
| `staff[].practitionerProfileId` | Sí | `string` | formato `uuid` | Perfil profesional asignado. | `00000000-0000-4000-8000-000000000001` |
| `staff[].practitionerName` | No | `string` | admite null | Nombre del profesional, o `null` si el perfil no lo tiene registrado. `null` es un estado real —un perfil creado sin persona detrás— y quien lo reciba tiene que decirlo, nunca sustituirlo por un uuid. | `Nombre de ejemplo` |
| `staff[].siteId` | No | `string` | formato `uuid`; admite null | Sede del vínculo, si está acotado a una. | `00000000-0000-4000-8000-000000000001` |
| `staff[].clinicalUnitId` | No | `string` | formato `uuid`; admite null | Área del vínculo, si está acotado a una. | `00000000-0000-4000-8000-000000000001` |
| `staff[].healthcareServiceId` | No | `string` | formato `uuid`; admite null | Servicio del vínculo, si está acotado a uno. | `00000000-0000-4000-8000-000000000001` |
| `staff[].role` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Rol clínico asignado. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `staff[].role.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `staff[].role.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `staff[].specialty` | No | `PracticeConceptDto` | Sin restricción adicional declarada | Especialidad con la que ejerce en este vínculo, si la declara. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `staff[].specialty.code` | No | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `staff[].specialty.display` | No | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `staff[].isPrimary` | No | `boolean` | admite null | Si es el vínculo principal del profesional. | `true` |
| `staff[].validFrom` | No | `string` | formato `date`; admite null | Inicio de la vinculación. | `2026-07-31` |
| `staff[].validTo` | No | `string` | formato `date`; admite null | Fin de la vinculación; `null` mientras siga abierta. | `2026-07-31` |
| `staff[].status` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Estado de la asignación. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `staff[].status.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `staff[].status.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `legalDocuments` | Sí | `array<OrganizationLegalDocumentDto>` | Sin restricción adicional declarada | Su documentación legal y acreditaciones. | `[{"id":"00000000-0000-4000-8000-000000000001","siteId":"00000000-0000-4000-8000-000000000001","type":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"number":"valor-ejemplo","issuerName":"Nombre de ejemplo","evidenceFileId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31","validTo":"2026-07-31","daysToExpiry":1,"verificationStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `legalDocuments[].id` | Sí | `string` | formato `uuid` | Identificador del documento. | `00000000-0000-4000-8000-000000000001` |
| `legalDocuments[].siteId` | No | `string` | formato `uuid`; admite null | Sede a la que corresponde, si está acotado a una. | `00000000-0000-4000-8000-000000000001` |
| `legalDocuments[].type` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Tipo de acreditación o documento. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `legalDocuments[].type.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `legalDocuments[].type.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `legalDocuments[].number` | No | `string` | admite null | Número o matrícula del documento. | `valor-ejemplo` |
| `legalDocuments[].issuerName` | No | `string` | admite null | Entidad emisora, tal como se registró. | `Nombre de ejemplo` |
| `legalDocuments[].evidenceFileId` | No | `string` | formato `uuid`; admite null | Archivo de respaldo, si se adjuntó. | `00000000-0000-4000-8000-000000000001` |
| `legalDocuments[].validFrom` | No | `string` | formato `date`; admite null | Inicio de vigencia. | `2026-07-31` |
| `legalDocuments[].validTo` | No | `string` | formato `date`; admite null | Fin de vigencia. | `2026-07-31` |
| `legalDocuments[].daysToExpiry` | No | `number` | admite null | Días que faltan para el vencimiento; negativo si ya venció. Se calcula en el servidor a propósito: la alerta por vencimiento que pide la especificación tiene que dar el mismo resultado en toda pantalla y en todo informe, y el reloj del navegador no es una base confiable para eso. `null` cuando el documento no declara vencimiento. | `1` |
| `legalDocuments[].verificationStatus` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Estado de verificación del documento. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `legalDocuments[].verificationStatus.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `legalDocuments[].verificationStatus.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `inventory` | Sí | `array<OrganizationInventoryItemDto>` | Sin restricción adicional declarada | Su inventario de insumos y equipamiento. | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","lotNumber":"valor-ejemplo","expiryDate":"2026-07-31","quantityOnHand":12,"unit":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"reorderLevel":"valor-ejemplo","belowReorderLevel":true,"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `inventory[].id` | Sí | `string` | formato `uuid` | Identificador del insumo. | `00000000-0000-4000-8000-000000000001` |
| `inventory[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Nombre de ejemplo` |
| `inventory[].lotNumber` | No | `string` | admite null | Lote, si se registró. | `valor-ejemplo` |
| `inventory[].expiryDate` | No | `string` | formato `date`; admite null | Fecha de vencimiento del lote, si la tiene. | `2026-07-31` |
| `inventory[].quantityOnHand` | Sí | `string` | Sin restricción adicional declarada | Existencias actuales, como decimal exacto. | `12` |
| `inventory[].unit` | No | `PracticeConceptDto` | Sin restricción adicional declarada | Unidad de medida, si la declara. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `inventory[].unit.code` | No | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `inventory[].unit.display` | No | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |
| `inventory[].reorderLevel` | No | `string` | admite null | Punto de reposición configurado, si lo tiene. | `valor-ejemplo` |
| `inventory[].belowReorderLevel` | Sí | `boolean` | Sin restricción adicional declarada | Si las existencias cayeron al punto de reposición o por debajo. `false` cuando no hay punto configurado: sin umbral no hay faltante que declarar, y decir `true` ahí sería una alarma inventada. | `true` |
| `inventory[].status` | Sí | `PracticeConceptDto` | Sin restricción adicional declarada | Estado del insumo. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `inventory[].status.code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `inventory[].status.display` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PERIOP_ADMIN, SURGERY_SCHEDULER, SCHEDULING_ADMIN, PRACTITIONER, CLINICIAN, ACCOUNTING_APPROVER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/practice/services/practice-organization-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practices/{practiceId}/organization"
}
```

---

## 40. GET /practices/{practiceId}/role-assignments

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Listar las vinculaciones profesional-organización de la práctica
- **Operation ID:** `PracticesController_listRoleAssignments`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.listRoleAssignments](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Listar las vinculaciones profesional-organización de la práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Vinculaciones profesional-organización de la práctica, paginadas por cursor (CV-14). Antes de esto, `POST …/role-assignments/:roleId/approve` existía sin ninguna forma de ver qué había pendiente: el administrador tenía que conseguir el uuid por otro canal. Sin `@Roles`: la ve quien administra esa organización (A-6), que decide el servicio.

### Descripción del sistema

NestJS resuelve `GET /practices/{practiceId}/role-assignments` en `PracticesController_listRoleAssignments`. El controlador delega en `PracticeWorkforceService.listPracticeAssignments`. No recibe body. El tipo de retorno estático es `Promise<ListPracticeRoleAssignmentsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | query | No | `string` | Sin restricción adicional declarada | Concepto de estado (p. ej. la vinculación pendiente) | `ok` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Vinculaciones por página | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /practices/00000000-0000-4000-8000-000000000001/role-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `practiceId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /practices/00000000-0000-4000-8000-000000000001/role-assignments?status=ok&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListPracticeRoleAssignmentsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListPracticeRoleAssignmentsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListPracticeRoleAssignmentsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListPracticeRoleAssignmentsResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ListPracticeRoleAssignmentsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListPracticeRoleAssignmentsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListPracticeRoleAssignmentsResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ListPracticeRoleAssignmentsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListPracticeRoleAssignmentsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "status": "ok",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PracticeRoleAssignmentItemDto>` | Sin restricción adicional declarada | Vinculaciones de esta página, ordenadas por `id`. | `[{"status":"ok","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].status` | Sí | `string` | Sin restricción adicional declarada | Estado como uuid de concepto, igual que antes de las filas por procedimiento. | `ok` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Fecha de creación de la vinculación. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `nextCursor` | Sí | `string` | admite null | Cursor opaco de continuación, o `null` si ésta es la última página. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practices/{practiceId}/role-assignments"
}
```

---

## 41. POST /practices/{practiceId}/role-assignments

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Asignar un rol de profesional a sitio/unidad/servicio
- **Operation ID:** `PracticesController_assignRole`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.assignRole](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Asignar un rol de profesional a sitio/unidad/servicio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /practices/{practiceId}/role-assignments` en `PracticesController_assignRole`. El controlador delega en `PracticeWorkforceService.assignRole`. Valida el body como `PracticeCreateRoleAssignmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<RoleAssignmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PracticeCreateRoleAssignmentDto`; los campos opcionales se omiten.

```http
POST /practices/00000000-0000-4000-8000-000000000001/role-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `practiceId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practitionerProfileId` | Sí | `string` | formato `uuid` | Perfil del profesional (profiles.health_practitioner_profiles) | `00000000-0000-4000-8000-000000000001` |
| `practiceSiteId` | No | `string` | formato `uuid` | Sitio de la práctica | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid` | Unidad clínica | `00000000-0000-4000-8000-000000000001` |
| `healthcareServiceId` | No | `string` | formato `uuid` | Servicio de salud | `00000000-0000-4000-8000-000000000001` |
| `roleConceptId` | No | `string` | formato `uuid` | Concepto de rol | `00000000-0000-4000-8000-000000000001` |
| `specialtyConceptId` | No | `string` | formato `uuid` | Concepto de especialidad | `00000000-0000-4000-8000-000000000001` |
| `supervisorPractitionerProfileId` | No | `string` | formato `uuid` | Perfil del supervisor | `00000000-0000-4000-8000-000000000001` |
| `revenueSharePercent` | No | `string` | Sin restricción adicional declarada | Porcentaje de reparto de ingresos (numérico) | `valor-ejemplo` |
| `isPrimary` | No | `boolean` | Sin restricción adicional declarada | ¿Rol primario? | `true` |
| `validFrom` | No | `string` | Sin restricción adicional declarada | Vigente desde (ISO date) | `valor-ejemplo` |
| `validTo` | No | `string` | Sin restricción adicional declarada | Vigente hasta (ISO date) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practices/00000000-0000-4000-8000-000000000001/role-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "roleConceptId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "supervisorPractitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "revenueSharePercent": "valor-ejemplo",
  "isPrimary": true,
  "validFrom": "valor-ejemplo",
  "validTo": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RoleAssignmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La práctica no está activa | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 422 | `PRECONDITION_FAILED` | El sitio no pertenece a la práctica | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 422 | `PRECONDITION_FAILED` | La unidad no pertenece a la práctica | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 422 | `PRECONDITION_FAILED` | El servicio no pertenece a la práctica | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practices/{practiceId}/role-assignments"
}
```

---

## 42. POST /practices/{practiceId}/role-assignments/invitations

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Invitar a un profesional a procedimientos de una sede
- **Operation ID:** `PracticeInvitationsController_invite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticeInvitationsController.invite](../../src/modules/practice/controllers/practice-invitations.controller.ts)

### Descripción de negocio

Crea una vinculación INVITED por procedimiento. Ninguna llega a ACTIVE sin que el profesional la acepte.

Contexto declarado en el controlador: El centro invita a un profesional a procedimientos de una sede.

### Descripción del sistema

NestJS resuelve `POST /practices/{practiceId}/role-assignments/invitations` en `PracticeInvitationsController_invite`. El controlador delega en `PracticeAffiliationInvitationsService.invite`. Valida el body como `InvitePractitionerDto` y consume `application/json`. El tipo de retorno estático es `Promise<RoleAssignmentRowsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `InvitePractitionerDto`; los campos opcionales se omiten.

```http
POST /practices/00000000-0000-4000-8000-000000000001/role-assignments/invitations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `practiceId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practitionerProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `healthcareServiceIds` | Sí | `array<string>` | formato `uuid`; mínimo 1 elemento(s); máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practices/00000000-0000-4000-8000-000000000001/role-assignments/invitations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RoleAssignmentRowsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RoleAssignmentRowsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RoleAssignmentRowsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RoleAssignmentRowsResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RoleAssignmentRowsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RoleAssignmentRowsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RoleAssignmentRowsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RoleAssignmentRowsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RoleAssignmentRowsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RoleAssignmentRowsResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RoleAssignmentRowsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RoleAssignmentRowsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "practitionerName": "Nombre de ejemplo",
      "practiceId": "00000000-0000-4000-8000-000000000001",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
      "serviceConceptId": "00000000-0000-4000-8000-000000000001",
      "serviceDisplay": "valor-ejemplo",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "statusCode": "CODIGO_EJEMPLO",
      "initiatedBy": {}
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<RoleAssignmentRowDto>` | Sin restricción adicional declarada | Filas creadas, en el orden pedido. | `[{"id":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","practitionerName":"Nombre de ejemplo","practiceId":"00000000-0000-4000-8000-000000000001","practiceSiteId":"00000000-0000-4000-8000-000000000001","healthcareServiceId":"00000000-0000-4000-8000-000000000001","serviceConceptId":"00000000-0000-4000-8000-000000000001","serviceDisplay":"valor-ejemplo","statusConceptId":"00000000-0000-4000-8000-000000000001","statusCode":"CODIGO_EJEMPLO","initiatedBy":{}}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la afiliación. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerProfileId` | Sí | `string` | formato `uuid` | Profesional afiliado. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerName` | Sí | `string` | Sin restricción adicional declarada | Nombre legible del profesional. | `Nombre de ejemplo` |
| `items[].practiceId` | Sí | `string` | formato `uuid` | Organización. | `00000000-0000-4000-8000-000000000001` |
| `items[].practiceSiteId` | Sí | `string` | formato `uuid`; admite null | Sede; `null` en una vinculación antigua que no declara sede. | `00000000-0000-4000-8000-000000000001` |
| `items[].healthcareServiceId` | Sí | `string` | formato `uuid`; admite null | Servicio ofrecido por la sede; `null` si la vinculación no es por procedimiento. | `00000000-0000-4000-8000-000000000001` |
| `items[].serviceConceptId` | Sí | `string` | formato `uuid`; admite null | Procedimiento del nomenclador del servicio; `null` sin servicio. | `00000000-0000-4000-8000-000000000001` |
| `items[].serviceDisplay` | Sí | `string` | admite null | Nombre del procedimiento para mostrar; `null` sin servicio. | `valor-ejemplo` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado (uuid). | `00000000-0000-4000-8000-000000000001` |
| `items[].statusCode` | Sí | `string` | Sin restricción adicional declarada | Código del concepto del estado (`ROLE_ASG_ACTIVE`, …); el front compara por código. | `CODIGO_EJEMPLO` |
| `items[].initiatedBy` | Sí | `object` | Sin restricción adicional declarada | Quién abrió la afiliación. Se deriva de la cuenta que creó la fila: si es la del propio profesional, `PRACTITIONER`; si no, `PRACTICE`. | `{}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 409 | `CONFLICT` | El profesional ya tiene una vinculación en curso con ese procedimiento | Excepción explícita en src/modules/practice/services/practice-affiliation-invitations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La práctica no está activa | Excepción explícita en src/modules/practice/services/practice-affiliation-invitations.service.ts |
| 422 | `PRECONDITION_FAILED` | El sitio no pertenece a la práctica | Excepción explícita en src/modules/practice/services/practice-affiliation-invitations.service.ts |
| 422 | `PRECONDITION_FAILED` | El profesional no existe | Excepción explícita en src/modules/practice/services/practice-affiliation-invitations.service.ts |
| 422 | `PRECONDITION_FAILED` | El procedimiento no está publicado y activo en esa sede | Excepción explícita en src/modules/practice/services/practice-affiliation-invitations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practices/{practiceId}/role-assignments/invitations"
}
```

---

## 43. POST /practices/{practiceId}/role-assignments/self-request

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Solicitar la propia vinculación a una organización
- **Operation ID:** `PracticesController_selfRequestRoleAssignment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.selfRequestRoleAssignment](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Autoservicio del profesional: queda PENDING hasta que la organización la apruebe, rechace, suspenda o finalice. No concede acceso a pacientes de la organización.

Contexto declarado en el controlador: Carril 18 — el profesional pide vincularse a la organización por su cuenta; queda `PENDING` hasta que la organización la apruebe (ver `/role-assignments/:roleId/approve` en `RoleAssignmentsController`).

### Descripción del sistema

NestJS resuelve `POST /practices/{practiceId}/role-assignments/self-request` en `PracticesController_selfRequestRoleAssignment`. El controlador delega en `PracticeWorkforceService.selfRequestAffiliation`. Valida el body como `PracticeSelfRequestRoleAssignmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<RoleAssignmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PracticeSelfRequestRoleAssignmentDto`; los campos opcionales se omiten.

```http
POST /practices/00000000-0000-4000-8000-000000000001/role-assignments/self-request HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`.
- Deben ser UUID válidos: `practiceId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceSiteId` | No | `string` | formato `uuid` | Sitio de la práctica | `00000000-0000-4000-8000-000000000001` |
| `roleConceptId` | No | `string` | formato `uuid` | Concepto de cargo/rol | `00000000-0000-4000-8000-000000000001` |
| `specialtyConceptId` | No | `string` | formato `uuid` | Concepto de especialidad | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | Sin restricción adicional declarada | Vigente desde (ISO date) | `valor-ejemplo` |
| `healthcareServiceId` | No | `string` | formato `uuid` | Servicio de salud (procedimiento) de la sede | `00000000-0000-4000-8000-000000000001` |
| `note` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practices/00000000-0000-4000-8000-000000000001/role-assignments/self-request HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "roleConceptId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "valor-ejemplo",
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RoleAssignmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 409 | `CONFLICT` | Ya tenés una vinculación en curso con ese procedimiento | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 422 | `PRECONDITION_FAILED` | La práctica no está activa | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 422 | `PRECONDITION_FAILED` | El sitio no pertenece a la práctica | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 422 | `PRECONDITION_FAILED` | El procedimiento no está publicado y activo en esa sede | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practices/{practiceId}/role-assignments/self-request"
}
```

---

## 44. PUT /practices/{practiceId}/settings/{settingKey}

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Configurar un ajuste de práctica (upsert)
- **Operation ID:** `PracticesController_upsertSetting`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.upsertSetting](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Configurar un ajuste de práctica (upsert). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /practices/{practiceId}/settings/{settingKey}` en `PracticesController_upsertSetting`. El controlador delega en `PracticeSettingsService.upsert`. Valida el body como `UpsertSettingDto` y consume `application/json`. El tipo de retorno estático es `Promise<SettingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `settingKey` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpsertSettingDto`; los campos opcionales se omiten.

```http
PUT /practices/00000000-0000-4000-8000-000000000001/settings/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "valueJson": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `practiceId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `valueJson` | Sí | `object` | Sin restricción adicional declarada | Valor del ajuste (JSON arbitrario) | `{}` |
| `categoryConceptId` | No | `string` | formato `uuid` | Concepto de categoría del ajuste | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /practices/00000000-0000-4000-8000-000000000001/settings/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "valueJson": {},
  "categoryConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SettingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SettingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SettingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SettingResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SettingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SettingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SettingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SettingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SettingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SettingResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SettingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SettingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "settingKey": "valor-ejemplo",
  "created": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `settingKey` | Sí | `string` | Sin restricción adicional declarada | Valor de setting key mantenido por la instancia. | `valor-ejemplo` |
| `created` | Sí | `boolean` | Sin restricción adicional declarada | true si se creó, false si se actualizó | `true` |

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
  "path": "/practices/{practiceId}/settings/{settingKey}"
}
```

---

## 45. GET /practices/{practiceId}/sites

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Listar las sedes de una práctica
- **Operation ID:** `PracticesController_listSites`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.listSites](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Listar las sedes de una práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Sedes de una práctica. Sin `@Roles`: lee quien tiene un rol de programación o clínica y quien administra la organización dueña (A-6), que decide el servicio. Un `@Roles` global no ve la membresía y le cerraba la puerta al dueño del centro.

### Descripción del sistema

NestJS resuelve `GET /practices/{practiceId}/sites` en `PracticesController_listSites`. El controlador delega en `PracticeSitesService.listSites`. No recibe body. El tipo de retorno estático es `Promise<SiteSummaryDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /practices/00000000-0000-4000-8000-000000000001/sites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `practiceId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /practices/00000000-0000-4000-8000-000000000001/sites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SiteSummaryDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<SiteSummaryDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<SiteSummaryDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<SiteSummaryDto[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<SiteSummaryDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<SiteSummaryDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<SiteSummaryDto[]>` | No |
| 504 | Consulta completada correctamente. | `Promise<SiteSummaryDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteSummaryDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "practiceId": "00000000-0000-4000-8000-000000000001",
    "code": "CODIGO_EJEMPLO",
    "name": "Nombre de ejemplo",
    "status": "00000000-0000-4000-8000-000000000001"
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/practice/services/practice-sites.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practices/{practiceId}/sites"
}
```

---

## 46. POST /practices/{practiceId}/sites

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Dar de alta un sitio de práctica
- **Operation ID:** `PracticesController_createSite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.createSite](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Dar de alta un sitio de práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-14-01. Sin `@Roles`: lo autoriza el servicio con la regla de organización (OWNER/ADMIN del tenant o plataforma); una práctica de otro tenant responde 404.

### Descripción del sistema

NestJS resuelve `POST /practices/{practiceId}/sites` en `PracticesController_createSite`. El controlador delega en `PracticeSitesService.createSite`. Valida el body como `PracticeCreateSiteDto` y consume `application/json`. El tipo de retorno estático es `Promise<SiteResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PracticeCreateSiteDto`; los campos opcionales se omiten.

```http
POST /practices/00000000-0000-4000-8000-000000000001/sites HTTP/1.1
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
- Deben ser UUID válidos: `practiceId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Código de sitio único dentro de la práctica | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Nombre del sitio | `Nombre de ejemplo` |
| `siteTypeConceptId` | No | `string` | formato `uuid` | Concepto de tipo de sitio | `00000000-0000-4000-8000-000000000001` |
| `physicalTypeConceptId` | No | `string` | formato `uuid` | Concepto de tipo físico | `00000000-0000-4000-8000-000000000001` |
| `timeZone` | No | `string` | Sin restricción adicional declarada | Zona horaria IANA | `America/La_Paz` |
| `addressId` | No | `string` | formato `uuid` | Dirección (common.addresses) | `00000000-0000-4000-8000-000000000001` |
| `branchId` | No | `string` | formato `uuid` | Sucursal (directory.branches) | `00000000-0000-4000-8000-000000000001` |
| `managingTenantId` | No | `string` | formato `uuid` | Tenant gestor del sitio (directory.tenants) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practices/00000000-0000-4000-8000-000000000001/sites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "siteTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "physicalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "timeZone": "America/La_Paz",
  "addressId": "00000000-0000-4000-8000-000000000001",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "managingTenantId": "00000000-0000-4000-8000-000000000001"
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
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Branch no encontrada | Excepción explícita en src/modules/practice/services/practice-sites.service.ts |
| 409 | `CONFLICT` | Ya existe un sitio con ese código en la práctica | Excepción explícita en src/modules/practice/services/practice-sites.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La práctica no está activa | Excepción explícita en src/modules/practice/services/practice-sites.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practices/{practiceId}/sites"
}
```

---

## 47. DELETE /practices/{practiceId}/sites/{siteId}

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Desmantelar un sitio en cascada (soft-delete)
- **Operation ID:** `PracticesController_decommissionSite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.decommissionSite](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Desmantelar un sitio en cascada (soft-delete). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-14-12. Misma autorización que `createSite`.

### Descripción del sistema

NestJS resuelve `DELETE /practices/{practiceId}/sites/{siteId}` en `PracticesController_decommissionSite`. El controlador delega en `PracticeSitesService.decommissionSite`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `practiceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /practices/00000000-0000-4000-8000-000000000001/sites/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `practiceId`, `siteId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /practices/00000000-0000-4000-8000-000000000001/sites/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado en la práctica | Excepción explícita en src/modules/practice/services/practice-sites.service.ts |
| 409 | `CONFLICT` | El sitio ya está retirado | Excepción explícita en src/modules/practice/services/practice-sites.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practices/{practiceId}/sites/{siteId}"
}
```

---

## 48. GET /practitioners/{profileId}/sites

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Consultorios donde atiende el profesional
- **Operation ID:** `PractitionerSitesController_listSites`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSitesController.listSites](../../src/modules/practice/controllers/practitioner-sites.controller.ts)

### Descripción de negocio

Sale de sus asignaciones de rol vigentes con sede. Una lista vacía significa que no tiene ninguna, no que el profesional no exista.


### Descripción del sistema

NestJS resuelve `GET /practitioners/{profileId}/sites` en `PractitionerSitesController_listSites`. El controlador delega en `PractitionerSitesService.listSitesOfPractitioner`. No recibe body. El tipo de retorno estático es `Promise<PractitionerSitesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /practitioners/00000000-0000-4000-8000-000000000001/sites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`, `CLINICIAN`, `PATIENT`.
- Deben ser UUID válidos: `profileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /practitioners/00000000-0000-4000-8000-000000000001/sites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerSitesResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PractitionerSitesResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PractitionerSitesResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PractitionerSitesResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PractitionerSitesResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PractitionerSitesResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PractitionerSitesResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PractitionerSitesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerSitesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "practiceId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "timeZone": "America/La_Paz",
      "addressText": "Av. Brasil 1234, La Paz",
      "latitude": 1,
      "longitude": 1,
      "contactPhone": "+591 72123456",
      "isOwnSite": true,
      "bankQrFileId": "00000000-0000-4000-8000-000000000001",
      "logoFileId": "00000000-0000-4000-8000-000000000001",
      "status": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PractitionerSiteDto>` | Sin restricción adicional declarada | Las sedes donde atiende, la principal primero. | `[{"id":"00000000-0000-4000-8000-000000000001","practiceId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","timeZone":"America/La_Paz","addressText":"Av. Brasil 1234, La Paz","latitude":1,"longitude":1,"contactPhone":"+591 72123456","isOwnSite":true,"bankQrFileId":"00000000-0000-4000-8000-000000000001","logoFileId":"00000000-0000-4000-8000-000000000001","status":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la sede. | `00000000-0000-4000-8000-000000000001` |
| `items[].practiceId` | Sí | `string` | formato `uuid` | Práctica a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código único dentro de la práctica. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Nombre de ejemplo` |
| `items[].timeZone` | No | `string` | admite null | Zona horaria IANA de la sede, si la declara. | `America/La_Paz` |
| `items[].addressText` | No | `string` | admite null | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `Av. Brasil 1234, La Paz` |
| `items[].latitude` | No | `number` | admite null | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `1` |
| `items[].longitude` | No | `number` | admite null | Longitud del punto de la sede. Va siempre junto a `latitude`. | `1` |
| `items[].contactPhone` | No | `string` | admite null | Teléfono de este profesional en esta sede, si lo declaró. | `+591 72123456` |
| `items[].isOwnSite` | Sí | `boolean` | Sin restricción adicional declarada | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `true` |
| `items[].bankQrFileId` | No | `string` | formato `uuid`; admite null | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `00000000-0000-4000-8000-000000000001` |
| `items[].logoFileId` | No | `string` | formato `uuid`; admite null | Logo del consultorio, el que sale en el membrete de sus PDF, o `null` si no tiene. Se lee con `GET /common/files/:id/content`. | `00000000-0000-4000-8000-000000000001` |
| `items[].status` | Sí | `string` | formato `uuid` | Concepto de estado. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, CLINICIAN, PATIENT. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioners/{profileId}/sites"
}
```

---

## 49. GET /practitioners/me/joinable-practices

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Organizaciones a las que puedo pedir vincularme
- **Operation ID:** `PractitionerSitesController_listJoinablePractices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSitesController.listJoinablePractices](../../src/modules/practice/controllers/practitioner-sites.controller.ts)

### Descripción de negocio

Organizaciones activas de cualquier tenant, sin consultorios propios ni aquellas donde ya hay una vinculación pendiente, activa o suspendida.

Contexto declarado en el controlador: Las organizaciones a las que se puede pedir vincularse: el selector de «Pedir una vinculación». Cruza tenants a propósito (ver `PracticeWorkforceService.listJoinablePractices`); por eso no usa `GET /practices`, que sólo ve la organización activa de la sesión.

### Descripción del sistema

NestJS resuelve `GET /practitioners/me/joinable-practices` en `PractitionerSitesController_listJoinablePractices`. El controlador delega en `PracticeWorkforceService.listJoinablePractices`. No recibe body. El tipo de retorno estático es `Promise<JoinablePracticeResponseDto[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /practitioners/me/joinable-practices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /practitioners/me/joinable-practices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<JoinablePracticeResponseDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<JoinablePracticeResponseDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<JoinablePracticeResponseDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<JoinablePracticeResponseDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<JoinablePracticeResponseDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<JoinablePracticeResponseDto[]>` | No |
| 504 | Consulta completada correctamente. | `Promise<JoinablePracticeResponseDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JoinablePracticeResponseDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "name": "Nombre de ejemplo",
    "practiceType": "00000000-0000-4000-8000-000000000001"
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioners/me/joinable-practices"
}
```

---

## 50. GET /practitioners/me/role-assignments

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Mis vinculaciones con organizaciones
- **Operation ID:** `PractitionerSitesController_listMyAssignments`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSitesController.listMyAssignments](../../src/modules/practice/controllers/practitioner-sites.controller.ts)

### Descripción de negocio

Incluye pendientes, activas, suspendidas, rechazadas y finalizadas. No implica acceso a pacientes de esas organizaciones.

Contexto declarado en el controlador: Carril 18 — «mis organizaciones»: todas las vinculaciones del profesional autenticado (cualquier estado, cualquier organización). Cuelga de `me` y no de un `:profileId` porque es autoservicio: cada profesional ve las suyas, no las de otro.

### Descripción del sistema

NestJS resuelve `GET /practitioners/me/role-assignments` en `PractitionerSitesController_listMyAssignments`. El controlador delega en `PracticeWorkforceService.listMyAssignments`. No recibe body. El tipo de retorno estático es `Promise<MyRoleAssignmentResponseDto[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /practitioners/me/role-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /practitioners/me/role-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MyRoleAssignmentResponseDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<MyRoleAssignmentResponseDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<MyRoleAssignmentResponseDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<MyRoleAssignmentResponseDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<MyRoleAssignmentResponseDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<MyRoleAssignmentResponseDto[]>` | No |
| 504 | Consulta completada correctamente. | `Promise<MyRoleAssignmentResponseDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MyRoleAssignmentResponseDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "practiceName": "Nombre de ejemplo",
    "practiceType": "00000000-0000-4000-8000-000000000001",
    "roleConceptId": "00000000-0000-4000-8000-000000000001",
    "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
    "status": "00000000-0000-4000-8000-000000000001",
    "isPrimary": true,
    "validFrom": "2026-07-31T12:00:00.000Z",
    "validTo": "2026-07-31T12:00:00.000Z",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "avatarUrl": "valor-ejemplo"
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioners/me/role-assignments"
}
```

---

## 51. POST /practitioners/me/role-assignments/{roleId}/accept

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Aceptar una invitación de un centro
- **Operation ID:** `PractitionerInvitationsController_accept`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerInvitationsController.accept](../../src/modules/practice/controllers/practitioner-invitations.controller.ts)

### Descripción de negocio

Aceptar una invitación de un centro. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: `INVITED → ACTIVE`, solo esa fila.

### Descripción del sistema

NestJS resuelve `POST /practitioners/me/role-assignments/{roleId}/accept` en `PractitionerInvitationsController_accept`. El controlador delega en `PracticeAffiliationInvitationsService.accept`. No recibe body. El tipo de retorno estático es `Promise<RoleAssignmentRowDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `roleId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /practitioners/me/role-assignments/00000000-0000-4000-8000-000000000001/accept HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`.
- Deben ser UUID válidos: `roleId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /practitioners/me/role-assignments/00000000-0000-4000-8000-000000000001/accept HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RoleAssignmentRowDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "practitionerName": "Nombre de ejemplo",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceDisplay": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "statusCode": "CODIGO_EJEMPLO",
  "initiatedBy": {}
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador de la afiliación. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | Sí | `string` | formato `uuid` | Profesional afiliado. | `00000000-0000-4000-8000-000000000001` |
| `practitionerName` | Sí | `string` | Sin restricción adicional declarada | Nombre legible del profesional. | `Nombre de ejemplo` |
| `practiceId` | Sí | `string` | formato `uuid` | Organización. | `00000000-0000-4000-8000-000000000001` |
| `practiceSiteId` | Sí | `string` | formato `uuid`; admite null | Sede; `null` en una vinculación antigua que no declara sede. | `00000000-0000-4000-8000-000000000001` |
| `healthcareServiceId` | Sí | `string` | formato `uuid`; admite null | Servicio ofrecido por la sede; `null` si la vinculación no es por procedimiento. | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | Sí | `string` | formato `uuid`; admite null | Procedimiento del nomenclador del servicio; `null` sin servicio. | `00000000-0000-4000-8000-000000000001` |
| `serviceDisplay` | Sí | `string` | admite null | Nombre del procedimiento para mostrar; `null` sin servicio. | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado (uuid). | `00000000-0000-4000-8000-000000000001` |
| `statusCode` | Sí | `string` | Sin restricción adicional declarada | Código del concepto del estado (`ROLE_ASG_ACTIVE`, …); el front compara por código. | `CODIGO_EJEMPLO` |
| `initiatedBy` | Sí | `object` | Sin restricción adicional declarada | Quién abrió la afiliación. Se deriva de la cuenta que creó la fila: si es la del propio profesional, `PRACTITIONER`; si no, `PRACTICE`. | `{}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Vinculación no encontrada | Excepción explícita en src/modules/practice/services/practice-affiliation-invitations.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/practice/services/practice-affiliation-invitations.service.ts |
| 422 | `PRECONDITION_FAILED` | La vinculación no admite esa acción desde su estado actual | Excepción explícita en src/modules/practice/services/practice-affiliation-invitations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioners/me/role-assignments/{roleId}/accept"
}
```

---

## 52. POST /practitioners/me/role-assignments/{roleId}/decline

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Declinar una invitación de un centro
- **Operation ID:** `PractitionerInvitationsController_decline`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerInvitationsController.decline](../../src/modules/practice/controllers/practitioner-invitations.controller.ts)

### Descripción de negocio

Declinar una invitación de un centro. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: `INVITED → REJECTED`, solo esa fila.

### Descripción del sistema

NestJS resuelve `POST /practitioners/me/role-assignments/{roleId}/decline` en `PractitionerInvitationsController_decline`. El controlador delega en `PracticeAffiliationInvitationsService.decline`. No recibe body. El tipo de retorno estático es `Promise<RoleAssignmentRowDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `roleId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /practitioners/me/role-assignments/00000000-0000-4000-8000-000000000001/decline HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`.
- Deben ser UUID válidos: `roleId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /practitioners/me/role-assignments/00000000-0000-4000-8000-000000000001/decline HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RoleAssignmentRowDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RoleAssignmentRowDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "practitionerName": "Nombre de ejemplo",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "serviceConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceDisplay": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "statusCode": "CODIGO_EJEMPLO",
  "initiatedBy": {}
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador de la afiliación. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | Sí | `string` | formato `uuid` | Profesional afiliado. | `00000000-0000-4000-8000-000000000001` |
| `practitionerName` | Sí | `string` | Sin restricción adicional declarada | Nombre legible del profesional. | `Nombre de ejemplo` |
| `practiceId` | Sí | `string` | formato `uuid` | Organización. | `00000000-0000-4000-8000-000000000001` |
| `practiceSiteId` | Sí | `string` | formato `uuid`; admite null | Sede; `null` en una vinculación antigua que no declara sede. | `00000000-0000-4000-8000-000000000001` |
| `healthcareServiceId` | Sí | `string` | formato `uuid`; admite null | Servicio ofrecido por la sede; `null` si la vinculación no es por procedimiento. | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | Sí | `string` | formato `uuid`; admite null | Procedimiento del nomenclador del servicio; `null` sin servicio. | `00000000-0000-4000-8000-000000000001` |
| `serviceDisplay` | Sí | `string` | admite null | Nombre del procedimiento para mostrar; `null` sin servicio. | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado (uuid). | `00000000-0000-4000-8000-000000000001` |
| `statusCode` | Sí | `string` | Sin restricción adicional declarada | Código del concepto del estado (`ROLE_ASG_ACTIVE`, …); el front compara por código. | `CODIGO_EJEMPLO` |
| `initiatedBy` | Sí | `object` | Sin restricción adicional declarada | Quién abrió la afiliación. Se deriva de la cuenta que creó la fila: si es la del propio profesional, `PRACTITIONER`; si no, `PRACTICE`. | `{}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Vinculación no encontrada | Excepción explícita en src/modules/practice/services/practice-affiliation-invitations.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/practice/services/practice-affiliation-invitations.service.ts |
| 422 | `PRECONDITION_FAILED` | La vinculación no admite esa acción desde su estado actual | Excepción explícita en src/modules/practice/services/practice-affiliation-invitations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioners/me/role-assignments/{roleId}/decline"
}
```

---

## 53. POST /practitioners/me/sites

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Registrar un consultorio propio
- **Operation ID:** `PractitionerSitesController_createOwnSite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSitesController.createOwnSite](../../src/modules/practice/controllers/practitioner-sites.controller.ts)

### Descripción de negocio

Crea (o reutiliza) la práctica personal del profesional, la sede y la vinculación que la conecta con su agenda.

Contexto declarado en el controlador: ALV-005/006 — autoservicio: el profesional da de alta su propio consultorio, sin depender de que una organización lo afilie primero.

### Descripción del sistema

NestJS resuelve `POST /practitioners/me/sites` en `PractitionerSitesController_createOwnSite`. El controlador delega en `PractitionerSitesService.createOwnSite`. Valida el body como `CreateOwnSiteDto` y consume `application/json`. El tipo de retorno estático es `Promise<PractitionerSiteDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateOwnSiteDto`; los campos opcionales se omiten.

```http
POST /practitioners/me/sites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud mínima 2; longitud máxima 200 | Nombre del consultorio | `Nombre de ejemplo` |
| `timeZone` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `address` | No | `OwnSiteAddressDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"lines":["valor-ejemplo"],"city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","district":"valor-ejemplo","administrativeAreaConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `address.lines` | No | `array<string>` | longitud máxima 500 | Líneas de la dirección; puede ir vacía si la sede se ubica sólo por municipio o coordenadas | `["valor-ejemplo"]` |
| `address.city` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `address.municipalityConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `address.district` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `address.administrativeAreaConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `address.latitude` | No | `number` | mínimo -90; máximo 90 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `address.longitude` | No | `number` | mínimo -180; máximo 180 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `contactPhone` | No | `string` | longitud máxima 40; patrón runtime `SITE_CONTACT_PHONE_PATTERN` | Sin descripción específica en el contrato OpenAPI. | `+591 72123456` |
| `logoFileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /practitioners/me/sites HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "timeZone": "America/La_Paz",
  "address": {
    "lines": [
      "valor-ejemplo"
    ],
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "district": "valor-ejemplo",
    "administrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  },
  "contactPhone": "+591 72123456",
  "logoFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerSiteDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "timeZone": "America/La_Paz",
  "addressText": "Av. Brasil 1234, La Paz",
  "latitude": 1,
  "longitude": 1,
  "contactPhone": "+591 72123456",
  "isOwnSite": true,
  "bankQrFileId": "00000000-0000-4000-8000-000000000001",
  "logoFileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador de la sede. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Práctica a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Código único dentro de la práctica. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Nombre de ejemplo` |
| `timeZone` | No | `string` | admite null | Zona horaria IANA de la sede, si la declara. | `America/La_Paz` |
| `addressText` | No | `string` | admite null | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `Av. Brasil 1234, La Paz` |
| `latitude` | No | `number` | admite null | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `1` |
| `longitude` | No | `number` | admite null | Longitud del punto de la sede. Va siempre junto a `latitude`. | `1` |
| `contactPhone` | No | `string` | admite null | Teléfono de este profesional en esta sede, si lo declaró. | `+591 72123456` |
| `isOwnSite` | Sí | `boolean` | Sin restricción adicional declarada | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `true` |
| `bankQrFileId` | No | `string` | formato `uuid`; admite null | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `00000000-0000-4000-8000-000000000001` |
| `logoFileId` | No | `string` | formato `uuid`; admite null | Logo del consultorio, el que sale en el membrete de sus PDF, o `null` si no tiene. Se lee con `GET /common/files/:id/content`. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | ${labels.subject} no le pertenece | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/application/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El logo no es un archivo suyo que se pueda usar | Excepción explícita en src/modules/practice/services/practitioner-sites.service.ts |
| 422 | `PRECONDITION_FAILED` | El logo debe ser una imagen | Excepción explícita en src/modules/practice/services/practitioner-sites.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioners/me/sites"
}
```

---

## 54. DELETE /practitioners/me/sites/{siteId}

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Retirar un consultorio propio
- **Operation ID:** `PractitionerSitesController_deleteOwnSite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSitesController.deleteOwnSite](../../src/modules/practice/controllers/practitioner-sites.controller.ts)

### Descripción de negocio

Retirar un consultorio propio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: ALV-005 — retira un consultorio propio (no lo borra: cierra la vinculación vigente con esa sede).

### Descripción del sistema

NestJS resuelve `DELETE /practitioners/me/sites/{siteId}` en `PractitionerSitesController_deleteOwnSite`. El controlador delega en `PractitionerSitesService.deleteOwnSite`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /practitioners/me/sites/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `siteId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /practitioners/me/sites/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/application/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | No tiene una vinculación vigente con esa sede | Excepción explícita en src/modules/practice/services/practitioner-sites.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioners/me/sites/{siteId}"
}
```

---

## 55. PATCH /practitioners/me/sites/{siteId}

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Corregir un consultorio propio
- **Operation ID:** `PractitionerSitesController_updateOwnSite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSitesController.updateOwnSite](../../src/modules/practice/controllers/practitioner-sites.controller.ts)

### Descripción de negocio

Cambia nombre, huso horario o dirección sin retirar la sede: el id se conserva, y es el que la agenda referencia en cada turno.

Contexto declarado en el controlador: P32-b — corrige el consultorio propio: nombre, huso horario y dirección (con su punto en el mapa). Lo que no viaja en el cuerpo no se toca. Sólo alcanza al consultorio propio: una sede de otra organización es de ella, y lo que el profesional tiene con ella es una vinculación.

### Descripción del sistema

NestJS resuelve `PATCH /practitioners/me/sites/{siteId}` en `PractitionerSitesController_updateOwnSite`. El controlador delega en `PractitionerSitesService.updateOwnSite`. Valida el body como `UpdateOwnSiteDto` y consume `application/json`. El tipo de retorno estático es `Promise<PractitionerSiteDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateOwnSiteDto`; los campos opcionales se omiten.

```http
PATCH /practitioners/me/sites/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | No | `string` | longitud mínima 2; longitud máxima 200 | Nombre del consultorio | `Nombre de ejemplo` |
| `timeZone` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `address` | No | `OwnSiteAddressDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"lines":["valor-ejemplo"],"city":"valor-ejemplo","municipalityConceptId":"00000000-0000-4000-8000-000000000001","district":"valor-ejemplo","administrativeAreaConceptId":"00000000-0000-4000-8000-000000000001","latitude":1,"longitude":1}` |
| `address.lines` | No | `array<string>` | longitud máxima 500 | Líneas de la dirección; puede ir vacía si la sede se ubica sólo por municipio o coordenadas | `["valor-ejemplo"]` |
| `address.city` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `address.municipalityConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `address.district` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `address.administrativeAreaConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `address.latitude` | No | `number` | mínimo -90; máximo 90 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `address.longitude` | No | `number` | mínimo -180; máximo 180 | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /practitioners/me/sites/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "timeZone": "America/La_Paz",
  "address": {
    "lines": [
      "valor-ejemplo"
    ],
    "city": "valor-ejemplo",
    "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
    "district": "valor-ejemplo",
    "administrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
    "latitude": 1,
    "longitude": 1
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerSiteDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "timeZone": "America/La_Paz",
  "addressText": "Av. Brasil 1234, La Paz",
  "latitude": 1,
  "longitude": 1,
  "contactPhone": "+591 72123456",
  "isOwnSite": true,
  "bankQrFileId": "00000000-0000-4000-8000-000000000001",
  "logoFileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador de la sede. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Práctica a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Código único dentro de la práctica. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Nombre de ejemplo` |
| `timeZone` | No | `string` | admite null | Zona horaria IANA de la sede, si la declara. | `America/La_Paz` |
| `addressText` | No | `string` | admite null | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `Av. Brasil 1234, La Paz` |
| `latitude` | No | `number` | admite null | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `1` |
| `longitude` | No | `number` | admite null | Longitud del punto de la sede. Va siempre junto a `latitude`. | `1` |
| `contactPhone` | No | `string` | admite null | Teléfono de este profesional en esta sede, si lo declaró. | `+591 72123456` |
| `isOwnSite` | Sí | `boolean` | Sin restricción adicional declarada | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `true` |
| `bankQrFileId` | No | `string` | formato `uuid`; admite null | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `00000000-0000-4000-8000-000000000001` |
| `logoFileId` | No | `string` | formato `uuid`; admite null | Logo del consultorio, el que sale en el membrete de sus PDF, o `null` si no tiene. Se lee con `GET /common/files/:id/content`. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/application/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | Esa sede no es un consultorio propio suyo | Excepción explícita en src/modules/practice/services/practitioner-sites.service.ts |
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
  "path": "/practitioners/me/sites/{siteId}"
}
```

---

## 56. PUT /practitioners/me/sites/{siteId}/bank-qr

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Fijar o quitar el QR bancario de una sede
- **Operation ID:** `PractitionerSitesController_setSiteBankQr`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSitesController.setSiteBankQr](../../src/modules/practice/controllers/practitioner-sites.controller.ts)

### Descripción de negocio

Asocia un archivo ya subido como QR de cobro de esa sede. `fileId: null` lo quita.

Contexto declarado en el controlador: P33 — el QR bancario con el que el profesional cobra EN ESTA SEDE. A diferencia del `PATCH` de arriba, alcanza también a las sedes ajenas donde tiene vinculación vigente: lo que se guarda no es la sede, es con qué cobra él ahí. El archivo ya entró por `POST /common/files/upload`.

### Descripción del sistema

NestJS resuelve `PUT /practitioners/me/sites/{siteId}/bank-qr` en `PractitionerSitesController_setSiteBankQr`. El controlador delega en `PractitionerSitesService.setSiteBankQr`. Valida el body como `SetSiteBankQrDto` y consume `application/json`. El tipo de retorno estático es `Promise<PractitionerSiteDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetSiteBankQrDto`; los campos opcionales se omiten.

```http
PUT /practitioners/me/sites/00000000-0000-4000-8000-000000000001/bank-qr HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fileId": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fileId` | Sí | `object` | formato `uuid`; admite null | Archivo del QR ya subido, o null para quitarlo | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /practitioners/me/sites/00000000-0000-4000-8000-000000000001/bank-qr HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fileId": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerSiteDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "timeZone": "America/La_Paz",
  "addressText": "Av. Brasil 1234, La Paz",
  "latitude": 1,
  "longitude": 1,
  "contactPhone": "+591 72123456",
  "isOwnSite": true,
  "bankQrFileId": "00000000-0000-4000-8000-000000000001",
  "logoFileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador de la sede. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Práctica a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Código único dentro de la práctica. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Nombre de ejemplo` |
| `timeZone` | No | `string` | admite null | Zona horaria IANA de la sede, si la declara. | `America/La_Paz` |
| `addressText` | No | `string` | admite null | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `Av. Brasil 1234, La Paz` |
| `latitude` | No | `number` | admite null | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `1` |
| `longitude` | No | `number` | admite null | Longitud del punto de la sede. Va siempre junto a `latitude`. | `1` |
| `contactPhone` | No | `string` | admite null | Teléfono de este profesional en esta sede, si lo declaró. | `+591 72123456` |
| `isOwnSite` | Sí | `boolean` | Sin restricción adicional declarada | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `true` |
| `bankQrFileId` | No | `string` | formato `uuid`; admite null | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `00000000-0000-4000-8000-000000000001` |
| `logoFileId` | No | `string` | formato `uuid`; admite null | Logo del consultorio, el que sale en el membrete de sus PDF, o `null` si no tiene. Se lee con `GET /common/files/:id/content`. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/application/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | No tiene una vinculación vigente con esa sede | Excepción explícita en src/modules/practice/services/practitioner-sites.service.ts |
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
  "path": "/practitioners/me/sites/{siteId}/bank-qr"
}
```

---

## 57. PUT /practitioners/me/sites/{siteId}/contact-phone

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Guardar o quitar mi teléfono en una sede
- **Operation ID:** `PractitionerSitesController_setSiteContactPhone`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSitesController.setSiteContactPhone](../../src/modules/practice/controllers/practitioner-sites.controller.ts)

### Descripción de negocio

Guardar o quitar mi teléfono en una sede. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El contacto del profesional en una sede con vinculación activa.

### Descripción del sistema

NestJS resuelve `PUT /practitioners/me/sites/{siteId}/contact-phone` en `PractitionerSitesController_setSiteContactPhone`. El controlador delega en `PractitionerSitesService.setSiteContactPhone`. Valida el body como `SetSiteContactPhoneDto` y consume `application/json`. El tipo de retorno estático es `Promise<PractitionerSiteDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetSiteContactPhoneDto`; los campos opcionales se omiten.

```http
PUT /practitioners/me/sites/00000000-0000-4000-8000-000000000001/contact-phone HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "contactPhone": "+591 72123456"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `contactPhone` | Sí | `string` | longitud máxima 40; patrón runtime `SITE_CONTACT_PHONE_PATTERN`; admite null | Sin descripción específica en el contrato OpenAPI. | `+591 72123456` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /practitioners/me/sites/00000000-0000-4000-8000-000000000001/contact-phone HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "contactPhone": "+591 72123456"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerSiteDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "timeZone": "America/La_Paz",
  "addressText": "Av. Brasil 1234, La Paz",
  "latitude": 1,
  "longitude": 1,
  "contactPhone": "+591 72123456",
  "isOwnSite": true,
  "bankQrFileId": "00000000-0000-4000-8000-000000000001",
  "logoFileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador de la sede. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Práctica a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Código único dentro de la práctica. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Nombre de ejemplo` |
| `timeZone` | No | `string` | admite null | Zona horaria IANA de la sede, si la declara. | `America/La_Paz` |
| `addressText` | No | `string` | admite null | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `Av. Brasil 1234, La Paz` |
| `latitude` | No | `number` | admite null | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `1` |
| `longitude` | No | `number` | admite null | Longitud del punto de la sede. Va siempre junto a `latitude`. | `1` |
| `contactPhone` | No | `string` | admite null | Teléfono de este profesional en esta sede, si lo declaró. | `+591 72123456` |
| `isOwnSite` | Sí | `boolean` | Sin restricción adicional declarada | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `true` |
| `bankQrFileId` | No | `string` | formato `uuid`; admite null | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `00000000-0000-4000-8000-000000000001` |
| `logoFileId` | No | `string` | formato `uuid`; admite null | Logo del consultorio, el que sale en el membrete de sus PDF, o `null` si no tiene. Se lee con `GET /common/files/:id/content`. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/application/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | No tiene una vinculación vigente con esa sede | Excepción explícita en src/modules/practice/services/practitioner-sites.service.ts |
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
  "path": "/practitioners/me/sites/{siteId}/contact-phone"
}
```

---

## 58. PUT /practitioners/me/sites/{siteId}/logo

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Fijar o quitar el logo del consultorio propio
- **Operation ID:** `PractitionerSitesController_setSiteLogo`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PractitionerSitesController.setSiteLogo](../../src/modules/practice/controllers/practitioner-sites.controller.ts)

### Descripción de negocio

Asocia una imagen ya subida (png, jpeg o webp, NORMAL, hasta 2 MB) como logo del consultorio. `fileId: null` lo quita. 404 si la sede no es un consultorio propio; 422 si el archivo no sirve como logo.

Contexto declarado en el controlador: El logo del consultorio propio, el que sale en el membrete de sus PDF. A diferencia del QR, sólo alcanza al consultorio **propio**: una sede de otra organización responde 404. El archivo ya entró por `POST /common/files/upload` y se valida como el logo de una organización.

### Descripción del sistema

NestJS resuelve `PUT /practitioners/me/sites/{siteId}/logo` en `PractitionerSitesController_setSiteLogo`. El controlador delega en `PractitionerSitesService.setSiteLogo`. Valida el body como `SetSiteLogoDto` y consume `application/json`. El tipo de retorno estático es `Promise<PractitionerSiteDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetSiteLogoDto`; los campos opcionales se omiten.

```http
PUT /practitioners/me/sites/00000000-0000-4000-8000-000000000001/logo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fileId": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fileId` | Sí | `object` | formato `uuid`; admite null | Imagen del logo ya subida, o null para quitarlo | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /practitioners/me/sites/00000000-0000-4000-8000-000000000001/logo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fileId": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PractitionerSiteDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerSiteDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "timeZone": "America/La_Paz",
  "addressText": "Av. Brasil 1234, La Paz",
  "latitude": 1,
  "longitude": 1,
  "contactPhone": "+591 72123456",
  "isOwnSite": true,
  "bankQrFileId": "00000000-0000-4000-8000-000000000001",
  "logoFileId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador de la sede. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Práctica a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Código único dentro de la práctica. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Nombre de ejemplo` |
| `timeZone` | No | `string` | admite null | Zona horaria IANA de la sede, si la declara. | `America/La_Paz` |
| `addressText` | No | `string` | admite null | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `Av. Brasil 1234, La Paz` |
| `latitude` | No | `number` | admite null | Latitud del punto de la sede, si la dirección la tiene cargada (ALV-006). | `1` |
| `longitude` | No | `number` | admite null | Longitud del punto de la sede. Va siempre junto a `latitude`. | `1` |
| `contactPhone` | No | `string` | admite null | Teléfono de este profesional en esta sede, si lo declaró. | `+591 72123456` |
| `isOwnSite` | Sí | `boolean` | Sin restricción adicional declarada | Si la sede es el consultorio **propio** del profesional —su práctica personal— y no la de otra organización donde atiende (P32-a). La lista mezclaba las dos cosas sin distinguirlas: «Consultorio Dra. Rojas» y «Hospital San Lucas» llegaban con la misma forma, y retirar lo propio no es el mismo acto que desvincularse de un hospital. Sale de comparar la práctica de la sede con la práctica personal del profesional (tipo consultorio y él como cuenta administradora), no de adivinar por el nombre. | `true` |
| `bankQrFileId` | No | `string` | formato `uuid`; admite null | Archivo del QR bancario con el que el profesional cobra **en esta sede**, o `null` si no configuró ninguno (P33). Es por sede y no por persona porque no se cobra igual en todos lados: en el consultorio propio cobra el profesional y en la clínica puede cobrar la clínica. Un QR único de perfil obligaría a corregirlo cada vez que cambia de establecimiento. | `00000000-0000-4000-8000-000000000001` |
| `logoFileId` | No | `string` | formato `uuid`; admite null | Logo del consultorio, el que sale en el membrete de sus PDF, o `null` si no tiene. Se lee con `GET /common/files/:id/content`. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | ${labels.subject} no le pertenece | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 403 | `FORBIDDEN` | Esta cuenta no tiene un perfil profesional asociado | Excepción explícita en src/modules/profiles/application/services/profile-ownership.service.ts |
| 404 | `NOT_FOUND` | Esa sede no es un consultorio propio suyo | Excepción explícita en src/modules/practice/services/practitioner-sites.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El logo no es un archivo suyo que se pueda usar | Excepción explícita en src/modules/practice/services/practitioner-sites.service.ts |
| 422 | `PRECONDITION_FAILED` | El logo debe ser una imagen | Excepción explícita en src/modules/practice/services/practitioner-sites.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/practitioners/me/sites/{siteId}/logo"
}
```

---

## 59. POST /role-assignments/{roleId}/approve

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Aprobar una vinculación pendiente
- **Operation ID:** `RoleAssignmentsController_approve`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RoleAssignmentsController.approve](../../src/modules/practice/controllers/role-assignments.controller.ts)

### Descripción de negocio

Aprobar una vinculación pendiente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Carril 18: `PENDING → ACTIVE`, solo esa fila. Sin `@Roles`: lo aprueba quien administra esa organización (A-6) o un rol de plataforma, y eso lo decide el servicio por la membresía.

### Descripción del sistema

NestJS resuelve `POST /role-assignments/{roleId}/approve` en `RoleAssignmentsController_approve`. El controlador delega en `PracticeWorkforceService.approveAssignment`. Valida el body como `PracticeRoleAssignmentTransitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RoleAssignmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `roleId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PracticeRoleAssignmentTransitionDto`; los campos opcionales se omiten.

```http
POST /role-assignments/00000000-0000-4000-8000-000000000001/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `roleId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /role-assignments/00000000-0000-4000-8000-000000000001/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RoleAssignmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La vinculación no admite esa transición desde su estado actual | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/role-assignments/{roleId}/approve"
}
```

---

## 60. POST /role-assignments/{roleId}/end

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Finalizar una vinculación
- **Operation ID:** `RoleAssignmentsController_end`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RoleAssignmentsController.end](../../src/modules/practice/controllers/role-assignments.controller.ts)

### Descripción de negocio

Finalizar una vinculación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Carril 18: `ACTIVE|SUSPENDED → ENDED`.

### Descripción del sistema

NestJS resuelve `POST /role-assignments/{roleId}/end` en `RoleAssignmentsController_end`. El controlador delega en `PracticeWorkforceService.endAssignment`. Valida el body como `PracticeRoleAssignmentTransitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RoleAssignmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `roleId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PracticeRoleAssignmentTransitionDto`; los campos opcionales se omiten.

```http
POST /role-assignments/00000000-0000-4000-8000-000000000001/end HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `roleId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /role-assignments/00000000-0000-4000-8000-000000000001/end HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RoleAssignmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La vinculación no admite esa transición desde su estado actual | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/role-assignments/{roleId}/end"
}
```

---

## 61. POST /role-assignments/{roleId}/reject

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Rechazar una vinculación pendiente
- **Operation ID:** `RoleAssignmentsController_reject`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RoleAssignmentsController.reject](../../src/modules/practice/controllers/role-assignments.controller.ts)

### Descripción de negocio

Rechazar una vinculación pendiente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Carril 18: `PENDING → REJECTED`, solo esa fila (A-6, ver `approve`).

### Descripción del sistema

NestJS resuelve `POST /role-assignments/{roleId}/reject` en `RoleAssignmentsController_reject`. El controlador delega en `PracticeWorkforceService.rejectAssignment`. Valida el body como `PracticeRoleAssignmentTransitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RoleAssignmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `roleId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PracticeRoleAssignmentTransitionDto`; los campos opcionales se omiten.

```http
POST /role-assignments/00000000-0000-4000-8000-000000000001/reject HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `roleId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /role-assignments/00000000-0000-4000-8000-000000000001/reject HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RoleAssignmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La vinculación no admite esa transición desde su estado actual | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/role-assignments/{roleId}/reject"
}
```

---

## 62. POST /role-assignments/{roleId}/support-assignments

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Adjuntar personal de apoyo a un rol de profesional
- **Operation ID:** `RoleAssignmentsController_attachSupport`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RoleAssignmentsController.attachSupport](../../src/modules/practice/controllers/role-assignments.controller.ts)

### Descripción de negocio

Adjuntar personal de apoyo a un rol de profesional. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /role-assignments/{roleId}/support-assignments` en `RoleAssignmentsController_attachSupport`. El controlador delega en `PracticeWorkforceService.attachSupport`. Valida el body como `CreateSupportAssignmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<SupportAssignmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `roleId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateSupportAssignmentDto`; los campos opcionales se omiten.

```http
POST /role-assignments/00000000-0000-4000-8000-000000000001/support-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "supportProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `roleId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `supportProfileId` | Sí | `string` | formato `uuid` | Perfil de apoyo (profiles.secretary_profiles) | `00000000-0000-4000-8000-000000000001` |
| `supportRoleConceptId` | No | `string` | formato `uuid` | Concepto de rol de apoyo | `00000000-0000-4000-8000-000000000001` |
| `scopeConceptId` | No | `string` | formato `uuid` | Concepto de alcance del apoyo | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Vigente desde (ISO date) | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Vigente hasta (ISO date) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /role-assignments/00000000-0000-4000-8000-000000000001/support-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "supportProfileId": "00000000-0000-4000-8000-000000000001",
  "supportRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "scopeConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SupportAssignmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SupportAssignmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SupportAssignmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SupportAssignmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SupportAssignmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SupportAssignmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SupportAssignmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SupportAssignmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SupportAssignmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SupportAssignmentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SupportAssignmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupportAssignmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practitionerRoleAssignmentId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practitioner role assignment. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El rol de profesional no está activo | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/role-assignments/{roleId}/support-assignments"
}
```

---

## 63. POST /role-assignments/{roleId}/suspend

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Suspender una vinculación activa
- **Operation ID:** `RoleAssignmentsController_suspend`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RoleAssignmentsController.suspend](../../src/modules/practice/controllers/role-assignments.controller.ts)

### Descripción de negocio

Suspender una vinculación activa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Carril 18: `ACTIVE → SUSPENDED`.

### Descripción del sistema

NestJS resuelve `POST /role-assignments/{roleId}/suspend` en `RoleAssignmentsController_suspend`. El controlador delega en `PracticeWorkforceService.suspendAssignment`. Valida el body como `PracticeRoleAssignmentTransitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RoleAssignmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `roleId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PracticeRoleAssignmentTransitionDto`; los campos opcionales se omiten.

```http
POST /role-assignments/00000000-0000-4000-8000-000000000001/suspend HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `roleId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /role-assignments/00000000-0000-4000-8000-000000000001/suspend HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RoleAssignmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RoleAssignmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La vinculación no admite esa transición desde su estado actual | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/role-assignments/{roleId}/suspend"
}
```

---

## 64. PATCH /site-licenses/{id}

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Editar una habilitación del establecimiento
- **Operation ID:** `SiteLicensesController_update`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SiteLicensesController.update](../../src/modules/practice/controllers/infrastructure-catalog.controller.ts)

### Descripción de negocio

Editar una habilitación del establecimiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Editar una habilitación; el estado sólo lo cambia la plataforma.

### Descripción del sistema

NestJS resuelve `PATCH /site-licenses/{id}` en `SiteLicensesController_update`. El controlador delega en `SiteEstablishmentService.updateLicense`. Valida el body como `UpdateSiteLicenseDto` y consume `application/json`. El tipo de retorno estático es `Promise<SiteLicenseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match` | header | No | `string` | Sin restricción adicional declarada | rowVersion; si viene y no coincide: 412 | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateSiteLicenseDto`; los campos opcionales se omiten.

```http
PATCH /site-licenses/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| `authorityName` | No | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `resolutionNumber` | No | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `issuedOn` | No | `string` | formato `date`; patrón runtime `DATE`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `expiresOn` | No | `string` | formato `date`; patrón runtime `DATE`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `documentFileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | No | `string` | Sin restricción adicional declarada | Estado: LIC_IN_PROCESS \| LIC_VALID \| LIC_REVOKED (sólo plataforma). LIC_EXPIRED se calcula; LIC_SUSPENDED no tiene columna en facility_licenses | `ok` |
| `notes` | No | `string` | admite null | Sin columna en facility_licenses: sólo se acepta vacío (422 LICENSE_NOTES_UNSUPPORTED si trae texto) | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /site-licenses/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "authorityName": "Nombre de ejemplo",
  "resolutionNumber": "valor-ejemplo",
  "issuedOn": "2026-07-31",
  "expiresOn": "2026-07-31",
  "documentFileId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "notes": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteLicenseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "authorityName": "Nombre de ejemplo",
  "resolutionNumber": "valor-ejemplo",
  "issuedOn": "2026-07-31",
  "expiresOn": "2026-07-31",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "clinicalUnitId": {},
  "healthcareServiceId": {},
  "documentFileId": {},
  "rowVersion": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `authorityName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `resolutionNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `issuedOn` | Sí | `string` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `expiresOn` | Sí | `string` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `status` | Sí | `ConceptDto` | Sin restricción adicional declarada | LIC_*; vencida se calcula al leer | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `healthcareServiceId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `documentFileId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo la plataforma cambia el estado de una habilitación | Excepción explícita en src/modules/practice/services/site-establishment.service.ts |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Habilitación no encontrada | Excepción explícita en src/modules/practice/services/site-establishment.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
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
  "path": "/site-licenses/{id}"
}
```

---

## 65. GET /sites/{siteId}/bed-board

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Tablero de camas de una sede
- **Operation ID:** `CareSpaceOpsController_bedBoard`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.bedBoard](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Tablero de camas de una sede. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Tablero de camas por unidad, con recuentos derivados.

### Descripción del sistema

NestJS resuelve `GET /sites/{siteId}/bed-board` en `CareSpaceOpsController_bedBoard`. El controlador delega en `BedBoardReadService.bedBoard`. No recibe body. El tipo de retorno estático es `Promise<BedBoardDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `unitId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `parentSpaceId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `functionCodes` | query | No | `string` | Sin restricción adicional declarada | Funciones separadas por coma | `CODIGO_EJEMPLO` |
| `v2Codes` | query | No | `string` | Sin restricción adicional declarada | Códigos v2-0116 separados por coma | `CODIGO_EJEMPLO` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Código del último espacio de la página anterior | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /sites/00000000-0000-4000-8000-000000000001/bed-board HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /sites/00000000-0000-4000-8000-000000000001/bed-board?unitId=00000000-0000-4000-8000-000000000001&parentSpaceId=00000000-0000-4000-8000-000000000001&functionCodes=CODIGO_EJEMPLO&v2Codes=CODIGO_EJEMPLO&cursor=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BedBoardDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<BedBoardDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<BedBoardDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<BedBoardDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<BedBoardDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<BedBoardDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<BedBoardDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<BedBoardDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BedBoardDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "siteId": "00000000-0000-4000-8000-000000000001",
  "generatedAt": "2026-07-31T12:00:00.000Z",
  "lastEventAt": "2026-07-31T12:00:00.000Z",
  "units": [
    {
      "unitId": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "counts": {
        "total": 1,
        "assignable": 1,
        "occupied": 1,
        "reserved": 1,
        "blocked": 1,
        "maintenance": 1,
        "dirty": 1,
        "cleaning": 1,
        "isolation": 1,
        "contaminated": 1
      },
      "cells": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "code": "CODIGO_EJEMPLO",
          "name": "Nombre de ejemplo",
          "path": [
            {
              "id": "00000000-0000-4000-8000-000000000001",
              "code": "CODIGO_EJEMPLO",
              "name": "Nombre de ejemplo",
              "form": "valor-ejemplo"
            }
          ],
          "form": "valor-ejemplo",
          "function": "valor-ejemplo",
          "lifecycle": "valor-ejemplo",
          "availability": {
            "code": "CODIGO_EJEMPLO",
            "reasonCode": "CODIGO_EJEMPLO",
            "reasonText": "Texto descriptivo de ejemplo",
            "expectedUntil": "2026-07-31T12:00:00.000Z",
            "since": "2026-07-31T12:00:00.000Z"
          },
          "hygiene": {
            "code": "CODIGO_EJEMPLO",
            "since": "2026-07-31T12:00:00.000Z",
            "terminalRequired": true
          },
          "isolation": {
            "code": "CODIGO_EJEMPLO",
            "organism": "valor-ejemplo",
            "since": "2026-07-31T12:00:00.000Z"
          },
          "occupancy": {
            "code": "CODIGO_EJEMPLO",
            "since": "2026-07-31T12:00:00.000Z",
            "encounterId": "00000000-0000-4000-8000-000000000001",
            "patient": {
              "initials": "valor-ejemplo",
              "sexCode": "CODIGO_EJEMPLO",
              "ageYears": 1
            },
            "encounterLocationId": "00000000-0000-4000-8000-000000000001"
          },
          "v2Code": "C",
          "assignable": true,
          "openCleaningOrderId": "00000000-0000-4000-8000-000000000001",
          "lastEventAt": "2026-07-31T12:00:00.000Z",
          "opsVersion": 1,
          "unitId": "00000000-0000-4000-8000-000000000001",
          "actions": [
            "valor-ejemplo"
          ]
        }
      ]
    }
  ],
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `siteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `generatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `lastEventAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `units` | Sí | `array<BedBoardUnitDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"unitId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","counts":{"total":1,"assignable":1,"occupied":1,"reserved":1,"blocked":1,"maintenance":1,"dirty":1,"cleaning":1,"isolation":1,"contaminated":1},"cells":[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","path":[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":"valor-ejemplo"}],"form":"valor-ejemplo","function":"valor-ejemplo","lifecycle":"valor-ejemplo","availability":{"code":"CODIGO_EJEMPLO","reasonCode":"CODIGO_EJEMPLO","reasonText":"Texto descriptivo de ejemplo","expectedUntil":"2026-07-31T12:00:00.000Z","since":"2026-07-31T12:00:00.000Z"},"hygiene":{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","terminalRequired":true},"isolation":{"code":"CODIGO_EJEMPLO","organism":"valor-ejemplo","since":"2026-07-31T12:00:00.000Z"},"occupancy":{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","encounterId":"00000000-0000-4000-8000-000000000001","patient":{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1},"encounterLocationId":"00000000-0000-4000-8000-000000000001"},"v2Code":"C","assignable":true,"openCleaningOrderId":"00000000-0000-4000-8000-000000000001","lastEventAt":"2026-07-31T12:00:00.000Z","opsVersion":1,"unitId":"00000000-0000-4000-8000-000000000001","actions":["valor-ejemplo"]}]}]` |
| `units[].unitId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `units[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `units[].counts` | Sí | `BedBoardCountsDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"total":1,"assignable":1,"occupied":1,"reserved":1,"blocked":1,"maintenance":1,"dirty":1,"cleaning":1,"isolation":1,"contaminated":1}` |
| `units[].counts.total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `units[].counts.assignable` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `units[].counts.occupied` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `units[].counts.reserved` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `units[].counts.blocked` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `units[].counts.maintenance` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `units[].counts.dirty` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `units[].counts.cleaning` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `units[].counts.isolation` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `units[].counts.contaminated` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `units[].cells` | Sí | `array<BedBoardCellDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","path":[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":"valor-ejemplo"}],"form":"valor-ejemplo","function":"valor-ejemplo","lifecycle":"valor-ejemplo","availability":{"code":"CODIGO_EJEMPLO","reasonCode":"CODIGO_EJEMPLO","reasonText":"Texto descriptivo de ejemplo","expectedUntil":"2026-07-31T12:00:00.000Z","since":"2026-07-31T12:00:00.000Z"},"hygiene":{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","terminalRequired":true},"isolation":{"code":"CODIGO_EJEMPLO","organism":"valor-ejemplo","since":"2026-07-31T12:00:00.000Z"},"occupancy":{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","encounterId":"00000000-0000-4000-8000-000000000001","patient":{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1},"encounterLocationId":"00000000-0000-4000-8000-000000000001"},"v2Code":"C","assignable":true,"openCleaningOrderId":"00000000-0000-4000-8000-000000000001","lastEventAt":"2026-07-31T12:00:00.000Z","opsVersion":1,"unitId":"00000000-0000-4000-8000-000000000001","actions":["valor-ejemplo"]}]` |
| `units[].cells[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `units[].cells[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `units[].cells[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `units[].cells[].path` | Sí | `array<SpacePathItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":"valor-ejemplo"}]` |
| `units[].cells[].path[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `units[].cells[].path[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `units[].cells[].path[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `units[].cells[].path[].form` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `units[].cells[].form` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `units[].cells[].function` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `units[].cells[].lifecycle` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `units[].cells[].availability` | Sí | `AvailabilityAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","reasonCode":"CODIGO_EJEMPLO","reasonText":"Texto descriptivo de ejemplo","expectedUntil":"2026-07-31T12:00:00.000Z","since":"2026-07-31T12:00:00.000Z"}` |
| `units[].cells[].availability.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `units[].cells[].availability.reasonCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `units[].cells[].availability.reasonText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `units[].cells[].availability.expectedUntil` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `units[].cells[].availability.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `units[].cells[].hygiene` | Sí | `HygieneAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","terminalRequired":true}` |
| `units[].cells[].hygiene.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `units[].cells[].hygiene.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `units[].cells[].hygiene.terminalRequired` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `units[].cells[].isolation` | Sí | `IsolationAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","organism":"valor-ejemplo","since":"2026-07-31T12:00:00.000Z"}` |
| `units[].cells[].isolation.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `units[].cells[].isolation.organism` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `units[].cells[].isolation.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `units[].cells[].occupancy` | Sí | `OccupancyAxisDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","since":"2026-07-31T12:00:00.000Z","encounterId":"00000000-0000-4000-8000-000000000001","patient":{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1},"encounterLocationId":"00000000-0000-4000-8000-000000000001"}` |
| `units[].cells[].occupancy.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `units[].cells[].occupancy.since` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `units[].cells[].occupancy.encounterId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `units[].cells[].occupancy.patient` | No | `BedPatientDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"initials":"valor-ejemplo","sexCode":"CODIGO_EJEMPLO","ageYears":1}` |
| `units[].cells[].occupancy.patient.initials` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `units[].cells[].occupancy.patient.sexCode` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `units[].cells[].occupancy.patient.ageYears` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `units[].cells[].occupancy.encounterLocationId` | No | `string` | formato `uuid`; admite null | Ubicación ADT vigente; sólo con rol clínico (igual que patient) | `00000000-0000-4000-8000-000000000001` |
| `units[].cells[].v2Code` | Sí | `string` | valores: `C`, `H`, `I`, `K`, `O`, `U`, `R` | Sin descripción específica en el contrato OpenAPI. | `C` |
| `units[].cells[].assignable` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `units[].cells[].openCleaningOrderId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `units[].cells[].lastEventAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `units[].cells[].opsVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `units[].cells[].unitId` | Sí | `string` | formato `uuid`; admite null | Unidad dueña de la cama (vínculo OWNER vigente o la del espacio) | `00000000-0000-4000-8000-000000000001` |
| `units[].cells[].actions` | Sí | `array<string>` | Sin restricción adicional declarada | Acciones de F2/F3 que el actor puede hacer sobre esta cama (lo que la UI refleja; la API decide en cada endpoint) | `["valor-ejemplo"]` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/sites/{siteId}/bed-board"
}
```

---

## 66. GET /sites/{siteId}/capacity

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Capacidad declarada vs. derivada del establecimiento
- **Operation ID:** `SiteInfrastructureController_capacity`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SiteInfrastructureController.capacity](../../src/modules/practice/controllers/site-infrastructure.controller.ts)

### Descripción de negocio

Capacidad declarada vs. derivada del establecimiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Capacidad declarada vs. derivada.

### Descripción del sistema

NestJS resuelve `GET /sites/{siteId}/capacity` en `SiteInfrastructureController_capacity`. El controlador delega en `SiteEstablishmentService.capacity`. No recibe body. El tipo de retorno estático es `Promise<SiteCapacityDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /sites/00000000-0000-4000-8000-000000000001/capacity HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /sites/00000000-0000-4000-8000-000000000001/capacity HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SiteCapacityDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<SiteCapacityDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteCapacityDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "declared": [
    {
      "kindCode": "CODIGO_EJEMPLO",
      "quantity": 1,
      "asOf": "2026-07-31",
      "resolutionNumber": "valor-ejemplo",
      "source": "site"
    }
  ],
  "derived": [
    {
      "kindCode": "CODIGO_EJEMPLO",
      "quantity": 1
    }
  ],
  "gaps": [
    {
      "kindCode": "CODIGO_EJEMPLO",
      "declared": 1,
      "derived": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `declared` | Sí | `array<DeclaredCapacityLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"kindCode":"CODIGO_EJEMPLO","quantity":1,"asOf":"2026-07-31","resolutionNumber":"valor-ejemplo","source":"site"}]` |
| `declared[].kindCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `declared[].quantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `declared[].asOf` | Sí | `string` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `declared[].resolutionNumber` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `declared[].source` | Sí | `string` | valores: `site`, `hospital` | site = site_declared_capacities; hospital = organization_extensions.hospitals | `site` |
| `derived` | Sí | `array<DerivedCapacityLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"kindCode":"CODIGO_EJEMPLO","quantity":1}]` |
| `derived[].kindCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `derived[].quantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `gaps` | Sí | `array<CapacityGapDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"kindCode":"CODIGO_EJEMPLO","declared":1,"derived":1}]` |
| `gaps[].kindCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `gaps[].declared` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `gaps[].derived` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/sites/{siteId}/capacity"
}
```

---

## 67. GET /sites/{siteId}/care-spaces

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Listar los espacios de atención de la sede
- **Operation ID:** `SitesController_listCareSpaces`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SitesController.listCareSpaces](../../src/modules/practice/controllers/sites.controller.ts)

### Descripción de negocio

Listar los espacios de atención de la sede. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Espacios de atención de la sede: quirófanos, consultas y boxes. Es el listado que resuelve el `operatingRoomId` de `POST /procedure-cases`. Sin él, programar una intervención exigía conocer de memoria el uuid de una fila que ninguna operación devolvía.

### Descripción del sistema

NestJS resuelve `GET /sites/{siteId}/care-spaces` en `SitesController_listCareSpaces`. El controlador delega en `PracticeSitesService.listCareSpaces`. No recibe body. El tipo de retorno estático es `Promise<CareSpaceSummaryDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /sites/00000000-0000-4000-8000-000000000001/care-spaces HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `SURGERY_SCHEDULER`, `PERIOP_ADMIN`, `SURGEON`, `ANESTHESIOLOGIST`, `PERIOP_NURSE`, `SCHEDULING_ADMIN`.
- Deben ser UUID válidos: `siteId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /sites/00000000-0000-4000-8000-000000000001/care-spaces HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CareSpaceSummaryDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<CareSpaceSummaryDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<CareSpaceSummaryDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<CareSpaceSummaryDto[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<CareSpaceSummaryDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<CareSpaceSummaryDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<CareSpaceSummaryDto[]>` | No |
| 504 | Consulta completada correctamente. | `Promise<CareSpaceSummaryDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CareSpaceSummaryDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "practiceSiteId": "00000000-0000-4000-8000-000000000001",
    "code": "CODIGO_EJEMPLO",
    "name": "Nombre de ejemplo",
    "spaceTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "status": "00000000-0000-4000-8000-000000000001"
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sede no encontrada | Excepción explícita en src/modules/practice/services/practice-sites.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/sites/{siteId}/care-spaces"
}
```

---

## 68. POST /sites/{siteId}/care-spaces

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Crear un espacio de atención bajo una unidad/sitio
- **Operation ID:** `SitesController_createCareSpace`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SitesController.createCareSpace](../../src/modules/practice/controllers/sites.controller.ts)

### Descripción de negocio

Crear un espacio de atención bajo una unidad/sitio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-14-05 extendido en F1 (contrato §3): forma, función, atributos y reglas; nace PLANNED salvo `activate`. Sin `formCode`/`functionCode` (clientes de F0) se comporta como antes: local genérico y ACTIVO. Autorización: admin de la organización o de la sucursal de la sede.

### Descripción del sistema

NestJS resuelve `POST /sites/{siteId}/care-spaces` en `SitesController_createCareSpace`. El controlador delega en `CareSpacesAdminService.create`. Valida el body como `CreateCareSpaceDto` y consume `application/json`. El tipo de retorno estático es `Promise<CareSpaceDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCareSpaceDto`; los campos opcionales se omiten.

```http
POST /sites/00000000-0000-4000-8000-000000000001/care-spaces HTTP/1.1
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
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `description` | No | `string` | longitud máxima 1000; admite null | Descripción libre | `Texto descriptivo de ejemplo` |
| `capacity` | No | `number` | mínimo 0; admite null | Capacidad (nº de plazas) | `1` |
| `floorNumber` | No | `number` | admite null | Piso (negativo = subsuelo) | `1` |
| `areaM2` | No | `number` | mínimo 0; admite null | Superficie útil en m² | `1` |
| `asepsisCode` | No | `string` | admite null | Asepsia (ASEPSIS_*) | `CODIGO_EJEMPLO` |
| `pressureCode` | No | `string` | admite null | Presión relativa (PRESSURE_*) | `CODIGO_EJEMPLO` |
| `airChangesPerHour` | No | `number` | admite null | Renovaciones de aire por hora (ACH) | `1` |
| `hvacValidatedOn` | No | `string` | formato `date`; admite null | Fecha de validación HVAC (YYYY-MM-DD) | `2026-07-31` |
| `sexRestrictionCode` | No | `string` | admite null | Restricción de sexo (SEX_*) | `CODIGO_EJEMPLO` |
| `ageGroupCode` | No | `string` | admite null | Grupo etario (AGE_*) | `CODIGO_EJEMPLO` |
| `bedCategoryCode` | No | `string` | admite null | Categoría de cama (BED_CAT_*) | `CODIGO_EJEMPLO` |
| `censable` | No | `boolean` | admite null | Cama censable (cuenta para el censo) | `true` |
| `prepMinutes` | No | `number` | mínimo 0; admite null | Minutos de preparación | `1` |
| `cleanupMinutes` | No | `number` | mínimo 0; admite null | Minutos de limpieza | `1` |
| `gln` | No | `string` | admite null | GS1 GLN (13 dígitos) | `valor-ejemplo` |
| `clinicalUnitId` | No | `string` | formato `uuid` | Unidad clínica (misma sede) | `00000000-0000-4000-8000-000000000001` |
| `parentSpaceId` | No | `string` | formato `uuid` | Espacio padre (misma sede) | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único dentro de la sede | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre del espacio | `Nombre de ejemplo` |
| `spaceTypeConceptId` | No | `string` | formato `uuid` | Obsoleto (F0): concepto de función. Usar functionCode; si vienen los dos, manda functionCode | `00000000-0000-4000-8000-000000000001` |
| `formCode` | No | `string` | Sin restricción adicional declarada | Forma FHIR (LOC_FORM_*). Ausente: LOC_FORM_ROOM (compatibilidad con F0) | `CODIGO_EJEMPLO` |
| `functionCode` | No | `string` | Sin restricción adicional declarada | Función (SPACE_FN_* o SPACE_TYPE_ROOM). Ausente: SPACE_TYPE_ROOM (genérica) | `CODIGO_EJEMPLO` |
| `activate` | No | `boolean` | Sin restricción adicional declarada | Nacer ACTIVO en vez de PLANNED (el padre tiene que estar activo) | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /sites/00000000-0000-4000-8000-000000000001/care-spaces HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "description": "Texto descriptivo de ejemplo",
  "capacity": 1,
  "floorNumber": 1,
  "areaM2": 1,
  "asepsisCode": "CODIGO_EJEMPLO",
  "pressureCode": "CODIGO_EJEMPLO",
  "airChangesPerHour": 1,
  "hvacValidatedOn": "2026-07-31",
  "sexRestrictionCode": "CODIGO_EJEMPLO",
  "ageGroupCode": "CODIGO_EJEMPLO",
  "bedCategoryCode": "CODIGO_EJEMPLO",
  "censable": true,
  "prepMinutes": 1,
  "cleanupMinutes": 1,
  "gln": "valor-ejemplo",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "parentSpaceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "spaceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "formCode": "CODIGO_EJEMPLO",
  "functionCode": "CODIGO_EJEMPLO",
  "activate": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CareSpaceDetailDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CareSpaceDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CareSpaceDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "parentId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "form": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "function": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "operationalStatus": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "clinicalUnitId": {},
  "capacity": 1,
  "rowVersion": 1,
  "childCount": 1,
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "floorNumber": 1,
  "areaM2": 1,
  "asepsis": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "pressure": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "airChangesPerHour": 1,
  "hvacValidatedOn": {},
  "sexRestriction": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "ageGroup": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "bedCategory": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "censable": true,
  "gln": "valor-ejemplo",
  "prepMinutes": 1,
  "cleanupMinutes": 1,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "path": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      }
    }
  ],
  "children": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "function": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "operationalStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "clinicalUnitId": {},
      "capacity": 1,
      "rowVersion": 1,
      "childCount": 1
    }
  ],
  "assignments": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "role": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "derived": {
    "beds": 1,
    "censableBeds": 1,
    "activeChildren": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `floorNumber` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `areaM2` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `asepsis` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `asepsis.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `asepsis.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pressure` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `pressure.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `pressure.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `airChangesPerHour` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `hvacValidatedOn` | Sí | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sexRestriction` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `sexRestriction.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sexRestriction.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `ageGroup` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `ageGroup.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `ageGroup.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `bedCategory` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `bedCategory.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `bedCategory.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `censable` | Sí | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `gln` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `prepMinutes` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `cleanupMinutes` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `validFrom` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `path` | Sí | `array<SpacePathStepDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `path[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `path[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `path[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `path[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `path[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `path[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children` | Sí | `array<CareSpaceNodeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"function":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"clinicalUnitId":{},"capacity":1,"rowVersion":1,"childCount":1}]` |
| `children[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `children[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `children[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `children[].operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `children[].operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `children[].clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `children[].capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `children[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `children[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `assignments` | Sí | `array<SpaceUnitAssignmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `assignments[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].clinicalUnitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].role` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `assignments[].role.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `assignments[].role.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `assignments[].validFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignments[].validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `derived` | Sí | `SpaceDerivedDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"beds":1,"censableBeds":1,"activeChildren":1}` |
| `derived.beds` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `derived.censableBeds` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `derived.activeChildren` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere administrar la organización o la sucursal de esta sede | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/care-spaces-admin.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/care-spaces-admin.service.ts |
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
  "path": "/sites/{siteId}/care-spaces"
}
```

---

## 69. POST /sites/{siteId}/care-spaces/bulk

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Alta masiva de espacios por patrón
- **Operation ID:** `SiteInfrastructureController_bulk`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SiteInfrastructureController.bulk](../../src/modules/practice/controllers/site-infrastructure.controller.ts)

### Descripción de negocio

Alta masiva de espacios por patrón. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Alta masiva con patrón; todo o nada, máximo 200.

### Descripción del sistema

NestJS resuelve `POST /sites/{siteId}/care-spaces/bulk` en `SiteInfrastructureController_bulk`. El controlador delega en `CareSpacesAdminService.bulkCreate`. Valida el body como `BulkCreateCareSpacesDto` y consume `application/json`. El tipo de retorno estático es `Promise<BulkCreatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BulkCreateCareSpacesDto`; los campos opcionales se omiten.

```http
POST /sites/00000000-0000-4000-8000-000000000001/care-spaces/bulk HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "formCode": "CODIGO_EJEMPLO",
  "functionCode": "CODIGO_EJEMPLO",
  "codePattern": "CAMA-{1..12}",
  "namePattern": "Cama {1..12}"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `description` | No | `string` | longitud máxima 1000; admite null | Descripción libre | `Texto descriptivo de ejemplo` |
| `capacity` | No | `number` | mínimo 0; admite null | Capacidad (nº de plazas) | `1` |
| `floorNumber` | No | `number` | admite null | Piso (negativo = subsuelo) | `1` |
| `areaM2` | No | `number` | mínimo 0; admite null | Superficie útil en m² | `1` |
| `asepsisCode` | No | `string` | admite null | Asepsia (ASEPSIS_*) | `CODIGO_EJEMPLO` |
| `pressureCode` | No | `string` | admite null | Presión relativa (PRESSURE_*) | `CODIGO_EJEMPLO` |
| `airChangesPerHour` | No | `number` | admite null | Renovaciones de aire por hora (ACH) | `1` |
| `hvacValidatedOn` | No | `string` | formato `date`; admite null | Fecha de validación HVAC (YYYY-MM-DD) | `2026-07-31` |
| `sexRestrictionCode` | No | `string` | admite null | Restricción de sexo (SEX_*) | `CODIGO_EJEMPLO` |
| `ageGroupCode` | No | `string` | admite null | Grupo etario (AGE_*) | `CODIGO_EJEMPLO` |
| `bedCategoryCode` | No | `string` | admite null | Categoría de cama (BED_CAT_*) | `CODIGO_EJEMPLO` |
| `censable` | No | `boolean` | admite null | Cama censable (cuenta para el censo) | `true` |
| `prepMinutes` | No | `number` | mínimo 0; admite null | Minutos de preparación | `1` |
| `cleanupMinutes` | No | `number` | mínimo 0; admite null | Minutos de limpieza | `1` |
| `gln` | No | `string` | admite null | GS1 GLN (13 dígitos) | `valor-ejemplo` |
| `parentSpaceId` | No | `string` | formato `uuid`; admite null | Padre común (misma sede). Ausente o null: raíz | `00000000-0000-4000-8000-000000000001` |
| `formCode` | Sí | `string` | Sin restricción adicional declarada | Forma (LOC_FORM_*) | `CODIGO_EJEMPLO` |
| `functionCode` | Sí | `string` | Sin restricción adicional declarada | Función (SPACE_FN_* o SPACE_TYPE_ROOM) | `CODIGO_EJEMPLO` |
| `codePattern` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Patrón de código con un rango: "301-{A..H}", "CAMA-{1..12}" | `CAMA-{1..12}` |
| `namePattern` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Patrón del nombre: el mismo rango, "{}" o nada (se agrega al final) | `Cama {1..12}` |
| `clinicalUnitId` | No | `string` | formato `uuid` | Unidad clínica (misma sede) | `00000000-0000-4000-8000-000000000001` |
| `activate` | No | `boolean` | Sin restricción adicional declarada | Nacer ACTIVOS (padre activo) | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /sites/00000000-0000-4000-8000-000000000001/care-spaces/bulk HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "description": "Texto descriptivo de ejemplo",
  "capacity": 1,
  "floorNumber": 1,
  "areaM2": 1,
  "asepsisCode": "CODIGO_EJEMPLO",
  "pressureCode": "CODIGO_EJEMPLO",
  "airChangesPerHour": 1,
  "hvacValidatedOn": "2026-07-31",
  "sexRestrictionCode": "CODIGO_EJEMPLO",
  "ageGroupCode": "CODIGO_EJEMPLO",
  "bedCategoryCode": "CODIGO_EJEMPLO",
  "censable": true,
  "prepMinutes": 1,
  "cleanupMinutes": 1,
  "gln": "valor-ejemplo",
  "parentSpaceId": "00000000-0000-4000-8000-000000000001",
  "formCode": "CODIGO_EJEMPLO",
  "functionCode": "CODIGO_EJEMPLO",
  "codePattern": "CAMA-{1..12}",
  "namePattern": "Cama {1..12}",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "activate": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BulkCreatedDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<BulkCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BulkCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BulkCreatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BulkCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BulkCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BulkCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BulkCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BulkCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BulkCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<BulkCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BulkCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "created": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "function": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "operationalStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "clinicalUnitId": {},
      "capacity": 1,
      "rowVersion": 1,
      "childCount": 1,
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "description": "Texto descriptivo de ejemplo",
      "floorNumber": 1,
      "areaM2": 1,
      "asepsis": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "pressure": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "airChangesPerHour": 1,
      "hvacValidatedOn": {},
      "sexRestriction": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "ageGroup": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "bedCategory": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "censable": true,
      "gln": "valor-ejemplo",
      "prepMinutes": 1,
      "cleanupMinutes": 1,
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z",
      "path": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "code": "CODIGO_EJEMPLO",
          "name": "Nombre de ejemplo",
          "form": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          }
        }
      ],
      "children": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "parentId": "00000000-0000-4000-8000-000000000001",
          "code": "CODIGO_EJEMPLO",
          "name": "Nombre de ejemplo",
          "form": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "function": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "status": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "operationalStatus": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "clinicalUnitId": {},
          "capacity": 1,
          "rowVersion": 1,
          "childCount": 1
        }
      ],
      "assignments": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "careSpaceId": "00000000-0000-4000-8000-000000000001",
          "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
          "role": {
            "code": "CODIGO_EJEMPLO",
            "display": "valor-ejemplo"
          },
          "validFrom": "2026-07-31T12:00:00.000Z",
          "validTo": "2026-07-31T12:00:00.000Z"
        }
      ],
      "derived": {
        "beds": 1,
        "censableBeds": 1,
        "activeChildren": 1
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `created` | Sí | `array<CareSpaceDetailDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"function":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"clinicalUnitId":{},"capacity":1,"rowVersion":1,"childCount":1,"practiceSiteId":"00000000-0000-4000-8000-000000000001","description":"Texto descriptivo de ejemplo","floorNumber":1,"areaM2":1,"asepsis":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"pressure":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"airChangesPerHour":1,"hvacValidatedOn":{},"sexRestriction":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"ageGroup":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"bedCategory":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"censable":true,"gln":"valor-ejemplo","prepMinutes":1,"cleanupMinutes":1,"validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z","path":[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}],"children":[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"function":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"clinicalUnitId":{},"capacity":1,"rowVersion":1,"childCount":1}],"assignments":[{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}],"derived":{"beds":1,"censableBeds":1,"activeChildren":1}}]` |
| `created[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `created[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `created[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `created[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `created[].capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `created[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `created[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `created[].practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `created[].description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `created[].floorNumber` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `created[].areaM2` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `created[].asepsis` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].asepsis.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].asepsis.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].pressure` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].pressure.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].pressure.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].airChangesPerHour` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `created[].hvacValidatedOn` | Sí | `object` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `created[].sexRestriction` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].sexRestriction.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].sexRestriction.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].ageGroup` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].ageGroup.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].ageGroup.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].bedCategory` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].bedCategory.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].bedCategory.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].censable` | Sí | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `created[].gln` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].prepMinutes` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `created[].cleanupMinutes` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `created[].validFrom` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `created[].validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `created[].path` | Sí | `array<SpacePathStepDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}}]` |
| `created[].path[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `created[].path[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].path[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `created[].path[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].path[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].path[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].children` | Sí | `array<CareSpaceNodeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"function":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"clinicalUnitId":{},"capacity":1,"rowVersion":1,"childCount":1}]` |
| `created[].children[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `created[].children[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `created[].children[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].children[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `created[].children[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].children[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].children[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].children[].function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].children[].function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].children[].function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].children[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].children[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].children[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].children[].operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].children[].operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].children[].operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].children[].clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `created[].children[].capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `created[].children[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `created[].children[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `created[].assignments` | Sí | `array<SpaceUnitAssignmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `created[].assignments[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `created[].assignments[].careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `created[].assignments[].clinicalUnitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `created[].assignments[].role` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `created[].assignments[].role.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `created[].assignments[].role.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `created[].assignments[].validFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `created[].assignments[].validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `created[].derived` | Sí | `SpaceDerivedDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"beds":1,"censableBeds":1,"activeChildren":1}` |
| `created[].derived.beds` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `created[].derived.censableBeds` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `created[].derived.activeChildren` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere administrar la organización o la sucursal de esta sede | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/care-spaces-admin.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/care-spaces-admin.service.ts |
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
  "path": "/sites/{siteId}/care-spaces/bulk"
}
```

---

## 70. POST /sites/{siteId}/care-spaces/import

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Importar espacios (dryRun=true valida sin escribir)
- **Operation ID:** `SiteInfrastructureController_importRows`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SiteInfrastructureController.importRows](../../src/modules/practice/controllers/site-infrastructure.controller.ts)

### Descripción de negocio

Importar espacios (dryRun=true valida sin escribir). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Importación de filas ya parseadas, con validación en seco.

### Descripción del sistema

NestJS resuelve `POST /sites/{siteId}/care-spaces/import` en `SiteInfrastructureController_importRows`. El controlador delega en `CareSpacesAdminService.importRows`. Valida el body como `ImportCareSpacesDto` y consume `application/json`. El tipo de retorno estático es `Promise<ImportResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `dryRun` | query | No | `string` | valores: `true`, `false` | Por defecto true | `true` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ImportCareSpacesDto`; los campos opcionales se omiten.

```http
POST /sites/00000000-0000-4000-8000-000000000001/care-spaces/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `rows` | Sí | `array<object>` | mínimo 1 elemento(s); máximo 500 elemento(s) | Filas ya parseadas por el cliente. Cada una: code, name, formCode, functionCode, parentCode? (código de un espacio existente o de una fila anterior), clinicalUnitCode?, activate?, y los atributos de CareSpaceAttributes. Se validan fila por fila. | `[{"clave":"valor"}]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /sites/00000000-0000-4000-8000-000000000001/care-spaces/import?dryRun=true HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ImportResultDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<ImportResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ImportResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ImportResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ImportResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ImportResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ImportResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ImportResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ImportResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ImportResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ImportResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ImportResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true,
  "dryRun": true,
  "rows": [
    {
      "line": 1,
      "status": "ok",
      "errors": [
        {
          "field": "valor-ejemplo",
          "reason": "Texto descriptivo de ejemplo",
          "message": "valor-ejemplo"
        }
      ]
    }
  ],
  "created": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `dryRun` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `rows` | Sí | `array<ImportRowResultDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"line":1,"status":"ok","errors":[{"field":"valor-ejemplo","reason":"Texto descriptivo de ejemplo","message":"valor-ejemplo"}]}]` |
| `rows[].line` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rows[].status` | Sí | `string` | valores: `ok`, `error` | Sin descripción específica en el contrato OpenAPI. | `ok` |
| `rows[].errors` | Sí | `array<ImportFieldErrorDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"field":"valor-ejemplo","reason":"Texto descriptivo de ejemplo","message":"valor-ejemplo"}]` |
| `rows[].errors[].field` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rows[].errors[].reason` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `rows[].errors[].message` | Sí | `string` | Sin restricción adicional declarada | Texto para la persona | `valor-ejemplo` |
| `created` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere administrar la organización o la sucursal de esta sede | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
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
  "path": "/sites/{siteId}/care-spaces/import"
}
```

---

## 71. GET /sites/{siteId}/cleaning-orders

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Cola de limpieza de una sede
- **Operation ID:** `CareSpaceOpsController_cleaningOrders`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.cleaningOrders](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Cola de limpieza de una sede. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Cola de limpieza (sin datos de paciente).

### Descripción del sistema

NestJS resuelve `GET /sites/{siteId}/cleaning-orders` en `CareSpaceOpsController_cleaningOrders`. El controlador delega en `BedBoardReadService.cleaningOrders`. No recibe body. El tipo de retorno estático es `Promise<CleaningOrderListDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | query | No | `string` | valores: `CLN_PENDING`, `CLN_IN_PROGRESS`, `CLN_DONE`, `CLN_INSPECTED`, `CLN_REJECTED`, `CLN_CANCELLED` | Sin descripción específica en OpenAPI. | `CLN_PENDING` |
| `unitId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignedTo` | query | No | `string` | valores: `me` | Sin descripción específica en OpenAPI. | `me` |
| `priority` | query | No | `string` | valores: `CLN_PRIO_ROUTINE`, `CLN_PRIO_URGENT`, `CLN_PRIO_STAT` | Sin descripción específica en OpenAPI. | `CLN_PRIO_ROUTINE` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | requested_at ISO de la última fila de la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /sites/00000000-0000-4000-8000-000000000001/cleaning-orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /sites/00000000-0000-4000-8000-000000000001/cleaning-orders?status=CLN_PENDING&unitId=00000000-0000-4000-8000-000000000001&assignedTo=me&priority=CLN_PRIO_ROUTINE&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CleaningOrderListDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<CleaningOrderListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<CleaningOrderListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<CleaningOrderListDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<CleaningOrderListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<CleaningOrderListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<CleaningOrderListDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<CleaningOrderListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CleaningOrderListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "careSpaceCode": "CODIGO_EJEMPLO",
      "careSpaceName": "Nombre de ejemplo",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "typeCode": "CODIGO_EJEMPLO",
      "triggerCode": "CODIGO_EJEMPLO",
      "priorityCode": "CODIGO_EJEMPLO",
      "statusCode": "CODIGO_EJEMPLO",
      "requestedAt": "2026-07-31T12:00:00.000Z",
      "dueAt": "2026-07-31T12:00:00.000Z",
      "assignedUserId": "00000000-0000-4000-8000-000000000001",
      "startedAt": "2026-07-31T12:00:00.000Z",
      "finishedAt": "2026-07-31T12:00:00.000Z",
      "finishedByUserId": "00000000-0000-4000-8000-000000000001",
      "inspectedAt": "2026-07-31T12:00:00.000Z",
      "inspectionResult": "valor-ejemplo",
      "rejectionReason": "Texto descriptivo de ejemplo",
      "previousOrderId": "00000000-0000-4000-8000-000000000001",
      "ageMinutes": 1,
      "rowVersion": 1,
      "allowedTransitions": [
        "assign"
      ],
      "inspectionRequired": true,
      "requestId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "nextCursor": "valor-ejemplo",
  "generatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<CleaningOrderDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","careSpaceCode":"CODIGO_EJEMPLO","careSpaceName":"Nombre de ejemplo","clinicalUnitId":"00000000-0000-4000-8000-000000000001","typeCode":"CODIGO_EJEMPLO","triggerCode":"CODIGO_EJEMPLO","priorityCode":"CODIGO_EJEMPLO","statusCode":"CODIGO_EJEMPLO","requestedAt":"2026-07-31T12:00:00.000Z","dueAt":"2026-07-31T12:00:00.000Z","assignedUserId":"00000000-0000-4000-8000-000000000001","startedAt":"2026-07-31T12:00:00.000Z","finishedAt":"2026-07-31T12:00:00.000Z","finishedByUserId":"00000000-0000-4000-8000-000000000001","inspectedAt":"2026-07-31T12:00:00.000Z","inspectionResult":"valor-ejemplo","rejectionReason":"Texto descriptivo de ejemplo","previousOrderId":"00000000-0000-4000-8000-000000000001","ageMinutes":1,"rowVersion":1,"allowedTransitions":["assign"],"inspectionRequired":true,"requestId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].careSpaceCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].careSpaceName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].clinicalUnitId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].typeCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].triggerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].priorityCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].statusCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].requestedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].dueAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].assignedUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].startedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].finishedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].finishedByUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].inspectedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].inspectionResult` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].rejectionReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `items[].previousOrderId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].ageMinutes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].allowedTransitions` | Sí | `array<string>` | Sin restricción adicional declarada | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `["assign"]` |
| `items[].inspectionRequired` | Sí | `boolean` | Sin restricción adicional declarada | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `true` |
| `items[].requestId` | No | `string` | Sin restricción adicional declarada | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `00000000-0000-4000-8000-000000000001` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `generatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/sites/{siteId}/cleaning-orders"
}
```

---

## 72. POST /sites/{siteId}/cleaning-orders

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-operations`
- **Nombre:** Crear una orden de limpieza
- **Operation ID:** `CareSpaceOpsController_createCleaningOrder`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CareSpaceOpsController.createCleaningOrder](../../src/modules/practice/controllers/care-space-ops.controller.ts)

### Descripción de negocio

Crear una orden de limpieza. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Orden de limpieza manual.

### Descripción del sistema

NestJS resuelve `POST /sites/{siteId}/cleaning-orders` en `CareSpaceOpsController_createCleaningOrder`. El controlador delega en `CleaningOrdersService.create`. Valida el body como `CreateCleaningOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<CleaningOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCleaningOrderDto`; los campos opcionales se omiten.

```http
POST /sites/00000000-0000-4000-8000-000000000001/cleaning-orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "typeCode": "CLEAN_ROUTINE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `typeCode` | Sí | `string` | valores: `CLEAN_ROUTINE`, `CLEAN_DISCHARGE`, `CLEAN_TERMINAL`, `CLEAN_OR_TURNOVER`, `CLEAN_SPOT` | Sin descripción específica en el contrato OpenAPI. | `CLEAN_ROUTINE` |
| `priorityCode` | No | `string` | valores: `CLN_PRIO_ROUTINE`, `CLN_PRIO_URGENT`, `CLN_PRIO_STAT` | Sin descripción específica en el contrato OpenAPI. | `CLN_PRIO_ROUTINE` |
| `note` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /sites/00000000-0000-4000-8000-000000000001/cleaning-orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "typeCode": "CLEAN_ROUTINE",
  "priorityCode": "CLN_PRIO_ROUTINE",
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CleaningOrderDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CleaningOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CleaningOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "careSpaceCode": "CODIGO_EJEMPLO",
  "careSpaceName": "Nombre de ejemplo",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "typeCode": "CODIGO_EJEMPLO",
  "triggerCode": "CODIGO_EJEMPLO",
  "priorityCode": "CODIGO_EJEMPLO",
  "statusCode": "CODIGO_EJEMPLO",
  "requestedAt": "2026-07-31T12:00:00.000Z",
  "dueAt": "2026-07-31T12:00:00.000Z",
  "assignedUserId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "finishedAt": "2026-07-31T12:00:00.000Z",
  "finishedByUserId": "00000000-0000-4000-8000-000000000001",
  "inspectedAt": "2026-07-31T12:00:00.000Z",
  "inspectionResult": "valor-ejemplo",
  "rejectionReason": "Texto descriptivo de ejemplo",
  "previousOrderId": "00000000-0000-4000-8000-000000000001",
  "ageMinutes": 1,
  "rowVersion": 1,
  "allowedTransitions": [
    "assign"
  ],
  "inspectionRequired": true,
  "requestId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `careSpaceCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `careSpaceName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `clinicalUnitId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `typeCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `triggerCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `priorityCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `statusCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `requestedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `dueAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignedUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `startedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `finishedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `finishedByUserId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `inspectedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `inspectionResult` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rejectionReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `previousOrderId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ageMinutes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `allowedTransitions` | Sí | `array<string>` | Sin restricción adicional declarada | Transiciones que admite el estado y que el actor puede hacer (la API decide en cada endpoint) | `["assign"]` |
| `inspectionRequired` | Sí | `boolean` | Sin restricción adicional declarada | La orden exige inspección: terminal (tipo o bandera del espacio) o ajuste de la práctica | `true` |
| `requestId` | No | `string` | Sin restricción adicional declarada | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/infrastructure-access.service.ts |
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
  "path": "/sites/{siteId}/cleaning-orders"
}
```

---

## 73. GET /sites/{siteId}/clinical-units

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Listar las unidades clínicas de la sede
- **Operation ID:** `SiteInfrastructureController_listUnits`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SiteInfrastructureController.listUnits](../../src/modules/practice/controllers/site-infrastructure.controller.ts)

### Descripción de negocio

Listar las unidades clínicas de la sede. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Unidades clínicas de la sede.

### Descripción del sistema

NestJS resuelve `GET /sites/{siteId}/clinical-units` en `SiteInfrastructureController_listUnits`. El controlador delega en `ClinicalUnitsAdminService.list`. No recibe body. El tipo de retorno estático es `Promise<ClinicalUnitNodeDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /sites/00000000-0000-4000-8000-000000000001/clinical-units HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /sites/00000000-0000-4000-8000-000000000001/clinical-units HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ClinicalUnitNodeDto[]>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<ClinicalUnitNodeDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<ClinicalUnitNodeDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<ClinicalUnitNodeDto[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<ClinicalUnitNodeDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<ClinicalUnitNodeDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<ClinicalUnitNodeDto[]>` | No |
| 504 | Consulta completada correctamente. | `Promise<ClinicalUnitNodeDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClinicalUnitNodeDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "parentId": "00000000-0000-4000-8000-000000000001",
    "code": "CODIGO_EJEMPLO",
    "name": "Nombre de ejemplo",
    "description": "Texto descriptivo de ejemplo",
    "status": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "responsibleUserId": {},
    "rowVersion": 1,
    "childCount": 1
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/sites/{siteId}/clinical-units"
}
```

---

## 74. POST /sites/{siteId}/clinical-units

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Crear una unidad clínica jerárquica
- **Operation ID:** `SitesController_createClinicalUnit`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SitesController.createClinicalUnit](../../src/modules/practice/controllers/sites.controller.ts)

### Descripción de negocio

Crear una unidad clínica jerárquica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-14-04. Sin `@Roles`: el dueño de una organización entra con rol global `USER` y su poder es la membresía OWNER/ADMIN. La autorización la hace el servicio (`TenantAdministrationService.assertCanAdminister`), y una sede de otro tenant responde 404.

### Descripción del sistema

NestJS resuelve `POST /sites/{siteId}/clinical-units` en `SitesController_createClinicalUnit`. El controlador delega en `ClinicalStructureService.createClinicalUnit`. Valida el body como `CreateClinicalUnitDto` y consume `application/json`. El tipo de retorno estático es `Promise<ClinicalUnitResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateClinicalUnitDto`; los campos opcionales se omiten.

```http
POST /sites/00000000-0000-4000-8000-000000000001/clinical-units HTTP/1.1
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
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `parentUnitId` | No | `string` | formato `uuid` | Unidad padre (misma sede) | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único dentro de la sede | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre de la unidad | `Nombre de ejemplo` |
| `unitTypeConceptId` | No | `string` | formato `uuid` | Concepto de tipo de unidad | `00000000-0000-4000-8000-000000000001` |
| `specialtyConceptId` | No | `string` | formato `uuid` | Concepto de especialidad | `00000000-0000-4000-8000-000000000001` |
| `serviceModeConceptId` | No | `string` | formato `uuid` | Concepto de modo de servicio | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /sites/00000000-0000-4000-8000-000000000001/clinical-units HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "parentUnitId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "unitTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceModeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ClinicalUnitResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ClinicalUnitResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ClinicalUnitResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ClinicalUnitResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ClinicalUnitResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ClinicalUnitResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ClinicalUnitResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ClinicalUnitResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ClinicalUnitResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ClinicalUnitResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ClinicalUnitResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClinicalUnitResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "status": "ok",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practiceSiteId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice site. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere administrar la organización o la sucursal de esta sede | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 409 | `CONFLICT` | Ya existe una unidad con ese código en el sitio | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El sitio no está activo | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
| 422 | `PRECONDITION_FAILED` | La unidad padre no pertenece al sitio | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/sites/{siteId}/clinical-units"
}
```

---

## 75. POST /sites/{siteId}/declared-capacities

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Declarar capacidad del establecimiento
- **Operation ID:** `SiteInfrastructureController_declareCapacity`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SiteInfrastructureController.declareCapacity](../../src/modules/practice/controllers/site-infrastructure.controller.ts)

### Descripción de negocio

Declarar capacidad del establecimiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Declarar capacidad (habilitación, resolución).

### Descripción del sistema

NestJS resuelve `POST /sites/{siteId}/declared-capacities` en `SiteInfrastructureController_declareCapacity`. El controlador delega en `SiteEstablishmentService.declareCapacity`. Valida el body como `CreateDeclaredCapacityDto` y consume `application/json`. El tipo de retorno estático es `Promise<SiteCapacityDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDeclaredCapacityDto`; los campos opcionales se omiten.

```http
POST /sites/00000000-0000-4000-8000-000000000001/declared-capacities HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "kindCode": "CODIGO_EJEMPLO",
  "quantity": 1,
  "asOf": "2026-07-31"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kindCode` | Sí | `string` | Sin restricción adicional declarada | CAP_* | `CODIGO_EJEMPLO` |
| `quantity` | Sí | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `asOf` | Sí | `string` | formato `date`; patrón runtime `DATE` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `resolutionNumber` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `validTo` | No | `string` | formato `date`; patrón runtime `DATE` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /sites/00000000-0000-4000-8000-000000000001/declared-capacities HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "kindCode": "CODIGO_EJEMPLO",
  "quantity": 1,
  "asOf": "2026-07-31",
  "resolutionNumber": "valor-ejemplo",
  "validTo": "2026-07-31"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SiteCapacityDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SiteCapacityDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SiteCapacityDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteCapacityDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "declared": [
    {
      "kindCode": "CODIGO_EJEMPLO",
      "quantity": 1,
      "asOf": "2026-07-31",
      "resolutionNumber": "valor-ejemplo",
      "source": "site"
    }
  ],
  "derived": [
    {
      "kindCode": "CODIGO_EJEMPLO",
      "quantity": 1
    }
  ],
  "gaps": [
    {
      "kindCode": "CODIGO_EJEMPLO",
      "declared": 1,
      "derived": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `declared` | Sí | `array<DeclaredCapacityLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"kindCode":"CODIGO_EJEMPLO","quantity":1,"asOf":"2026-07-31","resolutionNumber":"valor-ejemplo","source":"site"}]` |
| `declared[].kindCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `declared[].quantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `declared[].asOf` | Sí | `string` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `declared[].resolutionNumber` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `declared[].source` | Sí | `string` | valores: `site`, `hospital` | site = site_declared_capacities; hospital = organization_extensions.hospitals | `site` |
| `derived` | Sí | `array<DerivedCapacityLineDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"kindCode":"CODIGO_EJEMPLO","quantity":1}]` |
| `derived[].kindCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `derived[].quantity` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `gaps` | Sí | `array<CapacityGapDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"kindCode":"CODIGO_EJEMPLO","declared":1,"derived":1}]` |
| `gaps[].kindCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `gaps[].declared` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `gaps[].derived` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
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
  "path": "/sites/{siteId}/declared-capacities"
}
```

---

## 76. GET /sites/{siteId}/diagnostic-equipment

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-infrastructure`
- **Nombre:** Equipos diagnósticos de una sede (F5a)
- **Operation ID:** `SpaceAssetsController_siteEquipment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SpaceAssetsController.siteEquipment](../../src/modules/practice/controllers/space-assets.controller.ts)

### Descripción de negocio

Equipos diagnósticos de una sede (F5a). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Equipos de las unidades diagnósticas de la sede, filtrados por alcance.

### Descripción del sistema

NestJS resuelve `GET /sites/{siteId}/diagnostic-equipment` en `SpaceAssetsController_siteEquipment`. El controlador delega en `SpaceAssetsReadService.siteEquipment`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /sites/00000000-0000-4000-8000-000000000001/diagnostic-equipment HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /sites/00000000-0000-4000-8000-000000000001/diagnostic-equipment HTTP/1.1
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
  "path": "/sites/{siteId}/diagnostic-equipment"
}
```

---

## 77. GET /sites/{siteId}/licenses

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Habilitaciones del establecimiento
- **Operation ID:** `SiteInfrastructureController_listLicenses`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SiteInfrastructureController.listLicenses](../../src/modules/practice/controllers/site-infrastructure.controller.ts)

### Descripción de negocio

Habilitaciones del establecimiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Habilitaciones de la sede.

### Descripción del sistema

NestJS resuelve `GET /sites/{siteId}/licenses` en `SiteInfrastructureController_listLicenses`. El controlador delega en `SiteEstablishmentService.listLicenses`. No recibe body. El tipo de retorno estático es `Promise<SiteLicenseDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /sites/00000000-0000-4000-8000-000000000001/licenses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /sites/00000000-0000-4000-8000-000000000001/licenses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SiteLicenseDto[]>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<SiteLicenseDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<SiteLicenseDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<SiteLicenseDto[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<SiteLicenseDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<SiteLicenseDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<SiteLicenseDto[]>` | No |
| 504 | Consulta completada correctamente. | `Promise<SiteLicenseDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteLicenseDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "practiceSiteId": "00000000-0000-4000-8000-000000000001",
    "authorityName": "Nombre de ejemplo",
    "resolutionNumber": "valor-ejemplo",
    "issuedOn": "2026-07-31",
    "expiresOn": "2026-07-31",
    "status": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "clinicalUnitId": {},
    "healthcareServiceId": {},
    "documentFileId": {},
    "rowVersion": 1
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/sites/{siteId}/licenses"
}
```

---

## 78. POST /sites/{siteId}/licenses

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Registrar una habilitación del establecimiento
- **Operation ID:** `SiteInfrastructureController_createLicense`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SiteInfrastructureController.createLicense](../../src/modules/practice/controllers/site-infrastructure.controller.ts)

### Descripción de negocio

Registrar una habilitación del establecimiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Registrar una habilitación (nace en trámite).

### Descripción del sistema

NestJS resuelve `POST /sites/{siteId}/licenses` en `SiteInfrastructureController_createLicense`. El controlador delega en `SiteEstablishmentService.createLicense`. Valida el body como `CreateSiteLicenseDto` y consume `application/json`. El tipo de retorno estático es `Promise<SiteLicenseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateSiteLicenseDto`; los campos opcionales se omiten.

```http
POST /sites/00000000-0000-4000-8000-000000000001/licenses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "authorityName": "Nombre de ejemplo",
  "resolutionNumber": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `authorityName` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Autoridad emisora (p. ej. SEDES La Paz) | `Nombre de ejemplo` |
| `resolutionNumber` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Número de resolución | `valor-ejemplo` |
| `issuedOn` | No | `string` | formato `date`; patrón runtime `DATE` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `expiresOn` | No | `string` | formato `date`; patrón runtime `DATE` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `clinicalUnitId` | No | `string` | formato `uuid` | Alcance: unidad de la sede | `00000000-0000-4000-8000-000000000001` |
| `healthcareServiceId` | No | `string` | formato `uuid` | Alcance: servicio de la sede | `00000000-0000-4000-8000-000000000001` |
| `documentFileId` | No | `string` | formato `uuid` | Archivo de la resolución | `00000000-0000-4000-8000-000000000001` |
| `notes` | No | `string` | admite null | Sin columna en facility_licenses: sólo se acepta vacío (422 LICENSE_NOTES_UNSUPPORTED si trae texto) | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /sites/00000000-0000-4000-8000-000000000001/licenses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "authorityName": "Nombre de ejemplo",
  "resolutionNumber": "valor-ejemplo",
  "issuedOn": "2026-07-31",
  "expiresOn": "2026-07-31",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "documentFileId": "00000000-0000-4000-8000-000000000001",
  "notes": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SiteLicenseDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SiteLicenseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteLicenseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "authorityName": "Nombre de ejemplo",
  "resolutionNumber": "valor-ejemplo",
  "issuedOn": "2026-07-31",
  "expiresOn": "2026-07-31",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "clinicalUnitId": {},
  "healthcareServiceId": {},
  "documentFileId": {},
  "rowVersion": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceSiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `authorityName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `resolutionNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `issuedOn` | Sí | `string` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `expiresOn` | Sí | `string` | formato `date`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `status` | Sí | `ConceptDto` | Sin restricción adicional declarada | LIC_*; vencida se calcula al leer | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `healthcareServiceId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `documentFileId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Unidad clínica no encontrada | Excepción explícita en src/modules/practice/services/site-establishment.service.ts |
| 404 | `NOT_FOUND` | Servicio no encontrado | Excepción explícita en src/modules/practice/services/site-establishment.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
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
  "path": "/sites/{siteId}/licenses"
}
```

---

## 79. GET /sites/{siteId}/regulatory

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Datos regulatorios del establecimiento
- **Operation ID:** `SiteInfrastructureController_getRegulatory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SiteInfrastructureController.getRegulatory](../../src/modules/practice/controllers/site-infrastructure.controller.ts)

### Descripción de negocio

Datos regulatorios del establecimiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Datos regulatorios del establecimiento.

### Descripción del sistema

NestJS resuelve `GET /sites/{siteId}/regulatory` en `SiteInfrastructureController_getRegulatory`. El controlador delega en `SiteEstablishmentService.getRegulatory`. No recibe body. El tipo de retorno estático es `Promise<SiteRegulatoryDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /sites/00000000-0000-4000-8000-000000000001/regulatory HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /sites/00000000-0000-4000-8000-000000000001/regulatory HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<SiteRegulatoryDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteRegulatoryDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "timeZone": "America/La_Paz",
  "rowVersion": 1,
  "regulatory": {
    "snisCode": "CODIGO_EJEMPLO",
    "snisVerified": true,
    "subsector": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "careLevel": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "typology": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "managingEntityName": "Nombre de ejemplo",
    "healthNetworkName": "Nombre de ejemplo",
    "sedes": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "municipalityName": "Nombre de ejemplo"
  },
  "canWrite": true,
  "missingRequiredFunctions": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `branchId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `timeZone` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `regulatory` | Sí | `SiteRegulatoryDataDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"snisCode":"CODIGO_EJEMPLO","snisVerified":true,"subsector":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"careLevel":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"typology":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"managingEntityName":"Nombre de ejemplo","healthNetworkName":"Nombre de ejemplo","sedes":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"municipalityName":"Nombre de ejemplo"}` |
| `regulatory.snisCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.snisVerified` | Sí | `boolean` | Sin restricción adicional declarada | Código SNIS verificado por la plataforma | `true` |
| `regulatory.subsector` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `regulatory.subsector.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.subsector.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.careLevel` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `regulatory.careLevel.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.careLevel.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.typology` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `regulatory.typology.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.typology.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.managingEntityName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `regulatory.healthNetworkName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `regulatory.sedes` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `regulatory.sedes.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.sedes.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.municipalityName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `canWrite` | Sí | `boolean` | Sin restricción adicional declarada | El actor puede editar la estructura (sólo refleja; la API decide) | `true` |
| `missingRequiredFunctions` | Sí | `array<string>` | Sin restricción adicional declarada | Funciones obligatorias que faltan | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/sites/{siteId}/regulatory"
}
```

---

## 80. PATCH /sites/{siteId}/regulatory

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Editar los datos regulatorios del establecimiento
- **Operation ID:** `SiteInfrastructureController_updateRegulatory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SiteInfrastructureController.updateRegulatory](../../src/modules/practice/controllers/site-infrastructure.controller.ts)

### Descripción de negocio

Editar los datos regulatorios del establecimiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Editar datos regulatorios (409 `TYPOLOGY_CONFLICT`).

### Descripción del sistema

NestJS resuelve `PATCH /sites/{siteId}/regulatory` en `SiteInfrastructureController_updateRegulatory`. El controlador delega en `SiteEstablishmentService.updateRegulatory`. Valida el body como `UpdateSiteRegulatoryDto` y consume `application/json`. El tipo de retorno estático es `Promise<SiteRegulatoryDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match` | header | No | `string` | Sin restricción adicional declarada | rowVersion de la sede; si viene y no coincide: 412 | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateSiteRegulatoryDto`; los campos opcionales se omiten.

```http
PATCH /sites/00000000-0000-4000-8000-000000000001/regulatory HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `snisCode` | No | `string` | longitud máxima 30; patrón runtime `/^[A-Za-z0-9-]{1,30}$/`; admite null | Código SNIS/SUIS | `CODIGO_EJEMPLO` |
| `subsectorCode` | No | `string` | admite null | SUBSECTOR_* | `CODIGO_EJEMPLO` |
| `careLevelCode` | No | `string` | admite null | CARE_LEVEL_* | `CODIGO_EJEMPLO` |
| `typologyCode` | No | `string` | admite null | TYPOLOGY_* | `CODIGO_EJEMPLO` |
| `managingEntityName` | No | `string` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `healthNetworkName` | No | `string` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sedesCode` | No | `string` | admite null | SEDES_* | `CODIGO_EJEMPLO` |
| `municipalityName` | No | `string` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /sites/00000000-0000-4000-8000-000000000001/regulatory HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "snisCode": "CODIGO_EJEMPLO",
  "subsectorCode": "CODIGO_EJEMPLO",
  "careLevelCode": "CODIGO_EJEMPLO",
  "typologyCode": "CODIGO_EJEMPLO",
  "managingEntityName": "Nombre de ejemplo",
  "healthNetworkName": "Nombre de ejemplo",
  "sedesCode": "CODIGO_EJEMPLO",
  "municipalityName": "Nombre de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteRegulatoryDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "timeZone": "America/La_Paz",
  "rowVersion": 1,
  "regulatory": {
    "snisCode": "CODIGO_EJEMPLO",
    "snisVerified": true,
    "subsector": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "careLevel": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "typology": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "managingEntityName": "Nombre de ejemplo",
    "healthNetworkName": "Nombre de ejemplo",
    "sedes": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "municipalityName": "Nombre de ejemplo"
  },
  "canWrite": true,
  "missingRequiredFunctions": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `branchId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `timeZone` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `regulatory` | Sí | `SiteRegulatoryDataDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"snisCode":"CODIGO_EJEMPLO","snisVerified":true,"subsector":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"careLevel":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"typology":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"managingEntityName":"Nombre de ejemplo","healthNetworkName":"Nombre de ejemplo","sedes":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"municipalityName":"Nombre de ejemplo"}` |
| `regulatory.snisCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.snisVerified` | Sí | `boolean` | Sin restricción adicional declarada | Código SNIS verificado por la plataforma | `true` |
| `regulatory.subsector` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `regulatory.subsector.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.subsector.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.careLevel` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `regulatory.careLevel.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.careLevel.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.typology` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `regulatory.typology.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.typology.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.managingEntityName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `regulatory.healthNetworkName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `regulatory.sedes` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `regulatory.sedes.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.sedes.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.municipalityName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `canWrite` | Sí | `boolean` | Sin restricción adicional declarada | El actor puede editar la estructura (sólo refleja; la API decide) | `true` |
| `missingRequiredFunctions` | Sí | `array<string>` | Sin restricción adicional declarada | Funciones obligatorias que faltan | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
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
  "path": "/sites/{siteId}/regulatory"
}
```

---

## 81. POST /sites/{siteId}/regulatory/verify-snis

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Verificar el código SNIS del establecimiento (plataforma)
- **Operation ID:** `SiteInfrastructureController_verifySnis`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SiteInfrastructureController.verifySnis](../../src/modules/practice/controllers/site-infrastructure.controller.ts)

### Descripción de negocio

Verificar el código SNIS del establecimiento (plataforma). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Verificar el código SNIS (sólo plataforma). `@Roles` declara la misma regla que `SiteEstablishmentService.verifySnis` sigue comprobando (SECURITY_ADMIN o SUPERADMIN): el resto de esta clase autoriza por membresía, esta ruta no.

### Descripción del sistema

NestJS resuelve `POST /sites/{siteId}/regulatory/verify-snis` en `SiteInfrastructureController_verifySnis`. El controlador delega en `SiteEstablishmentService.verifySnis`. No recibe body. El tipo de retorno estático es `Promise<SiteRegulatoryDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /sites/00000000-0000-4000-8000-000000000001/regulatory/verify-snis HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `SUPERADMIN`.
- Deben ser UUID válidos: `siteId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /sites/00000000-0000-4000-8000-000000000001/regulatory/verify-snis HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SiteRegulatoryDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteRegulatoryDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "status": {
    "code": "CODIGO_EJEMPLO",
    "display": "valor-ejemplo"
  },
  "timeZone": "America/La_Paz",
  "rowVersion": 1,
  "regulatory": {
    "snisCode": "CODIGO_EJEMPLO",
    "snisVerified": true,
    "subsector": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "careLevel": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "typology": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "managingEntityName": "Nombre de ejemplo",
    "healthNetworkName": "Nombre de ejemplo",
    "sedes": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "municipalityName": "Nombre de ejemplo"
  },
  "canWrite": true,
  "missingRequiredFunctions": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `branchId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `timeZone` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `regulatory` | Sí | `SiteRegulatoryDataDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"snisCode":"CODIGO_EJEMPLO","snisVerified":true,"subsector":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"careLevel":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"typology":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"managingEntityName":"Nombre de ejemplo","healthNetworkName":"Nombre de ejemplo","sedes":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"municipalityName":"Nombre de ejemplo"}` |
| `regulatory.snisCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.snisVerified` | Sí | `boolean` | Sin restricción adicional declarada | Código SNIS verificado por la plataforma | `true` |
| `regulatory.subsector` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `regulatory.subsector.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.subsector.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.careLevel` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `regulatory.careLevel.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.careLevel.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.typology` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `regulatory.typology.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.typology.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.managingEntityName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `regulatory.healthNetworkName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `regulatory.sedes` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `regulatory.sedes.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regulatory.sedes.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regulatory.municipalityName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `canWrite` | Sí | `boolean` | Sin restricción adicional declarada | El actor puede editar la estructura (sólo refleja; la API decide) | `true` |
| `missingRequiredFunctions` | Sí | `array<string>` | Sin restricción adicional declarada | Funciones obligatorias que faltan | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, SUPERADMIN. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo la plataforma verifica el código SNIS | Excepción explícita en src/modules/practice/services/site-establishment.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/sites/{siteId}/regulatory/verify-snis"
}
```

---

## 82. GET /sites/{siteId}/sample-collection-points

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice-infrastructure`
- **Nombre:** Puntos de toma de muestra de una sede (F5b)
- **Operation ID:** `SpaceAssetsController_collectionPoints`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SpaceAssetsController.collectionPoints](../../src/modules/practice/controllers/space-assets.controller.ts)

### Descripción de negocio

Puntos de toma de muestra de una sede (F5b). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: F5b: puntos de toma de muestra disponibles de la sede.

### Descripción del sistema

NestJS resuelve `GET /sites/{siteId}/sample-collection-points` en `SpaceAssetsController_collectionPoints`. El controlador delega en `SpaceAssetsReadService.collectionPoints`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /sites/00000000-0000-4000-8000-000000000001/sample-collection-points HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /sites/00000000-0000-4000-8000-000000000001/sample-collection-points HTTP/1.1
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
  "path": "/sites/{siteId}/sample-collection-points"
}
```

---

## 83. GET /sites/{siteId}/structure

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Estructura de la sede (espacios, unidades, vínculos)
- **Operation ID:** `SiteInfrastructureController_structure`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SiteInfrastructureController.structure](../../src/modules/practice/controllers/site-infrastructure.controller.ts)

### Descripción de negocio

Estructura de la sede (espacios, unidades, vínculos). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Árbol físico y organizativo de la sede, plano con `parentId`.

### Descripción del sistema

NestJS resuelve `GET /sites/{siteId}/structure` en `SiteInfrastructureController_structure`. El controlador delega en `InfrastructureReadService.structure`. No recibe body. El tipo de retorno estático es `Promise<SiteStructureDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `siteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /sites/00000000-0000-4000-8000-000000000001/structure HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `siteId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /sites/00000000-0000-4000-8000-000000000001/structure HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SiteStructureDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<SiteStructureDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SiteStructureDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SiteStructureDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<SiteStructureDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SiteStructureDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SiteStructureDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<SiteStructureDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SiteStructureDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "site": {
    "id": "00000000-0000-4000-8000-000000000001",
    "practiceId": "00000000-0000-4000-8000-000000000001",
    "branchId": "00000000-0000-4000-8000-000000000001",
    "code": "CODIGO_EJEMPLO",
    "name": "Nombre de ejemplo",
    "status": {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    },
    "timeZone": "America/La_Paz",
    "rowVersion": 1,
    "regulatory": {
      "snisCode": "CODIGO_EJEMPLO",
      "snisVerified": true,
      "subsector": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "careLevel": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "typology": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "managingEntityName": "Nombre de ejemplo",
      "healthNetworkName": "Nombre de ejemplo",
      "sedes": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "municipalityName": "Nombre de ejemplo"
    },
    "canWrite": true
  },
  "spaces": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "form": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "function": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "operationalStatus": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "clinicalUnitId": {},
      "capacity": 1,
      "rowVersion": 1,
      "childCount": 1
    }
  ],
  "units": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "parentId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "status": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "responsibleUserId": {},
      "rowVersion": 1,
      "childCount": 1
    }
  ],
  "assignments": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "role": {
        "code": "CODIGO_EJEMPLO",
        "display": "valor-ejemplo"
      },
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "asOf": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `site` | Sí | `EstablishmentSummaryDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","practiceId":"00000000-0000-4000-8000-000000000001","branchId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"timeZone":"America/La_Paz","rowVersion":1,"regulatory":{"snisCode":"CODIGO_EJEMPLO","snisVerified":true,"subsector":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"careLevel":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"typology":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"managingEntityName":"Nombre de ejemplo","healthNetworkName":"Nombre de ejemplo","sedes":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"municipalityName":"Nombre de ejemplo"},"canWrite":true}` |
| `site.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `site.practiceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `site.branchId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `site.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `site.name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `site.status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `site.status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `site.status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `site.timeZone` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `site.rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `site.regulatory` | Sí | `SiteRegulatoryDataDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"snisCode":"CODIGO_EJEMPLO","snisVerified":true,"subsector":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"careLevel":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"typology":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"managingEntityName":"Nombre de ejemplo","healthNetworkName":"Nombre de ejemplo","sedes":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"municipalityName":"Nombre de ejemplo"}` |
| `site.regulatory.snisCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `site.regulatory.snisVerified` | Sí | `boolean` | Sin restricción adicional declarada | Código SNIS verificado por la plataforma | `true` |
| `site.regulatory.subsector` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `site.regulatory.subsector.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `site.regulatory.subsector.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `site.regulatory.careLevel` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `site.regulatory.careLevel.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `site.regulatory.careLevel.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `site.regulatory.typology` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `site.regulatory.typology.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `site.regulatory.typology.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `site.regulatory.managingEntityName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `site.regulatory.healthNetworkName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `site.regulatory.sedes` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `site.regulatory.sedes.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `site.regulatory.sedes.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `site.regulatory.municipalityName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `site.canWrite` | Sí | `boolean` | Sin restricción adicional declarada | El actor puede editar la estructura (sólo refleja; la API decide) | `true` |
| `spaces` | Sí | `array<CareSpaceNodeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","form":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"function":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"operationalStatus":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"clinicalUnitId":{},"capacity":1,"rowVersion":1,"childCount":1}]` |
| `spaces[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `spaces[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `spaces[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `spaces[].form` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].form.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].form.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].function` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].function.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].function.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].operationalStatus` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `spaces[].operationalStatus.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `spaces[].operationalStatus.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `spaces[].clinicalUnitId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `spaces[].capacity` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `spaces[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `spaces[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `units` | Sí | `array<ClinicalUnitNodeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","parentId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","description":"Texto descriptivo de ejemplo","status":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"responsibleUserId":{},"rowVersion":1,"childCount":1}]` |
| `units[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `units[].parentId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `units[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `units[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `units[].description` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `units[].status` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `units[].status.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `units[].status.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `units[].responsibleUserId` | Sí | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `units[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `units[].childCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `assignments` | Sí | `array<SpaceUnitAssignmentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","careSpaceId":"00000000-0000-4000-8000-000000000001","clinicalUnitId":"00000000-0000-4000-8000-000000000001","role":{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"},"validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `assignments[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].careSpaceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].clinicalUnitId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].role` | Sí | `ConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo"}` |
| `assignments[].role.code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `assignments[].role.display` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `assignments[].validFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignments[].validTo` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `asOf` | Sí | `string` | Sin restricción adicional declarada | Instante de la lectura (S7) | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/structure-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/sites/{siteId}/structure"
}
```

---

## 84. POST /tenants/{tenantId}/practices

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Crear la práctica y la primera sede de una organización
- **Operation ID:** `OrganizationPracticesController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrganizationPracticesController.create](../../src/modules/practice/controllers/organization-practices.controller.ts)

### Descripción de negocio

Exige que la organización esté verificada (422 si no) y que el actor administre esa organización (403 si no). Dos prácticas con el mismo nombre en la misma organización responden 409.

Contexto declarado en el controlador: Una organización verificada abre su práctica con la primera sede.

### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/practices` en `OrganizationPracticesController_create`. El controlador delega en `OrganizationPracticeProvisioningService.provision`. Valida el body como `CreateOrganizationPracticeDto` y consume `application/json`. El tipo de retorno estático es `Promise<OrganizationPracticeResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateOrganizationPracticeDto`; los campos opcionales se omiten.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/practices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "site": {
    "name": "Nombre de ejemplo",
    "addressText": "Av. San Martín 123",
    "latitude": -17.7833,
    "longitude": -63.1821
  }
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud mínima 2; longitud máxima 200 | Nombre del centro médico | `Nombre de ejemplo` |
| `site` | Sí | `CreateOrganizationPracticeSiteDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"name":"Nombre de ejemplo","addressText":"Av. San Martín 123","latitude":-17.7833,"longitude":-63.1821,"cityText":"Santa Cruz de la Sierra"}` |
| `site.name` | Sí | `string` | longitud mínima 2; longitud máxima 200 | Nombre de la sede | `Nombre de ejemplo` |
| `site.addressText` | Sí | `string` | longitud mínima 2; longitud máxima 500 | Dirección en una línea | `Av. San Martín 123` |
| `site.latitude` | Sí | `number` | mínimo -90; máximo 90 | Sin descripción específica en el contrato OpenAPI. | `-17.7833` |
| `site.longitude` | Sí | `number` | mínimo -180; máximo 180 | Sin descripción específica en el contrato OpenAPI. | `-63.1821` |
| `site.cityText` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Santa Cruz de la Sierra` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/practices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "site": {
    "name": "Nombre de ejemplo",
    "addressText": "Av. San Martín 123",
    "latitude": -17.7833,
    "longitude": -63.1821,
    "cityText": "Santa Cruz de la Sierra"
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<OrganizationPracticeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OrganizationPracticeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OrganizationPracticeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OrganizationPracticeResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OrganizationPracticeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OrganizationPracticeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OrganizationPracticeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OrganizationPracticeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OrganizationPracticeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OrganizationPracticeResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<OrganizationPracticeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OrganizationPracticeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | Sí | `string` | formato `uuid` | Identificador de la práctica creada. | `00000000-0000-4000-8000-000000000001` |
| `practiceSiteId` | Sí | `string` | formato `uuid` | Identificador de su primera sede. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Organización no encontrada | Excepción explícita en src/modules/practice/services/organization-practice-provisioning.service.ts |
| 409 | `CONFLICT` | La organización ya tiene una práctica con ese nombre | Excepción explícita en src/modules/practice/services/organization-practice-provisioning.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La organización todavía no fue verificada | Excepción explícita en src/modules/practice/services/organization-practice-provisioning.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/practices"
}
```

---

