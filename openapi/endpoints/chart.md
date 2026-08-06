<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `chart`

Referencia exhaustiva de 13 operación(es) del módulo `chart`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `chart-care-plans`, `chart-documents`, `chart-notes`, `chart-read`, `chart-templates`
- **Controladores:** `ChartCarePlansController`, `ChartDocumentsController`, `ChartNotesController`, `ChartReadController`, `ChartTemplatesController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /charts/care-plans](#1-post-charts-care-plans) — Crear un plan de cuidado con actividades
2. [PATCH /charts/care-plans/{planId}/activities/{activityId}](#2-patch-charts-care-plans-planid-activities-activityid) — Actualizar una actividad del plan de cuidado
3. [POST /charts/documents](#3-post-charts-documents) — Adjuntar un documento con archivos gobernados
4. [POST /charts/notes](#4-post-charts-notes) — Crear una nota clínica versionada (borrador SOAP)
5. [POST /charts/notes/{noteId}/amendments](#5-post-charts-notes-noteid-amendments) — Enmendar una nota firmada (addendum versionado)
6. [PUT /charts/notes/{noteId}/versions](#6-put-charts-notes-noteid-versions) — Editar borrador creando una nueva versión inmutable
7. [POST /charts/notes/{noteId}/versions/{versionId}/cosign](#7-post-charts-notes-noteid-versions-versionid-cosign) — Cofirmar una versión firmada (cadena de firmas)
8. [POST /charts/notes/{noteId}/versions/{versionId}/sign](#8-post-charts-notes-noteid-versions-versionid-sign) — Firmar una versión y sellar su contenido
9. [POST /charts/notes/versions/{versionId}/exam-findings](#9-post-charts-notes-versions-versionid-exam-findings) — Registrar hallazgos de examen físico
10. [POST /charts/notes/versions/{versionId}/release](#10-post-charts-notes-versions-versionid-release) — Liberar una versión al paciente
11. [POST /charts/notes/versions/{versionId}/withhold](#11-post-charts-notes-versions-versionid-withhold) — Retener una versión del paciente (motivo legal)
12. [GET /charts/patients/{patientProfileId}/chart](#12-get-charts-patients-patientprofileid-chart) — UC-40-14: expediente del paciente (notas, planes de cuidados y documentos)
13. [POST /charts/templates/{templateId}/assignments](#13-post-charts-templates-templateid-assignments) — Asignar una plantilla de chart por especialidad

---

## 1. POST /charts/care-plans

- **Módulo:** `chart`
- **Etiqueta OpenAPI:** `chart-care-plans`
- **Nombre:** Crear un plan de cuidado con actividades
- **Operation ID:** `ChartCarePlansController_createCarePlan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ChartCarePlansController.createCarePlan](../../src/modules/chart/controllers/chart-care-plans.controller.ts)

### Descripción de negocio

Crear un plan de cuidado con actividades. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /charts/care-plans` en `ChartCarePlansController_createCarePlan`. El controlador delega en `ChartCarePlansService.createCarePlan`. Valida el body como `CreateCarePlanDto` y consume `application/json`. El tipo de retorno estático es `Promise<CarePlanResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCarePlanDto`; los campos opcionales se omiten.

```http
POST /charts/care-plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Perfil de paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `conditionId` | No | `string` | formato `uuid` | Condición clínica asociada | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro clínico asociado | `00000000-0000-4000-8000-000000000001` |
| `intentConceptId` | No | `string` | formato `uuid` | Concept id de la intención del plan | `00000000-0000-4000-8000-000000000001` |
| `authorProfileId` | No | `string` | formato `uuid` | Perfil del clínico autor | `00000000-0000-4000-8000-000000000001` |
| `goalText` | No | `string` | longitud máxima 2000 | Meta clínica del plan | `valor-ejemplo` |
| `startDate` | No | `string` | formato `date` | Fecha de inicio (YYYY-MM-DD) | `2026-07-31` |
| `endDate` | No | `string` | formato `date` | Fecha de fin (YYYY-MM-DD) | `2026-07-31` |
| `activities` | No | `array<CarePlanActivityInputDto>` | Sin restricción adicional declarada | Actividades iniciales (0..n) | `[{"activityConceptId":"00000000-0000-4000-8000-000000000001","scheduledAt":"2026-07-31T12:00:00.000Z","detailText":"valor-ejemplo"}]` |
| `activities[].activityConceptId` | No | `string` | formato `uuid` | Concept id del tipo de actividad | `00000000-0000-4000-8000-000000000001` |
| `activities[].scheduledAt` | No | `string` | formato `date-time` | Momento programado | `2026-07-31T12:00:00.000Z` |
| `activities[].detailText` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /charts/care-plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CarePlanResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CarePlanResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CarePlanResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CarePlanResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CarePlanResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CarePlanResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CarePlanResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CarePlanResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CarePlanResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CarePlanResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "activityCount": 1,
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado del plan | `00000000-0000-4000-8000-000000000001` |
| `activityCount` | Sí | `number` | Sin restricción adicional declarada | Nº de actividades creadas | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
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
  "path": "/charts/care-plans"
}
```

---

## 2. PATCH /charts/care-plans/{planId}/activities/{activityId}

- **Módulo:** `chart`
- **Etiqueta OpenAPI:** `chart-care-plans`
- **Nombre:** Actualizar una actividad del plan de cuidado
- **Operation ID:** `ChartCarePlansController_updateActivity`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ChartCarePlansController.updateActivity](../../src/modules/chart/controllers/chart-care-plans.controller.ts)

### Descripción de negocio

Actualizar una actividad del plan de cuidado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /charts/care-plans/{planId}/activities/{activityId}` en `ChartCarePlansController_updateActivity`. El controlador delega en `ChartCarePlansService.updateActivity`. Valida el body como `UpdateActivityDto` y consume `application/json`. El tipo de retorno estático es `Promise<ActivityResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `planId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `activityId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateActivityDto`; los campos opcionales se omiten.

```http
PATCH /charts/care-plans/00000000-0000-4000-8000-000000000001/activities/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `planId`, `activityId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | No | `string` | valores: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` | Nuevo estado de la actividad | `SCHEDULED` |
| `scheduledAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `detailText` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /charts/care-plans/00000000-0000-4000-8000-000000000001/activities/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "SCHEDULED",
  "scheduledAt": "2026-07-31T12:00:00.000Z",
  "detailText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ActivityResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ActivityResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ActivityResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ActivityResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ActivityResponseDto>` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Plan de cuidado no encontrado | Excepción explícita en src/modules/chart/services/chart-care-plans.service.ts |
| 404 | `NOT_FOUND` | Actividad no encontrada | Excepción explícita en src/modules/chart/services/chart-care-plans.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El plan de cuidado no está activo | Excepción explícita en src/modules/chart/services/chart-care-plans.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/charts/care-plans/{planId}/activities/{activityId}"
}
```

---

## 3. POST /charts/documents

- **Módulo:** `chart`
- **Etiqueta OpenAPI:** `chart-documents`
- **Nombre:** Adjuntar un documento con archivos gobernados
- **Operation ID:** `ChartDocumentsController_createDocument`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ChartDocumentsController.createDocument](../../src/modules/chart/controllers/chart-documents.controller.ts)

### Descripción de negocio

Adjuntar un documento con archivos gobernados. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /charts/documents` en `ChartDocumentsController_createDocument`. El controlador delega en `ChartDocumentsService.createDocument`. Valida el body como `CreateDocumentDto` y consume `application/json`. El tipo de retorno estático es `Promise<DocumentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDocumentDto`; los campos opcionales se omiten.

```http
POST /charts/documents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "title": "valor-ejemplo"
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Perfil de paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Tenant propietario (directory.tenants) | `00000000-0000-4000-8000-000000000001` |
| `title` | Sí | `string` | longitud mínima 1; longitud máxima 500 | Título del documento | `valor-ejemplo` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro clínico asociado | `00000000-0000-4000-8000-000000000001` |
| `categoryConceptId` | No | `string` | formato `uuid` | Concept id de la categoría documental | `00000000-0000-4000-8000-000000000001` |
| `sourceConceptId` | No | `string` | formato `uuid` | Concept id de la fuente del documento | `00000000-0000-4000-8000-000000000001` |
| `confidentialityConceptId` | No | `string` | formato `uuid` | Concept id de confidencialidad | `00000000-0000-4000-8000-000000000001` |
| `patientVisibilityConceptId` | No | `string` | formato `uuid` | Concept id de visibilidad para el paciente | `00000000-0000-4000-8000-000000000001` |
| `authorText` | No | `string` | longitud máxima 255 | Autor libre (documentos externos) | `valor-ejemplo` |
| `isExternal` | No | `boolean` | Sin restricción adicional declarada | true si el documento proviene de una fuente externa | `true` |
| `files` | No | `array<DocumentFileInputDto>` | Sin restricción adicional declarada | Archivos gobernados (0..n) | `[{"fileId":"00000000-0000-4000-8000-000000000001","contentRole":"PRIMARY","ordinal":1}]` |
| `files[].fileId` | No | `string` | formato `uuid` | Archivo ya subido a object_storage (common.files) | `00000000-0000-4000-8000-000000000001` |
| `files[].contentRole` | No | `string` | valores: `PRIMARY`, `ATTACHMENT` | Rol de contenido | `PRIMARY` |
| `files[].ordinal` | No | `number` | mínimo 0 | Orden del archivo dentro del documento | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /charts/documents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DocumentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DocumentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "documentType": "valor-ejemplo",
  "payload": {
    "clave": "valor"
  },
  "version": 1,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "deletedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador del documento (ObjectId hex) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `documentType` | Sí | `string` | Sin restricción adicional declarada | Valor de document type mantenido por la instancia. | `valor-ejemplo` |
| `payload` | Sí | `object` | Sin restricción adicional declarada | Valor de payload mantenido por la instancia. | `{"clave":"valor"}` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Versión vigente (concurrencia optimista) | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |
| `deletedAt` | No | `string` | formato `date-time`; admite null | Marca de borrado lógico; null si el documento está vivo | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
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
  "path": "/charts/documents"
}
```

---

## 4. POST /charts/notes

- **Módulo:** `chart`
- **Etiqueta OpenAPI:** `chart-notes`
- **Nombre:** Crear una nota clínica versionada (borrador SOAP)
- **Operation ID:** `ChartNotesController_createNote`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ChartNotesController.createNote](../../src/modules/chart/controllers/chart-notes.controller.ts)

### Descripción de negocio

Crear una nota clínica versionada (borrador SOAP). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /charts/notes` en `ChartNotesController_createNote`. El controlador delega en `ChartNotesService.createNote`. Valida el body como `CreateNoteDto` y consume `application/json`. El tipo de retorno estático es `Promise<NoteVersionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateNoteDto`; los campos opcionales se omiten.

```http
POST /charts/notes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "authorProfileId": "00000000-0000-4000-8000-000000000001"
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Perfil de paciente (profiles.patient_profiles) | `00000000-0000-4000-8000-000000000001` |
| `authorProfileId` | Sí | `string` | formato `uuid` | Perfil del clínico autor | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro clínico asociado | `00000000-0000-4000-8000-000000000001` |
| `noteTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de nota | `00000000-0000-4000-8000-000000000001` |
| `confidentialityConceptId` | No | `string` | formato `uuid` | Concept id de confidencialidad | `00000000-0000-4000-8000-000000000001` |
| `chiefComplaintText` | No | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `subjectiveText` | No | `string` | Sin restricción adicional declarada | Bloque S (subjetivo) del SOAP | `valor-ejemplo` |
| `objectiveText` | No | `string` | Sin restricción adicional declarada | Bloque O (objetivo) del SOAP | `valor-ejemplo` |
| `assessmentText` | No | `string` | Sin restricción adicional declarada | Bloque A (evaluación) del SOAP | `valor-ejemplo` |
| `planText` | No | `string` | Sin restricción adicional declarada | Bloque P (plan) del SOAP | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /charts/notes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `NoteVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "noteId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "lifecycleStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "versionStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `noteId` | Sí | `string` | formato `uuid` | Identificador asociado a note. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Identificador asociado a version. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `lifecycleStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del ciclo de vida de la cabecera | `00000000-0000-4000-8000-000000000001` |
| `versionStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado de la versión | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
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
  "path": "/charts/notes"
}
```

---

## 5. POST /charts/notes/{noteId}/amendments

- **Módulo:** `chart`
- **Etiqueta OpenAPI:** `chart-notes`
- **Nombre:** Enmendar una nota firmada (addendum versionado)
- **Operation ID:** `ChartNotesController_amendNote`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ChartNotesController.amendNote](../../src/modules/chart/controllers/chart-notes.controller.ts)

### Descripción de negocio

Enmendar una nota firmada (addendum versionado). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /charts/notes/{noteId}/amendments` en `ChartNotesController_amendNote`. El controlador delega en `ChartNotesService.amendNote`. Valida el body como `AmendNoteDto` y consume `application/json`. El tipo de retorno estático es `Promise<NoteVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `noteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AmendNoteDto`; los campos opcionales se omiten.

```http
POST /charts/notes/00000000-0000-4000-8000-000000000001/amendments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "amendmentReasonText": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `noteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `authorProfileId` | Sí | `string` | formato `uuid` | Perfil del clínico que enmienda | `00000000-0000-4000-8000-000000000001` |
| `amendmentReasonText` | Sí | `string` | longitud mínima 1; longitud máxima 2000 | Motivo textual de la enmienda (obligatorio) | `Texto descriptivo de ejemplo` |
| `amendmentReasonConceptId` | No | `string` | formato `uuid` | Concept id del motivo de enmienda | `00000000-0000-4000-8000-000000000001` |
| `subjectiveText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `objectiveText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `assessmentText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `planText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /charts/notes/00000000-0000-4000-8000-000000000001/amendments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `NoteVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "noteId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "lifecycleStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "versionStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `noteId` | Sí | `string` | formato `uuid` | Identificador asociado a note. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Identificador asociado a version. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `lifecycleStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del ciclo de vida de la cabecera | `00000000-0000-4000-8000-000000000001` |
| `versionStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado de la versión | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Nota clínica no encontrada | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La nota no está firmada; edítela como borrador (UC-15-02) | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/charts/notes/{noteId}/amendments"
}
```

---

## 6. PUT /charts/notes/{noteId}/versions

- **Módulo:** `chart`
- **Etiqueta OpenAPI:** `chart-notes`
- **Nombre:** Editar borrador creando una nueva versión inmutable
- **Operation ID:** `ChartNotesController_addVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ChartNotesController.addVersion](../../src/modules/chart/controllers/chart-notes.controller.ts)

### Descripción de negocio

Editar borrador creando una nueva versión inmutable. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /charts/notes/{noteId}/versions` en `ChartNotesController_addVersion`. El controlador delega en `ChartNotesService.addVersion`. Valida el body como `AddVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<NoteVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `noteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddVersionDto`; los campos opcionales se omiten.

```http
PUT /charts/notes/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "authorProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `noteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `authorProfileId` | Sí | `string` | formato `uuid` | Perfil del clínico autor | `00000000-0000-4000-8000-000000000001` |
| `chiefComplaintText` | No | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `subjectiveText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `objectiveText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `assessmentText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `planText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /charts/notes/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "chiefComplaintText": "valor-ejemplo",
  "subjectiveText": "valor-ejemplo",
  "objectiveText": "valor-ejemplo",
  "assessmentText": "valor-ejemplo",
  "planText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `NoteVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "noteId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "lifecycleStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "versionStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `noteId` | Sí | `string` | formato `uuid` | Identificador asociado a note. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Identificador asociado a version. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `lifecycleStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del ciclo de vida de la cabecera | `00000000-0000-4000-8000-000000000001` |
| `versionStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado de la versión | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Nota clínica no encontrada | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La nota ya no está en borrador; use una enmienda (UC-15-05) | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/charts/notes/{noteId}/versions"
}
```

---

## 7. POST /charts/notes/{noteId}/versions/{versionId}/cosign

- **Módulo:** `chart`
- **Etiqueta OpenAPI:** `chart-notes`
- **Nombre:** Cofirmar una versión firmada (cadena de firmas)
- **Operation ID:** `ChartNotesController_cosignVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ChartNotesController.cosignVersion](../../src/modules/chart/controllers/chart-notes.controller.ts)

### Descripción de negocio

Cofirmar una versión firmada (cadena de firmas). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /charts/notes/{noteId}/versions/{versionId}/cosign` en `ChartNotesController_cosignVersion`. El controlador delega en `ChartNotesService.cosignVersion`. Valida el body como `CosignVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<NoteVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `noteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CosignVersionDto`; los campos opcionales se omiten.

```http
POST /charts/notes/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000001/cosign HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "signerProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `noteId`, `versionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `signerProfileId` | Sí | `string` | formato `uuid` | Perfil del cofirmante / supervisor | `00000000-0000-4000-8000-000000000001` |
| `certificateThumbprint` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `signatureValueEncrypted` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /charts/notes/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000001/cosign HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "certificateThumbprint": "valor-ejemplo",
  "signatureValueEncrypted": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `NoteVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "noteId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "lifecycleStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "versionStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `noteId` | Sí | `string` | formato `uuid` | Identificador asociado a note. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Identificador asociado a version. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `lifecycleStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del ciclo de vida de la cabecera | `00000000-0000-4000-8000-000000000001` |
| `versionStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado de la versión | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión de nota no encontrada | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 404 | `NOT_FOUND` | Nota clínica no encontrada | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 409 | `CONFLICT` | El cofirmante ya firmó esta versión | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La versión no está firmada (SIGNED) | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 422 | `PRECONDITION_FAILED` | Falta la firma primaria del autor | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/charts/notes/{noteId}/versions/{versionId}/cosign"
}
```

---

## 8. POST /charts/notes/{noteId}/versions/{versionId}/sign

- **Módulo:** `chart`
- **Etiqueta OpenAPI:** `chart-notes`
- **Nombre:** Firmar una versión y sellar su contenido
- **Operation ID:** `ChartNotesController_signVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ChartNotesController.signVersion](../../src/modules/chart/controllers/chart-notes.controller.ts)

### Descripción de negocio

Firmar una versión y sellar su contenido. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /charts/notes/{noteId}/versions/{versionId}/sign` en `ChartNotesController_signVersion`. El controlador delega en `ChartNotesService.signVersion`. Valida el body como `SignVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<NoteVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `noteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SignVersionDto`; los campos opcionales se omiten.

```http
POST /charts/notes/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000001/sign HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "signerProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `noteId`, `versionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `signerProfileId` | Sí | `string` | formato `uuid` | Perfil del firmante (autor o delegado) | `00000000-0000-4000-8000-000000000001` |
| `certificateThumbprint` | No | `string` | longitud máxima 255 | Huella del certificado usado en la firma | `valor-ejemplo` |
| `signatureValueEncrypted` | No | `string` | Sin restricción adicional declarada | Valor de firma cifrado (opaco al backend) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /charts/notes/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000001/sign HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "certificateThumbprint": "valor-ejemplo",
  "signatureValueEncrypted": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<NoteVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `NoteVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "noteId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "lifecycleStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "versionStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `noteId` | Sí | `string` | formato `uuid` | Identificador asociado a note. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Identificador asociado a version. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `lifecycleStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del ciclo de vida de la cabecera | `00000000-0000-4000-8000-000000000001` |
| `versionStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado de la versión | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión de nota no encontrada | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 404 | `NOT_FOUND` | Nota clínica no encontrada | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La versión no está en borrador | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/charts/notes/{noteId}/versions/{versionId}/sign"
}
```

---

## 9. POST /charts/notes/versions/{versionId}/exam-findings

- **Módulo:** `chart`
- **Etiqueta OpenAPI:** `chart-notes`
- **Nombre:** Registrar hallazgos de examen físico
- **Operation ID:** `ChartNotesController_recordExamFindings`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ChartNotesController.recordExamFindings](../../src/modules/chart/controllers/chart-notes.controller.ts)

### Descripción de negocio

Registrar hallazgos de examen físico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /charts/notes/versions/{versionId}/exam-findings` en `ChartNotesController_recordExamFindings`. El controlador delega en `ChartNotesService.recordExamFindings`. Valida el body como `ExamFindingsDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExamFindingsResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExamFindingsDto`; los campos opcionales se omiten.

```http
POST /charts/notes/versions/00000000-0000-4000-8000-000000000001/exam-findings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "findings": [
    {}
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `versionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `findings` | Sí | `array<ExamFindingInputDto>` | mínimo 1 elemento(s) | Batch de hallazgos | `[{"bodySystemConceptId":"00000000-0000-4000-8000-000000000001","findingConceptId":"00000000-0000-4000-8000-000000000001","isNormal":true,"findingText":"valor-ejemplo"}]` |
| `findings[].bodySystemConceptId` | No | `string` | formato `uuid` | Concept id del sistema corporal | `00000000-0000-4000-8000-000000000001` |
| `findings[].findingConceptId` | No | `string` | formato `uuid` | Concept id del hallazgo codificado | `00000000-0000-4000-8000-000000000001` |
| `findings[].isNormal` | No | `boolean` | Sin restricción adicional declarada | true si el hallazgo es normal | `true` |
| `findings[].findingText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `objectiveText` | No | `string` | Sin restricción adicional declarada | Texto objetivo sintetizado (solo si la versión sigue en DRAFT) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /charts/notes/versions/00000000-0000-4000-8000-000000000001/exam-findings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ExamFindingsResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExamFindingsResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExamFindingsResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExamFindingsResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExamFindingsResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExamFindingsResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExamFindingsResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExamFindingsResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExamFindingsResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExamFindingsResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExamFindingsResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "versionId": "00000000-0000-4000-8000-000000000001",
  "recordedFindings": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `versionId` | Sí | `string` | formato `uuid` | Identificador asociado a version. | `00000000-0000-4000-8000-000000000001` |
| `recordedFindings` | Sí | `number` | Sin restricción adicional declarada | Nº de hallazgos registrados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión de nota no encontrada | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La versión ya está firmada; los hallazgos quedan sellados | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/charts/notes/versions/{versionId}/exam-findings"
}
```

---

## 10. POST /charts/notes/versions/{versionId}/release

- **Módulo:** `chart`
- **Etiqueta OpenAPI:** `chart-notes`
- **Nombre:** Liberar una versión al paciente
- **Operation ID:** `ChartNotesController_releaseVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ChartNotesController.releaseVersion](../../src/modules/chart/controllers/chart-notes.controller.ts)

### Descripción de negocio

Liberar una versión al paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /charts/notes/versions/{versionId}/release` en `ChartNotesController_releaseVersion`. El controlador delega en `ChartNotesService.releaseVersion`. Valida el body como `ReleaseVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReleaseResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReleaseVersionDto`; los campos opcionales se omiten.

```http
POST /charts/notes/versions/00000000-0000-4000-8000-000000000001/release HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `versionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `policyVersion` | No | `string` | longitud máxima 100 | Versión de la política de liberación aplicada | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /charts/notes/versions/00000000-0000-4000-8000-000000000001/release HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "policyVersion": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReleaseResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReleaseResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "versionId": "00000000-0000-4000-8000-000000000001",
  "releaseEventId": "00000000-0000-4000-8000-000000000001",
  "patientReleaseStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `versionId` | Sí | `string` | formato `uuid` | Identificador asociado a version. | `00000000-0000-4000-8000-000000000001` |
| `releaseEventId` | Sí | `string` | formato `uuid` | Identificador asociado a release event. | `00000000-0000-4000-8000-000000000001` |
| `patientReleaseStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado de liberación de la cabecera | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión de nota no encontrada | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 404 | `NOT_FOUND` | Nota clínica no encontrada | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La versión no está firmada | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión no es elegible para liberación | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/charts/notes/versions/{versionId}/release"
}
```

---

## 11. POST /charts/notes/versions/{versionId}/withhold

- **Módulo:** `chart`
- **Etiqueta OpenAPI:** `chart-notes`
- **Nombre:** Retener una versión del paciente (motivo legal)
- **Operation ID:** `ChartNotesController_withholdVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ChartNotesController.withholdVersion](../../src/modules/chart/controllers/chart-notes.controller.ts)

### Descripción de negocio

Retener una versión del paciente (motivo legal). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /charts/notes/versions/{versionId}/withhold` en `ChartNotesController_withholdVersion`. El controlador delega en `ChartNotesService.withholdVersion`. Valida el body como `WithholdVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReleaseResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `WithholdVersionDto`; los campos opcionales se omiten.

```http
POST /charts/notes/versions/00000000-0000-4000-8000-000000000001/withhold HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `versionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reasonConceptId` | No | `string` | formato `uuid` | Concept id del motivo de retención | `00000000-0000-4000-8000-000000000001` |
| `policyVersion` | No | `string` | longitud máxima 100 | Versión de la política de retención aplicada | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /charts/notes/versions/00000000-0000-4000-8000-000000000001/withhold HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reasonConceptId": "00000000-0000-4000-8000-000000000001",
  "policyVersion": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReleaseResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReleaseResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReleaseResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "versionId": "00000000-0000-4000-8000-000000000001",
  "releaseEventId": "00000000-0000-4000-8000-000000000001",
  "patientReleaseStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `versionId` | Sí | `string` | formato `uuid` | Identificador asociado a version. | `00000000-0000-4000-8000-000000000001` |
| `releaseEventId` | Sí | `string` | formato `uuid` | Identificador asociado a release event. | `00000000-0000-4000-8000-000000000001` |
| `patientReleaseStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado de liberación de la cabecera | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión de nota no encontrada | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
| 404 | `NOT_FOUND` | Nota clínica no encontrada | Excepción explícita en src/modules/chart/services/chart-notes.service.ts |
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
  "path": "/charts/notes/versions/{versionId}/withhold"
}
```

---

## 12. GET /charts/patients/{patientProfileId}/chart

- **Módulo:** `chart`
- **Etiqueta OpenAPI:** `chart-read`
- **Nombre:** UC-40-14: expediente del paciente (notas, planes de cuidados y documentos)
- **Operation ID:** `ChartReadController_getPatientChart`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ChartReadController.getPatientChart](../../src/modules/chart/controllers/chart-read.controller.ts)

### Descripción de negocio

UC-40-14: expediente del paciente (notas, planes de cuidados y documentos). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-40-14: expediente del paciente en una sola llamada.

### Descripción del sistema

NestJS resuelve `GET /charts/patients/{patientProfileId}/chart` en `ChartReadController_getPatientChart`. El controlador delega en `ChartReadService.getPatientChart`. No recibe body. El tipo de retorno estático es `Promise<PatientChartResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope aplicado a cada bloque (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /charts/patients/00000000-0000-4000-8000-000000000001/chart HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `patientProfileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /charts/patients/00000000-0000-4000-8000-000000000001/chart?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PatientChartResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PatientChartResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PatientChartResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PatientChartResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PatientChartResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PatientChartResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PatientChartResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientChartResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "notes": [
    {
      "noteId": "00000000-0000-4000-8000-000000000001",
      "encounterId": "00000000-0000-4000-8000-000000000001",
      "noteTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "lifecycleStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "currentVersionId": "00000000-0000-4000-8000-000000000001",
      "versionNumber": 1,
      "authorProfileId": "00000000-0000-4000-8000-000000000001",
      "chiefComplaintText": "valor-ejemplo",
      "subjectiveText": "valor-ejemplo",
      "objectiveText": "valor-ejemplo",
      "assessmentText": "valor-ejemplo",
      "planText": "valor-ejemplo",
      "signedAt": "2026-07-31T12:00:00.000Z",
      "releasedToPatient": true,
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "carePlans": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "intentConceptId": "00000000-0000-4000-8000-000000000001",
      "goalText": "valor-ejemplo",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31",
      "activities": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "statusConceptId": "00000000-0000-4000-8000-000000000001",
          "detailText": "valor-ejemplo",
          "scheduledAt": "2026-07-31T12:00:00.000Z"
        }
      ],
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "documents": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "title": "valor-ejemplo",
      "categoryConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "authorText": "valor-ejemplo",
      "isExternal": true,
      "documentDate": "2026-07-31",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "limit": 1,
  "truncated": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `notes` | Sí | `array<ChartNoteItemDto>` | Sin restricción adicional declarada | Valor de notes mantenido por la instancia. | `[{"noteId":"00000000-0000-4000-8000-000000000001","encounterId":"00000000-0000-4000-8000-000000000001","noteTypeConceptId":"00000000-0000-4000-8000-000000000001","lifecycleStatusConceptId":"00000000-0000-4000-8000-000000000001","currentVersionId":"00000000-0000-4000-8000-000000000001","versionNumber":1,"authorProfileId":"00000000-0000-4000-8000-000000000001","chiefComplaintText":"valor-ejemplo","subjectiveText":"valor-ejemplo","objectiveText":"valor-ejemplo","assessmentText":"valor-ejemplo","planText":"valor-ejemplo","signedAt":"2026-07-31T12:00:00.000Z","releasedToPatient":true,"createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `notes[].noteId` | Sí | `string` | formato `uuid` | Identificador asociado a note. | `00000000-0000-4000-8000-000000000001` |
| `notes[].encounterId` | No | `string` | formato `uuid` | Identificador asociado a encounter. | `00000000-0000-4000-8000-000000000001` |
| `notes[].noteTypeConceptId` | No | `string` | formato `uuid` | Identificador asociado a note type concept. | `00000000-0000-4000-8000-000000000001` |
| `notes[].lifecycleStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a lifecycle status concept. | `00000000-0000-4000-8000-000000000001` |
| `notes[].currentVersionId` | No | `string` | formato `uuid` | Identificador asociado a current version. | `00000000-0000-4000-8000-000000000001` |
| `notes[].versionNumber` | No | `number` | Sin restricción adicional declarada | Número de la versión vigente | `1` |
| `notes[].authorProfileId` | No | `string` | formato `uuid` | Identificador asociado a author profile. | `00000000-0000-4000-8000-000000000001` |
| `notes[].chiefComplaintText` | No | `string` | Sin restricción adicional declarada | Valor de chief complaint text mantenido por la instancia. | `valor-ejemplo` |
| `notes[].subjectiveText` | No | `string` | Sin restricción adicional declarada | Valor de subjective text mantenido por la instancia. | `valor-ejemplo` |
| `notes[].objectiveText` | No | `string` | Sin restricción adicional declarada | Valor de objective text mantenido por la instancia. | `valor-ejemplo` |
| `notes[].assessmentText` | No | `string` | Sin restricción adicional declarada | Valor de assessment text mantenido por la instancia. | `valor-ejemplo` |
| `notes[].planText` | No | `string` | Sin restricción adicional declarada | Valor de plan text mantenido por la instancia. | `valor-ejemplo` |
| `notes[].signedAt` | No | `string` | formato `date-time` | Valor de signed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `notes[].releasedToPatient` | Sí | `boolean` | Sin restricción adicional declarada | Si la nota tiene una versión liberada al portal del paciente. Derivado, para no obligar a resolver terminología antes de decidir si se muestra | `true` |
| `notes[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `carePlans` | Sí | `array<ChartCarePlanItemDto>` | Sin restricción adicional declarada | Valor de care plans mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","intentConceptId":"00000000-0000-4000-8000-000000000001","goalText":"valor-ejemplo","startDate":"2026-07-31","endDate":"2026-07-31","activities":[{"id":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","detailText":"valor-ejemplo","scheduledAt":"2026-07-31T12:00:00.000Z"}],"createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `carePlans[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `carePlans[].statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `carePlans[].intentConceptId` | No | `string` | formato `uuid` | Identificador asociado a intent concept. | `00000000-0000-4000-8000-000000000001` |
| `carePlans[].goalText` | No | `string` | Sin restricción adicional declarada | Valor de goal text mantenido por la instancia. | `valor-ejemplo` |
| `carePlans[].startDate` | No | `string` | formato `date` | Valor de start date mantenido por la instancia. | `2026-07-31` |
| `carePlans[].endDate` | No | `string` | formato `date` | Valor de end date mantenido por la instancia. | `2026-07-31` |
| `carePlans[].activities` | Sí | `array<CarePlanActivityItemDto>` | Sin restricción adicional declarada | Valor de activities mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","detailText":"valor-ejemplo","scheduledAt":"2026-07-31T12:00:00.000Z"}]` |
| `carePlans[].activities[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `carePlans[].activities[].statusConceptId` | No | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `carePlans[].activities[].detailText` | No | `string` | Sin restricción adicional declarada | Valor de detail text mantenido por la instancia. | `valor-ejemplo` |
| `carePlans[].activities[].scheduledAt` | No | `string` | formato `date-time` | Valor de scheduled at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `carePlans[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `documents` | Sí | `array<ChartDocumentItemDto>` | Sin restricción adicional declarada | Valor de documents mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","title":"valor-ejemplo","categoryConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","authorText":"valor-ejemplo","isExternal":true,"documentDate":"2026-07-31","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `documents[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `documents[].title` | No | `string` | Sin restricción adicional declarada | Valor de title mantenido por la instancia. | `valor-ejemplo` |
| `documents[].categoryConceptId` | No | `string` | formato `uuid` | Identificador asociado a category concept. | `00000000-0000-4000-8000-000000000001` |
| `documents[].statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `documents[].authorText` | No | `string` | Sin restricción adicional declarada | Valor de author text mantenido por la instancia. | `valor-ejemplo` |
| `documents[].isExternal` | No | `boolean` | Sin restricción adicional declarada | Valor de is external mantenido por la instancia. | `true` |
| `documents[].documentDate` | No | `string` | formato `date` | Valor de document date mantenido por la instancia. | `2026-07-31` |
| `documents[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a cada bloque | `1` |
| `truncated` | Sí | `array<string>` | Sin restricción adicional declarada | Qué bloques quedaron recortados por el tope. Vacío si el expediente cabe entero | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/charts/patients/{patientProfileId}/chart"
}
```

---

## 13. POST /charts/templates/{templateId}/assignments

- **Módulo:** `chart`
- **Etiqueta OpenAPI:** `chart-templates`
- **Nombre:** Asignar una plantilla de chart por especialidad
- **Operation ID:** `ChartTemplatesController_assignTemplate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ChartTemplatesController.assignTemplate](../../src/modules/chart/controllers/chart-templates.controller.ts)

### Descripción de negocio

Asignar una plantilla de chart por especialidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /charts/templates/{templateId}/assignments` en `ChartTemplatesController_assignTemplate`. El controlador delega en `ChartTemplatesService.assignTemplate`. Valida el body como `AssignTemplateDto` y consume `application/json`. El tipo de retorno estático es `Promise<AssignmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `templateId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AssignTemplateDto`; los campos opcionales se omiten.

```http
POST /charts/templates/00000000-0000-4000-8000-000000000001/assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `templateId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practiceId` | No | `string` | formato `uuid` | Práctica destino (practice.practices) | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | No | `string` | formato `uuid` | Perfil del profesional destino | `00000000-0000-4000-8000-000000000001` |
| `isDefault` | No | `boolean` | Sin restricción adicional declarada | Marca esta asignación como default del scope | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /charts/templates/00000000-0000-4000-8000-000000000001/assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "isDefault": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AssignmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AssignmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id de estado | `00000000-0000-4000-8000-000000000001` |

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
  "path": "/charts/templates/{templateId}/assignments"
}
```

---

