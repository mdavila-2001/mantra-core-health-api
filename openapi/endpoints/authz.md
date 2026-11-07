<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `authz`

Referencia exhaustiva de 50 operación(es) del módulo `authz`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `authz-admin`, `authz-care-relationships`, `authz-catalog`, `authz-clinical`, `authz-governance`, `authz-grants`, `authz-me`, `authz-pdp`, `authz-policies`, `authz-practitioner-requests`, `authz-roles`
- **Controladores:** `AuthzAdminController`, `AuthzCareRelationshipsController`, `AuthzCatalogController`, `AuthzClinicalController`, `AuthzGovernanceController`, `AuthzGovernanceExtController`, `AuthzGrantsController`, `AuthzMeController`, `AuthzModulesCatalogController`, `AuthzPdpController`, `AuthzPoliciesController`, `AuthzPractitionerRequestsController`, `AuthzRolesController`, `AuthzUsersDirectoryController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /authz/access-reviews](#1-get-authz-access-reviews) — Historia de revisiones de accesos, paginada
2. [GET /authz/access-reviews/due](#2-get-authz-access-reviews-due) — Cuentas con acceso administrativo sin revisión reciente
3. [GET /authz/care-relationships](#3-get-authz-care-relationships) — Listar relaciones asistenciales de un paciente
4. [POST /authz/care-relationships](#4-post-authz-care-relationships) — Establecer una relación asistencial
5. [POST /authz/care-relationships/{id}/respond](#5-post-authz-care-relationships-id-respond) — Responder (aceptar/rechazar) una solicitud de relación asistencial
6. [POST /authz/care-relationships/{id}/revoke](#6-post-authz-care-relationships-id-revoke) — Revocar o expirar una relación asistencial
7. [POST /authz/care-relationships/request](#7-post-authz-care-relationships-request) — Solicitar autorización del paciente para una relación asistencial
8. [GET /authz/care-relationships/requests/mine](#8-get-authz-care-relationships-requests-mine) — Mis solicitudes de relación asistencial pendientes de decidir
9. [GET /authz/catalog/modules](#9-get-authz-catalog-modules) — Catálogo RBAC por módulo, con sus huecos
10. [DELETE /authz/clinical-access-grants/{grantId}](#10-delete-authz-clinical-access-grants-grantid) — Revocar o expirar una concesión de acceso clínico
11. [POST /authz/decisions/evaluate](#11-post-authz-decisions-evaluate) — Recalcular la decisión de autorización efectiva (PDP)
12. [GET /authz/internal-users](#12-get-authz-internal-users) — Usuarios internos con sus roles
13. [GET /authz/legal-representations](#13-get-authz-legal-representations) — Listar representaciones legales de un paciente
14. [POST /authz/legal-representations](#14-post-authz-legal-representations) — Registrar una representación legal del paciente
15. [POST /authz/legal-representations/{id}/revoke](#15-post-authz-legal-representations-id-revoke) — Revocar o expirar una representación legal
16. [GET /authz/me/access](#16-get-authz-me-access) — Quién ve mi historia
17. [GET /authz/me/access-requests](#17-get-authz-me-access-requests) — Mis solicitudes de acceso, recibidas y enviadas
18. [POST /authz/me/care-relationships/{id}/revoke](#18-post-authz-me-care-relationships-id-revoke) — Revocar una de mis relaciones asistenciales
19. [POST /authz/me/clinical-access-grants/{grantId}/revoke](#19-post-authz-me-clinical-access-grants-grantid-revoke) — Revocar uno de los accesos clínicos a mi historia
20. [POST /authz/me/primary-practitioner-requests](#20-post-authz-me-primary-practitioner-requests) — Pedir a un profesional que sea mi médico de cabecera
21. [POST /authz/patients/{patientProfileId}/break-the-glass](#21-post-authz-patients-patientprofileid-break-the-glass) — Break-the-glass / anulación de emergencia
22. [POST /authz/patients/{patientProfileId}/clinical-access-grants](#22-post-authz-patients-patientprofileid-clinical-access-grants) — Otorgar acceso clínico con propósito de uso
23. [POST /authz/pdp/cache/invalidate](#23-post-authz-pdp-cache-invalidate) — Invalidar la cache de decisiones del PDP
24. [POST /authz/permission-categories](#24-post-authz-permission-categories) — Definir una categoría de permiso
25. [GET /authz/permissions](#25-get-authz-permissions) — Catálogo de permisos, paginado por código
26. [POST /authz/permissions](#26-post-authz-permissions) — Definir un permiso del catálogo global
27. [GET /authz/permissions/{permissionId}/holders](#27-get-authz-permissions-permissionid-holders) — Quiénes tienen un permiso, con el camino por el que lo tienen
28. [GET /authz/practitioners/me/access-requests](#28-get-authz-practitioners-me-access-requests) — Solicitudes de acceso enviadas y recibidas
29. [POST /authz/practitioners/me/care-relationships/{id}/respond](#29-post-authz-practitioners-me-care-relationships-id-respond) — Aceptar o rechazar una solicitud de cabecera de un paciente
30. [GET /authz/resource-scope-grants](#30-get-authz-resource-scope-grants) — Permisos por alcance de recurso, paginados
31. [POST /authz/resource-scope-grants](#31-post-authz-resource-scope-grants) — Otorgar acceso a un recurso específico (grant polimórfico)
32. [DELETE /authz/resource-scope-grants/{grantId}](#32-delete-authz-resource-scope-grants-grantid) — Terminar la vigencia de un permiso por alcance de recurso
33. [GET /authz/roles](#33-get-authz-roles) — Listar los roles asignables
34. [POST /authz/roles](#34-post-authz-roles) — Componer un rol (con herencia opcional)
35. [GET /authz/roles/{roleId}/field-permissions](#35-get-authz-roles-roleid-field-permissions) — Reglas de enmascaramiento de campos de un rol
36. [PUT /authz/roles/{roleId}/field-permissions](#36-put-authz-roles-roleid-field-permissions) — Configurar el enmascaramiento de campos del rol
37. [GET /authz/roles/{roleId}/permissions](#37-get-authz-roles-roleid-permissions) — Permisos activos de un rol, con su efecto y ámbito
38. [PUT /authz/roles/{roleId}/permissions](#38-put-authz-roles-roleid-permissions) — Asignar permisos al rol (reemplaza los activos)
39. [POST /authz/simulations](#39-post-authz-simulations) — Simular una decisión de acceso con el PDP real
40. [POST /authz/tenants/{tenantId}/access-policies](#40-post-authz-tenants-tenantid-access-policies) — Definir una política de acceso ABAC con enmascaramiento
41. [GET /authz/users/{userId}/access-map](#41-get-authz-users-userid-access-map) — «Quién puede qué» de un usuario: roles, conteos y última revisión
42. [POST /authz/users/{userId}/access-reviews](#42-post-authz-users-userid-access-reviews) — Registrar que revisaste los accesos de una cuenta
43. [GET /authz/users/{userId}/permission-grants](#43-get-authz-users-userid-permission-grants) — Excepciones de permiso por usuario, paginadas
44. [POST /authz/users/{userId}/permission-grants](#44-post-authz-users-userid-permission-grants) — Otorgar una excepción de permiso por usuario
45. [GET /authz/users/{userId}/resource-scope-grants](#45-get-authz-users-userid-resource-scope-grants) — Grants sobre un recurso concreto cuyo sujeto es el usuario, paginados
46. [GET /authz/users/{userId}/restricted-fields](#46-get-authz-users-userid-restricted-fields) — Campos restringidos que alcanzan al usuario por sus roles efectivos
47. [GET /authz/users/{userId}/role-assignments](#47-get-authz-users-userid-role-assignments) — Asignaciones de rol de un usuario, activas o no
48. [POST /authz/users/{userId}/role-assignments](#48-post-authz-users-userid-role-assignments) — Asignar un rol a un usuario con vigencia y ámbito
49. [DELETE /authz/users/{userId}/role-assignments/{assignmentId}](#49-delete-authz-users-userid-role-assignments-assignmentid) — Revocar una asignación de rol (revocación lógica: la fila queda como historia)
50. [GET /authz/users/directory](#50-get-authz-users-directory) — Directorio de usuarios por tipo, con roles y permisos efectivos

---

## 1. GET /authz/access-reviews

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-governance`
- **Nombre:** Historia de revisiones de accesos, paginada
- **Operation ID:** `AuthzGovernanceController_reviews`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGovernanceController.reviews](../../src/modules/authz/controllers/authz-governance.controller.ts)

### Descripción de negocio

Historia de revisiones de accesos, paginada. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /authz/access-reviews` en `AuthzGovernanceController_reviews`. El controlador delega en `AuthzGovernanceService.reviews`. No recibe body. El tipo de retorno estático es `Promise<AccessReviewsPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 400 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `userId` | query | No | `string` | formato `uuid` | Cuenta revisada | `00000000-0000-4000-8000-000000000001` |
| `reviewerId` | query | No | `string` | formato `uuid` | Quien revisó | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/access-reviews HTTP/1.1
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
GET /authz/access-reviews?limit=50&cursor=valor-ejemplo&userId=00000000-0000-4000-8000-000000000001&reviewerId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AccessReviewsPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<AccessReviewsPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<AccessReviewsPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<AccessReviewsPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<AccessReviewsPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<AccessReviewsPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<AccessReviewsPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccessReviewsPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "userId": "00000000-0000-4000-8000-000000000001",
      "userDisplayName": "Nombre de ejemplo",
      "reviewerUserId": "00000000-0000-4000-8000-000000000001",
      "reviewerDisplayName": "Nombre de ejemplo",
      "reviewedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "nextCursor": "valor-ejemplo",
  "limit": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<AccessReviewDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","userId":"00000000-0000-4000-8000-000000000001","userDisplayName":"Nombre de ejemplo","reviewerUserId":"00000000-0000-4000-8000-000000000001","reviewerDisplayName":"Nombre de ejemplo","reviewedAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Id del sello en la bitácora | `00000000-0000-4000-8000-000000000001` |
| `items[].userId` | Sí | `string` | formato `uuid` | Cuenta revisada | `00000000-0000-4000-8000-000000000001` |
| `items[].userDisplayName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].reviewerUserId` | Sí | `string` | formato `uuid` | Quien revisó | `00000000-0000-4000-8000-000000000001` |
| `items[].reviewerDisplayName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].reviewedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `nextCursor` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

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
  "path": "/authz/access-reviews"
}
```

---

## 2. GET /authz/access-reviews/due

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-governance`
- **Nombre:** Cuentas con acceso administrativo sin revisión reciente
- **Operation ID:** `AuthzGovernanceController_dueReviews`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGovernanceController.dueReviews](../../src/modules/authz/controllers/authz-governance.controller.ts)

### Descripción de negocio

Cuentas con acceso administrativo sin revisión reciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /authz/access-reviews/due` en `AuthzGovernanceController_dueReviews`. El controlador delega en `AuthzGovernanceService.dueReviews`. No recibe body. El tipo de retorno estático es `Promise<DueReviewsPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 400 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `olderThanDays` | query | No | `number` | mínimo 1; máximo 3650 | Cuentas cuya última revisión es anterior a estos días, o que nunca fueron revisadas | `90` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/access-reviews/due HTTP/1.1
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
GET /authz/access-reviews/due?limit=50&cursor=valor-ejemplo&olderThanDays=90 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DueReviewsPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<DueReviewsPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DueReviewsPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DueReviewsPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DueReviewsPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DueReviewsPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<DueReviewsPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DueReviewsPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "userId": "00000000-0000-4000-8000-000000000001",
      "displayName": "Nombre de ejemplo",
      "accountStatus": "ACTIVE",
      "lastReviewedAt": "2026-07-31T12:00:00.000Z",
      "lastReviewerUserId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "nextCursor": "valor-ejemplo",
  "limit": 1,
  "olderThanDays": 1,
  "lookbackDays": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<DueReviewDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"userId":"00000000-0000-4000-8000-000000000001","displayName":"Nombre de ejemplo","accountStatus":"ACTIVE","lastReviewedAt":"2026-07-31T12:00:00.000Z","lastReviewerUserId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].displayName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].accountStatus` | Sí | `string` | valores: `ACTIVE`, `LOCKED`, `ANONYMIZED`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |
| `items[].lastReviewedAt` | No | `string` | formato `date-time`; admite null | `null`: sin revisión dentro del horizonte de búsqueda | `2026-07-31T12:00:00.000Z` |
| `items[].lastReviewerUserId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `nextCursor` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `olderThanDays` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `lookbackDays` | Sí | `number` | Sin restricción adicional declarada | Días hacia atrás en que se buscan revisiones: más allá, una cuenta cuenta como no revisada | `1` |

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
  "path": "/authz/access-reviews/due"
}
```

---

## 3. GET /authz/care-relationships

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
| 504 | Consulta completada correctamente. | `Promise<CareRelationshipView[]>` | No |

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

## 4. POST /authz/care-relationships

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
| 504 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

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
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

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

## 5. POST /authz/care-relationships/{id}/respond

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
| 504 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |

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
| 409 | `CONFLICT` | Su médico de cabecera cambió mientras se aceptaba. Vuelva a intentarlo. | Excepción explícita en src/modules/authz/services/authz-primary-care-sync.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo el paciente titular puede responder esta solicitud | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 422 | `PRECONDITION_FAILED` | La solicitud ya fue respondida o ya no está pendiente | Excepción explícita en src/modules/authz/services/authz-care-relationships.service.ts |
| 422 | `PRECONDITION_FAILED` | Sólo la otra parte puede aceptar esta solicitud | Excepción explícita en src/modules/authz/services/authz-primary-care-sync.service.ts |
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

## 6. POST /authz/care-relationships/{id}/revoke

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
| 504 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |

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

## 7. POST /authz/care-relationships/request

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
| `relationshipType` | No | `string` | valores: `TREATING`, `CONSULTING`, `EMERGENCY`, `PRIMARY` | Tipo de relación solicitada | `TREATING` |
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
| 504 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

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
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

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

## 8. GET /authz/care-relationships/requests/mine

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
| 504 | Consulta completada correctamente. | `Promise<CareRelationshipView[]>` | No |

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

## 9. GET /authz/catalog/modules

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-catalog`
- **Nombre:** Catálogo RBAC por módulo, con sus huecos
- **Operation ID:** `AuthzModulesCatalogController_modules`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzModulesCatalogController.modules](../../src/modules/authz/controllers/authz-modules-catalog.controller.ts)

### Descripción de negocio

Por módulo: permisos por recurso y acción canónica (`read, list, create, update, delete, export, approve, reject, assign, configure, audit`), los roles que los tienen y los huecos detectados en las rutas. Los códigos propuestos no están sembrados. `SUPERADMIN` entra por comodín; el resto recibe 403. Un `SECURITY_ADMIN` con alcance de organización sólo ve los roles de sistema y los de su organización.


### Descripción del sistema

NestJS resuelve `GET /authz/catalog/modules` en `AuthzModulesCatalogController_modules`. El controlador delega en `AuthzModulesCatalogService.catalog`. No recibe body. El tipo de retorno estático es `Promise<ModulesCatalogDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `module` | query | No | `string` | longitud máxima 64 | Sólo este módulo (clave en snake_case, p. ej. `pharma_lab`) | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/catalog/modules HTTP/1.1
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
GET /authz/catalog/modules?module=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ModulesCatalogDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<ModulesCatalogDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ModulesCatalogDto>` | No |
| 403 | Rol insuficiente | `Promise<ModulesCatalogDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ModulesCatalogDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ModulesCatalogDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ModulesCatalogDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ModulesCatalogDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "generatedAt": "2026-07-31T12:00:00.000Z",
  "canonicalActions": [
    "valor-ejemplo"
  ],
  "notes": [
    "Texto descriptivo de ejemplo"
  ],
  "truncated": true,
  "availableModules": [
    "valor-ejemplo"
  ],
  "summary": {
    "modules": 1,
    "permissions": 1,
    "routes": 1,
    "roleOnlyRoutes": 1,
    "undeclaredAuthRoutes": 1,
    "gaps": 1,
    "modulesWithoutFinePermissions": 1
  },
  "roles": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "isSystem": true,
      "tenantId": {}
    }
  ],
  "modules": [
    {
      "key": "valor-ejemplo",
      "routes": {
        "total": 1,
        "publicRoutes": 1,
        "roleOnly": 1,
        "guardOnly": 1,
        "selfService": 1,
        "undeclaredAuth": 1,
        "mutating": 1,
        "mutatingRoleOnly": 1
      },
      "permissionCount": 1,
      "grantCount": 1,
      "roleCodesInCode": [
        "CODIGO_EJEMPLO"
      ],
      "resources": [
        {
          "resource": "valor-ejemplo",
          "permissions": [
            {
              "id": "00000000-0000-4000-8000-000000000001",
              "code": "CODIGO_EJEMPLO",
              "name": "Nombre de ejemplo",
              "resource": "valor-ejemplo",
              "legacyAction": {},
              "action": "read",
              "canonicalCode": true,
              "isDangerous": true,
              "isActive": true,
              "grants": [
                {
                  "roleId": "00000000-0000-4000-8000-000000000001",
                  "roleCode": "CODIGO_EJEMPLO",
                  "roleName": "Nombre de ejemplo",
                  "effect": "ALLOW",
                  "scope": {},
                  "constraintJson": {},
                  "fieldValueSetId": {}
                }
              ]
            }
          ],
          "cells": [
            {
              "action": "read",
              "proposedCode": {},
              "coverage": "FINE_PERMISSION",
              "permissionIds": [
                "valor-ejemplo"
              ],
              "routeCount": 1,
              "mutatingRouteCount": 1,
              "undeclaredRouteCount": 1,
              "publicRouteCount": 1,
              "routeRoles": [
                "valor-ejemplo"
              ]
            }
          ]
        }
      ],
      "gaps": [
        {
          "kind": "MODULE_WITHOUT_FINE_PERMISSIONS",
          "severity": "HIGH",
          "module": "valor-ejemplo",
          "resource": {},
          "action": "read",
          "proposedCode": {},
          "routeCount": 1,
          "sampleRoutes": [
            {
              "method": "valor-ejemplo",
              "template": "valor-ejemplo",
              "controller": "valor-ejemplo",
              "handler": "valor-ejemplo",
              "roles": [
                "valor-ejemplo"
              ]
            }
          ],
          "roles": [
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
| `generatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `canonicalActions` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `notes` | Sí | `array<string>` | Sin restricción adicional declarada | Lo que esta lectura NO prueba: léase antes de interpretar los números | `["Texto descriptivo de ejemplo"]` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | Si el catálogo, los roles o los vínculos superaron el tope de lectura. Con `true`, no editar roles desde estos datos. | `true` |
| `availableModules` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `summary` | Sí | `ModulesCatalogSummaryDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"modules":1,"permissions":1,"routes":1,"roleOnlyRoutes":1,"undeclaredAuthRoutes":1,"gaps":1,"modulesWithoutFinePermissions":1}` |
| `summary.modules` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.permissions` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.routes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.roleOnlyRoutes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.undeclaredAuthRoutes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.gaps` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `summary.modulesWithoutFinePermissions` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `roles` | Sí | `array<ModuleRoleRefDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","isSystem":true,"tenantId":{}}]` |
| `roles[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `roles[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `roles[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `roles[].isSystem` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `roles[].tenantId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `modules` | Sí | `array<ModuleEntryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"key":"valor-ejemplo","routes":{"total":1,"publicRoutes":1,"roleOnly":1,"guardOnly":1,"selfService":1,"undeclaredAuth":1,"mutating":1,"mutatingRoleOnly":1},"permissionCount":1,"grantCount":1,"roleCodesInCode":["CODIGO_EJEMPLO"],"resources":[{"resource":"valor-ejemplo","permissions":[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","resource":"valor-ejemplo","legacyAction":{},"action":"read","canonicalCode":true,"isDangerous":true,"isActive":true,"grants":[{"roleId":"00000000-0000-4000-8000-000000000001","roleCode":"CODIGO_EJEMPLO","roleName":"Nombre de ejemplo","effect":"ALLOW","scope":{},"constraintJson":{},"fieldValueSetId":{}}]}],"cells":[{"action":"read","proposedCode":{},"coverage":"FINE_PERMISSION","permissionIds":["valor-ejemplo"],"routeCount":1,"mutatingRouteCount":1,"undeclaredRouteCount":1,"publicRouteCount":1,"routeRoles":["valor-ejemplo"]}]}],"gaps":[{"kind":"MODULE_WITHOUT_FINE_PERMISSIONS","severity":"HIGH","module":"valor-ejemplo","resource":{},"action":"read","proposedCode":{},"routeCount":1,"sampleRoutes":[{"method":"valor-ejemplo","template":"valor-ejemplo","controller":"valor-ejemplo","handler":"valor-ejemplo","roles":["valor-ejemplo"]}],"roles":["valor-ejemplo"]}]}]` |
| `modules[].key` | Sí | `string` | Sin restricción adicional declarada | Clave del módulo (snake_case) | `valor-ejemplo` |
| `modules[].routes` | Sí | `ModuleRouteStatsDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"total":1,"publicRoutes":1,"roleOnly":1,"guardOnly":1,"selfService":1,"undeclaredAuth":1,"mutating":1,"mutatingRoleOnly":1}` |
| `modules[].routes.total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `modules[].routes.publicRoutes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `modules[].routes.roleOnly` | Sí | `number` | Sin restricción adicional declarada | Autorizadas por `@Roles(...)` y nada más | `1` |
| `modules[].routes.guardOnly` | Sí | `number` | Sin restricción adicional declarada | Sin `@Roles`, con un `@UseGuards` de dominio | `1` |
| `modules[].routes.selfService` | Sí | `number` | Sin restricción adicional declarada | Rutas `/me/...`: operan sobre el titular | `1` |
| `modules[].routes.undeclaredAuth` | Sí | `number` | Sin restricción adicional declarada | Sin `@Roles`, sin `@Public` y sin guard: la autorización no está declarada en el controlador (puede resolverse en el servicio por pertenencia o propiedad) | `1` |
| `modules[].routes.mutating` | Sí | `number` | Sin restricción adicional declarada | Rutas que cambian estado | `1` |
| `modules[].routes.mutatingRoleOnly` | Sí | `number` | Sin restricción adicional declarada | Rutas que cambian estado y sólo tienen `@Roles` | `1` |
| `modules[].permissionCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `modules[].grantCount` | Sí | `number` | Sin restricción adicional declarada | Vínculos rol→permiso activos del módulo | `1` |
| `modules[].roleCodesInCode` | Sí | `array<string>` | Sin restricción adicional declarada | Roles que el código exige | `["CODIGO_EJEMPLO"]` |
| `modules[].resources` | Sí | `array<ModuleResourceDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"resource":"valor-ejemplo","permissions":[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","resource":"valor-ejemplo","legacyAction":{},"action":"read","canonicalCode":true,"isDangerous":true,"isActive":true,"grants":[{"roleId":"00000000-0000-4000-8000-000000000001","roleCode":"CODIGO_EJEMPLO","roleName":"Nombre de ejemplo","effect":"ALLOW","scope":{},"constraintJson":{},"fieldValueSetId":{}}]}],"cells":[{"action":"read","proposedCode":{},"coverage":"FINE_PERMISSION","permissionIds":["valor-ejemplo"],"routeCount":1,"mutatingRouteCount":1,"undeclaredRouteCount":1,"publicRouteCount":1,"routeRoles":["valor-ejemplo"]}]}]` |
| `modules[].resources[].resource` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `modules[].resources[].permissions` | Sí | `array<ModulePermissionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","resource":"valor-ejemplo","legacyAction":{},"action":"read","canonicalCode":true,"isDangerous":true,"isActive":true,"grants":[{"roleId":"00000000-0000-4000-8000-000000000001","roleCode":"CODIGO_EJEMPLO","roleName":"Nombre de ejemplo","effect":"ALLOW","scope":{},"constraintJson":{},"fieldValueSetId":{}}]}]` |
| `modules[].resources[].permissions[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `modules[].resources[].permissions[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `modules[].resources[].permissions[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `modules[].resources[].permissions[].resource` | Sí | `string` | Sin restricción adicional declarada | Recurso tal como está en el catálogo | `valor-ejemplo` |
| `modules[].resources[].permissions[].legacyAction` | No | `object` | admite null | Acción sembrada (READ, WRITE…), tal como está en el catálogo | `{}` |
| `modules[].resources[].permissions[].action` | Sí | `string` | valores: `read`, `list`, `create`, `update`, `delete`, `export`, `approve`, `reject`, `assign`, `configure`, `audit`, `other` | Sin descripción específica en el contrato OpenAPI. | `read` |
| `modules[].resources[].permissions[].canonicalCode` | Sí | `boolean` | Sin restricción adicional declarada | El código ya tiene la forma `<modulo>.<recurso>.<accion>` | `true` |
| `modules[].resources[].permissions[].isDangerous` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `modules[].resources[].permissions[].isActive` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `modules[].resources[].permissions[].grants` | Sí | `array<ModuleGrantDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"roleId":"00000000-0000-4000-8000-000000000001","roleCode":"CODIGO_EJEMPLO","roleName":"Nombre de ejemplo","effect":"ALLOW","scope":{},"constraintJson":{},"fieldValueSetId":{}}]` |
| `modules[].resources[].permissions[].grants[].roleId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `modules[].resources[].permissions[].grants[].roleCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `modules[].resources[].permissions[].grants[].roleName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `modules[].resources[].permissions[].grants[].effect` | Sí | `string` | valores: `ALLOW`, `DENY` | Sin descripción específica en el contrato OpenAPI. | `ALLOW` |
| `modules[].resources[].permissions[].grants[].scope` | No | `object` | admite null | SELF \| BRANCH \| TENANT \| GLOBAL; nulo si no tiene ámbito | `{}` |
| `modules[].resources[].permissions[].grants[].constraintJson` | No | `object` | admite null | Restricción ABAC del vínculo. Viaja para que quien reemplaza los permisos del rol pueda conservarla. | `{}` |
| `modules[].resources[].permissions[].grants[].fieldValueSetId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `modules[].resources[].cells` | Sí | `array<ModuleCellDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"action":"read","proposedCode":{},"coverage":"FINE_PERMISSION","permissionIds":["valor-ejemplo"],"routeCount":1,"mutatingRouteCount":1,"undeclaredRouteCount":1,"publicRouteCount":1,"routeRoles":["valor-ejemplo"]}]` |
| `modules[].resources[].cells[].action` | Sí | `string` | valores: `read`, `list`, `create`, `update`, `delete`, `export`, `approve`, `reject`, `assign`, `configure`, `audit`, `other` | Sin descripción específica en el contrato OpenAPI. | `read` |
| `modules[].resources[].cells[].proposedCode` | No | `object` | admite null | Código sugerido, derivado de las rutas reales. No está sembrado. | `{}` |
| `modules[].resources[].cells[].coverage` | Sí | `string` | valores: `FINE_PERMISSION`, `UNDECLARED_AUTH`, `ROLE_ONLY`, `GUARD_ONLY`, `NOT_APPLICABLE` | Sin descripción específica en el contrato OpenAPI. | `FINE_PERMISSION` |
| `modules[].resources[].cells[].permissionIds` | Sí | `array<string>` | Sin restricción adicional declarada | Permisos finos de esta celda | `["valor-ejemplo"]` |
| `modules[].resources[].cells[].routeCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `modules[].resources[].cells[].mutatingRouteCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `modules[].resources[].cells[].undeclaredRouteCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `modules[].resources[].cells[].publicRouteCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `modules[].resources[].cells[].routeRoles` | Sí | `array<string>` | Sin restricción adicional declarada | Códigos de rol que las rutas de la celda exigen con `@Roles` | `["valor-ejemplo"]` |
| `modules[].gaps` | Sí | `array<ModuleGapDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"kind":"MODULE_WITHOUT_FINE_PERMISSIONS","severity":"HIGH","module":"valor-ejemplo","resource":{},"action":"read","proposedCode":{},"routeCount":1,"sampleRoutes":[{"method":"valor-ejemplo","template":"valor-ejemplo","controller":"valor-ejemplo","handler":"valor-ejemplo","roles":["valor-ejemplo"]}],"roles":["valor-ejemplo"]}]` |
| `modules[].gaps[].kind` | Sí | `string` | valores: `MODULE_WITHOUT_FINE_PERMISSIONS`, `ROLE_ONLY`, `GUARD_ONLY`, `UNDECLARED_AUTH` | Sin descripción específica en el contrato OpenAPI. | `MODULE_WITHOUT_FINE_PERMISSIONS` |
| `modules[].gaps[].severity` | Sí | `string` | valores: `HIGH`, `MEDIUM`, `LOW` | Sin descripción específica en el contrato OpenAPI. | `HIGH` |
| `modules[].gaps[].module` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `modules[].gaps[].resource` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `modules[].gaps[].action` | No | `string` | valores: `read`, `list`, `create`, `update`, `delete`, `export`, `approve`, `reject`, `assign`, `configure`, `audit`; admite null | Sin descripción específica en el contrato OpenAPI. | `read` |
| `modules[].gaps[].proposedCode` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `modules[].gaps[].routeCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `modules[].gaps[].sampleRoutes` | Sí | `array<ModuleGapRouteDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"method":"valor-ejemplo","template":"valor-ejemplo","controller":"valor-ejemplo","handler":"valor-ejemplo","roles":["valor-ejemplo"]}]` |
| `modules[].gaps[].sampleRoutes[].method` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `modules[].gaps[].sampleRoutes[].template` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `modules[].gaps[].sampleRoutes[].controller` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `modules[].gaps[].sampleRoutes[].handler` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `modules[].gaps[].sampleRoutes[].roles` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `modules[].gaps[].roles` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |

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
  "path": "/authz/catalog/modules"
}
```

---

## 10. DELETE /authz/clinical-access-grants/{grantId}

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
| 504 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |

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

## 11. POST /authz/decisions/evaluate

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
| 504 | Operación completada correctamente. | `Promise<DecisionResponseDto>` | No |

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

## 12. GET /authz/internal-users

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-admin`
- **Nombre:** Usuarios internos con sus roles
- **Operation ID:** `AuthzAdminController_internalUsers`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzAdminController.internalUsers](../../src/modules/authz/controllers/authz-admin.controller.ts)

### Descripción de negocio

Sin `roleCode`: quienes tienen un rol activo de ámbito global o un rol global de plataforma (`SECURITY_ADMIN`, `SUPERADMIN`). Con `roleCode`: quienes tienen ese rol activo en cualquier ámbito.


### Descripción del sistema

NestJS resuelve `GET /authz/internal-users` en `AuthzAdminController_internalUsers`. El controlador delega en `AuthzAdminReadService.internalUsers`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 400 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `q` | query | No | `string` | longitud máxima 100 | Texto a buscar en el nombre visible | `valor-ejemplo` |
| `roleCode` | query | No | `string` | longitud máxima 100 | Sólo quienes tienen este rol activo, en cualquier ámbito. Sin él, la lista son los usuarios con un rol de ámbito global o un rol global de plataforma | `DPO` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/internal-users HTTP/1.1
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
GET /authz/internal-users?limit=50&cursor=valor-ejemplo&q=valor-ejemplo&roleCode=DPO HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 400 | `VALIDATION_FAILED` | El cursor de paginación no es válido | Excepción explícita en src/modules/authz/services/authz-admin-read.service.ts |
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
  "path": "/authz/internal-users"
}
```

---

## 13. GET /authz/legal-representations

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
| 504 | Consulta completada correctamente. | `Promise<LegalRepresentationView[]>` | No |

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

## 14. POST /authz/legal-representations

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
| 504 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

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
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

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

## 15. POST /authz/legal-representations/{id}/revoke

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
| 504 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |

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

## 16. GET /authz/me/access

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-me`
- **Nombre:** Quién ve mi historia
- **Operation ID:** `AuthzMeController_listMyAccess`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzMeController.listMyAccess](../../src/modules/authz/controllers/authz-me.controller.ts)

### Descripción de negocio

Quién ve mi historia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Relaciones asistenciales y accesos clínicos sobre mi historia.

### Descripción del sistema

NestJS resuelve `GET /authz/me/access` en `AuthzMeController_listMyAccess`. El controlador delega en `AuthzMeService.listMyAccess`. No recibe body. El tipo de retorno estático es `Promise<MyClinicalAccessResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/me/access HTTP/1.1
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
GET /authz/me/access HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MyClinicalAccessResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<MyClinicalAccessResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MyClinicalAccessResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MyClinicalAccessResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MyClinicalAccessResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MyClinicalAccessResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<MyClinicalAccessResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MyClinicalAccessResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "careRelationships": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "practitionerName": "Nombre de ejemplo",
      "state": "ACTIVE",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z",
      "purposeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "grants": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "grantedUserId": "00000000-0000-4000-8000-000000000001",
      "grantedName": "Nombre de ejemplo",
      "isEmergency": true,
      "state": "ACTIVE",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z",
      "reasonConceptId": "00000000-0000-4000-8000-000000000001",
      "accessLevelConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `careRelationships` | Sí | `array<MyCareRelationshipDto>` | Sin restricción adicional declarada | Relaciones asistenciales del titular (sin las solicitudes pendientes). | `[{"id":"00000000-0000-4000-8000-000000000001","tenantId":"00000000-0000-4000-8000-000000000001","practitionerProfileId":"00000000-0000-4000-8000-000000000001","practitionerName":"Nombre de ejemplo","state":"ACTIVE","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z","purposeConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `careRelationships[].id` | Sí | `string` | formato `uuid` | Identificador (el que se pasa a `revoke`). | `00000000-0000-4000-8000-000000000001` |
| `careRelationships[].tenantId` | Sí | `string` | formato `uuid` | Organización en la que se estableció. | `00000000-0000-4000-8000-000000000001` |
| `careRelationships[].practitionerProfileId` | Sí | `string` | formato `uuid` | Perfil del profesional. | `00000000-0000-4000-8000-000000000001` |
| `careRelationships[].practitionerName` | No | `string` | Sin restricción adicional declarada | Nombre del profesional, para mostrarlo. | `Nombre de ejemplo` |
| `careRelationships[].state` | Sí | `string` | valores: `ACTIVE`, `REVOKED`, `EXPIRED`, `OTHER` | Estado legible; `ACTIVE` con la vigencia vencida figura como `EXPIRED`. | `ACTIVE` |
| `careRelationships[].validFrom` | Sí | `string` | formato `date-time` | Desde cuándo. | `2026-07-31T12:00:00.000Z` |
| `careRelationships[].validTo` | No | `string` | formato `date-time` | Hasta cuándo, si tiene fin. | `2026-07-31T12:00:00.000Z` |
| `careRelationships[].purposeConceptId` | No | `string` | formato `uuid` | Propósito acotado (concept id). | `00000000-0000-4000-8000-000000000001` |
| `grants` | Sí | `array<MyClinicalAccessGrantDto>` | Sin restricción adicional declarada | Accesos clínicos concedidos sobre su historia. | `[{"id":"00000000-0000-4000-8000-000000000001","tenantId":"00000000-0000-4000-8000-000000000001","grantedUserId":"00000000-0000-4000-8000-000000000001","grantedName":"Nombre de ejemplo","isEmergency":true,"state":"ACTIVE","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z","reasonConceptId":"00000000-0000-4000-8000-000000000001","accessLevelConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `grants[].id` | Sí | `string` | formato `uuid` | Identificador (el que se pasa a `revoke`). | `00000000-0000-4000-8000-000000000001` |
| `grants[].tenantId` | Sí | `string` | formato `uuid` | Organización del acceso. | `00000000-0000-4000-8000-000000000001` |
| `grants[].grantedUserId` | Sí | `string` | formato `uuid` | Usuario que recibió el acceso. | `00000000-0000-4000-8000-000000000001` |
| `grants[].grantedName` | No | `string` | Sin restricción adicional declarada | Nombre de quien recibió el acceso, para mostrarlo. | `Nombre de ejemplo` |
| `grants[].isEmergency` | Sí | `boolean` | Sin restricción adicional declarada | `true` si es un acceso de emergencia (break-the-glass). | `true` |
| `grants[].state` | Sí | `string` | valores: `ACTIVE`, `REVOKED`, `EXPIRED`, `OTHER` | Estado legible; vencido por vigencia figura como `EXPIRED`. | `ACTIVE` |
| `grants[].validFrom` | Sí | `string` | formato `date-time` | Desde cuándo. | `2026-07-31T12:00:00.000Z` |
| `grants[].validTo` | Sí | `string` | formato `date-time` | Hasta cuándo. | `2026-07-31T12:00:00.000Z` |
| `grants[].reasonConceptId` | Sí | `string` | formato `uuid` | Motivo del acceso (concept id). | `00000000-0000-4000-8000-000000000001` |
| `grants[].accessLevelConceptId` | Sí | `string` | formato `uuid` | Nivel de acceso (concept id). | `00000000-0000-4000-8000-000000000001` |

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
  "path": "/authz/me/access"
}
```

---

## 17. GET /authz/me/access-requests

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-me`
- **Nombre:** Mis solicitudes de acceso, recibidas y enviadas
- **Operation ID:** `AuthzMeController_listAccessRequests`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzMeController.listAccessRequests](../../src/modules/authz/controllers/authz-me.controller.ts)

### Descripción de negocio

Mis solicitudes de acceso, recibidas y enviadas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Buzón unificado: solicitudes recibidas y enviadas, de cabecera y granulares.

### Descripción del sistema

NestJS resuelve `GET /authz/me/access-requests` en `AuthzMeController_listAccessRequests`. El controlador delega en `AuthzAccessRequestsReadService.listForPatient`. No recibe body. El tipo de retorno estático es `Promise<AccessRequestItemDto[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/me/access-requests HTTP/1.1
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
GET /authz/me/access-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AccessRequestItemDto[]>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<AccessRequestItemDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<AccessRequestItemDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<AccessRequestItemDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<AccessRequestItemDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<AccessRequestItemDto[]>` | No |
| 504 | Consulta completada correctamente. | `Promise<AccessRequestItemDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccessRequestItemDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "kind": "CABECERA",
    "direction": "RECEIVED",
    "counterpart": {
      "profileId": "00000000-0000-4000-8000-000000000001",
      "displayName": "Nombre de ejemplo"
    },
    "requestedAt": "2026-07-31T12:00:00.000Z",
    "decidedAt": "2026-07-31T12:00:00.000Z",
    "status": "PENDING",
    "requestedSpecialtyConceptIds": [
      "valor-ejemplo"
    ],
    "authorizedSpecialtyConceptIds": [
      "valor-ejemplo"
    ]
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
  "path": "/authz/me/access-requests"
}
```

---

## 18. POST /authz/me/care-relationships/{id}/revoke

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-me`
- **Nombre:** Revocar una de mis relaciones asistenciales
- **Operation ID:** `AuthzMeController_revokeCareRelationship`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzMeController.revokeCareRelationship](../../src/modules/authz/controllers/authz-me.controller.ts)

### Descripción de negocio

Revocar una de mis relaciones asistenciales. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Revoca una de mis relaciones asistenciales.

### Descripción del sistema

NestJS resuelve `POST /authz/me/care-relationships/{id}/revoke` en `AuthzMeController_revokeCareRelationship`. El controlador delega en `AuthzMeService.revokeMyCareRelationship`. No recibe body. El tipo de retorno estático es `Promise<AuthzStatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /authz/me/care-relationships/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /authz/me/care-relationships/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
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
| 504 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |

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
| 404 | `NOT_FOUND` | Relación asistencial no encontrada | Excepción explícita en src/modules/authz/services/authz-me.service.ts |
| 422 | `PRECONDITION_FAILED` | La solicitud sigue pendiente: respóndala en lugar de revocarla | Excepción explícita en src/modules/authz/services/authz-me.service.ts |
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
  "path": "/authz/me/care-relationships/{id}/revoke"
}
```

---

## 19. POST /authz/me/clinical-access-grants/{grantId}/revoke

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-me`
- **Nombre:** Revocar uno de los accesos clínicos a mi historia
- **Operation ID:** `AuthzMeController_revokeClinicalGrant`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzMeController.revokeClinicalGrant](../../src/modules/authz/controllers/authz-me.controller.ts)

### Descripción de negocio

Revocar uno de los accesos clínicos a mi historia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Revoca uno de los accesos clínicos a mi historia.

### Descripción del sistema

NestJS resuelve `POST /authz/me/clinical-access-grants/{grantId}/revoke` en `AuthzMeController_revokeClinicalGrant`. El controlador delega en `AuthzMeService.revokeMyClinicalGrant`. No recibe body. El tipo de retorno estático es `Promise<AuthzStatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `grantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /authz/me/clinical-access-grants/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Deben ser UUID válidos: `grantId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /authz/me/clinical-access-grants/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
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
| 504 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |

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
| 404 | `NOT_FOUND` | Acceso clínico no encontrado | Excepción explícita en src/modules/authz/services/authz-me.service.ts |
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
  "path": "/authz/me/clinical-access-grants/{grantId}/revoke"
}
```

---

## 20. POST /authz/me/primary-practitioner-requests

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-me`
- **Nombre:** Pedir a un profesional que sea mi médico de cabecera
- **Operation ID:** `AuthzMeController_requestPrimaryPractitioner`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzMeController.requestPrimaryPractitioner](../../src/modules/authz/controllers/authz-me.controller.ts)

### Descripción de negocio

Pedir a un profesional que sea mi médico de cabecera. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Pide a un profesional que sea mi médico de cabecera (el tenant va en `X-Tenant-Id`).

### Descripción del sistema

NestJS resuelve `POST /authz/me/primary-practitioner-requests` en `AuthzMeController_requestPrimaryPractitioner`. El controlador delega en `AuthzPrimaryCareService.requestAsPatient`. Valida el body como `RequestPrimaryPractitionerDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzIdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RequestPrimaryPractitionerDto`; los campos opcionales se omiten.

```http
POST /authz/me/primary-practitioner-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practitionerProfileId` | Sí | `string` | formato `uuid` | Perfil del profesional elegido | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/me/primary-practitioner-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthzIdResponseDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

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
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/authz/services/authz-primary-care.service.ts |
| 404 | `NOT_FOUND` | Profesional no encontrado | Excepción explícita en src/modules/authz/services/authz-primary-care.service.ts |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 409 | `CONFLICT` | Ya existe una solicitud de cabecera activa o pendiente con este profesional | Excepción explícita en src/modules/authz/services/authz-primary-care.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No puede elegirse a sí mismo como médico de cabecera. | Excepción explícita en src/modules/authz/services/authz-primary-care.service.ts |
| 422 | `PRECONDITION_FAILED` | Este profesional no está aceptando pacientes nuevos. | Excepción explícita en src/modules/authz/services/authz-primary-care.service.ts |
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
  "path": "/authz/me/primary-practitioner-requests"
}
```

---

## 21. POST /authz/patients/{patientProfileId}/break-the-glass

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
| 504 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

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
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

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

## 22. POST /authz/patients/{patientProfileId}/clinical-access-grants

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
| 504 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

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
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

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

## 23. POST /authz/pdp/cache/invalidate

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
| 504 | Operación completada correctamente. | `CacheInvalidationResultDto` | No |

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

## 24. POST /authz/permission-categories

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
| 504 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

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
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

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

## 25. GET /authz/permissions

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-admin`
- **Nombre:** Catálogo de permisos, paginado por código
- **Operation ID:** `AuthzAdminController_permissions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzAdminController.permissions](../../src/modules/authz/controllers/authz-admin.controller.ts)

### Descripción de negocio

Catálogo de permisos, paginado por código. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /authz/permissions` en `AuthzAdminController_permissions`. El controlador delega en `AuthzAdminReadService.permissions`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 400 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `q` | query | No | `string` | longitud máxima 100 | Texto a buscar en el código, el nombre y el recurso | `valor-ejemplo` |
| `categoryId` | query | No | `string` | formato `uuid` | Categoría de permiso | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/permissions HTTP/1.1
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
GET /authz/permissions?limit=50&cursor=valor-ejemplo&q=valor-ejemplo&categoryId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 400 | `VALIDATION_FAILED` | El cursor de paginación no es válido | Excepción explícita en src/modules/authz/services/authz-admin-read.service.ts |
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
  "path": "/authz/permissions"
}
```

---

## 26. POST /authz/permissions

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
| 504 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

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
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

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

## 27. GET /authz/permissions/{permissionId}/holders

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-governance`
- **Nombre:** Quiénes tienen un permiso, con el camino por el que lo tienen
- **Operation ID:** `AuthzGovernanceController_holders`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGovernanceController.holders](../../src/modules/authz/controllers/authz-governance.controller.ts)

### Descripción de negocio

Por rol (propio o heredado), por excepción directa o por grant de recurso; sólo lo vigente. Una fila por usuario.


### Descripción del sistema

NestJS resuelve `GET /authz/permissions/{permissionId}/holders` en `AuthzGovernanceController_holders`. El controlador delega en `AuthzGovernanceService.holdersOf`. No recibe body. El tipo de retorno estático es `Promise<PermissionHoldersPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `permissionId` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 400 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `source` | query | No | `string` | valores: `ROLE`, `USER`, `RESOURCE` | Sólo quienes lo tienen por ese camino | `ROLE` |
| `q` | query | No | `string` | longitud máxima 100 | Texto a buscar en el nombre visible | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/permissions/00000000-0000-4000-8000-000000000001/holders HTTP/1.1
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
GET /authz/permissions/00000000-0000-4000-8000-000000000001/holders?limit=50&cursor=valor-ejemplo&source=ROLE&q=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PermissionHoldersPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PermissionHoldersPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PermissionHoldersPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PermissionHoldersPageDto>` | No |
| 404 | No existe el permiso | `Promise<PermissionHoldersPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PermissionHoldersPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PermissionHoldersPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PermissionHoldersPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PermissionHoldersPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "nextCursor": "valor-ejemplo",
  "limit": 1,
  "permissionId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "userId": "00000000-0000-4000-8000-000000000001",
      "displayName": "Nombre de ejemplo",
      "accountStatus": "ACTIVE",
      "sources": [
        {
          "source": "ROLE",
          "effect": "ALLOW",
          "roleCode": "CODIGO_EJEMPLO",
          "viaRoleCode": "CODIGO_EJEMPLO",
          "resourceId": "00000000-0000-4000-8000-000000000001",
          "tenantId": "00000000-0000-4000-8000-000000000001"
        }
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `nextCursor` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `permissionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<PermissionHolderDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"userId":"00000000-0000-4000-8000-000000000001","displayName":"Nombre de ejemplo","accountStatus":"ACTIVE","sources":[{"source":"ROLE","effect":"ALLOW","roleCode":"CODIGO_EJEMPLO","viaRoleCode":"CODIGO_EJEMPLO","resourceId":"00000000-0000-4000-8000-000000000001","tenantId":"00000000-0000-4000-8000-000000000001"}]}]` |
| `items[].userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].displayName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].accountStatus` | Sí | `string` | valores: `ACTIVE`, `LOCKED`, `ANONYMIZED`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |
| `items[].sources` | Sí | `array<HolderSourceDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"source":"ROLE","effect":"ALLOW","roleCode":"CODIGO_EJEMPLO","viaRoleCode":"CODIGO_EJEMPLO","resourceId":"00000000-0000-4000-8000-000000000001","tenantId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].sources[].source` | Sí | `string` | valores: `ROLE`, `USER`, `RESOURCE` | Sin descripción específica en el contrato OpenAPI. | `ROLE` |
| `items[].sources[].effect` | Sí | `string` | valores: `ALLOW`, `DENY`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `ALLOW` |
| `items[].sources[].roleCode` | No | `string` | admite null | `ROLE`: rol que tiene asignado | `CODIGO_EJEMPLO` |
| `items[].sources[].viaRoleCode` | No | `string` | admite null | `ROLE`: rol que define el permiso (distinto del asignado si lo hereda de un rol padre) | `CODIGO_EJEMPLO` |
| `items[].sources[].resourceId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].sources[].tenantId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Permiso no encontrado | Excepción explícita en src/modules/authz/services/authz-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/permissions/{permissionId}/holders"
}
```

---

## 28. GET /authz/practitioners/me/access-requests

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-practitioner-requests`
- **Nombre:** Solicitudes de acceso enviadas y recibidas
- **Operation ID:** `AuthzPractitionerRequestsController_listAccessRequests`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzPractitionerRequestsController.listAccessRequests](../../src/modules/authz/controllers/authz-practitioner-requests.controller.ts)

### Descripción de negocio

Solicitudes de acceso enviadas y recibidas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Requests the practitioner sent and received.

### Descripción del sistema

NestJS resuelve `GET /authz/practitioners/me/access-requests` en `AuthzPractitionerRequestsController_listAccessRequests`. El controlador delega en `AuthzAccessRequestsReadService.listForPractitioner`. No recibe body. El tipo de retorno estático es `Promise<AccessRequestItemDto[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/practitioners/me/access-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /authz/practitioners/me/access-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AccessRequestItemDto[]>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<AccessRequestItemDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<AccessRequestItemDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<AccessRequestItemDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<AccessRequestItemDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<AccessRequestItemDto[]>` | No |
| 504 | Consulta completada correctamente. | `Promise<AccessRequestItemDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccessRequestItemDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "kind": "CABECERA",
    "direction": "RECEIVED",
    "counterpart": {
      "profileId": "00000000-0000-4000-8000-000000000001",
      "displayName": "Nombre de ejemplo"
    },
    "requestedAt": "2026-07-31T12:00:00.000Z",
    "decidedAt": "2026-07-31T12:00:00.000Z",
    "status": "PENDING",
    "requestedSpecialtyConceptIds": [
      "valor-ejemplo"
    ],
    "authorizedSpecialtyConceptIds": [
      "valor-ejemplo"
    ]
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/practitioners/me/access-requests"
}
```

---

## 29. POST /authz/practitioners/me/care-relationships/{id}/respond

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-practitioner-requests`
- **Nombre:** Aceptar o rechazar una solicitud de cabecera de un paciente
- **Operation ID:** `AuthzPractitionerRequestsController_respond`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzPractitionerRequestsController.respond](../../src/modules/authz/controllers/authz-practitioner-requests.controller.ts)

### Descripción de negocio

Aceptar o rechazar una solicitud de cabecera de un paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Accepts or rejects a primary-care request made by a patient.

### Descripción del sistema

NestJS resuelve `POST /authz/practitioners/me/care-relationships/{id}/respond` en `AuthzPractitionerRequestsController_respond`. El controlador delega en `AuthzPrimaryCareService.respondAsPractitioner`. Valida el body como `RespondPrimaryCareRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthzStatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RespondPrimaryCareRequestDto`; los campos opcionales se omiten.

```http
POST /authz/practitioners/me/care-relationships/00000000-0000-4000-8000-000000000001/respond HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "ACCEPT"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `ACCEPT`, `REJECT` | Decisión sobre la solicitud de cabecera | `ACCEPT` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/practitioners/me/care-relationships/00000000-0000-4000-8000-000000000001/respond HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "ACCEPT"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/authz/services/authz-primary-care.service.ts |
| 409 | `CONFLICT` | Su médico de cabecera cambió mientras se aceptaba. Vuelva a intentarlo. | Excepción explícita en src/modules/authz/services/authz-primary-care-sync.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La solicitud ya fue respondida o no es de cabecera | Excepción explícita en src/modules/authz/services/authz-primary-care.service.ts |
| 422 | `PRECONDITION_FAILED` | Esta solicitud no la inició el paciente: la responde él | Excepción explícita en src/modules/authz/services/authz-primary-care.service.ts |
| 422 | `PRECONDITION_FAILED` | Sólo la otra parte puede aceptar esta solicitud | Excepción explícita en src/modules/authz/services/authz-primary-care-sync.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/practitioners/me/care-relationships/{id}/respond"
}
```

---

## 30. GET /authz/resource-scope-grants

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-governance`
- **Nombre:** Permisos por alcance de recurso, paginados
- **Operation ID:** `AuthzGovernanceExtController_scopeGrants`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGovernanceExtController.scopeGrants](../../src/modules/authz/controllers/authz-governance-ext.controller.ts)

### Descripción de negocio

Permisos por alcance de recurso, paginados. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /authz/resource-scope-grants` en `AuthzGovernanceExtController_scopeGrants`. El controlador delega en `AuthzGovernanceExtService.resourceScopeGrants`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `subjectId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `resourceId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `permissionId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 400 | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/resource-scope-grants HTTP/1.1
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
GET /authz/resource-scope-grants?subjectId=00000000-0000-4000-8000-000000000001&resourceId=00000000-0000-4000-8000-000000000001&permissionId=00000000-0000-4000-8000-000000000001&limit=50&cursor=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
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
  "path": "/authz/resource-scope-grants"
}
```

---

## 31. POST /authz/resource-scope-grants

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
| 504 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

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
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

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

## 32. DELETE /authz/resource-scope-grants/{grantId}

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-governance`
- **Nombre:** Terminar la vigencia de un permiso por alcance de recurso
- **Operation ID:** `AuthzGovernanceExtController_endScopeGrant`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGovernanceExtController.endScopeGrant](../../src/modules/authz/controllers/authz-governance-ext.controller.ts)

### Descripción de negocio

Un permiso de efecto DENY exige `reason` en el cuerpo (422 RESOURCE_SCOPE_GRANT_DENY_REASON_REQUIRED); en un ALLOW es opcional. Con alcance de tenant sólo se alcanzan los permisos del propio tenant.


### Descripción del sistema

NestJS resuelve `DELETE /authz/resource-scope-grants/{grantId}` en `AuthzGovernanceExtController_endScopeGrant`. El controlador delega en `AuthzGovernanceExtService.endResourceScopeGrant`. Valida el body como `EndResourceScopeGrantDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `grantId` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EndResourceScopeGrantDto`; los campos opcionales se omiten.

```http
DELETE /authz/resource-scope-grants/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| `reason` | No | `string` | longitud mínima 10; longitud máxima 500 | Por qué se termina. Obligatorio si el permiso es de efecto DENY; opcional en un ALLOW. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
DELETE /authz/resource-scope-grants/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | RESOURCE_SCOPE_GRANT_NOT_FOUND (también si es de otro tenant) | `no declarado` | No |
| 409 | RESOURCE_SCOPE_GRANT_ALREADY_ENDED | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | RESOURCE_SCOPE_GRANT_DENY_REASON_REQUIRED | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | NOT_FOUND.message | Excepción explícita en src/modules/authz/services/authz-governance-ext.service.ts |
| 409 | `CONFLICT` | El permiso por alcance ya terminó su vigencia | Excepción explícita en src/modules/authz/services/authz-governance-ext.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Terminar un permiso de efecto DENY exige un motivo | Excepción explícita en src/modules/authz/services/authz-governance-ext.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/resource-scope-grants/{grantId}"
}
```

---

## 33. GET /authz/roles

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
| 504 | Consulta completada correctamente. | `Promise<AssignableRoleDto[]>` | No |

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

## 34. POST /authz/roles

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
| 504 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |

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
| 409 | `CONFLICT` | El código de rol está reservado por la plataforma | Excepción explícita en src/modules/authz/services/authz-roles.service.ts |
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

## 35. GET /authz/roles/{roleId}/field-permissions

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-governance`
- **Nombre:** Reglas de enmascaramiento de campos de un rol
- **Operation ID:** `AuthzGovernanceExtController_fieldPermissions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGovernanceExtController.fieldPermissions](../../src/modules/authz/controllers/authz-governance-ext.controller.ts)

### Descripción de negocio

Reglas de enmascaramiento de campos de un rol. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /authz/roles/{roleId}/field-permissions` en `AuthzGovernanceExtController_fieldPermissions`. El controlador delega en `AuthzGovernanceExtService.roleFieldPermissions`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `roleId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/roles/00000000-0000-4000-8000-000000000001/field-permissions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `roleId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /authz/roles/00000000-0000-4000-8000-000000000001/field-permissions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | ROLE_NOT_FOUND (también si el rol es de otra organización) | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Rol no encontrado | Excepción explícita en src/modules/authz/services/authz-governance-ext.service.ts |
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

## 36. PUT /authz/roles/{roleId}/field-permissions

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
| 504 | Operación completada correctamente. | `Promise<AuthzStatusResultDto>` | No |

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

## 37. GET /authz/roles/{roleId}/permissions

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-admin`
- **Nombre:** Permisos activos de un rol, con su efecto y ámbito
- **Operation ID:** `AuthzAdminController_rolePermissions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzAdminController.rolePermissions](../../src/modules/authz/controllers/authz-admin.controller.ts)

### Descripción de negocio

Permisos activos de un rol, con su efecto y ámbito. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /authz/roles/{roleId}/permissions` en `AuthzAdminController_rolePermissions`. El controlador delega en `AuthzAdminReadService.rolePermissions`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `roleId` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/roles/00000000-0000-4000-8000-000000000001/permissions HTTP/1.1
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
GET /authz/roles/00000000-0000-4000-8000-000000000001/permissions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | No existe el rol | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Rol no encontrado | Excepción explícita en src/modules/authz/services/authz-admin-read.service.ts |
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

## 38. PUT /authz/roles/{roleId}/permissions

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
| 504 | Operación completada correctamente. | `Promise<RoleResponseDto>` | No |

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

## 39. POST /authz/simulations

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-governance`
- **Nombre:** Simular una decisión de acceso con el PDP real
- **Operation ID:** `AuthzGovernanceController_simulate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGovernanceController.simulate](../../src/modules/authz/controllers/authz-governance.controller.ts)

### Descripción de negocio

Misma entrada y misma decisión que `POST /authz/decisions/evaluate`. No concede ni cambia nada.


### Descripción del sistema

NestJS resuelve `POST /authz/simulations` en `AuthzGovernanceController_simulate`. El controlador delega en `AuthzGovernanceService.simulate`. Valida el body como `SimulateDecisionDto` y consume `application/json`. El tipo de retorno estático es `Promise<SimulationResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SimulateDecisionDto`; los campos opcionales se omiten.

```http
POST /authz/simulations HTTP/1.1
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
| `resource` | Sí | `string` | longitud máxima 150 | Recurso protegido (debe casar con permissions.resource) | `valor-ejemplo` |
| `resourceType` | No | `string` | valores: `PATIENT`, `ENCOUNTER`, `DOCUMENT`, `RECORD` | Tipo de recurso concreto | `PATIENT` |
| `resourceId` | No | `string` | formato `uuid` | Id del recurso concreto | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Perfil de paciente si el recurso es clínico | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | No | `string` | formato `uuid` | Perfil de practicante del actor (habilita evaluación de relación asistencial C-06) | `00000000-0000-4000-8000-000000000001` |
| `purposeOfUse` | No | `string` | valores: `TREATMENT`, `PAYMENT`, `OPERATIONS`, `EMERGENCY` | Propósito de uso | `TREATMENT` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /authz/simulations HTTP/1.1
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
| 200 | Operación completada correctamente. | `Promise<SimulationResultDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<SimulationResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SimulationResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SimulationResultDto>` | No |
| 404 | No existe el usuario | `Promise<SimulationResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SimulationResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SimulationResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SimulationResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SimulationResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SimulationResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SimulationResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SimulationResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "simulated": true,
  "decision": {}
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `simulated` | Sí | `boolean` | valores: `true` | Siempre `true`: nada se aplicó ni se concedió | `true` |
| `decision` | Sí | `Function` | Sin restricción adicional declarada | La decisión que devuelve el PDP real, sin transformar: la misma que `POST /authz/decisions/evaluate` | `{}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/authz/services/authz-governance.service.ts |
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
  "path": "/authz/simulations"
}
```

---

## 40. POST /authz/tenants/{tenantId}/access-policies

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
| 504 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

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
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

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

## 41. GET /authz/users/{userId}/access-map

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-governance`
- **Nombre:** «Quién puede qué» de un usuario: roles, conteos y última revisión
- **Operation ID:** `AuthzGovernanceController_accessMap`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGovernanceController.accessMap](../../src/modules/authz/controllers/authz-governance.controller.ts)

### Descripción de negocio

«Quién puede qué» de un usuario: roles, conteos y última revisión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /authz/users/{userId}/access-map` en `AuthzGovernanceController_accessMap`. El controlador delega en `AuthzGovernanceService.accessMap`. No recibe body. El tipo de retorno estático es `Promise<AccessMapDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `userId` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/users/00000000-0000-4000-8000-000000000001/access-map HTTP/1.1
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
GET /authz/users/00000000-0000-4000-8000-000000000001/access-map HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AccessMapDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<AccessMapDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<AccessMapDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<AccessMapDto>` | No |
| 404 | No existe el usuario | `Promise<AccessMapDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<AccessMapDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<AccessMapDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<AccessMapDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccessMapDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "user": {
    "id": "00000000-0000-4000-8000-000000000001",
    "displayName": "Nombre de ejemplo",
    "accountStatus": "ACTIVE"
  },
  "globalRoles": [
    "valor-ejemplo"
  ],
  "assignments": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "roleId": "00000000-0000-4000-8000-000000000001",
      "roleCode": "CODIGO_EJEMPLO",
      "roleName": "Nombre de ejemplo",
      "roleScope": "SELF",
      "tenantId": {},
      "branchId": {},
      "practiceId": {},
      "status": "ACTIVE",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z",
      "isEffective": true,
      "appliesGlobally": true,
      "assignedByUserId": {},
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "counts": {
    "directGrants": 1,
    "resourceScopeGrants": 1,
    "restrictedFields": 1
  },
  "lastReview": {
    "id": "00000000-0000-4000-8000-000000000001",
    "userId": "00000000-0000-4000-8000-000000000001",
    "userDisplayName": "Nombre de ejemplo",
    "reviewerUserId": "00000000-0000-4000-8000-000000000001",
    "reviewerDisplayName": "Nombre de ejemplo",
    "reviewedAt": "2026-07-31T12:00:00.000Z"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `user` | Sí | `AccessMapUserDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","displayName":"Nombre de ejemplo","accountStatus":"ACTIVE"}` |
| `user.id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `user.displayName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `user.accountStatus` | Sí | `string` | valores: `ACTIVE`, `LOCKED`, `ANONYMIZED`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |
| `globalRoles` | Sí | `array<string>` | Sin restricción adicional declarada | Roles globales de `iam` activos | `["valor-ejemplo"]` |
| `assignments` | Sí | `array<UserRoleAssignmentDto>` | Sin restricción adicional declarada | Asignaciones de rol de `authz`, vigentes o no | `[{"id":"00000000-0000-4000-8000-000000000001","roleId":"00000000-0000-4000-8000-000000000001","roleCode":"CODIGO_EJEMPLO","roleName":"Nombre de ejemplo","roleScope":"SELF","tenantId":{},"branchId":{},"practiceId":{},"status":"ACTIVE","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z","isEffective":true,"appliesGlobally":true,"assignedByUserId":{},"createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `assignments[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].roleId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignments[].roleCode` | Sí | `string` | Sin restricción adicional declarada | Código que exige `@Roles(...)` | `CODIGO_EJEMPLO` |
| `assignments[].roleName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `assignments[].roleScope` | No | `string` | valores: `SELF`, `BRANCH`, `TENANT`, `GLOBAL`; admite null | Sin descripción específica en el contrato OpenAPI. | `SELF` |
| `assignments[].tenantId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `assignments[].branchId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `assignments[].practiceId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `assignments[].status` | Sí | `string` | valores: `ACTIVE`, `REVOKED`, `EXPIRED`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |
| `assignments[].validFrom` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignments[].validTo` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `assignments[].isEffective` | Sí | `boolean` | Sin restricción adicional declarada | `true` si la asignación está activa y su vigencia cubre el instante de la consulta: es la que llega al token | `true` |
| `assignments[].appliesGlobally` | Sí | `boolean` | Sin restricción adicional declarada | `true` si el rol es de ámbito global y se asignó sin tenant, sede ni consultorio: autoriza en las rutas sin tenant. Un rol global asignado con tenant no autoriza ahí | `true` |
| `assignments[].assignedByUserId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `assignments[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `counts` | Sí | `AccessMapCountsDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"directGrants":1,"resourceScopeGrants":1,"restrictedFields":1}` |
| `counts.directGrants` | Sí | `number` | Sin restricción adicional declarada | Excepciones de permiso por usuario vigentes | `1` |
| `counts.resourceScopeGrants` | Sí | `number` | Sin restricción adicional declarada | Grants sobre un recurso concreto vigentes | `1` |
| `counts.restrictedFields` | Sí | `number` | Sin restricción adicional declarada | Campos restringidos (sin lectura, sin escritura o enmascarados) por sus roles efectivos | `1` |
| `lastReview` | No | `AccessReviewDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","userId":"00000000-0000-4000-8000-000000000001","userDisplayName":"Nombre de ejemplo","reviewerUserId":"00000000-0000-4000-8000-000000000001","reviewerDisplayName":"Nombre de ejemplo","reviewedAt":"2026-07-31T12:00:00.000Z"}` |
| `lastReview.id` | No | `string` | formato `uuid` | Id del sello en la bitácora | `00000000-0000-4000-8000-000000000001` |
| `lastReview.userId` | No | `string` | formato `uuid` | Cuenta revisada | `00000000-0000-4000-8000-000000000001` |
| `lastReview.userDisplayName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lastReview.reviewerUserId` | No | `string` | formato `uuid` | Quien revisó | `00000000-0000-4000-8000-000000000001` |
| `lastReview.reviewerDisplayName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `lastReview.reviewedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/authz/services/authz-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/users/{userId}/access-map"
}
```

---

## 42. POST /authz/users/{userId}/access-reviews

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-governance`
- **Nombre:** Registrar que revisaste los accesos de una cuenta
- **Operation ID:** `AuthzGovernanceController_recordReview`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGovernanceController.recordReview](../../src/modules/authz/controllers/authz-governance.controller.ts)

### Descripción de negocio

Cada llamada suma una revisión (quién, a quién, cuándo). No cambia ningún permiso. Nadie revisa los propios.


### Descripción del sistema

NestJS resuelve `POST /authz/users/{userId}/access-reviews` en `AuthzGovernanceController_recordReview`. El controlador delega en `AuthzGovernanceService.recordReview`. No recibe body. El tipo de retorno estático es `Promise<AccessReviewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `userId` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /authz/users/00000000-0000-4000-8000-000000000001/access-reviews HTTP/1.1
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
POST /authz/users/00000000-0000-4000-8000-000000000001/access-reviews HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AccessReviewDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<AccessReviewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccessReviewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccessReviewDto>` | No |
| 404 | No existe el usuario | `Promise<AccessReviewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccessReviewDto>` | No |
| 412 | Es tu propia cuenta | `Promise<AccessReviewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccessReviewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccessReviewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccessReviewDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AccessReviewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccessReviewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "userDisplayName": "Nombre de ejemplo",
  "reviewerUserId": "00000000-0000-4000-8000-000000000001",
  "reviewerDisplayName": "Nombre de ejemplo",
  "reviewedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del sello en la bitácora | `00000000-0000-4000-8000-000000000001` |
| `userId` | Sí | `string` | formato `uuid` | Cuenta revisada | `00000000-0000-4000-8000-000000000001` |
| `userDisplayName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `reviewerUserId` | Sí | `string` | formato `uuid` | Quien revisó | `00000000-0000-4000-8000-000000000001` |
| `reviewerDisplayName` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `reviewedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/authz/services/authz-governance.service.ts |
| 422 | `PRECONDITION_FAILED` | Los accesos propios los revisa otra persona | Excepción explícita en src/modules/authz/services/authz-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/users/{userId}/access-reviews"
}
```

---

## 43. GET /authz/users/{userId}/permission-grants

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-governance`
- **Nombre:** Excepciones de permiso por usuario, paginadas
- **Operation ID:** `AuthzGovernanceController_directGrants`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGovernanceController.directGrants](../../src/modules/authz/controllers/authz-governance.controller.ts)

### Descripción de negocio

Excepciones de permiso por usuario, paginadas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /authz/users/{userId}/permission-grants` en `AuthzGovernanceController_directGrants`. El controlador delega en `AuthzGovernanceService.directGrants`. No recibe body. El tipo de retorno estático es `Promise<DirectGrantsPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `userId` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 400 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `show` | query | No | `string` | valores: `EFFECTIVE`, `ALL` | `EFFECTIVE`: activas y dentro de su vigencia. `ALL`: también las revocadas, vencidas y futuras | `EFFECTIVE` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/users/00000000-0000-4000-8000-000000000001/permission-grants HTTP/1.1
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
GET /authz/users/00000000-0000-4000-8000-000000000001/permission-grants?limit=50&cursor=valor-ejemplo&show=EFFECTIVE HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DirectGrantsPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<DirectGrantsPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DirectGrantsPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DirectGrantsPageDto>` | No |
| 404 | No existe el usuario | `Promise<DirectGrantsPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DirectGrantsPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DirectGrantsPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<DirectGrantsPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DirectGrantsPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "nextCursor": "valor-ejemplo",
  "limit": 1,
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "permissionId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "resource": "valor-ejemplo",
      "effect": "ALLOW",
      "scope": "valor-ejemplo",
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "reason": "Texto descriptivo de ejemplo",
      "status": "ACTIVE",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z",
      "isEffective": true,
      "grantedByUserId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `nextCursor` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items` | Sí | `array<DirectGrantDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","permissionId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","resource":"valor-ejemplo","effect":"ALLOW","scope":"valor-ejemplo","tenantId":"00000000-0000-4000-8000-000000000001","reason":"Texto descriptivo de ejemplo","status":"ACTIVE","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z","isEffective":true,"grantedByUserId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].permissionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].resource` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].effect` | Sí | `string` | valores: `ALLOW`, `DENY`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `ALLOW` |
| `items[].scope` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].tenantId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].reason` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `items[].status` | Sí | `string` | valores: `ACTIVE`, `REVOKED`, `EXPIRED`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |
| `items[].validFrom` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].validTo` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].isEffective` | Sí | `boolean` | Sin restricción adicional declarada | Activa y dentro de su vigencia: cuenta hoy | `true` |
| `items[].grantedByUserId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/authz/services/authz-governance.service.ts |
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

## 44. POST /authz/users/{userId}/permission-grants

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
| 504 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

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
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

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

## 45. GET /authz/users/{userId}/resource-scope-grants

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-governance`
- **Nombre:** Grants sobre un recurso concreto cuyo sujeto es el usuario, paginados
- **Operation ID:** `AuthzGovernanceController_scopeGrants`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGovernanceController.scopeGrants](../../src/modules/authz/controllers/authz-governance.controller.ts)

### Descripción de negocio

Grants sobre un recurso concreto cuyo sujeto es el usuario, paginados. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /authz/users/{userId}/resource-scope-grants` en `AuthzGovernanceController_scopeGrants`. El controlador delega en `AuthzGovernanceService.scopeGrants`. No recibe body. El tipo de retorno estático es `Promise<ScopeGrantsPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `userId` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 400 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `show` | query | No | `string` | valores: `EFFECTIVE`, `ALL` | `EFFECTIVE`: activas y dentro de su vigencia. `ALL`: también las revocadas, vencidas y futuras | `EFFECTIVE` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/users/00000000-0000-4000-8000-000000000001/resource-scope-grants HTTP/1.1
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
GET /authz/users/00000000-0000-4000-8000-000000000001/resource-scope-grants?limit=50&cursor=valor-ejemplo&show=EFFECTIVE HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ScopeGrantsPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<ScopeGrantsPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ScopeGrantsPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ScopeGrantsPageDto>` | No |
| 404 | No existe el usuario | `Promise<ScopeGrantsPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ScopeGrantsPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ScopeGrantsPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ScopeGrantsPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ScopeGrantsPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "nextCursor": "valor-ejemplo",
  "limit": 1,
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "permissionId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "resourceType": "PATIENT",
      "resourceId": "00000000-0000-4000-8000-000000000001",
      "effect": "ALLOW",
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z",
      "isEffective": true,
      "grantedByUserId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `nextCursor` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items` | Sí | `array<ScopeGrantDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","permissionId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","resourceType":"PATIENT","resourceId":"00000000-0000-4000-8000-000000000001","effect":"ALLOW","tenantId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z","isEffective":true,"grantedByUserId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].permissionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].resourceType` | Sí | `string` | valores: `PATIENT`, `ENCOUNTER`, `DOCUMENT`, `RECORD`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `PATIENT` |
| `items[].resourceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].effect` | Sí | `string` | valores: `ALLOW`, `DENY`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `ALLOW` |
| `items[].tenantId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].validFrom` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].validTo` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].isEffective` | Sí | `boolean` | Sin restricción adicional declarada | Dentro de su vigencia: cuenta hoy | `true` |
| `items[].grantedByUserId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/authz/services/authz-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/users/{userId}/resource-scope-grants"
}
```

---

## 46. GET /authz/users/{userId}/restricted-fields

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-governance`
- **Nombre:** Campos restringidos que alcanzan al usuario por sus roles efectivos
- **Operation ID:** `AuthzGovernanceController_restrictedFields`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzGovernanceController.restrictedFields](../../src/modules/authz/controllers/authz-governance.controller.ts)

### Descripción de negocio

Sin lectura, sin escritura o enmascarados. Incluye las reglas de los roles padre que hereda.


### Descripción del sistema

NestJS resuelve `GET /authz/users/{userId}/restricted-fields` en `AuthzGovernanceController_restrictedFields`. El controlador delega en `AuthzGovernanceService.restrictedFields`. No recibe body. El tipo de retorno estático es `Promise<RestrictedFieldsPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `userId` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 400 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `show` | query | No | `string` | valores: `EFFECTIVE`, `ALL` | `EFFECTIVE`: activas y dentro de su vigencia. `ALL`: también las revocadas, vencidas y futuras | `EFFECTIVE` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/users/00000000-0000-4000-8000-000000000001/restricted-fields HTTP/1.1
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
GET /authz/users/00000000-0000-4000-8000-000000000001/restricted-fields?limit=50&cursor=valor-ejemplo&show=EFFECTIVE HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RestrictedFieldsPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<RestrictedFieldsPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<RestrictedFieldsPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<RestrictedFieldsPageDto>` | No |
| 404 | No existe el usuario | `Promise<RestrictedFieldsPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<RestrictedFieldsPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<RestrictedFieldsPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<RestrictedFieldsPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RestrictedFieldsPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "nextCursor": "valor-ejemplo",
  "limit": 1,
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "roleId": "00000000-0000-4000-8000-000000000001",
      "roleCode": "CODIGO_EJEMPLO",
      "entity": "valor-ejemplo",
      "columnName": "Nombre de ejemplo",
      "canRead": true,
      "canWrite": true,
      "maskStrategy": "REDACT"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `nextCursor` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items` | Sí | `array<RestrictedFieldDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","roleId":"00000000-0000-4000-8000-000000000001","roleCode":"CODIGO_EJEMPLO","entity":"valor-ejemplo","columnName":"Nombre de ejemplo","canRead":true,"canWrite":true,"maskStrategy":"REDACT"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].roleId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].roleCode` | Sí | `string` | Sin restricción adicional declarada | Rol que define la regla (puede ser un rol padre heredado) | `CODIGO_EJEMPLO` |
| `items[].entity` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].columnName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].canRead` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].canWrite` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].maskStrategy` | No | `string` | valores: `REDACT`, `HASH`, `PARTIAL`, `NULLIFY`; admite null | Sin descripción específica en el contrato OpenAPI. | `REDACT` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/authz/services/authz-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/users/{userId}/restricted-fields"
}
```

---

## 47. GET /authz/users/{userId}/role-assignments

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-admin`
- **Nombre:** Asignaciones de rol de un usuario, activas o no
- **Operation ID:** `AuthzAdminController_assignmentsOf`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzAdminController.assignmentsOf](../../src/modules/authz/controllers/authz-admin.controller.ts)

### Descripción de negocio

`isEffective` dice cuáles llegan hoy al token. `appliesGlobally` dice si un rol de ámbito global se asignó sin tenant, que es la condición para que autorice en las rutas sin tenant.


### Descripción del sistema

NestJS resuelve `GET /authz/users/{userId}/role-assignments` en `AuthzAdminController_assignmentsOf`. El controlador delega en `AuthzAdminReadService.assignmentsOf`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `userId` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/users/00000000-0000-4000-8000-000000000001/role-assignments HTTP/1.1
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
GET /authz/users/00000000-0000-4000-8000-000000000001/role-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | No existe el usuario | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/authz/services/authz-admin-read.service.ts |
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

## 48. POST /authz/users/{userId}/role-assignments

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
| 504 | Operación completada correctamente. | `Promise<AuthzIdResponseDto>` | No |

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
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

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
| 422 | `PRECONDITION_FAILED` | Un rol de ámbito global se asigna sin tenant, sede ni consultorio | Excepción explícita en src/modules/authz/services/authz-grants.service.ts |
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

## 49. DELETE /authz/users/{userId}/role-assignments/{assignmentId}

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-admin`
- **Nombre:** Revocar una asignación de rol (revocación lógica: la fila queda como historia)
- **Operation ID:** `AuthzAdminController_revoke`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzAdminController.revoke](../../src/modules/authz/controllers/authz-admin.controller.ts)

### Descripción de negocio

Revocar una asignación de rol (revocación lógica: la fila queda como historia). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `DELETE /authz/users/{userId}/role-assignments/{assignmentId}` en `AuthzAdminController_revoke`. El controlador delega en `AuthzAssignmentRevocationService.revoke`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `userId` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignmentId` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /authz/users/00000000-0000-4000-8000-000000000001/role-assignments/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
DELETE /authz/users/00000000-0000-4000-8000-000000000001/role-assignments/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | No existe, o es de otro usuario | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 412 | La asignación no está activa | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Asignación de rol no encontrada | Excepción explícita en src/modules/authz/services/authz-assignment-revocation.service.ts |
| 422 | `PRECONDITION_FAILED` | La asignación de rol no está activa | Excepción explícita en src/modules/authz/services/authz-assignment-revocation.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/authz/users/{userId}/role-assignments/{assignmentId}"
}
```

---

## 50. GET /authz/users/directory

- **Módulo:** `authz`
- **Etiqueta OpenAPI:** `authz-admin`
- **Nombre:** Directorio de usuarios por tipo, con roles y permisos efectivos
- **Operation ID:** `AuthzUsersDirectoryController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthzUsersDirectoryController.list](../../src/modules/authz/controllers/authz-users-directory.controller.ts)

### Descripción de negocio

Paginado por cursor. Sin contraseñas, documentos ni correo completo. Cada consulta queda sellada en la auditoría.


### Descripción del sistema

NestJS resuelve `GET /authz/users/directory` en `AuthzUsersDirectoryController_list`. El controlador delega en `AuthzUsersDirectoryService.list`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `type` | query | No | `string` | valores: `PATIENT`, `PRACTITIONER`, `PHARMACY`, `LABORATORY`, `INTERNAL`, `OTHER` | Sin descripción específica en OpenAPI. | `PATIENT` |
| `status` | query | No | `string` | formato `uuid` | Concept id of iam.users.status_concept_id | `00000000-0000-4000-8000-000000000001` |
| `roleCode` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `SECURITY_ADMIN` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Opaque cursor of the previous page | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /authz/users/directory HTTP/1.1
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
GET /authz/users/directory?type=PATIENT&status=00000000-0000-4000-8000-000000000001&roleCode=SECURITY_ADMIN&cursor=valor-ejemplo&limit=50 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
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
  "path": "/authz/users/directory"
}
```

---

