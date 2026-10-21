<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `system_ops`

- **Bloque:** Operaciones de Plataforma (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)
- **Operaciones:** 24 (24 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 24 · BAJO 0
- **Tablas distintas que tocan:** 24
- **Respuestas de error y detalle contractual:** `openapi/endpoints/system-ops.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/admin/governance/anonymization-rules` | Definir una regla de anonimización | MEDIO | 3 | SECURITY_ADMIN |
| 2 | POST | `/admin/governance/assessments/{id}/findings` | Abrir un hallazgo sobre una evaluación | MEDIO | 3 | SECURITY_ADMIN |
| 3 | POST | `/admin/governance/assessments/{id}/remediation-plans` | Crear un plan de remediación con sus acciones | MEDIO | 5 | SECURITY_ADMIN |
| 4 | POST | `/admin/governance/cross-border-transfers` | Registrar una transferencia transfronteriza (append-only) | MEDIO | 2 | SECURITY_ADMIN |
| 5 | POST | `/admin/governance/drafts` | Guardar un draft record genérico | MEDIO | 1 | SECURITY_ADMIN |
| 6 | POST | `/admin/governance/drafts/{id}/publish` | Publicar un draft record y materializarlo | MEDIO | 3 | SECURITY_ADMIN |
| 7 | POST | `/admin/governance/entity-registry` | Registrar dominio, clasificación y catalogar entidad + campos | MEDIO | 7 | SECURITY_ADMIN |
| 8 | PATCH | `/admin/governance/entity-registry/{id}/retention` | Aplicar una política de retención a una entidad | MEDIO | 4 | SECURITY_ADMIN |
| 9 | PATCH | `/admin/governance/entity-registry/{id}/write-policy` | Vincular una política de escritura a una entidad | MEDIO | 4 | SECURITY_ADMIN |
| 10 | PATCH | `/admin/governance/field-registry/{id}` | Asignar regla de anonimización / masking a un campo | MEDIO | 3 | SECURITY_ADMIN |
| 11 | PATCH | `/admin/governance/findings/{id}` | Actualizar un hallazgo (estado / owner) | MEDIO | 2 | SECURITY_ADMIN |
| 12 | POST | `/admin/governance/legal-holds` | Colocar un legal hold sobre un objetivo | MEDIO | 3 | SECURITY_ADMIN |
| 13 | POST | `/admin/governance/legal-holds/{id}/release` | Levantar un legal hold ACTIVE | MEDIO | 3 | SECURITY_ADMIN |
| 14 | POST | `/admin/governance/operational-frameworks` | Publicar un framework operativo con sus controles | MEDIO | 3 | SECURITY_ADMIN |
| 15 | POST | `/admin/governance/remediation-actions/{id}/verify` | Verificar y cerrar una acción de remediación | MEDIO | 6 | SECURITY_ADMIN |
| 16 | POST | `/admin/governance/residency-policies` | Definir una política de residencia de datos | MEDIO | 3 | SECURITY_ADMIN |
| 17 | POST | `/admin/governance/retention-policies` | Definir una política de retención con base legal | MEDIO | 3 | SECURITY_ADMIN |
| 18 | POST | `/admin/governance/tenant-residency-bindings` | Vincular un tenant a una política de residencia | MEDIO | 1 | SECURITY_ADMIN |
| 19 | POST | `/admin/governance/workload-assessments` | Iniciar una evaluación de workload | MEDIO | 2 | SECURITY_ADMIN |
| 20 | PUT | `/admin/governance/workload-assessments/{id}/control-results` | Registrar (UPSERT) resultados de control de una evaluación | MEDIO | 4 | SECURITY_ADMIN |
| 21 | POST | `/admin/governance/write-policies` | Definir una política de escritura | MEDIO | 3 | SECURITY_ADMIN |
| 22 | POST | `/admin/ops/backup-policies` | Definir una política de backup (RPO/RTO/inmutabilidad) | MEDIO | 1 | SECURITY_ADMIN |
| 23 | POST | `/internal/governance/retention-executions/run` | Ejecutar un barrido de retención (excluye objetivos bajo legal hold) | MEDIO | 6 | SECURITY_ADMIN |
| 24 | POST | `/internal/ops/restore-test-runs` | Registrar una prueba de restauración con evidencia | MEDIO | 2 | SECURITY_ADMIN |

---

## 1. POST /admin/governance/anonymization-rules

- **Origen:** CONTRATO
- **Nombre:** Definir una regla de anonimización
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GovernanceCatalogController.createAnonymizationRule` — `src/modules/system_ops/controllers/governance-catalog.controller.ts:107`

### Qué es y para qué sirve (negocio)

Definir una regla de anonimización. Caso de uso UC-11-04: Definir regla de anonimización. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/anonymization-rules` la atiende `GovernanceCatalogController.createAnonymizationRule` (src/modules/system_ops/controllers/governance-catalog.controller.ts:107). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAnonymizationRuleDto` (4 campos, 2 obligatorios). Delega en `GovernanceCatalogService.createAnonymizationRule`. Crea filas en system_ops.anonymization_rules, system_ops.governance_change_log. Lee system_ops.anonymization_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/governance-catalog.controller.ts:107` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.anonymization_rules` | ESCRIBE | CREA | DIRECTA | GovernanceCatalogController.createAnonymizationRule → GovernanceCatalogService.createAnonymizationRule → GovernanceRepository.createAnonymizationRule | `src/modules/system_ops/repositories/governance.repository.ts:529` |
| `system_ops.anonymization_rules` | LEE | LEE | DIRECTA | GovernanceCatalogController.createAnonymizationRule → GovernanceCatalogService.createAnonymizationRule → GovernanceRepository.findAnonymizationRuleByCode | `src/modules/system_ops/repositories/governance.repository.ts:493` |
| `system_ops.governance_change_log` | ESCRIBE | CREA | DIRECTA | GovernanceCatalogController.createAnonymizationRule → GovernanceCatalogService.createAnonymizationRule → GovernanceRepository.recordChange | `src/modules/system_ops/repositories/governance.repository.ts:577` |

### Cuerpo — DTO `CreateAnonymizationRuleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/system_ops/dto/governance-policy.dto.ts:214` |
| `techniqueConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Técnica de anonimización (concept id) | `src/modules/system_ops/dto/governance-policy.dto.ts:224` |
| `parametersJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Parámetros de la técnica (JSON libre) | `src/modules/system_ops/dto/governance-policy.dto.ts:232` |
| `description` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/system_ops/dto/governance-policy.dto.ts:241` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "techniqueConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "techniqueConceptId": "00000000-0000-4000-8000-000000000001",
  "parametersJson": {},
  "description": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<IdResultDto>` · DTO `IdResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso | `src/modules/system_ops/dto/common-response.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_ops/controllers/governance-catalog.controller.spec.ts:86` |

### Flujos

_Se completa en la fase de flujos._

---

## 2. POST /admin/governance/assessments/{id}/findings

- **Origen:** CONTRATO
- **Nombre:** Abrir un hallazgo sobre una evaluación
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AssessmentController.createFinding` — `src/modules/system_ops/controllers/assessment.controller.ts:88`

### Qué es y para qué sirve (negocio)

Abrir un hallazgo sobre una evaluación. Caso de uso UC-11-13: Abrir hallazgo. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:30`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/assessments/{id}/findings` la atiende `AssessmentController.createFinding` (src/modules/system_ops/controllers/assessment.controller.ts:88). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateFindingDto` (7 campos, 3 obligatorios). Delega en `AssessmentService.createFinding`. Crea filas en system_ops.assessment_findings. Lee system_ops.assessment_findings, system_ops.workload_assessments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/assessment.controller.ts:88` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_ops/controllers/assessment.controller.ts:88` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.assessment_findings` | ESCRIBE | CREA | DIRECTA | AssessmentController.createFinding → AssessmentService.createFinding → AssessmentRepository.createFinding | `src/modules/system_ops/repositories/assessment.repository.ts:411` |
| `system_ops.assessment_findings` | LEE | LEE | DIRECTA | AssessmentController.createFinding → AssessmentService.createFinding → AssessmentRepository.findFindingByCode | `src/modules/system_ops/repositories/assessment.repository.ts:352` |
| `system_ops.workload_assessments` | LEE | LEE | DIRECTA | AssessmentController.createFinding → AssessmentService.createFinding → AssessmentRepository.findAssessmentById | `src/modules/system_ops/repositories/assessment.repository.ts:190` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateFindingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `findingCode` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/system_ops/dto/assessment.dto.ts:202` |
| `title` | `string` | Sí | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | — | `src/modules/system_ops/dto/assessment.dto.ts:211` |
| `description` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/system_ops/dto/assessment.dto.ts:220` |
| `severityConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Severidad (concept id) | `src/modules/system_ops/dto/assessment.dto.ts:227` |
| `assessmentControlResultId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Resultado de control del que deriva | `src/modules/system_ops/dto/assessment.dto.ts:238` |
| `ownerTeam` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/system_ops/dto/assessment.dto.ts:247` |
| `dueAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vencimiento (ISO) | `src/modules/system_ops/dto/assessment.dto.ts:255` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "findingCode": "CODIGO_EJEMPLO",
  "title": "valor-ejemplo",
  "severityConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<FindingResponseDto>` · DTO `FindingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_ops/dto/assessment.dto.ts:368` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_ops/dto/assessment.dto.ts:374` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 3. POST /admin/governance/assessments/{id}/remediation-plans

- **Origen:** CONTRATO
- **Nombre:** Crear un plan de remediación con sus acciones
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AssessmentController.createRemediationPlan` — `src/modules/system_ops/controllers/assessment.controller.ts:101`

### Qué es y para qué sirve (negocio)

Crear un plan de remediación con sus acciones. Caso de uso UC-11-13: Crear plan + acciones de remediación. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:31`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/assessments/{id}/remediation-plans` la atiende `AssessmentController.createRemediationPlan` (src/modules/system_ops/controllers/assessment.controller.ts:101). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateRemediationPlanDto` (11 campos, 6 obligatorios). Delega en `AssessmentService.createRemediationPlan`. Crea filas en system_ops.remediation_actions, system_ops.remediation_plans. Lee system_ops.assessment_findings, system_ops.remediation_plans, system_ops.workload_assessments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/assessment.controller.ts:101` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_ops/controllers/assessment.controller.ts:101` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.assessment_findings` | LEE | LEE | DIRECTA | AssessmentController.createRemediationPlan → AssessmentService.createRemediationPlan → AssessmentRepository.findFindingById | `src/modules/system_ops/repositories/assessment.repository.ts:336` |
| `system_ops.remediation_actions` | ESCRIBE | CREA | DIRECTA | AssessmentController.createRemediationPlan → AssessmentService.createRemediationPlan → AssessmentRepository.createAction | `src/modules/system_ops/repositories/assessment.repository.ts:535` |
| `system_ops.remediation_plans` | ESCRIBE | CREA | DIRECTA | AssessmentController.createRemediationPlan → AssessmentService.createRemediationPlan → AssessmentRepository.createPlan | `src/modules/system_ops/repositories/assessment.repository.ts:479` |
| `system_ops.remediation_plans` | LEE | LEE | DIRECTA | AssessmentController.createRemediationPlan → AssessmentService.createRemediationPlan → AssessmentRepository.findPlanByCode | `src/modules/system_ops/repositories/assessment.repository.ts:431` |
| `system_ops.workload_assessments` | LEE | LEE | DIRECTA | AssessmentController.createRemediationPlan → AssessmentService.createRemediationPlan → AssessmentRepository.findAssessmentById | `src/modules/system_ops/repositories/assessment.repository.ts:190` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateRemediationPlanDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/system_ops/dto/assessment.dto.ts:267` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/system_ops/dto/assessment.dto.ts:276` |
| `assessmentFindingId` | `string` | Sí | formato uuid | `@IsUUID()` | Hallazgo al que responde el plan | `src/modules/system_ops/dto/assessment.dto.ts:286` |
| `ownerUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Responsable del plan | `src/modules/system_ops/dto/assessment.dto.ts:294` |
| `targetCompletionAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fecha objetivo de finalización (ISO) | `src/modules/system_ops/dto/assessment.dto.ts:302` |
| `actions` | `array<RemediationActionDto>` | Sí | — | `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => RemediationActionDto)` | — | `src/modules/system_ops/dto/assessment.dto.ts:311` |
| `actions[].actionCode` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/system_ops/dto/assessment.dto.ts:156` |
| `actions[].description` | `string` | Sí | longitud mínima 1; longitud máxima 2000 | `@IsString()` `@MinLength(1)` `@MaxLength(2000)` | — | `src/modules/system_ops/dto/assessment.dto.ts:165` |
| `actions[].assignedUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Usuario asignado | `src/modules/system_ops/dto/assessment.dto.ts:173` |
| `actions[].assignedTeam` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/system_ops/dto/assessment.dto.ts:182` |
| `actions[].dueAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vencimiento (ISO) | `src/modules/system_ops/dto/assessment.dto.ts:190` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<RemediationPlanResponseDto>` · DTO `RemediationPlanResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_ops/dto/assessment.dto.ts:383` |
| `actionIds` | `array<string>` | Sí | — | — | Ids de las acciones creadas | `src/modules/system_ops/dto/assessment.dto.ts:389` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 4. POST /admin/governance/cross-border-transfers

- **Origen:** CONTRATO
- **Nombre:** Registrar una transferencia transfronteriza (append-only)
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ResidencyController.recordTransfer` — `src/modules/system_ops/controllers/residency.controller.ts:52`

### Qué es y para qué sirve (negocio)

Registrar una transferencia transfronteriza (append-only). Caso de uso UC-11-07: Registrar transferencia transfronteriza (append-only). Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/cross-border-transfers` la atiende `ResidencyController.recordTransfer` (src/modules/system_ops/controllers/residency.controller.ts:52). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateCrossBorderTransferDto` (7 campos, 6 obligatorios). Delega en `ResidencyService.recordTransfer`. Crea filas en system_ops.cross_border_transfer_events. Lee system_ops.cross_border_transfer_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/residency.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.cross_border_transfer_events` | ESCRIBE | CREA | DIRECTA | ResidencyController.recordTransfer → ResidencyService.recordTransfer → ResidencyRepository.createTransfer | `src/modules/system_ops/repositories/residency.repository.ts:218` |
| `system_ops.cross_border_transfer_events` | LEE | LEE | DIRECTA | ResidencyController.recordTransfer → ResidencyService.recordTransfer → ResidencyRepository.findTransferByReference | `src/modules/system_ops/repositories/residency.repository.ts:171` |

### Cuerpo — DTO `CreateCrossBorderTransferDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant origen | `src/modules/system_ops/dto/residency.dto.ts:159` |
| `dataCategoryConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Categoría de datos (concept id) | `src/modules/system_ops/dto/residency.dto.ts:169` |
| `sourceRegionConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Región origen (concept id) | `src/modules/system_ops/dto/residency.dto.ts:176` |
| `destinationRegionConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Región destino (concept id) | `src/modules/system_ops/dto/residency.dto.ts:183` |
| `transferBasisConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Base de transferencia (concept id) | `src/modules/system_ops/dto/residency.dto.ts:193` |
| `recipientTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant destinatario | `src/modules/system_ops/dto/residency.dto.ts:201` |
| `transferReference` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Referencia idempotente de la transferencia | `src/modules/system_ops/dto/residency.dto.ts:213` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "dataCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "sourceRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "destinationRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "transferBasisConceptId": "00000000-0000-4000-8000-000000000001",
  "transferReference": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<IdResultDto>` · DTO `IdResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso | `src/modules/system_ops/dto/common-response.dto.ts:9` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 5. POST /admin/governance/drafts

- **Origen:** CONTRATO
- **Nombre:** Guardar un draft record genérico
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DraftController.createDraft` — `src/modules/system_ops/controllers/draft.controller.ts:28`

### Qué es y para qué sirve (negocio)

Guardar un draft record genérico. Caso de uso UC-11-15: Guardar draft genérico. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:34`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/drafts` la atiende `DraftController.createDraft` (src/modules/system_ops/controllers/draft.controller.ts:28). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateDraftDto` (7 campos, 3 obligatorios). Delega en `DraftService.createDraft`. Crea filas en system_ops.draft_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/draft.controller.ts:28` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.draft_records` | ESCRIBE | CREA | DIRECTA | DraftController.createDraft → DraftService.createDraft → DraftRepository.create | `src/modules/system_ops/repositories/draft.repository.ts:80` |

### Cuerpo — DTO `CreateDraftDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `schemaName` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Esquema destino real | `src/modules/system_ops/dto/draft.dto.ts:22` |
| `tableName` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Tabla destino real | `src/modules/system_ops/dto/draft.dto.ts:31` |
| `targetRecordId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Registro destino a actualizar (si aplica) | `src/modules/system_ops/dto/draft.dto.ts:42` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant del draft | `src/modules/system_ops/dto/draft.dto.ts:50` |
| `draftLabel` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/system_ops/dto/draft.dto.ts:59` |
| `payloadJson` | `object` | Sí | — | `@IsObject()` | Contenido del borrador (JSON) | `src/modules/system_ops/dto/draft.dto.ts:66` |
| `schemaVersion` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Versión del schema del target | `src/modules/system_ops/dto/draft.dto.ts:75` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "schemaName": "Nombre de ejemplo",
  "tableName": "Nombre de ejemplo",
  "payloadJson": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<DraftResponseDto>` · DTO `DraftResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_ops/dto/draft.dto.ts:99` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_ops/dto/draft.dto.ts:105` |
| `publishedRecordId` | `string` | No | formato uuid | — | Id del registro materializado al publicar | `src/modules/system_ops/dto/draft.dto.ts:114` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 6. POST /admin/governance/drafts/{id}/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar un draft record y materializarlo
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DraftController.publishDraft` — `src/modules/system_ops/controllers/draft.controller.ts:40`

### Qué es y para qué sirve (negocio)

Publicar un draft record y materializarlo. Caso de uso UC-11-15: Publicar draft y materializarlo. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:35`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/drafts/{id}/publish` la atiende `DraftController.publishDraft` (src/modules/system_ops/controllers/draft.controller.ts:40). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PublishDraftDto` (1 campo, 1 obligatorio). Delega en `DraftService.publishDraft`. Crea filas en system_ops.record_revisions. Actualiza system_ops.draft_records. Lee system_ops.draft_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/draft.controller.ts:40` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_ops/controllers/draft.controller.ts:40` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.draft_records` | ESCRIBE | ACTUALIZA | POR_TIPO | DraftController.publishDraft → DraftService.publishDraft | `src/modules/system_ops/services/draft.service.ts:95` |
| `system_ops.draft_records` | LEE | LEE | DIRECTA | DraftController.publishDraft → DraftService.publishDraft → DraftRepository.findById | `src/modules/system_ops/repositories/draft.repository.ts:20` |
| `system_ops.record_revisions` | ESCRIBE | CREA | DIRECTA | DraftController.publishDraft → DraftService.publishDraft → DraftRepository.createRevision | `src/modules/system_ops/repositories/draft.repository.ts:123` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishDraftDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `publishReference` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Referencia idempotente de la publicación | `src/modules/system_ops/dto/draft.dto.ts:90` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "publishReference": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "publishReference": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<DraftResponseDto>` · DTO `DraftResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_ops/dto/draft.dto.ts:99` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/system_ops/dto/draft.dto.ts:105` |
| `publishedRecordId` | `string` | No | formato uuid | — | Id del registro materializado al publicar | `src/modules/system_ops/dto/draft.dto.ts:114` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 7. POST /admin/governance/entity-registry

- **Origen:** CONTRATO
- **Nombre:** Registrar dominio, clasificación y catalogar entidad + campos
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GovernanceCatalogController.catalogEntity` — `src/modules/system_ops/controllers/governance-catalog.controller.ts:43`

### Qué es y para qué sirve (negocio)

Registrar dominio, clasificación y catalogar entidad + campos. Caso de uso UC-11-01: Registrar dominio, clasificación y catalogar entidad + campos. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:12`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/entity-registry` la atiende `GovernanceCatalogController.catalogEntity` (src/modules/system_ops/controllers/governance-catalog.controller.ts:43). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CatalogEntityDto` (26 campos, 13 obligatorios). Delega en `GovernanceCatalogService.catalogEntity`. Crea filas en system_ops.data_classifications, system_ops.data_domains, system_ops.entity_registry, system_ops.field_registry, system_ops.governance_change_log. Lee system_ops.data_classifications, system_ops.data_domains.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/governance-catalog.controller.ts:43` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.data_classifications` | ESCRIBE | CREA | DIRECTA | GovernanceCatalogController.catalogEntity → GovernanceCatalogService.catalogEntity → GovernanceRepository.createClassification | `src/modules/system_ops/repositories/governance.repository.ts:140` |
| `system_ops.data_classifications` | LEE | LEE | DIRECTA | GovernanceCatalogController.catalogEntity → GovernanceCatalogService.catalogEntity → GovernanceRepository.findClassificationByCode | `src/modules/system_ops/repositories/governance.repository.ts:93` |
| `system_ops.data_domains` | ESCRIBE | CREA | DIRECTA | GovernanceCatalogController.catalogEntity → GovernanceCatalogService.catalogEntity → GovernanceRepository.createDomain | `src/modules/system_ops/repositories/governance.repository.ts:69` |
| `system_ops.data_domains` | LEE | LEE | DIRECTA | GovernanceCatalogController.catalogEntity → GovernanceCatalogService.catalogEntity → GovernanceRepository.findDomainByCode | `src/modules/system_ops/repositories/governance.repository.ts:38` |
| `system_ops.entity_registry` | ESCRIBE | CREA | DIRECTA | GovernanceCatalogController.catalogEntity → GovernanceCatalogService.catalogEntity → GovernanceRepository.createEntity | `src/modules/system_ops/repositories/governance.repository.ts:236` |
| `system_ops.field_registry` | ESCRIBE | CREA | DIRECTA | GovernanceCatalogController.catalogEntity → GovernanceCatalogService.catalogEntity → GovernanceRepository.createField | `src/modules/system_ops/repositories/governance.repository.ts:300` |
| `system_ops.governance_change_log` | ESCRIBE | CREA | DIRECTA | GovernanceCatalogController.catalogEntity → GovernanceCatalogService.catalogEntity → GovernanceRepository.recordChange | `src/modules/system_ops/repositories/governance.repository.ts:577` |

### Cuerpo — DTO `CatalogEntityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `domain` | `CatalogDomainDto` | Sí | — | `@ValidateNested()` `@Type(() => CatalogDomainDto)` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:159` |
| `domain.code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:26` |
| `domain.name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:35` |
| `domain.ownerTeam` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:44` |
| `classification` | `CatalogClassificationDto` | Sí | — | `@ValidateNested()` `@Type(() => CatalogClassificationDto)` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:167` |
| `classification.code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:56` |
| `classification.name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:65` |
| `classification.rank` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Rango de sensibilidad (mayor = más sensible) | `src/modules/system_ops/dto/governance-catalog.dto.ts:76` |
| `classification.isPii` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:84` |
| `classification.isPhi` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:92` |
| `classification.handlingRulesJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Reglas de manejo (JSON libre) | `src/modules/system_ops/dto/governance-catalog.dto.ts:100` |
| `schemaName` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Esquema físico de la tabla | `src/modules/system_ops/dto/governance-catalog.dto.ts:176` |
| `tableName` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Nombre físico de la tabla | `src/modules/system_ops/dto/governance-catalog.dto.ts:185` |
| `isAppendOnly` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:192` |
| `isSoftDelete` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:199` |
| `hasHistory` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:206` |
| `historyTable` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:215` |
| `containsPii` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:223` |
| `containsPhi` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:231` |
| `ownerTeam` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:240` |
| `fields` | `array<CatalogFieldDto>` | Sí | — | `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => CatalogFieldDto)` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:249` |
| `fields[].columnName` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:112` |
| `fields[].isPii` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:120` |
| `fields[].isPhi` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:128` |
| `fields[].maskingStrategyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Estrategia de enmascaramiento (concept id) | `src/modules/system_ops/dto/governance-catalog.dto.ts:139` |
| `fields[].notes` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:148` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<EntityRegistryResponseDto>` · DTO `EntityRegistryResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_ops/dto/governance-catalog.dto.ts:258` |
| `domainId` | `string` | Sí | formato uuid | — | Identificador asociado a domain. | `src/modules/system_ops/dto/governance-catalog.dto.ts:264` |
| `classificationId` | `string` | Sí | formato uuid | — | Identificador asociado a classification. | `src/modules/system_ops/dto/governance-catalog.dto.ts:270` |
| `schemaName` | `string` | Sí | — | — | Valor de schema name mantenido por la instancia. | `src/modules/system_ops/dto/governance-catalog.dto.ts:276` |
| `tableName` | `string` | Sí | — | — | Valor de table name mantenido por la instancia. | `src/modules/system_ops/dto/governance-catalog.dto.ts:282` |
| `fieldIds` | `array<string>` | Sí | — | — | Ids de los campos catalogados | `src/modules/system_ops/dto/governance-catalog.dto.ts:288` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_ops/controllers/governance-catalog.controller.spec.ts:38` |

### Flujos

_Se completa en la fase de flujos._

---

## 8. PATCH /admin/governance/entity-registry/{id}/retention

- **Origen:** CONTRATO
- **Nombre:** Aplicar una política de retención a una entidad
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GovernanceCatalogController.applyRetention` — `src/modules/system_ops/controllers/governance-catalog.controller.ts:94`

### Qué es y para qué sirve (negocio)

Aplicar una política de retención a una entidad. Caso de uso UC-11-03: Aplicar retención a una entidad (razón obligatoria). Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`PATCH /admin/governance/entity-registry/{id}/retention` la atiende `GovernanceCatalogController.applyRetention` (src/modules/system_ops/controllers/governance-catalog.controller.ts:94). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ApplyRetentionPolicyDto` (2 campos, 2 obligatorios). Delega en `GovernanceCatalogService.applyRetention`. Crea filas en system_ops.governance_change_log. Actualiza system_ops.entity_registry. Lee system_ops.entity_registry, system_ops.retention_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/governance-catalog.controller.ts:94` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_ops/controllers/governance-catalog.controller.ts:94` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.entity_registry` | ESCRIBE | ACTUALIZA | POR_TIPO | GovernanceCatalogController.applyRetention → GovernanceCatalogService.applyRetention | `src/modules/system_ops/services/governance-catalog.service.ts:298` |
| `system_ops.entity_registry` | LEE | LEE | DIRECTA | GovernanceCatalogController.applyRetention → GovernanceCatalogService.applyRetention → GovernanceRepository.findEntityById | `src/modules/system_ops/repositories/governance.repository.ts:168` |
| `system_ops.governance_change_log` | ESCRIBE | CREA | DIRECTA | GovernanceCatalogController.applyRetention → GovernanceCatalogService.applyRetention → GovernanceRepository.recordChange | `src/modules/system_ops/repositories/governance.repository.ts:577` |
| `system_ops.retention_policies` | LEE | LEE | DIRECTA | GovernanceCatalogController.applyRetention → GovernanceCatalogService.applyRetention → GovernanceRepository.findRetentionPolicyById | `src/modules/system_ops/repositories/governance.repository.ts:426` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ApplyRetentionPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `retentionPolicyId` | `string` | Sí | formato uuid | `@IsUUID()` | Política de retención a vincular | `src/modules/system_ops/dto/governance-policy.dto.ts:190` |
| `reason` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Razón (obligatoria por gobierno) | `src/modules/system_ops/dto/governance-policy.dto.ts:202` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "retentionPolicyId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "retentionPolicyId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/system_ops/dto/common-response.dto.ts:18` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_ops/controllers/governance-catalog.controller.spec.ts:72` |

### Flujos

_Se completa en la fase de flujos._

---

## 9. PATCH /admin/governance/entity-registry/{id}/write-policy

- **Origen:** CONTRATO
- **Nombre:** Vincular una política de escritura a una entidad
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GovernanceCatalogController.applyWritePolicy` — `src/modules/system_ops/controllers/governance-catalog.controller.ts:69`

### Qué es y para qué sirve (negocio)

Vincular una política de escritura a una entidad. Caso de uso UC-11-02: Vincular política de escritura a una entidad. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`PATCH /admin/governance/entity-registry/{id}/write-policy` la atiende `GovernanceCatalogController.applyWritePolicy` (src/modules/system_ops/controllers/governance-catalog.controller.ts:69). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ApplyWritePolicyDto` (2 campos, 1 obligatorio). Delega en `GovernanceCatalogService.applyWritePolicy`. Crea filas en system_ops.governance_change_log. Actualiza system_ops.entity_registry. Lee system_ops.entity_registry, system_ops.write_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/governance-catalog.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_ops/controllers/governance-catalog.controller.ts:69` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.entity_registry` | ESCRIBE | ACTUALIZA | POR_TIPO | GovernanceCatalogController.applyWritePolicy → GovernanceCatalogService.applyWritePolicy | `src/modules/system_ops/services/governance-catalog.service.ts:221` |
| `system_ops.entity_registry` | LEE | LEE | DIRECTA | GovernanceCatalogController.applyWritePolicy → GovernanceCatalogService.applyWritePolicy → GovernanceRepository.findEntityById | `src/modules/system_ops/repositories/governance.repository.ts:168` |
| `system_ops.governance_change_log` | ESCRIBE | CREA | DIRECTA | GovernanceCatalogController.applyWritePolicy → GovernanceCatalogService.applyWritePolicy → GovernanceRepository.recordChange | `src/modules/system_ops/repositories/governance.repository.ts:577` |
| `system_ops.write_policies` | LEE | LEE | DIRECTA | GovernanceCatalogController.applyWritePolicy → GovernanceCatalogService.applyWritePolicy → GovernanceRepository.findWritePolicyById | `src/modules/system_ops/repositories/governance.repository.ts:333` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ApplyWritePolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `writePolicyId` | `string` | Sí | formato uuid | `@IsUUID()` | Política de escritura a vincular | `src/modules/system_ops/dto/governance-policy.dto.ts:105` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/system_ops/dto/governance-policy.dto.ts:114` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "writePolicyId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "writePolicyId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/system_ops/dto/common-response.dto.ts:18` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_ops/controllers/governance-catalog.controller.spec.ts:53` |

### Flujos

_Se completa en la fase de flujos._

---

## 10. PATCH /admin/governance/field-registry/{id}

- **Origen:** CONTRATO
- **Nombre:** Asignar regla de anonimización / masking a un campo
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GovernanceCatalogController.updateField` — `src/modules/system_ops/controllers/governance-catalog.controller.ts:119`

### Qué es y para qué sirve (negocio)

Asignar regla de anonimización / masking a un campo. Caso de uso UC-11-04: Asignar regla / masking a un campo. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`PATCH /admin/governance/field-registry/{id}` la atiende `GovernanceCatalogController.updateField` (src/modules/system_ops/controllers/governance-catalog.controller.ts:119). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpdateFieldRegistryDto` (4 campos, 0 obligatorios). Delega en `GovernanceCatalogService.updateField`. Crea filas en system_ops.governance_change_log. Actualiza system_ops.field_registry. Lee system_ops.field_registry.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/governance-catalog.controller.ts:119` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_ops/controllers/governance-catalog.controller.ts:119` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.field_registry` | ESCRIBE | ACTUALIZA | POR_TIPO | GovernanceCatalogController.updateField → GovernanceCatalogService.updateField | `src/modules/system_ops/services/governance-catalog.service.ts:355` |
| `system_ops.field_registry` | LEE | LEE | DIRECTA | GovernanceCatalogController.updateField → GovernanceCatalogService.updateField → GovernanceRepository.findFieldById | `src/modules/system_ops/repositories/governance.repository.ts:252` |
| `system_ops.governance_change_log` | ESCRIBE | CREA | DIRECTA | GovernanceCatalogController.updateField → GovernanceCatalogService.updateField → GovernanceRepository.recordChange | `src/modules/system_ops/repositories/governance.repository.ts:577` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateFieldRegistryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `anonymizationRuleId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Regla de anonimización a asignar | `src/modules/system_ops/dto/governance-catalog.dto.ts:302` |
| `maskingStrategyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Estrategia de enmascaramiento (concept id) | `src/modules/system_ops/dto/governance-catalog.dto.ts:313` |
| `isPii` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:321` |
| `isPhi` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/governance-catalog.dto.ts:329` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "anonymizationRuleId": "00000000-0000-4000-8000-000000000001",
  "maskingStrategyConceptId": "00000000-0000-4000-8000-000000000001",
  "isPii": true,
  "isPhi": true
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/system_ops/dto/common-response.dto.ts:18` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_ops/controllers/governance-catalog.controller.spec.ts:95` |

### Flujos

_Se completa en la fase de flujos._

---

## 11. PATCH /admin/governance/findings/{id}

- **Origen:** CONTRATO
- **Nombre:** Actualizar un hallazgo (estado / owner)
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AssessmentController.updateFinding` — `src/modules/system_ops/controllers/assessment.controller.ts:127`

### Qué es y para qué sirve (negocio)

Actualizar un hallazgo (estado / owner). Caso de uso UC-11-14: Actualizar hallazgo. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:33`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`PATCH /admin/governance/findings/{id}` la atiende `AssessmentController.updateFinding` (src/modules/system_ops/controllers/assessment.controller.ts:127). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpdateFindingDto` (2 campos, 0 obligatorios). Delega en `AssessmentService.updateFinding`. Actualiza system_ops.assessment_findings. Lee system_ops.assessment_findings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/assessment.controller.ts:127` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_ops/controllers/assessment.controller.ts:127` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.assessment_findings` | ESCRIBE | ACTUALIZA | POR_TIPO | AssessmentController.updateFinding → AssessmentService.updateFinding | `src/modules/system_ops/services/assessment.service.ts:428` |
| `system_ops.assessment_findings` | LEE | LEE | DIRECTA | AssessmentController.updateFinding → AssessmentService.updateFinding → AssessmentRepository.findFindingById | `src/modules/system_ops/repositories/assessment.repository.ts:336` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateFindingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `statusConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Estado del hallazgo (concept id) | `src/modules/system_ops/dto/assessment.dto.ts:335` |
| `ownerTeam` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/system_ops/dto/assessment.dto.ts:344` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "ownerTeam": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/system_ops/dto/common-response.dto.ts:18` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 12. POST /admin/governance/legal-holds

- **Origen:** CONTRATO
- **Nombre:** Colocar un legal hold sobre un objetivo
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LegalHoldController.place` — `src/modules/system_ops/controllers/legal-hold.controller.ts:33`

### Qué es y para qué sirve (negocio)

Colocar un legal hold sobre un objetivo. Caso de uso UC-11-08: Colocar legal hold. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:23`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/legal-holds` la atiende `LegalHoldController.place` (src/modules/system_ops/controllers/legal-hold.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateLegalHoldDto` (6 campos, 4 obligatorios). Delega en `LegalHoldService.place`. Crea filas en system_ops.governance_change_log, system_ops.legal_holds. Lee system_ops.legal_holds.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/legal-hold.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.governance_change_log` | ESCRIBE | CREA | DIRECTA | LegalHoldController.place → LegalHoldService.place → GovernanceRepository.recordChange | `src/modules/system_ops/repositories/governance.repository.ts:577` |
| `system_ops.legal_holds` | ESCRIBE | CREA | DIRECTA | LegalHoldController.place → LegalHoldService.place → LegalHoldRepository.create | `src/modules/system_ops/repositories/legal-hold.repository.ts:83` |
| `system_ops.legal_holds` | LEE | LEE | DIRECTA | LegalHoldController.place → LegalHoldService.place → LegalHoldRepository.findActive | `src/modules/system_ops/repositories/legal-hold.repository.ts:30` |

### Cuerpo — DTO `CreateLegalHoldDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant del hold | `src/modules/system_ops/dto/legal-hold.dto.ts:18` |
| `targetTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de objetivo (concept id) | `src/modules/system_ops/dto/legal-hold.dto.ts:25` |
| `targetId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del objetivo bajo hold | `src/modules/system_ops/dto/legal-hold.dto.ts:32` |
| `reasonConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Razón del hold (concept id) | `src/modules/system_ops/dto/legal-hold.dto.ts:39` |
| `authorityReference` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia de la autoridad | `src/modules/system_ops/dto/legal-hold.dto.ts:51` |
| `startsAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio del hold (ISO) | `src/modules/system_ops/dto/legal-hold.dto.ts:59` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "targetTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "targetTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001",
  "authorityReference": "valor-ejemplo",
  "startsAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<IdResultDto>` · DTO `IdResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso | `src/modules/system_ops/dto/common-response.dto.ts:9` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 13. POST /admin/governance/legal-holds/{id}/release

- **Origen:** CONTRATO
- **Nombre:** Levantar un legal hold ACTIVE
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LegalHoldController.release` — `src/modules/system_ops/controllers/legal-hold.controller.ts:45`

### Qué es y para qué sirve (negocio)

Levantar un legal hold ACTIVE. Caso de uso UC-11-08: Levantar legal hold ACTIVE. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:24`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/legal-holds/{id}/release` la atiende `LegalHoldController.release` (src/modules/system_ops/controllers/legal-hold.controller.ts:45). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ReleaseLegalHoldDto` (1 campo, 0 obligatorios). Delega en `LegalHoldService.release`. Crea filas en system_ops.governance_change_log. Actualiza system_ops.legal_holds. Lee system_ops.legal_holds.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/legal-hold.controller.ts:45` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_ops/controllers/legal-hold.controller.ts:45` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.governance_change_log` | ESCRIBE | CREA | DIRECTA | LegalHoldController.release → LegalHoldService.release → GovernanceRepository.recordChange | `src/modules/system_ops/repositories/governance.repository.ts:577` |
| `system_ops.legal_holds` | ESCRIBE | ACTUALIZA | POR_TIPO | LegalHoldController.release → LegalHoldService.release | `src/modules/system_ops/services/legal-hold.service.ts:109` |
| `system_ops.legal_holds` | LEE | LEE | DIRECTA | LegalHoldController.release → LegalHoldService.release → LegalHoldRepository.findById | `src/modules/system_ops/repositories/legal-hold.repository.ts:20` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReleaseLegalHoldDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Motivo del levantamiento | `src/modules/system_ops/dto/legal-hold.dto.ts:75` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/system_ops/dto/common-response.dto.ts:18` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 14. POST /admin/governance/operational-frameworks

- **Origen:** CONTRATO
- **Nombre:** Publicar un framework operativo con sus controles
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AssessmentController.publishFramework` — `src/modules/system_ops/controllers/assessment.controller.ts:47`

### Qué es y para qué sirve (negocio)

Publicar un framework operativo con sus controles. Caso de uso UC-11-11: Publicar framework con controles (jerárquicos). Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:27`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/operational-frameworks` la atiende `AssessmentController.publishFramework` (src/modules/system_ops/controllers/assessment.controller.ts:47). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateFrameworkDto` (13 campos, 7 obligatorios). Delega en `AssessmentService.publishFramework`. Crea filas en system_ops.operational_framework_controls, system_ops.operational_frameworks. Lee system_ops.operational_frameworks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/assessment.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.operational_framework_controls` | ESCRIBE | CREA | DIRECTA | AssessmentController.publishFramework → AssessmentService.publishFramework → AssessmentRepository.createControl | `src/modules/system_ops/repositories/assessment.repository.ts:157` |
| `system_ops.operational_frameworks` | ESCRIBE | CREA | DIRECTA | AssessmentController.publishFramework → AssessmentService.publishFramework → AssessmentRepository.createFramework | `src/modules/system_ops/repositories/assessment.repository.ts:97` |
| `system_ops.operational_frameworks` | LEE | LEE | DIRECTA | AssessmentController.publishFramework → AssessmentService.publishFramework → AssessmentRepository.findFrameworkByCodeVersion | `src/modules/system_ops/repositories/assessment.repository.ts:35` |

### Cuerpo — DTO `CreateFrameworkDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/system_ops/dto/framework.dto.ts:93` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/system_ops/dto/framework.dto.ts:102` |
| `providerConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Proveedor del framework (concept id) | `src/modules/system_ops/dto/framework.dto.ts:112` |
| `version` | `string` | Sí | longitud mínima 1; longitud máxima 50 | `@IsString()` `@MinLength(1)` `@MaxLength(50)` | — | `src/modules/system_ops/dto/framework.dto.ts:121` |
| `sourceUrl` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/system_ops/dto/framework.dto.ts:130` |
| `controls` | `array<FrameworkControlDto>` | Sí | — | `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => FrameworkControlDto)` | — | `src/modules/system_ops/dto/framework.dto.ts:139` |
| `controls[].controlCode` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único del control dentro del framework | `src/modules/system_ops/dto/framework.dto.ts:26` |
| `controls[].title` | `string` | Sí | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | — | `src/modules/system_ops/dto/framework.dto.ts:35` |
| `controls[].parentControlCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código del control padre (jerarquía dentro del mismo framework) | `src/modules/system_ops/dto/framework.dto.ts:48` |
| `controls[].pillarConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Pilar (concept id) | `src/modules/system_ops/dto/framework.dto.ts:56` |
| `controls[].objectiveText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/system_ops/dto/framework.dto.ts:65` |
| `controls[].evidenceRequirementsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Requisitos de evidencia (JSON libre) | `src/modules/system_ops/dto/framework.dto.ts:73` |
| `controls[].assessmentGuidanceJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Guía de evaluación (JSON libre) | `src/modules/system_ops/dto/framework.dto.ts:81` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<FrameworkResponseDto>` · DTO `FrameworkResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_ops/dto/framework.dto.ts:148` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/system_ops/dto/framework.dto.ts:154` |
| `version` | `string` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/system_ops/dto/framework.dto.ts:160` |
| `controlIds` | `array<string>` | Sí | — | — | Ids de los controles creados | `src/modules/system_ops/dto/framework.dto.ts:166` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 15. POST /admin/governance/remediation-actions/{id}/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar y cerrar una acción de remediación
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AssessmentController.verifyAction` — `src/modules/system_ops/controllers/assessment.controller.ts:114`

### Qué es y para qué sirve (negocio)

Verificar y cerrar una acción de remediación. Caso de uso UC-11-14: Verificar acción (cierra hallazgo/plan si procede). Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:32`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/remediation-actions/{id}/verify` la atiende `AssessmentController.verifyAction` (src/modules/system_ops/controllers/assessment.controller.ts:114). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `VerifyRemediationActionDto` (1 campo, 1 obligatorio). Delega en `AssessmentService.verifyAction`. Actualiza system_ops.assessment_findings, system_ops.remediation_actions, system_ops.remediation_plans. Lee system_ops.assessment_findings, system_ops.remediation_actions, system_ops.remediation_plans.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/assessment.controller.ts:114` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_ops/controllers/assessment.controller.ts:114` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.assessment_findings` | ESCRIBE | ACTUALIZA | POR_TIPO | AssessmentController.verifyAction → AssessmentService.verifyAction | `src/modules/system_ops/services/assessment.service.ts:386` |
| `system_ops.assessment_findings` | LEE | LEE | DIRECTA | AssessmentController.verifyAction → AssessmentService.verifyAction → AssessmentRepository.findFindingById | `src/modules/system_ops/repositories/assessment.repository.ts:336` |
| `system_ops.remediation_actions` | ESCRIBE | ACTUALIZA | POR_TIPO | AssessmentController.verifyAction → AssessmentService.verifyAction | `src/modules/system_ops/services/assessment.service.ts:367` |
| `system_ops.remediation_actions` | LEE | LEE | DIRECTA | AssessmentController.verifyAction → AssessmentService.verifyAction → AssessmentRepository.findActionById | `src/modules/system_ops/repositories/assessment.repository.ts:553` |
| `system_ops.remediation_plans` | ESCRIBE | ACTUALIZA | POR_TIPO | AssessmentController.verifyAction → AssessmentService.verifyAction | `src/modules/system_ops/services/assessment.service.ts:401` |
| `system_ops.remediation_plans` | LEE | LEE | DIRECTA | AssessmentController.verifyAction → AssessmentService.verifyAction → AssessmentRepository.findPlanById | `src/modules/system_ops/repositories/assessment.repository.ts:567` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `VerifyRemediationActionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `verificationEvidenceJson` | `object` | Sí | — | `@IsObject()` | Evidencia de verificación (JSON libre) | `src/modules/system_ops/dto/assessment.dto.ts:321` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "verificationEvidenceJson": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "verificationEvidenceJson": {}
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/system_ops/dto/common-response.dto.ts:18` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 16. POST /admin/governance/residency-policies

- **Origen:** CONTRATO
- **Nombre:** Definir una política de residencia de datos
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ResidencyController.createResidencyPolicy` — `src/modules/system_ops/controllers/residency.controller.ts:28`

### Qué es y para qué sirve (negocio)

Definir una política de residencia de datos. Caso de uso UC-11-06: Definir política de residencia. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/residency-policies` la atiende `ResidencyController.createResidencyPolicy` (src/modules/system_ops/controllers/residency.controller.ts:28). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateResidencyPolicyDto` (10 campos, 4 obligatorios). Delega en `ResidencyService.createResidencyPolicy`. Crea filas en system_ops.data_residency_policies, system_ops.governance_change_log. Lee system_ops.data_residency_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/residency.controller.ts:28` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.data_residency_policies` | ESCRIBE | CREA | DIRECTA | ResidencyController.createResidencyPolicy → ResidencyService.createResidencyPolicy → ResidencyRepository.createPolicy | `src/modules/system_ops/repositories/residency.repository.ts:105` |
| `system_ops.data_residency_policies` | LEE | LEE | DIRECTA | ResidencyController.createResidencyPolicy → ResidencyService.createResidencyPolicy → ResidencyRepository.findPolicyByCode | `src/modules/system_ops/repositories/residency.repository.ts:27` |
| `system_ops.governance_change_log` | ESCRIBE | CREA | DIRECTA | ResidencyController.createResidencyPolicy → ResidencyService.createResidencyPolicy → GovernanceRepository.recordChange | `src/modules/system_ops/repositories/governance.repository.ts:577` |

### Cuerpo — DTO `CreateResidencyPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/system_ops/dto/residency.dto.ts:21` |
| `jurisdictionConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Jurisdicción (concept id) | `src/modules/system_ops/dto/residency.dto.ts:28` |
| `dataClassificationId` | `string` | Sí | formato uuid | `@IsUUID()` | Clasificación de datos (system_ops.data_classifications.id) | `src/modules/system_ops/dto/residency.dto.ts:38` |
| `allowedStorageRegionValueSetId` | `string` | Sí | formato uuid | `@IsUUID()` | Value set de regiones de almacenamiento permitidas | `src/modules/system_ops/dto/residency.dto.ts:48` |
| `allowedProcessingRegionValueSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Value set de regiones de procesamiento permitidas | `src/modules/system_ops/dto/residency.dto.ts:59` |
| `crossBorderTransferBasisConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Base de transferencia transfronteriza (concept id) | `src/modules/system_ops/dto/residency.dto.ts:70` |
| `transferImpactAssessmentRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/residency.dto.ts:78` |
| `encryptionKeyRegionLocked` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/residency.dto.ts:86` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigencia desde (ISO) | `src/modules/system_ops/dto/residency.dto.ts:94` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigencia hasta (ISO) | `src/modules/system_ops/dto/residency.dto.ts:102` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "dataClassificationId": "00000000-0000-4000-8000-000000000001",
  "allowedStorageRegionValueSetId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<IdResultDto>` · DTO `IdResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso | `src/modules/system_ops/dto/common-response.dto.ts:9` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 17. POST /admin/governance/retention-policies

- **Origen:** CONTRATO
- **Nombre:** Definir una política de retención con base legal
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GovernanceCatalogController.createRetentionPolicy` — `src/modules/system_ops/controllers/governance-catalog.controller.ts:82`

### Qué es y para qué sirve (negocio)

Definir una política de retención con base legal. Caso de uso UC-11-03: Definir política de retención (base legal). Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/retention-policies` la atiende `GovernanceCatalogController.createRetentionPolicy` (src/modules/system_ops/controllers/governance-catalog.controller.ts:82). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateRetentionPolicyDto` (6 campos, 2 obligatorios). Delega en `GovernanceCatalogService.createRetentionPolicy`. Crea filas en system_ops.governance_change_log, system_ops.retention_policies. Lee system_ops.retention_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/governance-catalog.controller.ts:82` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.governance_change_log` | ESCRIBE | CREA | DIRECTA | GovernanceCatalogController.createRetentionPolicy → GovernanceCatalogService.createRetentionPolicy → GovernanceRepository.recordChange | `src/modules/system_ops/repositories/governance.repository.ts:577` |
| `system_ops.retention_policies` | ESCRIBE | CREA | DIRECTA | GovernanceCatalogController.createRetentionPolicy → GovernanceCatalogService.createRetentionPolicy → GovernanceRepository.createRetentionPolicy | `src/modules/system_ops/repositories/governance.repository.ts:474` |
| `system_ops.retention_policies` | LEE | LEE | DIRECTA | GovernanceCatalogController.createRetentionPolicy → GovernanceCatalogService.createRetentionPolicy → GovernanceRepository.findRetentionPolicyByCode | `src/modules/system_ops/repositories/governance.repository.ts:412` |

### Cuerpo — DTO `CreateRetentionPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/system_ops/dto/governance-policy.dto.ts:126` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/system_ops/dto/governance-policy.dto.ts:135` |
| `retentionPeriodDays` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Periodo de retención en días | `src/modules/system_ops/dto/governance-policy.dto.ts:144` |
| `legalBasisConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Base legal (concept id) | `src/modules/system_ops/dto/governance-policy.dto.ts:155` |
| `dispositionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Disposición al vencer (concept id) | `src/modules/system_ops/dto/governance-policy.dto.ts:166` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Jurisdicción (concept id) | `src/modules/system_ops/dto/governance-policy.dto.ts:177` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "retentionPeriodDays": 1,
  "legalBasisConceptId": "00000000-0000-4000-8000-000000000001",
  "dispositionConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<IdResultDto>` · DTO `IdResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso | `src/modules/system_ops/dto/common-response.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_ops/controllers/governance-catalog.controller.spec.ts:63` |

### Flujos

_Se completa en la fase de flujos._

---

## 18. POST /admin/governance/tenant-residency-bindings

- **Origen:** CONTRATO
- **Nombre:** Vincular un tenant a una política de residencia
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ResidencyController.createBinding` — `src/modules/system_ops/controllers/residency.controller.ts:40`

### Qué es y para qué sirve (negocio)

Vincular un tenant a una política de residencia. Caso de uso UC-11-06: Vincular tenant a política de residencia. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/tenant-residency-bindings` la atiende `ResidencyController.createBinding` (src/modules/system_ops/controllers/residency.controller.ts:40). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateTenantResidencyBindingDto` (5 campos, 3 obligatorios). Delega en `ResidencyService.createBinding`. Crea filas en system_ops.tenant_residency_bindings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/residency.controller.ts:40` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.tenant_residency_bindings` | ESCRIBE | CREA | DIRECTA | ResidencyController.createBinding → ResidencyService.createBinding → ResidencyRepository.createBinding | `src/modules/system_ops/repositories/residency.repository.ts:153` |

### Cuerpo — DTO `CreateTenantResidencyBindingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant a vincular | `src/modules/system_ops/dto/residency.dto.ts:112` |
| `residencyPolicyId` | `string` | Sí | formato uuid | `@IsUUID()` | Política de residencia (polyglot_storage.residency_policies.id) | `src/modules/system_ops/dto/residency.dto.ts:123` |
| `primaryRegionConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Región primaria (concept id) | `src/modules/system_ops/dto/residency.dto.ts:130` |
| `disasterRecoveryRegionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Región de recuperación ante desastres (concept id) | `src/modules/system_ops/dto/residency.dto.ts:141` |
| `effectiveFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Efectivo desde (ISO) | `src/modules/system_ops/dto/residency.dto.ts:149` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "residencyPolicyId": "00000000-0000-4000-8000-000000000001",
  "primaryRegionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "residencyPolicyId": "00000000-0000-4000-8000-000000000001",
  "primaryRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "disasterRecoveryRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "effectiveFrom": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<IdResultDto>` · DTO `IdResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso | `src/modules/system_ops/dto/common-response.dto.ts:9` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 19. POST /admin/governance/workload-assessments

- **Origen:** CONTRATO
- **Nombre:** Iniciar una evaluación de workload
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AssessmentController.createAssessment` — `src/modules/system_ops/controllers/assessment.controller.ts:61`

### Qué es y para qué sirve (negocio)

Iniciar una evaluación de workload. Caso de uso UC-11-12: Iniciar evaluación de workload. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:28`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/workload-assessments` la atiende `AssessmentController.createAssessment` (src/modules/system_ops/controllers/assessment.controller.ts:61). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateWorkloadAssessmentDto` (8 campos, 5 obligatorios). Delega en `AssessmentService.createAssessment`. Crea filas en system_ops.workload_assessments. Lee system_ops.operational_frameworks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/assessment.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.operational_frameworks` | LEE | LEE | DIRECTA | AssessmentController.createAssessment → AssessmentService.createAssessment → AssessmentRepository.findFrameworkById | `src/modules/system_ops/repositories/assessment.repository.ts:49` |
| `system_ops.workload_assessments` | ESCRIBE | CREA | DIRECTA | AssessmentController.createAssessment → AssessmentService.createAssessment → AssessmentRepository.createAssessment | `src/modules/system_ops/repositories/assessment.repository.ts:246` |

### Cuerpo — DTO `CreateWorkloadAssessmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant de la evaluación | `src/modules/system_ops/dto/assessment.dto.ts:22` |
| `operationalFrameworkId` | `string` | Sí | formato uuid | `@IsUUID()` | Framework publicado a evaluar | `src/modules/system_ops/dto/assessment.dto.ts:29` |
| `workloadCode` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/system_ops/dto/assessment.dto.ts:38` |
| `workloadName` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/system_ops/dto/assessment.dto.ts:47` |
| `assessmentTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de evaluación (concept id) | `src/modules/system_ops/dto/assessment.dto.ts:57` |
| `assessmentPeriodStart` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio del periodo (ISO date) | `src/modules/system_ops/dto/assessment.dto.ts:65` |
| `assessmentPeriodEnd` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin del periodo (ISO date) | `src/modules/system_ops/dto/assessment.dto.ts:73` |
| `facilitatorUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Facilitador de la evaluación | `src/modules/system_ops/dto/assessment.dto.ts:84` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "operationalFrameworkId": "00000000-0000-4000-8000-000000000001",
  "workloadCode": "CODIGO_EJEMPLO",
  "workloadName": "Nombre de ejemplo",
  "assessmentTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<IdResultDto>` · DTO `IdResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso | `src/modules/system_ops/dto/common-response.dto.ts:9` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 20. PUT /admin/governance/workload-assessments/{id}/control-results

- **Origen:** CONTRATO
- **Nombre:** Registrar (UPSERT) resultados de control de una evaluación
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AssessmentController.putControlResults` — `src/modules/system_ops/controllers/assessment.controller.ts:73`

### Qué es y para qué sirve (negocio)

Registrar (UPSERT) resultados de control de una evaluación. Caso de uso UC-11-12: Registrar (UPSERT) resultados de control. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:29`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`PUT /admin/governance/workload-assessments/{id}/control-results` la atiende `AssessmentController.putControlResults` (src/modules/system_ops/controllers/assessment.controller.ts:73). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PutControlResultsDto` (6 campos, 3 obligatorios). Delega en `AssessmentService.putControlResults`. Crea filas en system_ops.assessment_control_results. Actualiza system_ops.assessment_control_results. Lee system_ops.assessment_control_results, system_ops.workload_assessments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/assessment.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/system_ops/controllers/assessment.controller.ts:73` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.assessment_control_results` | ESCRIBE | ACTUALIZA | POR_TIPO | AssessmentController.putControlResults → AssessmentService.putControlResults | `src/modules/system_ops/services/assessment.service.ts:213` |
| `system_ops.assessment_control_results` | ESCRIBE | CREA | DIRECTA | AssessmentController.putControlResults → AssessmentService.putControlResults → AssessmentRepository.createControlResult | `src/modules/system_ops/repositories/assessment.repository.ts:317` |
| `system_ops.assessment_control_results` | LEE | LEE | DIRECTA | AssessmentController.putControlResults → AssessmentService.putControlResults → AssessmentRepository.findControlResult | `src/modules/system_ops/repositories/assessment.repository.ts:266` |
| `system_ops.workload_assessments` | LEE | LEE | DIRECTA | AssessmentController.putControlResults → AssessmentService.putControlResults → AssessmentRepository.findAssessmentById | `src/modules/system_ops/repositories/assessment.repository.ts:190` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PutControlResultsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `results` | `array<ControlResultItemDto>` | Sí | — | `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ControlResultItemDto)` | — | `src/modules/system_ops/dto/assessment.dto.ts:144` |
| `results[].operationalFrameworkControlId` | `string` | Sí | formato uuid | `@IsUUID()` | Control del framework evaluado | `src/modules/system_ops/dto/assessment.dto.ts:97` |
| `results[].resultConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Resultado (concept id) | `src/modules/system_ops/dto/assessment.dto.ts:104` |
| `results[].maturityLevelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nivel de madurez (concept id) | `src/modules/system_ops/dto/assessment.dto.ts:115` |
| `results[].evidenceSummary` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/system_ops/dto/assessment.dto.ts:124` |
| `results[].evidenceLinksJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Enlaces de evidencia (JSON libre) | `src/modules/system_ops/dto/assessment.dto.ts:132` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "results": [
    {
      "operationalFrameworkControlId": "00000000-0000-4000-8000-000000000001",
      "resultConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/system_ops/dto/common-response.dto.ts:18` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 21. POST /admin/governance/write-policies

- **Origen:** CONTRATO
- **Nombre:** Definir una política de escritura
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `GovernanceCatalogController.createWritePolicy` — `src/modules/system_ops/controllers/governance-catalog.controller.ts:57`

### Qué es y para qué sirve (negocio)

Definir una política de escritura. Caso de uso UC-11-02: Definir política de escritura. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/governance/write-policies` la atiende `GovernanceCatalogController.createWritePolicy` (src/modules/system_ops/controllers/governance-catalog.controller.ts:57). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateWritePolicyDto` (9 campos, 5 obligatorios). Delega en `GovernanceCatalogService.createWritePolicy`. Crea filas en system_ops.governance_change_log, system_ops.write_policies. Lee system_ops.write_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/governance-catalog.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.governance_change_log` | ESCRIBE | CREA | DIRECTA | GovernanceCatalogController.createWritePolicy → GovernanceCatalogService.createWritePolicy → GovernanceRepository.recordChange | `src/modules/system_ops/repositories/governance.repository.ts:577` |
| `system_ops.write_policies` | ESCRIBE | CREA | DIRECTA | GovernanceCatalogController.createWritePolicy → GovernanceCatalogService.createWritePolicy → GovernanceRepository.createWritePolicy | `src/modules/system_ops/repositories/governance.repository.ts:393` |
| `system_ops.write_policies` | LEE | LEE | DIRECTA | GovernanceCatalogController.createWritePolicy → GovernanceCatalogService.createWritePolicy → GovernanceRepository.findWritePolicyByCode | `src/modules/system_ops/repositories/governance.repository.ts:319` |

### Cuerpo — DTO `CreateWritePolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/system_ops/dto/governance-policy.dto.ts:23` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/system_ops/dto/governance-policy.dto.ts:32` |
| `insertModeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Modo de inserción (concept id) | `src/modules/system_ops/dto/governance-policy.dto.ts:42` |
| `updateModeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Modo de actualización (concept id) | `src/modules/system_ops/dto/governance-policy.dto.ts:52` |
| `deleteModeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Modo de borrado (concept id) | `src/modules/system_ops/dto/governance-policy.dto.ts:59` |
| `requiresReason` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/governance-policy.dto.ts:67` |
| `requiresApproval` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/governance-policy.dto.ts:75` |
| `dualControl` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/governance-policy.dto.ts:83` |
| `maxBatchSize` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | — | `src/modules/system_ops/dto/governance-policy.dto.ts:92` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "insertModeConceptId": "00000000-0000-4000-8000-000000000001",
  "updateModeConceptId": "00000000-0000-4000-8000-000000000001",
  "deleteModeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<IdResultDto>` · DTO `IdResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso | `src/modules/system_ops/dto/common-response.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/system_ops/controllers/governance-catalog.controller.spec.ts:44` |

### Flujos

_Se completa en la fase de flujos._

---

## 22. POST /admin/ops/backup-policies

- **Origen:** CONTRATO
- **Nombre:** Definir una política de backup (RPO/RTO/inmutabilidad)
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BackupController.createPolicy` — `src/modules/system_ops/controllers/backup.controller.ts:20`

### Qué es y para qué sirve (negocio)

Definir una política de backup (RPO/RTO/inmutabilidad). Caso de uso UC-11-09: Definir política de backup (RPO/RTO/inmutabilidad). Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:25`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/ops/backup-policies` la atiende `BackupController.createPolicy` (src/modules/system_ops/controllers/backup.controller.ts:20). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateBackupPolicyDto` (9 campos, 5 obligatorios). Delega en `BackupService.createPolicy`. Crea filas en system_ops.backup_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/backup.controller.ts:20` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.backup_policies` | ESCRIBE | CREA | DIRECTA | BackupController.createPolicy → BackupService.createPolicy → BackupRepository.createPolicy | `src/modules/system_ops/repositories/backup.repository.ts:105` |

### Cuerpo — DTO `CreateBackupPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant de la política | `src/modules/system_ops/dto/backup.dto.ts:20` |
| `resourceScopeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Alcance del recurso (concept id) | `src/modules/system_ops/dto/backup.dto.ts:30` |
| `backupTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de backup (concept id) | `src/modules/system_ops/dto/backup.dto.ts:37` |
| `rpoSeconds` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | RPO objetivo en segundos | `src/modules/system_ops/dto/backup.dto.ts:45` |
| `rtoSeconds` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | RTO objetivo en segundos | `src/modules/system_ops/dto/backup.dto.ts:53` |
| `retentionDays` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Días de retención de copias | `src/modules/system_ops/dto/backup.dto.ts:62` |
| `immutableCopyRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/backup.dto.ts:70` |
| `encryptionRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/backup.dto.ts:78` |
| `restoreTestFrequencyDays` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Frecuencia de prueba de restauración (días) | `src/modules/system_ops/dto/backup.dto.ts:89` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "resourceScopeConceptId": "00000000-0000-4000-8000-000000000001",
  "backupTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "rpoSeconds": 1,
  "rtoSeconds": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<IdResultDto>` · DTO `IdResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso | `src/modules/system_ops/dto/common-response.dto.ts:9` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 23. POST /internal/governance/retention-executions/run

- **Origen:** CONTRATO
- **Nombre:** Ejecutar un barrido de retención (excluye objetivos bajo legal hold)
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RetentionExecutionController.run` — `src/modules/system_ops/controllers/retention-execution.controller.ts:23`

### Qué es y para qué sirve (negocio)

Ejecutar un barrido de retención (excluye objetivos bajo legal hold). Caso de uso UC-11-05: Ejecutar barrido de retención (excluye objetivos bajo legal hold). Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /internal/governance/retention-executions/run` la atiende `RetentionExecutionController.run` (src/modules/system_ops/controllers/retention-execution.controller.ts:23). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RunRetentionDto` (3 campos, 2 obligatorios). Delega en `RetentionExecutionService.run`. Crea filas en system_ops.record_revisions, system_ops.retention_executions. Actualiza system_ops.retention_executions. Lee system_ops.entity_registry, system_ops.legal_holds, system_ops.retention_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/retention-execution.controller.ts:23` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.entity_registry` | LEE | LEE | DIRECTA | RetentionExecutionController.run → RetentionExecutionService.run → GovernanceRepository.findEntityById | `src/modules/system_ops/repositories/governance.repository.ts:168` |
| `system_ops.legal_holds` | LEE | LEE | DIRECTA | RetentionExecutionController.run → RetentionExecutionService.run → RetentionExecutionRepository.countActiveHoldsForTarget | `src/modules/system_ops/repositories/retention-execution.repository.ts:104` |
| `system_ops.record_revisions` | ESCRIBE | CREA | DIRECTA | RetentionExecutionController.run → RetentionExecutionService.run → RetentionExecutionRepository.createRevision | `src/modules/system_ops/repositories/retention-execution.repository.ts:88` |
| `system_ops.retention_executions` | ESCRIBE | ACTUALIZA | POR_TIPO | RetentionExecutionController.run → RetentionExecutionService.run | `src/modules/system_ops/services/retention-execution.service.ts:105` |
| `system_ops.retention_executions` | ESCRIBE | CREA | DIRECTA | RetentionExecutionController.run → RetentionExecutionService.run → RetentionExecutionRepository.createExecution | `src/modules/system_ops/repositories/retention-execution.repository.ts:45` |
| `system_ops.retention_policies` | LEE | LEE | DIRECTA | RetentionExecutionController.run → RetentionExecutionService.run → GovernanceRepository.findRetentionPolicyById | `src/modules/system_ops/repositories/governance.repository.ts:426` |

### Cuerpo — DTO `RunRetentionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `retentionPolicyId` | `string` | Sí | formato uuid | `@IsUUID()` | Política de retención ACTIVE a ejecutar | `src/modules/system_ops/dto/retention-execution.dto.ts:14` |
| `entityRegistryId` | `string` | Sí | formato uuid | `@IsUUID()` | Entidad objetivo del registro (entity_registry.id) | `src/modules/system_ops/dto/retention-execution.dto.ts:24` |
| `maxBatchSize` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Tamaño máximo de lote a barrer | `src/modules/system_ops/dto/retention-execution.dto.ts:33` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "retentionPolicyId": "00000000-0000-4000-8000-000000000001",
  "entityRegistryId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "retentionPolicyId": "00000000-0000-4000-8000-000000000001",
  "entityRegistryId": "00000000-0000-4000-8000-000000000001",
  "maxBatchSize": 1
}
```

</details>

### Respuesta — `Promise<RetentionExecutionResponseDto>` · DTO `RetentionExecutionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_ops/dto/retention-execution.dto.ts:42` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado final (concept id) | `src/modules/system_ops/dto/retention-execution.dto.ts:48` |
| `totalScanned` | `number` | Sí | — | — | Valor de total scanned mantenido por la instancia. | `src/modules/system_ops/dto/retention-execution.dto.ts:54` |
| `totalDeleted` | `number` | Sí | — | — | Valor de total deleted mantenido por la instancia. | `src/modules/system_ops/dto/retention-execution.dto.ts:60` |
| `totalAnonymized` | `number` | Sí | — | — | Valor de total anonymized mantenido por la instancia. | `src/modules/system_ops/dto/retention-execution.dto.ts:66` |
| `totalArchived` | `number` | Sí | — | — | Valor de total archived mantenido por la instancia. | `src/modules/system_ops/dto/retention-execution.dto.ts:72` |
| `blockedByLegalHold` | `boolean` | No | — | — | true si se detuvo por legal hold activo | `src/modules/system_ops/dto/retention-execution.dto.ts:80` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 24. POST /internal/ops/restore-test-runs

- **Origen:** CONTRATO
- **Nombre:** Registrar una prueba de restauración con evidencia
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RestoreTestController.recordRestoreTest` — `src/modules/system_ops/controllers/restore-test.controller.ts:23`

### Qué es y para qué sirve (negocio)

Registrar una prueba de restauración con evidencia. Caso de uso UC-11-10: Registrar prueba de restauración con evidencia. Dentro del módulo (descripción del modelo, en inglés): «A control tower over the data: a registry of every table with its sensitivity, retention rules and allowed write operations, plus anonymization rules and a generic draft store.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/system_ops/README.md:26`) · MODELO (`Mantra Core Health Context/modules/diagram_11_system_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /internal/ops/restore-test-runs` la atiende `RestoreTestController.recordRestoreTest` (src/modules/system_ops/controllers/restore-test.controller.ts:23). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateRestoreTestRunDto` (8 campos, 2 obligatorios). Delega en `BackupService.recordRestoreTest`. Crea filas en system_ops.restore_test_runs. Lee system_ops.backup_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/system_ops/controllers/restore-test.controller.ts:23` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.backup_policies` | LEE | LEE | DIRECTA | RestoreTestController.recordRestoreTest → BackupService.recordRestoreTest → BackupRepository.findPolicyById | `src/modules/system_ops/repositories/backup.repository.ts:23` |
| `system_ops.restore_test_runs` | ESCRIBE | CREA | DIRECTA | RestoreTestController.recordRestoreTest → BackupService.recordRestoreTest → BackupRepository.createTestRun | `src/modules/system_ops/repositories/backup.repository.ts:164` |

### Cuerpo — DTO `CreateRestoreTestRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `backupPolicyId` | `string` | Sí | formato uuid | `@IsUUID()` | Política de backup ACTIVE | `src/modules/system_ops/dto/backup.dto.ts:99` |
| `backupReference` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia del backup restaurado | `src/modules/system_ops/dto/backup.dto.ts:111` |
| `outcomeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Resultado (concept id) | `src/modules/system_ops/dto/backup.dto.ts:118` |
| `measuredRpoSeconds` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | RPO medido en segundos | `src/modules/system_ops/dto/backup.dto.ts:127` |
| `measuredRtoSeconds` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | RTO medido en segundos | `src/modules/system_ops/dto/backup.dto.ts:136` |
| `integrityCheckPassed` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/system_ops/dto/backup.dto.ts:144` |
| `evidenceFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo de evidencia (common.files.id) | `src/modules/system_ops/dto/backup.dto.ts:155` |
| `startedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de la prueba (ISO) | `src/modules/system_ops/dto/backup.dto.ts:163` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "backupPolicyId": "00000000-0000-4000-8000-000000000001",
  "outcomeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<RestoreTestRunResponseDto>` · DTO `RestoreTestRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/system_ops/dto/backup.dto.ts:172` |
| `outcomeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a outcome concept. | `src/modules/system_ops/dto/backup.dto.ts:178` |
| `objectiveBreached` | `boolean` | Sí | — | — | true si el RPO/RTO medido supera el objetivo | `src/modules/system_ops/dto/backup.dto.ts:184` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

