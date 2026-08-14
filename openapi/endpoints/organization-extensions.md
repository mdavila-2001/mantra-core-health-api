<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `organization_extensions`

Referencia exhaustiva de 9 operación(es) del módulo `organization_extensions`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `orgext-affiliations`, `orgext-data-boundaries`, `orgext-facility-licenses`, `orgext-hospitals`
- **Controladores:** `OrgextAffiliationsController`, `OrgextDataBoundariesController`, `OrgextFacilityLicensesController`, `OrgextHospitalsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /orgext/affiliations](#1-post-orgext-affiliations) — Declarar afiliación entre organizaciones
2. [POST /orgext/affiliations/{id}/terminate](#2-post-orgext-affiliations-id-terminate) — Terminar afiliación y revocar acceso
3. [POST /orgext/data-boundaries](#3-post-orgext-data-boundaries) — Definir frontera de datos (residencia/RLS)
4. [POST /orgext/facility-licenses](#4-post-orgext-facility-licenses) — Registrar licencia de instalación
5. [POST /orgext/facility-licenses/{id}/verify](#5-post-orgext-facility-licenses-id-verify) — Verificar / rechazar licencia
6. [POST /orgext/hospitals](#6-post-orgext-hospitals) — Especializar practice/tenant como hospital
7. [POST /orgext/hospitals/{id}/activate](#7-post-orgext-hospitals-id-activate) — Activar hospital y publicar perfil
8. [POST /orgext/hospitals/{id}/service-lines](#8-post-orgext-hospitals-id-service-lines) — Definir línea de servicio hospitalaria
9. [DELETE /orgext/hospitals/{id}/service-lines/{lineId}](#9-delete-orgext-hospitals-id-service-lines-lineid) — Retirar (soft-delete) línea de servicio

---

## 1. POST /orgext/affiliations

- **Módulo:** `organization_extensions`
- **Etiqueta OpenAPI:** `orgext-affiliations`
- **Nombre:** Declarar afiliación entre organizaciones
- **Operation ID:** `OrgextAffiliationsController_declare`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrgextAffiliationsController.declare](../../src/modules/organization_extensions/controllers/orgext-affiliations.controller.ts)

### Descripción de negocio

Declarar afiliación entre organizaciones. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /orgext/affiliations` en `OrgextAffiliationsController_declare`. El controlador delega en `OrgextAffiliationsService.declare`. Valida el body como `CreateAffiliationDto` y consume `application/json`. El tipo de retorno estático es `Promise<AffiliationResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAffiliationDto`; los campos opcionales se omiten.

```http
POST /orgext/affiliations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "primaryTenantId": "00000000-0000-4000-8000-000000000001",
  "participatingTenantId": "00000000-0000-4000-8000-000000000001"
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
| `primaryTenantId` | Sí | `string` | formato `uuid` | Tenant primario (organizador) | `00000000-0000-4000-8000-000000000001` |
| `participatingTenantId` | Sí | `string` | formato `uuid` | Tenant participante | `00000000-0000-4000-8000-000000000001` |
| `affiliationTypeConceptId` | No | `string` | formato `uuid` | Tipo de afiliación (concepto) | `00000000-0000-4000-8000-000000000001` |
| `hostPracticeSiteId` | No | `string` | formato `uuid` | Sitio de práctica anfitrión | `00000000-0000-4000-8000-000000000001` |
| `healthcareServiceId` | No | `string` | formato `uuid` | Servicio de salud implicado | `00000000-0000-4000-8000-000000000001` |
| `contractReference` | No | `string` | longitud máxima 200 | Referencia de contrato | `valor-ejemplo` |
| `dataUseAgreementId` | No | `string` | formato `uuid` | Acuerdo de uso de datos (DUA) firmado | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | Sin restricción adicional declarada | Vigente desde (ISO date-time) | `valor-ejemplo` |
| `validTo` | No | `string` | Sin restricción adicional declarada | Vigente hasta (ISO date-time) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /orgext/affiliations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "primaryTenantId": "00000000-0000-4000-8000-000000000001",
  "participatingTenantId": "00000000-0000-4000-8000-000000000001",
  "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "hostPracticeSiteId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "contractReference": "valor-ejemplo",
  "dataUseAgreementId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "valor-ejemplo",
  "validTo": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AffiliationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AffiliationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "organizationName": "Nombre de ejemplo",
  "roleTitle": "valor-ejemplo",
  "departmentText": "valor-ejemplo",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "startDate": "2026-07-31",
  "endDate": "2026-07-31",
  "current": true,
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a practitioner profile. | `00000000-0000-4000-8000-000000000001` |
| `organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución. | `Nombre de ejemplo` |
| `roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo. | `valor-ejemplo` |
| `departmentText` | No | `string` | admite null | Servicio o departamento. | `valor-ejemplo` |
| `practiceSiteId` | No | `string` | formato `uuid`; admite null | Sede de la plataforma, si la institución está dentro. | `00000000-0000-4000-8000-000000000001` |
| `affiliationTypeConceptId` | No | `string` | formato `uuid`; admite null | Tipo de vínculo. | `00000000-0000-4000-8000-000000000001` |
| `startDate` | Sí | `string` | formato `date` | Inicio del vínculo. | `2026-07-31` |
| `endDate` | No | `string` | formato `date`; admite null | Fin del vínculo, o `null` si sigue vigente. | `2026-07-31` |
| `current` | Sí | `boolean` | Sin restricción adicional declarada | Derivado de `endDate`: sin fin declarado, sigue vigente | `true` |
| `status` | Sí | `string` | formato `uuid` | Estado del registro (concept id). | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una afiliación activa de ese tipo | Excepción explícita en src/modules/organization_extensions/services/orgext-affiliations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El tenant primario y el participante deben ser distintos | Excepción explícita en src/modules/organization_extensions/services/orgext-affiliations.service.ts |
| 422 | `PRECONDITION_FAILED` | El tenant participante no tiene una frontera de datos activa | Excepción explícita en src/modules/organization_extensions/services/orgext-affiliations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/orgext/affiliations"
}
```

---

## 2. POST /orgext/affiliations/{id}/terminate

- **Módulo:** `organization_extensions`
- **Etiqueta OpenAPI:** `orgext-affiliations`
- **Nombre:** Terminar afiliación y revocar acceso
- **Operation ID:** `OrgextAffiliationsController_terminate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrgextAffiliationsController.terminate](../../src/modules/organization_extensions/controllers/orgext-affiliations.controller.ts)

### Descripción de negocio

Terminar afiliación y revocar acceso. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /orgext/affiliations/{id}/terminate` en `OrgextAffiliationsController_terminate`. El controlador delega en `OrgextAffiliationsService.terminate`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /orgext/affiliations/00000000-0000-4000-8000-000000000001/terminate HTTP/1.1
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
POST /orgext/affiliations/00000000-0000-4000-8000-000000000001/terminate HTTP/1.1
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
| 404 | `NOT_FOUND` | Afiliación no encontrada | Excepción explícita en src/modules/organization_extensions/services/orgext-affiliations.service.ts |
| 422 | `PRECONDITION_FAILED` | La afiliación no está activa | Excepción explícita en src/modules/organization_extensions/services/orgext-affiliations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/orgext/affiliations/{id}/terminate"
}
```

---

## 3. POST /orgext/data-boundaries

- **Módulo:** `organization_extensions`
- **Etiqueta OpenAPI:** `orgext-data-boundaries`
- **Nombre:** Definir frontera de datos (residencia/RLS)
- **Operation ID:** `OrgextDataBoundariesController_define`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrgextDataBoundariesController.define](../../src/modules/organization_extensions/controllers/orgext-data-boundaries.controller.ts)

### Descripción de negocio

Definir frontera de datos (residencia/RLS). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /orgext/data-boundaries` en `OrgextDataBoundariesController_define`. El controlador delega en `OrgextDataBoundariesService.define`. Valida el body como `CreateDataBoundaryDto` y consume `application/json`. El tipo de retorno estático es `Promise<DataBoundaryResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDataBoundaryDto`; los campos opcionales se omiten.

```http
POST /orgext/data-boundaries HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "dataControllerTenantId": "00000000-0000-4000-8000-000000000001"
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant al que aplica la frontera | `00000000-0000-4000-8000-000000000001` |
| `boundaryTypeConceptId` | No | `string` | formato `uuid` | Tipo de frontera (concepto) | `00000000-0000-4000-8000-000000000001` |
| `dataControllerTenantId` | Sí | `string` | formato `uuid` | Tenant controlador de datos | `00000000-0000-4000-8000-000000000001` |
| `dataProcessorTenantId` | No | `string` | formato `uuid` | Tenant procesador de datos | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Jurisdicción (concepto) | `00000000-0000-4000-8000-000000000001` |
| `residencyRegionConceptId` | No | `string` | formato `uuid` | Región de residencia (concepto) | `00000000-0000-4000-8000-000000000001` |
| `allowedPurposeValueSetId` | No | `string` | formato `uuid` | Value set de propósitos permitidos | `00000000-0000-4000-8000-000000000001` |
| `isolationSchemaName` | No | `string` | longitud máxima 120 | Nombre del schema de aislamiento | `Nombre de ejemplo` |
| `isolationPolicyVersion` | No | `string` | longitud máxima 40 | Versión de la política de aislamiento | `valor-ejemplo` |
| `effectiveFrom` | No | `string` | formato `date-time` | Efectivo desde (ISO date-time); por defecto ahora | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /orgext/data-boundaries HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "boundaryTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "dataControllerTenantId": "00000000-0000-4000-8000-000000000001",
  "dataProcessorTenantId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "residencyRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "allowedPurposeValueSetId": "00000000-0000-4000-8000-000000000001",
  "isolationSchemaName": "Nombre de ejemplo",
  "isolationPolicyVersion": "valor-ejemplo",
  "effectiveFrom": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DataBoundaryResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DataBoundaryResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DataBoundaryResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DataBoundaryResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DataBoundaryResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DataBoundaryResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DataBoundaryResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DataBoundaryResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DataBoundaryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DataBoundaryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concepto) | `00000000-0000-4000-8000-000000000001` |
| `effectiveFrom` | Sí | `string` | formato `date-time` | Valor de effective from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una frontera de datos activa de ese tipo para el tenant | Excepción explícita en src/modules/organization_extensions/services/orgext-data-boundaries.service.ts |
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
  "path": "/orgext/data-boundaries"
}
```

---

## 4. POST /orgext/facility-licenses

- **Módulo:** `organization_extensions`
- **Etiqueta OpenAPI:** `orgext-facility-licenses`
- **Nombre:** Registrar licencia de instalación
- **Operation ID:** `OrgextFacilityLicensesController_register`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrgextFacilityLicensesController.register](../../src/modules/organization_extensions/controllers/orgext-facility-licenses.controller.ts)

### Descripción de negocio

Registrar licencia de instalación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /orgext/facility-licenses` en `OrgextFacilityLicensesController_register`. El controlador delega en `OrgextFacilityLicensesService.register`. Valida el body como `CreateFacilityLicenseDto` y consume `application/json`. El tipo de retorno estático es `Promise<FacilityLicenseResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFacilityLicenseDto`; los campos opcionales se omiten.

```http
POST /orgext/facility-licenses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "licenseNumber": "valor-ejemplo"
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant (directory) titular de la licencia | `00000000-0000-4000-8000-000000000001` |
| `practiceSiteId` | No | `string` | formato `uuid` | Sitio de práctica de la instalación | `00000000-0000-4000-8000-000000000001` |
| `facilityTypeConceptId` | No | `string` | formato `uuid` | Tipo de instalación (concepto) | `00000000-0000-4000-8000-000000000001` |
| `licenseTypeConceptId` | No | `string` | formato `uuid` | Tipo de licencia (concepto) | `00000000-0000-4000-8000-000000000001` |
| `licenseNumber` | Sí | `string` | longitud mínima 1; longitud máxima 120 | Número de licencia | `valor-ejemplo` |
| `issuingAuthorityTenantId` | No | `string` | formato `uuid` | Tenant de la autoridad emisora | `00000000-0000-4000-8000-000000000001` |
| `issuingAuthorityName` | No | `string` | longitud máxima 200 | Nombre de la autoridad emisora | `Nombre de ejemplo` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Jurisdicción (concepto) | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Vigente desde (ISO date) | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Vigente hasta (ISO date) | `2026-07-31T12:00:00.000Z` |
| `evidenceFileId` | No | `string` | formato `uuid` | Archivo de evidencia | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /orgext/facility-licenses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "facilityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "licenseTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "licenseNumber": "valor-ejemplo",
  "issuingAuthorityTenantId": "00000000-0000-4000-8000-000000000001",
  "issuingAuthorityName": "Nombre de ejemplo",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FacilityLicenseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FacilityLicenseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FacilityLicenseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FacilityLicenseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FacilityLicenseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FacilityLicenseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FacilityLicenseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FacilityLicenseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FacilityLicenseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FacilityLicenseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "licenseNumber": "valor-ejemplo",
  "verificationStatus": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `licenseNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de license number mantenido por la instancia. | `valor-ejemplo` |
| `verificationStatus` | Sí | `string` | formato `uuid` | Estado de verificación (concepto) | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una licencia con ese número para el tipo indicado | Excepción explícita en src/modules/organization_extensions/services/orgext-facility-licenses.service.ts |
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
  "path": "/orgext/facility-licenses"
}
```

---

## 5. POST /orgext/facility-licenses/{id}/verify

- **Módulo:** `organization_extensions`
- **Etiqueta OpenAPI:** `orgext-facility-licenses`
- **Nombre:** Verificar / rechazar licencia
- **Operation ID:** `OrgextFacilityLicensesController_verify`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrgextFacilityLicensesController.verify](../../src/modules/organization_extensions/controllers/orgext-facility-licenses.controller.ts)

### Descripción de negocio

Verificar / rechazar licencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /orgext/facility-licenses/{id}/verify` en `OrgextFacilityLicensesController_verify`. El controlador delega en `OrgextFacilityLicensesService.verify`. Valida el body como `OrganizationExtensionsVerifyLicenseDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `OrganizationExtensionsVerifyLicenseDto`; los campos opcionales se omiten.

```http
POST /orgext/facility-licenses/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "VERIFY"
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
| `decision` | Sí | `string` | valores: `VERIFY`, `REJECT` | Decisión de verificación | `VERIFY` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /orgext/facility-licenses/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "VERIFY"
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Licencia no encontrada | Excepción explícita en src/modules/organization_extensions/services/orgext-facility-licenses.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La licencia no está en estado pendiente | Excepción explícita en src/modules/organization_extensions/services/orgext-facility-licenses.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/orgext/facility-licenses/{id}/verify"
}
```

---

## 6. POST /orgext/hospitals

- **Módulo:** `organization_extensions`
- **Etiqueta OpenAPI:** `orgext-hospitals`
- **Nombre:** Especializar practice/tenant como hospital
- **Operation ID:** `OrgextHospitalsController_specialize`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrgextHospitalsController.specialize](../../src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts)

### Descripción de negocio

Especializar practice/tenant como hospital. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /orgext/hospitals` en `OrgextHospitalsController_specialize`. El controlador delega en `OrgextHospitalsService.specialize`. Valida el body como `CreateHospitalDto` y consume `application/json`. El tipo de retorno estático es `Promise<HospitalResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateHospitalDto`; los campos opcionales se omiten.

```http
POST /orgext/hospitals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001"
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant (directory) al que pertenece el hospital | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Practice que se especializa como hospital (1:1) | `00000000-0000-4000-8000-000000000001` |
| `hospitalTypeConceptId` | No | `string` | formato `uuid` | Tipo de hospital (concepto) | `00000000-0000-4000-8000-000000000001` |
| `careLevelConceptId` | No | `string` | formato `uuid` | Nivel de atención (concepto) | `00000000-0000-4000-8000-000000000001` |
| `ownershipTypeConceptId` | No | `string` | formato `uuid` | Tipo de propiedad (concepto) | `00000000-0000-4000-8000-000000000001` |
| `teachingStatusConceptId` | No | `string` | formato `uuid` | Estado docente (concepto) | `00000000-0000-4000-8000-000000000001` |
| `emergencyCapabilityConceptId` | No | `string` | formato `uuid` | Capacidad de emergencia (concepto) | `00000000-0000-4000-8000-000000000001` |
| `licensedBedCapacity` | No | `number` | mínimo 0 | Camas licenciadas | `1` |
| `operationalBedCapacity` | No | `number` | mínimo 0 | Camas operativas | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /orgext/hospitals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "hospitalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "careLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "ownershipTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "teachingStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "emergencyCapabilityConceptId": "00000000-0000-4000-8000-000000000001",
  "licensedBedCapacity": 1,
  "operationalBedCapacity": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<HospitalResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HospitalResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concepto) | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El tenant o el practice ya está especializado como hospital | Excepción explícita en src/modules/organization_extensions/services/orgext-hospitals.service.ts |
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
  "path": "/orgext/hospitals"
}
```

---

## 7. POST /orgext/hospitals/{id}/activate

- **Módulo:** `organization_extensions`
- **Etiqueta OpenAPI:** `orgext-hospitals`
- **Nombre:** Activar hospital y publicar perfil
- **Operation ID:** `OrgextHospitalsController_activate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrgextHospitalsController.activate](../../src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts)

### Descripción de negocio

Activar hospital y publicar perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /orgext/hospitals/{id}/activate` en `OrgextHospitalsController_activate`. El controlador delega en `OrgextHospitalsService.activate`. Valida el body como `ActivateHospitalDto` y consume `application/json`. El tipo de retorno estático es `Promise<HospitalResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ActivateHospitalDto`; los campos opcionales se omiten.

```http
POST /orgext/hospitals/00000000-0000-4000-8000-000000000001/activate HTTP/1.1
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
| `primaryPracticeSiteId` | No | `string` | formato `uuid` | Sitio de práctica principal a fijar | `00000000-0000-4000-8000-000000000001` |
| `publicProfileId` | No | `string` | formato `uuid` | Perfil público a publicar | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /orgext/hospitals/00000000-0000-4000-8000-000000000001/activate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "primaryPracticeSiteId": "00000000-0000-4000-8000-000000000001",
  "publicProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<HospitalResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HospitalResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | Sí | `string` | formato `uuid` | Identificador asociado a practice. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concepto) | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Hospital no encontrado | Excepción explícita en src/modules/organization_extensions/services/orgext-hospitals.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El hospital no está en estado borrador/inactivo | Excepción explícita en src/modules/organization_extensions/services/orgext-hospitals.service.ts |
| 422 | `PRECONDITION_FAILED` | El hospital no tiene ninguna licencia de instalación verificada | Excepción explícita en src/modules/organization_extensions/services/orgext-hospitals.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/orgext/hospitals/{id}/activate"
}
```

---

## 8. POST /orgext/hospitals/{id}/service-lines

- **Módulo:** `organization_extensions`
- **Etiqueta OpenAPI:** `orgext-hospitals`
- **Nombre:** Definir línea de servicio hospitalaria
- **Operation ID:** `OrgextHospitalsController_addServiceLine`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrgextHospitalsController.addServiceLine](../../src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts)

### Descripción de negocio

Definir línea de servicio hospitalaria. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /orgext/hospitals/{id}/service-lines` en `OrgextHospitalsController_addServiceLine`. El controlador delega en `OrgextHospitalsService.addServiceLine`. Valida el body como `CreateServiceLineDto` y consume `application/json`. El tipo de retorno estático es `Promise<ServiceLineResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateServiceLineDto`; los campos opcionales se omiten.

```http
POST /orgext/hospitals/00000000-0000-4000-8000-000000000001/service-lines HTTP/1.1
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
| `clinicalUnitId` | No | `string` | formato `uuid` | Unidad clínica asociada | `00000000-0000-4000-8000-000000000001` |
| `healthcareServiceId` | No | `string` | formato `uuid` | Servicio de salud asociado | `00000000-0000-4000-8000-000000000001` |
| `serviceLineConceptId` | No | `string` | formato `uuid` | Línea de servicio (concepto) | `00000000-0000-4000-8000-000000000001` |
| `specialtyConceptId` | No | `string` | formato `uuid` | Especialidad (concepto) | `00000000-0000-4000-8000-000000000001` |
| `acuityLevelConceptId` | No | `string` | formato `uuid` | Nivel de agudeza (concepto) | `00000000-0000-4000-8000-000000000001` |
| `referralRequired` | No | `boolean` | Sin restricción adicional declarada | Requiere referencia/derivación | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /orgext/hospitals/00000000-0000-4000-8000-000000000001/service-lines HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "serviceLineConceptId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "acuityLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "referralRequired": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ServiceLineResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ServiceLineResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ServiceLineResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ServiceLineResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ServiceLineResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ServiceLineResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ServiceLineResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ServiceLineResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ServiceLineResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ServiceLineResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ServiceLineResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "hospitalId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `hospitalId` | Sí | `string` | formato `uuid` | Identificador asociado a hospital. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado (concepto) | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Hospital no encontrado | Excepción explícita en src/modules/organization_extensions/services/orgext-hospitals.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El hospital no está activo | Excepción explícita en src/modules/organization_extensions/services/orgext-hospitals.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/orgext/hospitals/{id}/service-lines"
}
```

---

## 9. DELETE /orgext/hospitals/{id}/service-lines/{lineId}

- **Módulo:** `organization_extensions`
- **Etiqueta OpenAPI:** `orgext-hospitals`
- **Nombre:** Retirar (soft-delete) línea de servicio
- **Operation ID:** `OrgextHospitalsController_retireServiceLine`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OrgextHospitalsController.retireServiceLine](../../src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts)

### Descripción de negocio

Retirar (soft-delete) línea de servicio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `DELETE /orgext/hospitals/{id}/service-lines/{lineId}` en `OrgextHospitalsController_retireServiceLine`. El controlador delega en `OrgextHospitalsService.retireServiceLine`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lineId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /orgext/hospitals/00000000-0000-4000-8000-000000000001/service-lines/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`, `lineId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /orgext/hospitals/00000000-0000-4000-8000-000000000001/service-lines/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 404 | `NOT_FOUND` | Línea de servicio no encontrada | Excepción explícita en src/modules/organization_extensions/services/orgext-hospitals.service.ts |
| 422 | `PRECONDITION_FAILED` | La línea de servicio no está activa | Excepción explícita en src/modules/organization_extensions/services/orgext-hospitals.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/orgext/hospitals/{id}/service-lines/{lineId}"
}
```

---

