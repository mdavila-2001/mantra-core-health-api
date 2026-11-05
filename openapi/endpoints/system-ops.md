<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `system_ops`

Referencia exhaustiva de 35 operación(es) del módulo `system_ops`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `system-ops-assessments`, `system-ops-backup`, `system-ops-drafts`, `system-ops-governance`, `system-ops-legal-holds`, `system-ops-residency`, `system-ops-restore`, `system-ops-retention`
- **Controladores:** `AssessmentController`, `BackupController`, `DraftController`, `GovernanceCatalogController`, `GovernanceOperationsReadController`, `GovernanceReadController`, `LegalHoldController`, `MutabilityController`, `ResidencyController`, `RestoreTestController`, `RetentionExecutionController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /admin/governance/anonymization-rules](#1-post-admin-governance-anonymization-rules) — Definir una regla de anonimización
2. [POST /admin/governance/assessments/{id}/findings](#2-post-admin-governance-assessments-id-findings) — Abrir un hallazgo sobre una evaluación
3. [POST /admin/governance/assessments/{id}/remediation-plans](#3-post-admin-governance-assessments-id-remediation-plans) — Crear un plan de remediación con sus acciones
4. [GET /admin/governance/change-log](#4-get-admin-governance-change-log) — Cambios de gobierno de datos: quién cambió qué y cuándo
5. [POST /admin/governance/cross-border-transfers](#5-post-admin-governance-cross-border-transfers) — Registrar una transferencia transfronteriza (append-only)
6. [GET /admin/governance/domains](#6-get-admin-governance-domains) — Dominios de datos y cuántas entidades declara cada uno
7. [POST /admin/governance/drafts](#7-post-admin-governance-drafts) — Guardar un draft record genérico
8. [POST /admin/governance/drafts/{id}/publish](#8-post-admin-governance-drafts-id-publish) — Publicar un draft record y materializarlo
9. [GET /admin/governance/entity-registry](#9-get-admin-governance-entity-registry) — Entidades declaradas en el registro de gobierno (dominio, clasificación, PII/PHI)
10. [POST /admin/governance/entity-registry](#10-post-admin-governance-entity-registry) — Registrar dominio, clasificación y catalogar entidad + campos
11. [GET /admin/governance/entity-registry/{id}/fields](#11-get-admin-governance-entity-registry-id-fields) — Campos declarados de una entidad, con su marca PII/PHI y su enmascaramiento
12. [PATCH /admin/governance/entity-registry/{id}/retention](#12-patch-admin-governance-entity-registry-id-retention) — Aplicar una política de retención a una entidad
13. [PATCH /admin/governance/entity-registry/{id}/write-policy](#13-patch-admin-governance-entity-registry-id-write-policy) — Vincular una política de escritura a una entidad
14. [PATCH /admin/governance/field-registry/{id}](#14-patch-admin-governance-field-registry-id) — Asignar regla de anonimización / masking a un campo
15. [PATCH /admin/governance/findings/{id}](#15-patch-admin-governance-findings-id) — Actualizar un hallazgo (estado / owner)
16. [GET /admin/governance/legal-holds](#16-get-admin-governance-legal-holds) — Retenciones legales (legal holds), sin la referencia de la autoridad
17. [POST /admin/governance/legal-holds](#17-post-admin-governance-legal-holds) — Colocar un legal hold sobre un objetivo
18. [POST /admin/governance/legal-holds/{id}/release](#18-post-admin-governance-legal-holds-id-release) — Levantar un legal hold ACTIVE
19. [GET /admin/governance/mutability](#19-get-admin-governance-mutability) — Listar la mutabilidad por tabla (modo de escritura, disposición, legal hold y nivel de evidencia)
20. [GET /admin/governance/mutability/{schema}/{table}](#20-get-admin-governance-mutability-schema-table) — Detalle de una tabla: toda la evidencia con su fuente y las contradicciones sin resolver
21. [GET /admin/governance/mutability/summary](#21-get-admin-governance-mutability-summary) — Resumen de mutabilidad: tablas por modo y por nivel de evidencia (numerador/denominador) y hallazgos
22. [POST /admin/governance/operational-frameworks](#22-post-admin-governance-operational-frameworks) — Publicar un framework operativo con sus controles
23. [GET /admin/governance/policies](#23-get-admin-governance-policies) — Políticas de gobierno (escritura, retención, anonimización, residencia) en una lista paginada
24. [GET /admin/governance/policies/{policyType}/{id}](#24-get-admin-governance-policies-policytype-id) — Una política: ajustes, estado y a qué tablas o columnas se aplica
25. [POST /admin/governance/remediation-actions/{id}/verify](#25-post-admin-governance-remediation-actions-id-verify) — Verificar y cerrar una acción de remediación
26. [POST /admin/governance/residency-policies](#26-post-admin-governance-residency-policies) — Definir una política de residencia de datos
27. [GET /admin/governance/retention-executions](#27-get-admin-governance-retention-executions) — Ejecuciones de políticas de retención: estado, tiempos y conteos
28. [POST /admin/governance/retention-policies](#28-post-admin-governance-retention-policies) — Definir una política de retención con base legal
29. [POST /admin/governance/tenant-residency-bindings](#29-post-admin-governance-tenant-residency-bindings) — Vincular un tenant a una política de residencia
30. [POST /admin/governance/workload-assessments](#30-post-admin-governance-workload-assessments) — Iniciar una evaluación de workload
31. [PUT /admin/governance/workload-assessments/{id}/control-results](#31-put-admin-governance-workload-assessments-id-control-results) — Registrar (UPSERT) resultados de control de una evaluación
32. [POST /admin/governance/write-policies](#32-post-admin-governance-write-policies) — Definir una política de escritura
33. [POST /admin/ops/backup-policies](#33-post-admin-ops-backup-policies) — Definir una política de backup (RPO/RTO/inmutabilidad)
34. [POST /internal/governance/retention-executions/run](#34-post-internal-governance-retention-executions-run) — Ejecutar un barrido de retención (excluye objetivos bajo legal hold)
35. [POST /internal/ops/restore-test-runs](#35-post-internal-ops-restore-test-runs) — Registrar una prueba de restauración con evidencia

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
| 504 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

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
| 504 | Operación completada correctamente. | `Promise<FindingResponseDto>` | No |

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
| 504 | Operación completada correctamente. | `Promise<RemediationPlanResponseDto>` | No |

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

## 4. GET /admin/governance/change-log

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Cambios de gobierno de datos: quién cambió qué y cuándo
- **Operation ID:** `GovernanceReadController_changeLog`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceReadController.changeLog](../../src/modules/system_ops/controllers/governance-read.controller.ts)

### Descripción de negocio

Filtra por tipo de objeto, objeto, actor y fecha. Sin rango, los últimos 30 días (la tabla no tiene índice por fecha).


### Descripción del sistema

NestJS resuelve `GET /admin/governance/change-log` en `GovernanceReadController_changeLog`. El controlador delega en `GovernanceReadService.changeLog`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 600 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `targetType` | query | No | `string` | longitud máxima 100 | Tipo de objeto cambiado (`entity_registry`, `write_policies`…) | `valor-ejemplo` |
| `targetId` | query | No | `string` | formato `uuid` | Objeto cambiado | `00000000-0000-4000-8000-000000000001` |
| `changedBy` | query | No | `string` | formato `uuid` | Actor del cambio | `00000000-0000-4000-8000-000000000001` |
| `from` | query | No | `string` | Sin restricción adicional declarada | Desde (ISO 8601, incluido). Sin rango, los últimos 30 días | `valor-ejemplo` |
| `to` | query | No | `string` | Sin restricción adicional declarada | Hasta (ISO 8601, excluido) | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/change-log HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/governance/change-log?limit=50&cursor=valor-ejemplo&targetType=valor-ejemplo&targetId=00000000-0000-4000-8000-000000000001&changedBy=00000000-0000-4000-8000-000000000001&from=valor-ejemplo&to=valor-ejemplo HTTP/1.1
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
| 400 | `VALIDATION_FAILED` | «to» debe ser posterior a «from» | Excepción explícita en src/modules/system_ops/services/governance-read.service.ts |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/change-log"
}
```

---

## 5. POST /admin/governance/cross-border-transfers

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
| 504 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

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

## 6. GET /admin/governance/domains

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Dominios de datos y cuántas entidades declara cada uno
- **Operation ID:** `GovernanceOperationsReadController_domains`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceOperationsReadController.domains](../../src/modules/system_ops/controllers/governance-operations-read.controller.ts)

### Descripción de negocio

Dominios de datos y cuántas entidades declara cada uno. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/governance/domains` en `GovernanceOperationsReadController_domains`. El controlador delega en `GovernanceOperationsReadService.domains`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 600 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `q` | query | No | `string` | longitud máxima 120 | Busca en código y nombre, sin mayúsculas | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/domains HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/governance/domains?limit=50&cursor=valor-ejemplo&q=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Página de dominios | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/domains"
}
```

---

## 7. POST /admin/governance/drafts

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
| 504 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |

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

## 8. POST /admin/governance/drafts/{id}/publish

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
| 504 | Operación completada correctamente. | `Promise<DraftResponseDto>` | No |

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

## 9. GET /admin/governance/entity-registry

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Entidades declaradas en el registro de gobierno (dominio, clasificación, PII/PHI)
- **Operation ID:** `GovernanceReadController_entityRegistry`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceReadController.entityRegistry](../../src/modules/system_ops/controllers/governance-read.controller.ts)

### Descripción de negocio

Entidades declaradas en el registro de gobierno (dominio, clasificación, PII/PHI). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/governance/entity-registry` en `GovernanceReadController_entityRegistry`. El controlador delega en `GovernanceReadService.entityRegistry`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 600 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `schema` | query | No | `string` | Sin restricción adicional declarada | Schema de PostgreSQL | `valor-ejemplo` |
| `q` | query | No | `string` | longitud máxima 120 | Busca en `schema.tabla`, sin mayúsculas | `valor-ejemplo` |
| `domain` | query | No | `string` | Sin restricción adicional declarada | Código del dominio de datos | `valor-ejemplo` |
| `classification` | query | No | `string` | Sin restricción adicional declarada | Código de la clasificación | `valor-ejemplo` |
| `containsPii` | query | No | `boolean` | Sin restricción adicional declarada | Sólo las entidades marcadas (o no) como PII | `true` |
| `containsPhi` | query | No | `boolean` | Sin restricción adicional declarada | Sólo las entidades marcadas (o no) como PHI | `true` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/entity-registry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/governance/entity-registry?limit=50&cursor=valor-ejemplo&schema=valor-ejemplo&q=valor-ejemplo&domain=valor-ejemplo&classification=valor-ejemplo&containsPii=true&containsPhi=true HTTP/1.1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
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

## 10. POST /admin/governance/entity-registry

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
| 504 | Operación completada correctamente. | `Promise<EntityRegistryResponseDto>` | No |

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

## 11. GET /admin/governance/entity-registry/{id}/fields

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Campos declarados de una entidad, con su marca PII/PHI y su enmascaramiento
- **Operation ID:** `GovernanceReadController_fields`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceReadController.fields](../../src/modules/system_ops/controllers/governance-read.controller.ts)

### Descripción de negocio

Campos declarados de una entidad, con su marca PII/PHI y su enmascaramiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/governance/entity-registry/{id}/fields` en `GovernanceReadController_fields`. El controlador delega en `GovernanceReadService.fieldRegistry`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 600 | `nextCursor` de la página anterior | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/entity-registry/00000000-0000-4000-8000-000000000001/fields HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/governance/entity-registry/00000000-0000-4000-8000-000000000001/fields?limit=50&cursor=valor-ejemplo HTTP/1.1
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
| 404 | La entidad no está en el registro | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Entidad del registro no encontrada | Excepción explícita en src/modules/system_ops/services/governance-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/entity-registry/{id}/fields"
}
```

---

## 12. PATCH /admin/governance/entity-registry/{id}/retention

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

## 13. PATCH /admin/governance/entity-registry/{id}/write-policy

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

## 14. PATCH /admin/governance/field-registry/{id}

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

## 15. PATCH /admin/governance/findings/{id}

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

## 16. GET /admin/governance/legal-holds

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Retenciones legales (legal holds), sin la referencia de la autoridad
- **Operation ID:** `GovernanceOperationsReadController_legalHolds`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceOperationsReadController.legalHolds](../../src/modules/system_ops/controllers/governance-operations-read.controller.ts)

### Descripción de negocio

Retenciones legales (legal holds), sin la referencia de la autoridad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/governance/legal-holds` en `GovernanceOperationsReadController_legalHolds`. El controlador delega en `GovernanceOperationsReadService.legalHolds`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 600 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `status` | query | No | `string` | Sin restricción adicional declarada | Código del estado (concepto), p. ej. `ACTIVE` o `RELEASED` | `ok` |
| `targetType` | query | No | `string` | Sin restricción adicional declarada | Código del tipo de objetivo (concepto) | `valor-ejemplo` |
| `tenantId` | query | No | `string` | formato `uuid` | Organización del hold | `00000000-0000-4000-8000-000000000001` |
| `targetId` | query | No | `string` | formato `uuid` | Objetivo retenido | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/legal-holds HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_GOVERNANCE_ADMIN`, `DPO`, `AUDITOR`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/governance/legal-holds?limit=50&cursor=valor-ejemplo&status=ok&targetType=valor-ejemplo&tenantId=00000000-0000-4000-8000-000000000001&targetId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Página de retenciones legales | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_GOVERNANCE_ADMIN, DPO, AUDITOR. | Roles/tenant/guards de autorización |
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

## 17. POST /admin/governance/legal-holds

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
| 504 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

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

## 18. POST /admin/governance/legal-holds/{id}/release

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

## 19. GET /admin/governance/mutability

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Listar la mutabilidad por tabla (modo de escritura, disposición, legal hold y nivel de evidencia)
- **Operation ID:** `MutabilityController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MutabilityController.list](../../src/modules/system_ops/mutability/controllers/mutability.controller.ts)

### Descripción de negocio

Listar la mutabilidad por tabla (modo de escritura, disposición, legal hold y nivel de evidencia). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/governance/mutability` en `MutabilityController_list`. El controlador delega en `MutabilityCatalogService.list`. No recibe body. El tipo de retorno estático es `Promise<MutabilityPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 600 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `schema` | query | No | `string` | longitud máxima 63 | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `writeMode` | query | No | `string` | valores: `APPEND_ONLY`, `APPEND_ONLY_PURGEABLE`, `LIFECYCLE_ONLY`, `UPDATABLE`, `UPDATABLE_DELETABLE`, `SOFT_DELETE`, `UNKNOWN` | Sin descripción específica en OpenAPI. | `APPEND_ONLY` |
| `evidence` | query | No | `string` | valores: `ENFORCED_DB`, `ENFORCED_CODE`, `DECLARED_MODEL`, `DECLARED_DOC`, `INFERRED`, `UNKNOWN` | Sin descripción específica en OpenAPI. | `ENFORCED_DB` |
| `finding` | query | No | `string` | valores: `ANY`, `NONE`, `CONTRADICTION`, `GAP` | Sin descripción específica en OpenAPI. | `ANY` |
| `disposition` | query | No | `string` | valores: `KEEP`, `PURGE_BY_RETENTION`, `ANONYMIZE`, `ARCHIVE`, `UNKNOWN` | Sin descripción específica en OpenAPI. | `KEEP` |
| `legalHold` | query | No | `string` | valores: `HOLD_AWARE`, `HOLD_CAPABLE_NOT_ENFORCED`, `UNKNOWN` | Sin descripción específica en OpenAPI. | `HOLD_AWARE` |
| `database` | query | No | `string` | valores: `main`, `pay` | Sin descripción específica en OpenAPI. | `main` |
| `q` | query | No | `string` | longitud máxima 120 | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/mutability HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/governance/mutability?limit=50&cursor=valor-ejemplo&schema=valor-ejemplo&writeMode=APPEND_ONLY&evidence=ENFORCED_DB&finding=ANY&disposition=KEEP&legalHold=HOLD_AWARE&database=main&q=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MutabilityPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<MutabilityPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MutabilityPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MutabilityPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MutabilityPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MutabilityPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<MutabilityPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MutabilityPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "schema": "valor-ejemplo",
      "table": "valor-ejemplo",
      "database": "main",
      "writeMode": "APPEND_ONLY",
      "writeModeLevel": "ENFORCED_DB",
      "disposition": "KEEP",
      "dispositionLevel": "ENFORCED_DB",
      "retention": {
        "days": 1,
        "source": "valor-ejemplo",
        "status": "PENDIENTE_DE_CUMPLIMIENTO"
      },
      "legalHold": "HOLD_AWARE",
      "legalHoldLevel": "ENFORCED_DB",
      "contradictions": 1,
      "gaps": 1,
      "registered": true
    }
  ],
  "nextCursor": "valor-ejemplo",
  "limit": 1,
  "total": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<MutabilityItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"schema":"valor-ejemplo","table":"valor-ejemplo","database":"main","writeMode":"APPEND_ONLY","writeModeLevel":"ENFORCED_DB","disposition":"KEEP","dispositionLevel":"ENFORCED_DB","retention":{"days":1,"source":"valor-ejemplo","status":"PENDIENTE_DE_CUMPLIMIENTO"},"legalHold":"HOLD_AWARE","legalHoldLevel":"ENFORCED_DB","contradictions":1,"gaps":1,"registered":true}]` |
| `items[].schema` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].table` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].database` | Sí | `string` | valores: `main`, `pay` | Sin descripción específica en el contrato OpenAPI. | `main` |
| `items[].writeMode` | Sí | `string` | valores: `APPEND_ONLY`, `APPEND_ONLY_PURGEABLE`, `LIFECYCLE_ONLY`, `UPDATABLE`, `UPDATABLE_DELETABLE`, `SOFT_DELETE`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `APPEND_ONLY` |
| `items[].writeModeLevel` | Sí | `string` | valores: `ENFORCED_DB`, `ENFORCED_CODE`, `DECLARED_MODEL`, `DECLARED_DOC`, `INFERRED`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `ENFORCED_DB` |
| `items[].disposition` | Sí | `string` | valores: `KEEP`, `PURGE_BY_RETENTION`, `ANONYMIZE`, `ARCHIVE`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `KEEP` |
| `items[].dispositionLevel` | Sí | `string` | valores: `ENFORCED_DB`, `ENFORCED_CODE`, `DECLARED_MODEL`, `DECLARED_DOC`, `INFERRED`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `ENFORCED_DB` |
| `items[].retention` | Sí | `MutabilityRetentionDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"days":1,"source":"valor-ejemplo","status":"PENDIENTE_DE_CUMPLIMIENTO"}` |
| `items[].retention.days` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].retention.source` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].retention.status` | Sí | `string` | valores: `PENDIENTE_DE_CUMPLIMIENTO` | Sin descripción específica en el contrato OpenAPI. | `PENDIENTE_DE_CUMPLIMIENTO` |
| `items[].legalHold` | Sí | `string` | valores: `HOLD_AWARE`, `HOLD_CAPABLE_NOT_ENFORCED`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `HOLD_AWARE` |
| `items[].legalHoldLevel` | Sí | `string` | valores: `ENFORCED_DB`, `ENFORCED_CODE`, `DECLARED_MODEL`, `DECLARED_DOC`, `INFERRED`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `ENFORCED_DB` |
| `items[].contradictions` | Sí | `number` | Sin restricción adicional declarada | Contradicciones registradas (no resueltas) | `1` |
| `items[].gaps` | Sí | `number` | Sin restricción adicional declarada | Brechas: declarado sin imponer | `1` |
| `items[].registered` | Sí | `boolean` | admite null | ¿Está en system_ops.entity_registry? `null` si no se pudo consultar | `true` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/mutability"
}
```

---

## 20. GET /admin/governance/mutability/{schema}/{table}

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Detalle de una tabla: toda la evidencia con su fuente y las contradicciones sin resolver
- **Operation ID:** `MutabilityController_detail`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MutabilityController.detail](../../src/modules/system_ops/mutability/controllers/mutability.controller.ts)

### Descripción de negocio

Detalle de una tabla: toda la evidencia con su fuente y las contradicciones sin resolver. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/governance/mutability/{schema}/{table}` en `MutabilityController_detail`. El controlador delega en `MutabilityCatalogService.detail`. No recibe body. El tipo de retorno estático es `Promise<MutabilityDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `schema` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `table` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/mutability/valor-ejemplo/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/governance/mutability/valor-ejemplo/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MutabilityDetailDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<MutabilityDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MutabilityDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MutabilityDetailDto>` | No |
| 404 | La tabla no está en el catálogo | `Promise<MutabilityDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MutabilityDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MutabilityDetailDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<MutabilityDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MutabilityDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "schema": "valor-ejemplo",
  "table": "valor-ejemplo",
  "database": "main",
  "writeMode": "APPEND_ONLY",
  "writeModeLevel": "ENFORCED_DB",
  "disposition": "KEEP",
  "dispositionLevel": "ENFORCED_DB",
  "retention": {
    "days": 1,
    "source": "valor-ejemplo",
    "status": "PENDIENTE_DE_CUMPLIMIENTO"
  },
  "legalHold": "HOLD_AWARE",
  "legalHoldLevel": "ENFORCED_DB",
  "contradictions": 1,
  "gaps": 1,
  "registered": true,
  "evidence": [
    "valor-ejemplo"
  ],
  "findings": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `schema` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `table` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `database` | Sí | `string` | valores: `main`, `pay` | Sin descripción específica en el contrato OpenAPI. | `main` |
| `writeMode` | Sí | `string` | valores: `APPEND_ONLY`, `APPEND_ONLY_PURGEABLE`, `LIFECYCLE_ONLY`, `UPDATABLE`, `UPDATABLE_DELETABLE`, `SOFT_DELETE`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `APPEND_ONLY` |
| `writeModeLevel` | Sí | `string` | valores: `ENFORCED_DB`, `ENFORCED_CODE`, `DECLARED_MODEL`, `DECLARED_DOC`, `INFERRED`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `ENFORCED_DB` |
| `disposition` | Sí | `string` | valores: `KEEP`, `PURGE_BY_RETENTION`, `ANONYMIZE`, `ARCHIVE`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `KEEP` |
| `dispositionLevel` | Sí | `string` | valores: `ENFORCED_DB`, `ENFORCED_CODE`, `DECLARED_MODEL`, `DECLARED_DOC`, `INFERRED`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `ENFORCED_DB` |
| `retention` | Sí | `MutabilityRetentionDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"days":1,"source":"valor-ejemplo","status":"PENDIENTE_DE_CUMPLIMIENTO"}` |
| `retention.days` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `retention.source` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `retention.status` | Sí | `string` | valores: `PENDIENTE_DE_CUMPLIMIENTO` | Sin descripción específica en el contrato OpenAPI. | `PENDIENTE_DE_CUMPLIMIENTO` |
| `legalHold` | Sí | `string` | valores: `HOLD_AWARE`, `HOLD_CAPABLE_NOT_ENFORCED`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `HOLD_AWARE` |
| `legalHoldLevel` | Sí | `string` | valores: `ENFORCED_DB`, `ENFORCED_CODE`, `DECLARED_MODEL`, `DECLARED_DOC`, `INFERRED`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `ENFORCED_DB` |
| `contradictions` | Sí | `number` | Sin restricción adicional declarada | Contradicciones registradas (no resueltas) | `1` |
| `gaps` | Sí | `number` | Sin restricción adicional declarada | Brechas: declarado sin imponer | `1` |
| `registered` | Sí | `boolean` | admite null | ¿Está en system_ops.entity_registry? `null` si no se pudo consultar | `true` |
| `evidence` | Sí | `array<string>` | Sin restricción adicional declarada | Toda la evidencia, con su fuente exacta | `["valor-ejemplo"]` |
| `findings` | Sí | `array<string>` | Sin restricción adicional declarada | Contradicciones (no resueltas) y brechas | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La tabla no está en el catálogo de mutabilidad | Excepción explícita en src/modules/system_ops/mutability/services/mutability-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/mutability/{schema}/{table}"
}
```

---

## 21. GET /admin/governance/mutability/summary

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Resumen de mutabilidad: tablas por modo y por nivel de evidencia (numerador/denominador) y hallazgos
- **Operation ID:** `MutabilityController_summary`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MutabilityController.summary](../../src/modules/system_ops/mutability/controllers/mutability.controller.ts)

### Descripción de negocio

Resumen de mutabilidad: tablas por modo y por nivel de evidencia (numerador/denominador) y hallazgos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/governance/mutability/summary` en `MutabilityController_summary`. El controlador delega en `MutabilityCatalogService.summary`. No recibe body. El tipo de retorno estático es `Promise<MutabilitySummaryDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/mutability/summary HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/governance/mutability/summary HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MutabilitySummaryDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<MutabilitySummaryDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MutabilitySummaryDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MutabilitySummaryDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MutabilitySummaryDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MutabilitySummaryDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<MutabilitySummaryDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MutabilitySummaryDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "totalTables": 1,
  "byWriteMode": [
    {
      "numerator": 1,
      "denominator": 1,
      "writeMode": "APPEND_ONLY",
      "byEvidence": {
        "clave": "valor"
      }
    }
  ],
  "byEvidence": [
    {
      "numerator": 1,
      "denominator": 1,
      "level": "ENFORCED_DB"
    }
  ],
  "decided": {
    "numerator": 1,
    "denominator": 1
  },
  "enforcedByDatabase": {
    "numerator": 1,
    "denominator": 1
  },
  "withContradictions": {
    "numerator": 1,
    "denominator": 1
  },
  "withGaps": {
    "numerator": 1,
    "denominator": 1
  },
  "findingCodes": [
    {
      "code": "CODIGO_EJEMPLO",
      "kind": "CONTRADICTION",
      "findings": 1,
      "tables": 1
    }
  ],
  "disposition": [
    {
      "numerator": 1,
      "denominator": 1
    }
  ],
  "legalHold": [
    {
      "numerator": 1,
      "denominator": 1
    }
  ],
  "withDeclaredPeriod": 1,
  "pendingCompliance": 1,
  "registered": {
    "numerator": 1,
    "denominator": 1
  },
  "sources": {
    "clave": "valor"
  },
  "generatedFrom": {}
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `totalTables` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `byWriteMode` | Sí | `array<MutabilityModeCountDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"numerator":1,"denominator":1,"writeMode":"APPEND_ONLY","byEvidence":{"clave":"valor"}}]` |
| `byWriteMode[].numerator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `byWriteMode[].denominator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `byWriteMode[].writeMode` | Sí | `string` | valores: `APPEND_ONLY`, `APPEND_ONLY_PURGEABLE`, `LIFECYCLE_ONLY`, `UPDATABLE`, `UPDATABLE_DELETABLE`, `SOFT_DELETE`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `APPEND_ONLY` |
| `byWriteMode[].byEvidence` | Sí | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"clave":"valor"}` |
| `byEvidence` | Sí | `array<MutabilityLevelCountDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"numerator":1,"denominator":1,"level":"ENFORCED_DB"}]` |
| `byEvidence[].numerator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `byEvidence[].denominator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `byEvidence[].level` | Sí | `string` | valores: `ENFORCED_DB`, `ENFORCED_CODE`, `DECLARED_MODEL`, `DECLARED_DOC`, `INFERRED`, `UNKNOWN` | Sin descripción específica en el contrato OpenAPI. | `ENFORCED_DB` |
| `decided` | Sí | `MutabilityRatioDto` | Sin restricción adicional declarada | Tablas con modo distinto de UNKNOWN | `{"numerator":1,"denominator":1}` |
| `decided.numerator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `decided.denominator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `enforcedByDatabase` | Sí | `MutabilityRatioDto` | Sin restricción adicional declarada | Tablas con el modo impuesto por la base de datos | `{"numerator":1,"denominator":1}` |
| `enforcedByDatabase.numerator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `enforcedByDatabase.denominator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `withContradictions` | Sí | `MutabilityRatioDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"numerator":1,"denominator":1}` |
| `withContradictions.numerator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `withContradictions.denominator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `withGaps` | Sí | `MutabilityRatioDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"numerator":1,"denominator":1}` |
| `withGaps.numerator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `withGaps.denominator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `findingCodes` | Sí | `array<MutabilityFindingCodeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","kind":"CONTRADICTION","findings":1,"tables":1}]` |
| `findingCodes[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `findingCodes[].kind` | Sí | `string` | valores: `CONTRADICTION`, `GAP` | Sin descripción específica en el contrato OpenAPI. | `CONTRADICTION` |
| `findingCodes[].findings` | Sí | `number` | Sin restricción adicional declarada | Hallazgos con ese código | `1` |
| `findingCodes[].tables` | Sí | `number` | Sin restricción adicional declarada | Tablas afectadas | `1` |
| `disposition` | Sí | `array<MutabilityRatioDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"numerator":1,"denominator":1}]` |
| `disposition[].numerator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `disposition[].denominator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `legalHold` | Sí | `array<MutabilityRatioDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"numerator":1,"denominator":1}]` |
| `legalHold[].numerator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `legalHold[].denominator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `withDeclaredPeriod` | Sí | `number` | Sin restricción adicional declarada | Tablas con plazo declarado por una fuente | `1` |
| `pendingCompliance` | Sí | `number` | Sin restricción adicional declarada | Tablas con retención aún PENDIENTE_DE_CUMPLIMIENTO | `1` |
| `registered` | Sí | `MutabilityRatioDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"numerator":1,"denominator":1}` |
| `registered.numerator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `registered.denominator` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `sources` | Sí | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"clave":"valor"}` |
| `generatedFrom` | Sí | `object` | Sin restricción adicional declarada | Desde qué fuentes se generó el catálogo | `{}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/mutability/summary"
}
```

---

## 22. POST /admin/governance/operational-frameworks

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
| 504 | Operación completada correctamente. | `Promise<FrameworkResponseDto>` | No |

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

## 23. GET /admin/governance/policies

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Políticas de gobierno (escritura, retención, anonimización, residencia) en una lista paginada
- **Operation ID:** `GovernanceReadController_policies`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceReadController.policies](../../src/modules/system_ops/controllers/governance-read.controller.ts)

### Descripción de negocio

Políticas de gobierno (escritura, retención, anonimización, residencia) en una lista paginada. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/governance/policies` en `GovernanceReadController_policies`. El controlador delega en `GovernanceReadService.policies`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 600 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `type` | query | No | `string` | valores: `WRITE`, `RETENTION`, `ANONYMIZATION`, `RESIDENCY` | Sin descripción específica en OpenAPI. | `WRITE` |
| `state` | query | No | `string` | Sin restricción adicional declarada | Código del estado (concepto), p. ej. `ACTIVE` | `valor-ejemplo` |
| `q` | query | No | `string` | longitud máxima 120 | Busca en código y nombre, sin mayúsculas | `valor-ejemplo` |
| `sort` | query | No | `string` | valores: `code`, `updatedAt` | Sin descripción específica en OpenAPI. | `code` |
| `order` | query | No | `string` | valores: `asc`, `desc` | Sin descripción específica en OpenAPI. | `asc` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/governance/policies?limit=50&cursor=valor-ejemplo&type=WRITE&state=valor-ejemplo&q=valor-ejemplo&sort=code&order=asc HTTP/1.1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/policies"
}
```

---

## 24. GET /admin/governance/policies/{policyType}/{id}

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Una política: ajustes, estado y a qué tablas o columnas se aplica
- **Operation ID:** `GovernanceReadController_policy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceReadController.policy](../../src/modules/system_ops/controllers/governance-read.controller.ts)

### Descripción de negocio

Una política: ajustes, estado y a qué tablas o columnas se aplica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/governance/policies/{policyType}/{id}` en `GovernanceReadController_policy`. El controlador delega en `GovernanceReadService.policy`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `policyType` | path | Sí | `string` | valores: `WRITE`, `RETENTION`, `ANONYMIZATION`, `RESIDENCY` | Sin descripción específica en OpenAPI. | `WRITE` |
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/policies/WRITE/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/governance/policies/WRITE/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 404 | La política no existe | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Política no encontrada | Excepción explícita en src/modules/system_ops/services/governance-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/policies/{policyType}/{id}"
}
```

---

## 25. POST /admin/governance/remediation-actions/{id}/verify

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

## 26. POST /admin/governance/residency-policies

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
| 504 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

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

## 27. GET /admin/governance/retention-executions

- **Módulo:** `system_ops`
- **Etiqueta OpenAPI:** `system-ops-governance`
- **Nombre:** Ejecuciones de políticas de retención: estado, tiempos y conteos
- **Operation ID:** `GovernanceOperationsReadController_retentionExecutions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GovernanceOperationsReadController.retentionExecutions](../../src/modules/system_ops/controllers/governance-operations-read.controller.ts)

### Descripción de negocio

Ejecuciones de políticas de retención: estado, tiempos y conteos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/governance/retention-executions` en `GovernanceOperationsReadController_retentionExecutions`. El controlador delega en `GovernanceOperationsReadService.retentionExecutions`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 600 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `policyId` | query | No | `string` | formato `uuid` | Política de retención | `00000000-0000-4000-8000-000000000001` |
| `entityRegistryId` | query | No | `string` | formato `uuid` | Entidad del registro | `00000000-0000-4000-8000-000000000001` |
| `status` | query | No | `string` | valores: `RUNNING`, `SUCCEEDED`, `FAILED` | Sin descripción específica en OpenAPI. | `RUNNING` |
| `from` | query | No | `string` | Sin restricción adicional declarada | Registrada desde (ISO 8601, incluido) | `valor-ejemplo` |
| `to` | query | No | `string` | Sin restricción adicional declarada | Registrada hasta (ISO 8601, excluido) | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/retention-executions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/governance/retention-executions?limit=50&cursor=valor-ejemplo&policyId=00000000-0000-4000-8000-000000000001&entityRegistryId=00000000-0000-4000-8000-000000000001&status=RUNNING&from=valor-ejemplo&to=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Página de ejecuciones | `no declarado` | No |
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
| 400 | `VALIDATION_FAILED` | «to» debe ser posterior a «from» | Excepción explícita en src/modules/system_ops/services/governance-operations-read.service.ts |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/retention-executions"
}
```

---

## 28. POST /admin/governance/retention-policies

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
| 504 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

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

## 29. POST /admin/governance/tenant-residency-bindings

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
| 504 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

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
| 404 | `NOT_FOUND` | El tenant o la política de residencia no existen | Excepción explícita en src/modules/system_ops/services/residency.service.ts |
| 404 | `NOT_FOUND` | Una de las regiones indicadas no existe | Excepción explícita en src/modules/system_ops/services/residency.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La política de residencia no está activa | Excepción explícita en src/modules/system_ops/services/residency.service.ts |
| 422 | `PRECONDITION_FAILED` | Una de las regiones queda fuera de las que la política permite | Excepción explícita en src/modules/system_ops/services/residency.service.ts |
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

## 30. POST /admin/governance/workload-assessments

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
| 504 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

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

## 31. PUT /admin/governance/workload-assessments/{id}/control-results

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

## 32. POST /admin/governance/write-policies

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
| 504 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

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

## 33. POST /admin/ops/backup-policies

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
| `rpoSeconds` | Sí | `number` | mínimo 0; máximo 31536000 | RPO objetivo en segundos: cuántos datos se tolera perder. Independiente del RTO (MCH-022); 0 es válido y significa no perder ningún dato | `1` |
| `rtoSeconds` | Sí | `number` | mínimo 1; máximo 31536000 | RTO objetivo en segundos: cuánto tiempo se tolera estar fuera de servicio. Independiente del RPO (MCH-022); al menos 1 segundo | `1` |
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
| 504 | Operación completada correctamente. | `Promise<IdResultDto>` | No |

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
| 422 | `PRECONDITION_FAILED` | rangeOutside.map((v) => v.mensaje).join('; ') | Excepción explícita en src/modules/system_ops/services/backup.service.ts |
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

## 34. POST /internal/governance/retention-executions/run

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
| `cursor` | No | `string` | formato `uuid` | Cursor devuelto por la corrida anterior (`nextCursor`); continúa tras esa fila | `00000000-0000-4000-8000-000000000001` |

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
  "maxBatchSize": 1,
  "cursor": "00000000-0000-4000-8000-000000000001"
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
| 504 | Operación completada correctamente. | `Promise<RetentionExecutionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RetentionExecutionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "totalScanned": 1,
  "totalDeleted": 1,
  "totalAnonymized": 1,
  "totalArchived": 1,
  "blockedByLegalHold": true,
  "totalHeld": 1,
  "hasMore": true,
  "nextCursor": "00000000-0000-4000-8000-000000000001"
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
| `totalHeld` | No | `number` | Sin restricción adicional declarada | Filas vencidas conservadas por legal hold activo | `1` |
| `hasMore` | No | `boolean` | Sin restricción adicional declarada | true si el lote se llenó y quedan filas vencidas sin examinar; repetir con `cursor` | `true` |
| `nextCursor` | No | `string` | formato `uuid` | Cursor para continuar el barrido cuando `hasMore` es true | `00000000-0000-4000-8000-000000000001` |

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
| 422 | `PRECONDITION_FAILED` | La entidad no tiene un ejecutor de retención registrado | Excepción explícita en src/modules/system_ops/services/retention-execution.service.ts |
| 422 | `PRECONDITION_FAILED` | La política de retención no declara plazo y disposición ejecutables | Excepción explícita en src/modules/system_ops/services/retention-execution.service.ts |
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

## 35. POST /internal/ops/restore-test-runs

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
| 504 | Operación completada correctamente. | `Promise<RestoreTestRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RestoreTestRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "outcomeConceptId": "00000000-0000-4000-8000-000000000001",
  "objectiveStatus": "PASSED",
  "objectiveStatusReason": "Texto descriptivo de ejemplo",
  "objectiveBreached": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `outcomeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a outcome concept. | `00000000-0000-4000-8000-000000000001` |
| `objectiveStatus` | Sí | `string` | valores: `PASSED`, `FAILED`, `NOT_MEASURED` | PASSED sólo con mediciones e integridad suficientes; FAILED si se incumplió; NOT_MEASURED si falta evidencia | `PASSED` |
| `objectiveStatusReason` | Sí | `string` | Sin restricción adicional declarada | Por qué la corrida quedó en ese estado | `Texto descriptivo de ejemplo` |
| `objectiveBreached` | Sí | `boolean` | Sin restricción adicional declarada | true si el RPO/RTO medido supera el objetivo. Obsoleto: un false también cubre NOT_MEASURED | `true` |

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

