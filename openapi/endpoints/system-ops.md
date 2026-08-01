<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `system_ops`

Referencia exhaustiva de 24 operación(es) del módulo `system_ops`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `system-ops-assessments`, `system-ops-backup`, `system-ops-drafts`, `system-ops-governance`, `system-ops-legal-holds`, `system-ops-residency`, `system-ops-restore`, `system-ops-retention`
- **Controladores:** `AssessmentController`, `BackupController`, `DraftController`, `GovernanceCatalogController`, `LegalHoldController`, `ResidencyController`, `RestoreTestController`, `RetentionExecutionController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /admin/governance/anonymization-rules](#1-post-admin-governance-anonymization-rules) — Definir una regla de anonimización
2. [POST /admin/governance/assessments/{id}/findings](#2-post-admin-governance-assessments-id-findings) — Abrir un hallazgo sobre una evaluación
3. [POST /admin/governance/assessments/{id}/remediation-plans](#3-post-admin-governance-assessments-id-remediation-plans) — Crear un plan de remediación con sus acciones
4. [POST /admin/governance/cross-border-transfers](#4-post-admin-governance-cross-border-transfers) — Registrar una transferencia transfronteriza (append-only)
5. [POST /admin/governance/drafts](#5-post-admin-governance-drafts) — Guardar un draft record genérico
6. [POST /admin/governance/drafts/{id}/publish](#6-post-admin-governance-drafts-id-publish) — Publicar un draft record y materializarlo
7. [POST /admin/governance/entity-registry](#7-post-admin-governance-entity-registry) — Registrar dominio, clasificación y catalogar entidad + campos
8. [PATCH /admin/governance/entity-registry/{id}/retention](#8-patch-admin-governance-entity-registry-id-retention) — Aplicar una política de retención a una entidad
9. [PATCH /admin/governance/entity-registry/{id}/write-policy](#9-patch-admin-governance-entity-registry-id-write-policy) — Vincular una política de escritura a una entidad
10. [PATCH /admin/governance/field-registry/{id}](#10-patch-admin-governance-field-registry-id) — Asignar regla de anonimización / masking a un campo
11. [PATCH /admin/governance/findings/{id}](#11-patch-admin-governance-findings-id) — Actualizar un hallazgo (estado / owner)
12. [POST /admin/governance/legal-holds](#12-post-admin-governance-legal-holds) — Colocar un legal hold sobre un objetivo
13. [POST /admin/governance/legal-holds/{id}/release](#13-post-admin-governance-legal-holds-id-release) — Levantar un legal hold ACTIVE
14. [POST /admin/governance/operational-frameworks](#14-post-admin-governance-operational-frameworks) — Publicar un framework operativo con sus controles
15. [POST /admin/governance/remediation-actions/{id}/verify](#15-post-admin-governance-remediation-actions-id-verify) — Verificar y cerrar una acción de remediación
16. [POST /admin/governance/residency-policies](#16-post-admin-governance-residency-policies) — Definir una política de residencia de datos
17. [POST /admin/governance/retention-policies](#17-post-admin-governance-retention-policies) — Definir una política de retención con base legal
18. [POST /admin/governance/tenant-residency-bindings](#18-post-admin-governance-tenant-residency-bindings) — Vincular un tenant a una política de residencia
19. [POST /admin/governance/workload-assessments](#19-post-admin-governance-workload-assessments) — Iniciar una evaluación de workload
20. [PUT /admin/governance/workload-assessments/{id}/control-results](#20-put-admin-governance-workload-assessments-id-control-results) — Registrar (UPSERT) resultados de control de una evaluación
21. [POST /admin/governance/write-policies](#21-post-admin-governance-write-policies) — Definir una política de escritura
22. [POST /admin/ops/backup-policies](#22-post-admin-ops-backup-policies) — Definir una política de backup (RPO/RTO/inmutabilidad)
23. [POST /internal/governance/retention-executions/run](#23-post-internal-governance-retention-executions-run) — Ejecutar un barrido de retención (excluye objetivos bajo legal hold)
24. [POST /internal/ops/restore-test-runs](#24-post-internal-ops-restore-test-runs) — Registrar una prueba de restauración con evidencia

---

## 1. POST /admin/governance/anonymization-rules

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Definir una regla de anonimización
- **Operation ID:** `GovernanceCatalogController_createAnonymizationRule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceCatalogController.createAnonymizationRule](../../src/modules/system_ops/controllers/governance-catalog.controller.ts)

### Descripción de negocio

Definir una regla de anonimización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/anonymization-rules` en `GovernanceCatalogController_createAnonymizationRule`. El controlador delega en `GovernanceCatalogService.createAnonymizationRule`. Valida el body como `CreateAnonymizationRuleDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAnonymizationRuleDto`; los campos opcionales se omiten.

```http
POST /admin/governance/anonymization-rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "techniqueConceptId": "00000000-0000-4000-8000-000000000001"
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
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `techniqueConceptId` | Sí | `string` | formato `uuid` | Técnica de anonimización (concept id) | `00000000-0000-4000-8000-000000000001` |
| `parametersJson` | No | `object` | Sin restricción adicional declarada | Parámetros de la técnica (JSON libre) | `{}` |
| `description` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/anonymization-rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "techniqueConceptId": "00000000-0000-4000-8000-000000000001",
  "parametersJson": {},
  "description": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una regla de anonimización con ese code | Excepción explícita en src/modules/system_ops/services/governance-catalog.service.ts |
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
  "path": "/admin/governance/anonymization-rules"
}
```

---

## 2. POST /admin/governance/assessments/{id}/findings

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-assessments`
- **Nombre:** Abrir un hallazgo sobre una evaluación
- **Operation ID:** `AssessmentController_createFinding`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AssessmentController.createFinding](../../src/modules/system_ops/controllers/assessment.controller.ts)

### Descripción de negocio

Abrir un hallazgo sobre una evaluación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/assessments/{id}/findings` en `AssessmentController_createFinding`. El controlador delega en `AssessmentService.createFinding`. Valida el body como `CreateFindingDto` y consume `application/json`. El tipo de retorno estático es `Promise<FindingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFindingDto`; los campos opcionales se omiten.

```http
POST /admin/governance/assessments/00000000-0000-4000-8000-000000000001/findings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "findingCode": "CODIGO_EJEMPLO",
  "title": "valor-ejemplo",
  "severityConceptId": "00000000-0000-4000-8000-000000000001"
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
| `findingCode` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `title` | Sí | `string` | longitud mínima 1; longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `severityConceptId` | Sí | `string` | formato `uuid` | Severidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `assessmentControlResultId` | No | `string` | formato `uuid` | Resultado de control del que deriva | `00000000-0000-4000-8000-000000000001` |
| `ownerTeam` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `dueAt` | No | `string` | formato `date-time` | Vencimiento (ISO) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/assessments/00000000-0000-4000-8000-000000000001/findings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "findingCode": "CODIGO_EJEMPLO",
  "title": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "assessmentControlResultId": "00000000-0000-4000-8000-000000000001",
  "ownerTeam": "valor-ejemplo",
  "dueAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FindingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FindingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Evaluación no encontrada | Excepción explícita en src/modules/system_ops/services/assessment.service.ts |
| 409 | `CONFLICT` | Ya existe un hallazgo con ese finding_code | Excepción explícita en src/modules/system_ops/services/assessment.service.ts |
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
  "path": "/admin/governance/assessments/{id}/findings"
}
```

---

## 3. POST /admin/governance/assessments/{id}/remediation-plans

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-assessments`
- **Nombre:** Crear un plan de remediación con sus acciones
- **Operation ID:** `AssessmentController_createRemediationPlan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AssessmentController.createRemediationPlan](../../src/modules/system_ops/controllers/assessment.controller.ts)

### Descripción de negocio

Crear un plan de remediación con sus acciones. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/assessments/{id}/remediation-plans` en `AssessmentController_createRemediationPlan`. El controlador delega en `AssessmentService.createRemediationPlan`. Valida el body como `CreateRemediationPlanDto` y consume `application/json`. El tipo de retorno estático es `Promise<RemediationPlanResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateRemediationPlanDto`; los campos opcionales se omiten.

```http
POST /admin/governance/assessments/00000000-0000-4000-8000-000000000001/remediation-plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "assessmentFindingId": "00000000-0000-4000-8000-000000000001",
  "actions": [
    {
      "actionCode": "CODIGO_EJEMPLO",
      "description": "Texto descriptivo de ejemplo"
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
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `assessmentFindingId` | Sí | `string` | formato `uuid` | Hallazgo al que responde el plan | `00000000-0000-4000-8000-000000000001` |
| `ownerUserId` | No | `string` | formato `uuid` | Responsable del plan | `00000000-0000-4000-8000-000000000001` |
| `targetCompletionAt` | No | `string` | formato `date-time` | Fecha objetivo de finalización (ISO) | `2026-07-31T12:00:00.000Z` |
| `actions` | Sí | `array<RemediationActionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"actionCode":"CODIGO_EJEMPLO","description":"Texto descriptivo de ejemplo","assignedUserId":"00000000-0000-4000-8000-000000000001","assignedTeam":"valor-ejemplo","dueAt":"2026-07-31T12:00:00.000Z"}]` |
| `actions[].actionCode` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `actions[].description` | Sí | `string` | longitud mínima 1; longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `actions[].assignedUserId` | No | `string` | formato `uuid` | Usuario asignado | `00000000-0000-4000-8000-000000000001` |
| `actions[].assignedTeam` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `actions[].dueAt` | No | `string` | formato `date-time` | Vencimiento (ISO) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/assessments/00000000-0000-4000-8000-000000000001/remediation-plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "assessmentFindingId": "00000000-0000-4000-8000-000000000001",
  "ownerUserId": "00000000-0000-4000-8000-000000000001",
  "targetCompletionAt": "2026-07-31T12:00:00.000Z",
  "actions": [
    {
      "actionCode": "CODIGO_EJEMPLO",
      "description": "Texto descriptivo de ejemplo",
      "assignedUserId": "00000000-0000-4000-8000-000000000001",
      "assignedTeam": "valor-ejemplo",
      "dueAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RemediationPlanResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RemediationPlanResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RemediationPlanResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RemediationPlanResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RemediationPlanResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RemediationPlanResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RemediationPlanResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RemediationPlanResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RemediationPlanResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RemediationPlanResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RemediationPlanResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "actionIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `actionIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de las acciones creadas | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Evaluación no encontrada | Excepción explícita en src/modules/system_ops/services/assessment.service.ts |
| 404 | `NOT_FOUND` | Hallazgo no encontrado | Excepción explícita en src/modules/system_ops/services/assessment.service.ts |
| 409 | `CONFLICT` | Ya existe un plan con ese code para el tenant | Excepción explícita en src/modules/system_ops/services/assessment.service.ts |
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
  "path": "/admin/governance/assessments/{id}/remediation-plans"
}
```

---

## 4. POST /admin/governance/cross-border-transfers

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-residency`
- **Nombre:** Registrar una transferencia transfronteriza (append-only)
- **Operation ID:** `ResidencyController_recordTransfer`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ResidencyController.recordTransfer](../../src/modules/system_ops/controllers/residency.controller.ts)

### Descripción de negocio

Registrar una transferencia transfronteriza (append-only). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/cross-border-transfers` en `ResidencyController_recordTransfer`. El controlador delega en `ResidencyService.recordTransfer`. Valida el body como `CreateCrossBorderTransferDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCrossBorderTransferDto`; los campos opcionales se omiten.

```http
POST /admin/governance/cross-border-transfers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "dataCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "sourceRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "destinationRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "transferBasisConceptId": "00000000-0000-4000-8000-000000000001",
  "transferReference": "valor-ejemplo"
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant origen | `00000000-0000-4000-8000-000000000001` |
| `dataCategoryConceptId` | Sí | `string` | formato `uuid` | Categoría de datos (concept id) | `00000000-0000-4000-8000-000000000001` |
| `sourceRegionConceptId` | Sí | `string` | formato `uuid` | Región origen (concept id) | `00000000-0000-4000-8000-000000000001` |
| `destinationRegionConceptId` | Sí | `string` | formato `uuid` | Región destino (concept id) | `00000000-0000-4000-8000-000000000001` |
| `transferBasisConceptId` | Sí | `string` | formato `uuid` | Base de transferencia (concept id) | `00000000-0000-4000-8000-000000000001` |
| `recipientTenantId` | No | `string` | formato `uuid` | Tenant destinatario | `00000000-0000-4000-8000-000000000001` |
| `transferReference` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Referencia idempotente de la transferencia | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/cross-border-transfers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "dataCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "sourceRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "destinationRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "transferBasisConceptId": "00000000-0000-4000-8000-000000000001",
  "recipientTenantId": "00000000-0000-4000-8000-000000000001",
  "transferReference": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | La referencia de transferencia ya fue registrada | Excepción explícita en src/modules/system_ops/services/residency.service.ts |
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
  "path": "/admin/governance/cross-border-transfers"
}
```

---

## 5. POST /admin/governance/drafts

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-drafts`
- **Nombre:** Guardar un draft record genérico
- **Operation ID:** `DraftController_createDraft`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DraftController.createDraft](../../src/modules/system_ops/controllers/draft.controller.ts)

### Descripción de negocio

Guardar un draft record genérico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/drafts` en `DraftController_createDraft`. El controlador delega en `DraftService.createDraft`. Valida el body como `CreateDraftDto` y consume `application/json`. El tipo de retorno estático es `Promise<DraftResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDraftDto`; los campos opcionales se omiten.

```http
POST /admin/governance/drafts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "schemaName": "Nombre de ejemplo",
  "tableName": "Nombre de ejemplo",
  "payloadJson": {}
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
| `schemaName` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Esquema destino real | `Nombre de ejemplo` |
| `tableName` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Tabla destino real | `Nombre de ejemplo` |
| `targetRecordId` | No | `string` | formato `uuid` | Registro destino a actualizar (si aplica) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant del draft | `00000000-0000-4000-8000-000000000001` |
| `draftLabel` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `payloadJson` | Sí | `object` | Sin restricción adicional declarada | Contenido del borrador (JSON) | `{}` |
| `schemaVersion` | No | `number` | mínimo 1 | Versión del schema del target | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/drafts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "schemaName": "Nombre de ejemplo",
  "tableName": "Nombre de ejemplo",
  "targetRecordId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "draftLabel": "valor-ejemplo",
  "payloadJson": {},
  "schemaVersion": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DraftResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DraftResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "publishedRecordId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `publishedRecordId` | No | `string` | formato `uuid` | Id del registro materializado al publicar | `00000000-0000-4000-8000-000000000001` |

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
  "path": "/admin/governance/drafts"
}
```

---

## 6. POST /admin/governance/drafts/{id}/publish

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-drafts`
- **Nombre:** Publicar un draft record y materializarlo
- **Operation ID:** `DraftController_publishDraft`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DraftController.publishDraft](../../src/modules/system_ops/controllers/draft.controller.ts)

### Descripción de negocio

Publicar un draft record y materializarlo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/drafts/{id}/publish` en `DraftController_publishDraft`. El controlador delega en `DraftService.publishDraft`. Valida el body como `PublishDraftDto` y consume `application/json`. El tipo de retorno estático es `Promise<DraftResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishDraftDto`; los campos opcionales se omiten.

```http
POST /admin/governance/drafts/00000000-0000-4000-8000-000000000001/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "publishReference": "valor-ejemplo"
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
| `publishReference` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Referencia idempotente de la publicación | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/drafts/00000000-0000-4000-8000-000000000001/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "publishReference": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DraftResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "publishedRecordId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `publishedRecordId` | No | `string` | formato `uuid` | Id del registro materializado al publicar | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Borrador no encontrado | Excepción explícita en src/modules/system_ops/services/draft.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo el dueño del borrador puede publicarlo | Excepción explícita en src/modules/system_ops/services/draft.service.ts |
| 422 | `PRECONDITION_FAILED` | El borrador no está en estado DRAFT | Excepción explícita en src/modules/system_ops/services/draft.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/drafts/{id}/publish"
}
```

---

## 7. POST /admin/governance/entity-registry

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Registrar dominio, clasificación y catalogar entidad + campos
- **Operation ID:** `GovernanceCatalogController_catalogEntity`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceCatalogController.catalogEntity](../../src/modules/system_ops/controllers/governance-catalog.controller.ts)

### Descripción de negocio

Registrar dominio, clasificación y catalogar entidad + campos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/entity-registry` en `GovernanceCatalogController_catalogEntity`. El controlador delega en `GovernanceCatalogService.catalogEntity`. Valida el body como `CatalogEntityDto` y consume `application/json`. El tipo de retorno estático es `Promise<EntityRegistryResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CatalogEntityDto`; los campos opcionales se omiten.

```http
POST /admin/governance/entity-registry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "domain": {
    "code": "CODIGO_EJEMPLO",
    "name": "Nombre de ejemplo"
  },
  "classification": {
    "code": "CODIGO_EJEMPLO",
    "name": "Nombre de ejemplo"
  },
  "schemaName": "Nombre de ejemplo",
  "tableName": "Nombre de ejemplo",
  "isAppendOnly": true,
  "isSoftDelete": true,
  "hasHistory": true,
  "fields": [
    {
      "columnName": "Nombre de ejemplo"
    }
  ]
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
| `domain` | Sí | `CatalogDomainDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","ownerTeam":"valor-ejemplo"}` |
| `domain.code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `domain.name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `domain.ownerTeam` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `classification` | Sí | `CatalogClassificationDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","rank":1,"isPii":true,"isPhi":true,"handlingRulesJson":{}}` |
| `classification.code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `classification.name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `classification.rank` | No | `number` | mínimo 0 | Rango de sensibilidad (mayor = más sensible) | `1` |
| `classification.isPii` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `classification.isPhi` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `classification.handlingRulesJson` | No | `object` | Sin restricción adicional declarada | Reglas de manejo (JSON libre) | `{}` |
| `schemaName` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Esquema físico de la tabla | `Nombre de ejemplo` |
| `tableName` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Nombre físico de la tabla | `Nombre de ejemplo` |
| `isAppendOnly` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `isSoftDelete` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `hasHistory` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `historyTable` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `containsPii` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `containsPhi` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `ownerTeam` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `fields` | Sí | `array<CatalogFieldDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"columnName":"Nombre de ejemplo","isPii":true,"isPhi":true,"maskingStrategyConceptId":"00000000-0000-4000-8000-000000000001","notes":"Texto descriptivo de ejemplo"}]` |
| `fields[].columnName` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `fields[].isPii` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `fields[].isPhi` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `fields[].maskingStrategyConceptId` | No | `string` | formato `uuid` | Estrategia de enmascaramiento (concept id) | `00000000-0000-4000-8000-000000000001` |
| `fields[].notes` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/entity-registry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "domain": {
    "code": "CODIGO_EJEMPLO",
    "name": "Nombre de ejemplo",
    "ownerTeam": "valor-ejemplo"
  },
  "classification": {
    "code": "CODIGO_EJEMPLO",
    "name": "Nombre de ejemplo",
    "rank": 1,
    "isPii": true,
    "isPhi": true,
    "handlingRulesJson": {}
  },
  "schemaName": "Nombre de ejemplo",
  "tableName": "Nombre de ejemplo",
  "isAppendOnly": true,
  "isSoftDelete": true,
  "hasHistory": true,
  "historyTable": "valor-ejemplo",
  "containsPii": true,
  "containsPhi": true,
  "ownerTeam": "valor-ejemplo",
  "fields": [
    {
      "columnName": "Nombre de ejemplo",
      "isPii": true,
      "isPhi": true,
      "maskingStrategyConceptId": "00000000-0000-4000-8000-000000000001",
      "notes": "Texto descriptivo de ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EntityRegistryResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EntityRegistryResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EntityRegistryResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EntityRegistryResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EntityRegistryResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EntityRegistryResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EntityRegistryResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EntityRegistryResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EntityRegistryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EntityRegistryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "domainId": "00000000-0000-4000-8000-000000000001",
  "classificationId": "00000000-0000-4000-8000-000000000001",
  "schemaName": "Nombre de ejemplo",
  "tableName": "Nombre de ejemplo",
  "fieldIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `domainId` | Sí | `string` | formato `uuid` | Identificador asociado a domain. | `00000000-0000-4000-8000-000000000001` |
| `classificationId` | Sí | `string` | formato `uuid` | Identificador asociado a classification. | `00000000-0000-4000-8000-000000000001` |
| `schemaName` | Sí | `string` | Sin restricción adicional declarada | Valor de schema name mantenido por la instancia. | `Nombre de ejemplo` |
| `tableName` | Sí | `string` | Sin restricción adicional declarada | Valor de table name mantenido por la instancia. | `Nombre de ejemplo` |
| `fieldIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de los campos catalogados | `["valor-ejemplo"]` |

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
  "path": "/admin/governance/entity-registry"
}
```

---

## 8. PATCH /admin/governance/entity-registry/{id}/retention

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Aplicar una política de retención a una entidad
- **Operation ID:** `GovernanceCatalogController_applyRetention`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceCatalogController.applyRetention](../../src/modules/system_ops/controllers/governance-catalog.controller.ts)

### Descripción de negocio

Aplicar una política de retención a una entidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /admin/governance/entity-registry/{id}/retention` en `GovernanceCatalogController_applyRetention`. El controlador delega en `GovernanceCatalogService.applyRetention`. Valida el body como `ApplyRetentionPolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ApplyRetentionPolicyDto`; los campos opcionales se omiten.

```http
PATCH /admin/governance/entity-registry/00000000-0000-4000-8000-000000000001/retention HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "retentionPolicyId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
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
| `retentionPolicyId` | Sí | `string` | formato `uuid` | Política de retención a vincular | `00000000-0000-4000-8000-000000000001` |
| `reason` | Sí | `string` | longitud mínima 1; longitud máxima 500 | Razón (obligatoria por gobierno) | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /admin/governance/entity-registry/00000000-0000-4000-8000-000000000001/retention HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "retentionPolicyId": "00000000-0000-4000-8000-000000000001",
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Entidad no encontrada | Excepción explícita en src/modules/system_ops/services/governance-catalog.service.ts |
| 404 | `NOT_FOUND` | Política de retención no encontrada | Excepción explícita en src/modules/system_ops/services/governance-catalog.service.ts |
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
  "path": "/admin/governance/entity-registry/{id}/retention"
}
```

---

## 9. PATCH /admin/governance/entity-registry/{id}/write-policy

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Vincular una política de escritura a una entidad
- **Operation ID:** `GovernanceCatalogController_applyWritePolicy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceCatalogController.applyWritePolicy](../../src/modules/system_ops/controllers/governance-catalog.controller.ts)

### Descripción de negocio

Vincular una política de escritura a una entidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /admin/governance/entity-registry/{id}/write-policy` en `GovernanceCatalogController_applyWritePolicy`. El controlador delega en `GovernanceCatalogService.applyWritePolicy`. Valida el body como `ApplyWritePolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ApplyWritePolicyDto`; los campos opcionales se omiten.

```http
PATCH /admin/governance/entity-registry/00000000-0000-4000-8000-000000000001/write-policy HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "writePolicyId": "00000000-0000-4000-8000-000000000001"
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
| `writePolicyId` | Sí | `string` | formato `uuid` | Política de escritura a vincular | `00000000-0000-4000-8000-000000000001` |
| `reason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /admin/governance/entity-registry/00000000-0000-4000-8000-000000000001/write-policy HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "writePolicyId": "00000000-0000-4000-8000-000000000001",
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Entidad no encontrada | Excepción explícita en src/modules/system_ops/services/governance-catalog.service.ts |
| 404 | `NOT_FOUND` | Política de escritura no encontrada | Excepción explícita en src/modules/system_ops/services/governance-catalog.service.ts |
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
  "path": "/admin/governance/entity-registry/{id}/write-policy"
}
```

---

## 10. PATCH /admin/governance/field-registry/{id}

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Asignar regla de anonimización / masking a un campo
- **Operation ID:** `GovernanceCatalogController_updateField`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceCatalogController.updateField](../../src/modules/system_ops/controllers/governance-catalog.controller.ts)

### Descripción de negocio

Asignar regla de anonimización / masking a un campo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /admin/governance/field-registry/{id}` en `GovernanceCatalogController_updateField`. El controlador delega en `GovernanceCatalogService.updateField`. Valida el body como `UpdateFieldRegistryDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateFieldRegistryDto`; los campos opcionales se omiten.

```http
PATCH /admin/governance/field-registry/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| `anonymizationRuleId` | No | `string` | formato `uuid` | Regla de anonimización a asignar | `00000000-0000-4000-8000-000000000001` |
| `maskingStrategyConceptId` | No | `string` | formato `uuid` | Estrategia de enmascaramiento (concept id) | `00000000-0000-4000-8000-000000000001` |
| `isPii` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `isPhi` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /admin/governance/field-registry/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "anonymizationRuleId": "00000000-0000-4000-8000-000000000001",
  "maskingStrategyConceptId": "00000000-0000-4000-8000-000000000001",
  "isPii": true,
  "isPhi": true
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
| 404 | `NOT_FOUND` | Campo no encontrado | Excepción explícita en src/modules/system_ops/services/governance-catalog.service.ts |
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
  "path": "/admin/governance/field-registry/{id}"
}
```

---

## 11. PATCH /admin/governance/findings/{id}

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-assessments`
- **Nombre:** Actualizar un hallazgo (estado / owner)
- **Operation ID:** `AssessmentController_updateFinding`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AssessmentController.updateFinding](../../src/modules/system_ops/controllers/assessment.controller.ts)

### Descripción de negocio

Actualizar un hallazgo (estado / owner). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /admin/governance/findings/{id}` en `AssessmentController_updateFinding`. El controlador delega en `AssessmentService.updateFinding`. Valida el body como `UpdateFindingDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateFindingDto`; los campos opcionales se omiten.

```http
PATCH /admin/governance/findings/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| `statusConceptId` | No | `string` | formato `uuid` | Estado del hallazgo (concept id) | `00000000-0000-4000-8000-000000000001` |
| `ownerTeam` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /admin/governance/findings/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "ownerTeam": "valor-ejemplo"
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
| 404 | `NOT_FOUND` | Hallazgo no encontrado | Excepción explícita en src/modules/system_ops/services/assessment.service.ts |
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
  "path": "/admin/governance/findings/{id}"
}
```

---

## 12. POST /admin/governance/legal-holds

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-legal-holds`
- **Nombre:** Colocar un legal hold sobre un objetivo
- **Operation ID:** `LegalHoldController_place`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LegalHoldController.place](../../src/modules/system_ops/controllers/legal-hold.controller.ts)

### Descripción de negocio

Colocar un legal hold sobre un objetivo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/legal-holds` en `LegalHoldController_place`. El controlador delega en `LegalHoldService.place`. Valida el body como `CreateLegalHoldDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateLegalHoldDto`; los campos opcionales se omiten.

```http
POST /admin/governance/legal-holds HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "targetTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001"
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant del hold | `00000000-0000-4000-8000-000000000001` |
| `targetTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de objetivo (concept id) | `00000000-0000-4000-8000-000000000001` |
| `targetId` | Sí | `string` | formato `uuid` | Id del objetivo bajo hold | `00000000-0000-4000-8000-000000000001` |
| `reasonConceptId` | Sí | `string` | formato `uuid` | Razón del hold (concept id) | `00000000-0000-4000-8000-000000000001` |
| `authorityReference` | No | `string` | longitud máxima 200 | Referencia de la autoridad | `valor-ejemplo` |
| `startsAt` | No | `string` | formato `date-time` | Inicio del hold (ISO) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/legal-holds HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "targetTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001",
  "authorityReference": "valor-ejemplo",
  "startsAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un legal hold ACTIVE para ese objetivo | Excepción explícita en src/modules/system_ops/services/legal-hold.service.ts |
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
  "path": "/admin/governance/legal-holds"
}
```

---

## 13. POST /admin/governance/legal-holds/{id}/release

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-legal-holds`
- **Nombre:** Levantar un legal hold ACTIVE
- **Operation ID:** `LegalHoldController_release`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LegalHoldController.release](../../src/modules/system_ops/controllers/legal-hold.controller.ts)

### Descripción de negocio

Levantar un legal hold ACTIVE. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/legal-holds/{id}/release` en `LegalHoldController_release`. El controlador delega en `LegalHoldService.release`. Valida el body como `ReleaseLegalHoldDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReleaseLegalHoldDto`; los campos opcionales se omiten.

```http
POST /admin/governance/legal-holds/00000000-0000-4000-8000-000000000001/release HTTP/1.1
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
| `reason` | No | `string` | longitud mínima 1; longitud máxima 500 | Motivo del levantamiento | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/legal-holds/00000000-0000-4000-8000-000000000001/release HTTP/1.1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Legal hold no encontrado | Excepción explícita en src/modules/system_ops/services/legal-hold.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El legal hold no está ACTIVE | Excepción explícita en src/modules/system_ops/services/legal-hold.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/legal-holds/{id}/release"
}
```

---

## 14. POST /admin/governance/operational-frameworks

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-assessments`
- **Nombre:** Publicar un framework operativo con sus controles
- **Operation ID:** `AssessmentController_publishFramework`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AssessmentController.publishFramework](../../src/modules/system_ops/controllers/assessment.controller.ts)

### Descripción de negocio

Publicar un framework operativo con sus controles. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/operational-frameworks` en `AssessmentController_publishFramework`. El controlador delega en `AssessmentService.publishFramework`. Valida el body como `CreateFrameworkDto` y consume `application/json`. El tipo de retorno estático es `Promise<FrameworkResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFrameworkDto`; los campos opcionales se omiten.

```http
POST /admin/governance/operational-frameworks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "providerConceptId": "00000000-0000-4000-8000-000000000001",
  "version": "valor-ejemplo",
  "controls": [
    {
      "controlCode": "CODIGO_EJEMPLO",
      "title": "valor-ejemplo"
    }
  ]
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
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `providerConceptId` | Sí | `string` | formato `uuid` | Proveedor del framework (concept id) | `00000000-0000-4000-8000-000000000001` |
| `version` | Sí | `string` | longitud mínima 1; longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sourceUrl` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `controls` | Sí | `array<FrameworkControlDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"controlCode":"CODIGO_EJEMPLO","title":"valor-ejemplo","parentControlCode":"CODIGO_EJEMPLO","pillarConceptId":"00000000-0000-4000-8000-000000000001","objectiveText":"valor-ejemplo","evidenceRequirementsJson":{},"assessmentGuidanceJson":{}}]` |
| `controls[].controlCode` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único del control dentro del framework | `CODIGO_EJEMPLO` |
| `controls[].title` | Sí | `string` | longitud mínima 1; longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `controls[].parentControlCode` | No | `string` | longitud máxima 100 | Código del control padre (jerarquía dentro del mismo framework) | `CODIGO_EJEMPLO` |
| `controls[].pillarConceptId` | No | `string` | formato `uuid` | Pilar (concept id) | `00000000-0000-4000-8000-000000000001` |
| `controls[].objectiveText` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `controls[].evidenceRequirementsJson` | No | `object` | Sin restricción adicional declarada | Requisitos de evidencia (JSON libre) | `{}` |
| `controls[].assessmentGuidanceJson` | No | `object` | Sin restricción adicional declarada | Guía de evaluación (JSON libre) | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/operational-frameworks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "providerConceptId": "00000000-0000-4000-8000-000000000001",
  "version": "valor-ejemplo",
  "sourceUrl": "valor-ejemplo",
  "controls": [
    {
      "controlCode": "CODIGO_EJEMPLO",
      "title": "valor-ejemplo",
      "parentControlCode": "CODIGO_EJEMPLO",
      "pillarConceptId": "00000000-0000-4000-8000-000000000001",
      "objectiveText": "valor-ejemplo",
      "evidenceRequirementsJson": {},
      "assessmentGuidanceJson": {}
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FrameworkResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FrameworkResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FrameworkResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FrameworkResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FrameworkResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FrameworkResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FrameworkResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FrameworkResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FrameworkResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FrameworkResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "version": "valor-ejemplo",
  "controlIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `version` | Sí | `string` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `valor-ejemplo` |
| `controlIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de los controles creados | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un framework con ese code+version | Excepción explícita en src/modules/system_ops/services/assessment.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | parentControlCode no existe en el framework | Excepción explícita en src/modules/system_ops/services/assessment.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/operational-frameworks"
}
```

---

## 15. POST /admin/governance/remediation-actions/{id}/verify

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-assessments`
- **Nombre:** Verificar y cerrar una acción de remediación
- **Operation ID:** `AssessmentController_verifyAction`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AssessmentController.verifyAction](../../src/modules/system_ops/controllers/assessment.controller.ts)

### Descripción de negocio

Verificar y cerrar una acción de remediación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/remediation-actions/{id}/verify` en `AssessmentController_verifyAction`. El controlador delega en `AssessmentService.verifyAction`. Valida el body como `VerifyRemediationActionDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VerifyRemediationActionDto`; los campos opcionales se omiten.

```http
POST /admin/governance/remediation-actions/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "verificationEvidenceJson": {}
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
| `verificationEvidenceJson` | Sí | `object` | Sin restricción adicional declarada | Evidencia de verificación (JSON libre) | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/remediation-actions/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "verificationEvidenceJson": {}
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
| 404 | `NOT_FOUND` | Acción de remediación no encontrada | Excepción explícita en src/modules/system_ops/services/assessment.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La acción ya está verificada | Excepción explícita en src/modules/system_ops/services/assessment.service.ts |
| 422 | `PRECONDITION_FAILED` | El verificador no puede ser el asignado | Excepción explícita en src/modules/system_ops/services/assessment.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/remediation-actions/{id}/verify"
}
```

---

## 16. POST /admin/governance/residency-policies

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-residency`
- **Nombre:** Definir una política de residencia de datos
- **Operation ID:** `ResidencyController_createResidencyPolicy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ResidencyController.createResidencyPolicy](../../src/modules/system_ops/controllers/residency.controller.ts)

### Descripción de negocio

Definir una política de residencia de datos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/residency-policies` en `ResidencyController_createResidencyPolicy`. El controlador delega en `ResidencyService.createResidencyPolicy`. Valida el body como `CreateResidencyPolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateResidencyPolicyDto`; los campos opcionales se omiten.

```http
POST /admin/governance/residency-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "dataClassificationId": "00000000-0000-4000-8000-000000000001",
  "allowedStorageRegionValueSetId": "00000000-0000-4000-8000-000000000001"
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
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `jurisdictionConceptId` | Sí | `string` | formato `uuid` | Jurisdicción (concept id) | `00000000-0000-4000-8000-000000000001` |
| `dataClassificationId` | Sí | `string` | formato `uuid` | Clasificación de datos (system_ops.data_classifications.id) | `00000000-0000-4000-8000-000000000001` |
| `allowedStorageRegionValueSetId` | Sí | `string` | formato `uuid` | Value set de regiones de almacenamiento permitidas | `00000000-0000-4000-8000-000000000001` |
| `allowedProcessingRegionValueSetId` | No | `string` | formato `uuid` | Value set de regiones de procesamiento permitidas | `00000000-0000-4000-8000-000000000001` |
| `crossBorderTransferBasisConceptId` | No | `string` | formato `uuid` | Base de transferencia transfronteriza (concept id) | `00000000-0000-4000-8000-000000000001` |
| `transferImpactAssessmentRequired` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `encryptionKeyRegionLocked` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `validFrom` | No | `string` | formato `date-time` | Vigencia desde (ISO) | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Vigencia hasta (ISO) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/residency-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "dataClassificationId": "00000000-0000-4000-8000-000000000001",
  "allowedStorageRegionValueSetId": "00000000-0000-4000-8000-000000000001",
  "allowedProcessingRegionValueSetId": "00000000-0000-4000-8000-000000000001",
  "crossBorderTransferBasisConceptId": "00000000-0000-4000-8000-000000000001",
  "transferImpactAssessmentRequired": true,
  "encryptionKeyRegionLocked": true,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una política de residencia con ese code | Excepción explícita en src/modules/system_ops/services/residency.service.ts |
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
  "path": "/admin/governance/residency-policies"
}
```

---

## 17. POST /admin/governance/retention-policies

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Definir una política de retención con base legal
- **Operation ID:** `GovernanceCatalogController_createRetentionPolicy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceCatalogController.createRetentionPolicy](../../src/modules/system_ops/controllers/governance-catalog.controller.ts)

### Descripción de negocio

Definir una política de retención con base legal. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/retention-policies` en `GovernanceCatalogController_createRetentionPolicy`. El controlador delega en `GovernanceCatalogService.createRetentionPolicy`. Valida el body como `CreateRetentionPolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateRetentionPolicyDto`; los campos opcionales se omiten.

```http
POST /admin/governance/retention-policies HTTP/1.1
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
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `retentionPeriodDays` | No | `number` | mínimo 0 | Periodo de retención en días | `1` |
| `legalBasisConceptId` | No | `string` | formato `uuid` | Base legal (concept id) | `00000000-0000-4000-8000-000000000001` |
| `dispositionConceptId` | No | `string` | formato `uuid` | Disposición al vencer (concept id) | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Jurisdicción (concept id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/retention-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "retentionPeriodDays": 1,
  "legalBasisConceptId": "00000000-0000-4000-8000-000000000001",
  "dispositionConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una política de retención con ese code | Excepción explícita en src/modules/system_ops/services/governance-catalog.service.ts |
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
  "path": "/admin/governance/retention-policies"
}
```

---

## 18. POST /admin/governance/tenant-residency-bindings

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-residency`
- **Nombre:** Vincular un tenant a una política de residencia
- **Operation ID:** `ResidencyController_createBinding`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ResidencyController.createBinding](../../src/modules/system_ops/controllers/residency.controller.ts)

### Descripción de negocio

Vincular un tenant a una política de residencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/tenant-residency-bindings` en `ResidencyController_createBinding`. El controlador delega en `ResidencyService.createBinding`. Valida el body como `CreateTenantResidencyBindingDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTenantResidencyBindingDto`; los campos opcionales se omiten.

```http
POST /admin/governance/tenant-residency-bindings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "residencyPolicyId": "00000000-0000-4000-8000-000000000001",
  "primaryRegionConceptId": "00000000-0000-4000-8000-000000000001"
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant a vincular | `00000000-0000-4000-8000-000000000001` |
| `residencyPolicyId` | Sí | `string` | formato `uuid` | Política de residencia (polyglot_storage.residency_policies.id) | `00000000-0000-4000-8000-000000000001` |
| `primaryRegionConceptId` | Sí | `string` | formato `uuid` | Región primaria (concept id) | `00000000-0000-4000-8000-000000000001` |
| `disasterRecoveryRegionConceptId` | No | `string` | formato `uuid` | Región de recuperación ante desastres (concept id) | `00000000-0000-4000-8000-000000000001` |
| `effectiveFrom` | No | `string` | formato `date-time` | Efectivo desde (ISO) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/tenant-residency-bindings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "residencyPolicyId": "00000000-0000-4000-8000-000000000001",
  "primaryRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "disasterRecoveryRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "effectiveFrom": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso | `00000000-0000-4000-8000-000000000001` |

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
  "path": "/admin/governance/tenant-residency-bindings"
}
```

---

## 19. POST /admin/governance/workload-assessments

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-assessments`
- **Nombre:** Iniciar una evaluación de workload
- **Operation ID:** `AssessmentController_createAssessment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AssessmentController.createAssessment](../../src/modules/system_ops/controllers/assessment.controller.ts)

### Descripción de negocio

Iniciar una evaluación de workload. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/workload-assessments` en `AssessmentController_createAssessment`. El controlador delega en `AssessmentService.createAssessment`. Valida el body como `CreateWorkloadAssessmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateWorkloadAssessmentDto`; los campos opcionales se omiten.

```http
POST /admin/governance/workload-assessments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "operationalFrameworkId": "00000000-0000-4000-8000-000000000001",
  "workloadCode": "CODIGO_EJEMPLO",
  "workloadName": "Nombre de ejemplo",
  "assessmentTypeConceptId": "00000000-0000-4000-8000-000000000001"
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant de la evaluación | `00000000-0000-4000-8000-000000000001` |
| `operationalFrameworkId` | Sí | `string` | formato `uuid` | Framework publicado a evaluar | `00000000-0000-4000-8000-000000000001` |
| `workloadCode` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `workloadName` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `assessmentTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de evaluación (concept id) | `00000000-0000-4000-8000-000000000001` |
| `assessmentPeriodStart` | No | `string` | formato `date-time` | Inicio del periodo (ISO date) | `2026-07-31T12:00:00.000Z` |
| `assessmentPeriodEnd` | No | `string` | formato `date-time` | Fin del periodo (ISO date) | `2026-07-31T12:00:00.000Z` |
| `facilitatorUserId` | No | `string` | formato `uuid` | Facilitador de la evaluación | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/workload-assessments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "operationalFrameworkId": "00000000-0000-4000-8000-000000000001",
  "workloadCode": "CODIGO_EJEMPLO",
  "workloadName": "Nombre de ejemplo",
  "assessmentTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "assessmentPeriodStart": "2026-07-31T12:00:00.000Z",
  "assessmentPeriodEnd": "2026-07-31T12:00:00.000Z",
  "facilitatorUserId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Framework no encontrado | Excepción explícita en src/modules/system_ops/services/assessment.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El framework no está publicado (ACTIVE) | Excepción explícita en src/modules/system_ops/services/assessment.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/workload-assessments"
}
```

---

## 20. PUT /admin/governance/workload-assessments/{id}/control-results

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-assessments`
- **Nombre:** Registrar (UPSERT) resultados de control de una evaluación
- **Operation ID:** `AssessmentController_putControlResults`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AssessmentController.putControlResults](../../src/modules/system_ops/controllers/assessment.controller.ts)

### Descripción de negocio

Registrar (UPSERT) resultados de control de una evaluación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /admin/governance/workload-assessments/{id}/control-results` en `AssessmentController_putControlResults`. El controlador delega en `AssessmentService.putControlResults`. Valida el body como `PutControlResultsDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PutControlResultsDto`; los campos opcionales se omiten.

```http
PUT /admin/governance/workload-assessments/00000000-0000-4000-8000-000000000001/control-results HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "results": [
    {
      "operationalFrameworkControlId": "00000000-0000-4000-8000-000000000001",
      "resultConceptId": "00000000-0000-4000-8000-000000000001"
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
| `results` | Sí | `array<ControlResultItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"operationalFrameworkControlId":"00000000-0000-4000-8000-000000000001","resultConceptId":"00000000-0000-4000-8000-000000000001","maturityLevelConceptId":"00000000-0000-4000-8000-000000000001","evidenceSummary":"valor-ejemplo","evidenceLinksJson":{}}]` |
| `results[].operationalFrameworkControlId` | Sí | `string` | formato `uuid` | Control del framework evaluado | `00000000-0000-4000-8000-000000000001` |
| `results[].resultConceptId` | Sí | `string` | formato `uuid` | Resultado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `results[].maturityLevelConceptId` | No | `string` | formato `uuid` | Nivel de madurez (concept id) | `00000000-0000-4000-8000-000000000001` |
| `results[].evidenceSummary` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `results[].evidenceLinksJson` | No | `object` | Sin restricción adicional declarada | Enlaces de evidencia (JSON libre) | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /admin/governance/workload-assessments/00000000-0000-4000-8000-000000000001/control-results HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "results": [
    {
      "operationalFrameworkControlId": "00000000-0000-4000-8000-000000000001",
      "resultConceptId": "00000000-0000-4000-8000-000000000001",
      "maturityLevelConceptId": "00000000-0000-4000-8000-000000000001",
      "evidenceSummary": "valor-ejemplo",
      "evidenceLinksJson": {}
    }
  ]
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
| 404 | `NOT_FOUND` | Evaluación no encontrada | Excepción explícita en src/modules/system_ops/services/assessment.service.ts |
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
  "path": "/admin/governance/workload-assessments/{id}/control-results"
}
```

---

## 21. POST /admin/governance/write-policies

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Definir una política de escritura
- **Operation ID:** `GovernanceCatalogController_createWritePolicy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceCatalogController.createWritePolicy](../../src/modules/system_ops/controllers/governance-catalog.controller.ts)

### Descripción de negocio

Definir una política de escritura. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/write-policies` en `GovernanceCatalogController_createWritePolicy`. El controlador delega en `GovernanceCatalogService.createWritePolicy`. Valida el body como `CreateWritePolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateWritePolicyDto`; los campos opcionales se omiten.

```http
POST /admin/governance/write-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "insertModeConceptId": "00000000-0000-4000-8000-000000000001",
  "updateModeConceptId": "00000000-0000-4000-8000-000000000001",
  "deleteModeConceptId": "00000000-0000-4000-8000-000000000001"
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
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `insertModeConceptId` | Sí | `string` | formato `uuid` | Modo de inserción (concept id) | `00000000-0000-4000-8000-000000000001` |
| `updateModeConceptId` | Sí | `string` | formato `uuid` | Modo de actualización (concept id) | `00000000-0000-4000-8000-000000000001` |
| `deleteModeConceptId` | Sí | `string` | formato `uuid` | Modo de borrado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `requiresReason` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `requiresApproval` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `dualControl` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `maxBatchSize` | No | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/write-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "insertModeConceptId": "00000000-0000-4000-8000-000000000001",
  "updateModeConceptId": "00000000-0000-4000-8000-000000000001",
  "deleteModeConceptId": "00000000-0000-4000-8000-000000000001",
  "requiresReason": true,
  "requiresApproval": true,
  "dualControl": true,
  "maxBatchSize": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una política de escritura con ese code | Excepción explícita en src/modules/system_ops/services/governance-catalog.service.ts |
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
  "path": "/admin/governance/write-policies"
}
```

---

## 22. POST /admin/ops/backup-policies

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-backup`
- **Nombre:** Definir una política de backup (RPO/RTO/inmutabilidad)
- **Operation ID:** `BackupController_createPolicy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [BackupController.createPolicy](../../src/modules/system_ops/controllers/backup.controller.ts)

### Descripción de negocio

Definir una política de backup (RPO/RTO/inmutabilidad). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/ops/backup-policies` en `BackupController_createPolicy`. El controlador delega en `BackupService.createPolicy`. Valida el body como `CreateBackupPolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateBackupPolicyDto`; los campos opcionales se omiten.

```http
POST /admin/ops/backup-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "resourceScopeConceptId": "00000000-0000-4000-8000-000000000001",
  "backupTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "rpoSeconds": 1,
  "rtoSeconds": 1
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant de la política | `00000000-0000-4000-8000-000000000001` |
| `resourceScopeConceptId` | Sí | `string` | formato `uuid` | Alcance del recurso (concept id) | `00000000-0000-4000-8000-000000000001` |
| `backupTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de backup (concept id) | `00000000-0000-4000-8000-000000000001` |
| `rpoSeconds` | Sí | `number` | mínimo 0 | RPO objetivo en segundos | `1` |
| `rtoSeconds` | Sí | `number` | mínimo 0 | RTO objetivo en segundos | `1` |
| `retentionDays` | No | `number` | mínimo 0 | Días de retención de copias | `1` |
| `immutableCopyRequired` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `encryptionRequired` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `restoreTestFrequencyDays` | No | `number` | mínimo 1 | Frecuencia de prueba de restauración (días) | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/ops/backup-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "resourceScopeConceptId": "00000000-0000-4000-8000-000000000001",
  "backupTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "rpoSeconds": 1,
  "rtoSeconds": 1,
  "retentionDays": 1,
  "immutableCopyRequired": true,
  "encryptionRequired": true,
  "restoreTestFrequencyDays": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El RPO no puede superar al RTO | Excepción explícita en src/modules/system_ops/services/backup.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/ops/backup-policies"
}
```

---

## 23. POST /internal/governance/retention-executions/run

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-retention`
- **Nombre:** Ejecutar un barrido de retención (excluye objetivos bajo legal hold)
- **Operation ID:** `RetentionExecutionController_run`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RetentionExecutionController.run](../../src/modules/system_ops/controllers/retention-execution.controller.ts)

### Descripción de negocio

Ejecutar un barrido de retención (excluye objetivos bajo legal hold). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /internal/governance/retention-executions/run` en `RetentionExecutionController_run`. El controlador delega en `RetentionExecutionService.run`. Valida el body como `RunRetentionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RetentionExecutionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunRetentionDto`; los campos opcionales se omiten.

```http
POST /internal/governance/retention-executions/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "retentionPolicyId": "00000000-0000-4000-8000-000000000001",
  "entityRegistryId": "00000000-0000-4000-8000-000000000001"
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
| `retentionPolicyId` | Sí | `string` | formato `uuid` | Política de retención ACTIVE a ejecutar | `00000000-0000-4000-8000-000000000001` |
| `entityRegistryId` | Sí | `string` | formato `uuid` | Entidad objetivo del registro (entity_registry.id) | `00000000-0000-4000-8000-000000000001` |
| `maxBatchSize` | No | `number` | mínimo 1 | Tamaño máximo de lote a barrer | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/governance/retention-executions/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "retentionPolicyId": "00000000-0000-4000-8000-000000000001",
  "entityRegistryId": "00000000-0000-4000-8000-000000000001",
  "maxBatchSize": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RetentionExecutionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RetentionExecutionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RetentionExecutionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RetentionExecutionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RetentionExecutionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RetentionExecutionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RetentionExecutionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RetentionExecutionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RetentionExecutionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RetentionExecutionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "totalScanned": 1,
  "totalDeleted": 1,
  "totalAnonymized": 1,
  "totalArchived": 1,
  "blockedByLegalHold": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado final (concept id) | `00000000-0000-4000-8000-000000000001` |
| `totalScanned` | Sí | `number` | Sin restricción adicional declarada | Valor de total scanned mantenido por la instancia. | `1` |
| `totalDeleted` | Sí | `number` | Sin restricción adicional declarada | Valor de total deleted mantenido por la instancia. | `1` |
| `totalAnonymized` | Sí | `number` | Sin restricción adicional declarada | Valor de total anonymized mantenido por la instancia. | `1` |
| `totalArchived` | Sí | `number` | Sin restricción adicional declarada | Valor de total archived mantenido por la instancia. | `1` |
| `blockedByLegalHold` | No | `boolean` | Sin restricción adicional declarada | true si se detuvo por legal hold activo | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Política de retención no encontrada | Excepción explícita en src/modules/system_ops/services/retention-execution.service.ts |
| 404 | `NOT_FOUND` | Entidad objetivo no encontrada | Excepción explícita en src/modules/system_ops/services/retention-execution.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La política de retención no está ACTIVE | Excepción explícita en src/modules/system_ops/services/retention-execution.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/governance/retention-executions/run"
}
```

---

## 24. POST /internal/ops/restore-test-runs

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-restore`
- **Nombre:** Registrar una prueba de restauración con evidencia
- **Operation ID:** `RestoreTestController_recordRestoreTest`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RestoreTestController.recordRestoreTest](../../src/modules/system_ops/controllers/restore-test.controller.ts)

### Descripción de negocio

Registrar una prueba de restauración con evidencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /internal/ops/restore-test-runs` en `RestoreTestController_recordRestoreTest`. El controlador delega en `BackupService.recordRestoreTest`. Valida el body como `CreateRestoreTestRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<RestoreTestRunResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateRestoreTestRunDto`; los campos opcionales se omiten.

```http
POST /internal/ops/restore-test-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "backupPolicyId": "00000000-0000-4000-8000-000000000001",
  "outcomeConceptId": "00000000-0000-4000-8000-000000000001"
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
| `backupPolicyId` | Sí | `string` | formato `uuid` | Política de backup ACTIVE | `00000000-0000-4000-8000-000000000001` |
| `backupReference` | No | `string` | longitud máxima 200 | Referencia del backup restaurado | `valor-ejemplo` |
| `outcomeConceptId` | Sí | `string` | formato `uuid` | Resultado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `measuredRpoSeconds` | No | `number` | mínimo 0 | RPO medido en segundos | `1` |
| `measuredRtoSeconds` | No | `number` | mínimo 0 | RTO medido en segundos | `1` |
| `integrityCheckPassed` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `evidenceFileId` | No | `string` | formato `uuid` | Archivo de evidencia (common.files.id) | `00000000-0000-4000-8000-000000000001` |
| `startedAt` | No | `string` | formato `date-time` | Inicio de la prueba (ISO) | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/ops/restore-test-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "backupPolicyId": "00000000-0000-4000-8000-000000000001",
  "backupReference": "valor-ejemplo",
  "outcomeConceptId": "00000000-0000-4000-8000-000000000001",
  "measuredRpoSeconds": 1,
  "measuredRtoSeconds": 1,
  "integrityCheckPassed": true,
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RestoreTestRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RestoreTestRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RestoreTestRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RestoreTestRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RestoreTestRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RestoreTestRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RestoreTestRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RestoreTestRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RestoreTestRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RestoreTestRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "outcomeConceptId": "00000000-0000-4000-8000-000000000001",
  "objectiveBreached": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `outcomeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a outcome concept. | `00000000-0000-4000-8000-000000000001` |
| `objectiveBreached` | Sí | `boolean` | Sin restricción adicional declarada | true si el RPO/RTO medido supera el objetivo | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Política de backup no encontrada | Excepción explícita en src/modules/system_ops/services/backup.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La política de backup no está ACTIVE | Excepción explícita en src/modules/system_ops/services/backup.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/ops/restore-test-runs"
}
```

---

