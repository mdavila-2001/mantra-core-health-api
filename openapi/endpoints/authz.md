<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `authz`

Referencia exhaustiva de 24 operación(es) del módulo `authz`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `authz-care-relationships`, `authz-catalog`, `authz-clinical`, `authz-grants`, `authz-pdp`, `authz-policies`, `authz-roles`
- **Controladores:** `AuthzCareRelationshipsController`, `AuthzCatalogController`, `AuthzClinicalController`, `AuthzGrantsController`, `AuthzPdpController`, `AuthzPoliciesController`, `AuthzRolesController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /authz/care-relationships](#1-get-authz-care-relationships) — Listar relaciones asistenciales de un paciente
2. [POST /authz/care-relationships](#2-post-authz-care-relationships) — Establecer una relación asistencial
3. [POST /authz/care-relationships/{id}/respond](#3-post-authz-care-relationships-id-respond) — Responder (aceptar/rechazar) una solicitud de relación asistencial
4. [POST /authz/care-relationships/{id}/revoke](#4-post-authz-care-relationships-id-revoke) — Revocar o expirar una relación asistencial
5. [POST /authz/care-relationships/request](#5-post-authz-care-relationships-request) — Solicitar autorización del paciente para una relación asistencial
6. [GET /authz/care-relationships/requests/mine](#6-get-authz-care-relationships-requests-mine) — Mis solicitudes de relación asistencial pendientes de decidir
7. [DELETE /authz/clinical-access-grants/{grantId}](#7-delete-authz-clinical-access-grants-grantid) — Revocar o expirar una concesión de acceso clínico
8. [POST /authz/decisions/evaluate](#8-post-authz-decisions-evaluate) — Recalcular la decisión de autorización efectiva (PDP)
9. [GET /authz/legal-representations](#9-get-authz-legal-representations) — Listar representaciones legales de un paciente
10. [POST /authz/legal-representations](#10-post-authz-legal-representations) — Registrar una representación legal del paciente
11. [POST /authz/legal-representations/{id}/revoke](#11-post-authz-legal-representations-id-revoke) — Revocar o expirar una representación legal
12. [POST /authz/patients/{patientProfileId}/break-the-glass](#12-post-authz-patients-patientprofileid-break-the-glass) — Break-the-glass / anulación de emergencia
13. [POST /authz/patients/{patientProfileId}/clinical-access-grants](#13-post-authz-patients-patientprofileid-clinical-access-grants) — Otorgar acceso clínico con propósito de uso
14. [POST /authz/pdp/cache/invalidate](#14-post-authz-pdp-cache-invalidate) — Invalidar la cache de decisiones del PDP
15. [POST /authz/permission-categories](#15-post-authz-permission-categories) — Definir una categoría de permiso
16. [POST /authz/permissions](#16-post-authz-permissions) — Definir un permiso del catálogo global
17. [POST /authz/resource-scope-grants](#17-post-authz-resource-scope-grants) — Otorgar acceso a un recurso específico (grant polimórfico)
18. [GET /authz/roles](#18-get-authz-roles) — Listar los roles asignables
19. [POST /authz/roles](#19-post-authz-roles) — Componer un rol (con herencia opcional)
20. [PUT /authz/roles/{roleId}/field-permissions](#20-put-authz-roles-roleid-field-permissions) — Configurar el enmascaramiento de campos del rol
21. [PUT /authz/roles/{roleId}/permissions](#21-put-authz-roles-roleid-permissions) — Asignar permisos al rol (reemplaza los activos)
22. [POST /authz/tenants/{tenantId}/access-policies](#22-post-authz-tenants-tenantid-access-policies) — Definir una política de acceso ABAC con enmascaramiento
23. [POST /authz/users/{userId}/permission-grants](#23-post-authz-users-userid-permission-grants) — Otorgar una excepción de permiso por usuario
24. [POST /authz/users/{userId}/role-assignments](#24-post-authz-users-userid-role-assignments) — Asignar un rol a un usuario con vigencia y ámbito

---

## 1. GET /authz/care-relationships

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-care-relationships`
- **Nombre:** Listar relaciones asistenciales de un paciente
- **Operation ID:** `AuthzCareRelationshipsController_listCareRelationships`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzCareRelationshipsController.listCareRelationships](../../src/modules/authz/controllers/authz-care-relationships.controller.ts)

### Descripción de negocio

Listar relaciones asistenciales de un paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Obtiene list care relationships.

### Descripción del sistema

NestJS resuelve `GET /authz/care-relationships` en `AuthzCareRelationshipsController_listCareRelationships`. El controlador delega en `AuthzCareRelationshipsService.listCareRelationshipsByPatient`. No recibe body. El tipo de retorno estático es `Promise<CareRelationshipView[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | query | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | query | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/care-relationships?tenantId=00000000-0000-4000-8000-000000000001&patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /authz/care-relationships?tenantId=00000000-0000-4000-8000-000000000001&patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CareRelationshipView[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<CareRelationshipView[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<CareRelationshipView[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<CareRelationshipView[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<CareRelationshipView[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<CareRelationshipView[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CareRelationshipView[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "patientProfileId": "00000000-0000-4000-8000-000000000001",
    "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
    "relationshipTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "purposeConceptId": "00000000-0000-4000-8000-000000000001",
    "validFrom": "2026-07-31T12:00:00.000Z",
    "validTo": "2026-07-31T12:00:00.000Z"
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/care-relationships"
}
```

---

## 2. POST /authz/care-relationships

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-care-relationships`
- **Nombre:** Establecer una relación asistencial
- **Operation ID:** `AuthzCareRelationshipsController_establishCareRelationship`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzCareRelationshipsController.establishCareRelationship](../../src/modules/authz/controllers/authz-care-relationships.controller.ts)

### Descripción de negocio

Establecer una relación asistencial. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación establish care relationship.

### Descripción del sistema

NestJS resuelve `POST /authz/care-relationships` en `AuthzCareRelationshipsController_establishCareRelationship`. El controlador delega en `AuthzCareRelationshipsService.establishCareRelationship`. Valida el body como `CreateCareRelationshipDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzIdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCareRelationshipDto`; los campos opcionales se omiten.

```http
POST /authz/care-relationships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "TREATING"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Tenant de la relación | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Perfil del paciente | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | Sí | `string` | formato `uuid` | Perfil del practicante | `00000000-0000-4000-8000-000000000001` |
| `relationshipType` | Sí | `string` | valores: `TREATING`, `CONSULTING`, `EMERGENCY` | Tipo de relación | `TREATING` |
| `purposeOfUse` | No | `string` | valores: `TREATMENT`, `PAYMENT`, `OPERATIONS`, `EMERGENCY` | Propósito de uso que acota la relación | `TREATMENT` |
| `validFrom` | No | `string` | formato `date-time` | Inicio de vigencia (por defecto ahora) | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Fin de vigencia (abierto si se omite) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/care-relationships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "TREATING",
  "purposeOfUse": "TREATMENT",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzIdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una relación asistencial activa para ese practicante | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | validTo debe ser posterior a validFrom | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/care-relationships"
}
```

---

## 3. POST /authz/care-relationships/{id}/respond

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-care-relationships`
- **Nombre:** Responder (aceptar/rechazar) una solicitud de relación asistencial
- **Operation ID:** `AuthzCareRelationshipsController_respondToCareRelationshipRequest`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzCareRelationshipsController.respondToCareRelationshipRequest](../../src/modules/authz/controllers/authz-care-relationships.controller.ts)

### Descripción de negocio

Responder (aceptar/rechazar) una solicitud de relación asistencial. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: FT-07-R06/R07: sólo el paciente titular de la solicitud puede responderla. `ACCEPT` la activa (con las especialidades que declare autorizar); `REJECT` la cierra sin conceder acceso. Ambas quedan auditadas.

### Descripción del sistema

NestJS resuelve `POST /authz/care-relationships/{id}/respond` en `AuthzCareRelationshipsController_respondToCareRelationshipRequest`. El controlador delega en `AuthzCareRelationshipsService.respondToCareRelationshipRequest`. Valida el body como `RespondCareRelationshipDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzStatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RespondCareRelationshipDto`; los campos opcionales se omiten.

```http
POST /authz/care-relationships/00000000-0000-4000-8000-000000000001/respond HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "ACCEPT"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `ACCEPT`, `REJECT` | Decisión sobre la solicitud | `ACCEPT` |
| `authorizedSpecialtyConceptIds` | No | `array<string>` | formato `uuid`; máximo 50 elemento(s) | Concept ids de especialidad/área que el paciente autoriza (solo con ACCEPT) | `["valor-ejemplo"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/care-relationships/00000000-0000-4000-8000-000000000001/respond HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "ACCEPT",
  "authorizedSpecialtyConceptIds": [
    "valor-ejemplo"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzStatusResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true,
  "affected": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |
| `affected` | No | `number` | Sin restricción adicional declarada | Nº de filas afectadas cuando aplica | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo el paciente titular puede responder esta solicitud | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 422 | `PRECONDITION_FAILED` | La solicitud ya fue respondida o ya no está pendiente | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/care-relationships/{id}/respond"
}
```

---

## 4. POST /authz/care-relationships/{id}/revoke

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-care-relationships`
- **Nombre:** Revocar o expirar una relación asistencial
- **Operation ID:** `AuthzCareRelationshipsController_revokeCareRelationship`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzCareRelationshipsController.revokeCareRelationship](../../src/modules/authz/controllers/authz-care-relationships.controller.ts)

### Descripción de negocio

Revocar o expirar una relación asistencial. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Elimina o desactiva revoke care relationship.

### Descripción del sistema

NestJS resuelve `POST /authz/care-relationships/{id}/revoke` en `AuthzCareRelationshipsController_revokeCareRelationship`. El controlador delega en `AuthzCareRelationshipsService.revokeCareRelationship`. No recibe body. El tipo de retorno estático es `Promise<AuthzStatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /authz/care-relationships/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /authz/care-relationships/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzStatusResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true,
  "affected": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |
| `affected` | No | `number` | Sin restricción adicional declarada | Nº de filas afectadas cuando aplica | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Relación asistencial no encontrada | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 422 | `PRECONDITION_FAILED` | La relación asistencial no está activa | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/care-relationships/{id}/revoke"
}
```

---

## 5. POST /authz/care-relationships/request

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-care-relationships`
- **Nombre:** Solicitar autorización del paciente para una relación asistencial
- **Operation ID:** `AuthzCareRelationshipsController_requestCareRelationship`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzCareRelationshipsController.requestCareRelationship](../../src/modules/authz/controllers/authz-care-relationships.controller.ts)

### Descripción de negocio

Solicitar autorización del paciente para una relación asistencial. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: FT-07-R05: un practicante que encontró al paciente por búsqueda pide su autorización — la relación nace `PENDING` y no concede ningún acceso hasta que el paciente responda.

### Descripción del sistema

NestJS resuelve `POST /authz/care-relationships/request` en `AuthzCareRelationshipsController_requestCareRelationship`. El controlador delega en `AuthzCareRelationshipsService.requestCareRelationship`. Valida el body como `RequestCareRelationshipDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzIdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RequestCareRelationshipDto`; los campos opcionales se omiten.

```http
POST /authz/care-relationships/request HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Tenant de la solicitud | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Perfil del paciente | `00000000-0000-4000-8000-000000000001` |
| `relationshipType` | No | `string` | valores: `TREATING`, `CONSULTING`, `EMERGENCY` | Tipo de relación solicitada | `TREATING` |
| `reasonText` | No | `string` | longitud máxima 1000 | Motivo de la solicitud | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/care-relationships/request HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "TREATING",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzIdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 409 | `CONFLICT` | Ya existe una relación asistencial activa con ese paciente | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 409 | `CONFLICT` | Ya hay una solicitud pendiente de respuesta para ese paciente | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo un practicante con perfil propio puede solicitar acceso a un expediente | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay canal in-app activo: falta correr el seed de mensajería | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal in-app no tiene configuración de proveedor activa | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/care-relationships/request"
}
```

---

## 6. GET /authz/care-relationships/requests/mine

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-care-relationships`
- **Nombre:** Mis solicitudes de relación asistencial pendientes de decidir
- **Operation ID:** `AuthzCareRelationshipsController_listMyPendingCareRelationshipRequests`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzCareRelationshipsController.listMyPendingCareRelationshipRequests](../../src/modules/authz/controllers/authz-care-relationships.controller.ts)

### Descripción de negocio

Mis solicitudes de relación asistencial pendientes de decidir. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: FT-07-R06: la bandeja del paciente — sus solicitudes de vínculo que siguen `PENDING`. El sujeto sale de la sesión, no de la ruta.

### Descripción del sistema

NestJS resuelve `GET /authz/care-relationships/requests/mine` en `AuthzCareRelationshipsController_listMyPendingCareRelationshipRequests`. El controlador delega en `AuthzCareRelationshipsService.listMyPendingCareRelationshipRequests`. No recibe body. El tipo de retorno estático es `Promise<CareRelationshipView[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/care-relationships/requests/mine HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /authz/care-relationships/requests/mine HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CareRelationshipView[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<CareRelationshipView[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<CareRelationshipView[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<CareRelationshipView[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<CareRelationshipView[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<CareRelationshipView[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CareRelationshipView[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "patientProfileId": "00000000-0000-4000-8000-000000000001",
    "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
    "relationshipTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "purposeConceptId": "00000000-0000-4000-8000-000000000001",
    "validFrom": "2026-07-31T12:00:00.000Z",
    "validTo": "2026-07-31T12:00:00.000Z"
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/care-relationships/requests/mine"
}
```

---

## 7. DELETE /authz/clinical-access-grants/{grantId}

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-clinical`
- **Nombre:** Revocar o expirar una concesión de acceso clínico
- **Operation ID:** `AuthzClinicalController_revokeClinicalAccess`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzClinicalController.revokeClinicalAccess](../../src/modules/authz/controllers/authz-clinical.controller.ts)

### Descripción de negocio

Revocar o expirar una concesión de acceso clínico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `DELETE /authz/clinical-access-grants/{grantId}` en `AuthzClinicalController_revokeClinicalAccess`. El controlador delega en `AuthzClinicalService.revokeClinicalAccess`. No recibe body. El tipo de retorno estático es `Promise<AuthzStatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `grantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /authz/clinical-access-grants/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICAL_APPROVER`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `grantId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /authz/clinical-access-grants/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzStatusResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true,
  "affected": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |
| `affected` | No | `number` | Sin restricción adicional declarada | Nº de filas afectadas cuando aplica | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICAL_APPROVER, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Acceso clínico no encontrado | Excepción explícita en src/modules/authz/services/authz-clinical.service.ts |
| 422 | `PRECONDITION_FAILED` | El acceso clínico no está activo | Excepción explícita en src/modules/authz/services/authz-clinical.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/clinical-access-grants/{grantId}"
}
```

---

## 8. POST /authz/decisions/evaluate

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-pdp`
- **Nombre:** Recalcular la decisión de autorización efectiva (PDP)
- **Operation ID:** `AuthzPdpController_evaluate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzPdpController.evaluate](../../src/modules/authz/controllers/authz-pdp.controller.ts)

### Descripción de negocio

Recalcular la decisión de autorización efectiva (PDP). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-06-12 (`/authz/decisions:evaluate` según spec).

### Descripción del sistema

NestJS resuelve `POST /authz/decisions/evaluate` en `AuthzPdpController_evaluate`. El controlador delega en `AuthzPdpService.evaluate`. Valida el body como `EvaluateDecisionDto` y consume `application/json`. El tipo de retorno estático es `Promise<DecisionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EvaluateDecisionDto`; los campos opcionales se omiten.

```http
POST /authz/decisions/evaluate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "action": "READ",
  "resource": "valor-ejemplo"
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
| `userId` | Sí | `string` | formato `uuid` | Usuario sujeto de la decisión | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Tenant de la evaluación | `00000000-0000-4000-8000-000000000001` |
| `action` | Sí | `string` | valores: `READ`, `WRITE`, `CREATE`, `DELETE`, `EXECUTE`, `APPROVE` | Acción evaluada | `READ` |
| `resource` | Sí | `string` | longitud mínima 1; longitud máxima 150 | Recurso protegido (debe casar con permissions.resource) | `valor-ejemplo` |
| `resourceType` | No | `string` | valores: `PATIENT`, `ENCOUNTER`, `DOCUMENT`, `RECORD` | Tipo de recurso concreto | `PATIENT` |
| `resourceId` | No | `string` | formato `uuid` | Id del recurso concreto | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Perfil de paciente si el recurso es clínico | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | No | `string` | formato `uuid` | Perfil de practicante del actor (habilita evaluación de relación asistencial C-06) | `00000000-0000-4000-8000-000000000001` |
| `purposeOfUse` | No | `string` | valores: `TREATMENT`, `PAYMENT`, `OPERATIONS`, `EMERGENCY` | Propósito de uso | `TREATMENT` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/decisions/evaluate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "action": "READ",
  "resource": "valor-ejemplo",
  "resourceType": "PATIENT",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "TREATMENT"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DecisionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DecisionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DecisionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DecisionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DecisionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DecisionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DecisionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DecisionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DecisionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DecisionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "decision": "PERMIT",
  "reason": "Texto descriptivo de ejemplo",
  "effectiveRoleIds": [
    "valor-ejemplo"
  ],
  "maskedFields": [
    {
      "entity": "valor-ejemplo",
      "columnName": "Nombre de ejemplo",
      "strategy": "valor-ejemplo"
    }
  ],
  "purposeOfUse": "valor-ejemplo",
  "cacheKey": "valor-ejemplo",
  "ttlSeconds": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `PERMIT`, `DENY` | Decisión: PERMIT o DENY | `PERMIT` |
| `reason` | Sí | `string` | Sin restricción adicional declarada | Motivo legible de la decisión | `Texto descriptivo de ejemplo` |
| `effectiveRoleIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de roles efectivos considerados | `["valor-ejemplo"]` |
| `maskedFields` | Sí | `array<MaskedFieldDto>` | Sin restricción adicional declarada | Campos a enmascarar en la respuesta | `[{"entity":"valor-ejemplo","columnName":"Nombre de ejemplo","strategy":"valor-ejemplo"}]` |
| `maskedFields[].entity` | Sí | `string` | Sin restricción adicional declarada | Valor de entity mantenido por la instancia. | `valor-ejemplo` |
| `maskedFields[].columnName` | Sí | `string` | Sin restricción adicional declarada | Valor de column name mantenido por la instancia. | `Nombre de ejemplo` |
| `maskedFields[].strategy` | Sí | `string` | Sin restricción adicional declarada | Estrategia (REDACT/HASH/PARTIAL/NULLIFY) o NO_READ | `valor-ejemplo` |
| `purposeOfUse` | No | `string` | Sin restricción adicional declarada | Propósito de uso registrado | `valor-ejemplo` |
| `cacheKey` | Sí | `string` | Sin restricción adicional declarada | Clave de cache de la decisión (idempotente) | `valor-ejemplo` |
| `ttlSeconds` | Sí | `number` | Sin restricción adicional declarada | TTL sugerido en segundos para la entrada de cache | `1` |

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
  "path": "/authz/decisions/evaluate"
}
```

---

## 9. GET /authz/legal-representations

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-care-relationships`
- **Nombre:** Listar representaciones legales de un paciente
- **Operation ID:** `AuthzCareRelationshipsController_listLegalRepresentations`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzCareRelationshipsController.listLegalRepresentations](../../src/modules/authz/controllers/authz-care-relationships.controller.ts)

### Descripción de negocio

Listar representaciones legales de un paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Obtiene list legal representations.

### Descripción del sistema

NestJS resuelve `GET /authz/legal-representations` en `AuthzCareRelationshipsController_listLegalRepresentations`. El controlador delega en `AuthzCareRelationshipsService.listLegalRepresentationsByPatient`. No recibe body. El tipo de retorno estático es `Promise<LegalRepresentationView[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | query | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | query | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/legal-representations?tenantId=00000000-0000-4000-8000-000000000001&patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /authz/legal-representations?tenantId=00000000-0000-4000-8000-000000000001&patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LegalRepresentationView[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<LegalRepresentationView[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<LegalRepresentationView[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<LegalRepresentationView[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<LegalRepresentationView[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<LegalRepresentationView[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LegalRepresentationView[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "patientProfileId": "00000000-0000-4000-8000-000000000001",
    "representativeUserId": "00000000-0000-4000-8000-000000000001",
    "representationTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "documentRef": "valor-ejemplo",
    "validFrom": "2026-07-31T12:00:00.000Z",
    "validTo": "2026-07-31T12:00:00.000Z"
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
  "path": "/authz/legal-representations"
}
```

---

## 10. POST /authz/legal-representations

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-care-relationships`
- **Nombre:** Registrar una representación legal del paciente
- **Operation ID:** `AuthzCareRelationshipsController_establishLegalRepresentation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzCareRelationshipsController.establishLegalRepresentation](../../src/modules/authz/controllers/authz-care-relationships.controller.ts)

### Descripción de negocio

Registrar una representación legal del paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación establish legal representation.

### Descripción del sistema

NestJS resuelve `POST /authz/legal-representations` en `AuthzCareRelationshipsController_establishLegalRepresentation`. El controlador delega en `AuthzCareRelationshipsService.establishLegalRepresentation`. Valida el body como `CreateLegalRepresentationDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzIdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateLegalRepresentationDto`; los campos opcionales se omiten.

```http
POST /authz/legal-representations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "representativeUserId": "00000000-0000-4000-8000-000000000001",
  "representationType": "LEGAL_GUARDIAN"
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant de la representación | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Perfil del paciente representado | `00000000-0000-4000-8000-000000000001` |
| `representativeUserId` | Sí | `string` | formato `uuid` | Usuario que representa al paciente | `00000000-0000-4000-8000-000000000001` |
| `representationType` | Sí | `string` | valores: `LEGAL_GUARDIAN`, `PARENT`, `ATTORNEY`, `CURATOR` | Tipo de representación | `LEGAL_GUARDIAN` |
| `documentRef` | No | `string` | longitud máxima 200 | Referencia documental que sustenta la representación | `valor-ejemplo` |
| `validFrom` | No | `string` | formato `date-time` | Inicio de vigencia (por defecto ahora) | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Fin de vigencia (abierto si se omite) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/legal-representations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "representativeUserId": "00000000-0000-4000-8000-000000000001",
  "representationType": "LEGAL_GUARDIAN",
  "documentRef": "valor-ejemplo",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzIdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una representación legal activa para ese usuario | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | validTo debe ser posterior a validFrom | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/legal-representations"
}
```

---

## 11. POST /authz/legal-representations/{id}/revoke

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-care-relationships`
- **Nombre:** Revocar o expirar una representación legal
- **Operation ID:** `AuthzCareRelationshipsController_revokeLegalRepresentation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzCareRelationshipsController.revokeLegalRepresentation](../../src/modules/authz/controllers/authz-care-relationships.controller.ts)

### Descripción de negocio

Revocar o expirar una representación legal. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Elimina o desactiva revoke legal representation.

### Descripción del sistema

NestJS resuelve `POST /authz/legal-representations/{id}/revoke` en `AuthzCareRelationshipsController_revokeLegalRepresentation`. El controlador delega en `AuthzCareRelationshipsService.revokeLegalRepresentation`. No recibe body. El tipo de retorno estático es `Promise<AuthzStatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /authz/legal-representations/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
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
POST /authz/legal-representations/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzStatusResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true,
  "affected": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |
| `affected` | No | `number` | Sin restricción adicional declarada | Nº de filas afectadas cuando aplica | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Representación legal no encontrada | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 422 | `PRECONDITION_FAILED` | La representación legal no está activa | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/legal-representations/{id}/revoke"
}
```

---

## 12. POST /authz/patients/{patientProfileId}/break-the-glass

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-clinical`
- **Nombre:** Break-the-glass / anulación de emergencia
- **Operation ID:** `AuthzClinicalController_breakTheGlass`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzClinicalController.breakTheGlass](../../src/modules/authz/controllers/authz-clinical.controller.ts)

### Descripción de negocio

Break-the-glass / anulación de emergencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-06-07 (emergencia; el clínico invocante queda registrado).

### Descripción del sistema

NestJS resuelve `POST /authz/patients/{patientProfileId}/break-the-glass` en `AuthzClinicalController_breakTheGlass`. El controlador delega en `AuthzClinicalService.breakTheGlass`. Valida el body como `BreakTheGlassDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzIdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BreakTheGlassDto`; los campos opcionales se omiten.

```http
POST /authz/patients/00000000-0000-4000-8000-000000000001/break-the-glass HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "justification": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICAL_APPROVER`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `patientProfileId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Tenant del acceso de emergencia | `00000000-0000-4000-8000-000000000001` |
| `justification` | Sí | `string` | longitud mínima 10; longitud máxima 1000 | Justificación textual obligatoria | `valor-ejemplo` |
| `windowMinutes` | No | `number` | mínimo 5; máximo 240 | Ventana de acceso en minutos (corta; por defecto 60, máx 240) | `5` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro clínico asociado | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/patients/00000000-0000-4000-8000-000000000001/break-the-glass HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "justification": "valor-ejemplo",
  "windowMinutes": 5,
  "encounterId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzIdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICAL_APPROVER, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/authz/patients/{patientProfileId}/break-the-glass"
}
```

---

## 13. POST /authz/patients/{patientProfileId}/clinical-access-grants

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-clinical`
- **Nombre:** Otorgar acceso clínico con propósito de uso
- **Operation ID:** `AuthzClinicalController_grantClinicalAccess`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzClinicalController.grantClinicalAccess](../../src/modules/authz/controllers/authz-clinical.controller.ts)

### Descripción de negocio

Otorgar acceso clínico con propósito de uso. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-06-06 (clínico tratante o paciente que autoriza; autenticado).

### Descripción del sistema

NestJS resuelve `POST /authz/patients/{patientProfileId}/clinical-access-grants` en `AuthzClinicalController_grantClinicalAccess`. El controlador delega en `AuthzClinicalService.grantClinicalAccess`. Valida el body como `CreateClinicalAccessGrantDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzIdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateClinicalAccessGrantDto`; los campos opcionales se omiten.

```http
POST /authz/patients/00000000-0000-4000-8000-000000000001/clinical-access-grants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "grantedUserId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "TREATMENT",
  "accessLevel": "READ",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICAL_APPROVER`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `patientProfileId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `grantedUserId` | Sí | `string` | formato `uuid` | Usuario que recibe el acceso | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Tenant del acceso | `00000000-0000-4000-8000-000000000001` |
| `purposeOfUse` | Sí | `string` | valores: `TREATMENT`, `PAYMENT`, `OPERATIONS` | Propósito de uso | `TREATMENT` |
| `accessLevel` | Sí | `string` | valores: `READ`, `WRITE`, `FULL` | Nivel de acceso | `READ` |
| `validTo` | Sí | `string` | formato `date-time` | Fin de vigencia | `2026-07-31T12:00:00.000Z` |
| `branchId` | No | `string` | formato `uuid` | Sede/branch | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro clínico asociado | `00000000-0000-4000-8000-000000000001` |
| `consentId` | No | `string` | formato `uuid` | Consentimiento que respalda el acceso (obligatorio salvo tratamiento directo) | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Inicio de vigencia (por defecto ahora) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/patients/00000000-0000-4000-8000-000000000001/clinical-access-grants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "grantedUserId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "TREATMENT",
  "accessLevel": "READ",
  "validTo": "2026-07-31T12:00:00.000Z",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "consentId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzIdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICAL_APPROVER, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un acceso clínico activo para ese usuario | Excepción explícita en src/modules/authz/services/authz-clinical.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | validTo debe ser posterior a validFrom | Excepción explícita en src/modules/authz/services/authz-clinical.service.ts |
| 422 | `PRECONDITION_FAILED` | Se requiere consentimiento salvo para tratamiento directo | Excepción explícita en src/modules/authz/services/authz-clinical.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/patients/{patientProfileId}/clinical-access-grants"
}
```

---

## 14. POST /authz/pdp/cache/invalidate

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-pdp`
- **Nombre:** Invalidar la cache de decisiones del PDP
- **Operation ID:** `AuthzPdpController_invalidateCache`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzPdpController.invalidateCache](../../src/modules/authz/controllers/authz-pdp.controller.ts)

### Descripción de negocio

Invalidar la cache de decisiones del PDP. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /authz/pdp/cache/invalidate` en `AuthzPdpController_invalidateCache`. El controlador delega en `AuthzPdpService.invalidateCache`. Valida el body como `AuthzInvalidateCacheDto` y consume `application/json`. El tipo de retorno estático es `CacheInvalidationResultDto`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AuthzInvalidateCacheDto`; los campos opcionales se omiten.

```http
POST /authz/pdp/cache/invalidate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Tenant afectado | `00000000-0000-4000-8000-000000000001` |
| `userId` | No | `string` | formato `uuid` | Usuario cuya decisión se invalida | `00000000-0000-4000-8000-000000000001` |
| `roleId` | No | `string` | formato `uuid` | Rol cuya decisión se invalida | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/pdp/cache/invalidate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "roleId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `CacheInvalidationResultDto` | No |
| 400 | Operación completada correctamente. | `CacheInvalidationResultDto` | No |
| 401 | Operación completada correctamente. | `CacheInvalidationResultDto` | No |
| 403 | Operación completada correctamente. | `CacheInvalidationResultDto` | No |
| 409 | Operación completada correctamente. | `CacheInvalidationResultDto` | No |
| 413 | Operación completada correctamente. | `CacheInvalidationResultDto` | No |
| 422 | Operación completada correctamente. | `CacheInvalidationResultDto` | No |
| 429 | Operación completada correctamente. | `CacheInvalidationResultDto` | No |
| 500 | Operación completada correctamente. | `CacheInvalidationResultDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CacheInvalidationResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true,
  "cacheKey": "valor-ejemplo",
  "invalidatedEntries": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si se procesó la invalidación | `true` |
| `cacheKey` | Sí | `string` | Sin restricción adicional declarada | Clave lógica de cache invalidada | `valor-ejemplo` |
| `invalidatedEntries` | Sí | `number` | Sin restricción adicional declarada | Nº de entradas de decisión invalidadas | `1` |

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
  "path": "/authz/pdp/cache/invalidate"
}
```

---

## 15. POST /authz/permission-categories

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-catalog`
- **Nombre:** Definir una categoría de permiso
- **Operation ID:** `AuthzCatalogController_createCategory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzCatalogController.createCategory](../../src/modules/authz/controllers/authz-catalog.controller.ts)

### Descripción de negocio

Definir una categoría de permiso. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /authz/permission-categories` en `AuthzCatalogController_createCategory`. El controlador delega en `AuthzCatalogService.createCategory`. Valida el body como `CreatePermissionCategoryDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzIdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePermissionCategoryDto`; los campos opcionales se omiten.

```http
POST /authz/permission-categories HTTP/1.1
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
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único de la categoría | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre legible | `Nombre de ejemplo` |
| `description` | No | `string` | longitud máxima 1000 | Descripción | `Texto descriptivo de ejemplo` |
| `ordinal` | No | `number` | mínimo 0 | Orden de presentación | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/permission-categories HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "ordinal": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzIdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una categoría con ese código | Excepción explícita en src/modules/authz/services/authz-catalog.service.ts |
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
  "path": "/authz/permission-categories"
}
```

---

## 16. POST /authz/permissions

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-catalog`
- **Nombre:** Definir un permiso del catálogo global
- **Operation ID:** `AuthzCatalogController_createPermission`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzCatalogController.createPermission](../../src/modules/authz/controllers/authz-catalog.controller.ts)

### Descripción de negocio

Definir un permiso del catálogo global. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /authz/permissions` en `AuthzCatalogController_createPermission`. El controlador delega en `AuthzCatalogService.createPermission`. Valida el body como `CreatePermissionDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzIdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePermissionDto`; los campos opcionales se omiten.

```http
POST /authz/permissions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "resource": "valor-ejemplo",
  "action": "READ"
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
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 150 | Código único del permiso | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre legible | `Nombre de ejemplo` |
| `resource` | Sí | `string` | longitud mínima 1; longitud máxima 150 | Recurso protegido (p. ej. patient, encounter) | `valor-ejemplo` |
| `action` | Sí | `string` | valores: `READ`, `WRITE`, `CREATE`, `DELETE`, `EXECUTE`, `APPROVE` | Acción | `READ` |
| `categoryId` | No | `string` | formato `uuid` | Id de la categoría | `00000000-0000-4000-8000-000000000001` |
| `defaultScope` | No | `string` | valores: `SELF`, `BRANCH`, `TENANT`, `GLOBAL` | Ámbito por defecto | `SELF` |
| `isFieldLevel` | No | `boolean` | Sin restricción adicional declarada | Permiso a nivel de campo | `true` |
| `isDangerous` | No | `boolean` | Sin restricción adicional declarada | Permiso peligroso (exige aprobación de segundo admin) | `true` |
| `isRoleRestricted` | No | `boolean` | Sin restricción adicional declarada | Restringido a un rol concreto | `true` |
| `requiredRoleCode` | No | `string` | longitud máxima 100 | Código de rol requerido si es restringido | `CODIGO_EJEMPLO` |
| `allowDirectUserGrant` | No | `boolean` | Sin restricción adicional declarada | Permite concesión directa a usuario | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/permissions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "resource": "valor-ejemplo",
  "action": "READ",
  "categoryId": "00000000-0000-4000-8000-000000000001",
  "defaultScope": "SELF",
  "isFieldLevel": true,
  "isDangerous": true,
  "isRoleRestricted": true,
  "requiredRoleCode": "CODIGO_EJEMPLO",
  "allowDirectUserGrant": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzIdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un permiso con ese código | Excepción explícita en src/modules/authz/services/authz-catalog.service.ts |
| 409 | `CONFLICT` | La categoría referenciada no existe | Excepción explícita en src/modules/authz/services/authz-catalog.service.ts |
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
  "path": "/authz/permissions"
}
```

---

## 17. POST /authz/resource-scope-grants

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-grants`
- **Nombre:** Otorgar acceso a un recurso específico (grant polimórfico)
- **Operation ID:** `AuthzGrantsController_grantResourceScope`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGrantsController.grantResourceScope](../../src/modules/authz/controllers/authz-grants.controller.ts)

### Descripción de negocio

Otorgar acceso a un recurso específico (grant polimórfico). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /authz/resource-scope-grants` en `AuthzGrantsController_grantResourceScope`. El controlador delega en `AuthzGrantsService.grantResourceScope`. Valida el body como `CreateResourceScopeGrantDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzIdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateResourceScopeGrantDto`; los campos opcionales se omiten.

```http
POST /authz/resource-scope-grants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "subjectType": "USER",
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "permissionId": "00000000-0000-4000-8000-000000000001",
  "resourceType": "PATIENT",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "effect": "ALLOW"
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
| `subjectType` | Sí | `string` | valores: `USER`, `ROLE`, `SERVICE` | Tipo de sujeto | `USER` |
| `subjectId` | Sí | `string` | formato `uuid` | Id del sujeto (validado contra su value set) | `00000000-0000-4000-8000-000000000001` |
| `permissionId` | Sí | `string` | formato `uuid` | Permiso concedido/denegado | `00000000-0000-4000-8000-000000000001` |
| `resourceType` | Sí | `string` | valores: `PATIENT`, `ENCOUNTER`, `DOCUMENT`, `RECORD` | Tipo de recurso | `PATIENT` |
| `resourceId` | Sí | `string` | formato `uuid` | Id del recurso concreto | `00000000-0000-4000-8000-000000000001` |
| `effect` | Sí | `string` | valores: `ALLOW`, `DENY` | Efecto | `ALLOW` |
| `tenantId` | No | `string` | formato `uuid` | Tenant del grant | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Inicio de vigencia | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Fin de vigencia | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/resource-scope-grants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "subjectType": "USER",
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "permissionId": "00000000-0000-4000-8000-000000000001",
  "resourceType": "PATIENT",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "effect": "ALLOW",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzIdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Permiso no encontrado | Excepción explícita en src/modules/authz/services/authz-grants.service.ts |
| 409 | `CONFLICT` | Ya existe un grant para ese (sujeto, permiso, recurso) | Excepción explícita en src/modules/authz/services/authz-grants.service.ts |
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
  "path": "/authz/resource-scope-grants"
}
```

---

## 18. GET /authz/roles

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-roles`
- **Nombre:** Listar los roles asignables
- **Operation ID:** `AuthzRolesController_listAssignable`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzRolesController.listAssignable](../../src/modules/authz/controllers/authz-roles.controller.ts)

### Descripción de negocio

Listar los roles asignables. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Catálogo de roles que se pueden asignar a un usuario. Es la contraparte de lectura de `POST /authz/users/:userId/role-assignments`: devuelve el `code` —el que exige `@Roles(...)`— junto al id, de modo que asignar un rol no obligue a conocer de antemano un uuid que ninguna operación devolvía.

### Descripción del sistema

NestJS resuelve `GET /authz/roles` en `AuthzRolesController_listAssignable`. El controlador delega en `AuthzRolesService.listAssignable`. No recibe body. El tipo de retorno estático es `Promise<AssignableRoleDto[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/roles HTTP/1.1
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
GET /authz/roles HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AssignableRoleDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<AssignableRoleDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<AssignableRoleDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<AssignableRoleDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<AssignableRoleDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<AssignableRoleDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AssignableRoleDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "code": "CODIGO_EJEMPLO",
    "name": "Nombre de ejemplo",
    "isSystem": true,
    "tenantId": "00000000-0000-4000-8000-000000000001"
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
  "path": "/authz/roles"
}
```

---

## 19. POST /authz/roles

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-roles`
- **Nombre:** Componer un rol (con herencia opcional)
- **Operation ID:** `AuthzRolesController_createRole`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzRolesController.createRole](../../src/modules/authz/controllers/authz-roles.controller.ts)

### Descripción de negocio

Componer un rol (con herencia opcional). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /authz/roles` en `AuthzRolesController_createRole`. El controlador delega en `AuthzRolesService.createRole`. Valida el body como `CreateRoleDto` y consume `application/json`. El tipo de retorno estático es `Promise<RoleResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateRoleDto`; los campos opcionales se omiten.

```http
POST /authz/roles HTTP/1.1
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
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único del rol | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre legible | `Nombre de ejemplo` |
| `tenantId` | No | `string` | formato `uuid` | Tenant propietario (omitir para rol de sistema) | `00000000-0000-4000-8000-000000000001` |
| `parentRoleId` | No | `string` | formato `uuid` | Rol padre (herencia) | `00000000-0000-4000-8000-000000000001` |
| `baseRole` | No | `string` | valores: `CLINICAL`, `ADMIN`, `STAFF` | Rol base | `CLINICAL` |
| `scope` | No | `string` | valores: `SELF`, `BRANCH`, `TENANT`, `GLOBAL` | Ámbito | `SELF` |
| `isSystem` | No | `boolean` | Sin restricción adicional declarada | Rol de sistema (global, sin tenant) | `true` |
| `isAssignable` | No | `boolean` | Sin restricción adicional declarada | Asignable a usuarios | `true` |
| `priority` | No | `number` | mínimo 0 | Prioridad | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/roles HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "parentRoleId": "00000000-0000-4000-8000-000000000001",
  "baseRole": "CLINICAL",
  "scope": "SELF",
  "isSystem": true,
  "isAssignable": true,
  "priority": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RoleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RoleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "status": "00000000-0000-4000-8000-000000000001",
  "permissionCount": 1,
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `permissionCount` | Sí | `number` | Sin restricción adicional declarada | Nº de bindings permiso aplicados | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El rol padre no existe | Excepción explícita en src/modules/authz/services/authz-roles.service.ts |
| 409 | `CONFLICT` | Ya existe un rol con ese código | Excepción explícita en src/modules/authz/services/authz-roles.service.ts |
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
  "path": "/authz/roles"
}
```

---

## 20. PUT /authz/roles/{roleId}/field-permissions

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-roles`
- **Nombre:** Configurar el enmascaramiento de campos del rol
- **Operation ID:** `AuthzRolesController_setFieldPermissions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzRolesController.setFieldPermissions](../../src/modules/authz/controllers/authz-roles.controller.ts)

### Descripción de negocio

Configurar el enmascaramiento de campos del rol. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /authz/roles/{roleId}/field-permissions` en `AuthzRolesController_setFieldPermissions`. El controlador delega en `AuthzRolesService.setFieldPermissions`. Valida el body como `SetFieldPermissionsDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzStatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `roleId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetFieldPermissionsDto`; los campos opcionales se omiten.

```http
PUT /authz/roles/00000000-0000-4000-8000-000000000001/field-permissions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fields": [
    {
      "entity": "valor-ejemplo",
      "columnName": "Nombre de ejemplo",
      "canRead": true,
      "canWrite": true
    }
  ]
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
| `fields` | Sí | `array<FieldPermissionItemDto>` | mínimo 1 elemento(s) | Reglas de enmascaramiento a aplicar (upsert) | `[{"entity":"valor-ejemplo","columnName":"Nombre de ejemplo","canRead":true,"canWrite":true,"maskStrategy":"REDACT","conditionJson":{}}]` |
| `fields[].entity` | Sí | `string` | longitud mínima 1; longitud máxima 150 | Entidad/tabla | `valor-ejemplo` |
| `fields[].columnName` | Sí | `string` | longitud mínima 1; longitud máxima 150 | Columna | `Nombre de ejemplo` |
| `fields[].canRead` | Sí | `boolean` | Sin restricción adicional declarada | ¿Puede leerse el campo? | `true` |
| `fields[].canWrite` | Sí | `boolean` | Sin restricción adicional declarada | ¿Puede escribirse el campo? (exige canRead) | `true` |
| `fields[].maskStrategy` | No | `string` | valores: `REDACT`, `HASH`, `PARTIAL`, `NULLIFY` | Estrategia de enmascaramiento | `REDACT` |
| `fields[].conditionJson` | No | `object` | Sin restricción adicional declarada | Condición ABAC (JSON) | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /authz/roles/00000000-0000-4000-8000-000000000001/field-permissions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fields": [
    {
      "entity": "valor-ejemplo",
      "columnName": "Nombre de ejemplo",
      "canRead": true,
      "canWrite": true,
      "maskStrategy": "REDACT",
      "conditionJson": {}
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzStatusResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true,
  "affected": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |
| `affected` | No | `number` | Sin restricción adicional declarada | Nº de filas afectadas cuando aplica | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Rol no encontrado | Excepción explícita en src/modules/authz/services/authz-roles.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | canWrite=true requiere canRead=true | Excepción explícita en src/modules/authz/services/authz-roles.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/roles/{roleId}/field-permissions"
}
```

---

## 21. PUT /authz/roles/{roleId}/permissions

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-roles`
- **Nombre:** Asignar permisos al rol (reemplaza los activos)
- **Operation ID:** `AuthzRolesController_setPermissions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzRolesController.setPermissions](../../src/modules/authz/controllers/authz-roles.controller.ts)

### Descripción de negocio

Asignar permisos al rol (reemplaza los activos). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /authz/roles/{roleId}/permissions` en `AuthzRolesController_setPermissions`. El controlador delega en `AuthzRolesService.setPermissions`. Valida el body como `SetRolePermissionsDto` y consume `application/json`. El tipo de retorno estático es `Promise<RoleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `roleId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetRolePermissionsDto`; los campos opcionales se omiten.

```http
PUT /authz/roles/00000000-0000-4000-8000-000000000001/permissions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "permissions": [
    {
      "permissionId": "00000000-0000-4000-8000-000000000001",
      "effect": "ALLOW"
    }
  ]
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
| `permissions` | Sí | `array<RolePermissionItemDto>` | mínimo 1 elemento(s) | Bindings permiso→efecto a aplicar (reemplaza los activos) | `[{"permissionId":"00000000-0000-4000-8000-000000000001","effect":"ALLOW","scope":"SELF","constraintJson":{},"fieldValueSetId":"00000000-0000-4000-8000-000000000001"}]` |
| `permissions[].permissionId` | Sí | `string` | formato `uuid` | Id del permiso | `00000000-0000-4000-8000-000000000001` |
| `permissions[].effect` | Sí | `string` | valores: `ALLOW`, `DENY` | Efecto (deny prevalece) | `ALLOW` |
| `permissions[].scope` | No | `string` | valores: `SELF`, `BRANCH`, `TENANT`, `GLOBAL` | Ámbito | `SELF` |
| `permissions[].constraintJson` | No | `object` | Sin restricción adicional declarada | Restricción ABAC (JSON) | `{}` |
| `permissions[].fieldValueSetId` | No | `string` | formato `uuid` | Value set de campos permitidos | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /authz/roles/00000000-0000-4000-8000-000000000001/permissions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "permissions": [
    {
      "permissionId": "00000000-0000-4000-8000-000000000001",
      "effect": "ALLOW",
      "scope": "SELF",
      "constraintJson": {},
      "fieldValueSetId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RoleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "status": "00000000-0000-4000-8000-000000000001",
  "permissionCount": 1,
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `permissionCount` | Sí | `number` | Sin restricción adicional declarada | Nº de bindings permiso aplicados | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Rol no encontrado | Excepción explícita en src/modules/authz/services/authz-roles.service.ts |
| 404 | `NOT_FOUND` | Permiso no encontrado | Excepción explícita en src/modules/authz/services/authz-roles.service.ts |
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
  "path": "/authz/roles/{roleId}/permissions"
}
```

---

## 22. POST /authz/tenants/{tenantId}/access-policies

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-policies`
- **Nombre:** Definir una política de acceso ABAC con enmascaramiento
- **Operation ID:** `AuthzPoliciesController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzPoliciesController.create](../../src/modules/authz/controllers/authz-policies.controller.ts)

### Descripción de negocio

Definir una política de acceso ABAC con enmascaramiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /authz/tenants/{tenantId}/access-policies` en `AuthzPoliciesController_create`. El controlador delega en `AuthzPoliciesService.create`. Valida el body como `CreateAccessPolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzIdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAccessPolicyDto`; los campos opcionales se omiten.

```http
POST /authz/tenants/00000000-0000-4000-8000-000000000001/access-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "effect": "ALLOW"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `tenantId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre de la política | `Nombre de ejemplo` |
| `effect` | Sí | `string` | valores: `ALLOW`, `DENY` | Efecto de la política | `ALLOW` |
| `targetResource` | No | `string` | longitud máxima 200 | Recurso objetivo (p. ej. patient.record) | `valor-ejemplo` |
| `conditionJson` | No | `object` | Sin restricción adicional declarada | Condición ABAC (JSON) | `{}` |
| `priority` | No | `number` | mínimo 0 | Prioridad de desempate (menor = antes) | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/tenants/00000000-0000-4000-8000-000000000001/access-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "effect": "ALLOW",
  "targetResource": "valor-ejemplo",
  "conditionJson": {},
  "priority": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzIdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una política activa con esa prioridad para el recurso | Excepción explícita en src/modules/authz/services/authz-policies.service.ts |
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
  "path": "/authz/tenants/{tenantId}/access-policies"
}
```

---

## 23. POST /authz/users/{userId}/permission-grants

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-grants`
- **Nombre:** Otorgar una excepción de permiso por usuario
- **Operation ID:** `AuthzGrantsController_grantPermission`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGrantsController.grantPermission](../../src/modules/authz/controllers/authz-grants.controller.ts)

### Descripción de negocio

Otorgar una excepción de permiso por usuario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /authz/users/{userId}/permission-grants` en `AuthzGrantsController_grantPermission`. El controlador delega en `AuthzGrantsService.grantPermission`. Valida el body como `CreatePermissionGrantDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzIdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `userId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePermissionGrantDto`; los campos opcionales se omiten.

```http
POST /authz/users/00000000-0000-4000-8000-000000000001/permission-grants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "permissionId": "00000000-0000-4000-8000-000000000001",
  "effect": "ALLOW",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `userId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `permissionId` | Sí | `string` | formato `uuid` | Permiso concedido/denegado excepcionalmente | `00000000-0000-4000-8000-000000000001` |
| `effect` | Sí | `string` | valores: `ALLOW`, `DENY` | Efecto (deny individual prevalece sobre allow de rol) | `ALLOW` |
| `reason` | Sí | `string` | longitud mínima 1; longitud máxima 500 | Justificación obligatoria | `Texto descriptivo de ejemplo` |
| `scope` | No | `string` | valores: `SELF`, `BRANCH`, `TENANT`, `GLOBAL` | Ámbito | `SELF` |
| `tenantId` | No | `string` | formato `uuid` | Tenant del grant | `00000000-0000-4000-8000-000000000001` |
| `resourceSelectorJson` | No | `object` | Sin restricción adicional declarada | Selector de recursos (JSON) | `{}` |
| `validFrom` | No | `string` | formato `date-time` | Inicio de vigencia | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Fin de vigencia (acotado) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/users/00000000-0000-4000-8000-000000000001/permission-grants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "permissionId": "00000000-0000-4000-8000-000000000001",
  "effect": "ALLOW",
  "reason": "Texto descriptivo de ejemplo",
  "scope": "SELF",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "resourceSelectorJson": {},
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzIdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Permiso no encontrado | Excepción explícita en src/modules/authz/services/authz-grants.service.ts |
| 409 | `CONFLICT` | El usuario ya tiene una excepción activa para ese permiso | Excepción explícita en src/modules/authz/services/authz-grants.service.ts |
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
  "path": "/authz/users/{userId}/permission-grants"
}
```

---

## 24. POST /authz/users/{userId}/role-assignments

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-grants`
- **Nombre:** Asignar un rol a un usuario con vigencia y ámbito
- **Operation ID:** `AuthzGrantsController_assignRole`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGrantsController.assignRole](../../src/modules/authz/controllers/authz-grants.controller.ts)

### Descripción de negocio

Asignar un rol a un usuario con vigencia y ámbito. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /authz/users/{userId}/role-assignments` en `AuthzGrantsController_assignRole`. El controlador delega en `AuthzGrantsService.assignRole`. Valida el body como `AuthzCreateRoleAssignmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzIdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `userId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AuthzCreateRoleAssignmentDto`; los campos opcionales se omiten.

```http
POST /authz/users/00000000-0000-4000-8000-000000000001/role-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `userId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `roleId` | No | `string` | formato `uuid` | Rol a asignar por id (debe ser asignable) | `00000000-0000-4000-8000-000000000001` |
| `roleCode` | No | `string` | longitud máxima 100 | Rol a asignar por código (p. ej. `SURGEON`) | `CODIGO_EJEMPLO` |
| `tenantId` | No | `string` | formato `uuid` | Tenant del ámbito | `00000000-0000-4000-8000-000000000001` |
| `branchId` | No | `string` | formato `uuid` | Sede/branch del ámbito | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | No | `string` | formato `uuid` | Consultorio/practice del ámbito | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Inicio de vigencia | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Fin de vigencia | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/users/00000000-0000-4000-8000-000000000001/role-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "roleId": "00000000-0000-4000-8000-000000000001",
  "roleCode": "CODIGO_EJEMPLO",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthzIdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Rol no encontrado | Excepción explícita en src/modules/authz/services/authz-grants.service.ts |
| 409 | `CONFLICT` | El usuario ya tiene ese rol asignado y activo en ese ámbito | Excepción explícita en src/modules/authz/services/authz-grants.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Indique el rol a asignar por `roleId` o por `roleCode` | Excepción explícita en src/modules/authz/services/authz-grants.service.ts |
| 422 | `PRECONDITION_FAILED` | El rol no es asignable | Excepción explícita en src/modules/authz/services/authz-grants.service.ts |
| 422 | `PRECONDITION_FAILED` | validFrom debe ser anterior a validTo | Excepción explícita en src/modules/authz/services/authz-grants.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/users/{userId}/role-assignments"
}
```

---

