<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `directory`

Referencia exhaustiva de 10 operación(es) del módulo `directory`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `directory-admin-tenants`, `directory-tenants`
- **Controladores:** `AdminTenantsController`, `TenantsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /admin/tenants](#1-post-admin-tenants) — Aprovisionar un tenant raíz con su membership owner
2. [POST /admin/tenants/{tenantId}/suspend](#2-post-admin-tenants-tenantid-suspend) — Suspender un tenant con cascada de revocación
3. [POST /admin/tenants/{tenantId}/verification](#3-post-admin-tenants-tenantid-verification) — Verificar y activar un tenant
4. [POST /tenants/{tenantId}/branches](#4-post-tenants-tenantid-branches) — Crear una branch / sede física con geolocalización
5. [POST /tenants/{tenantId}/child-tenants](#5-post-tenants-tenantid-child-tenants) — Crear una organización hija / sub-tenant
6. [POST /tenants/{tenantId}/memberships](#6-post-tenants-tenantid-memberships) — Incorporar un usuario al tenant (membership)
7. [POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments](#7-post-tenants-tenantid-memberships-membershipid-branch-assignments) — Asignar la membresía a una branch
8. [POST /tenants/{tenantId}/memberships/{membershipId}/offboard](#8-post-tenants-tenantid-memberships-membershipid-offboard) — Revocar / offboarding de un miembro
9. [PATCH /tenants/{tenantId}/memberships/{membershipId}/role](#9-patch-tenants-tenantid-memberships-membershipid-role) — Cambiar rol / scope de la membresía
10. [POST /tenants/{tenantId}/memberships/{membershipId}/transfer](#10-post-tenants-tenantid-memberships-membershipid-transfer) — Transferir la membresía entre branches

---

## 1. POST /admin/tenants

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-admin-tenants`
- **Nombre:** Aprovisionar un tenant raíz con su membership owner
- **Operation ID:** `AdminTenantsController_provision`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminTenantsController.provision](../../src/modules/directory/controllers/admin-tenants.controller.ts)

### Descripción de negocio

Aprovisionar un tenant raíz con su membership owner. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/tenants` en `AdminTenantsController_provision`. El controlador delega en `DirectoryTenantsService.provision`. Valida el body como `CreateTenantDto` y consume `application/json`. El tipo de retorno estático es `Promise<TenantResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTenantDto`; los campos opcionales se omiten.

```http
POST /admin/tenants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "ownerUserId": "00000000-0000-4000-8000-000000000001",
  "tenantType": "PROVIDER"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPERADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único global del tenant | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | longitud mínima 1; longitud máxima 300 | Razón social / nombre legal | `Nombre de ejemplo` |
| `ownerUserId` | Sí | `string` | formato `uuid` | Usuario que será owner inicial del tenant | `00000000-0000-4000-8000-000000000001` |
| `tradeName` | No | `string` | longitud máxima 300 | Nombre comercial | `Nombre de ejemplo` |
| `tenantType` | Sí | `string` | valores: `PROVIDER`, `PAYER`, `BROKER`, `UNIVERSITY`, `PHARMACY`, `HOSPITAL`, `MEDICAL_OFFICE`, `NURSING`, `HEALTH_OTHER`, `HEALTH_BUSINESS` | Tipo de organización. Obligatorio: cada tipo exige sus propios datos (PAYER el bloque `payer`, BROKER el bloque `broker`; el resto —PROVIDER, UNIVERSITY, PHARMACY, HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER, HEALTH_BUSINESS— país y jurisdicción). | `PROVIDER` |
| `tenantTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de tenant. Escotilla para tipos fuera del catálogo interno; si viene `tenantType`, este campo se ignora. | `00000000-0000-4000-8000-000000000001` |
| `legalEntityTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de entidad legal | `00000000-0000-4000-8000-000000000001` |
| `dataResidencyRegionConceptId` | No | `string` | formato `uuid` | Concept id de la región de residencia de datos | `00000000-0000-4000-8000-000000000001` |
| `timeZone` | No | `string` | longitud máxima 100 | Zona horaria IANA | `America/La_Paz` |
| `payer` | No | `PayerProfileDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"carrierCode":"CODIGO_EJEMPLO","regulatorIdentifier":"valor-ejemplo","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001"}` |
| `payer.carrierCode` | No | `string` | longitud mínima 1; longitud máxima 60 | Código de la aseguradora | `CODIGO_EJEMPLO` |
| `payer.regulatorIdentifier` | No | `string` | longitud mínima 1; longitud máxima 100 | Identificador ante el regulador de seguros | `valor-ejemplo` |
| `payer.jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `broker` | No | `BrokerProfileDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"brokerCode":"CODIGO_EJEMPLO","licenseNumber":"valor-ejemplo","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001"}` |
| `broker.brokerCode` | No | `string` | longitud mínima 1; longitud máxima 60 | Código del corredor | `CODIGO_EJEMPLO` |
| `broker.licenseNumber` | No | `string` | longitud mínima 1; longitud máxima 100 | Número de licencia de intermediación | `valor-ejemplo` |
| `broker.jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `countryConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/tenants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "ownerUserId": "00000000-0000-4000-8000-000000000001",
  "tradeName": "Nombre de ejemplo",
  "tenantType": "PROVIDER",
  "tenantTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "legalEntityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "dataResidencyRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "timeZone": "America/La_Paz",
  "payer": {
    "carrierCode": "CODIGO_EJEMPLO",
    "regulatorIdentifier": "valor-ejemplo",
    "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
  },
  "broker": {
    "brokerCode": "CODIGO_EJEMPLO",
    "licenseNumber": "valor-ejemplo",
    "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
  },
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TenantResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TenantResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "parentTenantId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | Sin restricción adicional declarada | Valor de legal name mantenido por la instancia. | `Nombre de ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del tenant | `00000000-0000-4000-8000-000000000001` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id del estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `parentTenantId` | No | `string` | formato `uuid` | Tenant padre si es sub-tenant | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPERADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El código de tenant ya existe | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo PAYER exige el bloque `payer` | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo BROKER exige el bloque `broker` | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo ${tenantType} exige país y jurisdicción | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El bloque `payer` sólo corresponde a un tenant de tipo PAYER | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El bloque `broker` sólo corresponde a un tenant de tipo BROKER | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Los conceptos declarados no existen en el catálogo de terminología | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/tenants"
}
```

---

## 2. POST /admin/tenants/{tenantId}/suspend

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-admin-tenants`
- **Nombre:** Suspender un tenant con cascada de revocación
- **Operation ID:** `AdminTenantsController_suspend`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminTenantsController.suspend](../../src/modules/directory/controllers/admin-tenants.controller.ts)

### Descripción de negocio

Suspender un tenant con cascada de revocación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/tenants/{tenantId}/suspend` en `AdminTenantsController_suspend`. El controlador delega en `DirectoryTenantsService.suspend`. Valida el body como `SuspendTenantDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SuspendTenantDto`; los campos opcionales se omiten.

```http
POST /admin/tenants/00000000-0000-4000-8000-000000000001/suspend HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPERADMIN`.
- Deben ser UUID válidos: `tenantId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | longitud mínima 1; longitud máxima 500 | Motivo de la suspensión (queda en auditoría) | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/tenants/00000000-0000-4000-8000-000000000001/suspend HTTP/1.1
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
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPERADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Tenant no encontrado | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El tenant no está activo | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/tenants/{tenantId}/suspend"
}
```

---

## 3. POST /admin/tenants/{tenantId}/verification

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-admin-tenants`
- **Nombre:** Verificar y activar un tenant
- **Operation ID:** `AdminTenantsController_verify`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminTenantsController.verify](../../src/modules/directory/controllers/admin-tenants.controller.ts)

### Descripción de negocio

Verificar y activar un tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/tenants/{tenantId}/verification` en `AdminTenantsController_verify`. El controlador delega en `DirectoryTenantsService.verify`. Valida el body como `VerifyTenantDto` y consume `application/json`. El tipo de retorno estático es `Promise<TenantResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VerifyTenantDto`; los campos opcionales se omiten.

```http
POST /admin/tenants/00000000-0000-4000-8000-000000000001/verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
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
| `countryConceptId` | No | `string` | formato `uuid` | Concept id del país confirmado | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Concept id de la jurisdicción confirmada | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/tenants/00000000-0000-4000-8000-000000000001/verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TenantResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "parentTenantId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | Sin restricción adicional declarada | Valor de legal name mantenido por la instancia. | `Nombre de ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del tenant | `00000000-0000-4000-8000-000000000001` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id del estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `parentTenantId` | No | `string` | formato `uuid` | Tenant padre si es sub-tenant | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Tenant no encontrado | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El tenant no está pendiente de verificación | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/tenants/{tenantId}/verification"
}
```

---

## 4. POST /tenants/{tenantId}/branches

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Crear una branch / sede física con geolocalización
- **Operation ID:** `TenantsController_createBranch`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.createBranch](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Crear una branch / sede física con geolocalización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/branches` en `TenantsController_createBranch`. El controlador delega en `DirectoryBranchesService.create`. Valida el body como `CreateBranchDto` y consume `application/json`. El tipo de retorno estático es `Promise<BranchResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateBranchDto`; los campos opcionales se omiten.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/branches HTTP/1.1
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
- Deben ser UUID válidos: `tenantId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código de la sede, único dentro del tenant | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 300 | Nombre de la sede | `Nombre de ejemplo` |
| `branchType` | No | `string` | valores: `CLINIC`, `OFFICE` | Tipo de sede | `CLINIC` |
| `timeZone` | No | `string` | longitud máxima 100 | Zona horaria IANA | `America/La_Paz` |
| `latitude` | No | `number` | mínimo -90; máximo 90 | Latitud geográfica | `-12.0464` |
| `longitude` | No | `number` | mínimo -180; máximo 180 | Longitud geográfica | `-77.0428` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/branches HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "branchType": "CLINIC",
  "timeZone": "America/La_Paz",
  "latitude": -12.0464,
  "longitude": -77.0428
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BranchResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BranchResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BranchResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado de la branch | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Tenant no encontrado | Excepción explícita en src/modules/directory/services/directory-branches.service.ts |
| 409 | `CONFLICT` | Ya existe una branch con ese código en el tenant | Excepción explícita en src/modules/directory/services/directory-branches.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El tenant no está activo | Excepción explícita en src/modules/directory/services/directory-branches.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/branches"
}
```

---

## 5. POST /tenants/{tenantId}/child-tenants

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Crear una organización hija / sub-tenant
- **Operation ID:** `TenantsController_createChild`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.createChild](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Crear una organización hija / sub-tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/child-tenants` en `TenantsController_createChild`. El controlador delega en `DirectoryTenantsService.createChild`. Valida el body como `CreateChildTenantDto` y consume `application/json`. El tipo de retorno estático es `Promise<TenantResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateChildTenantDto`; los campos opcionales se omiten.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/child-tenants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "adminUserId": "00000000-0000-4000-8000-000000000001",
  "tenantType": "PROVIDER"
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
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único global del sub-tenant | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | longitud mínima 1; longitud máxima 300 | Razón social / nombre legal del sub-tenant | `Nombre de ejemplo` |
| `adminUserId` | Sí | `string` | formato `uuid` | Usuario administrador inicial del sub-tenant | `00000000-0000-4000-8000-000000000001` |
| `tenantType` | Sí | `string` | valores: `PROVIDER`, `PAYER`, `BROKER`, `UNIVERSITY`, `PHARMACY`, `HOSPITAL`, `MEDICAL_OFFICE`, `NURSING`, `HEALTH_OTHER`, `HEALTH_BUSINESS` | Tipo de organización. Obligatorio: cada tipo exige sus propios datos (PAYER el bloque `payer`, BROKER el bloque `broker`; el resto —PROVIDER, UNIVERSITY, PHARMACY, HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER, HEALTH_BUSINESS— país y jurisdicción). | `PROVIDER` |
| `tenantTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de tenant. Si viene `tenantType`, se ignora. | `00000000-0000-4000-8000-000000000001` |
| `legalEntityTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de entidad legal | `00000000-0000-4000-8000-000000000001` |
| `dataResidencyRegionConceptId` | No | `string` | formato `uuid` | Región de residencia de datos (por defecto hereda la del padre) | `00000000-0000-4000-8000-000000000001` |
| `payer` | No | `PayerProfileDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"carrierCode":"CODIGO_EJEMPLO","regulatorIdentifier":"valor-ejemplo","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001"}` |
| `payer.carrierCode` | No | `string` | longitud mínima 1; longitud máxima 60 | Código de la aseguradora | `CODIGO_EJEMPLO` |
| `payer.regulatorIdentifier` | No | `string` | longitud mínima 1; longitud máxima 100 | Identificador ante el regulador de seguros | `valor-ejemplo` |
| `payer.jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `broker` | No | `BrokerProfileDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"brokerCode":"CODIGO_EJEMPLO","licenseNumber":"valor-ejemplo","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001"}` |
| `broker.brokerCode` | No | `string` | longitud mínima 1; longitud máxima 60 | Código del corredor | `CODIGO_EJEMPLO` |
| `broker.licenseNumber` | No | `string` | longitud mínima 1; longitud máxima 100 | Número de licencia de intermediación | `valor-ejemplo` |
| `broker.jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `countryConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/child-tenants HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "adminUserId": "00000000-0000-4000-8000-000000000001",
  "tenantType": "PROVIDER",
  "tenantTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "legalEntityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "dataResidencyRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "payer": {
    "carrierCode": "CODIGO_EJEMPLO",
    "regulatorIdentifier": "valor-ejemplo",
    "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
  },
  "broker": {
    "brokerCode": "CODIGO_EJEMPLO",
    "licenseNumber": "valor-ejemplo",
    "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
  },
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TenantResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TenantResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TenantResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "legalName": "Nombre de ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "parentTenantId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `legalName` | Sí | `string` | Sin restricción adicional declarada | Valor de legal name mantenido por la instancia. | `Nombre de ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del tenant | `00000000-0000-4000-8000-000000000001` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Concept id del estado de verificación | `00000000-0000-4000-8000-000000000001` |
| `parentTenantId` | No | `string` | formato `uuid` | Tenant padre si es sub-tenant | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Tenant padre no encontrado | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 409 | `CONFLICT` | El código de tenant ya existe | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El tenant padre no está activo | Excepción explícita en src/modules/directory/services/directory-tenants.service.ts |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo PAYER exige el bloque `payer` | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo BROKER exige el bloque `broker` | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo ${tenantType} exige país y jurisdicción | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El bloque `payer` sólo corresponde a un tenant de tipo PAYER | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El bloque `broker` sólo corresponde a un tenant de tipo BROKER | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Los conceptos declarados no existen en el catálogo de terminología | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/child-tenants"
}
```

---

## 6. POST /tenants/{tenantId}/memberships

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Incorporar un usuario al tenant (membership)
- **Operation ID:** `TenantsController_invite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.invite](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Incorporar un usuario al tenant (membership). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/memberships` en `TenantsController_invite`. El controlador delega en `DirectoryMembershipsService.invite`. Valida el body como `DirectoryCreateMembershipDto` y consume `application/json`. El tipo de retorno estático es `Promise<MembershipResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DirectoryCreateMembershipDto`; los campos opcionales se omiten.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001"
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
| `userId` | Sí | `string` | formato `uuid` | Usuario a incorporar al tenant | `00000000-0000-4000-8000-000000000001` |
| `role` | No | `string` | valores: `OWNER`, `ADMIN`, `STAFF` | Rol dentro del tenant | `OWNER` |
| `accessScope` | No | `string` | valores: `ALL_TENANT`, `BRANCH` | Scope de acceso | `ALL_TENANT` |
| `primaryBranchId` | No | `string` | formato `uuid` | Branch primaria opcional | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001",
  "role": "OWNER",
  "accessScope": "ALL_TENANT",
  "primaryBranchId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MembershipResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MembershipResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "currentTierId": "00000000-0000-4000-8000-000000000001",
  "pointsBalance": "valor-ejemplo",
  "lifetimePoints": "valor-ejemplo",
  "alreadyEnrolled": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `currentTierId` | No | `string` | formato `uuid` | Identificador asociado a current tier. | `00000000-0000-4000-8000-000000000001` |
| `pointsBalance` | Sí | `string` | Sin restricción adicional declarada | Saldo de puntos | `valor-ejemplo` |
| `lifetimePoints` | Sí | `string` | Sin restricción adicional declarada | Puntos acumulados de por vida | `valor-ejemplo` |
| `alreadyEnrolled` | Sí | `boolean` | Sin restricción adicional declarada | true si ya estaba inscrito: la inscripción es idempotente | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 403 | `FORBIDDEN` | Sólo un OWNER de la organización o la plataforma pueden cambiar quién la posee | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 409 | `CONFLICT` | El usuario ya tiene una membresía activa en el tenant | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
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
  "path": "/tenants/{tenantId}/memberships"
}
```

---

## 7. POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Asignar la membresía a una branch
- **Operation ID:** `TenantsController_assignBranch`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.assignBranch](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Asignar la membresía a una branch. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/memberships/{membershipId}/branch-assignments` en `TenantsController_assignBranch`. El controlador delega en `DirectoryMembershipsService.assignBranch`. Valida el body como `BranchAssignmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<BranchMembershipResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `membershipId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BranchAssignmentDto`; los campos opcionales se omiten.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/branch-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "branchId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`, `membershipId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `branchId` | Sí | `string` | formato `uuid` | Branch a la que se asigna la membresía | `00000000-0000-4000-8000-000000000001` |
| `localRoleConceptId` | No | `string` | formato `uuid` | Concept id del rol local en la branch | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/branch-assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "branchId": "00000000-0000-4000-8000-000000000001",
  "localRoleConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BranchMembershipResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BranchMembershipResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantMembershipId": "00000000-0000-4000-8000-000000000001",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "localRole": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `tenantMembershipId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant membership. | `00000000-0000-4000-8000-000000000001` |
| `branchId` | Sí | `string` | formato `uuid` | Identificador asociado a branch. | `00000000-0000-4000-8000-000000000001` |
| `localRole` | No | `string` | formato `uuid` | Concept id del rol local | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 404 | `NOT_FOUND` | Branch no encontrada | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 409 | `CONFLICT` | La membresía ya está asignada a esa branch | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La membresía no está activa | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 422 | `PRECONDITION_FAILED` | La branch no pertenece al tenant | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/memberships/{membershipId}/branch-assignments"
}
```

---

## 8. POST /tenants/{tenantId}/memberships/{membershipId}/offboard

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Revocar / offboarding de un miembro
- **Operation ID:** `TenantsController_offboard`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.offboard](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Revocar / offboarding de un miembro. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/memberships/{membershipId}/offboard` en `TenantsController_offboard`. El controlador delega en `DirectoryMembershipsService.offboard`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `membershipId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/offboard HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`, `membershipId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/offboard HTTP/1.1
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
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 403 | `FORBIDDEN` | Sólo un OWNER de la organización o la plataforma pueden cambiar quién la posee | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 422 | `PRECONDITION_FAILED` | La membresía no está activa | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 422 | `PRECONDITION_FAILED` | No se puede quitar al último OWNER de la organización: designe otro OWNER primero | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/memberships/{membershipId}/offboard"
}
```

---

## 9. PATCH /tenants/{tenantId}/memberships/{membershipId}/role

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Cambiar rol / scope de la membresía
- **Operation ID:** `TenantsController_changeRole`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.changeRole](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Cambiar rol / scope de la membresía. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /tenants/{tenantId}/memberships/{membershipId}/role` en `TenantsController_changeRole`. El controlador delega en `DirectoryMembershipsService.changeRole`. Valida el body como `ChangeMembershipRoleDto` y consume `application/json`. El tipo de retorno estático es `Promise<MembershipResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `membershipId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ChangeMembershipRoleDto`; los campos opcionales se omiten.

```http
PATCH /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/role HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`, `membershipId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `role` | No | `string` | valores: `OWNER`, `ADMIN`, `STAFF` | Nuevo rol de tenant | `OWNER` |
| `accessScope` | No | `string` | valores: `ALL_TENANT`, `BRANCH` | Nuevo scope de acceso | `ALL_TENANT` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/role HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "role": "OWNER",
  "accessScope": "ALL_TENANT"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MembershipResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "currentTierId": "00000000-0000-4000-8000-000000000001",
  "pointsBalance": "valor-ejemplo",
  "lifetimePoints": "valor-ejemplo",
  "alreadyEnrolled": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `currentTierId` | No | `string` | formato `uuid` | Identificador asociado a current tier. | `00000000-0000-4000-8000-000000000001` |
| `pointsBalance` | Sí | `string` | Sin restricción adicional declarada | Saldo de puntos | `valor-ejemplo` |
| `lifetimePoints` | Sí | `string` | Sin restricción adicional declarada | Puntos acumulados de por vida | `valor-ejemplo` |
| `alreadyEnrolled` | Sí | `boolean` | Sin restricción adicional declarada | true si ya estaba inscrito: la inscripción es idempotente | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 403 | `FORBIDDEN` | Sólo un OWNER de la organización o la plataforma pueden cambiar quién la posee | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Debe indicar un nuevo rol o scope | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 422 | `PRECONDITION_FAILED` | La membresía no está activa | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 422 | `PRECONDITION_FAILED` | No se puede quitar al último OWNER de la organización: designe otro OWNER primero | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/memberships/{membershipId}/role"
}
```

---

## 10. POST /tenants/{tenantId}/memberships/{membershipId}/transfer

- **Módulo:** `directory`
- **Etiqueta OpenAPI:** `directory-tenants`
- **Nombre:** Transferir la membresía entre branches
- **Operation ID:** `TenantsController_transfer`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TenantsController.transfer](../../src/modules/directory/controllers/tenants.controller.ts)

### Descripción de negocio

Transferir la membresía entre branches. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /tenants/{tenantId}/memberships/{membershipId}/transfer` en `TenantsController_transfer`. El controlador delega en `DirectoryMembershipsService.transfer`. Valida el body como `TransferMembershipDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `membershipId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `TransferMembershipDto`; los campos opcionales se omiten.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/transfer HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fromBranchId": "00000000-0000-4000-8000-000000000001",
  "toBranchId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`, `membershipId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fromBranchId` | Sí | `string` | formato `uuid` | Branch de origen (se cierra su asignación) | `00000000-0000-4000-8000-000000000001` |
| `toBranchId` | Sí | `string` | formato `uuid` | Branch de destino (nueva asignación activa) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tenants/00000000-0000-4000-8000-000000000001/memberships/00000000-0000-4000-8000-000000000001/transfer HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fromBranchId": "00000000-0000-4000-8000-000000000001",
  "toBranchId": "00000000-0000-4000-8000-000000000001"
}
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
| 413 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
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
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 404 | `NOT_FOUND` | No hay asignación activa en la branch de origen | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 404 | `NOT_FOUND` | Branch no encontrada | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La membresía no está activa | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 422 | `PRECONDITION_FAILED` | La branch no pertenece al tenant | Excepción explícita en src/modules/directory/services/directory-memberships.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tenants/{tenantId}/memberships/{membershipId}/transfer"
}
```

---

