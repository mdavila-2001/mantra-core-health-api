<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `crm`

Referencia exhaustiva de 16 operación(es) del módulo `crm`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `crm`
- **Controladores:** `CrmController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /crm/accounts](#1-post-crm-accounts) — Crear una cuenta con su contacto principal
2. [GET /crm/accounts/{id}/360](#2-get-crm-accounts-id-360) — Vista 360 de la cuenta
3. [POST /crm/accounts/{id}/team-members](#3-post-crm-accounts-id-team-members) — Sumar un usuario al equipo de la cuenta
4. [POST /crm/activities](#4-post-crm-activities) — Registrar una actividad y su subtipo
5. [POST /crm/cases](#5-post-crm-cases) — Abrir un caso de servicio
6. [POST /crm/cases/{id}/comments](#6-post-crm-cases-id-comments) — Comentar el caso
7. [POST /crm/cases/{id}/resolve](#7-post-crm-cases-id-resolve) — Resolver el caso
8. [PATCH /crm/cases/{id}/status](#8-patch-crm-cases-id-status) — Transicionar el estado del caso
9. [PATCH /crm/contacts/{id}/channels/{cid}/opt-in](#9-patch-crm-contacts-id-channels-cid-opt-in) — Registrar el consentimiento del canal de contacto
10. [POST /crm/leads](#10-post-crm-leads) — Capturar un lead
11. [POST /crm/leads/{id}/convert](#11-post-crm-leads-id-convert) — Convertir el lead en oportunidad
12. [PATCH /crm/leads/{id}/qualify](#12-patch-crm-leads-id-qualify) — Calificar o descartar el lead
13. [POST /crm/opportunities/{id}/advance-stage](#13-post-crm-opportunities-id-advance-stage) — Avanzar la oportunidad de etapa
14. [POST /crm/opportunities/{id}/lose](#14-post-crm-opportunities-id-lose) — Marcar la oportunidad como perdida con su motivo
15. [POST /crm/opportunities/{id}/win](#15-post-crm-opportunities-id-win) — Marcar la oportunidad como ganada
16. [POST /crm/partnerships](#16-post-crm-partnerships) — Registrar una alianza y su acuerdo marco

---

## 1. POST /crm/accounts

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Crear una cuenta con su contacto principal
- **Operation ID:** `CrmController_createAccount`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.createAccount](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Crear una cuenta con su contacto principal. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /crm/accounts` en `CrmController_createAccount`. El controlador delega en `CrmSalesService.createAccount`. Valida el body como `CrmCreateAccountDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccountResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CrmCreateAccountDto`; los campos opcionales se omiten.

```http
POST /crm/accounts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "accountType": "CUSTOMER"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`, `CRM_AGENT`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `accountType` | Sí | `string` | valores: `CUSTOMER`, `PROSPECT`, `PARTNER` | Sin descripción específica en el contrato OpenAPI. | `CUSTOMER` |
| `website` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `taxId` | No | `string` | Sin restricción adicional declarada | Identificación fiscal | `00000000-0000-4000-8000-000000000001` |
| `parentAccountId` | No | `string` | formato `uuid` | Cuenta matriz | `00000000-0000-4000-8000-000000000001` |
| `primaryContactFirstName` | No | `string` | Sin restricción adicional declarada | Contacto principal a crear junto con la cuenta | `Nombre de ejemplo` |
| `primaryContactLastName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /crm/accounts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "accountType": "CUSTOMER",
  "website": "valor-ejemplo",
  "taxId": "00000000-0000-4000-8000-000000000001",
  "parentAccountId": "00000000-0000-4000-8000-000000000001",
  "primaryContactFirstName": "Nombre de ejemplo",
  "primaryContactLastName": "Nombre de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AccountResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccountResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccountResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "primaryContactId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `primaryContactId` | No | `string` | formato `uuid` | Contacto creado junto con la cuenta | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN, CRM_AGENT. | Roles/tenant/guards de autorización |
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
  "path": "/crm/accounts"
}
```

---

## 2. GET /crm/accounts/{id}/360

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Vista 360 de la cuenta
- **Operation ID:** `CrmController_getAccount360`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.getAccount360](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Se compone en caliente; en producción la servirá un read model materializado por el outbox.


### Descripción del sistema

NestJS resuelve `GET /crm/accounts/{id}/360` en `CrmController_getAccount360`. El controlador delega en `CrmServiceService.getAccount360`. No recibe body. El tipo de retorno estático es `Promise<Account360ResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /crm/accounts/00000000-0000-4000-8000-000000000001/360 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`, `CRM_AGENT`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /crm/accounts/00000000-0000-4000-8000-000000000001/360 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<Account360ResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<Account360ResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<Account360ResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<Account360ResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<Account360ResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<Account360ResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<Account360ResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `Account360ResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "accountId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "activityCount": 1,
  "caseCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `accountId` | Sí | `string` | formato `uuid` | Identificador asociado a account. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `activityCount` | Sí | `number` | Sin restricción adicional declarada | Actividades recientes | `1` |
| `caseCount` | Sí | `number` | Sin restricción adicional declarada | Casos abiertos y recientes | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN, CRM_AGENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cuenta no encontrada | Excepción explícita en src/modules/crm/services/crm-service.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/crm/accounts/{id}/360"
}
```

---

## 3. POST /crm/accounts/{id}/team-members

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Sumar un usuario al equipo de la cuenta
- **Operation ID:** `CrmController_addTeamMember`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.addTeamMember](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Sumar un usuario al equipo de la cuenta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /crm/accounts/{id}/team-members` en `CrmController_addTeamMember`. El controlador delega en `CrmSalesService.addTeamMember`. Valida el body como `AddTeamMemberDto` y consume `application/json`. El tipo de retorno estático es `Promise<TeamMemberResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddTeamMemberDto`; los campos opcionales se omiten.

```http
POST /crm/accounts/00000000-0000-4000-8000-000000000001/team-members HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001",
  "teamRole": "OWNER"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `teamRole` | Sí | `string` | valores: `OWNER`, `MEMBER` | Rol en el equipo de cuenta | `OWNER` |
| `accessLevel` | No | `string` | valores: `READ`, `WRITE` | Nivel de acceso | `READ` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /crm/accounts/00000000-0000-4000-8000-000000000001/team-members HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001",
  "teamRole": "OWNER",
  "accessLevel": "READ"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TeamMemberResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TeamMemberResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "procedureCaseId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "teamSize": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `procedureCaseId` | Sí | `string` | formato `uuid` | Identificador asociado a procedure case. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `teamSize` | Sí | `number` | Sin restricción adicional declarada | Miembros del equipo tras la asignación | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cuenta no encontrada | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
| 409 | `CONFLICT` | El usuario ya pertenece al equipo de la cuenta | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
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
  "path": "/crm/accounts/{id}/team-members"
}
```

---

## 4. POST /crm/activities

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Registrar una actividad y su subtipo
- **Operation ID:** `CrmController_createActivity`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.createActivity](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Las de tipo TASK y NOTE crean además su fila de subtipo.

Contexto declarado en el controlador: UC-49-05 y UC-49-06.

### Descripción del sistema

NestJS resuelve `POST /crm/activities` en `CrmController_createActivity`. El controlador delega en `CrmServiceService.createActivity`. Valida el body como `CreateActivityDto` y consume `application/json`. El tipo de retorno estático es `Promise<ActivityResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateActivityDto`; los campos opcionales se omiten.

```http
POST /crm/activities HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "activityType": "TASK",
  "subjectType": "ACCOUNT",
  "subjectRefId": "00000000-0000-4000-8000-000000000001",
  "direction": "INBOUND"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`, `CRM_AGENT`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `activityType` | Sí | `string` | valores: `TASK`, `EVENT`, `EMAIL`, `CALL`, `NOTE` | Sin descripción específica en el contrato OpenAPI. | `TASK` |
| `subjectType` | Sí | `string` | valores: `ACCOUNT`, `OPPORTUNITY`, `CASE` | Tipo del sujeto | `ACCOUNT` |
| `subjectRefId` | Sí | `string` | formato `uuid` | Id del sujeto | `00000000-0000-4000-8000-000000000001` |
| `direction` | Sí | `string` | valores: `INBOUND`, `OUTBOUND` | Sin descripción específica en el contrato OpenAPI. | `INBOUND` |
| `subject` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `bodyText` | No | `string` | longitud máxima 4000 | Cuerpo o detalle de la actividad | `valor-ejemplo` |
| `dueAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `crmAccountId` | No | `string` | formato `uuid` | Cuenta relacionada | `00000000-0000-4000-8000-000000000001` |
| `contactId` | No | `string` | formato `uuid` | Contacto relacionado | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /crm/activities HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "activityType": "TASK",
  "subjectType": "ACCOUNT",
  "subjectRefId": "00000000-0000-4000-8000-000000000001",
  "direction": "INBOUND",
  "subject": "valor-ejemplo",
  "bodyText": "valor-ejemplo",
  "dueAt": "2026-07-31T12:00:00.000Z",
  "crmAccountId": "00000000-0000-4000-8000-000000000001",
  "contactId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ActivityResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ActivityResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ActivityResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ActivityResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ActivityResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ActivityResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ActivityResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ActivityResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ActivityResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ActivityResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "activityType": "TASK",
  "subtypeCreated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `activityType` | Sí | `string` | valores: `TASK`, `EVENT`, `EMAIL`, `CALL`, `NOTE` | Valor de activity type mantenido por la instancia. | `TASK` |
| `subtypeCreated` | Sí | `boolean` | Sin restricción adicional declarada | true si además se creó la fila del subtipo (tarea o nota) | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN, CRM_AGENT. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una nota requiere `bodyText` | Excepción explícita en src/modules/crm/services/crm-service.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/crm/activities"
}
```

---

## 5. POST /crm/cases

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Abrir un caso de servicio
- **Operation ID:** `CrmController_createCase`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.createCase](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Abrir un caso de servicio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /crm/cases` en `CrmController_createCase`. El controlador delega en `CrmServiceService.createCase`. Valida el body como `CreateCaseDto` y consume `application/json`. El tipo de retorno estático es `Promise<CaseResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCaseDto`; los campos opcionales se omiten.

```http
POST /crm/cases HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "caseNumber": "valor-ejemplo",
  "subject": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`, `CRM_AGENT`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `caseNumber` | Sí | `string` | longitud máxima 100 | Número de caso, único por tenant | `valor-ejemplo` |
| `subject` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | No | `string` | longitud máxima 4000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `crmAccountId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `primaryContactId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `priority` | No | `string` | valores: `LOW`, `MEDIUM`, `HIGH` | Sin descripción específica en el contrato OpenAPI. | `MEDIUM` |
| `origin` | No | `string` | valores: `PORTAL`, `PHONE`, `EMAIL` | Sin descripción específica en el contrato OpenAPI. | `PORTAL` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /crm/cases HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "caseNumber": "valor-ejemplo",
  "subject": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "crmAccountId": "00000000-0000-4000-8000-000000000001",
  "primaryContactId": "00000000-0000-4000-8000-000000000001",
  "priority": "MEDIUM",
  "origin": "PORTAL"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CaseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CaseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "caseNumber": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "operatingRoomId": "00000000-0000-4000-8000-000000000001",
  "milestoneId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `caseNumber` | Sí | `string` | Sin restricción adicional declarada | Número del caso | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `operatingRoomId` | Sí | `string` | formato `uuid` | Quirófano reservado | `00000000-0000-4000-8000-000000000001` |
| `milestoneId` | Sí | `string` | formato `uuid` | Hito de programación creado | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN, CRM_AGENT. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un caso con ese número | Excepción explícita en src/modules/crm/services/crm-service.service.ts |
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
  "path": "/crm/cases"
}
```

---

## 6. POST /crm/cases/{id}/comments

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Comentar el caso
- **Operation ID:** `CrmController_addCaseComment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.addCaseComment](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Comentar el caso. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /crm/cases/{id}/comments` en `CrmController_addCaseComment`. El controlador delega en `CrmServiceService.addCaseComment`. Valida el body como `AddCaseCommentDto` y consume `application/json`. El tipo de retorno estático es `Promise<{ /** * Identificador único de la instancia. */ id: string; /** * Identificador asociado a case. */ caseId: string; }>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddCaseCommentDto`; los campos opcionales se omiten.

```http
POST /crm/cases/00000000-0000-4000-8000-000000000001/comments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "commentText": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`, `CRM_AGENT`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `commentText` | Sí | `string` | longitud máxima 4000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `isPublic` | No | `boolean` | Sin restricción adicional declarada | false para notas internas | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /crm/cases/00000000-0000-4000-8000-000000000001/comments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "commentText": "valor-ejemplo",
  "isPublic": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; /** * Identificador asociado a case. */ caseId: string; }>` | No |
| 400 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; /** * Identificador asociado a case. */ caseId: string; }>` | No |
| 401 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; /** * Identificador asociado a case. */ caseId: string; }>` | No |
| 403 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; /** * Identificador asociado a case. */ caseId: string; }>` | No |
| 404 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; /** * Identificador asociado a case. */ caseId: string; }>` | No |
| 409 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; /** * Identificador asociado a case. */ caseId: string; }>` | No |
| 413 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; /** * Identificador asociado a case. */ caseId: string; }>` | No |
| 422 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; /** * Identificador asociado a case. */ caseId: string; }>` | No |
| 429 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; /** * Identificador asociado a case. */ caseId: string; }>` | No |
| 500 | Operación completada correctamente. | `Promise<{ /** * Identificador único de la instancia. */ id: string; /** * Identificador asociado a case. */ caseId: string; }>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ /** * Identificador único de la instancia. */ id: string; /** * Identificador asociado a case. */ caseId: string; }`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "caseId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `caseId` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN, CRM_AGENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso no encontrado | Excepción explícita en src/modules/crm/services/crm-service.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No se comenta un caso cerrado | Excepción explícita en src/modules/crm/services/crm-service.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/crm/cases/{id}/comments"
}
```

---

## 7. POST /crm/cases/{id}/resolve

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Resolver el caso
- **Operation ID:** `CrmController_resolveCase`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.resolveCase](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Resolver el caso. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /crm/cases/{id}/resolve` en `CrmController_resolveCase`. El controlador delega en `CrmServiceService.changeCaseStatus`. No recibe body. El tipo de retorno estático es `Promise<CaseStatusResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /crm/cases/00000000-0000-4000-8000-000000000001/resolve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`, `CRM_AGENT`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /crm/cases/00000000-0000-4000-8000-000000000001/resolve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CaseStatusResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "caseId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "closedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `caseId` | Sí | `string` | formato `uuid` | Identificador asociado a case. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `closedAt` | No | `string` | formato `date-time` | Valor de closed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN, CRM_AGENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso no encontrado | Excepción explícita en src/modules/crm/services/crm-service.service.ts |
| 409 | `CONFLICT` | Un caso cerrado no se reabre por esta vía | Excepción explícita en src/modules/crm/services/crm-service.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso ya está en ese estado | Excepción explícita en src/modules/crm/services/crm-service.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/crm/cases/{id}/resolve"
}
```

---

## 8. PATCH /crm/cases/{id}/status

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Transicionar el estado del caso
- **Operation ID:** `CrmController_changeCaseStatus`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.changeCaseStatus](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Transicionar el estado del caso. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /crm/cases/{id}/status` en `CrmController_changeCaseStatus`. El controlador delega en `CrmServiceService.changeCaseStatus`. Valida el body como `ChangeCaseStatusDto` y consume `application/json`. El tipo de retorno estático es `Promise<CaseStatusResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ChangeCaseStatusDto`; los campos opcionales se omiten.

```http
PATCH /crm/cases/00000000-0000-4000-8000-000000000001/status HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "OPEN"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`, `CRM_AGENT`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` | Sin descripción específica en el contrato OpenAPI. | `OPEN` |
| `reasonText` | No | `string` | longitud máxima 500 | Motivo de la transición | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /crm/cases/00000000-0000-4000-8000-000000000001/status HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "OPEN",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CaseStatusResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CaseStatusResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "caseId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "closedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `caseId` | Sí | `string` | formato `uuid` | Identificador asociado a case. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `closedAt` | No | `string` | formato `date-time` | Valor de closed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN, CRM_AGENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso no encontrado | Excepción explícita en src/modules/crm/services/crm-service.service.ts |
| 409 | `CONFLICT` | Un caso cerrado no se reabre por esta vía | Excepción explícita en src/modules/crm/services/crm-service.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso ya está en ese estado | Excepción explícita en src/modules/crm/services/crm-service.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/crm/cases/{id}/status"
}
```

---

## 9. PATCH /crm/contacts/{id}/channels/{cid}/opt-in

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Registrar el consentimiento del canal de contacto
- **Operation ID:** `CrmController_setChannelOptIn`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.setChannelOptIn](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Revocar activa `do_not_contact`, que marketing respeta antes de enviar.


### Descripción del sistema

NestJS resuelve `PATCH /crm/contacts/{id}/channels/{cid}/opt-in` en `CrmController_setChannelOptIn`. El controlador delega en `CrmServiceService.setChannelOptIn`. Valida el body como `ChannelOptInDto` y consume `application/json`. El tipo de retorno estático es `Promise<ChannelOptInResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cid` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ChannelOptInDto`; los campos opcionales se omiten.

```http
PATCH /crm/contacts/00000000-0000-4000-8000-000000000001/channels/00000000-0000-4000-8000-000000000001/opt-in HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "optIn": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`, `CRM_AGENT`.
- Deben ser UUID válidos: `id`, `cid`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `optIn` | Sí | `boolean` | Sin restricción adicional declarada | true concede el consentimiento; false lo revoca | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /crm/contacts/00000000-0000-4000-8000-000000000001/channels/00000000-0000-4000-8000-000000000001/opt-in HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "optIn": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ChannelOptInResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ChannelOptInResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ChannelOptInResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ChannelOptInResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ChannelOptInResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ChannelOptInResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ChannelOptInResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ChannelOptInResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ChannelOptInResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ChannelOptInResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ChannelOptInResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "endpointId": "00000000-0000-4000-8000-000000000001",
  "doNotContact": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `endpointId` | Sí | `string` | formato `uuid` | Identificador asociado a endpoint. | `00000000-0000-4000-8000-000000000001` |
| `doNotContact` | Sí | `boolean` | Sin restricción adicional declarada | true cuando el canal quedó excluido de comunicaciones | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN, CRM_AGENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contacto no encontrado | Excepción explícita en src/modules/crm/services/crm-service.service.ts |
| 404 | `NOT_FOUND` | Canal de contacto no encontrado | Excepción explícita en src/modules/crm/services/crm-service.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El canal no pertenece a ese contacto | Excepción explícita en src/modules/crm/services/crm-service.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/crm/contacts/{id}/channels/{cid}/opt-in"
}
```

---

## 10. POST /crm/leads

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Capturar un lead
- **Operation ID:** `CrmController_createLead`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.createLead](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Capturar un lead. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /crm/leads` en `CrmController_createLead`. El controlador delega en `CrmSalesService.createLead`. Valida el body como `CreateLeadDto` y consume `application/json`. El tipo de retorno estático es `Promise<LeadResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateLeadDto`; los campos opcionales se omiten.

```http
POST /crm/leads HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "source": "WEB"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`, `CRM_AGENT`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `source` | Sí | `string` | valores: `WEB`, `REFERRAL`, `CAMPAIGN` | Sin descripción específica en el contrato OpenAPI. | `WEB` |
| `fullName` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `email` | No | `string` | longitud máxima 320 | Sin descripción específica en el contrato OpenAPI. | `usuario@example.com` |
| `phone` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `+59170000000` |
| `interestText` | No | `string` | longitud máxima 1000 | Interés declarado | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /crm/leads HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "source": "WEB",
  "fullName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "phone": "+59170000000",
  "interestText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<LeadResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LeadResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "leadStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "leadScore": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `leadStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a lead status concept. | `00000000-0000-4000-8000-000000000001` |
| `leadScore` | No | `number` | Sin restricción adicional declarada | Valor de lead score mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN, CRM_AGENT. | Roles/tenant/guards de autorización |
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
  "path": "/crm/leads"
}
```

---

## 11. POST /crm/leads/{id}/convert

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Convertir el lead en oportunidad
- **Operation ID:** `CrmController_convertLead`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.convertLead](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Convertir el lead en oportunidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /crm/leads/{id}/convert` en `CrmController_convertLead`. El controlador delega en `CrmSalesService.convertLead`. Valida el body como `ConvertLeadDto` y consume `application/json`. El tipo de retorno estático es `Promise<ConvertLeadResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ConvertLeadDto`; los campos opcionales se omiten.

```http
POST /crm/leads/00000000-0000-4000-8000-000000000001/convert HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pipelineId": "00000000-0000-4000-8000-000000000001",
  "stageId": "00000000-0000-4000-8000-000000000001",
  "opportunityName": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`, `CRM_AGENT`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `pipelineId` | Sí | `string` | formato `uuid` | Pipeline en el que nace la oportunidad | `00000000-0000-4000-8000-000000000001` |
| `stageId` | Sí | `string` | formato `uuid` | Etapa inicial | `00000000-0000-4000-8000-000000000001` |
| `opportunityName` | Sí | `string` | longitud máxima 200 | Nombre de la oportunidad | `Nombre de ejemplo` |
| `crmAccountId` | No | `string` | formato `uuid` | Cuenta a la que se asocia | `00000000-0000-4000-8000-000000000001` |
| `amount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `15000.00` |
| `expectedCloseDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /crm/leads/00000000-0000-4000-8000-000000000001/convert HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pipelineId": "00000000-0000-4000-8000-000000000001",
  "stageId": "00000000-0000-4000-8000-000000000001",
  "opportunityName": "Nombre de ejemplo",
  "crmAccountId": "00000000-0000-4000-8000-000000000001",
  "amount": "15000.00",
  "expectedCloseDate": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ConvertLeadResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ConvertLeadResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ConvertLeadResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ConvertLeadResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ConvertLeadResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ConvertLeadResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ConvertLeadResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ConvertLeadResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ConvertLeadResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ConvertLeadResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConvertLeadResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "leadId": "00000000-0000-4000-8000-000000000001",
  "opportunityId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `leadId` | Sí | `string` | formato `uuid` | Identificador asociado a lead. | `00000000-0000-4000-8000-000000000001` |
| `opportunityId` | Sí | `string` | formato `uuid` | Identificador asociado a opportunity. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN, CRM_AGENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Lead no encontrado | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
| 409 | `CONFLICT` | El lead ya fue convertido | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo se convierte un lead calificado | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/crm/leads/{id}/convert"
}
```

---

## 12. PATCH /crm/leads/{id}/qualify

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Calificar o descartar el lead
- **Operation ID:** `CrmController_qualifyLead`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.qualifyLead](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Calificar o descartar el lead. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /crm/leads/{id}/qualify` en `CrmController_qualifyLead`. El controlador delega en `CrmSalesService.qualifyLead`. Valida el body como `QualifyLeadDto` y consume `application/json`. El tipo de retorno estático es `Promise<LeadResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `QualifyLeadDto`; los campos opcionales se omiten.

```http
PATCH /crm/leads/00000000-0000-4000-8000-000000000001/qualify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "leadScore": 1,
  "qualified": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`, `CRM_AGENT`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `leadScore` | Sí | `number` | mínimo 0; máximo 100 | Puntuación del lead (0-100) | `1` |
| `qualified` | Sí | `boolean` | Sin restricción adicional declarada | true si el lead queda calificado; false lo descarta | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /crm/leads/00000000-0000-4000-8000-000000000001/qualify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "leadScore": 1,
  "qualified": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LeadResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LeadResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "leadStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "leadScore": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `leadStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a lead status concept. | `00000000-0000-4000-8000-000000000001` |
| `leadScore` | No | `number` | Sin restricción adicional declarada | Valor de lead score mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN, CRM_AGENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Lead no encontrado | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
| 409 | `CONFLICT` | El lead ya fue convertido | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
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
  "path": "/crm/leads/{id}/qualify"
}
```

---

## 13. POST /crm/opportunities/{id}/advance-stage

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Avanzar la oportunidad de etapa
- **Operation ID:** `CrmController_advanceStage`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.advanceStage](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Avanzar la oportunidad de etapa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /crm/opportunities/{id}/advance-stage` en `CrmController_advanceStage`. El controlador delega en `CrmSalesService.advanceStage`. Valida el body como `AdvanceStageDto` y consume `application/json`. El tipo de retorno estático es `Promise<OpportunityResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AdvanceStageDto`; los campos opcionales se omiten.

```http
POST /crm/opportunities/00000000-0000-4000-8000-000000000001/advance-stage HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "toStageId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`, `CRM_AGENT`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `toStageId` | Sí | `string` | formato `uuid` | Etapa destino | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /crm/opportunities/00000000-0000-4000-8000-000000000001/advance-stage HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "toStageId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OpportunityResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "stageId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `stageId` | Sí | `string` | formato `uuid` | Identificador asociado a stage. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN, CRM_AGENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Oportunidad no encontrada | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
| 404 | `NOT_FOUND` | Etapa no encontrada | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La oportunidad ya está cerrada | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
| 422 | `PRECONDITION_FAILED` | La oportunidad ya está en esa etapa | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/crm/opportunities/{id}/advance-stage"
}
```

---

## 14. POST /crm/opportunities/{id}/lose

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Marcar la oportunidad como perdida con su motivo
- **Operation ID:** `CrmController_loseOpportunity`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.loseOpportunity](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Marcar la oportunidad como perdida con su motivo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /crm/opportunities/{id}/lose` en `CrmController_loseOpportunity`. El controlador delega en `CrmSalesService.loseOpportunity`. Valida el body como `LoseOpportunityDto` y consume `application/json`. El tipo de retorno estático es `Promise<OpportunityResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LoseOpportunityDto`; los campos opcionales se omiten.

```http
POST /crm/opportunities/00000000-0000-4000-8000-000000000001/lose HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "PRICE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`, `CRM_AGENT`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | valores: `PRICE`, `COMPETITOR`, `NO_BUDGET` | Motivo de la pérdida | `PRICE` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /crm/opportunities/00000000-0000-4000-8000-000000000001/lose HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "PRICE"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OpportunityResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "stageId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `stageId` | Sí | `string` | formato `uuid` | Identificador asociado a stage. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN, CRM_AGENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Oportunidad no encontrada | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
| 409 | `CONFLICT` | La oportunidad ya está cerrada | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
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
  "path": "/crm/opportunities/{id}/lose"
}
```

---

## 15. POST /crm/opportunities/{id}/win

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Marcar la oportunidad como ganada
- **Operation ID:** `CrmController_winOpportunity`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.winOpportunity](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Marcar la oportunidad como ganada. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /crm/opportunities/{id}/win` en `CrmController_winOpportunity`. El controlador delega en `CrmSalesService.winOpportunity`. No recibe body. El tipo de retorno estático es `Promise<OpportunityResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /crm/opportunities/00000000-0000-4000-8000-000000000001/win HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`, `CRM_AGENT`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /crm/opportunities/00000000-0000-4000-8000-000000000001/win HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OpportunityResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OpportunityResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "stageId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `stageId` | Sí | `string` | formato `uuid` | Identificador asociado a stage. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN, CRM_AGENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Oportunidad no encontrada | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
| 409 | `CONFLICT` | La oportunidad ya está cerrada | Excepción explícita en src/modules/crm/services/crm-sales.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/crm/opportunities/{id}/win"
}
```

---

## 16. POST /crm/partnerships

- **Módulo:** `crm`
- **Etiqueta OpenAPI:** `crm`
- **Nombre:** Registrar una alianza y su acuerdo marco
- **Operation ID:** `CrmController_createPartnership`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrmController.createPartnership](../../src/modules/crm/controllers/crm.controller.ts)

### Descripción de negocio

Registrar una alianza y su acuerdo marco. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /crm/partnerships` en `CrmController_createPartnership`. El controlador delega en `CrmServiceService.createPartnership`. Valida el body como `CreatePartnershipDto` y consume `application/json`. El tipo de retorno estático es `Promise<PartnershipResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePartnershipDto`; los campos opcionales se omiten.

```http
POST /crm/partnerships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "partnershipType": "REFERRAL",
  "partnerRefType": "valor-ejemplo",
  "partnerRefId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CRM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `partnershipType` | Sí | `string` | valores: `REFERRAL`, `RESELLER` | Sin descripción específica en el contrato OpenAPI. | `REFERRAL` |
| `partnerRefType` | Sí | `string` | longitud máxima 100 | Tipo de la entidad socia | `valor-ejemplo` |
| `partnerRefId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `revenueSharePercent` | No | `string` | Sin restricción adicional declarada | Reparto de ingresos | `15.00` |
| `commitmentAmount` | No | `string` | Sin restricción adicional declarada | Importe comprometido del acuerdo marco | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /crm/partnerships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "partnershipType": "REFERRAL",
  "partnerRefType": "valor-ejemplo",
  "partnerRefId": "00000000-0000-4000-8000-000000000001",
  "revenueSharePercent": "15.00",
  "commitmentAmount": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PartnershipResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PartnershipResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PartnershipResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PartnershipResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PartnershipResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PartnershipResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PartnershipResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PartnershipResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PartnershipResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PartnershipResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "agreementId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `agreementId` | No | `string` | formato `uuid` | Acuerdo marco creado junto con la alianza | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CRM_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/crm/partnerships"
}
```

---

