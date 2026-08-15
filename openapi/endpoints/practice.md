<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `practice`

Referencia exhaustiva de 17 operación(es) del módulo `practice`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `practice`
- **Controladores:** `AccreditationsController`, `InventoryItemsController`, `PracticesController`, `PractitionerSitesController`, `RoleAssignmentsController`, `SitesController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /accreditations/{id}/verify](#1-post-accreditations-id-verify) — Verificar o caducar una acreditación (transición de estado)
2. [POST /inventory-items/{itemId}/movements](#2-post-inventory-items-itemid-movements) — Registrar un movimiento de inventario (ajuste de stock)
3. [GET /practices](#3-get-practices) — Listar las prácticas activas del tenant
4. [POST /practices](#4-post-practices) — Dar de alta una práctica (organización raíz)
5. [POST /practices/{practiceId}/accreditations](#5-post-practices-practiceid-accreditations) — Registrar una acreditación con evidencia
6. [POST /practices/{practiceId}/healthcare-services](#6-post-practices-practiceid-healthcare-services) — Publicar un servicio de salud
7. [POST /practices/{practiceId}/inventory-items](#7-post-practices-practiceid-inventory-items) — Dar de alta un insumo de inventario de práctica
8. [POST /practices/{practiceId}/role-assignments](#8-post-practices-practiceid-role-assignments) — Asignar un rol de profesional a sitio/unidad/servicio
9. [PUT /practices/{practiceId}/settings/{settingKey}](#9-put-practices-practiceid-settings-settingkey) — Configurar un ajuste de práctica (upsert)
10. [GET /practices/{practiceId}/sites](#10-get-practices-practiceid-sites) — Listar las sedes de una práctica
11. [POST /practices/{practiceId}/sites](#11-post-practices-practiceid-sites) — Dar de alta un sitio de práctica
12. [DELETE /practices/{practiceId}/sites/{siteId}](#12-delete-practices-practiceid-sites-siteid) — Desmantelar un sitio en cascada (soft-delete)
13. [GET /practitioners/{profileId}/sites](#13-get-practitioners-profileid-sites) — Consultorios donde atiende el profesional
14. [POST /role-assignments/{roleId}/support-assignments](#14-post-role-assignments-roleid-support-assignments) — Adjuntar personal de apoyo a un rol de profesional
15. [GET /sites/{siteId}/care-spaces](#15-get-sites-siteid-care-spaces) — Listar los espacios de atención de la sede
16. [POST /sites/{siteId}/care-spaces](#16-post-sites-siteid-care-spaces) — Crear un espacio de atención bajo una unidad/sitio
17. [POST /sites/{siteId}/clinical-units](#17-post-sites-siteid-clinical-units) — Crear una unidad clínica jerárquica

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
| 404 | `NOT_FOUND` | Acreditación no encontrada | Excepción explícita en src/modules/practice/services/practice-accreditations.service.ts |
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

## 2. POST /inventory-items/{itemId}/movements

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
| 404 | `NOT_FOUND` | Insumo de inventario no encontrado | Excepción explícita en src/modules/practice/services/practice-inventory.service.ts |
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

## 3. GET /practices

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Listar las prácticas activas del tenant
- **Operation ID:** `PracticesController_listPractices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.listPractices](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Listar las prácticas activas del tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `SURGERY_SCHEDULER`, `PERIOP_ADMIN`, `SURGEON`, `ANESTHESIOLOGIST`, `PERIOP_NURSE`, `SCHEDULING_ADMIN`, `PRACTITIONER`, `CLINICIAN`, `ACCOUNTING_APPROVER`.
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN, PRACTITIONER, CLINICIAN, ACCOUNTING_APPROVER. | Roles/tenant/guards de autorización |
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

## 4. POST /practices

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

## 5. POST /practices/{practiceId}/accreditations

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
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/practice/services/practice-accreditations.service.ts |
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

## 6. POST /practices/{practiceId}/healthcare-services

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Publicar un servicio de salud
- **Operation ID:** `PracticesController_publishHealthcareService`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.publishHealthcareService](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Publicar un servicio de salud. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


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
| `practiceSiteId` | No | `string` | formato `uuid` | Sitio donde se presta | `00000000-0000-4000-8000-000000000001` |
| `clinicalUnitId` | No | `string` | formato `uuid` | Unidad clínica que lo presta | `00000000-0000-4000-8000-000000000001` |
| `serviceConceptId` | No | `string` | formato `uuid` | Concepto de servicio | `00000000-0000-4000-8000-000000000001` |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La práctica no está activa | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
| 422 | `PRECONDITION_FAILED` | El sitio no pertenece a la práctica | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
| 422 | `PRECONDITION_FAILED` | La unidad clínica no existe | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
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

## 7. POST /practices/{practiceId}/inventory-items

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

## 8. POST /practices/{practiceId}/role-assignments

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
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La práctica no está activa | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
| 422 | `PRECONDITION_FAILED` | El sitio no pertenece a la práctica | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
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

## 9. PUT /practices/{practiceId}/settings/{settingKey}

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
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/practice/services/practice-settings.service.ts |
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

## 10. GET /practices/{practiceId}/sites

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Listar las sedes de una práctica
- **Operation ID:** `PracticesController_listSites`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.listSites](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Listar las sedes de una práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Sedes de una práctica.

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `SURGERY_SCHEDULER`, `PERIOP_ADMIN`, `SURGEON`, `ANESTHESIOLOGIST`, `PERIOP_NURSE`, `SCHEDULING_ADMIN`.
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, SURGERY_SCHEDULER, PERIOP_ADMIN, SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SCHEDULING_ADMIN. | Roles/tenant/guards de autorización |
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

## 11. POST /practices/{practiceId}/sites

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Dar de alta un sitio de práctica
- **Operation ID:** `PracticesController_createSite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.createSite](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Dar de alta un sitio de práctica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
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
| 404 | `NOT_FOUND` | Práctica no encontrada | Excepción explícita en src/modules/practice/services/practice-sites.service.ts |
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

## 12. DELETE /practices/{practiceId}/sites/{siteId}

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Desmantelar un sitio en cascada (soft-delete)
- **Operation ID:** `PracticesController_decommissionSite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PracticesController.decommissionSite](../../src/modules/practice/controllers/practices.controller.ts)

### Descripción de negocio

Desmantelar un sitio en cascada (soft-delete). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
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

## 13. GET /practitioners/{profileId}/sites

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
      "status": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PractitionerSiteDto>` | Sin restricción adicional declarada | Las sedes donde atiende, la principal primero. | `[{"id":"00000000-0000-4000-8000-000000000001","practiceId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","timeZone":"America/La_Paz","addressText":"Av. Brasil 1234, La Paz","status":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la sede. | `00000000-0000-4000-8000-000000000001` |
| `items[].practiceId` | Sí | `string` | formato `uuid` | Práctica a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código único dentro de la práctica. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Nombre de ejemplo` |
| `items[].timeZone` | No | `string` | admite null | Zona horaria IANA de la sede, si la declara. | `America/La_Paz` |
| `items[].addressText` | No | `string` | admite null | Dirección en una línea, o `null` si la sede no tiene ninguna cargada. | `Av. Brasil 1234, La Paz` |
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

## 14. POST /role-assignments/{roleId}/support-assignments

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
| 404 | `NOT_FOUND` | Rol de profesional no encontrado | Excepción explícita en src/modules/practice/services/practice-workforce.service.ts |
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

## 15. GET /sites/{siteId}/care-spaces

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

## 16. POST /sites/{siteId}/care-spaces

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Crear un espacio de atención bajo una unidad/sitio
- **Operation ID:** `SitesController_createCareSpace`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SitesController.createCareSpace](../../src/modules/practice/controllers/sites.controller.ts)

### Descripción de negocio

Crear un espacio de atención bajo una unidad/sitio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /sites/{siteId}/care-spaces` en `SitesController_createCareSpace`. El controlador delega en `ClinicalStructureService.createCareSpace`. Valida el body como `CreateCareSpaceDto` y consume `application/json`. El tipo de retorno estático es `Promise<CareSpaceResponseDto>`.

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `siteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `clinicalUnitId` | No | `string` | formato `uuid` | Unidad clínica (misma sede) | `00000000-0000-4000-8000-000000000001` |
| `parentSpaceId` | No | `string` | formato `uuid` | Espacio padre (misma sede) | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único dentro de la sede | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre del espacio | `Nombre de ejemplo` |
| `spaceTypeConceptId` | No | `string` | formato `uuid` | Concepto de tipo de espacio | `00000000-0000-4000-8000-000000000001` |
| `capacity` | No | `number` | mínimo 0 | Capacidad (nº de plazas) | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /sites/00000000-0000-4000-8000-000000000001/care-spaces HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "parentSpaceId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "spaceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "capacity": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CareSpaceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CareSpaceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CareSpaceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CareSpaceResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CareSpaceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CareSpaceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CareSpaceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CareSpaceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CareSpaceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CareSpaceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CareSpaceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
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
| `practiceSiteId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a practice site. | `00000000-0000-4000-8000-000000000001` |
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
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
| 409 | `CONFLICT` | Ya existe un espacio con ese código en el sitio | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El sitio no está activo | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
| 422 | `PRECONDITION_FAILED` | La unidad no pertenece al sitio | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
| 422 | `PRECONDITION_FAILED` | El espacio padre no pertenece al sitio | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
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

## 17. POST /sites/{siteId}/clinical-units

- **Módulo:** `practice`
- **Etiqueta OpenAPI:** `practice`
- **Nombre:** Crear una unidad clínica jerárquica
- **Operation ID:** `SitesController_createClinicalUnit`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SitesController.createClinicalUnit](../../src/modules/practice/controllers/sites.controller.ts)

### Descripción de negocio

Crear una unidad clínica jerárquica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sitio no encontrado | Excepción explícita en src/modules/practice/services/clinical-structure.service.ts |
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

