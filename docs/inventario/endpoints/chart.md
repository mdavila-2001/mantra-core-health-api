<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `chart`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 16 (16 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 13 · BAJO 3
- **Tablas distintas que tocan:** 14
- **Respuestas de error y detalle contractual:** `openapi/endpoints/chart.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/charts/care-plans` | Crear un plan de cuidado con actividades | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 2 | PATCH | `/charts/care-plans/{planId}/activities/{activityId}` | Actualizar una actividad del plan de cuidado | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 3 | POST | `/charts/documents` | Adjuntar un documento con archivos gobernados | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 4 | POST | `/charts/notes` | Crear una nota clínica versionada (borrador SOAP) | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 5 | POST | `/charts/notes/{noteId}/amendments` | Enmendar una nota firmada (addendum versionado) | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 6 | PUT | `/charts/notes/{noteId}/versions` | Editar borrador creando una nueva versión inmutable | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 7 | POST | `/charts/notes/{noteId}/versions/{versionId}/cosign` | Cofirmar una versión firmada (cadena de firmas) | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 8 | POST | `/charts/notes/{noteId}/versions/{versionId}/sign` | Firmar una versión y sellar su contenido | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 9 | POST | `/charts/notes/versions/{versionId}/exam-findings` | Registrar hallazgos de examen físico | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 10 | POST | `/charts/notes/versions/{versionId}/release` | Liberar una versión al paciente | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 11 | POST | `/charts/notes/versions/{versionId}/withhold` | Retener una versión del paciente (motivo legal) | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 12 | GET | `/charts/patients/{patientProfileId}/chart` | UC-40-14: expediente del paciente (notas, planes de cuidados y documentos) | BAJO | 5 | CLINICIAN, PRACTITIONER |
| 13 | GET | `/charts/templates` | Listar las plantillas de chart por especialidad | BAJO | 3 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 14 | POST | `/charts/templates` | Crear una plantilla de chart con su esquema de campos, por especialidad | MEDIO | 5 | SECURITY_ADMIN |
| 15 | GET | `/charts/templates/{id}` | Leer el esquema de una plantilla de chart | BAJO | 3 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 16 | POST | `/charts/templates/{templateId}/assignments` | Asignar una plantilla de chart por especialidad | MEDIO | 3 | SECURITY_ADMIN |

---

## 1. POST /charts/care-plans

- **Origen:** CONTRATO
- **Nombre:** Crear un plan de cuidado con actividades
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartCarePlansController.createCarePlan` — `src/modules/chart/controllers/chart-care-plans.controller.ts:35`

### Qué es y para qué sirve (negocio)

Crear un plan de cuidado con actividades. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/care-plans` la atiende `ChartCarePlansController.createCarePlan` (src/modules/chart/controllers/chart-care-plans.controller.ts:35). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateCarePlanDto` (12 campos, 1 obligatorio). Delega en `ChartCarePlansService.createCarePlan`. Crea filas en chart.care_plan_activities, chart.care_plans.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-care-plans.controller.ts:35` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.care_plan_activities` | ESCRIBE | CREA | DIRECTA | ChartCarePlansController.createCarePlan → ChartCarePlansService.createCarePlan → CarePlansRepository.createActivity | `src/modules/chart/repositories/care-plans.repository.ts:198` |
| `chart.care_plans` | ESCRIBE | CREA | DIRECTA | ChartCarePlansController.createCarePlan → ChartCarePlansService.createCarePlan → CarePlansRepository.createPlan | `src/modules/chart/repositories/care-plans.repository.ts:169` |

### Cuerpo — DTO `CreateCarePlanDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil de paciente (profiles.patient_profiles) | `src/modules/chart/dto/care-plans.dto.ts:59` |
| `conditionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Condición clínica asociada | `src/modules/chart/dto/care-plans.dto.ts:70` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro clínico asociado | `src/modules/chart/dto/care-plans.dto.ts:81` |
| `intentConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la intención del plan | `src/modules/chart/dto/care-plans.dto.ts:92` |
| `authorProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil del clínico autor | `src/modules/chart/dto/care-plans.dto.ts:103` |
| `goalText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Meta clínica del plan | `src/modules/chart/dto/care-plans.dto.ts:112` |
| `startDate` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Fecha de inicio (YYYY-MM-DD) | `src/modules/chart/dto/care-plans.dto.ts:124` |
| `endDate` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Fecha de fin (YYYY-MM-DD) | `src/modules/chart/dto/care-plans.dto.ts:136` |
| `activities` | `array<CarePlanActivityInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => CarePlanActivityInputDto)` | Actividades iniciales (0..n) | `src/modules/chart/dto/care-plans.dto.ts:149` |
| `activities[].activityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de actividad | `src/modules/chart/dto/care-plans.dto.ts:25` |
| `activities[].scheduledAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Momento programado | `src/modules/chart/dto/care-plans.dto.ts:37` |
| `activities[].detailText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/chart/dto/care-plans.dto.ts:46` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "conditionId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "intentConceptId": "00000000-0000-4000-8000-000000000001",
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "goalText": "valor-ejemplo",
  "startDate": "2026-07-31",
  "endDate": "2026-07-31",
  "activities": [
    {
      "activityConceptId": "00000000-0000-4000-8000-000000000001",
      "scheduledAt": "2026-07-31T12:00:00.000Z",
      "detailText": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<CarePlanResponseDto>` · DTO `CarePlanResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/chart/dto/care-plans.dto.ts:193` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado del plan | `src/modules/chart/dto/care-plans.dto.ts:202` |
| `activityCount` | `number` | Sí | — | — | Nº de actividades creadas | `src/modules/chart/dto/care-plans.dto.ts:208` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/chart/dto/care-plans.dto.ts:214` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:501` |
| CONTROLADOR | `src/modules/chart/controllers/chart-care-plans.controller.spec.ts:31` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartCarePlansController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. PATCH /charts/care-plans/{planId}/activities/{activityId}

- **Origen:** CONTRATO
- **Nombre:** Actualizar una actividad del plan de cuidado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartCarePlansController.updateActivity` — `src/modules/chart/controllers/chart-care-plans.controller.ts:46`

### Qué es y para qué sirve (negocio)

Actualizar una actividad del plan de cuidado. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /charts/care-plans/{planId}/activities/{activityId}` la atiende `ChartCarePlansController.updateActivity` (src/modules/chart/controllers/chart-care-plans.controller.ts:46). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `UpdateActivityDto` (3 campos, 0 obligatorios). Delega en `ChartCarePlansService.updateActivity`. Actualiza chart.care_plan_activities, chart.care_plans. Lee chart.care_plan_activities, chart.care_plans.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-care-plans.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: planId, activityId | `src/modules/chart/controllers/chart-care-plans.controller.ts:46` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.care_plan_activities` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity | `src/modules/chart/services/chart-care-plans.service.ts:141` |
| `chart.care_plan_activities` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → CarePlansRepository.findActivityById | `src/modules/chart/repositories/care-plans.repository.ts:144` |
| `chart.care_plans` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity | `src/modules/chart/services/chart-care-plans.service.ts:156` |
| `chart.care_plans` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → CarePlansRepository.findPlanById | `src/modules/chart/repositories/care-plans.repository.ts:92` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `planId` | path | Sí | `string` | — |
| `activityId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateActivityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | No | valores: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED | `@IsOptional()` `@IsIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])` | Nuevo estado de la actividad | `src/modules/chart/dto/care-plans.dto.ts:167` |
| `scheduledAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | — | `src/modules/chart/dto/care-plans.dto.ts:175` |
| `detailText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/chart/dto/care-plans.dto.ts:184` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "SCHEDULED",
  "scheduledAt": "2026-07-31T12:00:00.000Z",
  "detailText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ActivityResponseDto>` · DTO `ActivityResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/chart/dto/care-plans.dto.ts:223` |
| `activityType` | `string` | Sí | valores: APPOINTMENT, PROCEDURE, FOLLOW_UP, TELEHEALTH, OTHER | — | Valor de activity type mantenido por la instancia. | sin fuente |
| `subtypeCreated` | `boolean` | Sí | — | — | true si además se creó la fila del subtipo (tarea o nota) | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plan de cuidado no encontrado; ResourceNotFoundException: Actividad no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El plan de cuidado no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-care-plans.controller.spec.ts:38` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartCarePlansController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /charts/documents

- **Origen:** CONTRATO
- **Nombre:** Adjuntar un documento con archivos gobernados
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartDocumentsController.createDocument` — `src/modules/chart/controllers/chart-documents.controller.ts:21`

### Qué es y para qué sirve (negocio)

Adjuntar un documento con archivos gobernados. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/documents` la atiende `ChartDocumentsController.createDocument` (src/modules/chart/controllers/chart-documents.controller.ts:21). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateDocumentDto` (14 campos, 3 obligatorios). Delega en `ChartDocumentsService.createDocument`. Crea filas en chart.document_record_files, chart.document_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-documents.controller.ts:21` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.document_record_files` | ESCRIBE | CREA | DIRECTA | ChartDocumentsController.createDocument → ChartDocumentsService.createDocument → DocumentsRepository.createFile | `src/modules/chart/repositories/documents.repository.ts:155` |
| `chart.document_records` | ESCRIBE | CREA | DIRECTA | ChartDocumentsController.createDocument → ChartDocumentsService.createDocument → DocumentsRepository.createRecord | `src/modules/chart/repositories/documents.repository.ts:123` |

### Cuerpo — DTO `CreateDocumentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil de paciente (profiles.patient_profiles) | `src/modules/chart/dto/documents.dto.ts:66` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant propietario (directory.tenants) | `src/modules/chart/dto/documents.dto.ts:76` |
| `title` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Título del documento | `src/modules/chart/dto/documents.dto.ts:85` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro clínico asociado | `src/modules/chart/dto/documents.dto.ts:96` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la categoría documental | `src/modules/chart/dto/documents.dto.ts:107` |
| `sourceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la fuente del documento | `src/modules/chart/dto/documents.dto.ts:118` |
| `confidentialityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de confidencialidad | `src/modules/chart/dto/documents.dto.ts:129` |
| `patientVisibilityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de visibilidad para el paciente | `src/modules/chart/dto/documents.dto.ts:140` |
| `authorText` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Autor libre (documentos externos) | `src/modules/chart/dto/documents.dto.ts:149` |
| `isExternal` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true si el documento proviene de una fuente externa | `src/modules/chart/dto/documents.dto.ts:159` |
| `files` | `array<DocumentFileInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => DocumentFileInputDto)` | Archivos gobernados (0..n) | `src/modules/chart/dto/documents.dto.ts:172` |
| `files[].fileId` | `string` | No | formato uuid | `@IsUUID()` | Archivo ya subido a object_storage (common.files) | `src/modules/chart/dto/documents.dto.ts:30` |
| `files[].contentRole` | `string` | No | valores: PRIMARY, ATTACHMENT | `@IsOptional()` `@IsIn(['PRIMARY', 'ATTACHMENT'])` | Rol de contenido | `src/modules/chart/dto/documents.dto.ts:41` |
| `files[].ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden del archivo dentro del documento | `src/modules/chart/dto/documents.dto.ts:53` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "title": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "title": "valor-ejemplo",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "sourceConceptId": "00000000-0000-4000-8000-000000000001",
  "confidentialityConceptId": "00000000-0000-4000-8000-000000000001",
  "patientVisibilityConceptId": "00000000-0000-4000-8000-000000000001",
  "authorText": "valor-ejemplo",
  "isExternal": true,
  "files": [
    {
      "fileId": "00000000-0000-4000-8000-000000000001",
      "contentRole": "PRIMARY",
      "ordinal": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<DocumentResponseDto>` · DTO `DocumentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador del documento (ObjectId hex) | `src/modules/chart/dto/documents.dto.ts:181` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | sin fuente |
| `documentType` | `string` | Sí | — | — | Valor de document type mantenido por la instancia. | sin fuente |
| `payload` | `object` | Sí | — | — | Valor de payload mantenido por la instancia. | sin fuente |
| `version` | `number` | Sí | — | — | Versión vigente (concurrencia optimista) | sin fuente |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/chart/dto/documents.dto.ts:202` |
| `updatedAt` | `string` | Sí | formato date-time | — | Fecha y hora de la última actualización. | sin fuente |
| `deletedAt` | `string` | No | formato date-time; admite null | — | Marca de borrado lógico; null si el documento está vivo | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-documents.controller.spec.ts:19` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartDocumentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /charts/notes

- **Origen:** CONTRATO
- **Nombre:** Crear una nota clínica versionada (borrador SOAP)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.createNote` — `src/modules/chart/controllers/chart-notes.controller.ts:46`

### Qué es y para qué sirve (negocio)

Crear una nota clínica versionada (borrador SOAP). Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/notes` la atiende `ChartNotesController.createNote` (src/modules/chart/controllers/chart-notes.controller.ts:46). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateNoteDto` (10 campos, 2 obligatorios). Delega en `ChartNotesService.createNote`. Crea filas en chart.clinical_note_headers, chart.clinical_note_versions. Actualiza chart.clinical_note_headers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartNotesController.createNote → ChartNotesService.createNote | `src/modules/chart/services/chart-notes.service.ts:103` |
| `chart.clinical_note_headers` | ESCRIBE | CREA | DIRECTA | ChartNotesController.createNote → ChartNotesService.createNote → ClinicalNotesRepository.createHeader | `src/modules/chart/repositories/clinical-notes.repository.ts:307` |
| `chart.clinical_note_versions` | ESCRIBE | CREA | DIRECTA | ChartNotesController.createNote → ChartNotesService.createNote → ClinicalNotesRepository.createVersion | `src/modules/chart/repositories/clinical-notes.repository.ts:333` |

### Cuerpo — DTO `CreateNoteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil de paciente (profiles.patient_profiles) | `src/modules/chart/dto/notes.dto.ts:25` |
| `authorProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil del clínico autor | `src/modules/chart/dto/notes.dto.ts:32` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro clínico asociado | `src/modules/chart/dto/notes.dto.ts:43` |
| `noteTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de nota | `src/modules/chart/dto/notes.dto.ts:54` |
| `confidentialityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de confidencialidad | `src/modules/chart/dto/notes.dto.ts:65` |
| `chiefComplaintText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/chart/dto/notes.dto.ts:74` |
| `subjectiveText` | `string` | No | — | `@IsOptional()` `@IsString()` | Bloque S (subjetivo) del SOAP | `src/modules/chart/dto/notes.dto.ts:82` |
| `objectiveText` | `string` | No | — | `@IsOptional()` `@IsString()` | Bloque O (objetivo) del SOAP | `src/modules/chart/dto/notes.dto.ts:90` |
| `assessmentText` | `string` | No | — | `@IsOptional()` `@IsString()` | Bloque A (evaluación) del SOAP | `src/modules/chart/dto/notes.dto.ts:98` |
| `planText` | `string` | No | — | `@IsOptional()` `@IsString()` | Bloque P (plan) del SOAP | `src/modules/chart/dto/notes.dto.ts:106` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "authorProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "noteTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "confidentialityConceptId": "00000000-0000-4000-8000-000000000001",
  "chiefComplaintText": "valor-ejemplo",
  "subjectiveText": "valor-ejemplo",
  "objectiveText": "valor-ejemplo",
  "assessmentText": "valor-ejemplo",
  "planText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<NoteVersionResponseDto>` · DTO `NoteVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `noteId` | `string` | Sí | formato uuid | — | Identificador asociado a note. | `src/modules/chart/dto/notes.dto.ts:402` |
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:408` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/chart/dto/notes.dto.ts:414` |
| `lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del ciclo de vida de la cabecera | `src/modules/chart/dto/notes.dto.ts:423` |
| `versionStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la versión | `src/modules/chart/dto/notes.dto.ts:432` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:453` |
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:37` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /charts/notes/{noteId}/amendments

- **Origen:** CONTRATO
- **Nombre:** Enmendar una nota firmada (addendum versionado)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.amendNote` — `src/modules/chart/controllers/chart-notes.controller.ts:99`

### Qué es y para qué sirve (negocio)

Enmendar una nota firmada (addendum versionado). Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/notes/{noteId}/amendments` la atiende `ChartNotesController.amendNote` (src/modules/chart/controllers/chart-notes.controller.ts:99). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AmendNoteDto` (7 campos, 2 obligatorios). Delega en `ChartNotesService.amendNote`. Crea filas en chart.clinical_note_versions. Actualiza chart.clinical_note_headers. Lee chart.clinical_note_headers, chart.clinical_note_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:99` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: noteId | `src/modules/chart/controllers/chart-notes.controller.ts:99` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartNotesController.amendNote → ChartNotesService.amendNote | `src/modules/chart/services/chart-notes.service.ts:328` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalNotesRepository.findHeaderById | `src/modules/chart/repositories/clinical-notes.repository.ts:213` |
| `chart.clinical_note_versions` | ESCRIBE | CREA | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalNotesRepository.createVersion | `src/modules/chart/repositories/clinical-notes.repository.ts:333` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalNotesRepository.maxVersionNumber | `src/modules/chart/repositories/clinical-notes.repository.ts:274` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `noteId` | path | Sí | `string` | — |

### Cuerpo — DTO `AmendNoteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `authorProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil del clínico que enmienda | `src/modules/chart/dto/notes.dto.ts:234` |
| `amendmentReasonText` | `string` | Sí | longitud mínima 1; longitud máxima 2000 | `@IsString()` `@MinLength(1)` `@MaxLength(2000)` | Motivo textual de la enmienda (obligatorio) | `src/modules/chart/dto/notes.dto.ts:243` |
| `amendmentReasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del motivo de enmienda | `src/modules/chart/dto/notes.dto.ts:254` |
| `subjectiveText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:262` |
| `objectiveText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:270` |
| `assessmentText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:278` |
| `planText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:286` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "amendmentReasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "amendmentReasonText": "Texto descriptivo de ejemplo",
  "amendmentReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "subjectiveText": "valor-ejemplo",
  "objectiveText": "valor-ejemplo",
  "assessmentText": "valor-ejemplo",
  "planText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<NoteVersionResponseDto>` · DTO `NoteVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `noteId` | `string` | Sí | formato uuid | — | Identificador asociado a note. | `src/modules/chart/dto/notes.dto.ts:402` |
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:408` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/chart/dto/notes.dto.ts:414` |
| `lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del ciclo de vida de la cabecera | `src/modules/chart/dto/notes.dto.ts:423` |
| `versionStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la versión | `src/modules/chart/dto/notes.dto.ts:432` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Nota clínica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La nota no está firmada; edítela como borrador (UC-15-02) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:75` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. PUT /charts/notes/{noteId}/versions

- **Origen:** CONTRATO
- **Nombre:** Editar borrador creando una nueva versión inmutable
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.addVersion` — `src/modules/chart/controllers/chart-notes.controller.ts:59`

### Qué es y para qué sirve (negocio)

Editar borrador creando una nueva versión inmutable. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PUT /charts/notes/{noteId}/versions` la atiende `ChartNotesController.addVersion` (src/modules/chart/controllers/chart-notes.controller.ts:59). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AddVersionDto` (6 campos, 1 obligatorio). Delega en `ChartNotesService.addVersion`. Crea filas en chart.clinical_note_versions. Actualiza chart.clinical_note_headers. Lee chart.clinical_note_headers, chart.clinical_note_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:59` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: noteId | `src/modules/chart/controllers/chart-notes.controller.ts:59` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartNotesController.addVersion → ChartNotesService.addVersion | `src/modules/chart/services/chart-notes.service.ts:161` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalNotesRepository.findHeaderById | `src/modules/chart/repositories/clinical-notes.repository.ts:213` |
| `chart.clinical_note_versions` | ESCRIBE | CREA | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalNotesRepository.createVersion | `src/modules/chart/repositories/clinical-notes.repository.ts:333` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalNotesRepository.maxVersionNumber | `src/modules/chart/repositories/clinical-notes.repository.ts:274` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `noteId` | path | Sí | `string` | — |

### Cuerpo — DTO `AddVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `authorProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil del clínico autor | `src/modules/chart/dto/notes.dto.ts:116` |
| `chiefComplaintText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/chart/dto/notes.dto.ts:125` |
| `subjectiveText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:133` |
| `objectiveText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:141` |
| `assessmentText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:149` |
| `planText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:157` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "authorProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "chiefComplaintText": "valor-ejemplo",
  "subjectiveText": "valor-ejemplo",
  "objectiveText": "valor-ejemplo",
  "assessmentText": "valor-ejemplo",
  "planText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<NoteVersionResponseDto>` · DTO `NoteVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `noteId` | `string` | Sí | formato uuid | — | Identificador asociado a note. | `src/modules/chart/dto/notes.dto.ts:402` |
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:408` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/chart/dto/notes.dto.ts:414` |
| `lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del ciclo de vida de la cabecera | `src/modules/chart/dto/notes.dto.ts:423` |
| `versionStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la versión | `src/modules/chart/dto/notes.dto.ts:432` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Nota clínica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La nota ya no está en borrador; use una enmienda (UC-15-05) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:44` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /charts/notes/{noteId}/versions/{versionId}/cosign

- **Origen:** CONTRATO
- **Nombre:** Cofirmar una versión firmada (cadena de firmas)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.cosignVersion` — `src/modules/chart/controllers/chart-notes.controller.ts:86`

### Qué es y para qué sirve (negocio)

Cofirmar una versión firmada (cadena de firmas). Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/notes/{noteId}/versions/{versionId}/cosign` la atiende `ChartNotesController.cosignVersion` (src/modules/chart/controllers/chart-notes.controller.ts:86). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CosignVersionDto` (3 campos, 1 obligatorio). Delega en `ChartNotesService.cosignVersion`. Crea filas en chart.clinical_note_signatures. Lee chart.clinical_note_headers, chart.clinical_note_signatures, chart.clinical_note_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: noteId, versionId | `src/modules/chart/controllers/chart-notes.controller.ts:86` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ChartNotesService.loadNoteAndVersion → ClinicalNotesRepository.findHeaderById | `src/modules/chart/repositories/clinical-notes.repository.ts:213` |
| `chart.clinical_note_signatures` | ESCRIBE | CREA | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalNotesRepository.createSignature | `src/modules/chart/repositories/clinical-notes.repository.ts:367` |
| `chart.clinical_note_signatures` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalNotesRepository.findSignatures | `src/modules/chart/repositories/clinical-notes.repository.ts:291` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ChartNotesService.loadNoteAndVersion → ClinicalNotesRepository.findVersionById | `src/modules/chart/repositories/clinical-notes.repository.ts:227` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `noteId` | path | Sí | `string` | — |
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `CosignVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `signerProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil del cofirmante / supervisor | `src/modules/chart/dto/notes.dto.ts:204` |
| `certificateThumbprint` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/chart/dto/notes.dto.ts:213` |
| `signatureValueEncrypted` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:221` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "signerProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "certificateThumbprint": "valor-ejemplo",
  "signatureValueEncrypted": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<NoteVersionResponseDto>` · DTO `NoteVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `noteId` | `string` | Sí | formato uuid | — | Identificador asociado a note. | `src/modules/chart/dto/notes.dto.ts:402` |
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:408` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/chart/dto/notes.dto.ts:414` |
| `lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del ciclo de vida de la cabecera | `src/modules/chart/dto/notes.dto.ts:423` |
| `versionStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la versión | `src/modules/chart/dto/notes.dto.ts:432` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de nota no encontrada; ResourceNotFoundException: Nota clínica no encontrada |
| 409 | `CONFLICT` | ConflictException: El cofirmante ya firmó esta versión |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión no está firmada (SIGNED); PreconditionFailedException: Falta la firma primaria del autor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:63` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /charts/notes/{noteId}/versions/{versionId}/sign

- **Origen:** CONTRATO
- **Nombre:** Firmar una versión y sellar su contenido
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.signVersion` — `src/modules/chart/controllers/chart-notes.controller.ts:73`

### Qué es y para qué sirve (negocio)

Firmar una versión y sellar su contenido. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/notes/{noteId}/versions/{versionId}/sign` la atiende `ChartNotesController.signVersion` (src/modules/chart/controllers/chart-notes.controller.ts:73). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `SignVersionDto` (3 campos, 1 obligatorio). Delega en `ChartNotesService.signVersion`. Crea filas en chart.clinical_note_signatures. Lee chart.clinical_note_headers, chart.clinical_note_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: noteId, versionId | `src/modules/chart/controllers/chart-notes.controller.ts:73` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ChartNotesService.loadNoteAndVersion → ClinicalNotesRepository.findHeaderById | `src/modules/chart/repositories/clinical-notes.repository.ts:213` |
| `chart.clinical_note_signatures` | ESCRIBE | CREA | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalNotesRepository.createSignature | `src/modules/chart/repositories/clinical-notes.repository.ts:367` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ChartNotesService.loadNoteAndVersion → ClinicalNotesRepository.findVersionById | `src/modules/chart/repositories/clinical-notes.repository.ts:227` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `noteId` | path | Sí | `string` | — |
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `SignVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `signerProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil del firmante (autor o delegado) | `src/modules/chart/dto/notes.dto.ts:170` |
| `certificateThumbprint` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Huella del certificado usado en la firma | `src/modules/chart/dto/notes.dto.ts:181` |
| `signatureValueEncrypted` | `string` | No | — | `@IsOptional()` `@IsString()` | Valor de firma cifrado (opaco al backend) | `src/modules/chart/dto/notes.dto.ts:191` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "signerProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "certificateThumbprint": "valor-ejemplo",
  "signatureValueEncrypted": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<NoteVersionResponseDto>` · DTO `NoteVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `noteId` | `string` | Sí | formato uuid | — | Identificador asociado a note. | `src/modules/chart/dto/notes.dto.ts:402` |
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:408` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/chart/dto/notes.dto.ts:414` |
| `lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del ciclo de vida de la cabecera | `src/modules/chart/dto/notes.dto.ts:423` |
| `versionStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la versión | `src/modules/chart/dto/notes.dto.ts:432` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de nota no encontrada; ResourceNotFoundException: Nota clínica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión no está en borrador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:466` |
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:51` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /charts/notes/versions/{versionId}/exam-findings

- **Origen:** CONTRATO
- **Nombre:** Registrar hallazgos de examen físico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.recordExamFindings` — `src/modules/chart/controllers/chart-notes.controller.ts:135`

### Qué es y para qué sirve (negocio)

Registrar hallazgos de examen físico. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/notes/versions/{versionId}/exam-findings` la atiende `ChartNotesController.recordExamFindings` (src/modules/chart/controllers/chart-notes.controller.ts:135). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ExamFindingsDto` (6 campos, 1 obligatorio). Delega en `ChartNotesService.recordExamFindings`. Crea filas en chart.physical_exam_findings. Actualiza chart.clinical_note_versions. Lee chart.clinical_note_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:135` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId | `src/modules/chart/controllers/chart-notes.controller.ts:135` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings | `src/modules/chart/services/chart-notes.service.ts:491` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ClinicalNotesRepository.findVersionById | `src/modules/chart/repositories/clinical-notes.repository.ts:227` |
| `chart.physical_exam_findings` | ESCRIBE | CREA | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ClinicalNotesRepository.createExamFinding | `src/modules/chart/repositories/clinical-notes.repository.ts:420` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `ExamFindingsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `findings` | `array<ExamFindingInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ExamFindingInputDto)` | Batch de hallazgos | `src/modules/chart/dto/notes.dto.ts:382` |
| `findings[].bodySystemConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del sistema corporal | `src/modules/chart/dto/notes.dto.ts:339` |
| `findings[].findingConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del hallazgo codificado | `src/modules/chart/dto/notes.dto.ts:350` |
| `findings[].isNormal` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true si el hallazgo es normal | `src/modules/chart/dto/notes.dto.ts:358` |
| `findings[].findingText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:366` |
| `objectiveText` | `string` | No | — | `@IsOptional()` `@IsString()` | Texto objetivo sintetizado (solo si la versión sigue en DRAFT) | `src/modules/chart/dto/notes.dto.ts:393` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "findings": [
    {}
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "findings": [
    {
      "bodySystemConceptId": "00000000-0000-4000-8000-000000000001",
      "findingConceptId": "00000000-0000-4000-8000-000000000001",
      "isNormal": true,
      "findingText": "valor-ejemplo"
    }
  ],
  "objectiveText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ExamFindingsResultDto>` · DTO `ExamFindingsResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:441` |
| `recordedFindings` | `number` | Sí | — | — | Nº de hallazgos registrados | `src/modules/chart/dto/notes.dto.ts:447` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de nota no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión ya está firmada; los hallazgos quedan sellados |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:98` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /charts/notes/versions/{versionId}/release

- **Origen:** CONTRATO
- **Nombre:** Liberar una versión al paciente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.releaseVersion` — `src/modules/chart/controllers/chart-notes.controller.ts:111`

### Qué es y para qué sirve (negocio)

Liberar una versión al paciente. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/notes/versions/{versionId}/release` la atiende `ChartNotesController.releaseVersion` (src/modules/chart/controllers/chart-notes.controller.ts:111). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ReleaseVersionDto` (1 campo, 0 obligatorios). Delega en `ChartNotesService.releaseVersion`. Crea filas en chart.note_release_events. Actualiza chart.clinical_note_headers. Lee chart.clinical_note_headers, chart.clinical_note_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:111` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId | `src/modules/chart/controllers/chart-notes.controller.ts:111` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion | `src/modules/chart/services/chart-notes.service.ts:391` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ClinicalNotesRepository.findHeaderById | `src/modules/chart/repositories/clinical-notes.repository.ts:213` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ClinicalNotesRepository.findVersionById | `src/modules/chart/repositories/clinical-notes.repository.ts:227` |
| `chart.note_release_events` | ESCRIBE | CREA | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ClinicalNotesRepository.createReleaseEvent | `src/modules/chart/repositories/clinical-notes.repository.ts:393` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `ReleaseVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `policyVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Versión de la política de liberación aplicada | `src/modules/chart/dto/notes.dto.ts:300` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "policyVersion": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ReleaseResultDto>` · DTO `ReleaseResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:456` |
| `releaseEventId` | `string` | Sí | formato uuid | — | Identificador asociado a release event. | `src/modules/chart/dto/notes.dto.ts:462` |
| `patientReleaseStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de liberación de la cabecera | `src/modules/chart/dto/notes.dto.ts:471` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de nota no encontrada; ResourceNotFoundException: Nota clínica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión no está firmada; PreconditionFailedException: La versión no es elegible para liberación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:474` |
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:81` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /charts/notes/versions/{versionId}/withhold

- **Origen:** CONTRATO
- **Nombre:** Retener una versión del paciente (motivo legal)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.withholdVersion` — `src/modules/chart/controllers/chart-notes.controller.ts:123`

### Qué es y para qué sirve (negocio)

Retener una versión del paciente (motivo legal). Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/notes/versions/{versionId}/withhold` la atiende `ChartNotesController.withholdVersion` (src/modules/chart/controllers/chart-notes.controller.ts:123). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `WithholdVersionDto` (2 campos, 0 obligatorios). Delega en `ChartNotesService.withholdVersion`. Crea filas en chart.note_release_events. Actualiza chart.clinical_note_headers. Lee chart.clinical_note_headers, chart.clinical_note_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:123` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId | `src/modules/chart/controllers/chart-notes.controller.ts:123` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion | `src/modules/chart/services/chart-notes.service.ts:438` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalNotesRepository.findHeaderById | `src/modules/chart/repositories/clinical-notes.repository.ts:213` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalNotesRepository.findVersionById | `src/modules/chart/repositories/clinical-notes.repository.ts:227` |
| `chart.note_release_events` | ESCRIBE | CREA | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalNotesRepository.createReleaseEvent | `src/modules/chart/repositories/clinical-notes.repository.ts:393` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `WithholdVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del motivo de retención | `src/modules/chart/dto/notes.dto.ts:314` |
| `policyVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Versión de la política de retención aplicada | `src/modules/chart/dto/notes.dto.ts:325` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reasonConceptId": "00000000-0000-4000-8000-000000000001",
  "policyVersion": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ReleaseResultDto>` · DTO `ReleaseResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:456` |
| `releaseEventId` | `string` | Sí | formato uuid | — | Identificador asociado a release event. | `src/modules/chart/dto/notes.dto.ts:462` |
| `patientReleaseStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de liberación de la cabecera | `src/modules/chart/dto/notes.dto.ts:471` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de nota no encontrada; ResourceNotFoundException: Nota clínica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:87` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. GET /charts/patients/{patientProfileId}/chart

- **Origen:** CONTRATO
- **Nombre:** UC-40-14: expediente del paciente (notas, planes de cuidados y documentos)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartReadController.getPatientChart` — `src/modules/chart/controllers/chart-read.controller.ts:41`

### Qué es y para qué sirve (negocio)

UC-40-14: expediente del paciente (notas, planes de cuidados y documentos). Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /charts/patients/{patientProfileId}/chart` la atiende `ChartReadController.getPatientChart` (src/modules/chart/controllers/chart-read.controller.ts:41). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `ChartReadService.getPatientChart`. Lee chart.care_plan_activities, chart.care_plans, chart.clinical_note_headers, chart.clinical_note_versions, chart.document_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-read.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/chart/controllers/chart-read.controller.ts:41` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.care_plan_activities` | LEE | LEE | DIRECTA | ChartReadController.getPatientChart → ChartReadService.getPatientChart → CarePlansRepository.findActivitiesForPlans | `src/modules/chart/repositories/care-plans.repository.ts:130` |
| `chart.care_plans` | LEE | LEE | DIRECTA | ChartReadController.getPatientChart → ChartReadService.getPatientChart → CarePlansRepository.findPlansByPatient | `src/modules/chart/repositories/care-plans.repository.ts:108` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartReadController.getPatientChart → ChartReadService.getPatientChart → ClinicalNotesRepository.findHeadersByPatient | `src/modules/chart/repositories/clinical-notes.repository.ts:243` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartReadController.getPatientChart → ChartReadService.getPatientChart → ClinicalNotesRepository.findVersionsByIds | `src/modules/chart/repositories/clinical-notes.repository.ts:265` |
| `chart.document_records` | LEE | LEE | DIRECTA | ChartReadController.getPatientChart → ChartReadService.getPatientChart → DocumentsRepository.findRecordsByPatient | `src/modules/chart/repositories/documents.repository.ts:105` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |
| `limit` | query | No | `number` | Tope aplicado a cada bloque (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientChartResponseDto>` · DTO `PatientChartResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/chart/dto/chart-read.dto.ts:249` |
| `notes` | `array<ChartNoteItemDto>` | Sí | — | — | Valor de notes mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:255` |
| `notes[].noteId` | `string` | Sí | formato uuid | — | Identificador asociado a note. | `src/modules/chart/dto/chart-read.dto.ts:15` |
| `notes[].encounterId` | `string` | No | formato uuid | — | Identificador asociado a encounter. | `src/modules/chart/dto/chart-read.dto.ts:21` |
| `notes[].noteTypeConceptId` | `string` | No | formato uuid | — | Identificador asociado a note type concept. | `src/modules/chart/dto/chart-read.dto.ts:27` |
| `notes[].lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a lifecycle status concept. | `src/modules/chart/dto/chart-read.dto.ts:33` |
| `notes[].currentVersionId` | `string` | No | formato uuid | — | Identificador asociado a current version. | `src/modules/chart/dto/chart-read.dto.ts:39` |
| `notes[].versionNumber` | `number` | No | — | — | Número de la versión vigente | `src/modules/chart/dto/chart-read.dto.ts:45` |
| `notes[].authorProfileId` | `string` | No | formato uuid | — | Identificador asociado a author profile. | `src/modules/chart/dto/chart-read.dto.ts:51` |
| `notes[].chiefComplaintText` | `string` | No | — | — | Valor de chief complaint text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:57` |
| `notes[].subjectiveText` | `string` | No | — | — | Valor de subjective text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:63` |
| `notes[].objectiveText` | `string` | No | — | — | Valor de objective text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:69` |
| `notes[].assessmentText` | `string` | No | — | — | Valor de assessment text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:75` |
| `notes[].planText` | `string` | No | — | — | Valor de plan text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:81` |
| `notes[].signedAt` | `string` | No | formato date-time | — | Valor de signed at mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:87` |
| `notes[].releasedToPatient` | `boolean` | Sí | — | — | Si la nota tiene una versión liberada al portal del paciente. Derivado, para no obligar a resolver terminología antes de decidir si se muestra | `src/modules/chart/dto/chart-read.dto.ts:96` |
| `notes[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/chart/dto/chart-read.dto.ts:102` |
| `carePlans` | `array<ChartCarePlanItemDto>` | Sí | — | — | Valor de care plans mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:261` |
| `carePlans[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/chart/dto/chart-read.dto.ts:138` |
| `carePlans[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/chart/dto/chart-read.dto.ts:144` |
| `carePlans[].intentConceptId` | `string` | No | formato uuid | — | Identificador asociado a intent concept. | `src/modules/chart/dto/chart-read.dto.ts:150` |
| `carePlans[].goalText` | `string` | No | — | — | Valor de goal text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:156` |
| `carePlans[].startDate` | `string` | No | formato date | — | Valor de start date mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:162` |
| `carePlans[].endDate` | `string` | No | formato date | — | Valor de end date mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:168` |
| `carePlans[].activities` | `array<CarePlanActivityItemDto>` | Sí | — | — | Valor de activities mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:174` |
| `carePlans[].activities[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/chart/dto/chart-read.dto.ts:111` |
| `carePlans[].activities[].statusConceptId` | `string` | No | formato uuid | — | Identificador asociado a status concept. | `src/modules/chart/dto/chart-read.dto.ts:117` |
| `carePlans[].activities[].detailText` | `string` | No | — | — | Valor de detail text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:123` |
| `carePlans[].activities[].scheduledAt` | `string` | No | formato date-time | — | Valor de scheduled at mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:129` |
| `carePlans[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/chart/dto/chart-read.dto.ts:180` |
| `documents` | `array<ChartDocumentItemDto>` | Sí | — | — | Valor de documents mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:267` |
| `documents[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/chart/dto/chart-read.dto.ts:189` |
| `documents[].title` | `string` | No | — | — | Valor de title mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:195` |
| `documents[].categoryConceptId` | `string` | No | formato uuid | — | Identificador asociado a category concept. | `src/modules/chart/dto/chart-read.dto.ts:201` |
| `documents[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/chart/dto/chart-read.dto.ts:207` |
| `documents[].authorText` | `string` | No | — | — | Valor de author text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:213` |
| `documents[].isExternal` | `boolean` | No | — | — | Valor de is external mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:219` |
| `documents[].documentDate` | `string` | No | formato date | — | Valor de document date mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:225` |
| `documents[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/chart/dto/chart-read.dto.ts:231` |
| `limit` | `number` | Sí | — | — | Tope aplicado a cada bloque | `src/modules/chart/dto/chart-read.dto.ts:273` |
| `truncated` | `array<string>` | Sí | — | — | Qué bloques quedaron recortados por el tope. Vacío si el expediente cabe entero | `src/modules/chart/dto/chart-read.dto.ts:284` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:480` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. GET /charts/templates

- **Origen:** CONTRATO
- **Nombre:** Listar las plantillas de chart por especialidad
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartTemplatesController.listTemplates` — `src/modules/chart/controllers/chart-templates.controller.ts:83`

### Qué es y para qué sirve (negocio)

Listar las plantillas de chart por especialidad. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /charts/templates` la atiende `ChartTemplatesController.listTemplates` (src/modules/chart/controllers/chart-templates.controller.ts:83). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Delega en `ChartTemplatesService.listTemplates`. Lee chart.specialty_chart_templates, forms.dynamic_field_definitions, forms.field_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/chart/controllers/chart-templates.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.specialty_chart_templates` | LEE | LEE | DIRECTA | ChartTemplatesController.listTemplates → ChartTemplatesService.listTemplates → ChartTemplatesRepository.findTemplates | `src/modules/chart/repositories/chart-templates.repository.ts:187` |
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | ChartTemplatesController.listTemplates → ChartTemplatesService.listTemplates → ChartTemplatesService.resolveSchema → ChartTemplatesRepository.findFieldDefinitionsByIds | `src/modules/chart/repositories/chart-templates.repository.ts:282` |
| `forms.field_assignments` | LEE | LEE | DIRECTA | ChartTemplatesController.listTemplates → ChartTemplatesService.listTemplates → ChartTemplatesService.resolveSchema → ChartTemplatesRepository.findFieldAssignmentsBySection | `src/modules/chart/repositories/chart-templates.repository.ts:260` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `specialtyId` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ChartTemplateResponseDto[]>` · DTO `ChartTemplateResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la plantilla. | `src/modules/chart/dto/templates.dto.ts:333` |
| `specialtyConceptId` | `string` | Sí | formato uuid | — | Especialidad a la que pertenece la plantilla. | `src/modules/chart/dto/templates.dto.ts:339` |
| `tenantId` | `string` | No | formato uuid | — | Tenant dueño de la plantilla, si no es global. | `src/modules/chart/dto/templates.dto.ts:345` |
| `code` | `string` | Sí | — | — | Código único de la plantilla. | `src/modules/chart/dto/templates.dto.ts:351` |
| `name` | `string` | Sí | — | — | Nombre legible de la plantilla. | `src/modules/chart/dto/templates.dto.ts:357` |
| `version` | `number` | Sí | — | — | Versión de la plantilla. | `src/modules/chart/dto/templates.dto.ts:363` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la plantilla. | `src/modules/chart/dto/templates.dto.ts:369` |
| `sectionId` | `string` | No | formato uuid | — | Sección que aloja los campos de la plantilla. Se publica porque colgar un campo propio **dentro** de la plantilla exige nombrarla: una asignación en otra sección existe pero no la dibuja nadie. | `src/modules/chart/dto/templates.dto.ts:378` |
| `fieldTargetConceptId` | `string` | Sí | formato uuid | — | Target de las asignaciones de campo de las plantillas de chart. Es un concepto del catálogo, y su UUID se deriva de un código: publicarlo evita que cada cliente lo copie a mano y quede clavado el día que cambie. | `src/modules/chart/dto/templates.dto.ts:387` |
| `fields` | `array<ChartTemplateFieldDto>` | Sí | — | — | Los campos del esquema, en su orden de presentación. | `src/modules/chart/dto/templates.dto.ts:393` |
| `fields[].assignmentId` | `string` | Sí | formato uuid | — | Identificador de la asignación (`forms.field_assignments.id`). | `src/modules/chart/dto/templates.dto.ts:228` |
| `fields[].fieldId` | `string` | Sí | formato uuid | — | Identificador del campo (`forms.dynamic_field_definitions.id`). | `src/modules/chart/dto/templates.dto.ts:234` |
| `fields[].code` | `string` | Sí | — | — | Código del campo. | `src/modules/chart/dto/templates.dto.ts:240` |
| `fields[].name` | `string` | Sí | — | — | Nombre legible del campo. | `src/modules/chart/dto/templates.dto.ts:246` |
| `fields[].dataType` | `object` | Sí | — | — | Tipo de dato técnico del campo. | `src/modules/chart/dto/templates.dto.ts:252` |
| `fields[].valueSetId` | `string` | No | formato uuid | — | Value set de valores permitidos, si el campo es de selección. | `src/modules/chart/dto/templates.dto.ts:258` |
| `fields[].required` | `boolean` | Sí | — | — | Si el campo es obligatorio al completar la plantilla. | `src/modules/chart/dto/templates.dto.ts:264` |
| `fields[].ordinal` | `number` | No | — | — | Orden de presentación del campo dentro de la plantilla. | `src/modules/chart/dto/templates.dto.ts:270` |
| `fields[].own` | `boolean` | Sí | — | — | ¿Es un campo propio del tenant, o del formulario estándar? | `src/modules/chart/dto/templates.dto.ts:282` |
| `provenance` | `ChartTemplateProvenanceDto` | No | — | — | De dónde salió la plantilla, si vino del catálogo de formularios estándar. | `src/modules/chart/dto/templates.dto.ts:399` |
| `provenance.sourceTitle` | `string` | No | — | — | Título del documento tal como lo publica el organismo. | `src/modules/chart/dto/templates.dto.ts:300` |
| `provenance.organization` | `string` | No | — | — | Organismo que lo publica. | `src/modules/chart/dto/templates.dto.ts:304` |
| `provenance.url` | `string` | No | — | — | URL de la que se descargó. | `src/modules/chart/dto/templates.dto.ts:308` |
| `provenance.license` | `string` | No | — | — | Licencia bajo la que se puede usar. | `src/modules/chart/dto/templates.dto.ts:312` |
| `provenance.sourceVersion` | `string` | No | — | — | Versión o edición del documento de origen. | `src/modules/chart/dto/templates.dto.ts:316` |
| `provenance.retrievedAt` | `string` | No | — | — | Fecha de descarga, en ISO `YYYY-MM-DD`. | `src/modules/chart/dto/templates.dto.ts:320` |
| `provenance.note` | `string` | No | — | — | Qué se transcribió y qué quedó afuera, cuando no es obvio. | `src/modules/chart/dto/templates.dto.ts:324` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-templates.controller.spec.ts:44` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /charts/templates

- **Origen:** CONTRATO
- **Nombre:** Crear una plantilla de chart con su esquema de campos, por especialidad
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartTemplatesController.createTemplate` — `src/modules/chart/controllers/chart-templates.controller.ts:61`

### Qué es y para qué sirve (negocio)

Crear una plantilla de chart con su esquema de campos, por especialidad. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/templates` la atiende `ChartTemplatesController.createTemplate` (src/modules/chart/controllers/chart-templates.controller.ts:61). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateChartTemplateDto` (11 campos, 7 obligatorios). Delega en `ChartTemplatesService.createTemplate`. Crea filas en chart.specialty_chart_templates, forms.dynamic_field_definitions, forms.dynamic_field_sections, forms.field_assignments. Actualiza chart.specialty_chart_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/chart/controllers/chart-templates.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.specialty_chart_templates` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartTemplatesController.createTemplate → ChartTemplatesService.createTemplate | `src/modules/chart/services/chart-templates.service.ts:147` |
| `chart.specialty_chart_templates` | ESCRIBE | CREA | DIRECTA | ChartTemplatesController.createTemplate → ChartTemplatesService.createTemplate → ChartTemplatesRepository.createTemplate | `src/modules/chart/repositories/chart-templates.repository.ts:203` |
| `forms.dynamic_field_definitions` | ESCRIBE | CREA | DIRECTA | ChartTemplatesController.createTemplate → ChartTemplatesService.createTemplate → ChartTemplatesRepository.createTemplateField | `src/modules/chart/repositories/chart-templates.repository.ts:229` |
| `forms.dynamic_field_sections` | ESCRIBE | CREA | DIRECTA | ChartTemplatesController.createTemplate → ChartTemplatesService.createTemplate → ChartTemplatesRepository.createTemplateSection | `src/modules/chart/repositories/chart-templates.repository.ts:216` |
| `forms.field_assignments` | ESCRIBE | CREA | DIRECTA | ChartTemplatesController.createTemplate → ChartTemplatesService.createTemplate → ChartTemplatesRepository.createTemplateFieldAssignment | `src/modules/chart/repositories/chart-templates.repository.ts:242` |

### Cuerpo — DTO `CreateChartTemplateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `specialtyConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Especialidad de la plantilla (concept id) | `src/modules/chart/dto/templates.dto.ts:175` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant dueño de la plantilla | `src/modules/chart/dto/templates.dto.ts:186` |
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de la plantilla | `src/modules/chart/dto/templates.dto.ts:195` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible de la plantilla | `src/modules/chart/dto/templates.dto.ts:207` |
| `fields` | `array<TemplateFieldInputDto>` | Sí | — | `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => TemplateFieldInputDto)` | Campos del esquema, en el orden en que se presentan | `src/modules/chart/dto/templates.dto.ts:219` |
| `fields[].code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único del campo | `src/modules/chart/dto/templates.dto.ts:116` |
| `fields[].name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible del campo | `src/modules/chart/dto/templates.dto.ts:125` |
| `fields[].dataType` | `string` | Sí | valores: string, text, integer, decimal, boolean, date, datetime, time, uuid, json, binary, reference, code | `@IsIn(TECHNICAL_DATA_TYPES)` | Tipo de dato técnico | `src/modules/chart/dto/templates.dto.ts:135` |
| `fields[].valueSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Value set de valores permitidos (campos de selección) | `src/modules/chart/dto/templates.dto.ts:146` |
| `fields[].required` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/chart/dto/templates.dto.ts:154` |
| `fields[].ordinal` | `number` | No | — | `@IsOptional()` `@IsInt()` | Orden de presentación | `src/modules/chart/dto/templates.dto.ts:162` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "fields": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "dataType": "string"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "fields": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "dataType": "string",
      "valueSetId": "00000000-0000-4000-8000-000000000001",
      "required": false,
      "ordinal": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<ChartTemplateResponseDto>` · DTO `ChartTemplateResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la plantilla. | `src/modules/chart/dto/templates.dto.ts:333` |
| `specialtyConceptId` | `string` | Sí | formato uuid | — | Especialidad a la que pertenece la plantilla. | `src/modules/chart/dto/templates.dto.ts:339` |
| `tenantId` | `string` | No | formato uuid | — | Tenant dueño de la plantilla, si no es global. | `src/modules/chart/dto/templates.dto.ts:345` |
| `code` | `string` | Sí | — | — | Código único de la plantilla. | `src/modules/chart/dto/templates.dto.ts:351` |
| `name` | `string` | Sí | — | — | Nombre legible de la plantilla. | `src/modules/chart/dto/templates.dto.ts:357` |
| `version` | `number` | Sí | — | — | Versión de la plantilla. | `src/modules/chart/dto/templates.dto.ts:363` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la plantilla. | `src/modules/chart/dto/templates.dto.ts:369` |
| `sectionId` | `string` | No | formato uuid | — | Sección que aloja los campos de la plantilla. Se publica porque colgar un campo propio **dentro** de la plantilla exige nombrarla: una asignación en otra sección existe pero no la dibuja nadie. | `src/modules/chart/dto/templates.dto.ts:378` |
| `fieldTargetConceptId` | `string` | Sí | formato uuid | — | Target de las asignaciones de campo de las plantillas de chart. Es un concepto del catálogo, y su UUID se deriva de un código: publicarlo evita que cada cliente lo copie a mano y quede clavado el día que cambie. | `src/modules/chart/dto/templates.dto.ts:387` |
| `fields` | `array<ChartTemplateFieldDto>` | Sí | — | — | Los campos del esquema, en su orden de presentación. | `src/modules/chart/dto/templates.dto.ts:393` |
| `fields[].assignmentId` | `string` | Sí | formato uuid | — | Identificador de la asignación (`forms.field_assignments.id`). | `src/modules/chart/dto/templates.dto.ts:228` |
| `fields[].fieldId` | `string` | Sí | formato uuid | — | Identificador del campo (`forms.dynamic_field_definitions.id`). | `src/modules/chart/dto/templates.dto.ts:234` |
| `fields[].code` | `string` | Sí | — | — | Código del campo. | `src/modules/chart/dto/templates.dto.ts:240` |
| `fields[].name` | `string` | Sí | — | — | Nombre legible del campo. | `src/modules/chart/dto/templates.dto.ts:246` |
| `fields[].dataType` | `object` | Sí | — | — | Tipo de dato técnico del campo. | `src/modules/chart/dto/templates.dto.ts:252` |
| `fields[].valueSetId` | `string` | No | formato uuid | — | Value set de valores permitidos, si el campo es de selección. | `src/modules/chart/dto/templates.dto.ts:258` |
| `fields[].required` | `boolean` | Sí | — | — | Si el campo es obligatorio al completar la plantilla. | `src/modules/chart/dto/templates.dto.ts:264` |
| `fields[].ordinal` | `number` | No | — | — | Orden de presentación del campo dentro de la plantilla. | `src/modules/chart/dto/templates.dto.ts:270` |
| `fields[].own` | `boolean` | Sí | — | — | ¿Es un campo propio del tenant, o del formulario estándar? | `src/modules/chart/dto/templates.dto.ts:282` |
| `provenance` | `ChartTemplateProvenanceDto` | No | — | — | De dónde salió la plantilla, si vino del catálogo de formularios estándar. | `src/modules/chart/dto/templates.dto.ts:399` |
| `provenance.sourceTitle` | `string` | No | — | — | Título del documento tal como lo publica el organismo. | `src/modules/chart/dto/templates.dto.ts:300` |
| `provenance.organization` | `string` | No | — | — | Organismo que lo publica. | `src/modules/chart/dto/templates.dto.ts:304` |
| `provenance.url` | `string` | No | — | — | URL de la que se descargó. | `src/modules/chart/dto/templates.dto.ts:308` |
| `provenance.license` | `string` | No | — | — | Licencia bajo la que se puede usar. | `src/modules/chart/dto/templates.dto.ts:312` |
| `provenance.sourceVersion` | `string` | No | — | — | Versión o edición del documento de origen. | `src/modules/chart/dto/templates.dto.ts:316` |
| `provenance.retrievedAt` | `string` | No | — | — | Fecha de descarga, en ISO `YYYY-MM-DD`. | `src/modules/chart/dto/templates.dto.ts:320` |
| `provenance.note` | `string` | No | — | — | Qué se transcribió y qué quedó afuera, cuando no es obvio. | `src/modules/chart/dto/templates.dto.ts:324` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-templates.controller.spec.ts:37` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. GET /charts/templates/{id}

- **Origen:** CONTRATO
- **Nombre:** Leer el esquema de una plantilla de chart
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartTemplatesController.getTemplate` — `src/modules/chart/controllers/chart-templates.controller.ts:98`

### Qué es y para qué sirve (negocio)

Leer el esquema de una plantilla de chart. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /charts/templates/{id}` la atiende `ChartTemplatesController.getTemplate` (src/modules/chart/controllers/chart-templates.controller.ts:98). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Delega en `ChartTemplatesService.getTemplate`. Lee chart.specialty_chart_templates, forms.dynamic_field_definitions, forms.field_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/chart/controllers/chart-templates.controller.ts:98` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/chart/controllers/chart-templates.controller.ts:98` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.specialty_chart_templates` | LEE | LEE | DIRECTA | ChartTemplatesController.getTemplate → ChartTemplatesService.getTemplate → ChartTemplatesRepository.findTemplateById | `src/modules/chart/repositories/chart-templates.repository.ts:132` |
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | ChartTemplatesController.getTemplate → ChartTemplatesService.getTemplate → ChartTemplatesService.resolveSchema → ChartTemplatesRepository.findFieldDefinitionsByIds | `src/modules/chart/repositories/chart-templates.repository.ts:282` |
| `forms.field_assignments` | LEE | LEE | DIRECTA | ChartTemplatesController.getTemplate → ChartTemplatesService.getTemplate → ChartTemplatesService.resolveSchema → ChartTemplatesRepository.findFieldAssignmentsBySection | `src/modules/chart/repositories/chart-templates.repository.ts:260` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ChartTemplateResponseDto>` · DTO `ChartTemplateResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la plantilla. | `src/modules/chart/dto/templates.dto.ts:333` |
| `specialtyConceptId` | `string` | Sí | formato uuid | — | Especialidad a la que pertenece la plantilla. | `src/modules/chart/dto/templates.dto.ts:339` |
| `tenantId` | `string` | No | formato uuid | — | Tenant dueño de la plantilla, si no es global. | `src/modules/chart/dto/templates.dto.ts:345` |
| `code` | `string` | Sí | — | — | Código único de la plantilla. | `src/modules/chart/dto/templates.dto.ts:351` |
| `name` | `string` | Sí | — | — | Nombre legible de la plantilla. | `src/modules/chart/dto/templates.dto.ts:357` |
| `version` | `number` | Sí | — | — | Versión de la plantilla. | `src/modules/chart/dto/templates.dto.ts:363` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la plantilla. | `src/modules/chart/dto/templates.dto.ts:369` |
| `sectionId` | `string` | No | formato uuid | — | Sección que aloja los campos de la plantilla. Se publica porque colgar un campo propio **dentro** de la plantilla exige nombrarla: una asignación en otra sección existe pero no la dibuja nadie. | `src/modules/chart/dto/templates.dto.ts:378` |
| `fieldTargetConceptId` | `string` | Sí | formato uuid | — | Target de las asignaciones de campo de las plantillas de chart. Es un concepto del catálogo, y su UUID se deriva de un código: publicarlo evita que cada cliente lo copie a mano y quede clavado el día que cambie. | `src/modules/chart/dto/templates.dto.ts:387` |
| `fields` | `array<ChartTemplateFieldDto>` | Sí | — | — | Los campos del esquema, en su orden de presentación. | `src/modules/chart/dto/templates.dto.ts:393` |
| `fields[].assignmentId` | `string` | Sí | formato uuid | — | Identificador de la asignación (`forms.field_assignments.id`). | `src/modules/chart/dto/templates.dto.ts:228` |
| `fields[].fieldId` | `string` | Sí | formato uuid | — | Identificador del campo (`forms.dynamic_field_definitions.id`). | `src/modules/chart/dto/templates.dto.ts:234` |
| `fields[].code` | `string` | Sí | — | — | Código del campo. | `src/modules/chart/dto/templates.dto.ts:240` |
| `fields[].name` | `string` | Sí | — | — | Nombre legible del campo. | `src/modules/chart/dto/templates.dto.ts:246` |
| `fields[].dataType` | `object` | Sí | — | — | Tipo de dato técnico del campo. | `src/modules/chart/dto/templates.dto.ts:252` |
| `fields[].valueSetId` | `string` | No | formato uuid | — | Value set de valores permitidos, si el campo es de selección. | `src/modules/chart/dto/templates.dto.ts:258` |
| `fields[].required` | `boolean` | Sí | — | — | Si el campo es obligatorio al completar la plantilla. | `src/modules/chart/dto/templates.dto.ts:264` |
| `fields[].ordinal` | `number` | No | — | — | Orden de presentación del campo dentro de la plantilla. | `src/modules/chart/dto/templates.dto.ts:270` |
| `fields[].own` | `boolean` | Sí | — | — | ¿Es un campo propio del tenant, o del formulario estándar? | `src/modules/chart/dto/templates.dto.ts:282` |
| `provenance` | `ChartTemplateProvenanceDto` | No | — | — | De dónde salió la plantilla, si vino del catálogo de formularios estándar. | `src/modules/chart/dto/templates.dto.ts:399` |
| `provenance.sourceTitle` | `string` | No | — | — | Título del documento tal como lo publica el organismo. | `src/modules/chart/dto/templates.dto.ts:300` |
| `provenance.organization` | `string` | No | — | — | Organismo que lo publica. | `src/modules/chart/dto/templates.dto.ts:304` |
| `provenance.url` | `string` | No | — | — | URL de la que se descargó. | `src/modules/chart/dto/templates.dto.ts:308` |
| `provenance.license` | `string` | No | — | — | Licencia bajo la que se puede usar. | `src/modules/chart/dto/templates.dto.ts:312` |
| `provenance.sourceVersion` | `string` | No | — | — | Versión o edición del documento de origen. | `src/modules/chart/dto/templates.dto.ts:316` |
| `provenance.retrievedAt` | `string` | No | — | — | Fecha de descarga, en ISO `YYYY-MM-DD`. | `src/modules/chart/dto/templates.dto.ts:320` |
| `provenance.note` | `string` | No | — | — | Qué se transcribió y qué quedó afuera, cuando no es obvio. | `src/modules/chart/dto/templates.dto.ts:324` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-templates.controller.spec.ts:56` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /charts/templates/{templateId}/assignments

- **Origen:** CONTRATO
- **Nombre:** Asignar una plantilla de chart por especialidad
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartTemplatesController.assignTemplate` — `src/modules/chart/controllers/chart-templates.controller.ts:48`

### Qué es y para qué sirve (negocio)

Asignar una plantilla de chart por especialidad. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/templates/{templateId}/assignments` la atiende `ChartTemplatesController.assignTemplate` (src/modules/chart/controllers/chart-templates.controller.ts:48). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AssignTemplateDto` (3 campos, 0 obligatorios). Delega en `ChartTemplatesService.assignTemplate`. Crea filas en chart.chart_template_assignments. Actualiza chart.chart_template_assignments. Lee chart.chart_template_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/chart/controllers/chart-templates.controller.ts:48` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: templateId | `src/modules/chart/controllers/chart-templates.controller.ts:48` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.chart_template_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartTemplatesController.assignTemplate → ChartTemplatesService.assignTemplate | `src/modules/chart/services/chart-templates.service.ts:84` |
| `chart.chart_template_assignments` | ESCRIBE | CREA | DIRECTA | ChartTemplatesController.assignTemplate → ChartTemplatesService.assignTemplate → ChartTemplatesRepository.createAssignment | `src/modules/chart/repositories/chart-templates.repository.ts:160` |
| `chart.chart_template_assignments` | LEE | LEE | DIRECTA | ChartTemplatesController.assignTemplate → ChartTemplatesService.assignTemplate → ChartTemplatesRepository.findActiveDefaults | `src/modules/chart/repositories/chart-templates.repository.ts:141` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `templateId` | path | Sí | `string` | — |

### Cuerpo — DTO `AssignTemplateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Práctica destino (practice.practices) | `src/modules/chart/dto/templates.dto.ts:46` |
| `practitionerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil del profesional destino | `src/modules/chart/dto/templates.dto.ts:57` |
| `isDefault` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca esta asignación como default del scope | `src/modules/chart/dto/templates.dto.ts:68` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "isDefault": false
}
```

</details>

### Respuesta — `Promise<AssignmentResponseDto>` · DTO `AssignmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/chart/dto/templates.dto.ts:77` |
| `status` | `string` | Sí | formato uuid | — | Concept id de estado | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-templates.controller.spec.ts:20` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

