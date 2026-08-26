<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `pharma_lab`

Referencia exhaustiva de 76 operación(es) del módulo `pharma_lab`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `pharma-lab-catalog`, `pharma-lab-notices`, `pharma-lab-pharmacovigilance`, `pharma-lab-reference`, `pharma-lab-regulatory`, `pharma-lab-social-accounting`, `pharma-lab-visit-agenda`, `pharma-lab-visit-records`, `pharma-lab-visit-requests`, `pharma-lab-visit-surveys`, `pharma-lab-visitors`, `pharma-labs`
- **Controladores:** `MedicalVisitorsController`, `PharmaCatalogController`, `PharmaLabNoticesController`, `PharmaLabReferenceController`, `PharmaLabSocialController`, `PharmaLabsController`, `PharmacovigilanceController`, `RegulatoryDocumentsController`, `VisitAgendaController`, `VisitRecordsController`, `VisitRequestsController`, `VisitSurveysController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /pharma-labs](#1-get-pharma-labs) — Listar laboratorios farmacéuticos
2. [POST /pharma-labs](#2-post-pharma-labs) — Registrar una organización laboratorio farmacéutico
3. [GET /pharma-labs/{pharmaLabId}](#3-get-pharma-labs-pharmalabid) — Consultar el perfil de un laboratorio
4. [PATCH /pharma-labs/{pharmaLabId}](#4-patch-pharma-labs-pharmalabid) — Actualizar el perfil institucional
5. [POST /pharma-labs/{pharmaLabId}/cost-allocations](#5-post-pharma-labs-pharmalabid-cost-allocations) — Imputar un asiento contable a las dimensiones del laboratorio
6. [GET /pharma-labs/{pharmaLabId}/cost-allocations/report](#6-get-pharma-labs-pharmalabid-cost-allocations-report) — Rentabilidad por producto y costos por proyecto del periodo
7. [GET /pharma-labs/{pharmaLabId}/link-events](#7-get-pharma-labs-pharmalabid-link-events) — Historial de vinculaciones y permisos
8. [GET /pharma-labs/{pharmaLabId}/materials](#8-get-pharma-labs-pharmalabid-materials) — Listar el material informativo
9. [POST /pharma-labs/{pharmaLabId}/materials](#9-post-pharma-labs-pharmalabid-materials) — Crear material informativo (nace en borrador)
10. [GET /pharma-labs/{pharmaLabId}/materials/{materialId}/approvals](#10-get-pharma-labs-pharmalabid-materials-materialid-approvals) — Historial de revisiones del material
11. [GET /pharma-labs/{pharmaLabId}/materials/{materialId}/assets](#11-get-pharma-labs-pharmalabid-materials-materialid-assets) — Listar los adjuntos del material
12. [POST /pharma-labs/{pharmaLabId}/materials/{materialId}/assets](#12-post-pharma-labs-pharmalabid-materials-materialid-assets) — Adjuntar un archivo al material
13. [POST /pharma-labs/{pharmaLabId}/materials/{materialId}/decision](#13-post-pharma-labs-pharmalabid-materials-materialid-decision) — Aprobar o rechazar el material
14. [POST /pharma-labs/{pharmaLabId}/materials/{materialId}/submit](#14-post-pharma-labs-pharmalabid-materials-materialid-submit) — Enviar el material a revisión interna
15. [GET /pharma-labs/{pharmaLabId}/medical-visitors](#15-get-pharma-labs-pharmalabid-medical-visitors) — Listar los visitadores del laboratorio
16. [POST /pharma-labs/{pharmaLabId}/medical-visitors](#16-post-pharma-labs-pharmalabid-medical-visitors) — Registrar un visitador médico
17. [PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/products](#17-put-pharma-labs-pharmalabid-medical-visitors-medicalvisitorid-products) — Fijar los productos que el visitador representa
18. [POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/relink](#18-post-pharma-labs-pharmalabid-medical-visitors-medicalvisitorid-relink) — Revincular a un visitador con nueva autorización
19. [PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/specialties](#19-put-pharma-labs-pharmalabid-medical-visitors-medicalvisitorid-specialties) — Fijar las especialidades que el visitador visita
20. [POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/unlink](#20-post-pharma-labs-pharmalabid-medical-visitors-medicalvisitorid-unlink) — Desvincular al visitador y revocar sus accesos
21. [POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/verifications](#21-post-pharma-labs-pharmalabid-medical-visitors-medicalvisitorid-verifications) — Registrar las verificaciones del visitador
22. [GET /pharma-labs/{pharmaLabId}/pharmacovigilance/reports](#22-get-pharma-labs-pharmalabid-pharmacovigilance-reports) — Listar los reportes del laboratorio
23. [POST /pharma-labs/{pharmaLabId}/pharmacovigilance/reports](#23-post-pharma-labs-pharmalabid-pharmacovigilance-reports) — Enviar un reporte de farmacovigilancia
24. [GET /pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}](#24-get-pharma-labs-pharmalabid-pharmacovigilance-reports-reportid) — Consultar un reporte con su trazabilidad
25. [POST /pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}/actions](#25-post-pharma-labs-pharmalabid-pharmacovigilance-reports-reportid-actions) — Registrar una acción de seguimiento
26. [GET /pharma-labs/{pharmaLabId}/products](#26-get-pharma-labs-pharmalabid-products) — Listar el catálogo de medicamentos
27. [POST /pharma-labs/{pharmaLabId}/products](#27-post-pharma-labs-pharmalabid-products) — Registrar un medicamento en el catálogo
28. [PATCH /pharma-labs/{pharmaLabId}/products/{productId}](#28-patch-pharma-labs-pharmalabid-products-productid) — Actualizar un medicamento
29. [POST /pharma-labs/{pharmaLabId}/products/{productId}/status](#29-post-pharma-labs-pharmalabid-products-productid-status) — Cambiar el estado regulatorio de un medicamento
30. [GET /pharma-labs/{pharmaLabId}/regulatory-documents](#30-get-pharma-labs-pharmalabid-regulatory-documents) — Listar los documentos del laboratorio
31. [POST /pharma-labs/{pharmaLabId}/regulatory-documents](#31-post-pharma-labs-pharmalabid-regulatory-documents) — Registrar un documento con su primera versión
32. [GET /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}](#32-get-pharma-labs-pharmalabid-regulatory-documents-documentid) — Consultar un documento y sus versiones
33. [GET /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/access-log](#33-get-pharma-labs-pharmalabid-regulatory-documents-documentid-access-log) — Registro de consultas y descargas
34. [POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/invalidate](#34-post-pharma-labs-pharmalabid-regulatory-documents-documentid-invalidate) — Invalidar el documento sin borrarlo
35. [POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions](#35-post-pharma-labs-pharmalabid-regulatory-documents-documentid-versions) — Sustituir el documento por una versión nueva
36. [POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions/{versionId}/download](#36-post-pharma-labs-pharmalabid-regulatory-documents-documentid-versions-versionid-download) — Registrar la descarga de una versión
37. [POST /pharma-labs/{pharmaLabId}/regulatory-documents/expirations/review](#37-post-pharma-labs-pharmalabid-regulatory-documents-expirations-review) — Revisar vencimientos y notificar al personal
38. [GET /pharma-labs/{pharmaLabId}/staff](#38-get-pharma-labs-pharmalabid-staff) — Listar el personal del laboratorio
39. [POST /pharma-labs/{pharmaLabId}/staff](#39-post-pharma-labs-pharmalabid-staff) — Vincular personal al laboratorio
40. [PATCH /pharma-labs/{pharmaLabId}/staff/{staffId}/permissions](#40-patch-pharma-labs-pharmalabid-staff-staffid-permissions) — Cambiar los permisos de un colaborador
41. [POST /pharma-labs/{pharmaLabId}/staff/{staffId}/unlink](#41-post-pharma-labs-pharmalabid-staff-staffid-unlink) — Desvincular a un colaborador
42. [GET /pharma-labs/{pharmaLabId}/visitor-posts](#42-get-pharma-labs-pharmalabid-visitor-posts) — Listar las publicaciones propuestas
43. [POST /pharma-labs/{pharmaLabId}/visitor-posts/{submissionId}/decision](#43-post-pharma-labs-pharmalabid-visitor-posts-submissionid-decision) — Aprobar o rechazar la publicación propuesta
44. [POST /pharma-labs/notices/{noticeId}/read](#44-post-pharma-labs-notices-noticeid-read) — Marcar un aviso como leído
45. [GET /pharma-labs/notices/mine](#45-get-pharma-labs-notices-mine) — Avisos del laboratorio dirigidos a mi cuenta
46. [GET /pharma-labs/reference/concepts](#46-get-pharma-labs-reference-concepts) — Diccionario de conceptos del laboratorio farmacéutico
47. [POST /pharma-labs/visitor-posts](#47-post-pharma-labs-visitor-posts) — Proponer una publicación como visitador
48. [GET /visit-agenda/blocks](#48-get-visit-agenda-blocks) — Listar los bloqueos vigentes
49. [POST /visit-agenda/blocks](#49-post-visit-agenda-blocks) — Bloquear un laboratorio o un visitador
50. [POST /visit-agenda/blocks/{blockId}/lift](#50-post-visit-agenda-blocks-blockid-lift) — Levantar un bloqueo
51. [GET /visit-agenda/doctors/{doctorUserId}](#51-get-visit-agenda-doctors-doctoruserid) — Consultar la agenda de visitas de un doctor
52. [GET /visit-agenda/me](#52-get-visit-agenda-me) — Consultar la propia agenda de visitas
53. [PUT /visit-agenda/me](#53-put-visit-agenda-me) — Configurar la agenda de visitas del doctor
54. [POST /visit-records](#54-post-visit-records) — Registrar la visita realizada
55. [POST /visit-records/{visitRecordId}/confirm](#55-post-visit-records-visitrecordid-confirm) — Confirmar que la visita ocurrió
56. [POST /visit-records/{visitRecordId}/rating](#56-post-visit-records-visitrecordid-rating) — Calificar la visita completada
57. [GET /visit-records/inbox](#57-get-visit-records-inbox) — Listar las visitas recibidas
58. [GET /visit-records/labs/{pharmaLabId}](#58-get-visit-records-labs-pharmalabid) — Historial de visitas del laboratorio
59. [GET /visit-records/labs/{pharmaLabId}/rating-summary](#59-get-visit-records-labs-pharmalabid-rating-summary) — Resultados agregados de las calificaciones del laboratorio
60. [POST /visit-requests](#60-post-visit-requests) — Solicitar una visita médica a un doctor
61. [GET /visit-requests/{visitRequestId}](#61-get-visit-requests-visitrequestid) — Consultar una solicitud con su bitácora
62. [POST /visit-requests/{visitRequestId}/accept](#62-post-visit-requests-visitrequestid-accept) — Aceptar la visita
63. [POST /visit-requests/{visitRequestId}/cancel](#63-post-visit-requests-visitrequestid-cancel) — Cancelar la visita
64. [POST /visit-requests/{visitRequestId}/propose-time](#64-post-visit-requests-visitrequestid-propose-time) — Proponer otro horario
65. [POST /visit-requests/{visitRequestId}/reject](#65-post-visit-requests-visitrequestid-reject) — Rechazar la visita
66. [POST /visit-requests/{visitRequestId}/request-info](#66-post-visit-requests-visitrequestid-request-info) — Solicitar información adicional al visitador
67. [POST /visit-requests/{visitRequestId}/reschedule](#67-post-visit-requests-visitrequestid-reschedule) — Reprogramar la visita dentro del plazo permitido
68. [GET /visit-requests/inbox](#68-get-visit-requests-inbox) — Listar las solicitudes de visita recibidas
69. [GET /visit-requests/mine](#69-get-visit-requests-mine) — Listar las propias solicitudes de visita
70. [GET /visit-surveys/labs/{pharmaLabId}](#70-get-visit-surveys-labs-pharmalabid) — Listar las encuestas del laboratorio
71. [POST /visit-surveys/labs/{pharmaLabId}](#71-post-visit-surveys-labs-pharmalabid) — Configurar una encuesta posterior a la visita
72. [POST /visit-surveys/labs/{pharmaLabId}/{surveyId}/close](#72-post-visit-surveys-labs-pharmalabid-surveyid-close) — Cerrar una encuesta
73. [GET /visit-surveys/labs/{pharmaLabId}/{surveyId}/results](#73-get-visit-surveys-labs-pharmalabid-surveyid-results) — Resultados agregados de la encuesta
74. [GET /visit-surveys/pending](#74-get-visit-surveys-pending) — Listar las encuestas pendientes de responder
75. [GET /visit-surveys/responses/{responseId}](#75-get-visit-surveys-responses-responseid) — Consultar el cuestionario a responder
76. [POST /visit-surveys/responses/{responseId}](#76-post-visit-surveys-responses-responseid) — Responder la encuesta de la visita

---

## 1. GET /pharma-labs

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-labs`
- **Nombre:** Listar laboratorios farmacéuticos
- **Operation ID:** `PharmaLabsController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabsController.list](../../src/modules/pharma_lab/controllers/pharma-labs.controller.ts)

### Descripción de negocio

Listar laboratorios farmacéuticos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Listado de laboratorios registrados.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs` en `PharmaLabsController_list`. El controlador delega en `PharmaLabOrganizationService.listLabs`. No recibe body. El tipo de retorno estático es `Promise<PharmaLabs[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmaLabs[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<PharmaLabs[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmaLabs[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmaLabs[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmaLabs[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmaLabs[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmaLabs[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "tenantId": "00000000-0000-4000-8000-000000000001",
    "labTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "legalName": "Nombre de ejemplo",
    "tradeName": "Nombre de ejemplo",
    "taxId": "00000000-0000-4000-8000-000000000001",
    "logoUrl": "valor-ejemplo",
    "description": "Texto descriptivo de ejemplo",
    "researchAreas": [
      "valor-ejemplo"
    ],
    "contacts": {
      "clave": "valor"
    },
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs"
}
```

---

## 2. POST /pharma-labs

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-labs`
- **Nombre:** Registrar una organización laboratorio farmacéutico
- **Operation ID:** `PharmaLabsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabsController.create](../../src/modules/pharma_lab/controllers/pharma-labs.controller.ts)

### Descripción de negocio

Registrar una organización laboratorio farmacéutico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs` en `PharmaLabsController_create`. El controlador delega en `PharmaLabOrganizationService.createLab`. Valida el body como `CreatePharmaLabDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePharmaLabDto`; los campos opcionales se omiten.

```http
POST /pharma-labs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "labTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "legalName": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Tenant del directorio | `00000000-0000-4000-8000-000000000001` |
| `labTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `legalName` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `tradeName` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `taxId` | No | `string` | longitud máxima 64 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `researchAreas` | No | `array<string>` | máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `logoUrl` | No | `string` | longitud máxima 1024 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "labTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "legalName": "Nombre de ejemplo",
  "tradeName": "Nombre de ejemplo",
  "taxId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "researchAreas": [
    "valor-ejemplo"
  ],
  "logoUrl": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Organización no encontrada | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-organization.service.ts |
| 409 | `CONFLICT` | La organización ya está registrada como laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-organization.service.ts |
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
  "path": "/pharma-labs"
}
```

---

## 3. GET /pharma-labs/{pharmaLabId}

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-labs`
- **Nombre:** Consultar el perfil de un laboratorio
- **Operation ID:** `PharmaLabsController_getOne`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabsController.getOne](../../src/modules/pharma_lab/controllers/pharma-labs.controller.ts)

### Descripción de negocio

Consultar el perfil de un laboratorio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Perfil institucional.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}` en `PharmaLabsController_getOne`. El controlador delega en `PharmaLabOrganizationService.getLab`. No recibe body. El tipo de retorno estático es `Promise<PharmaLabs>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmaLabs>` | No |
| 400 | Consulta completada correctamente. | `Promise<PharmaLabs>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmaLabs>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmaLabs>` | No |
| 404 | Consulta completada correctamente. | `Promise<PharmaLabs>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmaLabs>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmaLabs>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmaLabs`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "labTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "legalName": "Nombre de ejemplo",
  "tradeName": "Nombre de ejemplo",
  "taxId": "00000000-0000-4000-8000-000000000001",
  "logoUrl": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "researchAreas": [
    "valor-ejemplo"
  ],
  "contacts": {
    "clave": "valor"
  },
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "createdByUserId": "00000000-0000-4000-8000-000000000001",
  "updatedByUserId": "00000000-0000-4000-8000-000000000001",
  "rowVersion": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a tenant. Uno a uno con la organización. | `00000000-0000-4000-8000-000000000001` |
| `labTypeConceptId` | Sí | `string` | Sin restricción adicional declarada | Tipo de laboratorio: farmacéutico, desarrollador, fabricante, biotecnológica, distribuidor autorizado u organización de investigación. | `00000000-0000-4000-8000-000000000001` |
| `legalName` | Sí | `string` | Sin restricción adicional declarada | Razón social. | `Nombre de ejemplo` |
| `tradeName` | No | `string` | Sin restricción adicional declarada | Nombre comercial. | `Nombre de ejemplo` |
| `taxId` | No | `string` | Sin restricción adicional declarada | Identificación tributaria. | `00000000-0000-4000-8000-000000000001` |
| `logoUrl` | No | `string` | Sin restricción adicional declarada | URL del logotipo institucional. | `valor-ejemplo` |
| `description` | No | `string` | Sin restricción adicional declarada | Descripción institucional. | `Texto descriptivo de ejemplo` |
| `researchAreas` | No | `array<string>` | Sin restricción adicional declarada | Áreas de investigación declaradas. | `["valor-ejemplo"]` |
| `contacts` | No | `object` | Sin restricción adicional declarada | Contactos institucionales (nombre, cargo, correo, teléfono). | `{"clave":"valor"}` |
| `statusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado del laboratorio. Es la puerta de la regla del carril: un visitador solo opera mientras su laboratorio esté activo. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |
| `createdByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a created by user. | `00000000-0000-4000-8000-000000000001` |
| `updatedByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a updated by user. | `00000000-0000-4000-8000-000000000001` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión usada para controlar actualizaciones concurrentes. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}"
}
```

---

## 4. PATCH /pharma-labs/{pharmaLabId}

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-labs`
- **Nombre:** Actualizar el perfil institucional
- **Operation ID:** `PharmaLabsController_update`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabsController.update](../../src/modules/pharma_lab/controllers/pharma-labs.controller.ts)

### Descripción de negocio

Actualizar el perfil institucional. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /pharma-labs/{pharmaLabId}` en `PharmaLabsController_update`. El controlador delega en `PharmaLabOrganizationService.updateLab`. Valida el body como `UpdatePharmaLabDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdatePharmaLabDto`; los campos opcionales se omiten.

```http
PATCH /pharma-labs/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tradeName` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `taxId` | No | `string` | longitud máxima 64 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `researchAreas` | No | `array<string>` | máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `logoUrl` | No | `string` | longitud máxima 1024 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `statusConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /pharma-labs/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tradeName": "Nombre de ejemplo",
  "taxId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "researchAreas": [
    "valor-ejemplo"
  ],
  "logoUrl": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
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
  "path": "/pharma-labs/{pharmaLabId}"
}
```

---

## 5. POST /pharma-labs/{pharmaLabId}/cost-allocations

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-social-accounting`
- **Nombre:** Imputar un asiento contable a las dimensiones del laboratorio
- **Operation ID:** `PharmaLabSocialController_allocate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabSocialController.allocate](../../src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts)

### Descripción de negocio

Imputar un asiento contable a las dimensiones del laboratorio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/cost-allocations` en `PharmaLabSocialController_allocate`. El controlador delega en `PharmaAnalyticsService.createAllocation`. Valida el body como `CreateCostAllocationDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCostAllocationDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/cost-allocations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "journalTransactionId": "00000000-0000-4000-8000-000000000001",
  "costTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "amount": "1500.00",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "allocatedOn": "2026-07-31"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `ACCOUNTANT`, `FINANCE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `journalTransactionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `costTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1500.00` |
| `currencyConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `allocatedOn` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `pharmaProductId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `projectCode` | No | `string` | longitud máxima 64 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `branchId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `area` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `medicalVisitorId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `campaignCode` | No | `string` | longitud máxima 64 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/cost-allocations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "journalTransactionId": "00000000-0000-4000-8000-000000000001",
  "costTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "amount": "1500.00",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "allocatedOn": "2026-07-31",
  "pharmaProductId": "00000000-0000-4000-8000-000000000001",
  "projectCode": "CODIGO_EJEMPLO",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "area": "valor-ejemplo",
  "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
  "campaignCode": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, ACCOUNTANT, FINANCE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Asiento contable no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-analytics.service.ts |
| 404 | `NOT_FOUND` | Producto no encontrado en el catálogo del laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-analytics.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El laboratorio no está activo | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/cost-allocations"
}
```

---

## 6. GET /pharma-labs/{pharmaLabId}/cost-allocations/report

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-social-accounting`
- **Nombre:** Rentabilidad por producto y costos por proyecto del periodo
- **Operation ID:** `PharmaLabSocialController_report`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabSocialController.report](../../src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts)

### Descripción de negocio

Rentabilidad por producto y costos por proyecto del periodo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Reporte analítico del periodo.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}/cost-allocations/report` en `PharmaLabSocialController_report`. El controlador delega en `PharmaAnalyticsService.getReport`. No recibe body. El tipo de retorno estático es `Promise<AllocationReport>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `from` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `2026-01-01` |
| `to` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `2026-12-31` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/cost-allocations/report?from=2026-01-01&to=2026-12-31 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `ACCOUNTANT`, `FINANCE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/cost-allocations/report?from=2026-01-01&to=2026-12-31 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AllocationReport>` | No |
| 400 | Consulta completada correctamente. | `Promise<AllocationReport>` | No |
| 401 | Consulta completada correctamente. | `Promise<AllocationReport>` | No |
| 403 | Consulta completada correctamente. | `Promise<AllocationReport>` | No |
| 404 | Consulta completada correctamente. | `Promise<AllocationReport>` | No |
| 429 | Consulta completada correctamente. | `Promise<AllocationReport>` | No |
| 500 | Consulta completada correctamente. | `Promise<AllocationReport>` | No |

El controlador declara `AllocationReport`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, ACCOUNTANT, FINANCE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/cost-allocations/report"
}
```

---

## 7. GET /pharma-labs/{pharmaLabId}/link-events

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-labs`
- **Nombre:** Historial de vinculaciones y permisos
- **Operation ID:** `PharmaLabsController_listLinkEvents`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabsController.listLinkEvents](../../src/modules/pharma_lab/controllers/pharma-labs.controller.ts)

### Descripción de negocio

Historial de vinculaciones y permisos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bitácora de vinculaciones y permisos (spec 5288).

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}/link-events` en `PharmaLabsController_listLinkEvents`. El controlador delega en `PharmaLabOrganizationService.listLinkEvents`. No recibe body. El tipo de retorno estático es `Promise<PharmaLabLinkEvents[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/link-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/link-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmaLabLinkEvents[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<PharmaLabLinkEvents[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmaLabLinkEvents[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmaLabLinkEvents[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<PharmaLabLinkEvents[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmaLabLinkEvents[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmaLabLinkEvents[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmaLabLinkEvents[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "staffId": "00000000-0000-4000-8000-000000000001",
    "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
    "subjectUserId": "00000000-0000-4000-8000-000000000001",
    "eventTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "reason": "Texto descriptivo de ejemplo",
    "previousPermissions": [
      "valor-ejemplo"
    ],
    "newPermissions": [
      "valor-ejemplo"
    ],
    "revokedSessionCount": 1,
    "occurredAt": "2026-07-31T12:00:00.000Z",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001"
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/link-events"
}
```

---

## 8. GET /pharma-labs/{pharmaLabId}/materials

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-catalog`
- **Nombre:** Listar el material informativo
- **Operation ID:** `PharmaCatalogController_listMaterials`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaCatalogController.listMaterials](../../src/modules/pharma_lab/controllers/pharma-catalog.controller.ts)

### Descripción de negocio

Listar el material informativo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Material informativo del laboratorio.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}/materials` en `PharmaCatalogController_listMaterials`. El controlador delega en `PharmaCatalogService.listMaterials`. No recibe body. El tipo de retorno estático es `Promise<InformationalMaterials[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/materials HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `REGULATORY_AFFAIRS`, `MEDICAL_VISITOR`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/materials HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<InformationalMaterials[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<InformationalMaterials[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<InformationalMaterials[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<InformationalMaterials[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<InformationalMaterials[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<InformationalMaterials[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<InformationalMaterials[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InformationalMaterials[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "pharmaProductId": "00000000-0000-4000-8000-000000000001",
    "campaignCode": "CODIGO_EJEMPLO",
    "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
    "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
    "title": "valor-ejemplo",
    "kindConceptId": "00000000-0000-4000-8000-000000000001",
    "version": "valor-ejemplo",
    "authorName": "Nombre de ejemplo",
    "approverStaffId": "00000000-0000-4000-8000-000000000001",
    "validFrom": "valor-ejemplo",
    "validTo": "valor-ejemplo",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "disclosureLevelConceptId": "00000000-0000-4000-8000-000000000001",
    "approvedAt": "2026-07-31T12:00:00.000Z",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, MEDICAL_VISITOR, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/materials"
}
```

---

## 9. POST /pharma-labs/{pharmaLabId}/materials

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-catalog`
- **Nombre:** Crear material informativo (nace en borrador)
- **Operation ID:** `PharmaCatalogController_createMaterial`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaCatalogController.createMaterial](../../src/modules/pharma_lab/controllers/pharma-catalog.controller.ts)

### Descripción de negocio

Crear material informativo (nace en borrador). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/materials` en `PharmaCatalogController_createMaterial`. El controlador delega en `PharmaCatalogService.createMaterial`. Valida el body como `CreateInformationalMaterialDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateInformationalMaterialDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/materials HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "title": "valor-ejemplo",
  "kindConceptId": "00000000-0000-4000-8000-000000000001",
  "version": "v1.0",
  "disclosureLevelConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `REGULATORY_AFFAIRS`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `title` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `kindConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `version` | Sí | `string` | longitud máxima 32 | Sin descripción específica en el contrato OpenAPI. | `v1.0` |
| `pharmaProductId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `campaignCode` | No | `string` | longitud máxima 64 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `specialtyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `medicalVisitorId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `authorName` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `validFrom` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `validTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `disclosureLevelConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/materials HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "title": "valor-ejemplo",
  "kindConceptId": "00000000-0000-4000-8000-000000000001",
  "version": "v1.0",
  "pharmaProductId": "00000000-0000-4000-8000-000000000001",
  "campaignCode": "CODIGO_EJEMPLO",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
  "authorName": "Nombre de ejemplo",
  "validFrom": "2026-07-31",
  "validTo": "2026-07-31",
  "disclosureLevelConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Producto no encontrado en el catálogo del laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El laboratorio no está activo | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/materials"
}
```

---

## 10. GET /pharma-labs/{pharmaLabId}/materials/{materialId}/approvals

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-catalog`
- **Nombre:** Historial de revisiones del material
- **Operation ID:** `PharmaCatalogController_listApprovals`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaCatalogController.listApprovals](../../src/modules/pharma_lab/controllers/pharma-catalog.controller.ts)

### Descripción de negocio

Historial de revisiones del material. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Historial de revisiones del material.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}/materials/{materialId}/approvals` en `PharmaCatalogController_listApprovals`. El controlador delega en `PharmaCatalogService.listApprovals`. No recibe body. El tipo de retorno estático es `Promise<MaterialApprovals[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `materialId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/materials/00000000-0000-4000-8000-000000000001/approvals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `REGULATORY_AFFAIRS`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `materialId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/materials/00000000-0000-4000-8000-000000000001/approvals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MaterialApprovals[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<MaterialApprovals[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<MaterialApprovals[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<MaterialApprovals[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<MaterialApprovals[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<MaterialApprovals[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<MaterialApprovals[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MaterialApprovals[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "informationalMaterialId": "00000000-0000-4000-8000-000000000001",
    "materialVersion": "valor-ejemplo",
    "decisionConceptId": "00000000-0000-4000-8000-000000000001",
    "reviewerStaffId": "00000000-0000-4000-8000-000000000001",
    "rationale": "valor-ejemplo",
    "decidedAt": "2026-07-31T12:00:00.000Z",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001"
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Material informativo no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/materials/{materialId}/approvals"
}
```

---

## 11. GET /pharma-labs/{pharmaLabId}/materials/{materialId}/assets

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-catalog`
- **Nombre:** Listar los adjuntos del material
- **Operation ID:** `PharmaCatalogController_listAssets`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaCatalogController.listAssets](../../src/modules/pharma_lab/controllers/pharma-catalog.controller.ts)

### Descripción de negocio

Listar los adjuntos del material. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Adjuntos del material.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}/materials/{materialId}/assets` en `PharmaCatalogController_listAssets`. El controlador delega en `PharmaCatalogService.listAssets`. No recibe body. El tipo de retorno estático es `Promise<MaterialAssets[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `materialId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/materials/00000000-0000-4000-8000-000000000001/assets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `REGULATORY_AFFAIRS`, `MEDICAL_VISITOR`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `materialId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/materials/00000000-0000-4000-8000-000000000001/assets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MaterialAssets[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<MaterialAssets[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<MaterialAssets[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<MaterialAssets[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<MaterialAssets[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<MaterialAssets[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<MaterialAssets[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MaterialAssets[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "informationalMaterialId": "00000000-0000-4000-8000-000000000001",
    "kindConceptId": "00000000-0000-4000-8000-000000000001",
    "fileName": "Nombre de ejemplo",
    "storageKey": "valor-ejemplo",
    "contentType": "valor-ejemplo",
    "sizeBytes": "valor-ejemplo",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001"
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, MEDICAL_VISITOR, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Material informativo no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/materials/{materialId}/assets"
}
```

---

## 12. POST /pharma-labs/{pharmaLabId}/materials/{materialId}/assets

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-catalog`
- **Nombre:** Adjuntar un archivo al material
- **Operation ID:** `PharmaCatalogController_addAsset`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaCatalogController.addAsset](../../src/modules/pharma_lab/controllers/pharma-catalog.controller.ts)

### Descripción de negocio

Adjuntar un archivo al material. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/materials/{materialId}/assets` en `PharmaCatalogController_addAsset`. El controlador delega en `PharmaCatalogService.addAsset`. Valida el body como `AddMaterialAssetDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `materialId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddMaterialAssetDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/materials/00000000-0000-4000-8000-000000000001/assets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "kindConceptId": "00000000-0000-4000-8000-000000000001",
  "fileName": "Nombre de ejemplo",
  "storageKey": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `REGULATORY_AFFAIRS`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `materialId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kindConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `fileName` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `storageKey` | Sí | `string` | longitud máxima 512 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `contentType` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sizeBytes` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `104857` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/materials/00000000-0000-4000-8000-000000000001/assets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "kindConceptId": "00000000-0000-4000-8000-000000000001",
  "fileName": "Nombre de ejemplo",
  "storageKey": "valor-ejemplo",
  "contentType": "valor-ejemplo",
  "sizeBytes": "104857"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Material informativo no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No se puede modificar el contenido de un material ya aprobado; creá una versión nueva | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/materials/{materialId}/assets"
}
```

---

## 13. POST /pharma-labs/{pharmaLabId}/materials/{materialId}/decision

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-catalog`
- **Nombre:** Aprobar o rechazar el material
- **Operation ID:** `PharmaCatalogController_decideMaterial`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaCatalogController.decideMaterial](../../src/modules/pharma_lab/controllers/pharma-catalog.controller.ts)

### Descripción de negocio

Aprobar o rechazar el material. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/materials/{materialId}/decision` en `PharmaCatalogController_decideMaterial`. El controlador delega en `PharmaCatalogService.decideMaterial`. Valida el body como `DecideMaterialDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `materialId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DecideMaterialDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/materials/00000000-0000-4000-8000-000000000001/decision HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decisionConceptId": "00000000-0000-4000-8000-000000000001",
  "rationale": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `REGULATORY_AFFAIRS`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `materialId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decisionConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reviewerStaffId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `rationale` | Sí | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/materials/00000000-0000-4000-8000-000000000001/decision HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decisionConceptId": "00000000-0000-4000-8000-000000000001",
  "reviewerStaffId": "00000000-0000-4000-8000-000000000001",
  "rationale": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Material informativo no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | Solo se decide sobre un material en revisión | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La decisión debe ser aprobar o rechazar | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/materials/{materialId}/decision"
}
```

---

## 14. POST /pharma-labs/{pharmaLabId}/materials/{materialId}/submit

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-catalog`
- **Nombre:** Enviar el material a revisión interna
- **Operation ID:** `PharmaCatalogController_submitMaterial`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaCatalogController.submitMaterial](../../src/modules/pharma_lab/controllers/pharma-catalog.controller.ts)

### Descripción de negocio

Enviar el material a revisión interna. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Envío a revisión interna.

### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/materials/{materialId}/submit` en `PharmaCatalogController_submitMaterial`. El controlador delega en `PharmaCatalogService.submitMaterialForReview`. No recibe body. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `materialId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/materials/00000000-0000-4000-8000-000000000001/submit HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `REGULATORY_AFFAIRS`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `materialId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/materials/00000000-0000-4000-8000-000000000001/submit HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Material informativo no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | Solo se envía a revisión un material en borrador | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El material no tiene ningún adjunto que revisar | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/materials/{materialId}/submit"
}
```

---

## 15. GET /pharma-labs/{pharmaLabId}/medical-visitors

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visitors`
- **Nombre:** Listar los visitadores del laboratorio
- **Operation ID:** `MedicalVisitorsController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalVisitorsController.list](../../src/modules/pharma_lab/controllers/medical-visitors.controller.ts)

### Descripción de negocio

Listar los visitadores del laboratorio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Listado de visitadores del laboratorio.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}/medical-visitors` en `MedicalVisitorsController_list`. El controlador delega en `MedicalVisitorsService.listVisitors`. No recibe body. El tipo de retorno estático es `Promise<MedicalVisitors[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/medical-visitors HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/medical-visitors HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MedicalVisitors[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<MedicalVisitors[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<MedicalVisitors[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<MedicalVisitors[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<MedicalVisitors[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<MedicalVisitors[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<MedicalVisitors[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MedicalVisitors[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "userId": "00000000-0000-4000-8000-000000000001",
    "staffId": "00000000-0000-4000-8000-000000000001",
    "fullName": "Nombre de ejemplo",
    "photoUrl": "valor-ejemplo",
    "internalCode": "CODIGO_EJEMPLO",
    "position": "valor-ejemplo",
    "supervisorStaffId": "00000000-0000-4000-8000-000000000001",
    "branchId": "00000000-0000-4000-8000-000000000001",
    "region": "valor-ejemplo",
    "commercialArea": "valor-ejemplo",
    "assignedZone": "valor-ejemplo",
    "startedOn": "valor-ejemplo",
    "endedOn": "valor-ejemplo",
    "identityVerificationConceptId": "00000000-0000-4000-8000-000000000001",
    "contractVerificationConceptId": "00000000-0000-4000-8000-000000000001",
    "credentialVerificationConceptId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "publiclyListed": true,
    "unlinkedAt": "2026-07-31T12:00:00.000Z",
    "unlinkReason": "Texto descriptivo de ejemplo",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/medical-visitors"
}
```

---

## 16. POST /pharma-labs/{pharmaLabId}/medical-visitors

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visitors`
- **Nombre:** Registrar un visitador médico
- **Operation ID:** `MedicalVisitorsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalVisitorsController.create](../../src/modules/pharma_lab/controllers/medical-visitors.controller.ts)

### Descripción de negocio

Registrar un visitador médico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/medical-visitors` en `MedicalVisitorsController_create`. El controlador delega en `MedicalVisitorsService.createVisitor`. Valida el body como `CreateMedicalVisitorDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateMedicalVisitorDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/medical-visitors HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001",
  "fullName": "Nombre de ejemplo",
  "internalCode": "CODIGO_EJEMPLO",
  "startedOn": "2026-07-31"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `userId` | Sí | `string` | formato `uuid` | Cuenta creada por la organización | `00000000-0000-4000-8000-000000000001` |
| `fullName` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `internalCode` | Sí | `string` | longitud máxima 64 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `photoUrl` | No | `string` | longitud máxima 1024 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `position` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `supervisorStaffId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `branchId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `region` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `commercialArea` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `assignedZone` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `startedOn` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `endedOn` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `specialtyConceptIds` | No | `array<string>` | formato `uuid`; máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |
| `pharmaProductIds` | No | `array<string>` | formato `uuid`; máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/medical-visitors HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001",
  "fullName": "Nombre de ejemplo",
  "internalCode": "CODIGO_EJEMPLO",
  "photoUrl": "valor-ejemplo",
  "position": "valor-ejemplo",
  "supervisorStaffId": "00000000-0000-4000-8000-000000000001",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "region": "valor-ejemplo",
  "commercialArea": "valor-ejemplo",
  "assignedZone": "valor-ejemplo",
  "startedOn": "2026-07-31",
  "endedOn": "2026-07-31",
  "specialtyConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "pharmaProductIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cuenta no encontrada | Excepción explícita en src/modules/pharma_lab/services/medical-visitors.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | La cuenta ya está registrada como visitador | Excepción explícita en src/modules/pharma_lab/services/medical-visitors.service.ts |
| 409 | `CONFLICT` | El código interno ya está en uso en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/medical-visitors.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Algún producto no pertenece al catálogo del laboratorio | Excepción explícita en src/modules/pharma_lab/services/medical-visitors.service.ts |
| 422 | `PRECONDITION_FAILED` | El laboratorio no está activo | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/medical-visitors"
}
```

---

## 17. PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/products

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visitors`
- **Nombre:** Fijar los productos que el visitador representa
- **Operation ID:** `MedicalVisitorsController_setProducts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalVisitorsController.setProducts](../../src/modules/pharma_lab/controllers/medical-visitors.controller.ts)

### Descripción de negocio

Fijar los productos que el visitador representa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/products` en `MedicalVisitorsController_setProducts`. El controlador delega en `MedicalVisitorsService.setProducts`. Valida el body como `SetVisitorProductsDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `medicalVisitorId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetVisitorProductsDto`; los campos opcionales se omiten.

```http
PUT /pharma-labs/00000000-0000-4000-8000-000000000001/medical-visitors/00000000-0000-4000-8000-000000000001/products HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmaProductIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `medicalVisitorId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `pharmaProductIds` | Sí | `array<string>` | formato `uuid`; máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /pharma-labs/00000000-0000-4000-8000-000000000001/medical-visitors/00000000-0000-4000-8000-000000000001/products HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmaProductIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 404 | `NOT_FOUND` | Visitador no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Algún producto no pertenece al catálogo del laboratorio | Excepción explícita en src/modules/pharma_lab/services/medical-visitors.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/products"
}
```

---

## 18. POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/relink

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visitors`
- **Nombre:** Revincular a un visitador con nueva autorización
- **Operation ID:** `MedicalVisitorsController_relink`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalVisitorsController.relink](../../src/modules/pharma_lab/controllers/medical-visitors.controller.ts)

### Descripción de negocio

Revincular a un visitador con nueva autorización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Revinculación autorizada (spec 5340).

### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/relink` en `MedicalVisitorsController_relink`. El controlador delega en `MedicalVisitorsService.relinkVisitor`. Valida el body como `RelinkMedicalVisitorDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `medicalVisitorId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RelinkMedicalVisitorDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/medical-visitors/00000000-0000-4000-8000-000000000001/relink HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "startedOn": "2026-07-31",
  "authorization": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `medicalVisitorId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `startedOn` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `authorization` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/medical-visitors/00000000-0000-4000-8000-000000000001/relink HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "startedOn": "2026-07-31",
  "authorization": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 404 | `NOT_FOUND` | Visitador no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | El visitador ya está vinculado | Excepción explícita en src/modules/pharma_lab/services/medical-visitors.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El laboratorio no está activo | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/relink"
}
```

---

## 19. PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/specialties

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visitors`
- **Nombre:** Fijar las especialidades que el visitador visita
- **Operation ID:** `MedicalVisitorsController_setSpecialties`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalVisitorsController.setSpecialties](../../src/modules/pharma_lab/controllers/medical-visitors.controller.ts)

### Descripción de negocio

Fijar las especialidades que el visitador visita. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/specialties` en `MedicalVisitorsController_setSpecialties`. El controlador delega en `MedicalVisitorsService.setSpecialties`. Valida el body como `SetVisitorSpecialtiesDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `medicalVisitorId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetVisitorSpecialtiesDto`; los campos opcionales se omiten.

```http
PUT /pharma-labs/00000000-0000-4000-8000-000000000001/medical-visitors/00000000-0000-4000-8000-000000000001/specialties HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "specialtyConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `medicalVisitorId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `specialtyConceptIds` | Sí | `array<string>` | formato `uuid`; máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /pharma-labs/00000000-0000-4000-8000-000000000001/medical-visitors/00000000-0000-4000-8000-000000000001/specialties HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "specialtyConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 404 | `NOT_FOUND` | Visitador no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
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
  "path": "/pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/specialties"
}
```

---

## 20. POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/unlink

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visitors`
- **Nombre:** Desvincular al visitador y revocar sus accesos
- **Operation ID:** `MedicalVisitorsController_unlink`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalVisitorsController.unlink](../../src/modules/pharma_lab/controllers/medical-visitors.controller.ts)

### Descripción de negocio

Desactiva la cuenta, cierra sus sesiones, revoca sus permisos y cancela sus visitas pendientes. Conserva el registro para auditoría.

Contexto declarado en el controlador: UC-17-08: desvinculación con revocación efectiva de accesos.

### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/unlink` en `MedicalVisitorsController_unlink`. El controlador delega en `MedicalVisitorsService.unlinkVisitor`. Valida el body como `UnlinkDto` y consume `application/json`. El tipo de retorno estático es `Promise<UnlinkResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `medicalVisitorId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UnlinkDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/medical-visitors/00000000-0000-4000-8000-000000000001/unlink HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `medicalVisitorId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `effectiveOn` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/medical-visitors/00000000-0000-4000-8000-000000000001/unlink HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo",
  "effectiveOn": "2026-07-31"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<UnlinkResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<UnlinkResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<UnlinkResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<UnlinkResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<UnlinkResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<UnlinkResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<UnlinkResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<UnlinkResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<UnlinkResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<UnlinkResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `UnlinkResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "revokedSessions": 1,
  "revokedRefreshTokens": 1,
  "cancelledVisitRequests": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `revokedSessions` | Sí | `number` | Sin restricción adicional declarada | Sesiones activas cerradas | `1` |
| `revokedRefreshTokens` | Sí | `number` | Sin restricción adicional declarada | Tokens de refresco revocados | `1` |
| `cancelledVisitRequests` | No | `number` | Sin restricción adicional declarada | Solicitudes pendientes canceladas | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 404 | `NOT_FOUND` | Visitador no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | El visitador ya está desvinculado | Excepción explícita en src/modules/pharma_lab/services/medical-visitors.service.ts |
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
  "path": "/pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/unlink"
}
```

---

## 21. POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/verifications

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visitors`
- **Nombre:** Registrar las verificaciones del visitador
- **Operation ID:** `MedicalVisitorsController_verify`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MedicalVisitorsController.verify](../../src/modules/pharma_lab/controllers/medical-visitors.controller.ts)

### Descripción de negocio

Registrar las verificaciones del visitador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/verifications` en `MedicalVisitorsController_verify`. El controlador delega en `MedicalVisitorsService.verifyVisitor`. Valida el body como `VerifyMedicalVisitorDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `medicalVisitorId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VerifyMedicalVisitorDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/medical-visitors/00000000-0000-4000-8000-000000000001/verifications HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `medicalVisitorId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `identityVerificationConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `contractVerificationConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentialVerificationConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/medical-visitors/00000000-0000-4000-8000-000000000001/verifications HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "identityVerificationConceptId": "00000000-0000-4000-8000-000000000001",
  "contractVerificationConceptId": "00000000-0000-4000-8000-000000000001",
  "credentialVerificationConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 404 | `NOT_FOUND` | Visitador no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
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
  "path": "/pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/verifications"
}
```

---

## 22. GET /pharma-labs/{pharmaLabId}/pharmacovigilance/reports

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-pharmacovigilance`
- **Nombre:** Listar los reportes del laboratorio
- **Operation ID:** `PharmacovigilanceController_listReports`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacovigilanceController.listReports](../../src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts)

### Descripción de negocio

Listar los reportes del laboratorio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bandeja de reportes del laboratorio.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}/pharmacovigilance/reports` en `PharmacovigilanceController_listReports`. El controlador delega en `PharmacovigilanceService.listReports`. No recibe body. El tipo de retorno estático es `Promise<PharmacovigilanceReports[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/pharmacovigilance/reports HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMACOVIGILANCE_OFFICER`, `PHARMA_LAB_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/pharmacovigilance/reports HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmacovigilanceReports[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<PharmacovigilanceReports[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmacovigilanceReports[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmacovigilanceReports[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<PharmacovigilanceReports[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmacovigilanceReports[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmacovigilanceReports[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmacovigilanceReports[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "pharmaProductId": "00000000-0000-4000-8000-000000000001",
    "caseCode": "CODIGO_EJEMPLO",
    "batchNumber": "valor-ejemplo",
    "eventDate": "valor-ejemplo",
    "eventTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "description": "Texto descriptivo de ejemplo",
    "severityConceptId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "reporterTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "reporterUserId": "00000000-0000-4000-8000-000000000001",
    "reporterTenantId": "00000000-0000-4000-8000-000000000001",
    "subjectPseudonym": "valor-ejemplo",
    "subjectAgeYears": 1,
    "subjectSexConceptId": "00000000-0000-4000-8000-000000000001",
    "receivedAt": "2026-07-31T12:00:00.000Z",
    "closedAt": "2026-07-31T12:00:00.000Z",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/pharmacovigilance/reports"
}
```

---

## 23. POST /pharma-labs/{pharmaLabId}/pharmacovigilance/reports

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-pharmacovigilance`
- **Nombre:** Enviar un reporte de farmacovigilancia
- **Operation ID:** `PharmacovigilanceController_createReport`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacovigilanceController.createReport](../../src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts)

### Descripción de negocio

Enviar un reporte de farmacovigilancia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/pharmacovigilance/reports` en `PharmacovigilanceController_createReport`. El controlador delega en `PharmacovigilanceService.createReport`. Valida el body como `CreatePharmacovigilanceReportDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePharmacovigilanceReportDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/pharmacovigilance/reports HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmaProductId": "00000000-0000-4000-8000-000000000001",
  "eventDate": "2026-07-31",
  "eventTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "reporterTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`, `PHARMACOVIGILANCE_OFFICER`, `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `pharmaProductId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `batchNumber` | No | `string` | longitud máxima 64 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `eventDate` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `eventTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `description` | Sí | `string` | longitud máxima 4000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `severityConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reporterTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reporterTenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `subjectPseudonym` | No | `string` | longitud máxima 64 | Seudónimo, nunca un id de paciente | `valor-ejemplo` |
| `subjectAgeYears` | No | `number` | mínimo 0; máximo 130 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `subjectSexConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/pharmacovigilance/reports HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmaProductId": "00000000-0000-4000-8000-000000000001",
  "batchNumber": "valor-ejemplo",
  "eventDate": "2026-07-31",
  "eventTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "reporterTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "reporterTenantId": "00000000-0000-4000-8000-000000000001",
  "subjectPseudonym": "valor-ejemplo",
  "subjectAgeYears": 1,
  "subjectSexConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN, PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, BUSINESS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Producto no encontrado en el catálogo del laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharmacovigilance.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | No se pudo asignar un código de caso libre | Excepción explícita en src/modules/pharma_lab/services/pharmacovigilance.service.ts |
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
  "path": "/pharma-labs/{pharmaLabId}/pharmacovigilance/reports"
}
```

---

## 24. GET /pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-pharmacovigilance`
- **Nombre:** Consultar un reporte con su trazabilidad
- **Operation ID:** `PharmacovigilanceController_getReport`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacovigilanceController.getReport](../../src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts)

### Descripción de negocio

Consultar un reporte con su trazabilidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Detalle con trazabilidad completa.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}` en `PharmacovigilanceController_getReport`. El controlador delega en `PharmacovigilanceService.getReportDetail`. No recibe body. El tipo de retorno estático es `Promise<{ /** El reporte. */ report: PharmacovigilanceReports; /** Acciones en orden cronológico. */ actions: PharmacovigilanceActions[]; }>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reportId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/pharmacovigilance/reports/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMACOVIGILANCE_OFFICER`, `PHARMA_LAB_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `reportId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/pharmacovigilance/reports/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<{ /** El reporte. */ report: PharmacovigilanceReports; /** Acciones en orden cronológico. */ actions: PharmacovigilanceActions[]; }>` | No |
| 400 | Consulta completada correctamente. | `Promise<{ /** El reporte. */ report: PharmacovigilanceReports; /** Acciones en orden cronológico. */ actions: PharmacovigilanceActions[]; }>` | No |
| 401 | Consulta completada correctamente. | `Promise<{ /** El reporte. */ report: PharmacovigilanceReports; /** Acciones en orden cronológico. */ actions: PharmacovigilanceActions[]; }>` | No |
| 403 | Consulta completada correctamente. | `Promise<{ /** El reporte. */ report: PharmacovigilanceReports; /** Acciones en orden cronológico. */ actions: PharmacovigilanceActions[]; }>` | No |
| 404 | Consulta completada correctamente. | `Promise<{ /** El reporte. */ report: PharmacovigilanceReports; /** Acciones en orden cronológico. */ actions: PharmacovigilanceActions[]; }>` | No |
| 429 | Consulta completada correctamente. | `Promise<{ /** El reporte. */ report: PharmacovigilanceReports; /** Acciones en orden cronológico. */ actions: PharmacovigilanceActions[]; }>` | No |
| 500 | Consulta completada correctamente. | `Promise<{ /** El reporte. */ report: PharmacovigilanceReports; /** Acciones en orden cronológico. */ actions: PharmacovigilanceActions[]; }>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ /** El reporte. */ report: PharmacovigilanceReports; /** Acciones en orden cronológico. */ actions: PharmacovigilanceActions[]; }`. Ejemplo completo derivado de ese DTO:

```json
{
  "report": {
    "id": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "pharmaProductId": "00000000-0000-4000-8000-000000000001",
    "caseCode": "CODIGO_EJEMPLO",
    "batchNumber": "valor-ejemplo",
    "eventDate": "valor-ejemplo",
    "eventTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "description": "Texto descriptivo de ejemplo",
    "severityConceptId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "reporterTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "reporterUserId": "00000000-0000-4000-8000-000000000001",
    "reporterTenantId": "00000000-0000-4000-8000-000000000001",
    "subjectPseudonym": "valor-ejemplo",
    "subjectAgeYears": 1,
    "subjectSexConceptId": "00000000-0000-4000-8000-000000000001",
    "receivedAt": "2026-07-31T12:00:00.000Z",
    "closedAt": "2026-07-31T12:00:00.000Z",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
  },
  "actions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "pharmacovigilanceReportId": "00000000-0000-4000-8000-000000000001",
      "actionConceptId": "00000000-0000-4000-8000-000000000001",
      "previousStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "newStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "authorityName": "Nombre de ejemplo",
      "authorityReference": "valor-ejemplo",
      "detail": "valor-ejemplo",
      "actorUserId": "00000000-0000-4000-8000-000000000001",
      "occurredAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z",
      "createdByUserId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `report` | Sí | `PharmacovigilanceReports` | Sin restricción adicional declarada | El reporte. | `{"id":"00000000-0000-4000-8000-000000000001","pharmaLabId":"00000000-0000-4000-8000-000000000001","pharmaProductId":"00000000-0000-4000-8000-000000000001","caseCode":"CODIGO_EJEMPLO","batchNumber":"valor-ejemplo","eventDate":"valor-ejemplo","eventTypeConceptId":"00000000-0000-4000-8000-000000000001","description":"Texto descriptivo de ejemplo","severityConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","reporterTypeConceptId":"00000000-0000-4000-8000-000000000001","reporterUserId":"00000000-0000-4000-8000-000000000001","reporterTenantId":"00000000-0000-4000-8000-000000000001","subjectPseudonym":"valor-ejemplo","subjectAgeYears":1,"subjectSexConceptId":"00000000-0000-4000-8000-000000000001","receivedAt":"2026-07-31T12:00:00.000Z","closedAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z","createdByUserId":"00000000-0000-4000-8000-000000000001","updatedByUserId":"00000000-0000-4000-8000-000000000001","rowVersion":1}` |
| `report.id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `report.pharmaLabId` | Sí | `string` | Sin restricción adicional declarada | Laboratorio responsable del producto. | `00000000-0000-4000-8000-000000000001` |
| `report.pharmaProductId` | Sí | `string` | Sin restricción adicional declarada | Producto involucrado. | `00000000-0000-4000-8000-000000000001` |
| `report.caseCode` | Sí | `string` | Sin restricción adicional declarada | Código de caso, legible y único por laboratorio. | `CODIGO_EJEMPLO` |
| `report.batchNumber` | No | `string` | Sin restricción adicional declarada | Lote. | `valor-ejemplo` |
| `report.eventDate` | Sí | `string` | Sin restricción adicional declarada | Fecha del evento. | `valor-ejemplo` |
| `report.eventTypeConceptId` | Sí | `string` | Sin restricción adicional declarada | Tipo de evento. | `00000000-0000-4000-8000-000000000001` |
| `report.description` | Sí | `string` | Sin restricción adicional declarada | Descripción clínica del evento, sin datos identificables. | `Texto descriptivo de ejemplo` |
| `report.severityConceptId` | Sí | `string` | Sin restricción adicional declarada | Nivel de gravedad. | `00000000-0000-4000-8000-000000000001` |
| `report.statusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado del reporte. | `00000000-0000-4000-8000-000000000001` |
| `report.reporterTypeConceptId` | Sí | `string` | Sin restricción adicional declarada | Tipo de reportante: doctor, farmacia u organización. | `00000000-0000-4000-8000-000000000001` |
| `report.reporterUserId` | Sí | `string` | Sin restricción adicional declarada | Cuenta que envió el reporte. | `00000000-0000-4000-8000-000000000001` |
| `report.reporterTenantId` | No | `string` | Sin restricción adicional declarada | Organización del reportante, cuando la hay. | `00000000-0000-4000-8000-000000000001` |
| `report.subjectPseudonym` | No | `string` | Sin restricción adicional declarada | Seudónimo del caso. Nunca un identificador de paciente del sistema. | `valor-ejemplo` |
| `report.subjectAgeYears` | No | `number` | Sin restricción adicional declarada | Edad del sujeto en años, como dato epidemiológico agregado. | `1` |
| `report.subjectSexConceptId` | No | `string` | Sin restricción adicional declarada | Sexo del sujeto, como dato epidemiológico agregado. | `00000000-0000-4000-8000-000000000001` |
| `report.receivedAt` | Sí | `string` | formato `date-time` | Momento de recepción. | `2026-07-31T12:00:00.000Z` |
| `report.closedAt` | No | `string` | formato `date-time` | Momento del cierre. | `2026-07-31T12:00:00.000Z` |
| `report.createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `report.updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |
| `report.createdByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a created by user. | `00000000-0000-4000-8000-000000000001` |
| `report.updatedByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a updated by user. | `00000000-0000-4000-8000-000000000001` |
| `report.rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión usada para controlar actualizaciones concurrentes. | `1` |
| `actions` | Sí | `array<PharmacovigilanceActions>` | Sin restricción adicional declarada | Acciones en orden cronológico. | `[{"id":"00000000-0000-4000-8000-000000000001","pharmacovigilanceReportId":"00000000-0000-4000-8000-000000000001","actionConceptId":"00000000-0000-4000-8000-000000000001","previousStatusConceptId":"00000000-0000-4000-8000-000000000001","newStatusConceptId":"00000000-0000-4000-8000-000000000001","authorityName":"Nombre de ejemplo","authorityReference":"valor-ejemplo","detail":"valor-ejemplo","actorUserId":"00000000-0000-4000-8000-000000000001","occurredAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z","createdByUserId":"00000000-0000-4000-8000-000000000001"}]` |
| `actions[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `actions[].pharmacovigilanceReportId` | Sí | `string` | Sin restricción adicional declarada | Reporte al que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `actions[].actionConceptId` | Sí | `string` | Sin restricción adicional declarada | Naturaleza de la acción. | `00000000-0000-4000-8000-000000000001` |
| `actions[].previousStatusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado del reporte antes de la acción. | `00000000-0000-4000-8000-000000000001` |
| `actions[].newStatusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado del reporte después de la acción. | `00000000-0000-4000-8000-000000000001` |
| `actions[].authorityName` | No | `string` | Sin restricción adicional declarada | Autoridad sanitaria destinataria, cuando la acción es una comunicación. | `Nombre de ejemplo` |
| `actions[].authorityReference` | No | `string` | Sin restricción adicional declarada | Número o código de la comunicación con la autoridad. | `valor-ejemplo` |
| `actions[].detail` | Sí | `string` | Sin restricción adicional declarada | Detalle de la acción. | `valor-ejemplo` |
| `actions[].actorUserId` | Sí | `string` | Sin restricción adicional declarada | Quién la ejecutó. | `00000000-0000-4000-8000-000000000001` |
| `actions[].occurredAt` | Sí | `string` | formato `date-time` | Momento en que ocurrió. | `2026-07-31T12:00:00.000Z` |
| `actions[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `actions[].createdByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a created by user. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Reporte de farmacovigilancia no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharmacovigilance.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}"
}
```

---

## 25. POST /pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}/actions

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-pharmacovigilance`
- **Nombre:** Registrar una acción de seguimiento
- **Operation ID:** `PharmacovigilanceController_addAction`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmacovigilanceController.addAction](../../src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts)

### Descripción de negocio

Registrar una acción de seguimiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}/actions` en `PharmacovigilanceController_addAction`. El controlador delega en `PharmacovigilanceService.addAction`. Valida el body como `AddPharmacovigilanceActionDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reportId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddPharmacovigilanceActionDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/pharmacovigilance/reports/00000000-0000-4000-8000-000000000001/actions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "actionConceptId": "00000000-0000-4000-8000-000000000001",
  "newStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "detail": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMACOVIGILANCE_OFFICER`, `PHARMA_LAB_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `reportId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `actionConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `newStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `detail` | Sí | `string` | longitud máxima 4000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `authorityName` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `authorityReference` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/pharmacovigilance/reports/00000000-0000-4000-8000-000000000001/actions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "actionConceptId": "00000000-0000-4000-8000-000000000001",
  "newStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "detail": "valor-ejemplo",
  "authorityName": "Nombre de ejemplo",
  "authorityReference": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Reporte de farmacovigilancia no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharmacovigilance.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | La transición de estado del reporte no está permitida | Excepción explícita en src/modules/pharma_lab/services/pharmacovigilance.service.ts |
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
  "path": "/pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}/actions"
}
```

---

## 26. GET /pharma-labs/{pharmaLabId}/products

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-catalog`
- **Nombre:** Listar el catálogo de medicamentos
- **Operation ID:** `PharmaCatalogController_listProducts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaCatalogController.listProducts](../../src/modules/pharma_lab/controllers/pharma-catalog.controller.ts)

### Descripción de negocio

Listar el catálogo de medicamentos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Catálogo del laboratorio.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}/products` en `PharmaCatalogController_listProducts`. El controlador delega en `PharmaCatalogService.listProducts`. No recibe body. El tipo de retorno estático es `Promise<PharmaProducts[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/products HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `REGULATORY_AFFAIRS`, `MEDICAL_VISITOR`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/products HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmaProducts[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<PharmaProducts[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmaProducts[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmaProducts[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<PharmaProducts[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmaProducts[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmaProducts[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmaProducts[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "tradeName": "Nombre de ejemplo",
    "activeIngredient": "valor-ejemplo",
    "presentation": "valor-ejemplo",
    "concentration": "valor-ejemplo",
    "pharmaceuticalForm": "valor-ejemplo",
    "administrationRoute": "valor-ejemplo",
    "authorizedIndication": "valor-ejemplo",
    "manufacturerName": "Nombre de ejemplo",
    "regulatoryStatusConceptId": "00000000-0000-4000-8000-000000000001",
    "sanitaryRegistryNumber": "valor-ejemplo",
    "approvedOn": "valor-ejemplo",
    "registryExpiresOn": "valor-ejemplo",
    "authorizedCountries": [
      "valor-ejemplo"
    ],
    "technicalDocumentation": {
      "clave": "valor"
    },
    "disclosureLevelConceptId": "00000000-0000-4000-8000-000000000001",
    "versionNo": 1,
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, MEDICAL_VISITOR, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/products"
}
```

---

## 27. POST /pharma-labs/{pharmaLabId}/products

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-catalog`
- **Nombre:** Registrar un medicamento en el catálogo
- **Operation ID:** `PharmaCatalogController_createProduct`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaCatalogController.createProduct](../../src/modules/pharma_lab/controllers/pharma-catalog.controller.ts)

### Descripción de negocio

Registrar un medicamento en el catálogo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/products` en `PharmaCatalogController_createProduct`. El controlador delega en `PharmaCatalogService.createProduct`. Valida el body como `CreatePharmaProductDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePharmaProductDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/products HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tradeName": "Nombre de ejemplo",
  "activeIngredient": "valor-ejemplo",
  "regulatoryStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "disclosureLevelConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `REGULATORY_AFFAIRS`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tradeName` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `activeIngredient` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `presentation` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `concentration` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pharmaceuticalForm` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `administrationRoute` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `authorizedIndication` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `manufacturerName` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `regulatoryStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sanitaryRegistryNumber` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `approvedOn` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `registryExpiresOn` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `authorizedCountries` | No | `array<string>` | longitud mínima 2; longitud máxima 2; máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["BO","PE"]` |
| `disclosureLevelConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/products HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tradeName": "Nombre de ejemplo",
  "activeIngredient": "valor-ejemplo",
  "presentation": "valor-ejemplo",
  "concentration": "valor-ejemplo",
  "pharmaceuticalForm": "valor-ejemplo",
  "administrationRoute": "valor-ejemplo",
  "authorizedIndication": "valor-ejemplo",
  "manufacturerName": "Nombre de ejemplo",
  "regulatoryStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "sanitaryRegistryNumber": "valor-ejemplo",
  "approvedOn": "2026-07-31",
  "registryExpiresOn": "2026-07-31",
  "authorizedCountries": [
    "BO",
    "PE"
  ],
  "disclosureLevelConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No se puede declarar una indicación autorizada en un producto que no está aprobado | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El laboratorio no está activo | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/products"
}
```

---

## 28. PATCH /pharma-labs/{pharmaLabId}/products/{productId}

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-catalog`
- **Nombre:** Actualizar un medicamento
- **Operation ID:** `PharmaCatalogController_updateProduct`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaCatalogController.updateProduct](../../src/modules/pharma_lab/controllers/pharma-catalog.controller.ts)

### Descripción de negocio

Actualizar un medicamento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /pharma-labs/{pharmaLabId}/products/{productId}` en `PharmaCatalogController_updateProduct`. El controlador delega en `PharmaCatalogService.updateProduct`. Valida el body como `UpdatePharmaProductDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `productId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdatePharmaProductDto`; los campos opcionales se omiten.

```http
PATCH /pharma-labs/00000000-0000-4000-8000-000000000001/products/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `REGULATORY_AFFAIRS`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `productId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `presentation` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `concentration` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `authorizedIndication` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sanitaryRegistryNumber` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `registryExpiresOn` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `authorizedCountries` | No | `array<string>` | longitud mínima 2; longitud máxima 2; máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `disclosureLevelConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /pharma-labs/00000000-0000-4000-8000-000000000001/products/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "presentation": "valor-ejemplo",
  "concentration": "valor-ejemplo",
  "authorizedIndication": "valor-ejemplo",
  "sanitaryRegistryNumber": "valor-ejemplo",
  "registryExpiresOn": "2026-07-31",
  "authorizedCountries": [
    "valor-ejemplo"
  ],
  "disclosureLevelConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Producto no encontrado en el catálogo del laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No se puede declarar una indicación autorizada en un producto que no está aprobado | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/products/{productId}"
}
```

---

## 29. POST /pharma-labs/{pharmaLabId}/products/{productId}/status

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-catalog`
- **Nombre:** Cambiar el estado regulatorio de un medicamento
- **Operation ID:** `PharmaCatalogController_changeProductStatus`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaCatalogController.changeProductStatus](../../src/modules/pharma_lab/controllers/pharma-catalog.controller.ts)

### Descripción de negocio

Cambiar el estado regulatorio de un medicamento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/products/{productId}/status` en `PharmaCatalogController_changeProductStatus`. El controlador delega en `PharmaCatalogService.changeProductStatus`. Valida el body como `ChangeProductStatusDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `productId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ChangeProductStatusDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/products/00000000-0000-4000-8000-000000000001/status HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "regulatoryStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `REGULATORY_AFFAIRS`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `productId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `regulatoryStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reason` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/products/00000000-0000-4000-8000-000000000001/status HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "regulatoryStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Producto no encontrado en el catálogo del laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | La transición de estado regulatorio no está permitida | Excepción explícita en src/modules/pharma_lab/services/pharma-catalog.service.ts |
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
  "path": "/pharma-labs/{pharmaLabId}/products/{productId}/status"
}
```

---

## 30. GET /pharma-labs/{pharmaLabId}/regulatory-documents

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-regulatory`
- **Nombre:** Listar los documentos del laboratorio
- **Operation ID:** `RegulatoryDocumentsController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RegulatoryDocumentsController.list](../../src/modules/pharma_lab/controllers/regulatory-documents.controller.ts)

### Descripción de negocio

Listar los documentos del laboratorio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Listado del repositorio.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}/regulatory-documents` en `RegulatoryDocumentsController_list`. El controlador delega en `RegulatoryDocumentsService.listDocuments`. No recibe body. El tipo de retorno estático es `Promise<RegulatoryDocuments[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REGULATORY_AFFAIRS`, `PHARMA_LAB_ADMIN`, `LEGAL_COUNSEL`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RegulatoryDocuments[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<RegulatoryDocuments[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<RegulatoryDocuments[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<RegulatoryDocuments[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<RegulatoryDocuments[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<RegulatoryDocuments[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<RegulatoryDocuments[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RegulatoryDocuments[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "pharmaProductId": "00000000-0000-4000-8000-000000000001",
    "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
    "name": "Nombre de ejemplo",
    "documentTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "code": "CODIGO_EJEMPLO",
    "currentVersion": "valor-ejemplo",
    "issuerName": "Nombre de ejemplo",
    "issuedOn": "valor-ejemplo",
    "expiresOn": "valor-ejemplo",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "ownerStaffId": "00000000-0000-4000-8000-000000000001",
    "disclosureLevelConceptId": "00000000-0000-4000-8000-000000000001",
    "expiryAlertDays": 1,
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/regulatory-documents"
}
```

---

## 31. POST /pharma-labs/{pharmaLabId}/regulatory-documents

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-regulatory`
- **Nombre:** Registrar un documento con su primera versión
- **Operation ID:** `RegulatoryDocumentsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RegulatoryDocumentsController.create](../../src/modules/pharma_lab/controllers/regulatory-documents.controller.ts)

### Descripción de negocio

Registrar un documento con su primera versión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/regulatory-documents` en `RegulatoryDocumentsController_create`. El controlador delega en `RegulatoryDocumentsService.createDocument`. Valida el body como `CreateRegulatoryDocumentDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateRegulatoryDocumentDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "documentTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "version": "v1",
  "disclosureLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "fileName": "Nombre de ejemplo",
  "storageKey": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REGULATORY_AFFAIRS`, `PHARMA_LAB_ADMIN`, `LEGAL_COUNSEL`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `documentTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `version` | Sí | `string` | longitud máxima 32 | Sin descripción específica en el contrato OpenAPI. | `v1` |
| `issuerName` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `issuedOn` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `expiresOn` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `pharmaProductId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `medicalVisitorId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ownerStaffId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `disclosureLevelConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `expiryAlertDays` | No | `number` | mínimo 1; máximo 365 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `fileName` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `storageKey` | Sí | `string` | longitud máxima 512 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `contentType` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "documentTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "version": "v1",
  "issuerName": "Nombre de ejemplo",
  "issuedOn": "2026-07-31",
  "expiresOn": "2026-07-31",
  "pharmaProductId": "00000000-0000-4000-8000-000000000001",
  "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
  "ownerStaffId": "00000000-0000-4000-8000-000000000001",
  "disclosureLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "expiryAlertDays": 1,
  "fileName": "Nombre de ejemplo",
  "storageKey": "valor-ejemplo",
  "contentType": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El laboratorio no está activo | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/regulatory-documents"
}
```

---

## 32. GET /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-regulatory`
- **Nombre:** Consultar un documento y sus versiones
- **Operation ID:** `RegulatoryDocumentsController_getOne`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RegulatoryDocumentsController.getOne](../../src/modules/pharma_lab/controllers/regulatory-documents.controller.ts)

### Descripción de negocio

Consultar un documento y sus versiones. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Consulta de un documento; queda registrada (spec 5629).

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}` en `RegulatoryDocumentsController_getOne`. El controlador delega en `RegulatoryDocumentsService.getDocument`. No recibe body. El tipo de retorno estático es `Promise<{ /** El documento. */ document: RegulatoryDocuments; /** Versiones, de la más reciente a la más antigua. */ versions: RegulatoryDocumentVersions[]; }>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `documentId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REGULATORY_AFFAIRS`, `PHARMA_LAB_ADMIN`, `LEGAL_COUNSEL`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `documentId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<{ /** El documento. */ document: RegulatoryDocuments; /** Versiones, de la más reciente a la más antigua. */ versions: RegulatoryDocumentVersions[]; }>` | No |
| 400 | Consulta completada correctamente. | `Promise<{ /** El documento. */ document: RegulatoryDocuments; /** Versiones, de la más reciente a la más antigua. */ versions: RegulatoryDocumentVersions[]; }>` | No |
| 401 | Consulta completada correctamente. | `Promise<{ /** El documento. */ document: RegulatoryDocuments; /** Versiones, de la más reciente a la más antigua. */ versions: RegulatoryDocumentVersions[]; }>` | No |
| 403 | Consulta completada correctamente. | `Promise<{ /** El documento. */ document: RegulatoryDocuments; /** Versiones, de la más reciente a la más antigua. */ versions: RegulatoryDocumentVersions[]; }>` | No |
| 404 | Consulta completada correctamente. | `Promise<{ /** El documento. */ document: RegulatoryDocuments; /** Versiones, de la más reciente a la más antigua. */ versions: RegulatoryDocumentVersions[]; }>` | No |
| 429 | Consulta completada correctamente. | `Promise<{ /** El documento. */ document: RegulatoryDocuments; /** Versiones, de la más reciente a la más antigua. */ versions: RegulatoryDocumentVersions[]; }>` | No |
| 500 | Consulta completada correctamente. | `Promise<{ /** El documento. */ document: RegulatoryDocuments; /** Versiones, de la más reciente a la más antigua. */ versions: RegulatoryDocumentVersions[]; }>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ /** El documento. */ document: RegulatoryDocuments; /** Versiones, de la más reciente a la más antigua. */ versions: RegulatoryDocumentVersions[]; }`. Ejemplo completo derivado de ese DTO:

```json
{
  "document": {
    "id": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "pharmaProductId": "00000000-0000-4000-8000-000000000001",
    "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
    "name": "Nombre de ejemplo",
    "documentTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "code": "CODIGO_EJEMPLO",
    "currentVersion": "valor-ejemplo",
    "issuerName": "Nombre de ejemplo",
    "issuedOn": "valor-ejemplo",
    "expiresOn": "valor-ejemplo",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "ownerStaffId": "00000000-0000-4000-8000-000000000001",
    "disclosureLevelConceptId": "00000000-0000-4000-8000-000000000001",
    "expiryAlertDays": 1,
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
  },
  "versions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "regulatoryDocumentId": "00000000-0000-4000-8000-000000000001",
      "version": "valor-ejemplo",
      "storageKey": "valor-ejemplo",
      "fileName": "Nombre de ejemplo",
      "contentType": "valor-ejemplo",
      "issuedOn": "valor-ejemplo",
      "expiresOn": "valor-ejemplo",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "changeReason": "Texto descriptivo de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z",
      "updatedAt": "2026-07-31T12:00:00.000Z",
      "createdByUserId": "00000000-0000-4000-8000-000000000001",
      "updatedByUserId": "00000000-0000-4000-8000-000000000001",
      "rowVersion": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `document` | Sí | `RegulatoryDocuments` | Sin restricción adicional declarada | El documento. | `{"id":"00000000-0000-4000-8000-000000000001","pharmaLabId":"00000000-0000-4000-8000-000000000001","pharmaProductId":"00000000-0000-4000-8000-000000000001","medicalVisitorId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","documentTypeConceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","currentVersion":"valor-ejemplo","issuerName":"Nombre de ejemplo","issuedOn":"valor-ejemplo","expiresOn":"valor-ejemplo","statusConceptId":"00000000-0000-4000-8000-000000000001","ownerStaffId":"00000000-0000-4000-8000-000000000001","disclosureLevelConceptId":"00000000-0000-4000-8000-000000000001","expiryAlertDays":1,"createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z","createdByUserId":"00000000-0000-4000-8000-000000000001","updatedByUserId":"00000000-0000-4000-8000-000000000001","rowVersion":1}` |
| `document.id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `document.pharmaLabId` | Sí | `string` | Sin restricción adicional declarada | Laboratorio propietario. | `00000000-0000-4000-8000-000000000001` |
| `document.pharmaProductId` | No | `string` | Sin restricción adicional declarada | Producto al que respalda, si aplica. | `00000000-0000-4000-8000-000000000001` |
| `document.medicalVisitorId` | No | `string` | Sin restricción adicional declarada | Visitador al que respalda, si aplica (contrato, credenciales). | `00000000-0000-4000-8000-000000000001` |
| `document.name` | Sí | `string` | Sin restricción adicional declarada | Nombre del documento. | `Nombre de ejemplo` |
| `document.documentTypeConceptId` | Sí | `string` | Sin restricción adicional declarada | Tipo documental. | `00000000-0000-4000-8000-000000000001` |
| `document.code` | No | `string` | Sin restricción adicional declarada | Código del documento. | `CODIGO_EJEMPLO` |
| `document.currentVersion` | Sí | `string` | Sin restricción adicional declarada | Versión vigente. | `valor-ejemplo` |
| `document.issuerName` | No | `string` | Sin restricción adicional declarada | Entidad emisora. | `Nombre de ejemplo` |
| `document.issuedOn` | No | `string` | Sin restricción adicional declarada | Fecha de emisión. | `valor-ejemplo` |
| `document.expiresOn` | No | `string` | Sin restricción adicional declarada | Fecha de vencimiento. Alimenta la alerta por vencimiento (spec 5626). | `valor-ejemplo` |
| `document.statusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado: vigente, próximo a vencer, vencido, sustituido o invalidado. | `00000000-0000-4000-8000-000000000001` |
| `document.ownerStaffId` | No | `string` | Sin restricción adicional declarada | Responsable del documento. | `00000000-0000-4000-8000-000000000001` |
| `document.disclosureLevelConceptId` | Sí | `string` | Sin restricción adicional declarada | Nivel de confidencialidad. | `00000000-0000-4000-8000-000000000001` |
| `document.expiryAlertDays` | Sí | `number` | Sin restricción adicional declarada | Días de antelación con que se avisa el vencimiento. | `1` |
| `document.createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `document.updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |
| `document.createdByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a created by user. | `00000000-0000-4000-8000-000000000001` |
| `document.updatedByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a updated by user. | `00000000-0000-4000-8000-000000000001` |
| `document.rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión usada para controlar actualizaciones concurrentes. | `1` |
| `versions` | Sí | `array<RegulatoryDocumentVersions>` | Sin restricción adicional declarada | Versiones, de la más reciente a la más antigua. | `[{"id":"00000000-0000-4000-8000-000000000001","regulatoryDocumentId":"00000000-0000-4000-8000-000000000001","version":"valor-ejemplo","storageKey":"valor-ejemplo","fileName":"Nombre de ejemplo","contentType":"valor-ejemplo","issuedOn":"valor-ejemplo","expiresOn":"valor-ejemplo","statusConceptId":"00000000-0000-4000-8000-000000000001","changeReason":"Texto descriptivo de ejemplo","createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z","createdByUserId":"00000000-0000-4000-8000-000000000001","updatedByUserId":"00000000-0000-4000-8000-000000000001","rowVersion":1}]` |
| `versions[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versions[].regulatoryDocumentId` | Sí | `string` | Sin restricción adicional declarada | Documento al que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `versions[].version` | Sí | `string` | Sin restricción adicional declarada | Etiqueta de versión. | `valor-ejemplo` |
| `versions[].storageKey` | Sí | `string` | Sin restricción adicional declarada | Referencia del archivo en el almacén. | `valor-ejemplo` |
| `versions[].fileName` | Sí | `string` | Sin restricción adicional declarada | Nombre visible del archivo. | `Nombre de ejemplo` |
| `versions[].contentType` | No | `string` | Sin restricción adicional declarada | Tipo MIME. | `valor-ejemplo` |
| `versions[].issuedOn` | No | `string` | Sin restricción adicional declarada | Fecha de emisión de esta versión. | `valor-ejemplo` |
| `versions[].expiresOn` | No | `string` | Sin restricción adicional declarada | Fecha de vencimiento de esta versión. | `valor-ejemplo` |
| `versions[].statusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado de la versión: vigente, sustituida o invalidada. | `00000000-0000-4000-8000-000000000001` |
| `versions[].changeReason` | No | `string` | Sin restricción adicional declarada | Motivo de la sustitución o invalidación. | `Texto descriptivo de ejemplo` |
| `versions[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `versions[].updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |
| `versions[].createdByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a created by user. | `00000000-0000-4000-8000-000000000001` |
| `versions[].updatedByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a updated by user. | `00000000-0000-4000-8000-000000000001` |
| `versions[].rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión usada para controlar actualizaciones concurrentes. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Documento no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/regulatory-documents.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}"
}
```

---

## 33. GET /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/access-log

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-regulatory`
- **Nombre:** Registro de consultas y descargas
- **Operation ID:** `RegulatoryDocumentsController_accessLog`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RegulatoryDocumentsController.accessLog](../../src/modules/pharma_lab/controllers/regulatory-documents.controller.ts)

### Descripción de negocio

Registro de consultas y descargas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Registro de consultas y descargas del documento.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/access-log` en `RegulatoryDocumentsController_accessLog`. El controlador delega en `RegulatoryDocumentsService.listAccessLog`. No recibe body. El tipo de retorno estático es `Promise<RegulatoryDocumentAccessLog[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `documentId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents/00000000-0000-4000-8000-000000000001/access-log HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REGULATORY_AFFAIRS`, `PHARMA_LAB_ADMIN`, `LEGAL_COUNSEL`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `documentId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents/00000000-0000-4000-8000-000000000001/access-log HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RegulatoryDocumentAccessLog[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<RegulatoryDocumentAccessLog[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<RegulatoryDocumentAccessLog[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<RegulatoryDocumentAccessLog[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<RegulatoryDocumentAccessLog[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<RegulatoryDocumentAccessLog[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<RegulatoryDocumentAccessLog[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RegulatoryDocumentAccessLog[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "regulatoryDocumentId": "00000000-0000-4000-8000-000000000001",
    "regulatoryDocumentVersionId": "00000000-0000-4000-8000-000000000001",
    "accessKind": "valor-ejemplo",
    "actorUserId": "00000000-0000-4000-8000-000000000001",
    "accessedAt": "2026-07-31T12:00:00.000Z",
    "createdAt": "2026-07-31T12:00:00.000Z"
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Documento no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/regulatory-documents.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/access-log"
}
```

---

## 34. POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/invalidate

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-regulatory`
- **Nombre:** Invalidar el documento sin borrarlo
- **Operation ID:** `RegulatoryDocumentsController_invalidate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RegulatoryDocumentsController.invalidate](../../src/modules/pharma_lab/controllers/regulatory-documents.controller.ts)

### Descripción de negocio

Invalidar el documento sin borrarlo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/invalidate` en `RegulatoryDocumentsController_invalidate`. El controlador delega en `RegulatoryDocumentsService.invalidateDocument`. Valida el body como `InvalidateDocumentDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `documentId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `InvalidateDocumentDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents/00000000-0000-4000-8000-000000000001/invalidate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REGULATORY_AFFAIRS`, `PHARMA_LAB_ADMIN`, `LEGAL_COUNSEL`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `documentId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents/00000000-0000-4000-8000-000000000001/invalidate HTTP/1.1
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
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Documento no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/regulatory-documents.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | El documento ya está invalidado | Excepción explícita en src/modules/pharma_lab/services/regulatory-documents.service.ts |
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
  "path": "/pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/invalidate"
}
```

---

## 35. POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-regulatory`
- **Nombre:** Sustituir el documento por una versión nueva
- **Operation ID:** `RegulatoryDocumentsController_addVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RegulatoryDocumentsController.addVersion](../../src/modules/pharma_lab/controllers/regulatory-documents.controller.ts)

### Descripción de negocio

Sustituir el documento por una versión nueva. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions` en `RegulatoryDocumentsController_addVersion`. El controlador delega en `RegulatoryDocumentsService.addVersion`. Valida el body como `AddDocumentVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `documentId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddDocumentVersionDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "version": "v2",
  "fileName": "Nombre de ejemplo",
  "storageKey": "valor-ejemplo",
  "changeReason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REGULATORY_AFFAIRS`, `PHARMA_LAB_ADMIN`, `LEGAL_COUNSEL`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `documentId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `version` | Sí | `string` | longitud máxima 32 | Sin descripción específica en el contrato OpenAPI. | `v2` |
| `fileName` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `storageKey` | Sí | `string` | longitud máxima 512 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `contentType` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `issuedOn` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `expiresOn` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `changeReason` | Sí | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "version": "v2",
  "fileName": "Nombre de ejemplo",
  "storageKey": "valor-ejemplo",
  "contentType": "valor-ejemplo",
  "issuedOn": "2026-07-31",
  "expiresOn": "2026-07-31",
  "changeReason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Documento no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/regulatory-documents.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | Un documento invalidado no admite versiones nuevas | Excepción explícita en src/modules/pharma_lab/services/regulatory-documents.service.ts |
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
  "path": "/pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions"
}
```

---

## 36. POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions/{versionId}/download

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-regulatory`
- **Nombre:** Registrar la descarga de una versión
- **Operation ID:** `RegulatoryDocumentsController_download`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RegulatoryDocumentsController.download](../../src/modules/pharma_lab/controllers/regulatory-documents.controller.ts)

### Descripción de negocio

Registrar la descarga de una versión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Descarga de una versión; queda registrada.

### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions/{versionId}/download` en `RegulatoryDocumentsController_download`. El controlador delega en `RegulatoryDocumentsService.registerDownload`. No recibe body. El tipo de retorno estático es `Promise<RegulatoryDocumentVersions>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `documentId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000001/download HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REGULATORY_AFFAIRS`, `PHARMA_LAB_ADMIN`, `LEGAL_COUNSEL`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `documentId`, `versionId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000001/download HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RegulatoryDocumentVersions>` | No |
| 400 | Operación completada correctamente. | `Promise<RegulatoryDocumentVersions>` | No |
| 401 | Operación completada correctamente. | `Promise<RegulatoryDocumentVersions>` | No |
| 403 | Operación completada correctamente. | `Promise<RegulatoryDocumentVersions>` | No |
| 404 | Operación completada correctamente. | `Promise<RegulatoryDocumentVersions>` | No |
| 409 | Operación completada correctamente. | `Promise<RegulatoryDocumentVersions>` | No |
| 422 | Operación completada correctamente. | `Promise<RegulatoryDocumentVersions>` | No |
| 429 | Operación completada correctamente. | `Promise<RegulatoryDocumentVersions>` | No |
| 500 | Operación completada correctamente. | `Promise<RegulatoryDocumentVersions>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RegulatoryDocumentVersions`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "regulatoryDocumentId": "00000000-0000-4000-8000-000000000001",
  "version": "valor-ejemplo",
  "storageKey": "valor-ejemplo",
  "fileName": "Nombre de ejemplo",
  "contentType": "valor-ejemplo",
  "issuedOn": "valor-ejemplo",
  "expiresOn": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "changeReason": "Texto descriptivo de ejemplo",
  "createdAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "createdByUserId": "00000000-0000-4000-8000-000000000001",
  "updatedByUserId": "00000000-0000-4000-8000-000000000001",
  "rowVersion": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `regulatoryDocumentId` | Sí | `string` | Sin restricción adicional declarada | Documento al que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `version` | Sí | `string` | Sin restricción adicional declarada | Etiqueta de versión. | `valor-ejemplo` |
| `storageKey` | Sí | `string` | Sin restricción adicional declarada | Referencia del archivo en el almacén. | `valor-ejemplo` |
| `fileName` | Sí | `string` | Sin restricción adicional declarada | Nombre visible del archivo. | `Nombre de ejemplo` |
| `contentType` | No | `string` | Sin restricción adicional declarada | Tipo MIME. | `valor-ejemplo` |
| `issuedOn` | No | `string` | Sin restricción adicional declarada | Fecha de emisión de esta versión. | `valor-ejemplo` |
| `expiresOn` | No | `string` | Sin restricción adicional declarada | Fecha de vencimiento de esta versión. | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado de la versión: vigente, sustituida o invalidada. | `00000000-0000-4000-8000-000000000001` |
| `changeReason` | No | `string` | Sin restricción adicional declarada | Motivo de la sustitución o invalidación. | `Texto descriptivo de ejemplo` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |
| `createdByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a created by user. | `00000000-0000-4000-8000-000000000001` |
| `updatedByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a updated by user. | `00000000-0000-4000-8000-000000000001` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión usada para controlar actualizaciones concurrentes. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión no encontrada | Excepción explícita en src/modules/pharma_lab/services/regulatory-documents.service.ts |
| 404 | `NOT_FOUND` | Documento no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/regulatory-documents.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions/{versionId}/download"
}
```

---

## 37. POST /pharma-labs/{pharmaLabId}/regulatory-documents/expirations/review

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-regulatory`
- **Nombre:** Revisar vencimientos y notificar al personal
- **Operation ID:** `RegulatoryDocumentsController_reviewExpirations`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RegulatoryDocumentsController.reviewExpirations](../../src/modules/pharma_lab/controllers/regulatory-documents.controller.ts)

### Descripción de negocio

Revisar vencimientos y notificar al personal. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Revisión de vencimientos y alertas (spec 5626).

### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/regulatory-documents/expirations/review` en `RegulatoryDocumentsController_reviewExpirations`. El controlador delega en `RegulatoryDocumentsService.reviewExpirations`. No recibe body. El tipo de retorno estático es `Promise<{ /** Documentos que pasaron a «próximo a vencer». */ expiring: number; /** Documentos que pasaron a «vencido». */ expired: number; }>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents/expirations/review HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `REGULATORY_AFFAIRS`, `PHARMA_LAB_ADMIN`, `LEGAL_COUNSEL`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/regulatory-documents/expirations/review HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<{ /** Documentos que pasaron a «próximo a vencer». */ expiring: number; /** Documentos que pasaron a «vencido». */ expired: number; }>` | No |
| 400 | Operación completada correctamente. | `Promise<{ /** Documentos que pasaron a «próximo a vencer». */ expiring: number; /** Documentos que pasaron a «vencido». */ expired: number; }>` | No |
| 401 | Operación completada correctamente. | `Promise<{ /** Documentos que pasaron a «próximo a vencer». */ expiring: number; /** Documentos que pasaron a «vencido». */ expired: number; }>` | No |
| 403 | Operación completada correctamente. | `Promise<{ /** Documentos que pasaron a «próximo a vencer». */ expiring: number; /** Documentos que pasaron a «vencido». */ expired: number; }>` | No |
| 404 | Operación completada correctamente. | `Promise<{ /** Documentos que pasaron a «próximo a vencer». */ expiring: number; /** Documentos que pasaron a «vencido». */ expired: number; }>` | No |
| 409 | Operación completada correctamente. | `Promise<{ /** Documentos que pasaron a «próximo a vencer». */ expiring: number; /** Documentos que pasaron a «vencido». */ expired: number; }>` | No |
| 422 | Operación completada correctamente. | `Promise<{ /** Documentos que pasaron a «próximo a vencer». */ expiring: number; /** Documentos que pasaron a «vencido». */ expired: number; }>` | No |
| 429 | Operación completada correctamente. | `Promise<{ /** Documentos que pasaron a «próximo a vencer». */ expiring: number; /** Documentos que pasaron a «vencido». */ expired: number; }>` | No |
| 500 | Operación completada correctamente. | `Promise<{ /** Documentos que pasaron a «próximo a vencer». */ expiring: number; /** Documentos que pasaron a «vencido». */ expired: number; }>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ /** Documentos que pasaron a «próximo a vencer». */ expiring: number; /** Documentos que pasaron a «vencido». */ expired: number; }`. Ejemplo completo derivado de ese DTO:

```json
{
  "expiring": 1,
  "expired": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expiring` | Sí | `number` | Sin restricción adicional declarada | Documentos que pasaron a «próximo a vencer». | `1` |
| `expired` | Sí | `number` | Sin restricción adicional declarada | Documentos que pasaron a «vencido». | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/regulatory-documents/expirations/review"
}
```

---

## 38. GET /pharma-labs/{pharmaLabId}/staff

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-labs`
- **Nombre:** Listar el personal del laboratorio
- **Operation ID:** `PharmaLabsController_listStaff`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabsController.listStaff](../../src/modules/pharma_lab/controllers/pharma-labs.controller.ts)

### Descripción de negocio

Listar el personal del laboratorio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Listado del personal.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}/staff` en `PharmaLabsController_listStaff`. El controlador delega en `PharmaLabOrganizationService.listStaff`. No recibe body. El tipo de retorno estático es `Promise<PharmaLabStaff[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/staff HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/staff HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmaLabStaff[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<PharmaLabStaff[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmaLabStaff[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmaLabStaff[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<PharmaLabStaff[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmaLabStaff[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmaLabStaff[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmaLabStaff[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "userId": "00000000-0000-4000-8000-000000000001",
    "staffTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "roleCode": "CODIGO_EJEMPLO",
    "position": "valor-ejemplo",
    "area": "valor-ejemplo",
    "branchId": "00000000-0000-4000-8000-000000000001",
    "workSchedule": "valor-ejemplo",
    "hiredOn": "valor-ejemplo",
    "endedOn": "valor-ejemplo",
    "permissions": [
      "valor-ejemplo"
    ],
    "credentialVerificationConceptId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/staff"
}
```

---

## 39. POST /pharma-labs/{pharmaLabId}/staff

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-labs`
- **Nombre:** Vincular personal al laboratorio
- **Operation ID:** `PharmaLabsController_linkStaff`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabsController.linkStaff](../../src/modules/pharma_lab/controllers/pharma-labs.controller.ts)

### Descripción de negocio

Vincular personal al laboratorio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/staff` en `PharmaLabsController_linkStaff`. El controlador delega en `PharmaLabOrganizationService.linkStaff`. Valida el body como `LinkStaffDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LinkStaffDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/staff HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001",
  "staffTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "hiredOn": "2026-07-31"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `userId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `staffTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `roleCode` | No | `string` | longitud máxima 64 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `position` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `area` | No | `string` | longitud máxima 128 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `branchId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `workSchedule` | No | `string` | longitud máxima 64 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `hiredOn` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `permissions` | No | `array<string>` | máximo 100 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/staff HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001",
  "staffTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "roleCode": "CODIGO_EJEMPLO",
  "position": "valor-ejemplo",
  "area": "valor-ejemplo",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "workSchedule": "valor-ejemplo",
  "hiredOn": "2026-07-31",
  "permissions": [
    "valor-ejemplo"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | La cuenta ya está vinculada al laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-organization.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El laboratorio no está activo | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/staff"
}
```

---

## 40. PATCH /pharma-labs/{pharmaLabId}/staff/{staffId}/permissions

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-labs`
- **Nombre:** Cambiar los permisos de un colaborador
- **Operation ID:** `PharmaLabsController_updatePermissions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabsController.updatePermissions](../../src/modules/pharma_lab/controllers/pharma-labs.controller.ts)

### Descripción de negocio

Cambiar los permisos de un colaborador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /pharma-labs/{pharmaLabId}/staff/{staffId}/permissions` en `PharmaLabsController_updatePermissions`. El controlador delega en `PharmaLabOrganizationService.updateStaffPermissions`. Valida el body como `UpdateStaffPermissionsDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `staffId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateStaffPermissionsDto`; los campos opcionales se omiten.

```http
PATCH /pharma-labs/00000000-0000-4000-8000-000000000001/staff/00000000-0000-4000-8000-000000000001/permissions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "permissions": [
    "valor-ejemplo"
  ],
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `staffId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `permissions` | Sí | `array<string>` | máximo 100 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `reason` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /pharma-labs/00000000-0000-4000-8000-000000000001/staff/00000000-0000-4000-8000-000000000001/permissions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "permissions": [
    "valor-ejemplo"
  ],
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ficha de personal no encontrada en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-organization.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
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
  "path": "/pharma-labs/{pharmaLabId}/staff/{staffId}/permissions"
}
```

---

## 41. POST /pharma-labs/{pharmaLabId}/staff/{staffId}/unlink

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-labs`
- **Nombre:** Desvincular a un colaborador
- **Operation ID:** `PharmaLabsController_unlinkStaff`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabsController.unlinkStaff](../../src/modules/pharma_lab/controllers/pharma-labs.controller.ts)

### Descripción de negocio

Desvincular a un colaborador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/staff/{staffId}/unlink` en `PharmaLabsController_unlinkStaff`. El controlador delega en `PharmaLabOrganizationService.unlinkStaff`. Valida el body como `UnlinkDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `staffId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UnlinkDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/staff/00000000-0000-4000-8000-000000000001/unlink HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `staffId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `effectiveOn` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/staff/00000000-0000-4000-8000-000000000001/unlink HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo",
  "effectiveOn": "2026-07-31"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ficha de personal no encontrada en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-organization.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
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
  "path": "/pharma-labs/{pharmaLabId}/staff/{staffId}/unlink"
}
```

---

## 42. GET /pharma-labs/{pharmaLabId}/visitor-posts

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-social-accounting`
- **Nombre:** Listar las publicaciones propuestas
- **Operation ID:** `PharmaLabSocialController_listPosts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabSocialController.listPosts](../../src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts)

### Descripción de negocio

Listar las publicaciones propuestas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Propuestas pendientes y resueltas del laboratorio.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/{pharmaLabId}/visitor-posts` en `PharmaLabSocialController_listPosts`. El controlador delega en `PharmaSocialService.listSubmissions`. No recibe body. El tipo de retorno estático es `Promise<VisitorPostSubmissions[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/visitor-posts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/00000000-0000-4000-8000-000000000001/visitor-posts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VisitorPostSubmissions[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<VisitorPostSubmissions[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<VisitorPostSubmissions[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<VisitorPostSubmissions[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<VisitorPostSubmissions[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<VisitorPostSubmissions[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<VisitorPostSubmissions[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VisitorPostSubmissions[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
    "body": "valor-ejemplo",
    "informationalMaterialId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "decisionRationale": "valor-ejemplo",
    "decidedByUserId": "00000000-0000-4000-8000-000000000001",
    "decidedAt": "2026-07-31T12:00:00.000Z",
    "socialPostId": "00000000-0000-4000-8000-000000000001",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/visitor-posts"
}
```

---

## 43. POST /pharma-labs/{pharmaLabId}/visitor-posts/{submissionId}/decision

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-social-accounting`
- **Nombre:** Aprobar o rechazar la publicación propuesta
- **Operation ID:** `PharmaLabSocialController_decidePost`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabSocialController.decidePost](../../src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts)

### Descripción de negocio

Aprobar o rechazar la publicación propuesta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/{pharmaLabId}/visitor-posts/{submissionId}/decision` en `PharmaLabSocialController_decidePost`. El controlador delega en `PharmaSocialService.decide`. Valida el body como `DecideVisitorPostDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `submissionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DecideVisitorPostDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/visitor-posts/00000000-0000-4000-8000-000000000001/decision HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "rationale": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `submissionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `statusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `rationale` | Sí | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/00000000-0000-4000-8000-000000000001/visitor-posts/00000000-0000-4000-8000-000000000001/decision HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "rationale": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Propuesta no encontrada | Excepción explícita en src/modules/pharma_lab/services/pharma-social.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 404 | `NOT_FOUND` | Visitador no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | La propuesta ya fue resuelta | Excepción explícita en src/modules/pharma_lab/services/pharma-social.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La decisión debe ser aprobar o rechazar | Excepción explícita en src/modules/pharma_lab/services/pharma-social.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/{pharmaLabId}/visitor-posts/{submissionId}/decision"
}
```

---

## 44. POST /pharma-labs/notices/{noticeId}/read

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-notices`
- **Nombre:** Marcar un aviso como leído
- **Operation ID:** `PharmaLabNoticesController_markRead`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabNoticesController.markRead](../../src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts)

### Descripción de negocio

Marcar un aviso como leído. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Marca un aviso propio como leído.

### Descripción del sistema

NestJS resuelve `POST /pharma-labs/notices/{noticeId}/read` en `PharmaLabNoticesController_markRead`. El controlador delega en `PharmaLabNotificationsService.markRead`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `noticeId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /pharma-labs/notices/00000000-0000-4000-8000-000000000001/read HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `noticeId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /pharma-labs/notices/00000000-0000-4000-8000-000000000001/read HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 204 | Operación completada sin cuerpo de respuesta. | `Promise<void>` | No |
| 400 | Operación completada correctamente. | `Promise<void>` | No |
| 401 | Operación completada correctamente. | `Promise<void>` | No |
| 403 | Operación completada correctamente. | `Promise<void>` | No |
| 404 | Operación completada correctamente. | `Promise<void>` | No |
| 409 | Operación completada correctamente. | `Promise<void>` | No |
| 422 | Operación completada correctamente. | `Promise<void>` | No |
| 429 | Operación completada correctamente. | `Promise<void>` | No |
| 500 | Operación completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/notices/{noticeId}/read"
}
```

---

## 45. GET /pharma-labs/notices/mine

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-notices`
- **Nombre:** Avisos del laboratorio dirigidos a mi cuenta
- **Operation ID:** `PharmaLabNoticesController_listMine`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabNoticesController.listMine](../../src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts)

### Descripción de negocio

Avisos del laboratorio dirigidos a mi cuenta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Avisos de la persona autenticada.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/notices/mine` en `PharmaLabNoticesController_listMine`. El controlador delega en `PharmaLabNotificationsService.listOwn`. No recibe body. El tipo de retorno estático es `Promise<PharmaLabNotices[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/notices/mine HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/notices/mine HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PharmaLabNotices[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<PharmaLabNotices[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<PharmaLabNotices[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<PharmaLabNotices[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<PharmaLabNotices[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<PharmaLabNotices[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PharmaLabNotices[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "recipientUserId": "00000000-0000-4000-8000-000000000001",
    "tenantId": "00000000-0000-4000-8000-000000000001",
    "templateCode": "CODIGO_EJEMPLO",
    "subject": "valor-ejemplo",
    "bodyText": "valor-ejemplo",
    "relatedResourceType": "valor-ejemplo",
    "relatedResourceId": "00000000-0000-4000-8000-000000000001",
    "isRead": true,
    "readAt": "2026-07-31T12:00:00.000Z",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/notices/mine"
}
```

---

## 46. GET /pharma-labs/reference/concepts

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-reference`
- **Nombre:** Diccionario de conceptos del laboratorio farmacéutico
- **Operation ID:** `PharmaLabReferenceController_listConcepts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabReferenceController.listConcepts](../../src/modules/pharma_lab/controllers/pharma-lab-reference.controller.ts)

### Descripción de negocio

Traduce cada `*_concept_id` del módulo a su código y su rótulo legible.

Contexto declarado en el controlador: Vocabulario completo del módulo, con su identificador y su rótulo.

### Descripción del sistema

NestJS resuelve `GET /pharma-labs/reference/concepts` en `PharmaLabReferenceController_listConcepts`. No se detectó una delegación adicional desde el controlador. No recibe body. El tipo de retorno estático es `PharmaLabConcept[]`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /pharma-labs/reference/concepts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /pharma-labs/reference/concepts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `PharmaLabConcept[]` | No |
| 400 | Consulta completada correctamente. | `PharmaLabConcept[]` | No |
| 401 | Consulta completada correctamente. | `PharmaLabConcept[]` | No |
| 403 | Consulta completada correctamente. | `PharmaLabConcept[]` | No |
| 429 | Consulta completada correctamente. | `PharmaLabConcept[]` | No |
| 500 | Consulta completada correctamente. | `PharmaLabConcept[]` | No |

El controlador declara `PharmaLabConcept[]`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/reference/concepts"
}
```

---

## 47. POST /pharma-labs/visitor-posts

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-social-accounting`
- **Nombre:** Proponer una publicación como visitador
- **Operation ID:** `PharmaLabSocialController_submitPost`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PharmaLabSocialController.submitPost](../../src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts)

### Descripción de negocio

Proponer una publicación como visitador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /pharma-labs/visitor-posts` en `PharmaLabSocialController_submitPost`. El controlador delega en `PharmaSocialService.submit`. Valida el body como `SubmitVisitorPostDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SubmitVisitorPostDto`; los campos opcionales se omiten.

```http
POST /pharma-labs/visitor-posts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "body": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MEDICAL_VISITOR`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `body` | Sí | `string` | longitud máxima 4000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `informationalMaterialId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /pharma-labs/visitor-posts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "body": "valor-ejemplo",
  "informationalMaterialId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MEDICAL_VISITOR. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Material informativo no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-social.service.ts |
| 404 | `NOT_FOUND` | La cuenta no corresponde a un visitador médico | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo se puede adjuntar material científico aprobado | Excepción explícita en src/modules/pharma_lab/services/pharma-social.service.ts |
| 422 | `PRECONDITION_FAILED` | El visitador no tiene una vinculación activa con un laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 422 | `PRECONDITION_FAILED` | El laboratorio del visitador no está activo | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/pharma-labs/visitor-posts"
}
```

---

## 48. GET /visit-agenda/blocks

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-agenda`
- **Nombre:** Listar los bloqueos vigentes
- **Operation ID:** `VisitAgendaController_listBlocks`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitAgendaController.listBlocks](../../src/modules/pharma_lab/controllers/visit-agenda.controller.ts)

### Descripción de negocio

Listar los bloqueos vigentes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bloqueos vigentes del doctor.

### Descripción del sistema

NestJS resuelve `GET /visit-agenda/blocks` en `VisitAgendaController_listBlocks`. El controlador delega en `VisitAgendaService.listBlocks`. No recibe body. El tipo de retorno estático es `Promise<DoctorVisitBlocks[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /visit-agenda/blocks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /visit-agenda/blocks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DoctorVisitBlocks[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<DoctorVisitBlocks[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<DoctorVisitBlocks[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<DoctorVisitBlocks[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<DoctorVisitBlocks[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<DoctorVisitBlocks[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DoctorVisitBlocks[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "doctorUserId": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
    "reason": "Texto descriptivo de ejemplo",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "liftedAt": "2026-07-31T12:00:00.000Z",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-agenda/blocks"
}
```

---

## 49. POST /visit-agenda/blocks

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-agenda`
- **Nombre:** Bloquear un laboratorio o un visitador
- **Operation ID:** `VisitAgendaController_createBlock`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitAgendaController.createBlock](../../src/modules/pharma_lab/controllers/visit-agenda.controller.ts)

### Descripción de negocio

Bloquear un laboratorio o un visitador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /visit-agenda/blocks` en `VisitAgendaController_createBlock`. El controlador delega en `VisitAgendaService.createBlock`. Valida el body como `CreateVisitBlockDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateVisitBlockDto`; los campos opcionales se omiten.

```http
POST /visit-agenda/blocks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `pharmaLabId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `medicalVisitorId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reason` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /visit-agenda/blocks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pharmaLabId": "00000000-0000-4000-8000-000000000001",
  "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Indicá el laboratorio o el visitador a bloquear | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-agenda/blocks"
}
```

---

## 50. POST /visit-agenda/blocks/{blockId}/lift

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-agenda`
- **Nombre:** Levantar un bloqueo
- **Operation ID:** `VisitAgendaController_liftBlock`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitAgendaController.liftBlock](../../src/modules/pharma_lab/controllers/visit-agenda.controller.ts)

### Descripción de negocio

Levantar un bloqueo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Levantar un bloqueo.

### Descripción del sistema

NestJS resuelve `POST /visit-agenda/blocks/{blockId}/lift` en `VisitAgendaController_liftBlock`. El controlador delega en `VisitAgendaService.liftBlock`. No recibe body. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `blockId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /visit-agenda/blocks/00000000-0000-4000-8000-000000000001/lift HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `blockId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /visit-agenda/blocks/00000000-0000-4000-8000-000000000001/lift HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Bloqueo no encontrado | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 409 | `CONFLICT` | El bloqueo ya estaba levantado | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-agenda/blocks/{blockId}/lift"
}
```

---

## 51. GET /visit-agenda/doctors/{doctorUserId}

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-agenda`
- **Nombre:** Consultar la agenda de visitas de un doctor
- **Operation ID:** `VisitAgendaController_getDoctorAgenda`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitAgendaController.getDoctorAgenda](../../src/modules/pharma_lab/controllers/visit-agenda.controller.ts)

### Descripción de negocio

Consultar la agenda de visitas de un doctor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Agenda publicada de un doctor, para que el visitador sepa cuándo puede solicitar. Devuelve horarios, no pacientes.

### Descripción del sistema

NestJS resuelve `GET /visit-agenda/doctors/{doctorUserId}` en `VisitAgendaController_getDoctorAgenda`. El controlador delega en `VisitAgendaService.getPublishedAgenda`. No recibe body. El tipo de retorno estático es `Promise<PublishedAgenda>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `doctorUserId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /visit-agenda/doctors/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MEDICAL_VISITOR`, `PHARMA_LAB_ADMIN`, `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `doctorUserId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /visit-agenda/doctors/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublishedAgenda>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublishedAgenda>` | No |
| 401 | Consulta completada correctamente. | `Promise<PublishedAgenda>` | No |
| 403 | Consulta completada correctamente. | `Promise<PublishedAgenda>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublishedAgenda>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublishedAgenda>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublishedAgenda>` | No |

El controlador declara `PublishedAgenda`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MEDICAL_VISITOR, PHARMA_LAB_ADMIN, PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El doctor no tiene agenda de visitas habilitada | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-agenda/doctors/{doctorUserId}"
}
```

---

## 52. GET /visit-agenda/me

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-agenda`
- **Nombre:** Consultar la propia agenda de visitas
- **Operation ID:** `VisitAgendaController_getOwn`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitAgendaController.getOwn](../../src/modules/pharma_lab/controllers/visit-agenda.controller.ts)

### Descripción de negocio

Consultar la propia agenda de visitas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Agenda propia del doctor autenticado.

### Descripción del sistema

NestJS resuelve `GET /visit-agenda/me` en `VisitAgendaController_getOwn`. El controlador delega en `VisitAgendaService.getPublishedAgenda`. No recibe body. El tipo de retorno estático es `Promise<PublishedAgenda>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /visit-agenda/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /visit-agenda/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublishedAgenda>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublishedAgenda>` | No |
| 401 | Consulta completada correctamente. | `Promise<PublishedAgenda>` | No |
| 403 | Consulta completada correctamente. | `Promise<PublishedAgenda>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublishedAgenda>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublishedAgenda>` | No |

El controlador declara `PublishedAgenda`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El doctor no tiene agenda de visitas habilitada | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-agenda/me"
}
```

---

## 53. PUT /visit-agenda/me

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-agenda`
- **Nombre:** Configurar la agenda de visitas del doctor
- **Operation ID:** `VisitAgendaController_putPolicy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitAgendaController.putPolicy](../../src/modules/pharma_lab/controllers/visit-agenda.controller.ts)

### Descripción de negocio

Configurar la agenda de visitas del doctor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /visit-agenda/me` en `VisitAgendaController_putPolicy`. El controlador delega en `VisitAgendaService.putPolicy`. Valida el body como `PutVisitPolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PutVisitPolicyDto`; los campos opcionales se omiten.

```http
PUT /visit-agenda/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "windows": [
    {
      "weekday": 1,
      "startTime": "15:00",
      "endTime": "17:00",
      "slotDurationMinutes": 5,
      "modalityConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `timeZone` | No | `string` | longitud máxima 64 | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `autoConfirm` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `maxVisitsPerDay` | No | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `minNoticeHours` | No | `number` | mínimo 0; máximo 720 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rescheduleCutoffHours` | No | `number` | mínimo 0; máximo 720 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `allowedSpecialtyConceptIds` | No | `array<string>` | formato `uuid`; máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |
| `maxDurationMinutes` | No | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `5` |
| `windows` | Sí | `array<VisitWindowDto>` | máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"weekday":1,"startTime":"15:00","endTime":"17:00","slotDurationMinutes":5,"modalityConceptId":"00000000-0000-4000-8000-000000000001","location":"valor-ejemplo","maxVisits":1}]` |
| `windows[].weekday` | Sí | `number` | mínimo 0; máximo 6 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `windows[].startTime` | Sí | `string` | patrón runtime `/^([01]\d\|2[0-3]):[0-5]\d$/` | Sin descripción específica en el contrato OpenAPI. | `15:00` |
| `windows[].endTime` | Sí | `string` | patrón runtime `/^([01]\d\|2[0-3]):[0-5]\d$/` | Sin descripción específica en el contrato OpenAPI. | `17:00` |
| `windows[].slotDurationMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `5` |
| `windows[].modalityConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `windows[].location` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `windows[].maxVisits` | No | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /visit-agenda/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "timeZone": "America/La_Paz",
  "autoConfirm": true,
  "maxVisitsPerDay": 1,
  "minNoticeHours": 1,
  "rescheduleCutoffHours": 1,
  "allowedSpecialtyConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "maxDurationMinutes": 5,
  "windows": [
    {
      "weekday": 1,
      "startTime": "15:00",
      "endTime": "17:00",
      "slotDurationMinutes": 5,
      "modalityConceptId": "00000000-0000-4000-8000-000000000001",
      "location": "valor-ejemplo",
      "maxVisits": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La hora de fin debe ser posterior a la de inicio | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | Dos ventanas del mismo día se superponen | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-agenda/me"
}
```

---

## 54. POST /visit-records

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-records`
- **Nombre:** Registrar la visita realizada
- **Operation ID:** `VisitRecordsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRecordsController.create](../../src/modules/pharma_lab/controllers/visit-records.controller.ts)

### Descripción de negocio

Registrar la visita realizada. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /visit-records` en `VisitRecordsController_create`. El controlador delega en `VisitRecordsService.createRecord`. Valida el body como `CreateVisitRecordDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateVisitRecordDto`; los campos opcionales se omiten.

```http
POST /visit-records HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "visitRequestId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "visitorAttendanceConceptId": "00000000-0000-4000-8000-000000000001",
  "doctorAttendanceConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MEDICAL_VISITOR`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `visitRequestId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `occurredAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `location` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `topicsDiscussed` | No | `string` | longitud máxima 4000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `questions` | No | `string` | longitud máxima 4000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `commitments` | No | `string` | longitud máxima 4000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `nextAction` | No | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `observations` | No | `string` | longitud máxima 4000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `visitorAttendanceConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `doctorAttendanceConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `materials` | No | `array<VisitMaterialDto>` | máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"informationalMaterialId":"00000000-0000-4000-8000-000000000001","wasHandedOver":true}]` |
| `materials[].informationalMaterialId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `materials[].wasHandedOver` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /visit-records HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "visitRequestId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "location": "valor-ejemplo",
  "topicsDiscussed": "valor-ejemplo",
  "questions": "valor-ejemplo",
  "commitments": "valor-ejemplo",
  "nextAction": "valor-ejemplo",
  "observations": "valor-ejemplo",
  "visitorAttendanceConceptId": "00000000-0000-4000-8000-000000000001",
  "doctorAttendanceConceptId": "00000000-0000-4000-8000-000000000001",
  "materials": [
    {
      "informationalMaterialId": "00000000-0000-4000-8000-000000000001",
      "wasHandedOver": true
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MEDICAL_VISITOR. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/pharma_lab/services/visit-records.service.ts |
| 404 | `NOT_FOUND` | Material informativo no encontrado en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/visit-records.service.ts |
| 404 | `NOT_FOUND` | La cuenta no corresponde a un visitador médico | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | La visita ya fue registrada | Excepción explícita en src/modules/pharma_lab/services/visit-records.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo se registra una visita confirmada | Excepción explícita en src/modules/pharma_lab/services/visit-records.service.ts |
| 422 | `PRECONDITION_FAILED` | Un visitador no puede compartir material que no está aprobado | Excepción explícita en src/modules/pharma_lab/services/visit-records.service.ts |
| 422 | `PRECONDITION_FAILED` | El material no estaba vigente en la fecha de la visita | Excepción explícita en src/modules/pharma_lab/services/visit-records.service.ts |
| 422 | `PRECONDITION_FAILED` | El visitador no tiene una vinculación activa con un laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 422 | `PRECONDITION_FAILED` | El laboratorio del visitador no está activo | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-records"
}
```

---

## 55. POST /visit-records/{visitRecordId}/confirm

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-records`
- **Nombre:** Confirmar que la visita ocurrió
- **Operation ID:** `VisitRecordsController_confirm`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRecordsController.confirm](../../src/modules/pharma_lab/controllers/visit-records.controller.ts)

### Descripción de negocio

Confirmar que la visita ocurrió. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /visit-records/{visitRecordId}/confirm` en `VisitRecordsController_confirm`. El controlador delega en `VisitRecordsService.confirmRecord`. Valida el body como `ConfirmVisitRecordDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `visitRecordId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ConfirmVisitRecordDto`; los campos opcionales se omiten.

```http
POST /visit-records/00000000-0000-4000-8000-000000000001/confirm HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "occurred": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `visitRecordId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `occurred` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `note` | No | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /visit-records/00000000-0000-4000-8000-000000000001/confirm HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "occurred": true,
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Registro de visita no encontrado | Excepción explícita en src/modules/pharma_lab/services/visit-records.service.ts |
| 409 | `CONFLICT` | El registro ya fue resuelto | Excepción explícita en src/modules/pharma_lab/services/visit-records.service.ts |
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
  "path": "/visit-records/{visitRecordId}/confirm"
}
```

---

## 56. POST /visit-records/{visitRecordId}/rating

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-records`
- **Nombre:** Calificar la visita completada
- **Operation ID:** `VisitRecordsController_rate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRecordsController.rate](../../src/modules/pharma_lab/controllers/visit-records.controller.ts)

### Descripción de negocio

Calificar la visita completada. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /visit-records/{visitRecordId}/rating` en `VisitRecordsController_rate`. El controlador delega en `VisitRecordsService.rateVisit`. Valida el body como `RateVisitDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `visitRecordId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RateVisitDto`; los campos opcionales se omiten.

```http
POST /visit-records/00000000-0000-4000-8000-000000000001/rating HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "kindConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `visitRecordId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kindConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `punctuality` | No | `number` | mínimo 1; máximo 5 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `informationQuality` | No | `number` | mínimo 1; máximo 5 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `clarity` | No | `number` | mínimo 1; máximo 5 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `relevance` | No | `number` | mínimo 1; máximo 5 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `professionalConduct` | No | `number` | mínimo 1; máximo 5 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `materialUsefulness` | No | `number` | mínimo 1; máximo 5 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `overallSatisfaction` | No | `number` | mínimo 1; máximo 5 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `comment` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /visit-records/00000000-0000-4000-8000-000000000001/rating HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "kindConceptId": "00000000-0000-4000-8000-000000000001",
  "punctuality": 1,
  "informationQuality": 1,
  "clarity": 1,
  "relevance": 1,
  "professionalConduct": 1,
  "materialUsefulness": 1,
  "overallSatisfaction": 1,
  "comment": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Registro de visita no encontrado | Excepción explícita en src/modules/pharma_lab/services/visit-records.service.ts |
| 409 | `CONFLICT` | Ya existe una calificación de esa naturaleza para la visita | Excepción explícita en src/modules/pharma_lab/services/visit-records.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo se califica una visita completada | Excepción explícita en src/modules/pharma_lab/services/visit-records.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-records/{visitRecordId}/rating"
}
```

---

## 57. GET /visit-records/inbox

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-records`
- **Nombre:** Listar las visitas recibidas
- **Operation ID:** `VisitRecordsController_listInbox`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRecordsController.listInbox](../../src/modules/pharma_lab/controllers/visit-records.controller.ts)

### Descripción de negocio

Listar las visitas recibidas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Visitas recibidas por el doctor autenticado.

### Descripción del sistema

NestJS resuelve `GET /visit-records/inbox` en `VisitRecordsController_listInbox`. El controlador delega en `VisitRecordsService.listDoctorRecords`. No recibe body. El tipo de retorno estático es `Promise<VisitRecords[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /visit-records/inbox HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /visit-records/inbox HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VisitRecords[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<VisitRecords[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<VisitRecords[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<VisitRecords[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<VisitRecords[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<VisitRecords[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VisitRecords[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "visitRequestId": "00000000-0000-4000-8000-000000000001",
    "doctorUserId": "00000000-0000-4000-8000-000000000001",
    "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "occurredAt": "2026-07-31T12:00:00.000Z",
    "location": "valor-ejemplo",
    "modalityConceptId": "00000000-0000-4000-8000-000000000001",
    "topicsDiscussed": "valor-ejemplo",
    "questions": "valor-ejemplo",
    "commitments": "valor-ejemplo",
    "nextAction": "valor-ejemplo",
    "observations": "valor-ejemplo",
    "visitorAttendanceConceptId": "00000000-0000-4000-8000-000000000001",
    "doctorAttendanceConceptId": "00000000-0000-4000-8000-000000000001",
    "confirmationConceptId": "00000000-0000-4000-8000-000000000001",
    "confirmedAt": "2026-07-31T12:00:00.000Z",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-records/inbox"
}
```

---

## 58. GET /visit-records/labs/{pharmaLabId}

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-records`
- **Nombre:** Historial de visitas del laboratorio
- **Operation ID:** `VisitRecordsController_listLabRecords`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRecordsController.listLabRecords](../../src/modules/pharma_lab/controllers/visit-records.controller.ts)

### Descripción de negocio

Historial de visitas del laboratorio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Historial de visitas del laboratorio.

### Descripción del sistema

NestJS resuelve `GET /visit-records/labs/{pharmaLabId}` en `VisitRecordsController_listLabRecords`. El controlador delega en `VisitRecordsService.listLabRecords`. No recibe body. El tipo de retorno estático es `Promise<VisitRecords[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /visit-records/labs/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /visit-records/labs/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VisitRecords[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<VisitRecords[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<VisitRecords[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<VisitRecords[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<VisitRecords[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<VisitRecords[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<VisitRecords[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VisitRecords[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "visitRequestId": "00000000-0000-4000-8000-000000000001",
    "doctorUserId": "00000000-0000-4000-8000-000000000001",
    "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "occurredAt": "2026-07-31T12:00:00.000Z",
    "location": "valor-ejemplo",
    "modalityConceptId": "00000000-0000-4000-8000-000000000001",
    "topicsDiscussed": "valor-ejemplo",
    "questions": "valor-ejemplo",
    "commitments": "valor-ejemplo",
    "nextAction": "valor-ejemplo",
    "observations": "valor-ejemplo",
    "visitorAttendanceConceptId": "00000000-0000-4000-8000-000000000001",
    "doctorAttendanceConceptId": "00000000-0000-4000-8000-000000000001",
    "confirmationConceptId": "00000000-0000-4000-8000-000000000001",
    "confirmedAt": "2026-07-31T12:00:00.000Z",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-records/labs/{pharmaLabId}"
}
```

---

## 59. GET /visit-records/labs/{pharmaLabId}/rating-summary

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-records`
- **Nombre:** Resultados agregados de las calificaciones del laboratorio
- **Operation ID:** `VisitRecordsController_ratingSummary`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRecordsController.ratingSummary](../../src/modules/pharma_lab/controllers/visit-records.controller.ts)

### Descripción de negocio

Devuelve promedios por dimensión. Las calificaciones individuales no se exponen.

Contexto declarado en el controlador: Resultados agregados de las calificaciones (spec 5523).

### Descripción del sistema

NestJS resuelve `GET /visit-records/labs/{pharmaLabId}/rating-summary` en `VisitRecordsController_ratingSummary`. El controlador delega en `VisitRecordsService.getRatingAggregate`. No recibe body. El tipo de retorno estático es `Promise<RatingAggregate>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /visit-records/labs/00000000-0000-4000-8000-000000000001/rating-summary HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `BUSINESS_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /visit-records/labs/00000000-0000-4000-8000-000000000001/rating-summary HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RatingAggregate>` | No |
| 400 | Consulta completada correctamente. | `Promise<RatingAggregate>` | No |
| 401 | Consulta completada correctamente. | `Promise<RatingAggregate>` | No |
| 403 | Consulta completada correctamente. | `Promise<RatingAggregate>` | No |
| 404 | Consulta completada correctamente. | `Promise<RatingAggregate>` | No |
| 429 | Consulta completada correctamente. | `Promise<RatingAggregate>` | No |
| 500 | Consulta completada correctamente. | `Promise<RatingAggregate>` | No |

El controlador declara `RatingAggregate`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-records/labs/{pharmaLabId}/rating-summary"
}
```

---

## 60. POST /visit-requests

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-requests`
- **Nombre:** Solicitar una visita médica a un doctor
- **Operation ID:** `VisitRequestsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRequestsController.create](../../src/modules/pharma_lab/controllers/visit-requests.controller.ts)

### Descripción de negocio

Solicitar una visita médica a un doctor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /visit-requests` en `VisitRequestsController_create`. El controlador delega en `VisitRequestsService.createRequest`. Valida el body como `CreateVisitRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateVisitRequestDto`; los campos opcionales se omiten.

```http
POST /visit-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "doctorUserId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo",
  "requestedStartAt": "2026-07-31T12:00:00.000Z",
  "durationMinutes": 5,
  "modalityConceptId": "00000000-0000-4000-8000-000000000001",
  "topics": [
    {}
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MEDICAL_VISITOR`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `doctorUserId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `doctorTenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reason` | Sí | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `requestedStartAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `durationMinutes` | Sí | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `5` |
| `modalityConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `location` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `observations` | No | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `topics` | Sí | `array<VisitTopicDto>` | máximo 20 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"pharmaProductId":"00000000-0000-4000-8000-000000000001","topic":"valor-ejemplo"}]` |
| `topics[].pharmaProductId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `topics[].topic` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /visit-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "doctorUserId": "00000000-0000-4000-8000-000000000001",
  "doctorTenantId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo",
  "requestedStartAt": "2026-07-31T12:00:00.000Z",
  "durationMinutes": 5,
  "modalityConceptId": "00000000-0000-4000-8000-000000000001",
  "location": "valor-ejemplo",
  "observations": "valor-ejemplo",
  "topics": [
    {
      "pharmaProductId": "00000000-0000-4000-8000-000000000001",
      "topic": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MEDICAL_VISITOR. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La cuenta no corresponde a un visitador médico | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El visitador no está autorizado a representar alguno de los productos del temario | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 422 | `PRECONDITION_FAILED` | Alguno de los productos del temario está suspendido o retirado | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 422 | `PRECONDITION_FAILED` | El visitador no tiene una vinculación activa con un laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 422 | `PRECONDITION_FAILED` | El laboratorio del visitador no está activo | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 422 | `PRECONDITION_FAILED` | El doctor bloqueó las visitas de este laboratorio o visitador | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El doctor solo recibe visitadores de determinadas especialidades | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El doctor no recibe visitas de laboratorio | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | La visita debe solicitarse con al menos ${policy.minNoticeHours} horas de antelación | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | La duración máxima admitida es de ${policy.maxDurationMinutes} minutos | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El horario solicitado queda fuera de las ventanas de visita del doctor | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | La modalidad solicitada no coincide con la de la ventana de visita | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El doctor ya alcanzó el máximo de visitas para ese día | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El horario se superpone con otra visita ya registrada | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana de visita ya está completa | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El horario se superpone con la agenda clínica del doctor | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-requests"
}
```

---

## 61. GET /visit-requests/{visitRequestId}

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-requests`
- **Nombre:** Consultar una solicitud con su bitácora
- **Operation ID:** `VisitRequestsController_getOne`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRequestsController.getOne](../../src/modules/pharma_lab/controllers/visit-requests.controller.ts)

### Descripción de negocio

Consultar una solicitud con su bitácora. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Detalle con temario y bitácora.

### Descripción del sistema

NestJS resuelve `GET /visit-requests/{visitRequestId}` en `VisitRequestsController_getOne`. El controlador delega en `VisitRequestsService.getRequestDetail`. No recibe body. El tipo de retorno estático es `Promise<{ /** La solicitud. */ request: VisitRequests; /** Productos o temas declarados. */ topics: VisitRequestTopics[]; /** Bitácora de transiciones. */ events: VisitRequestEvents[]; }>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `visitRequestId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /visit-requests/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MEDICAL_VISITOR`, `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `visitRequestId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /visit-requests/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<{ /** La solicitud. */ request: VisitRequests; /** Productos o temas declarados. */ topics: VisitRequestTopics[]; /** Bitácora de transiciones. */ events: VisitRequestEvents[]; }>` | No |
| 400 | Consulta completada correctamente. | `Promise<{ /** La solicitud. */ request: VisitRequests; /** Productos o temas declarados. */ topics: VisitRequestTopics[]; /** Bitácora de transiciones. */ events: VisitRequestEvents[]; }>` | No |
| 401 | Consulta completada correctamente. | `Promise<{ /** La solicitud. */ request: VisitRequests; /** Productos o temas declarados. */ topics: VisitRequestTopics[]; /** Bitácora de transiciones. */ events: VisitRequestEvents[]; }>` | No |
| 403 | Consulta completada correctamente. | `Promise<{ /** La solicitud. */ request: VisitRequests; /** Productos o temas declarados. */ topics: VisitRequestTopics[]; /** Bitácora de transiciones. */ events: VisitRequestEvents[]; }>` | No |
| 404 | Consulta completada correctamente. | `Promise<{ /** La solicitud. */ request: VisitRequests; /** Productos o temas declarados. */ topics: VisitRequestTopics[]; /** Bitácora de transiciones. */ events: VisitRequestEvents[]; }>` | No |
| 429 | Consulta completada correctamente. | `Promise<{ /** La solicitud. */ request: VisitRequests; /** Productos o temas declarados. */ topics: VisitRequestTopics[]; /** Bitácora de transiciones. */ events: VisitRequestEvents[]; }>` | No |
| 500 | Consulta completada correctamente. | `Promise<{ /** La solicitud. */ request: VisitRequests; /** Productos o temas declarados. */ topics: VisitRequestTopics[]; /** Bitácora de transiciones. */ events: VisitRequestEvents[]; }>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ /** La solicitud. */ request: VisitRequests; /** Productos o temas declarados. */ topics: VisitRequestTopics[]; /** Bitácora de transiciones. */ events: VisitRequestEvents[]; }`. Ejemplo completo derivado de ese DTO:

```json
{
  "request": {
    "id": "00000000-0000-4000-8000-000000000001",
    "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "doctorUserId": "00000000-0000-4000-8000-000000000001",
    "doctorTenantId": "00000000-0000-4000-8000-000000000001",
    "reason": "Texto descriptivo de ejemplo",
    "requestedStartAt": "2026-07-31T12:00:00.000Z",
    "durationMinutes": 1,
    "timeZone": "America/La_Paz",
    "modalityConceptId": "00000000-0000-4000-8000-000000000001",
    "location": "valor-ejemplo",
    "attachments": {
      "clave": "valor"
    },
    "observations": "valor-ejemplo",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "proposedStartAt": "2026-07-31T12:00:00.000Z",
    "confirmedAt": "2026-07-31T12:00:00.000Z",
    "closedAt": "2026-07-31T12:00:00.000Z",
    "rescheduledFromId": "00000000-0000-4000-8000-000000000001",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
  },
  "topics": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "visitRequestId": "00000000-0000-4000-8000-000000000001",
      "pharmaProductId": "00000000-0000-4000-8000-000000000001",
      "topic": "valor-ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z",
      "createdByUserId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "events": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "visitRequestId": "00000000-0000-4000-8000-000000000001",
      "actionConceptId": "00000000-0000-4000-8000-000000000001",
      "previousStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "newStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "proposedStartAt": "2026-07-31T12:00:00.000Z",
      "note": "valor-ejemplo",
      "actorUserId": "00000000-0000-4000-8000-000000000001",
      "occurredAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z",
      "createdByUserId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `request` | Sí | `VisitRequests` | Sin restricción adicional declarada | La solicitud. | `{"id":"00000000-0000-4000-8000-000000000001","medicalVisitorId":"00000000-0000-4000-8000-000000000001","pharmaLabId":"00000000-0000-4000-8000-000000000001","doctorUserId":"00000000-0000-4000-8000-000000000001","doctorTenantId":"00000000-0000-4000-8000-000000000001","reason":"Texto descriptivo de ejemplo","requestedStartAt":"2026-07-31T12:00:00.000Z","durationMinutes":1,"timeZone":"America/La_Paz","modalityConceptId":"00000000-0000-4000-8000-000000000001","location":"valor-ejemplo","attachments":{"clave":"valor"},"observations":"valor-ejemplo","statusConceptId":"00000000-0000-4000-8000-000000000001","proposedStartAt":"2026-07-31T12:00:00.000Z","confirmedAt":"2026-07-31T12:00:00.000Z","closedAt":"2026-07-31T12:00:00.000Z","rescheduledFromId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z","createdByUserId":"00000000-0000-4000-8000-000000000001","updatedByUserId":"00000000-0000-4000-8000-000000000001","rowVersion":1}` |
| `request.id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `request.medicalVisitorId` | Sí | `string` | Sin restricción adicional declarada | Visitador solicitante. | `00000000-0000-4000-8000-000000000001` |
| `request.pharmaLabId` | Sí | `string` | Sin restricción adicional declarada | Laboratorio al que representa en esta visita. | `00000000-0000-4000-8000-000000000001` |
| `request.doctorUserId` | Sí | `string` | Sin restricción adicional declarada | Doctor visitado. | `00000000-0000-4000-8000-000000000001` |
| `request.doctorTenantId` | No | `string` | Sin restricción adicional declarada | Organización del doctor bajo la que se atiende la visita. | `00000000-0000-4000-8000-000000000001` |
| `request.reason` | Sí | `string` | Sin restricción adicional declarada | Motivo de la visita. | `Texto descriptivo de ejemplo` |
| `request.requestedStartAt` | Sí | `string` | formato `date-time` | Inicio solicitado, en UTC. La zona horaria aplicada se guarda aparte para poder reconstruir lo que vio quien solicitó. | `2026-07-31T12:00:00.000Z` |
| `request.durationMinutes` | Sí | `number` | Sin restricción adicional declarada | Duración solicitada, en minutos. | `1` |
| `request.timeZone` | Sí | `string` | Sin restricción adicional declarada | Zona horaria aplicada (la del doctor o la de su organización, spec 5379). | `America/La_Paz` |
| `request.modalityConceptId` | Sí | `string` | Sin restricción adicional declarada | Modalidad solicitada. | `00000000-0000-4000-8000-000000000001` |
| `request.location` | No | `string` | Sin restricción adicional declarada | Ubicación o enlace acordado. | `valor-ejemplo` |
| `request.attachments` | No | `object` | Sin restricción adicional declarada | Documentación adjunta a la solicitud (referencias del almacén documental). | `{"clave":"valor"}` |
| `request.observations` | No | `string` | Sin restricción adicional declarada | Observaciones del visitador. | `valor-ejemplo` |
| `request.statusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado de la visita, dentro de la lista cerrada de spec 5382-5394. | `00000000-0000-4000-8000-000000000001` |
| `request.proposedStartAt` | No | `string` | formato `date-time` | Horario propuesto por el doctor como alternativa (spec 5373). | `2026-07-31T12:00:00.000Z` |
| `request.confirmedAt` | No | `string` | formato `date-time` | Momento de la confirmación. | `2026-07-31T12:00:00.000Z` |
| `request.closedAt` | No | `string` | formato `date-time` | Momento de la cancelación o el rechazo. | `2026-07-31T12:00:00.000Z` |
| `request.rescheduledFromId` | No | `string` | Sin restricción adicional declarada | Solicitud de la que ésta es reprogramación, si la hay. | `00000000-0000-4000-8000-000000000001` |
| `request.createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `request.updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |
| `request.createdByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a created by user. | `00000000-0000-4000-8000-000000000001` |
| `request.updatedByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a updated by user. | `00000000-0000-4000-8000-000000000001` |
| `request.rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión usada para controlar actualizaciones concurrentes. | `1` |
| `topics` | Sí | `array<VisitRequestTopics>` | Sin restricción adicional declarada | Productos o temas declarados. | `[{"id":"00000000-0000-4000-8000-000000000001","visitRequestId":"00000000-0000-4000-8000-000000000001","pharmaProductId":"00000000-0000-4000-8000-000000000001","topic":"valor-ejemplo","createdAt":"2026-07-31T12:00:00.000Z","createdByUserId":"00000000-0000-4000-8000-000000000001"}]` |
| `topics[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `topics[].visitRequestId` | Sí | `string` | Sin restricción adicional declarada | Solicitud a la que pertenece el tema. | `00000000-0000-4000-8000-000000000001` |
| `topics[].pharmaProductId` | No | `string` | Sin restricción adicional declarada | Producto del catálogo, cuando el tema es un medicamento concreto. | `00000000-0000-4000-8000-000000000001` |
| `topics[].topic` | No | `string` | Sin restricción adicional declarada | Tema libre, cuando no corresponde a un producto. | `valor-ejemplo` |
| `topics[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `topics[].createdByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a created by user. | `00000000-0000-4000-8000-000000000001` |
| `events` | Sí | `array<VisitRequestEvents>` | Sin restricción adicional declarada | Bitácora de transiciones. | `[{"id":"00000000-0000-4000-8000-000000000001","visitRequestId":"00000000-0000-4000-8000-000000000001","actionConceptId":"00000000-0000-4000-8000-000000000001","previousStatusConceptId":"00000000-0000-4000-8000-000000000001","newStatusConceptId":"00000000-0000-4000-8000-000000000001","proposedStartAt":"2026-07-31T12:00:00.000Z","note":"valor-ejemplo","actorUserId":"00000000-0000-4000-8000-000000000001","occurredAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z","createdByUserId":"00000000-0000-4000-8000-000000000001"}]` |
| `events[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `events[].visitRequestId` | Sí | `string` | Sin restricción adicional declarada | Solicitud afectada. | `00000000-0000-4000-8000-000000000001` |
| `events[].actionConceptId` | Sí | `string` | Sin restricción adicional declarada | Acción ejecutada. | `00000000-0000-4000-8000-000000000001` |
| `events[].previousStatusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado antes de la acción. | `00000000-0000-4000-8000-000000000001` |
| `events[].newStatusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado después de la acción. | `00000000-0000-4000-8000-000000000001` |
| `events[].proposedStartAt` | No | `string` | formato `date-time` | Horario propuesto, cuando la acción es «proponer otro horario». | `2026-07-31T12:00:00.000Z` |
| `events[].note` | No | `string` | Sin restricción adicional declarada | Nota o motivo de quien ejecuta la acción. | `valor-ejemplo` |
| `events[].actorUserId` | Sí | `string` | Sin restricción adicional declarada | Quién ejecutó la acción. | `00000000-0000-4000-8000-000000000001` |
| `events[].occurredAt` | Sí | `string` | formato `date-time` | Momento en que ocurrió. | `2026-07-31T12:00:00.000Z` |
| `events[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `events[].createdByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a created by user. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MEDICAL_VISITOR, PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-requests/{visitRequestId}"
}
```

---

## 62. POST /visit-requests/{visitRequestId}/accept

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-requests`
- **Nombre:** Aceptar la visita
- **Operation ID:** `VisitRequestsController_accept`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRequestsController.accept](../../src/modules/pharma_lab/controllers/visit-requests.controller.ts)

### Descripción de negocio

Aceptar la visita. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /visit-requests/{visitRequestId}/accept` en `VisitRequestsController_accept`. El controlador delega en `VisitRequestsService.accept`. Valida el body como `VisitDecisionDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `visitRequestId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VisitDecisionDto`; los campos opcionales se omiten.

```http
POST /visit-requests/00000000-0000-4000-8000-000000000001/accept HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `visitRequestId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `note` | No | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /visit-requests/00000000-0000-4000-8000-000000000001/accept HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 409 | `CONFLICT` | La solicitud está en un estado final y ya no admite cambios | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 409 | `CONFLICT` | La transición solicitada no está permitida para el estado actual | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
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
  "path": "/visit-requests/{visitRequestId}/accept"
}
```

---

## 63. POST /visit-requests/{visitRequestId}/cancel

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-requests`
- **Nombre:** Cancelar la visita
- **Operation ID:** `VisitRequestsController_cancel`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRequestsController.cancel](../../src/modules/pharma_lab/controllers/visit-requests.controller.ts)

### Descripción de negocio

Cancelar la visita. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /visit-requests/{visitRequestId}/cancel` en `VisitRequestsController_cancel`. El controlador delega en `VisitRequestsService.cancel`. Valida el body como `CancelVisitDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `visitRequestId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CancelVisitDto`; los campos opcionales se omiten.

```http
POST /visit-requests/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MEDICAL_VISITOR`, `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `visitRequestId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /visit-requests/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
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
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MEDICAL_VISITOR, PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 404 | `NOT_FOUND` | El doctor no tiene agenda de visitas habilitada | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 409 | `CONFLICT` | La solicitud está en un estado final y ya no admite cambios | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 409 | `CONFLICT` | La transición solicitada no está permitida para el estado actual | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El plazo para reprogramar o cancelar venció (${cutoffHours} horas antes del inicio) | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-requests/{visitRequestId}/cancel"
}
```

---

## 64. POST /visit-requests/{visitRequestId}/propose-time

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-requests`
- **Nombre:** Proponer otro horario
- **Operation ID:** `VisitRequestsController_proposeTime`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRequestsController.proposeTime](../../src/modules/pharma_lab/controllers/visit-requests.controller.ts)

### Descripción de negocio

Proponer otro horario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /visit-requests/{visitRequestId}/propose-time` en `VisitRequestsController_proposeTime`. El controlador delega en `VisitRequestsService.proposeTime`. Valida el body como `ProposeVisitTimeDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `visitRequestId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ProposeVisitTimeDto`; los campos opcionales se omiten.

```http
POST /visit-requests/00000000-0000-4000-8000-000000000001/propose-time HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "proposedStartAt": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `visitRequestId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `proposedStartAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `note` | No | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /visit-requests/00000000-0000-4000-8000-000000000001/propose-time HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "proposedStartAt": "2026-07-31T12:00:00.000Z",
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 409 | `CONFLICT` | La solicitud está en un estado final y ya no admite cambios | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 409 | `CONFLICT` | La transición solicitada no está permitida para el estado actual | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El doctor no recibe visitas de laboratorio | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | La visita debe solicitarse con al menos ${policy.minNoticeHours} horas de antelación | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | La duración máxima admitida es de ${policy.maxDurationMinutes} minutos | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El horario solicitado queda fuera de las ventanas de visita del doctor | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | La modalidad solicitada no coincide con la de la ventana de visita | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El doctor ya alcanzó el máximo de visitas para ese día | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El horario se superpone con otra visita ya registrada | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana de visita ya está completa | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El horario se superpone con la agenda clínica del doctor | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-requests/{visitRequestId}/propose-time"
}
```

---

## 65. POST /visit-requests/{visitRequestId}/reject

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-requests`
- **Nombre:** Rechazar la visita
- **Operation ID:** `VisitRequestsController_reject`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRequestsController.reject](../../src/modules/pharma_lab/controllers/visit-requests.controller.ts)

### Descripción de negocio

Rechazar la visita. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /visit-requests/{visitRequestId}/reject` en `VisitRequestsController_reject`. El controlador delega en `VisitRequestsService.reject`. Valida el body como `VisitDecisionDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `visitRequestId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VisitDecisionDto`; los campos opcionales se omiten.

```http
POST /visit-requests/00000000-0000-4000-8000-000000000001/reject HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `visitRequestId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `note` | No | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /visit-requests/00000000-0000-4000-8000-000000000001/reject HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 409 | `CONFLICT` | La solicitud está en un estado final y ya no admite cambios | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 409 | `CONFLICT` | La transición solicitada no está permitida para el estado actual | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
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
  "path": "/visit-requests/{visitRequestId}/reject"
}
```

---

## 66. POST /visit-requests/{visitRequestId}/request-info

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-requests`
- **Nombre:** Solicitar información adicional al visitador
- **Operation ID:** `VisitRequestsController_requestInfo`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRequestsController.requestInfo](../../src/modules/pharma_lab/controllers/visit-requests.controller.ts)

### Descripción de negocio

Solicitar información adicional al visitador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /visit-requests/{visitRequestId}/request-info` en `VisitRequestsController_requestInfo`. El controlador delega en `VisitRequestsService.requestInfo`. Valida el body como `VisitDecisionDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `visitRequestId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VisitDecisionDto`; los campos opcionales se omiten.

```http
POST /visit-requests/00000000-0000-4000-8000-000000000001/request-info HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `visitRequestId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `note` | No | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /visit-requests/00000000-0000-4000-8000-000000000001/request-info HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 409 | `CONFLICT` | La solicitud está en un estado final y ya no admite cambios | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
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
  "path": "/visit-requests/{visitRequestId}/request-info"
}
```

---

## 67. POST /visit-requests/{visitRequestId}/reschedule

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-requests`
- **Nombre:** Reprogramar la visita dentro del plazo permitido
- **Operation ID:** `VisitRequestsController_reschedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRequestsController.reschedule](../../src/modules/pharma_lab/controllers/visit-requests.controller.ts)

### Descripción de negocio

Reprogramar la visita dentro del plazo permitido. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /visit-requests/{visitRequestId}/reschedule` en `VisitRequestsController_reschedule`. El controlador delega en `VisitRequestsService.reschedule`. Valida el body como `RescheduleVisitDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `visitRequestId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RescheduleVisitDto`; los campos opcionales se omiten.

```http
POST /visit-requests/00000000-0000-4000-8000-000000000001/reschedule HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "requestedStartAt": "2026-07-31T12:00:00.000Z",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MEDICAL_VISITOR`.
- Deben ser UUID válidos: `visitRequestId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `requestedStartAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `reason` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /visit-requests/00000000-0000-4000-8000-000000000001/reschedule HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "requestedStartAt": "2026-07-31T12:00:00.000Z",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MEDICAL_VISITOR. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud no encontrada | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 404 | `NOT_FOUND` | La cuenta no corresponde a un visitador médico | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | La solicitud está en un estado final y ya no admite cambios | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 409 | `CONFLICT` | La transición solicitada no está permitida para el estado actual | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El plazo para reprogramar o cancelar venció (${cutoffHours} horas antes del inicio) | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 422 | `PRECONDITION_FAILED` | El visitador no tiene una vinculación activa con un laboratorio | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 422 | `PRECONDITION_FAILED` | El laboratorio del visitador no está activo | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 422 | `PRECONDITION_FAILED` | El doctor no recibe visitas de laboratorio | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | La visita debe solicitarse con al menos ${policy.minNoticeHours} horas de antelación | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | La duración máxima admitida es de ${policy.maxDurationMinutes} minutos | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El horario solicitado queda fuera de las ventanas de visita del doctor | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | La modalidad solicitada no coincide con la de la ventana de visita | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El doctor ya alcanzó el máximo de visitas para ese día | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El horario se superpone con otra visita ya registrada | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana de visita ya está completa | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 422 | `PRECONDITION_FAILED` | El horario se superpone con la agenda clínica del doctor | Excepción explícita en src/modules/pharma_lab/services/visit-agenda.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-requests/{visitRequestId}/reschedule"
}
```

---

## 68. GET /visit-requests/inbox

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-requests`
- **Nombre:** Listar las solicitudes de visita recibidas
- **Operation ID:** `VisitRequestsController_listInbox`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRequestsController.listInbox](../../src/modules/pharma_lab/controllers/visit-requests.controller.ts)

### Descripción de negocio

Listar las solicitudes de visita recibidas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Solicitudes dirigidas al doctor autenticado.

### Descripción del sistema

NestJS resuelve `GET /visit-requests/inbox` en `VisitRequestsController_listInbox`. El controlador delega en `VisitRequestsService.listDoctorRequests`. No recibe body. El tipo de retorno estático es `Promise<VisitRequests[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /visit-requests/inbox HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /visit-requests/inbox HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VisitRequests[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<VisitRequests[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<VisitRequests[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<VisitRequests[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<VisitRequests[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<VisitRequests[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VisitRequests[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "doctorUserId": "00000000-0000-4000-8000-000000000001",
    "doctorTenantId": "00000000-0000-4000-8000-000000000001",
    "reason": "Texto descriptivo de ejemplo",
    "requestedStartAt": "2026-07-31T12:00:00.000Z",
    "durationMinutes": 1,
    "timeZone": "America/La_Paz",
    "modalityConceptId": "00000000-0000-4000-8000-000000000001",
    "location": "valor-ejemplo",
    "attachments": {
      "clave": "valor"
    },
    "observations": "valor-ejemplo",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "proposedStartAt": "2026-07-31T12:00:00.000Z",
    "confirmedAt": "2026-07-31T12:00:00.000Z",
    "closedAt": "2026-07-31T12:00:00.000Z",
    "rescheduledFromId": "00000000-0000-4000-8000-000000000001",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-requests/inbox"
}
```

---

## 69. GET /visit-requests/mine

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-requests`
- **Nombre:** Listar las propias solicitudes de visita
- **Operation ID:** `VisitRequestsController_listMine`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitRequestsController.listMine](../../src/modules/pharma_lab/controllers/visit-requests.controller.ts)

### Descripción de negocio

Listar las propias solicitudes de visita. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Solicitudes del visitador autenticado.

### Descripción del sistema

NestJS resuelve `GET /visit-requests/mine` en `VisitRequestsController_listMine`. El controlador delega en `VisitRequestsService.listOwnRequests`. No recibe body. El tipo de retorno estático es `Promise<VisitRequests[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /visit-requests/mine HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MEDICAL_VISITOR`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /visit-requests/mine HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VisitRequests[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<VisitRequests[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<VisitRequests[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<VisitRequests[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<VisitRequests[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<VisitRequests[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VisitRequests[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "doctorUserId": "00000000-0000-4000-8000-000000000001",
    "doctorTenantId": "00000000-0000-4000-8000-000000000001",
    "reason": "Texto descriptivo de ejemplo",
    "requestedStartAt": "2026-07-31T12:00:00.000Z",
    "durationMinutes": 1,
    "timeZone": "America/La_Paz",
    "modalityConceptId": "00000000-0000-4000-8000-000000000001",
    "location": "valor-ejemplo",
    "attachments": {
      "clave": "valor"
    },
    "observations": "valor-ejemplo",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "proposedStartAt": "2026-07-31T12:00:00.000Z",
    "confirmedAt": "2026-07-31T12:00:00.000Z",
    "closedAt": "2026-07-31T12:00:00.000Z",
    "rescheduledFromId": "00000000-0000-4000-8000-000000000001",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MEDICAL_VISITOR. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La cuenta no corresponde a un visitador médico | Excepción explícita en src/modules/pharma_lab/services/visit-requests.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-requests/mine"
}
```

---

## 70. GET /visit-surveys/labs/{pharmaLabId}

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-surveys`
- **Nombre:** Listar las encuestas del laboratorio
- **Operation ID:** `VisitSurveysController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitSurveysController.list](../../src/modules/pharma_lab/controllers/visit-surveys.controller.ts)

### Descripción de negocio

Listar las encuestas del laboratorio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Encuestas configuradas por el laboratorio.

### Descripción del sistema

NestJS resuelve `GET /visit-surveys/labs/{pharmaLabId}` en `VisitSurveysController_list`. El controlador delega en `VisitSurveysService.listSurveys`. No recibe body. El tipo de retorno estático es `Promise<VisitSurveys[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /visit-surveys/labs/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /visit-surveys/labs/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VisitSurveys[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<VisitSurveys[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<VisitSurveys[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<VisitSurveys[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<VisitSurveys[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<VisitSurveys[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<VisitSurveys[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VisitSurveys[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "title": "valor-ejemplo",
    "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
    "pharmaProductId": "00000000-0000-4000-8000-000000000001",
    "campaignCode": "CODIGO_EJEMPLO",
    "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
    "validFrom": "valor-ejemplo",
    "validTo": "valor-ejemplo",
    "sendDelayHours": 1,
    "reminderCount": 1,
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-surveys/labs/{pharmaLabId}"
}
```

---

## 71. POST /visit-surveys/labs/{pharmaLabId}

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-surveys`
- **Nombre:** Configurar una encuesta posterior a la visita
- **Operation ID:** `VisitSurveysController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitSurveysController.create](../../src/modules/pharma_lab/controllers/visit-surveys.controller.ts)

### Descripción de negocio

Configurar una encuesta posterior a la visita. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /visit-surveys/labs/{pharmaLabId}` en `VisitSurveysController_create`. El controlador delega en `VisitSurveysService.createSurvey`. Valida el body como `CreateVisitSurveyDto` y consume `application/json`. El tipo de retorno estático es `Promise<CreatedResourceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateVisitSurveyDto`; los campos opcionales se omiten.

```http
POST /visit-surveys/labs/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "title": "valor-ejemplo",
  "validFrom": "2026-07-31",
  "questions": [
    {
      "prompt": "valor-ejemplo",
      "answerTypeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `title` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `medicalVisitorId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `pharmaProductId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `campaignCode` | No | `string` | longitud máxima 64 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `specialtyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | Sí | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `validTo` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `sendDelayHours` | No | `number` | mínimo 0; máximo 720 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `reminderCount` | No | `number` | mínimo 0; máximo 5 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `questions` | Sí | `array<SurveyQuestionDto>` | máximo 40 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"prompt":"valor-ejemplo","answerTypeConceptId":"00000000-0000-4000-8000-000000000001","isRequired":true,"options":["valor-ejemplo"]}]` |
| `questions[].prompt` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `questions[].answerTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `questions[].isRequired` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `questions[].options` | No | `array<string>` | máximo 20 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /visit-surveys/labs/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "title": "valor-ejemplo",
  "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
  "pharmaProductId": "00000000-0000-4000-8000-000000000001",
  "campaignCode": "CODIGO_EJEMPLO",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31",
  "validTo": "2026-07-31",
  "sendDelayHours": 1,
  "reminderCount": 1,
  "questions": [
    {
      "prompt": "valor-ejemplo",
      "answerTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "isRequired": true,
      "options": [
        "valor-ejemplo"
      ]
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CreatedResourceDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CreatedResourceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CreatedResourceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso creado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El laboratorio no está activo | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-surveys/labs/{pharmaLabId}"
}
```

---

## 72. POST /visit-surveys/labs/{pharmaLabId}/{surveyId}/close

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-surveys`
- **Nombre:** Cerrar una encuesta
- **Operation ID:** `VisitSurveysController_close`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitSurveysController.close](../../src/modules/pharma_lab/controllers/visit-surveys.controller.ts)

### Descripción de negocio

Cerrar una encuesta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Cierre de una encuesta.

### Descripción del sistema

NestJS resuelve `POST /visit-surveys/labs/{pharmaLabId}/{surveyId}/close` en `VisitSurveysController_close`. El controlador delega en `VisitSurveysService.closeSurvey`. No recibe body. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `surveyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /visit-surveys/labs/00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `surveyId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /visit-surveys/labs/00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Encuesta no encontrada en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/visit-surveys.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 409 | `CONFLICT` | La encuesta ya está cerrada | Excepción explícita en src/modules/pharma_lab/services/visit-surveys.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-surveys/labs/{pharmaLabId}/{surveyId}/close"
}
```

---

## 73. GET /visit-surveys/labs/{pharmaLabId}/{surveyId}/results

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-surveys`
- **Nombre:** Resultados agregados de la encuesta
- **Operation ID:** `VisitSurveysController_results`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitSurveysController.results](../../src/modules/pharma_lab/controllers/visit-surveys.controller.ts)

### Descripción de negocio

Indicadores por pregunta. Las respuestas individuales se mantienen privadas.

Contexto declarado en el controlador: Resultados agregados (spec 5544-5547).

### Descripción del sistema

NestJS resuelve `GET /visit-surveys/labs/{pharmaLabId}/{surveyId}/results` en `VisitSurveysController_results`. El controlador delega en `VisitSurveysService.getResults`. No recibe body. El tipo de retorno estático es `Promise<SurveyResults>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `surveyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /visit-surveys/labs/00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000001/results HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PHARMA_LAB_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `pharmaLabId`, `surveyId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /visit-surveys/labs/00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000001/results HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SurveyResults>` | No |
| 400 | Consulta completada correctamente. | `Promise<SurveyResults>` | No |
| 401 | Consulta completada correctamente. | `Promise<SurveyResults>` | No |
| 403 | Consulta completada correctamente. | `Promise<SurveyResults>` | No |
| 404 | Consulta completada correctamente. | `Promise<SurveyResults>` | No |
| 429 | Consulta completada correctamente. | `Promise<SurveyResults>` | No |
| 500 | Consulta completada correctamente. | `Promise<SurveyResults>` | No |

El controlador declara `SurveyResults`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PHARMA_LAB_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Encuesta no encontrada en el laboratorio | Excepción explícita en src/modules/pharma_lab/services/visit-surveys.service.ts |
| 404 | `NOT_FOUND` | Laboratorio no encontrado | Excepción explícita en src/modules/pharma_lab/services/pharma-lab-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-surveys/labs/{pharmaLabId}/{surveyId}/results"
}
```

---

## 74. GET /visit-surveys/pending

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-surveys`
- **Nombre:** Listar las encuestas pendientes de responder
- **Operation ID:** `VisitSurveysController_listPending`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitSurveysController.listPending](../../src/modules/pharma_lab/controllers/visit-surveys.controller.ts)

### Descripción de negocio

Listar las encuestas pendientes de responder. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Encuestas pendientes del doctor autenticado.

### Descripción del sistema

NestJS resuelve `GET /visit-surveys/pending` en `VisitSurveysController_listPending`. El controlador delega en `VisitSurveysService.listPendingForDoctor`. No recibe body. El tipo de retorno estático es `Promise<VisitSurveyResponses[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /visit-surveys/pending HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /visit-surveys/pending HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VisitSurveyResponses[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<VisitSurveyResponses[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<VisitSurveyResponses[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<VisitSurveyResponses[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<VisitSurveyResponses[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<VisitSurveyResponses[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VisitSurveyResponses[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "visitSurveyId": "00000000-0000-4000-8000-000000000001",
    "visitRecordId": "00000000-0000-4000-8000-000000000001",
    "doctorUserId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "issuedAt": "2026-07-31T12:00:00.000Z",
    "submittedAt": "2026-07-31T12:00:00.000Z",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-surveys/pending"
}
```

---

## 75. GET /visit-surveys/responses/{responseId}

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-surveys`
- **Nombre:** Consultar el cuestionario a responder
- **Operation ID:** `VisitSurveysController_getQuestionnaire`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitSurveysController.getQuestionnaire](../../src/modules/pharma_lab/controllers/visit-surveys.controller.ts)

### Descripción de negocio

Consultar el cuestionario a responder. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Cuestionario de un envío concreto.

### Descripción del sistema

NestJS resuelve `GET /visit-surveys/responses/{responseId}` en `VisitSurveysController_getQuestionnaire`. El controlador delega en `VisitSurveysService.getQuestionnaire`. No recibe body. El tipo de retorno estático es `Promise<{ /** El envío. */ response: VisitSurveyResponses; /** La encuesta. */ survey: VisitSurveys; /** Preguntas en orden. */ questions: VisitSurveyQuestions[]; }>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `responseId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /visit-surveys/responses/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `responseId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /visit-surveys/responses/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<{ /** El envío. */ response: VisitSurveyResponses; /** La encuesta. */ survey: VisitSurveys; /** Preguntas en orden. */ questions: VisitSurveyQuestions[]; }>` | No |
| 400 | Consulta completada correctamente. | `Promise<{ /** El envío. */ response: VisitSurveyResponses; /** La encuesta. */ survey: VisitSurveys; /** Preguntas en orden. */ questions: VisitSurveyQuestions[]; }>` | No |
| 401 | Consulta completada correctamente. | `Promise<{ /** El envío. */ response: VisitSurveyResponses; /** La encuesta. */ survey: VisitSurveys; /** Preguntas en orden. */ questions: VisitSurveyQuestions[]; }>` | No |
| 403 | Consulta completada correctamente. | `Promise<{ /** El envío. */ response: VisitSurveyResponses; /** La encuesta. */ survey: VisitSurveys; /** Preguntas en orden. */ questions: VisitSurveyQuestions[]; }>` | No |
| 404 | Consulta completada correctamente. | `Promise<{ /** El envío. */ response: VisitSurveyResponses; /** La encuesta. */ survey: VisitSurveys; /** Preguntas en orden. */ questions: VisitSurveyQuestions[]; }>` | No |
| 429 | Consulta completada correctamente. | `Promise<{ /** El envío. */ response: VisitSurveyResponses; /** La encuesta. */ survey: VisitSurveys; /** Preguntas en orden. */ questions: VisitSurveyQuestions[]; }>` | No |
| 500 | Consulta completada correctamente. | `Promise<{ /** El envío. */ response: VisitSurveyResponses; /** La encuesta. */ survey: VisitSurveys; /** Preguntas en orden. */ questions: VisitSurveyQuestions[]; }>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ /** El envío. */ response: VisitSurveyResponses; /** La encuesta. */ survey: VisitSurveys; /** Preguntas en orden. */ questions: VisitSurveyQuestions[]; }`. Ejemplo completo derivado de ese DTO:

```json
{
  "response": {
    "id": "00000000-0000-4000-8000-000000000001",
    "visitSurveyId": "00000000-0000-4000-8000-000000000001",
    "visitRecordId": "00000000-0000-4000-8000-000000000001",
    "doctorUserId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "issuedAt": "2026-07-31T12:00:00.000Z",
    "submittedAt": "2026-07-31T12:00:00.000Z",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
  },
  "survey": {
    "id": "00000000-0000-4000-8000-000000000001",
    "pharmaLabId": "00000000-0000-4000-8000-000000000001",
    "title": "valor-ejemplo",
    "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
    "pharmaProductId": "00000000-0000-4000-8000-000000000001",
    "campaignCode": "CODIGO_EJEMPLO",
    "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
    "validFrom": "valor-ejemplo",
    "validTo": "valor-ejemplo",
    "sendDelayHours": 1,
    "reminderCount": 1,
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "createdAt": "2026-07-31T12:00:00.000Z",
    "updatedAt": "2026-07-31T12:00:00.000Z",
    "createdByUserId": "00000000-0000-4000-8000-000000000001",
    "updatedByUserId": "00000000-0000-4000-8000-000000000001",
    "rowVersion": 1
  },
  "questions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "visitSurveyId": "00000000-0000-4000-8000-000000000001",
      "position": 1,
      "prompt": "valor-ejemplo",
      "answerTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "isRequired": true,
      "options": [
        "valor-ejemplo"
      ],
      "createdAt": "2026-07-31T12:00:00.000Z",
      "createdByUserId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `response` | Sí | `VisitSurveyResponses` | Sin restricción adicional declarada | El envío. | `{"id":"00000000-0000-4000-8000-000000000001","visitSurveyId":"00000000-0000-4000-8000-000000000001","visitRecordId":"00000000-0000-4000-8000-000000000001","doctorUserId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","issuedAt":"2026-07-31T12:00:00.000Z","submittedAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z","createdByUserId":"00000000-0000-4000-8000-000000000001","updatedByUserId":"00000000-0000-4000-8000-000000000001","rowVersion":1}` |
| `response.id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `response.visitSurveyId` | Sí | `string` | Sin restricción adicional declarada | Encuesta emitida. | `00000000-0000-4000-8000-000000000001` |
| `response.visitRecordId` | Sí | `string` | Sin restricción adicional declarada | Visita que la origina. | `00000000-0000-4000-8000-000000000001` |
| `response.doctorUserId` | Sí | `string` | Sin restricción adicional declarada | Único destinatario autorizado a responder. | `00000000-0000-4000-8000-000000000001` |
| `response.statusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado: pendiente o enviada. | `00000000-0000-4000-8000-000000000001` |
| `response.issuedAt` | Sí | `string` | formato `date-time` | Momento del envío al doctor. | `2026-07-31T12:00:00.000Z` |
| `response.submittedAt` | No | `string` | formato `date-time` | Momento en que el doctor respondió. | `2026-07-31T12:00:00.000Z` |
| `response.createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `response.updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |
| `response.createdByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a created by user. | `00000000-0000-4000-8000-000000000001` |
| `response.updatedByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a updated by user. | `00000000-0000-4000-8000-000000000001` |
| `response.rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión usada para controlar actualizaciones concurrentes. | `1` |
| `survey` | Sí | `VisitSurveys` | Sin restricción adicional declarada | La encuesta. | `{"id":"00000000-0000-4000-8000-000000000001","pharmaLabId":"00000000-0000-4000-8000-000000000001","title":"valor-ejemplo","medicalVisitorId":"00000000-0000-4000-8000-000000000001","pharmaProductId":"00000000-0000-4000-8000-000000000001","campaignCode":"CODIGO_EJEMPLO","specialtyConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"valor-ejemplo","validTo":"valor-ejemplo","sendDelayHours":1,"reminderCount":1,"statusConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z","createdByUserId":"00000000-0000-4000-8000-000000000001","updatedByUserId":"00000000-0000-4000-8000-000000000001","rowVersion":1}` |
| `survey.id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `survey.pharmaLabId` | Sí | `string` | Sin restricción adicional declarada | Laboratorio que la configura. | `00000000-0000-4000-8000-000000000001` |
| `survey.title` | Sí | `string` | Sin restricción adicional declarada | Título. | `valor-ejemplo` |
| `survey.medicalVisitorId` | No | `string` | Sin restricción adicional declarada | Visitador al que se acota, si aplica. | `00000000-0000-4000-8000-000000000001` |
| `survey.pharmaProductId` | No | `string` | Sin restricción adicional declarada | Producto al que se acota, si aplica. | `00000000-0000-4000-8000-000000000001` |
| `survey.campaignCode` | No | `string` | Sin restricción adicional declarada | Campaña a la que se acota. | `CODIGO_EJEMPLO` |
| `survey.specialtyConceptId` | No | `string` | Sin restricción adicional declarada | Especialidad a la que se acota. | `00000000-0000-4000-8000-000000000001` |
| `survey.validFrom` | Sí | `string` | Sin restricción adicional declarada | Inicio de vigencia. | `valor-ejemplo` |
| `survey.validTo` | No | `string` | Sin restricción adicional declarada | Fin de vigencia. | `valor-ejemplo` |
| `survey.sendDelayHours` | Sí | `number` | Sin restricción adicional declarada | Horas después de la visita en que se envía. | `1` |
| `survey.reminderCount` | Sí | `number` | Sin restricción adicional declarada | Cantidad de recordatorios programados. | `1` |
| `survey.statusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado de la encuesta. | `00000000-0000-4000-8000-000000000001` |
| `survey.createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `survey.updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |
| `survey.createdByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a created by user. | `00000000-0000-4000-8000-000000000001` |
| `survey.updatedByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a updated by user. | `00000000-0000-4000-8000-000000000001` |
| `survey.rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión usada para controlar actualizaciones concurrentes. | `1` |
| `questions` | Sí | `array<VisitSurveyQuestions>` | Sin restricción adicional declarada | Preguntas en orden. | `[{"id":"00000000-0000-4000-8000-000000000001","visitSurveyId":"00000000-0000-4000-8000-000000000001","position":1,"prompt":"valor-ejemplo","answerTypeConceptId":"00000000-0000-4000-8000-000000000001","isRequired":true,"options":["valor-ejemplo"],"createdAt":"2026-07-31T12:00:00.000Z","createdByUserId":"00000000-0000-4000-8000-000000000001"}]` |
| `questions[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `questions[].visitSurveyId` | Sí | `string` | Sin restricción adicional declarada | Encuesta a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `questions[].position` | Sí | `number` | Sin restricción adicional declarada | Orden de presentación. | `1` |
| `questions[].prompt` | Sí | `string` | Sin restricción adicional declarada | Enunciado. | `valor-ejemplo` |
| `questions[].answerTypeConceptId` | Sí | `string` | Sin restricción adicional declarada | Tipo de respuesta esperada. | `00000000-0000-4000-8000-000000000001` |
| `questions[].isRequired` | Sí | `boolean` | Sin restricción adicional declarada | Si la respuesta es obligatoria. | `true` |
| `questions[].options` | No | `array<string>` | Sin restricción adicional declarada | Opciones, cuando el tipo de respuesta es de opción única. | `["valor-ejemplo"]` |
| `questions[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `questions[].createdByUserId` | No | `string` | Sin restricción adicional declarada | Identificador asociado a created by user. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Encuesta no encontrada | Excepción explícita en src/modules/pharma_lab/services/visit-surveys.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-surveys/responses/{responseId}"
}
```

---

## 76. POST /visit-surveys/responses/{responseId}

- **Módulo:** `pharma_lab`
- **Etiqueta OpenAPI:** `pharma-lab-visit-surveys`
- **Nombre:** Responder la encuesta de la visita
- **Operation ID:** `VisitSurveysController_submit`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VisitSurveysController.submit](../../src/modules/pharma_lab/controllers/visit-surveys.controller.ts)

### Descripción de negocio

Responder la encuesta de la visita. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /visit-surveys/responses/{responseId}` en `VisitSurveysController_submit`. El controlador delega en `VisitSurveysService.submitResponse`. Valida el body como `SubmitSurveyResponseDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `responseId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SubmitSurveyResponseDto`; los campos opcionales se omiten.

```http
POST /visit-surveys/responses/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "answers": [
    {
      "visitSurveyQuestionId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRACTITIONER`, `CLINICIAN`.
- Deben ser UUID válidos: `responseId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `answers` | Sí | `array<SurveyAnswerDto>` | máximo 40 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"visitSurveyQuestionId":"00000000-0000-4000-8000-000000000001","numericValue":1,"booleanValue":true,"textValue":"valor-ejemplo"}]` |
| `answers[].visitSurveyQuestionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `answers[].numericValue` | No | `number` | mínimo 0; máximo 10 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `answers[].booleanValue` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `answers[].textValue` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /visit-surveys/responses/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "answers": [
    {
      "visitSurveyQuestionId": "00000000-0000-4000-8000-000000000001",
      "numericValue": 1,
      "booleanValue": true,
      "textValue": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del recurso afectado. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto del estado en que quedó el recurso. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRACTITIONER, CLINICIAN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Encuesta no encontrada | Excepción explícita en src/modules/pharma_lab/services/visit-surveys.service.ts |
| 409 | `CONFLICT` | La encuesta ya fue respondida | Excepción explícita en src/modules/pharma_lab/services/visit-surveys.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Faltan respuestas obligatorias | Excepción explícita en src/modules/pharma_lab/services/visit-surveys.service.ts |
| 422 | `PRECONDITION_FAILED` | Alguna respuesta no corresponde a una pregunta de esta encuesta | Excepción explícita en src/modules/pharma_lab/services/visit-surveys.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/visit-surveys/responses/{responseId}"
}
```

---

