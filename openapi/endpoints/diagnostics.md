<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `diagnostics`

Referencia exhaustiva de 63 operación(es) del módulo `diagnostics`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `diagnostics-imaging`, `diagnostics-lab-portal`, `diagnostics-laboratory`, `diagnostics-orders`, `diagnostics-patient-results`, `diagnostics-public`, `diagnostics-reception`, `diagnostics-report-drafts`, `diagnostics-reports`, `diagnostics-specimens`
- **Controladores:** `DiagnosticsImagingController`, `DiagnosticsLabController`, `DiagnosticsLabPortalController`, `DiagnosticsLabResultsController`, `DiagnosticsLabUploadsController`, `DiagnosticsOrdersController`, `DiagnosticsPatientResultsController`, `DiagnosticsReceptionController`, `DiagnosticsReportDraftsController`, `DiagnosticsReportPublishController`, `DiagnosticsReportReleaseController`, `DiagnosticsReportVerifyPublicController`, `DiagnosticsReportsController`, `DiagnosticsSpecimensController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /diagnostic-results/me](#1-get-diagnostic-results-me) — Resultados de laboratorio, informes e imagen del titular
2. [GET /diagnostic-results/me/{reportId}](#2-get-diagnostic-results-me-reportid) — Un resultado del titular, con sus archivos
3. [GET /diagnostic-results/me/{reportId}/files/{fileId}/content](#3-get-diagnostic-results-me-reportid-files-fileid-content) — Descargar un archivo de un resultado del titular
4. [GET /diagnostic-results/me/{reportId}/shares](#4-get-diagnostic-results-me-reportid-shares) — Con quién está compartido un resultado
5. [POST /diagnostic-results/me/{reportId}/shares](#5-post-diagnostic-results-me-reportid-shares) — Compartir temporalmente un resultado con un profesional
6. [POST /diagnostic-results/me/{reportId}/shares/{shareId}/revoke](#6-post-diagnostic-results-me-reportid-shares-shareid-revoke) — Dejar de compartir un resultado
7. [GET /diagnostic-results/me/orders](#7-get-diagnostic-results-me-orders) — Órdenes de laboratorio e imagen del titular
8. [POST /diagnostics/accessions](#8-post-diagnostics-accessions) — Acesionar especímenes recibidos en laboratorio
9. [GET /diagnostics/accessions/{id}](#9-get-diagnostics-accessions-id) — Detalle de una acesión (especímenes, contenedores y custodia)
10. [POST /diagnostics/analyzer-runs](#10-post-diagnostics-analyzer-runs) — Abrir una corrida de analizador (soporte para ingesta)
11. [POST /diagnostics/analyzer-runs/{id}/messages](#11-post-diagnostics-analyzer-runs-id-messages) — Ingerir mensaje de resultado de analizador (LIS/HL7/ASTM)
12. [POST /diagnostics/clinical-media](#12-post-diagnostics-clinical-media) — Adjuntar media clínica / imagen al chart
13. [POST /diagnostics/containers/{id}/custody-events](#13-post-diagnostics-containers-id-custody-events) — Registrar cadena de custodia / traslado de contenedor
14. [POST /diagnostics/critical-results](#14-post-diagnostics-critical-results) — Detectar y notificar un resultado crítico
15. [POST /diagnostics/critical-results/{id}/acknowledge](#15-post-diagnostics-critical-results-id-acknowledge) — Acusar recibo / escalar notificación crítica
16. [POST /diagnostics/data-quality-events](#16-post-diagnostics-data-quality-events) — Registrar evento de calidad de datos + enlazar provenance
17. [POST /diagnostics/imaging-endpoints](#17-post-diagnostics-imaging-endpoints) — Registrar un endpoint DICOM (soporte para STOW-RS)
18. [POST /diagnostics/imaging-studies/{id}/dose-events](#18-post-diagnostics-imaging-studies-id-dose-events) — Registrar evento de dosis de radiación
19. [GET /diagnostics/lab/orders](#19-get-diagnostics-lab-orders) — Órdenes derivadas al laboratorio, con su estado derivado
20. [POST /diagnostics/lab/orders](#20-post-diagnostics-lab-orders) — El centro carga una orden que llega en papel o por mostrador
21. [PUT /diagnostics/lab/orders/{orderId}](#21-put-diagnostics-lab-orders-orderid) — Corregir una orden que cargó el centro, antes de recibirla
22. [POST /diagnostics/lab/orders/{orderId}/transitions](#22-post-diagnostics-lab-orders-orderid-transitions) — Un paso del camino de la orden (RECEIVE, PROCESS, REJECT, CANCEL)
23. [POST /diagnostics/lab/patients/lookup](#23-post-diagnostics-lab-patients-lookup) — Paciente por número de documento, para cargar su orden
24. [GET /diagnostics/lab/result-files](#24-get-diagnostics-lab-result-files) — Resultados subidos por el laboratorio
25. [GET /diagnostics/lab/result-files/{id}/content](#25-get-diagnostics-lab-result-files-id-content) — Descargar un resultado subido
26. [POST /diagnostics/lab/result-files/{id}/withdrawal](#26-post-diagnostics-lab-result-files-id-withdrawal) — Retirar un resultado subido por error (queda en el historial)
27. [POST /diagnostics/lab/result-files/search](#27-post-diagnostics-lab-result-files-search) — Buscar entre los resultados subidos (filtros en el cuerpo)
28. [GET /diagnostics/lab/result-targets](#28-get-diagnostics-lab-result-targets) — Órdenes procesadas a las que se puede adjuntar un resultado
29. [POST /diagnostics/lab/result-uploads](#29-post-diagnostics-lab-result-uploads) — Empezar la subida por partes de un resultado
30. [DELETE /diagnostics/lab/result-uploads/{uploadId}](#30-delete-diagnostics-lab-result-uploads-uploadid) — Cancelar una subida abierta
31. [POST /diagnostics/lab/result-uploads/{uploadId}/complete](#31-post-diagnostics-lab-result-uploads-uploadid-complete) — Cerrar la subida: guarda el archivo y lo publica en el informe
32. [PUT /diagnostics/lab/result-uploads/{uploadId}/parts/{index}](#32-put-diagnostics-lab-result-uploads-uploadid-parts-index) — Mandar una parte (bytes crudos)
33. [GET /diagnostics/lab/summary](#33-get-diagnostics-lab-summary) — Resumen del laboratorio del tenant activo
34. [GET /diagnostics/patients/{patientProfileId}/imaging-studies](#34-get-diagnostics-patients-patientprofileid-imaging-studies) — Listar los estudios de imagen del paciente
35. [GET /diagnostics/patients/{patientProfileId}/orders](#35-get-diagnostics-patients-patientprofileid-orders) — Órdenes de laboratorio e imagenología del paciente, con sus informes
36. [GET /diagnostics/patients/{patientProfileId}/reports/{reportId}](#36-get-diagnostics-patients-patientprofileid-reports-reportid) — Resultado liberado de un informe del paciente
37. [GET /diagnostics/patients/{patientProfileId}/reports/{reportId}/files/{fileId}/content](#37-get-diagnostics-patients-patientprofileid-reports-reportid-files-fileid-content) — Descargar un archivo del resultado liberado
38. [POST /diagnostics/report-drafts](#38-post-diagnostics-report-drafts) — Abrir (u obtener) el borrador del informe de una orden
39. [GET /diagnostics/report-drafts/{id}](#39-get-diagnostics-report-drafts-id) — Borrador del informe
40. [PUT /diagnostics/report-drafts/{id}](#40-put-diagnostics-report-drafts-id) — Guardar el borrador (409 si cambió o ya se publicó)
41. [POST /diagnostics/report-drafts/{id}/files](#41-post-diagnostics-report-drafts-id-files) — Adjuntar documento, audio o anexo al borrador
42. [DELETE /diagnostics/report-drafts/{id}/files/{draftFileId}](#42-delete-diagnostics-report-drafts-id-files-draftfileid) — Quitar un archivo del borrador
43. [POST /diagnostics/report-drafts/{id}/preview](#43-post-diagnostics-report-drafts-id-preview) — Vista previa en PDF con marca de agua «BORRADOR»
44. [POST /diagnostics/report-drafts/{id}/publish](#44-post-diagnostics-report-drafts-id-publish) — Publicar el informe: versión inmutable, PDF oficial y liberación
45. [POST /diagnostics/report-drafts/{id}/signature-request](#45-post-diagnostics-report-drafts-id-signature-request) — Pedir al firmante elegido que revise y publique con su firma
46. [GET /diagnostics/report-drafts/signers](#46-get-diagnostics-report-drafts-signers) — Profesionales que pueden firmar informes
47. [GET /diagnostics/report-issuer-settings](#47-get-diagnostics-report-issuer-settings) — Firma, sello y responsable de los informes
48. [PUT /diagnostics/report-issuer-settings](#48-put-diagnostics-report-issuer-settings) — Cambiar firma, sello y responsable (OWNER/ADMIN)
49. [POST /diagnostics/reports/{reportId}/patient-release](#49-post-diagnostics-reports-reportid-patient-release) — Liberar al paciente un resultado retenido
50. [POST /diagnostics/reports/{reportId}/versions](#50-post-diagnostics-reports-reportid-versions) — Crear/enmendar versión de informe diagnóstico
51. [POST /diagnostics/reports/{reportId}/versions/{versionId}/release](#51-post-diagnostics-reports-reportid-versions-versionid-release) — Validar y liberar una versión del informe
52. [POST /diagnostics/results/{observationId}/verifications](#52-post-diagnostics-results-observationid-verifications) — Verificar (técnica/facultativa) un resultado
53. [GET /diagnostics/service-requests/{id}](#53-get-diagnostics-service-requests-id) — Detalle de una orden dirigida al tenant activo
54. [POST /diagnostics/service-requests/inbox](#54-post-diagnostics-service-requests-inbox) — Bandeja de órdenes de laboratorio por recibir
55. [POST /diagnostics/service-requests/worklist](#55-post-diagnostics-service-requests-worklist) — Bandeja del ejecutor: órdenes de laboratorio o imagen con estado derivado
56. [POST /diagnostics/specimens](#56-post-diagnostics-specimens) — Registrar un espécimen (soporte para acesión)
57. [GET /diagnostics/specimens/{id}](#57-get-diagnostics-specimens-id) — Detalle de un espécimen (con su cadena de custodia)
58. [POST /diagnostics/specimens/{id}/containers](#58-post-diagnostics-specimens-id-containers) — Registrar un contenedor de espécimen (soporte para custodia)
59. [POST /diagnostics/specimens/{id}/rejection](#59-post-diagnostics-specimens-id-rejection) — Rechazar espécimen y solicitar recolección
60. [GET /diagnostics/work-orders](#60-get-diagnostics-work-orders) — Listar las órdenes de trabajo del laboratorio
61. [POST /diagnostics/work-orders](#61-post-diagnostics-work-orders) — Abrir orden de trabajo y desglosar pruebas
62. [POST /dicomweb/studies](#62-post-dicomweb-studies) — Ingestar estudio DICOM (STOW-RS) y ubicaciones de objeto
63. [GET /public/diagnostic-reports/{versionId}/verify](#63-get-public-diagnostic-reports-versionid-verify) — Verificar la autenticidad de un informe diagnóstico

---

## 1. GET /diagnostic-results/me

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-patient-results`
- **Nombre:** Resultados de laboratorio, informes e imagen del titular
- **Operation ID:** `DiagnosticsPatientResultsController_listOwnResults`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsPatientResultsController.listOwnResults](../../src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts)

### Descripción de negocio

Sólo versiones liberadas con visibilidad de paciente. Un informe redactado y no liberado no aparece.

Contexto declarado en el controlador: Los resultados liberados del titular.

### Descripción del sistema

NestJS resuelve `GET /diagnostic-results/me` en `DiagnosticsPatientResultsController_listOwnResults`. El controlador delega en `DiagnosticsPatientResultsService.listOwnResults`. No recibe body. El tipo de retorno estático es `Promise<PatientDiagnosticResultsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope de informes considerados (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-results/me HTTP/1.1
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
GET /diagnostic-results/me?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PatientDiagnosticResultsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PatientDiagnosticResultsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PatientDiagnosticResultsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PatientDiagnosticResultsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PatientDiagnosticResultsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PatientDiagnosticResultsResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PatientDiagnosticResultsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientDiagnosticResultsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "reportId": "00000000-0000-4000-8000-000000000001",
      "versionId": "00000000-0000-4000-8000-000000000001",
      "versionNumber": 1,
      "serviceRequestId": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "categoryConceptId": "00000000-0000-4000-8000-000000000001",
      "custodianTenantId": "00000000-0000-4000-8000-000000000001",
      "conclusionText": "valor-ejemplo",
      "issuedAt": "2026-07-31T12:00:00.000Z",
      "releasedAt": "2026-07-31T12:00:00.000Z",
      "clinicalStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "observationIds": [
        "valor-ejemplo"
      ],
      "files": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "fileId": "00000000-0000-4000-8000-000000000001",
          "contentRoleConceptId": "00000000-0000-4000-8000-000000000001",
          "role": "OFFICIAL",
          "presentationFormatConceptId": "00000000-0000-4000-8000-000000000001",
          "ordinal": 1
        }
      ]
    }
  ],
  "limit": 1,
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente leído. | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<PatientDiagnosticResultDto>` | Sin restricción adicional declarada | Resultados liberados, del más nuevo al más viejo. | `[{"reportId":"00000000-0000-4000-8000-000000000001","versionId":"00000000-0000-4000-8000-000000000001","versionNumber":1,"serviceRequestId":"00000000-0000-4000-8000-000000000001","codeConceptId":"00000000-0000-4000-8000-000000000001","categoryConceptId":"00000000-0000-4000-8000-000000000001","custodianTenantId":"00000000-0000-4000-8000-000000000001","conclusionText":"valor-ejemplo","issuedAt":"2026-07-31T12:00:00.000Z","releasedAt":"2026-07-31T12:00:00.000Z","clinicalStatusConceptId":"00000000-0000-4000-8000-000000000001","observationIds":["valor-ejemplo"],"files":[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","contentRoleConceptId":"00000000-0000-4000-8000-000000000001","role":"OFFICIAL","presentationFormatConceptId":"00000000-0000-4000-8000-000000000001","ordinal":1}]}]` |
| `items[].reportId` | Sí | `string` | formato `uuid` | Informe (`clinical.diagnostic_reports`). | `00000000-0000-4000-8000-000000000001` |
| `items[].versionId` | Sí | `string` | formato `uuid` | Versión liberada que se está mostrando. | `00000000-0000-4000-8000-000000000001` |
| `items[].versionNumber` | Sí | `number` | Sin restricción adicional declarada | Número de esa versión; una enmienda posterior tiene un número mayor. | `1` |
| `items[].serviceRequestId` | No | `string` | formato `uuid` | Orden que lo originó, si cuelga de una. | `00000000-0000-4000-8000-000000000001` |
| `items[].codeConceptId` | Sí | `string` | formato `uuid` | Qué informa (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].categoryConceptId` | No | `string` | formato `uuid` | Laboratorio o imagenología (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].custodianTenantId` | Sí | `string` | formato `uuid` | Organización que lo emitió y lo custodia. | `00000000-0000-4000-8000-000000000001` |
| `items[].conclusionText` | No | `string` | Sin restricción adicional declarada | Conclusión firmada, si la versión la trae. | `valor-ejemplo` |
| `items[].issuedAt` | No | `string` | formato `date-time` | Cuándo se emitió la versión. | `2026-07-31T12:00:00.000Z` |
| `items[].releasedAt` | Sí | `string` | formato `date-time` | Cuándo se liberó al paciente. | `2026-07-31T12:00:00.000Z` |
| `items[].clinicalStatusConceptId` | Sí | `string` | formato `uuid` | Estado clínico de la versión (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].observationIds` | Sí | `array<string>` | formato `uuid` | Observaciones enlazadas a la versión. | `["valor-ejemplo"]` |
| `items[].files` | Sí | `array<DiagnosticResultFileDto>` | Sin restricción adicional declarada | Archivos descargables de la versión. | `[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","contentRoleConceptId":"00000000-0000-4000-8000-000000000001","role":"OFFICIAL","presentationFormatConceptId":"00000000-0000-4000-8000-000000000001","ordinal":1}]` |
| `items[].files[].id` | Sí | `string` | formato `uuid` | Identificador del enlace informe↔archivo. | `00000000-0000-4000-8000-000000000001` |
| `items[].files[].fileId` | Sí | `string` | formato `uuid` | Archivo en `common.files`; se descarga por `/common/files/{id}/content`. | `00000000-0000-4000-8000-000000000001` |
| `items[].files[].contentRoleConceptId` | Sí | `string` | formato `uuid` | Qué es el archivo dentro del informe (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].files[].role` | Sí | `string` | valores: `OFFICIAL`, `ANNEX` | The same content role without UUIDs: `OFFICIAL` is the signed PDF of a published report, `ANNEX` one of its annexes, `null` any other file. | `OFFICIAL` |
| `items[].files[].presentationFormatConceptId` | No | `string` | formato `uuid` | Formato de presentación (concept id), si se declaró. | `00000000-0000-4000-8000-000000000001` |
| `items[].files[].ordinal` | No | `number` | Sin restricción adicional declarada | Posición dentro del informe. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado. | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | La lista quedó recortada por el tope. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene perfil de paciente | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-results/me"
}
```

---

## 2. GET /diagnostic-results/me/{reportId}

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-patient-results`
- **Nombre:** Un resultado del titular, con sus archivos
- **Operation ID:** `DiagnosticsPatientResultsController_getOwnResult`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsPatientResultsController.getOwnResult](../../src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts)

### Descripción de negocio

Cada `fileId` se descarga por `GET /diagnostic-results/me/{reportId}/files/{fileId}/content`. La vía genérica `/common/files/{id}/content` es sólo para quien subió el archivo: el laboratorio lo subió, no el titular.

Contexto declarado en el controlador: Un resultado concreto del titular.

### Descripción del sistema

NestJS resuelve `GET /diagnostic-results/me/{reportId}` en `DiagnosticsPatientResultsController_getOwnResult`. El controlador delega en `DiagnosticsPatientResultsService.getOwnResult`. No recibe body. El tipo de retorno estático es `Promise<PatientDiagnosticResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `reportId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-results/me/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Deben ser UUID válidos: `reportId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-results/me/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PatientDiagnosticResultDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PatientDiagnosticResultDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PatientDiagnosticResultDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PatientDiagnosticResultDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PatientDiagnosticResultDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PatientDiagnosticResultDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PatientDiagnosticResultDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PatientDiagnosticResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientDiagnosticResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reportId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "conclusionText": "valor-ejemplo",
  "issuedAt": "2026-07-31T12:00:00.000Z",
  "releasedAt": "2026-07-31T12:00:00.000Z",
  "clinicalStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "observationIds": [
    "valor-ejemplo"
  ],
  "files": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fileId": "00000000-0000-4000-8000-000000000001",
      "contentRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "role": "OFFICIAL",
      "presentationFormatConceptId": "00000000-0000-4000-8000-000000000001",
      "ordinal": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reportId` | Sí | `string` | formato `uuid` | Informe (`clinical.diagnostic_reports`). | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Versión liberada que se está mostrando. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Número de esa versión; una enmienda posterior tiene un número mayor. | `1` |
| `serviceRequestId` | No | `string` | formato `uuid` | Orden que lo originó, si cuelga de una. | `00000000-0000-4000-8000-000000000001` |
| `codeConceptId` | Sí | `string` | formato `uuid` | Qué informa (concept id). | `00000000-0000-4000-8000-000000000001` |
| `categoryConceptId` | No | `string` | formato `uuid` | Laboratorio o imagenología (concept id). | `00000000-0000-4000-8000-000000000001` |
| `custodianTenantId` | Sí | `string` | formato `uuid` | Organización que lo emitió y lo custodia. | `00000000-0000-4000-8000-000000000001` |
| `conclusionText` | No | `string` | Sin restricción adicional declarada | Conclusión firmada, si la versión la trae. | `valor-ejemplo` |
| `issuedAt` | No | `string` | formato `date-time` | Cuándo se emitió la versión. | `2026-07-31T12:00:00.000Z` |
| `releasedAt` | Sí | `string` | formato `date-time` | Cuándo se liberó al paciente. | `2026-07-31T12:00:00.000Z` |
| `clinicalStatusConceptId` | Sí | `string` | formato `uuid` | Estado clínico de la versión (concept id). | `00000000-0000-4000-8000-000000000001` |
| `observationIds` | Sí | `array<string>` | formato `uuid` | Observaciones enlazadas a la versión. | `["valor-ejemplo"]` |
| `files` | Sí | `array<DiagnosticResultFileDto>` | Sin restricción adicional declarada | Archivos descargables de la versión. | `[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","contentRoleConceptId":"00000000-0000-4000-8000-000000000001","role":"OFFICIAL","presentationFormatConceptId":"00000000-0000-4000-8000-000000000001","ordinal":1}]` |
| `files[].id` | Sí | `string` | formato `uuid` | Identificador del enlace informe↔archivo. | `00000000-0000-4000-8000-000000000001` |
| `files[].fileId` | Sí | `string` | formato `uuid` | Archivo en `common.files`; se descarga por `/common/files/{id}/content`. | `00000000-0000-4000-8000-000000000001` |
| `files[].contentRoleConceptId` | Sí | `string` | formato `uuid` | Qué es el archivo dentro del informe (concept id). | `00000000-0000-4000-8000-000000000001` |
| `files[].role` | Sí | `string` | valores: `OFFICIAL`, `ANNEX` | The same content role without UUIDs: `OFFICIAL` is the signed PDF of a published report, `ANNEX` one of its annexes, `null` any other file. | `OFFICIAL` |
| `files[].presentationFormatConceptId` | No | `string` | formato `uuid` | Formato de presentación (concept id), si se declaró. | `00000000-0000-4000-8000-000000000001` |
| `files[].ordinal` | No | `number` | Sin restricción adicional declarada | Posición dentro del informe. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 401 | `UNAUTHENTICATED` | El informe no pertenece a esta cuenta | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El resultado todavía no está disponible | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 404 | `NOT_FOUND` | Informe no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene perfil de paciente | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-results/me/{reportId}"
}
```

---

## 3. GET /diagnostic-results/me/{reportId}/files/{fileId}/content

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-patient-results`
- **Nombre:** Descargar un archivo de un resultado del titular
- **Operation ID:** `DiagnosticsPatientResultsController_getOwnResultFileContent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsPatientResultsController.getOwnResultFileContent](../../src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts)

### Descripción de negocio

Autoriza por titularidad y versión liberada y visible, no por autoría del archivo. Todo lo que no cumpla responde 404.

Contexto declarado en el controlador: Los bytes de un archivo de un resultado del titular (CL-40).

### Descripción del sistema

NestJS resuelve `GET /diagnostic-results/me/{reportId}/files/{fileId}/content` en `DiagnosticsPatientResultsController_getOwnResultFileContent`. El controlador delega en `DiagnosticsPatientResultsService.getOwnResultFileContent`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `reportId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `fileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-results/me/00000000-0000-4000-8000-000000000001/files/00000000-0000-4000-8000-000000000001/content HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Deben ser UUID válidos: `reportId`, `fileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-results/me/00000000-0000-4000-8000-000000000001/files/00000000-0000-4000-8000-000000000001/content HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Bytes del archivo | `Promise<void>` | No |
| 400 | Consulta completada correctamente. | `Promise<void>` | No |
| 401 | Consulta completada correctamente. | `Promise<void>` | No |
| 403 | Consulta completada correctamente. | `Promise<void>` | No |
| 404 | No es del titular, no está liberado, o el archivo no cuelga del informe | `Promise<void>` | No |
| 429 | Consulta completada correctamente. | `Promise<void>` | No |
| 500 | Consulta completada correctamente. | `Promise<void>` | No |
| 504 | Consulta completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | La descarga de archivos no está disponible | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene perfil de paciente | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-results/me/{reportId}/files/{fileId}/content"
}
```

---

## 4. GET /diagnostic-results/me/{reportId}/shares

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-patient-results`
- **Nombre:** Con quién está compartido un resultado
- **Operation ID:** `DiagnosticsPatientResultsController_listOwnResultShares`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsPatientResultsController.listOwnResultShares](../../src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts)

### Descripción de negocio

Con quién está compartido un resultado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Con quién está compartido un resultado.

### Descripción del sistema

NestJS resuelve `GET /diagnostic-results/me/{reportId}/shares` en `DiagnosticsPatientResultsController_listOwnResultShares`. El controlador delega en `DiagnosticsPatientResultsService.listOwnResultShares`. No recibe body. El tipo de retorno estático es `Promise<DiagnosticResultSharesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `reportId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-results/me/00000000-0000-4000-8000-000000000001/shares HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Deben ser UUID válidos: `reportId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostic-results/me/00000000-0000-4000-8000-000000000001/shares HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DiagnosticResultSharesResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<DiagnosticResultSharesResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DiagnosticResultSharesResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DiagnosticResultSharesResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<DiagnosticResultSharesResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DiagnosticResultSharesResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DiagnosticResultSharesResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<DiagnosticResultSharesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosticResultSharesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reportId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "reportId": "00000000-0000-4000-8000-000000000001",
      "practitionerUserId": "00000000-0000-4000-8000-000000000001",
      "practitionerName": "Nombre de ejemplo",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z",
      "active": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reportId` | Sí | `string` | formato `uuid` | Informe consultado. | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<DiagnosticResultShareDto>` | Sin restricción adicional declarada | Los compartidos, del más nuevo al más viejo. | `[{"id":"00000000-0000-4000-8000-000000000001","reportId":"00000000-0000-4000-8000-000000000001","practitionerUserId":"00000000-0000-4000-8000-000000000001","practitionerName":"Nombre de ejemplo","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z","active":true}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del grant. | `00000000-0000-4000-8000-000000000001` |
| `items[].reportId` | Sí | `string` | formato `uuid` | Informe compartido. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerUserId` | Sí | `string` | formato `uuid` | Cuenta del profesional con quien se compartió. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerName` | No | `string` | Sin restricción adicional declarada | Nombre del profesional, para que «Compartido con» no muestre un uuid. Ausente si la cuenta perdió su vínculo con la persona. | `Nombre de ejemplo` |
| `items[].validFrom` | Sí | `string` | formato `date-time` | Desde cuándo vale. | `2026-07-31T12:00:00.000Z` |
| `items[].validTo` | No | `string` | formato `date-time` | Hasta cuándo vale. | `2026-07-31T12:00:00.000Z` |
| `items[].active` | Sí | `boolean` | Sin restricción adicional declarada | Si el grant está vigente en este momento. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 401 | `UNAUTHENTICATED` | El informe no pertenece a esta cuenta | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Informe no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene perfil de paciente | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-results/me/{reportId}/shares"
}
```

---

## 5. POST /diagnostic-results/me/{reportId}/shares

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-patient-results`
- **Nombre:** Compartir temporalmente un resultado con un profesional
- **Operation ID:** `DiagnosticsPatientResultsController_shareOwnResult`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsPatientResultsController.shareOwnResult](../../src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts)

### Descripción de negocio

El acceso vence en `validUntil`; no hay forma de compartir sin plazo.

Contexto declarado en el controlador: Comparte un resultado con un profesional, hasta una fecha.

### Descripción del sistema

NestJS resuelve `POST /diagnostic-results/me/{reportId}/shares` en `DiagnosticsPatientResultsController_shareOwnResult`. El controlador delega en `DiagnosticsPatientResultsService.shareOwnResult`. Valida el body como `ShareDiagnosticResultDto` y consume `application/json`. El tipo de retorno estático es `Promise<DiagnosticResultShareDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `reportId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ShareDiagnosticResultDto`; los campos opcionales se omiten.

```http
POST /diagnostic-results/me/00000000-0000-4000-8000-000000000001/shares HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "validUntil": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Deben ser UUID válidos: `reportId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `practitionerProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `validUntil` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostic-results/me/00000000-0000-4000-8000-000000000001/shares HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "validUntil": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 504 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosticResultShareDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "reportId": "00000000-0000-4000-8000-000000000001",
  "practitionerUserId": "00000000-0000-4000-8000-000000000001",
  "practitionerName": "Nombre de ejemplo",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "active": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del grant. | `00000000-0000-4000-8000-000000000001` |
| `reportId` | Sí | `string` | formato `uuid` | Informe compartido. | `00000000-0000-4000-8000-000000000001` |
| `practitionerUserId` | Sí | `string` | formato `uuid` | Cuenta del profesional con quien se compartió. | `00000000-0000-4000-8000-000000000001` |
| `practitionerName` | No | `string` | Sin restricción adicional declarada | Nombre del profesional, para que «Compartido con» no muestre un uuid. Ausente si la cuenta perdió su vínculo con la persona. | `Nombre de ejemplo` |
| `validFrom` | Sí | `string` | formato `date-time` | Desde cuándo vale. | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Hasta cuándo vale. | `2026-07-31T12:00:00.000Z` |
| `active` | Sí | `boolean` | Sin restricción adicional declarada | Si el grant está vigente en este momento. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 401 | `UNAUTHENTICATED` | El informe no pertenece a esta cuenta | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El profesional no tiene una cuenta activa en el portal | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 404 | `NOT_FOUND` | Informe no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El vencimiento del acceso compartido tiene que ser futuro | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | El profesional no tiene una relación asistencial vigente con este paciente | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | No hace falta compartirse un resultado con uno mismo | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | Sólo se puede compartir un resultado ya liberado | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene perfil de paciente | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-results/me/{reportId}/shares"
}
```

---

## 6. POST /diagnostic-results/me/{reportId}/shares/{shareId}/revoke

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-patient-results`
- **Nombre:** Dejar de compartir un resultado
- **Operation ID:** `DiagnosticsPatientResultsController_revokeOwnResultShare`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsPatientResultsController.revokeOwnResultShare](../../src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts)

### Descripción de negocio

Dejar de compartir un resultado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Deja de compartir un resultado. Es `POST .../revoke` y no `DELETE` porque no se borra nada: se cierra la vigencia, y quién tuvo acceso a un resultado clínico sigue siendo responsable de poder responderse después.

### Descripción del sistema

NestJS resuelve `POST /diagnostic-results/me/{reportId}/shares/{shareId}/revoke` en `DiagnosticsPatientResultsController_revokeOwnResultShare`. El controlador delega en `DiagnosticsPatientResultsService.revokeOwnResultShare`. No recibe body. El tipo de retorno estático es `Promise<DiagnosticResultShareDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `reportId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `shareId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /diagnostic-results/me/00000000-0000-4000-8000-000000000001/shares/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Deben ser UUID válidos: `reportId`, `shareId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /diagnostic-results/me/00000000-0000-4000-8000-000000000001/shares/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |
| 504 | Operación completada correctamente. | `Promise<DiagnosticResultShareDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosticResultShareDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "reportId": "00000000-0000-4000-8000-000000000001",
  "practitionerUserId": "00000000-0000-4000-8000-000000000001",
  "practitionerName": "Nombre de ejemplo",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "active": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del grant. | `00000000-0000-4000-8000-000000000001` |
| `reportId` | Sí | `string` | formato `uuid` | Informe compartido. | `00000000-0000-4000-8000-000000000001` |
| `practitionerUserId` | Sí | `string` | formato `uuid` | Cuenta del profesional con quien se compartió. | `00000000-0000-4000-8000-000000000001` |
| `practitionerName` | No | `string` | Sin restricción adicional declarada | Nombre del profesional, para que «Compartido con» no muestre un uuid. Ausente si la cuenta perdió su vínculo con la persona. | `Nombre de ejemplo` |
| `validFrom` | Sí | `string` | formato `date-time` | Desde cuándo vale. | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Hasta cuándo vale. | `2026-07-31T12:00:00.000Z` |
| `active` | Sí | `boolean` | Sin restricción adicional declarada | Si el grant está vigente en este momento. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 401 | `UNAUTHENTICATED` | El informe no pertenece a esta cuenta | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ese resultado no está compartido así | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 404 | `NOT_FOUND` | Informe no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 409 | `CONFLICT` | Ese acceso compartido ya estaba cerrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene perfil de paciente | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-results/me/{reportId}/shares/{shareId}/revoke"
}
```

---

## 7. GET /diagnostic-results/me/orders

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-patient-results`
- **Nombre:** Órdenes de laboratorio e imagen del titular
- **Operation ID:** `DiagnosticsPatientResultsController_listOwnOrders`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsPatientResultsController.listOwnOrders](../../src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts)

### Descripción de negocio

El pedido del médico visto por quien tiene que cumplirlo: qué le pidieron, cómo prepararse y si ya hay resultado para abrir.

Contexto declarado en el controlador: Las órdenes diagnósticas del titular. ## Va antes de `me/:reportId` a propósito Nest resuelve por orden de declaración. Debajo de la ruta con parámetro, `orders` entraría como `:reportId` y moriría en el `ParseUUIDPipe` con un 400 que además parece un error del cliente. No es estilo: moverla rompe el endpoint.

### Descripción del sistema

NestJS resuelve `GET /diagnostic-results/me/orders` en `DiagnosticsPatientResultsController_listOwnOrders`. El controlador delega en `DiagnosticsPatientResultsService.listOwnOrders`. No recibe body. El tipo de retorno estático es `Promise<PatientOwnOrdersResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope de órdenes (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostic-results/me/orders HTTP/1.1
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
GET /diagnostic-results/me/orders?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PatientOwnOrdersResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PatientOwnOrdersResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PatientOwnOrdersResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PatientOwnOrdersResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PatientOwnOrdersResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PatientOwnOrdersResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PatientOwnOrdersResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientOwnOrdersResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "modalityConceptId": "00000000-0000-4000-8000-000000000001",
      "modalityDisplay": "valor-ejemplo",
      "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
      "bodySiteDisplay": "valor-ejemplo",
      "lateralityConceptId": "00000000-0000-4000-8000-000000000001",
      "lateralityDisplay": "valor-ejemplo",
      "bodyStructureUberon": "valor-ejemplo",
      "bodyMeshId": "00000000-0000-4000-8000-000000000001",
      "boneTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "boneTypeDisplay": "valor-ejemplo",
      "insuranceSettlement": {
        "claimId": "00000000-0000-4000-8000-000000000001",
        "claimIdentifier": "valor-ejemplo",
        "adjudicationVersionId": "00000000-0000-4000-8000-000000000001",
        "adjudicationVersion": 1,
        "eobId": "00000000-0000-4000-8000-000000000001",
        "carrierName": "Nombre de ejemplo",
        "policyIdentifier": "valor-ejemplo",
        "totalBilledAmount": "valor-ejemplo",
        "totalApprovedAmount": "valor-ejemplo",
        "totalPatientAmount": "valor-ejemplo",
        "totalDeniedAmount": "valor-ejemplo",
        "currencyCode": "BOB",
        "result": "APPROVED",
        "exclusions": [
          {
            "claimLineId": "00000000-0000-4000-8000-000000000001",
            "itemId": "00000000-0000-4000-8000-000000000001",
            "itemName": "Nombre de ejemplo",
            "amount": "valor-ejemplo",
            "policyClauseReference": "valor-ejemplo",
            "denialRationale": "valor-ejemplo"
          }
        ]
      },
      "insuranceSettlementAvailability": "AVAILABLE",
      "id": "00000000-0000-4000-8000-000000000001",
      "requisitionId": "00000000-0000-4000-8000-000000000001",
      "codeDisplay": "CODIGO_EJEMPLO",
      "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "specimenTypeDisplay": "valor-ejemplo",
      "components": [
        {
          "conceptId": "00000000-0000-4000-8000-000000000001",
          "display": "valor-ejemplo",
          "ordinal": 1
        }
      ],
      "componentsSpecified": true,
      "imaging": {
        "modalityConceptId": "00000000-0000-4000-8000-000000000001",
        "modalityDisplay": "valor-ejemplo",
        "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
        "bodySiteDisplay": "valor-ejemplo",
        "lateralityConceptId": "00000000-0000-4000-8000-000000000001",
        "lateralityDisplay": "valor-ejemplo",
        "contrastConceptId": "00000000-0000-4000-8000-000000000001",
        "contrastDisplay": "valor-ejemplo",
        "bodyStructureUberon": "valor-ejemplo",
        "bodyMeshId": "00000000-0000-4000-8000-000000000001",
        "boneTypeConceptId": "00000000-0000-4000-8000-000000000001",
        "boneTypeDisplay": "valor-ejemplo"
      },
      "summary": "valor-ejemplo",
      "encounterId": "00000000-0000-4000-8000-000000000001",
      "reasonConditionId": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "categoryConceptId": "00000000-0000-4000-8000-000000000001",
      "category": "LAB",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "priorityConceptId": "00000000-0000-4000-8000-000000000001",
      "performerSelectionConceptId": "00000000-0000-4000-8000-000000000001",
      "performerPractitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "suggestedPracticeSiteId": "00000000-0000-4000-8000-000000000001",
      "suggestedPracticeSiteName": "Nombre de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z",
      "preparationInstructions": "valor-ejemplo",
      "hasReleasedResult": true,
      "reportId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "limit": 1,
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<PatientOrderSummaryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"modalityConceptId":"00000000-0000-4000-8000-000000000001","modalityDisplay":"valor-ejemplo","bodySiteConceptId":"00000000-0000-4000-8000-000000000001","bodySiteDisplay":"valor-ejemplo","lateralityConceptId":"00000000-0000-4000-8000-000000000001","lateralityDisplay":"valor-ejemplo","bodyStructureUberon":"valor-ejemplo","bodyMeshId":"00000000-0000-4000-8000-000000000001","boneTypeConceptId":"00000000-0000-4000-8000-000000000001","boneTypeDisplay":"valor-ejemplo","insuranceSettlement":{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]},"insuranceSettlementAvailability":"AVAILABLE","id":"00000000-0000-4000-8000-000000000001","requisitionId":"00000000-0000-4000-8000-000000000001","codeDisplay":"CODIGO_EJEMPLO","specimenTypeConceptId":"00000000-0000-4000-8000-000000000001","specimenTypeDisplay":"valor-ejemplo","components":[{"conceptId":"00000000-0000-4000-8000-000000000001","display":"valor-ejemplo","ordinal":1}],"componentsSpecified":true,"imaging":{"modalityConceptId":"00000000-0000-4000-8000-000000000001","modalityDisplay":"valor-ejemplo","bodySiteConceptId":"00000000-0000-4000-8000-000000000001","bodySiteDisplay":"valor-ejemplo","lateralityConceptId":"00000000-0000-4000-8000-000000000001","lateralityDisplay":"valor-ejemplo","contrastConceptId":"00000000-0000-4000-8000-000000000001","contrastDisplay":"valor-ejemplo","bodyStructureUberon":"valor-ejemplo","bodyMeshId":"00000000-0000-4000-8000-000000000001","boneTypeConceptId":"00000000-0000-4000-8000-000000000001","boneTypeDisplay":"valor-ejemplo"},"summary":"valor-ejemplo","encounterId":"00000000-0000-4000-8000-000000000001","reasonConditionId":"00000000-0000-4000-8000-000000000001","codeConceptId":"00000000-0000-4000-8000-000000000001","categoryConceptId":"00000000-0000-4000-8000-000000000001","category":"LAB","statusConceptId":"00000000-0000-4000-8000-000000000001","priorityConceptId":"00000000-0000-4000-8000-000000000001","performerSelectionConceptId":"00000000-0000-4000-8000-000000000001","performerPractitionerProfileId":"00000000-0000-4000-8000-000000000001","suggestedPracticeSiteId":"00000000-0000-4000-8000-000000000001","suggestedPracticeSiteName":"Nombre de ejemplo","createdAt":"2026-07-31T12:00:00.000Z","preparationInstructions":"valor-ejemplo","hasReleasedResult":true,"reportId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].modalityConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].modalityDisplay` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].bodySiteConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].bodySiteDisplay` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].lateralityConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].lateralityDisplay` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].bodyStructureUberon` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].bodyMeshId` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].boneTypeConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].boneTypeDisplay` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].insuranceSettlement` | Sí | `PatientInsuranceSettlementDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"claimId":"00000000-0000-4000-8000-000000000001","claimIdentifier":"valor-ejemplo","adjudicationVersionId":"00000000-0000-4000-8000-000000000001","adjudicationVersion":1,"eobId":"00000000-0000-4000-8000-000000000001","carrierName":"Nombre de ejemplo","policyIdentifier":"valor-ejemplo","totalBilledAmount":"valor-ejemplo","totalApprovedAmount":"valor-ejemplo","totalPatientAmount":"valor-ejemplo","totalDeniedAmount":"valor-ejemplo","currencyCode":"BOB","result":"APPROVED","exclusions":[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]}` |
| `items[].insuranceSettlement.claimId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.claimIdentifier` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].insuranceSettlement.adjudicationVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.adjudicationVersion` | Sí | `number` | formato `int32`; mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].insuranceSettlement.eobId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.carrierName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].insuranceSettlement.policyIdentifier` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].insuranceSettlement.totalBilledAmount` | Sí | `string` | Sin restricción adicional declarada | Total facturado, decimal exacto | `valor-ejemplo` |
| `items[].insuranceSettlement.totalApprovedAmount` | Sí | `string` | Sin restricción adicional declarada | Aporte del seguro, decimal exacto | `valor-ejemplo` |
| `items[].insuranceSettlement.totalPatientAmount` | Sí | `string` | Sin restricción adicional declarada | Cargo confirmado al paciente, decimal exacto | `valor-ejemplo` |
| `items[].insuranceSettlement.totalDeniedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe excluido sin asignar, decimal exacto | `valor-ejemplo` |
| `items[].insuranceSettlement.currencyCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `items[].insuranceSettlement.result` | Sí | `string` | valores: `APPROVED`, `PARTIALLY_APPROVED`, `DENIED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `items[].insuranceSettlement.exclusions` | Sí | `array<PatientInsuranceSettlementExclusionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"claimLineId":"00000000-0000-4000-8000-000000000001","itemId":"00000000-0000-4000-8000-000000000001","itemName":"Nombre de ejemplo","amount":"valor-ejemplo","policyClauseReference":"valor-ejemplo","denialRationale":"valor-ejemplo"}]` |
| `items[].insuranceSettlement.exclusions[].claimLineId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.exclusions[].itemId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].insuranceSettlement.exclusions[].itemName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].insuranceSettlement.exclusions[].amount` | Sí | `string` | Sin restricción adicional declarada | Importe decimal exacto excluido | `valor-ejemplo` |
| `items[].insuranceSettlement.exclusions[].policyClauseReference` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].insuranceSettlement.exclusions[].denialRationale` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].insuranceSettlementAvailability` | Sí | `string` | valores: `AVAILABLE`, `PENDING_PUBLICATION`, `UNDER_REVIEW`, `NOT_AVAILABLE` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].requisitionId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].codeDisplay` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].specimenTypeConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].specimenTypeDisplay` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].components` | Sí | `array<ServiceRequestComponentDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","display":"valor-ejemplo","ordinal":1}]` |
| `items[].components[].conceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].components[].display` | Sí | `string` | Sin restricción adicional declarada | Nombre legible (castellano si existe) | `valor-ejemplo` |
| `items[].components[].ordinal` | Sí | `number` | Sin restricción adicional declarada | Posición, desde 1, en el orden en que se marcó | `1` |
| `items[].componentsSpecified` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].imaging` | Sí | `ServiceRequestImagingDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"modalityConceptId":"00000000-0000-4000-8000-000000000001","modalityDisplay":"valor-ejemplo","bodySiteConceptId":"00000000-0000-4000-8000-000000000001","bodySiteDisplay":"valor-ejemplo","lateralityConceptId":"00000000-0000-4000-8000-000000000001","lateralityDisplay":"valor-ejemplo","contrastConceptId":"00000000-0000-4000-8000-000000000001","contrastDisplay":"valor-ejemplo","bodyStructureUberon":"valor-ejemplo","bodyMeshId":"00000000-0000-4000-8000-000000000001","boneTypeConceptId":"00000000-0000-4000-8000-000000000001","boneTypeDisplay":"valor-ejemplo"}` |
| `items[].imaging.modalityConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].imaging.modalityDisplay` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].imaging.bodySiteConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].imaging.bodySiteDisplay` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].imaging.lateralityConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].imaging.lateralityDisplay` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].imaging.contrastConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].imaging.contrastDisplay` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].imaging.bodyStructureUberon` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].imaging.bodyMeshId` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].imaging.boneTypeConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].imaging.boneTypeDisplay` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].summary` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].encounterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].reasonConditionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].codeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].categoryConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].category` | No | `string` | valores: `LAB`, `IMAGING`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `LAB` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].priorityConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].performerSelectionConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].performerPractitionerProfileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].suggestedPracticeSiteId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].suggestedPracticeSiteName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].preparationInstructions` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].hasReleasedResult` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].reportId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene perfil de paciente | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostic-results/me/orders"
}
```

---

## 8. POST /diagnostics/accessions

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-specimens`
- **Nombre:** Acesionar especímenes recibidos en laboratorio
- **Operation ID:** `DiagnosticsSpecimensController_accession`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsSpecimensController.accession](../../src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts)

### Descripción de negocio

Acesionar especímenes recibidos en laboratorio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/accessions` en `DiagnosticsSpecimensController_accession`. El controlador delega en `DiagnosticsSpecimensService.accession`. Valida el body como `CreateAccessionDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccessionCreatedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAccessionDto`; los campos opcionales se omiten.

```http
POST /diagnostics/accessions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "specimenIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente dueño de la acesión | `00000000-0000-4000-8000-000000000001` |
| `custodianTenantId` | No | `string` | formato `uuid` | Tenant custodio: el del contexto (X-Tenant-Id). Si se envía y no coincide, responde 404 | `00000000-0000-4000-8000-000000000001` |
| `specimenIds` | Sí | `array<string>` | formato `uuid` | Especímenes a acesionar | `["00000000-0000-4000-8000-000000000001"]` |
| `accessionNumber` | No | `string` | longitud máxima 120 | Nº de acesión (se genera si se omite) | `valor-ejemplo` |
| `priorityConceptId` | No | `string` | formato `uuid` | Prioridad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/accessions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "specimenIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "accessionNumber": "valor-ejemplo",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AccessionCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AccessionCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccessionCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccessionCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccessionCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AccessionCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccessionCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccessionCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccessionCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AccessionCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccessionCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "accessionSpecimenIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `accessionSpecimenIds` | Sí | `array<string>` | formato `uuid` | Ids de accession_specimens | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Espécimen no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-specimens.service.ts |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostics/services/diagnostics-scope.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El espécimen está rechazado y no puede acesionarse | Excepción explícita en src/modules/diagnostics/services/diagnostics-specimens.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/accessions"
}
```

---

## 9. GET /diagnostics/accessions/{id}

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-specimens`
- **Nombre:** Detalle de una acesión (especímenes, contenedores y custodia)
- **Operation ID:** `DiagnosticsSpecimensController_getAccession`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsSpecimensController.getAccession](../../src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts)

### Descripción de negocio

Acotado al tenant del contexto: otro laboratorio recibe 404.

Contexto declarado en el controlador: Lectura (CL-47): detalle de una acesión con sus especímenes, contenedores y cadena de custodia. Antes de esta ruta, `diagnostics` sólo tenía `POST` para el circuito de especímenes: abrir el detalle de una acesión concreta no tenía dónde ir.

### Descripción del sistema

NestJS resuelve `GET /diagnostics/accessions/{id}` en `DiagnosticsSpecimensController_getAccession`. El controlador delega en `DiagnosticsSpecimensService.getAccession`. No recibe body. El tipo de retorno estático es `Promise<AccessionDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/accessions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostics/accessions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AccessionDetailDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<AccessionDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<AccessionDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<AccessionDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<AccessionDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<AccessionDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<AccessionDetailDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<AccessionDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccessionDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "accessionNumber": "valor-ejemplo",
  "receivedAt": "2026-07-31T12:00:00.000Z",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "specimens": [
    {
      "accessionSpecimenId": "00000000-0000-4000-8000-000000000001",
      "sequenceNumber": 1,
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "specimen": {
        "id": "00000000-0000-4000-8000-000000000001",
        "patientProfileId": "00000000-0000-4000-8000-000000000001",
        "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001",
        "statusConceptId": "00000000-0000-4000-8000-000000000001",
        "collectedAt": "2026-07-31T12:00:00.000Z",
        "receivedAt": "2026-07-31T12:00:00.000Z",
        "containers": [
          {
            "id": "00000000-0000-4000-8000-000000000001",
            "containerIdentifier": "valor-ejemplo",
            "containerTypeConceptId": "00000000-0000-4000-8000-000000000001",
            "statusConceptId": "00000000-0000-4000-8000-000000000001"
          }
        ],
        "custodyEvents": [
          {
            "id": "00000000-0000-4000-8000-000000000001",
            "specimenContainerId": "00000000-0000-4000-8000-000000000001",
            "custodyEventTypeConceptId": "00000000-0000-4000-8000-000000000001",
            "occurredAt": "2026-07-31T12:00:00.000Z",
            "fromPartyTypeConceptId": "00000000-0000-4000-8000-000000000001",
            "toPartyTypeConceptId": "00000000-0000-4000-8000-000000000001",
            "sealIdentifier": "valor-ejemplo",
            "signedByUserId": "00000000-0000-4000-8000-000000000001"
          }
        ]
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador de la acesión. | `00000000-0000-4000-8000-000000000001` |
| `custodianTenantId` | Sí | `string` | formato `uuid` | Tenant custodio (el laboratorio que la recibió). | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente dueño de la acesión. | `00000000-0000-4000-8000-000000000001` |
| `accessionNumber` | Sí | `string` | Sin restricción adicional declarada | Número de acesión. | `valor-ejemplo` |
| `receivedAt` | Sí | `string` | formato `date-time` | Cuándo se recibió. | `2026-07-31T12:00:00.000Z` |
| `priorityConceptId` | Sí | `string` | formato `uuid` | Prioridad (concept id). | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado de la acesión (concept id). | `00000000-0000-4000-8000-000000000001` |
| `specimens` | Sí | `array<AccessionSpecimenDetailDto>` | Sin restricción adicional declarada | Los especímenes acesionados, con su contenedor y su custodia. | `[{"accessionSpecimenId":"00000000-0000-4000-8000-000000000001","sequenceNumber":1,"statusConceptId":"00000000-0000-4000-8000-000000000001","specimen":{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","specimenTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","collectedAt":"2026-07-31T12:00:00.000Z","receivedAt":"2026-07-31T12:00:00.000Z","containers":[{"id":"00000000-0000-4000-8000-000000000001","containerIdentifier":"valor-ejemplo","containerTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001"}],"custodyEvents":[{"id":"00000000-0000-4000-8000-000000000001","specimenContainerId":"00000000-0000-4000-8000-000000000001","custodyEventTypeConceptId":"00000000-0000-4000-8000-000000000001","occurredAt":"2026-07-31T12:00:00.000Z","fromPartyTypeConceptId":"00000000-0000-4000-8000-000000000001","toPartyTypeConceptId":"00000000-0000-4000-8000-000000000001","sealIdentifier":"valor-ejemplo","signedByUserId":"00000000-0000-4000-8000-000000000001"}]}}]` |
| `specimens[].accessionSpecimenId` | Sí | `string` | formato `uuid` | Identificador del item de acesión (`accession_specimens`). | `00000000-0000-4000-8000-000000000001` |
| `specimens[].sequenceNumber` | Sí | `number` | Sin restricción adicional declarada | Posición dentro de la acesión. | `1` |
| `specimens[].statusConceptId` | Sí | `string` | formato `uuid` | Estado del item dentro de la acesión (concept id). | `00000000-0000-4000-8000-000000000001` |
| `specimens[].specimen` | Sí | `SpecimenDetailDto` | Sin restricción adicional declarada | El espécimen, con sus contenedores y su custodia. | `{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","specimenTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","collectedAt":"2026-07-31T12:00:00.000Z","receivedAt":"2026-07-31T12:00:00.000Z","containers":[{"id":"00000000-0000-4000-8000-000000000001","containerIdentifier":"valor-ejemplo","containerTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001"}],"custodyEvents":[{"id":"00000000-0000-4000-8000-000000000001","specimenContainerId":"00000000-0000-4000-8000-000000000001","custodyEventTypeConceptId":"00000000-0000-4000-8000-000000000001","occurredAt":"2026-07-31T12:00:00.000Z","fromPartyTypeConceptId":"00000000-0000-4000-8000-000000000001","toPartyTypeConceptId":"00000000-0000-4000-8000-000000000001","sealIdentifier":"valor-ejemplo","signedByUserId":"00000000-0000-4000-8000-000000000001"}]}` |
| `specimens[].specimen.id` | Sí | `string` | formato `uuid` | Identificador del espécimen. | `00000000-0000-4000-8000-000000000001` |
| `specimens[].specimen.patientProfileId` | Sí | `string` | formato `uuid` | Paciente dueño del espécimen. | `00000000-0000-4000-8000-000000000001` |
| `specimens[].specimen.specimenTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de espécimen (concept id). | `00000000-0000-4000-8000-000000000001` |
| `specimens[].specimen.statusConceptId` | Sí | `string` | formato `uuid` | Estado del espécimen (concept id). | `00000000-0000-4000-8000-000000000001` |
| `specimens[].specimen.collectedAt` | No | `string` | formato `date-time` | Cuándo se recolectó, si ya ocurrió. | `2026-07-31T12:00:00.000Z` |
| `specimens[].specimen.receivedAt` | No | `string` | formato `date-time` | Cuándo se recibió en el laboratorio, si ya ocurrió. | `2026-07-31T12:00:00.000Z` |
| `specimens[].specimen.containers` | Sí | `array<SpecimenContainerDto>` | Sin restricción adicional declarada | Sus contenedores. | `[{"id":"00000000-0000-4000-8000-000000000001","containerIdentifier":"valor-ejemplo","containerTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `specimens[].specimen.containers[].id` | Sí | `string` | formato `uuid` | Identificador del contenedor. | `00000000-0000-4000-8000-000000000001` |
| `specimens[].specimen.containers[].containerIdentifier` | Sí | `string` | Sin restricción adicional declarada | Identificador físico del contenedor (etiqueta/código). | `valor-ejemplo` |
| `specimens[].specimen.containers[].containerTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de contenedor (concept id). | `00000000-0000-4000-8000-000000000001` |
| `specimens[].specimen.containers[].statusConceptId` | Sí | `string` | formato `uuid` | Estado del contenedor (concept id). | `00000000-0000-4000-8000-000000000001` |
| `specimens[].specimen.custodyEvents` | Sí | `array<SpecimenCustodyEventDto>` | Sin restricción adicional declarada | Su cadena de custodia, del evento más viejo al más nuevo. | `[{"id":"00000000-0000-4000-8000-000000000001","specimenContainerId":"00000000-0000-4000-8000-000000000001","custodyEventTypeConceptId":"00000000-0000-4000-8000-000000000001","occurredAt":"2026-07-31T12:00:00.000Z","fromPartyTypeConceptId":"00000000-0000-4000-8000-000000000001","toPartyTypeConceptId":"00000000-0000-4000-8000-000000000001","sealIdentifier":"valor-ejemplo","signedByUserId":"00000000-0000-4000-8000-000000000001"}]` |
| `specimens[].specimen.custodyEvents[].id` | Sí | `string` | formato `uuid` | Identificador del evento. | `00000000-0000-4000-8000-000000000001` |
| `specimens[].specimen.custodyEvents[].specimenContainerId` | No | `string` | formato `uuid` | Contenedor al que se refiere el traslado, si el evento fue de un contenedor. | `00000000-0000-4000-8000-000000000001` |
| `specimens[].specimen.custodyEvents[].custodyEventTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de evento (concept id): recepción, traslado, almacenamiento, etc. | `00000000-0000-4000-8000-000000000001` |
| `specimens[].specimen.custodyEvents[].occurredAt` | Sí | `string` | formato `date-time` | Cuándo ocurrió. | `2026-07-31T12:00:00.000Z` |
| `specimens[].specimen.custodyEvents[].fromPartyTypeConceptId` | No | `string` | formato `uuid` | De qué tipo de parte salió (concept id), si se registró. | `00000000-0000-4000-8000-000000000001` |
| `specimens[].specimen.custodyEvents[].toPartyTypeConceptId` | No | `string` | formato `uuid` | A qué tipo de parte llegó (concept id), si se registró. | `00000000-0000-4000-8000-000000000001` |
| `specimens[].specimen.custodyEvents[].sealIdentifier` | No | `string` | Sin restricción adicional declarada | Sello de custodia, si se usó uno. | `valor-ejemplo` |
| `specimens[].specimen.custodyEvents[].signedByUserId` | No | `string` | formato `uuid` | Quién firmó el evento. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Acesión no encontrada | Excepción explícita en src/modules/diagnostics/services/diagnostics-specimens.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/accessions/{id}"
}
```

---

## 10. POST /diagnostics/analyzer-runs

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-laboratory`
- **Nombre:** Abrir una corrida de analizador (soporte para ingesta)
- **Operation ID:** `DiagnosticsLabController_createAnalyzerRun`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabController.createAnalyzerRun](../../src/modules/diagnostics/controllers/diagnostics-lab.controller.ts)

### Descripción de negocio

Abrir una corrida de analizador (soporte para ingesta). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Soporte: abrir corrida de analizador.

### Descripción del sistema

NestJS resuelve `POST /diagnostics/analyzer-runs` en `DiagnosticsLabController_createAnalyzerRun`. El controlador delega en `DiagnosticsLabService.createAnalyzerRun`. Valida el body como `CreateAnalyzerRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAnalyzerRunDto`; los campos opcionales se omiten.

```http
POST /diagnostics/analyzer-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "analyzerDeviceId": "00000000-0000-4000-8000-000000000001",
  "runIdentifier": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `analyzerDeviceId` | Sí | `string` | formato `uuid` | Analizador (device id) | `00000000-0000-4000-8000-000000000001` |
| `runIdentifier` | Sí | `string` | longitud máxima 120 | Identificador de la corrida | `valor-ejemplo` |
| `custodianTenantId` | No | `string` | formato `uuid` | Tenant custodio (por defecto el del token) | `00000000-0000-4000-8000-000000000001` |
| `reagentLotId` | No | `string` | formato `uuid` | Lote de reactivo | `00000000-0000-4000-8000-000000000001` |
| `calibrationReference` | No | `string` | longitud máxima 200 | Referencia de calibración | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/analyzer-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "analyzerDeviceId": "00000000-0000-4000-8000-000000000001",
  "runIdentifier": "valor-ejemplo",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "reagentLotId": "00000000-0000-4000-8000-000000000001",
  "calibrationReference": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostics/services/diagnostics-scope.service.ts |
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
  "path": "/diagnostics/analyzer-runs"
}
```

---

## 11. POST /diagnostics/analyzer-runs/{id}/messages

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-laboratory`
- **Nombre:** Ingerir mensaje de resultado de analizador (LIS/HL7/ASTM)
- **Operation ID:** `DiagnosticsLabController_ingestMessage`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabController.ingestMessage](../../src/modules/diagnostics/controllers/diagnostics-lab.controller.ts)

### Descripción de negocio

Ingerir mensaje de resultado de analizador (LIS/HL7/ASTM). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/analyzer-runs/{id}/messages` en `DiagnosticsLabController_ingestMessage`. El controlador delega en `DiagnosticsLabService.ingestMessage`. Valida el body como `IngestAnalyzerMessageDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IngestAnalyzerMessageDto`; los campos opcionales se omiten.

```http
POST /diagnostics/analyzer-runs/00000000-0000-4000-8000-000000000001/messages HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "payloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `payloadHash` | Sí | `string` | longitud máxima 200 | Hash idempotente del payload crudo | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `messageFormatConceptId` | No | `string` | formato `uuid` | Formato del mensaje (concept id) | `00000000-0000-4000-8000-000000000001` |
| `messageControlId` | No | `string` | longitud máxima 200 | Message control id (idempotencia por corrida) | `00000000-0000-4000-8000-000000000001` |
| `laboratoryWorkOrderTestId` | No | `string` | formato `uuid` | Prueba de la orden a completar | `00000000-0000-4000-8000-000000000001` |
| `mappedObservationId` | No | `string` | formato `uuid` | Observación mapeada (clinical.observations) | `00000000-0000-4000-8000-000000000001` |
| `rawMessageFileId` | No | `string` | formato `uuid` | Archivo del mensaje crudo (common.files) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/analyzer-runs/00000000-0000-4000-8000-000000000001/messages HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "payloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "messageFormatConceptId": "00000000-0000-4000-8000-000000000001",
  "messageControlId": "00000000-0000-4000-8000-000000000001",
  "laboratoryWorkOrderTestId": "00000000-0000-4000-8000-000000000001",
  "mappedObservationId": "00000000-0000-4000-8000-000000000001",
  "rawMessageFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostics/services/diagnostics-scope.service.ts |
| 409 | `CONFLICT` | El mensaje ya fue ingerido para esta corrida | Excepción explícita en src/modules/diagnostics/services/diagnostics-lab.service.ts |
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
  "path": "/diagnostics/analyzer-runs/{id}/messages"
}
```

---

## 12. POST /diagnostics/clinical-media

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-imaging`
- **Nombre:** Adjuntar media clínica / imagen al chart
- **Operation ID:** `DiagnosticsImagingController_attachMedia`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsImagingController.attachMedia](../../src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts)

### Descripción de negocio

Adjuntar media clínica / imagen al chart. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/clinical-media` en `DiagnosticsImagingController_attachMedia`. El controlador delega en `DiagnosticsMediaQualityService.attachMedia`. Valida el body como `AttachClinicalMediaDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AttachClinicalMediaDto`; los campos opcionales se omiten.

```http
POST /diagnostics/clinical-media HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "fileId": "00000000-0000-4000-8000-000000000001"
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente dueño de la media | `00000000-0000-4000-8000-000000000001` |
| `fileId` | Sí | `string` | formato `uuid` | Archivo ya cargado (common.files) | `00000000-0000-4000-8000-000000000001` |
| `custodianTenantId` | No | `string` | formato `uuid` | Tenant custodio (por defecto el del token) | `00000000-0000-4000-8000-000000000001` |
| `mediaTypeConceptId` | No | `string` | formato `uuid` | Tipo de media (concept id) | `00000000-0000-4000-8000-000000000001` |
| `bodySiteConceptId` | No | `string` | formato `uuid` | Sitio anatómico (concept id) | `00000000-0000-4000-8000-000000000001` |
| `viewConceptId` | No | `string` | formato `uuid` | Vista/proyección (concept id) | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Encuentro | `00000000-0000-4000-8000-000000000001` |
| `diagnosticReportId` | No | `string` | formato `uuid` | Informe diagnóstico al que se adjunta | `00000000-0000-4000-8000-000000000001` |
| `patientVisibilityConceptId` | No | `string` | formato `uuid` | Visibilidad al paciente (concept id) | `00000000-0000-4000-8000-000000000001` |
| `capturedByProfileId` | No | `string` | formato `uuid` | Profesional que captura | `00000000-0000-4000-8000-000000000001` |
| `annotations` | No | `array<MediaAnnotationItemDto>` | Sin restricción adicional declarada | Anotaciones IA/manual | `[{"annotationTypeConceptId":"00000000-0000-4000-8000-000000000001","labelText":"valor-ejemplo","confidenceScore":"valor-ejemplo","algorithmModelReference":"valor-ejemplo","authorProfileId":"00000000-0000-4000-8000-000000000001"}]` |
| `annotations[].annotationTypeConceptId` | No | `string` | formato `uuid` | Tipo de anotación (concept id) | `00000000-0000-4000-8000-000000000001` |
| `annotations[].labelText` | No | `string` | longitud máxima 200 | Etiqueta textual | `valor-ejemplo` |
| `annotations[].confidenceScore` | No | `string` | longitud máxima 20 | Score de confianza (0..1) | `valor-ejemplo` |
| `annotations[].algorithmModelReference` | No | `string` | longitud máxima 200 | Referencia del modelo/algoritmo IA | `valor-ejemplo` |
| `annotations[].authorProfileId` | No | `string` | formato `uuid` | Autor de la anotación | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/clinical-media HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "mediaTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "viewConceptId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "diagnosticReportId": "00000000-0000-4000-8000-000000000001",
  "patientVisibilityConceptId": "00000000-0000-4000-8000-000000000001",
  "capturedByProfileId": "00000000-0000-4000-8000-000000000001",
  "annotations": [
    {
      "annotationTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "labelText": "valor-ejemplo",
      "confidenceScore": "valor-ejemplo",
      "algorithmModelReference": "valor-ejemplo",
      "authorProfileId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostics/services/diagnostics-scope.service.ts |
| 409 | `CONFLICT` | El archivo ya está adjunto como media clínica | Excepción explícita en src/modules/diagnostics/services/diagnostics-media-quality.service.ts |
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
  "path": "/diagnostics/clinical-media"
}
```

---

## 13. POST /diagnostics/containers/{id}/custody-events

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-specimens`
- **Nombre:** Registrar cadena de custodia / traslado de contenedor
- **Operation ID:** `DiagnosticsSpecimensController_custodyEvent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsSpecimensController.custodyEvent](../../src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts)

### Descripción de negocio

Registrar cadena de custodia / traslado de contenedor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/containers/{id}/custody-events` en `DiagnosticsSpecimensController_custodyEvent`. El controlador delega en `DiagnosticsSpecimensService.recordCustodyEvent`. Valida el body como `ContainerCustodyEventDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ContainerCustodyEventDto`; los campos opcionales se omiten.

```http
POST /diagnostics/containers/00000000-0000-4000-8000-000000000001/custody-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "specimenId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `specimenId` | Sí | `string` | formato `uuid` | Espécimen asociado al contenedor | `00000000-0000-4000-8000-000000000001` |
| `eventTypeConceptId` | No | `string` | formato `uuid` | Tipo de evento de contenedor (concept id) | `00000000-0000-4000-8000-000000000001` |
| `toPartyTypeConceptId` | No | `string` | formato `uuid` | Tipo de parte destino (concept id) | `00000000-0000-4000-8000-000000000001` |
| `toPartyId` | No | `string` | formato `uuid` | Id de parte destino | `00000000-0000-4000-8000-000000000001` |
| `temperatureCelsius` | No | `string` | longitud máxima 20 | Temperatura en °C | `valor-ejemplo` |
| `sealIdentifier` | No | `string` | longitud máxima 200 | Sello de custodia | `valor-ejemplo` |
| `evidenceHash` | No | `string` | longitud máxima 200 | Hash de evidencia | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `destinationStatusConceptId` | No | `string` | formato `uuid` | Estado destino del contenedor (concept id) | `00000000-0000-4000-8000-000000000001` |
| `notes` | No | `string` | longitud máxima 2000 | Notas del traslado | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/containers/00000000-0000-4000-8000-000000000001/custody-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "specimenId": "00000000-0000-4000-8000-000000000001",
  "eventTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "toPartyTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "toPartyId": "00000000-0000-4000-8000-000000000001",
  "temperatureCelsius": "valor-ejemplo",
  "sealIdentifier": "valor-ejemplo",
  "evidenceHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "destinationStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "notes": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contenedor no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-specimens.service.ts |
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
  "path": "/diagnostics/containers/{id}/custody-events"
}
```

---

## 14. POST /diagnostics/critical-results

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-reports`
- **Nombre:** Detectar y notificar un resultado crítico
- **Operation ID:** `DiagnosticsReportsController_detectCritical`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportsController.detectCritical](../../src/modules/diagnostics/controllers/diagnostics-reports.controller.ts)

### Descripción de negocio

Detectar y notificar un resultado crítico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/critical-results` en `DiagnosticsReportsController_detectCritical`. El controlador delega en `CriticalResultDetectionService.detect`. Valida el body como `DetectCriticalResultDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DetectCriticalResultDto`; los campos opcionales se omiten.

```http
POST /diagnostics/critical-results HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "observationId": "00000000-0000-4000-8000-000000000001",
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
| `observationId` | Sí | `string` | formato `uuid` | Observación con valor crítico | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente afectado | `00000000-0000-4000-8000-000000000001` |
| `custodianTenantId` | No | `string` | formato `uuid` | Tenant custodio (por defecto el del token) | `00000000-0000-4000-8000-000000000001` |
| `criticalityConceptId` | No | `string` | formato `uuid` | Criticidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `diagnosticReportId` | No | `string` | formato `uuid` | Informe diagnóstico relacionado | `00000000-0000-4000-8000-000000000001` |
| `detectedByProfileId` | No | `string` | formato `uuid` | Profesional que detecta | `00000000-0000-4000-8000-000000000001` |
| `escalationDueInMinutes` | No | `number` | mínimo 1 | Minutos hasta escalar (SLA) | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/critical-results HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "observationId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "criticalityConceptId": "00000000-0000-4000-8000-000000000001",
  "diagnosticReportId": "00000000-0000-4000-8000-000000000001",
  "detectedByProfileId": "00000000-0000-4000-8000-000000000001",
  "escalationDueInMinutes": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostics/services/diagnostics-scope.service.ts |
| 409 | `CONFLICT` | Ya existe una notificación crítica para la observación | Excepción explícita en src/modules/diagnostics/services/diagnostics-reports.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
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
  "path": "/diagnostics/critical-results"
}
```

---

## 15. POST /diagnostics/critical-results/{id}/acknowledge

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-reports`
- **Nombre:** Acusar recibo / escalar notificación crítica
- **Operation ID:** `DiagnosticsReportsController_acknowledge`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportsController.acknowledge](../../src/modules/diagnostics/controllers/diagnostics-reports.controller.ts)

### Descripción de negocio

Acusar recibo / escalar notificación crítica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/critical-results/{id}/acknowledge` en `DiagnosticsReportsController_acknowledge`. El controlador delega en `DiagnosticsReportsService.acknowledgeCritical`. Valida el body como `AcknowledgeCriticalResultDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AcknowledgeCriticalResultDto`; los campos opcionales se omiten.

```http
POST /diagnostics/critical-results/00000000-0000-4000-8000-000000000001/acknowledge HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "acknowledgedByProfileId": "00000000-0000-4000-8000-000000000001"
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
| `acknowledgedByProfileId` | Sí | `string` | formato `uuid` | Profesional que acusa recibo | `00000000-0000-4000-8000-000000000001` |
| `communicationEvidenceId` | No | `string` | formato `uuid` | Evidencia de comunicación | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/critical-results/00000000-0000-4000-8000-000000000001/acknowledge HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "acknowledgedByProfileId": "00000000-0000-4000-8000-000000000001",
  "communicationEvidenceId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | La notificación ya fue reconocida | Excepción explícita en src/modules/diagnostics/services/diagnostics-reports.service.ts |
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
  "path": "/diagnostics/critical-results/{id}/acknowledge"
}
```

---

## 16. POST /diagnostics/data-quality-events

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-imaging`
- **Nombre:** Registrar evento de calidad de datos + enlazar provenance
- **Operation ID:** `DiagnosticsImagingController_recordDataQuality`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsImagingController.recordDataQuality](../../src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts)

### Descripción de negocio

Registrar evento de calidad de datos + enlazar provenance. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/data-quality-events` en `DiagnosticsImagingController_recordDataQuality`. El controlador delega en `DiagnosticsMediaQualityService.recordDataQualityEvent`. Valida el body como `CreateDataQualityEventDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDataQualityEventDto`; los campos opcionales se omiten.

```http
POST /diagnostics/data-quality-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetId": "00000000-0000-4000-8000-000000000001",
  "ruleCode": "CODIGO_EJEMPLO"
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
| `targetId` | Sí | `string` | formato `uuid` | Id del objetivo (specimen/observation/study) | `00000000-0000-4000-8000-000000000001` |
| `ruleCode` | Sí | `string` | longitud máxima 120 | Código de regla de calidad | `CODIGO_EJEMPLO` |
| `custodianTenantId` | No | `string` | formato `uuid` | Tenant custodio (por defecto el del token) | `00000000-0000-4000-8000-000000000001` |
| `targetTypeConceptId` | No | `string` | formato `uuid` | Tipo de objetivo (concept id) | `00000000-0000-4000-8000-000000000001` |
| `severityConceptId` | No | `string` | formato `uuid` | Severidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `detailsJson` | No | `object` | Sin restricción adicional declarada | Detalles del hallazgo (JSON libre) | `{}` |
| `provenanceSourceId` | No | `string` | formato `uuid` | Id de la fuente para enlazar provenance | `00000000-0000-4000-8000-000000000001` |
| `provenanceSourceTypeConceptId` | No | `string` | formato `uuid` | Tipo de fuente de provenance (concept id) | `00000000-0000-4000-8000-000000000001` |
| `agentProfileId` | No | `string` | formato `uuid` | Profesional/agente de la derivación | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/data-quality-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetId": "00000000-0000-4000-8000-000000000001",
  "ruleCode": "CODIGO_EJEMPLO",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "targetTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "detailsJson": {},
  "provenanceSourceId": "00000000-0000-4000-8000-000000000001",
  "provenanceSourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "agentProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostics/services/diagnostics-scope.service.ts |
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
  "path": "/diagnostics/data-quality-events"
}
```

---

## 17. POST /diagnostics/imaging-endpoints

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-imaging`
- **Nombre:** Registrar un endpoint DICOM (soporte para STOW-RS)
- **Operation ID:** `DiagnosticsImagingController_createEndpoint`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsImagingController.createEndpoint](../../src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts)

### Descripción de negocio

Registrar un endpoint DICOM (soporte para STOW-RS). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/imaging-endpoints` en `DiagnosticsImagingController_createEndpoint`. El controlador delega en `DiagnosticsImagingService.createEndpoint`. Valida el body como `CreateImagingEndpointDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateImagingEndpointDto`; los campos opcionales se omiten.

```http
POST /diagnostics/imaging-endpoints HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "baseUri": "valor-ejemplo"
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
| `baseUri` | Sí | `string` | longitud máxima 2000 | URI base del endpoint (STOW-RS/WADO) | `valor-ejemplo` |
| `tenantId` | No | `string` | formato `uuid` | Tenant (por defecto el del token) | `00000000-0000-4000-8000-000000000001` |
| `endpointTypeConceptId` | No | `string` | formato `uuid` | Tipo de endpoint (concept id) | `00000000-0000-4000-8000-000000000001` |
| `storageRegionConceptId` | No | `string` | formato `uuid` | Región de almacenamiento (concept id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/imaging-endpoints HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "baseUri": "valor-ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "endpointTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "storageRegionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostics/services/diagnostics-scope.service.ts |
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
  "path": "/diagnostics/imaging-endpoints"
}
```

---

## 18. POST /diagnostics/imaging-studies/{id}/dose-events

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-imaging`
- **Nombre:** Registrar evento de dosis de radiación
- **Operation ID:** `DiagnosticsImagingController_recordDose`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsImagingController.recordDose](../../src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts)

### Descripción de negocio

Registrar evento de dosis de radiación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/imaging-studies/{id}/dose-events` en `DiagnosticsImagingController_recordDose`. El controlador delega en `DiagnosticsImagingService.recordDoseEvent`. Valida el body como `RecordDoseEventDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordDoseEventDto`; los campos opcionales se omiten.

```http
POST /diagnostics/imaging-studies/00000000-0000-4000-8000-000000000001/dose-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
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
| `imagingSeriesId` | No | `string` | formato `uuid` | Serie de imagen relacionada | `00000000-0000-4000-8000-000000000001` |
| `doseLengthProduct` | No | `string` | longitud máxima 40 | Dose Length Product | `valor-ejemplo` |
| `computedTomographyDoseIndex` | No | `string` | longitud máxima 40 | CTDI | `valor-ejemplo` |
| `doseAreaProduct` | No | `string` | longitud máxima 40 | Dose Area Product | `valor-ejemplo` |
| `effectiveDoseMsv` | No | `string` | longitud máxima 40 | Dosis efectiva (mSv) | `valor-ejemplo` |
| `unitConceptId` | No | `string` | formato `uuid` | Unidad de dosis (concept id) | `00000000-0000-4000-8000-000000000001` |
| `sourceSopInstanceUid` | No | `string` | longitud máxima 200 | SOP Instance UID de origen (evita doble conteo) | `00000000-0000-4000-8000-000000000001` |
| `deviceId` | No | `string` | formato `uuid` | Dispositivo/modalidad (device id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/imaging-studies/00000000-0000-4000-8000-000000000001/dose-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "imagingSeriesId": "00000000-0000-4000-8000-000000000001",
  "doseLengthProduct": "valor-ejemplo",
  "computedTomographyDoseIndex": "valor-ejemplo",
  "doseAreaProduct": "valor-ejemplo",
  "effectiveDoseMsv": "valor-ejemplo",
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "sourceSopInstanceUid": "00000000-0000-4000-8000-000000000001",
  "deviceId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

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
  "path": "/diagnostics/imaging-studies/{id}/dose-events"
}
```

---

## 19. GET /diagnostics/lab/orders

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Órdenes derivadas al laboratorio, con su estado derivado
- **Operation ID:** `DiagnosticsLabPortalController_listOrders`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabPortalController.listOrders](../../src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts)

### Descripción de negocio

Órdenes con `performer_tenant_id` = tenant activo (laboratorio, anatomía patológica e imagen), de la más nueva a la más vieja, por páginas (`limit` 100 por defecto, hasta 500). `count` es el total del laboratorio; si quedan órdenes más viejas viene `nextCursor`.


### Descripción del sistema

NestJS resuelve `GET /diagnostics/lab/orders` en `DiagnosticsLabPortalController_listOrders`. El controlador delega en `LabPortalOrdersService.list`. No recibe body. El tipo de retorno estático es `Promise<LabOrderPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | mínimo 1; máximo 500 | Sin descripción específica en OpenAPI. | `100` |
| `cursor` | query | No | `string` | longitud máxima 200 | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/lab/orders HTTP/1.1
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
GET /diagnostics/lab/orders?limit=100&cursor=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabOrderPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<LabOrderPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<LabOrderPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<LabOrderPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<LabOrderPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<LabOrderPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<LabOrderPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabOrderPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "orderId": "00000000-0000-4000-8000-000000000001",
      "studyName": "Nombre de ejemplo",
      "patientName": "Nombre de ejemplo",
      "requesterName": "Nombre de ejemplo",
      "requestedAt": "2026-07-31T12:00:00.000Z",
      "status": "DRAFT",
      "reason": "Texto descriptivo de ejemplo",
      "canReject": true,
      "registeredByPerformer": true,
      "canEdit": true,
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "priorityConceptId": "00000000-0000-4000-8000-000000000001",
      "externalRequesterName": "Nombre de ejemplo",
      "externalRequesterLicense": "valor-ejemplo",
      "files": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "fileName": "Nombre de ejemplo",
          "sizeBytes": 1
        }
      ],
      "report": {
        "draftStatus": "DRAFT",
        "publishedVersionId": "00000000-0000-4000-8000-000000000001"
      }
    }
  ],
  "count": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<LabOrderDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"orderId":"00000000-0000-4000-8000-000000000001","studyName":"Nombre de ejemplo","patientName":"Nombre de ejemplo","requesterName":"Nombre de ejemplo","requestedAt":"2026-07-31T12:00:00.000Z","status":"DRAFT","reason":"Texto descriptivo de ejemplo","canReject":true,"registeredByPerformer":true,"canEdit":true,"codeConceptId":"00000000-0000-4000-8000-000000000001","priorityConceptId":"00000000-0000-4000-8000-000000000001","externalRequesterName":"Nombre de ejemplo","externalRequesterLicense":"valor-ejemplo","files":[{"id":"00000000-0000-4000-8000-000000000001","fileName":"Nombre de ejemplo","sizeBytes":1}],"report":{"draftStatus":"DRAFT","publishedVersionId":"00000000-0000-4000-8000-000000000001"}}]` |
| `items[].orderId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].studyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].patientName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].requesterName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].requestedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].status` | Sí | `string` | valores: `DRAFT`, `RECEIVED`, `PROCESSED`, `UPLOADED`, `CANCELLED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `DRAFT` |
| `items[].reason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `items[].canReject` | Sí | `boolean` | Sin restricción adicional declarada | Whether REJECT applies now: a received order with an open specimen. | `true` |
| `items[].registeredByPerformer` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].canEdit` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].codeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].priorityConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].externalRequesterName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].externalRequesterLicense` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].files` | Sí | `array<LabOrderFileDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","fileName":"Nombre de ejemplo","sizeBytes":1}]` |
| `items[].files[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].files[].fileName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].files[].sizeBytes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].report` | Sí | `LabOrderReportStateDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"draftStatus":"DRAFT","publishedVersionId":"00000000-0000-4000-8000-000000000001"}` |
| `items[].report.draftStatus` | Sí | `string` | valores: `DRAFT`, `PUBLISHED`; admite null | Null when the tenant never opened a written report. | `DRAFT` |
| `items[].report.publishedVersionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Orders of the laboratory in total, not just the ones in this page. | `1` |
| `nextCursor` | No | `string` | Sin restricción adicional declarada | Present when older orders remain: send it back as `cursor`. | `valor-ejemplo` |

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
  "path": "/diagnostics/lab/orders"
}
```

---

## 20. POST /diagnostics/lab/orders

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** El centro carga una orden que llega en papel o por mostrador
- **Operation ID:** `DiagnosticsLabPortalController_createOrder`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabPortalController.createOrder](../../src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts)

### Descripción de negocio

Queda con el centro como custodio y ejecutor, sin encuentro ni médico de la plataforma; quien firmó el papel va en `externalRequesterName`. El estudio se valida contra el mismo catálogo que la orden del médico (422 con `reason`).


### Descripción del sistema

NestJS resuelve `POST /diagnostics/lab/orders` en `DiagnosticsLabPortalController_createOrder`. El controlador delega en `LabPortalOrderIntakeService.create`. Valida el body como `CreateLabOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<LabOrderDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateLabOrderDto`; los campos opcionales se omiten.

```http
POST /diagnostics/lab/orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "category": "LAB",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `codeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `category` | Sí | `string` | valores: `LAB`, `IMAGING` | Sin descripción específica en el contrato OpenAPI. | `LAB` |
| `priorityConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specimenTypeConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `imaging` | No | `ImagingDetailDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"modalityConceptId":"00000000-0000-4000-8000-000000000001","bodySiteConceptId":"00000000-0000-4000-8000-000000000001","lateralityConceptId":"00000000-0000-4000-8000-000000000001","contrastConceptId":"00000000-0000-4000-8000-000000000001","bodyStructureUberon":"UBERON:0000955","bodyMeshId":"BP44","boneTypeConceptId":"00000000-0000-4000-8000-000000000001"}` |
| `imaging.modalityConceptId` | No | `string` | formato `uuid` | Modalidad (value set `service-request-imaging-modality`). Si el estudio del catálogo ya fija una y no se envía, se toma la del estudio; si se envía otra: 422 MODALITY_STUDY_MISMATCH | `00000000-0000-4000-8000-000000000001` |
| `imaging.bodySiteConceptId` | No | `string` | formato `uuid` | Región corporal (value set `imaging-body-structure`). Obligatoria en estudios de imagen del catálogo (422 BODY_SITE_REQUIRED) | `00000000-0000-4000-8000-000000000001` |
| `imaging.lateralityConceptId` | No | `string` | formato `uuid` | Lateralidad (value set `condition-laterality`: izquierda, derecha, bilateral). Exige región; prohibida si la región no es par (422 LATERALITY_NOT_APPLICABLE) | `00000000-0000-4000-8000-000000000001` |
| `imaging.contrastConceptId` | No | `string` | formato `uuid` | Contraste (value set `imaging-contrast`). Exige modalidad (422 CONTRAST_REQUIRES_MODALITY) | `00000000-0000-4000-8000-000000000001` |
| `imaging.bodyStructureUberon` | No | `string` | longitud máxima 64 | Estructura marcada en el modelo 3D del cuerpo (`UBERON:<n>`). 422 BODY_STRUCTURE_FORMAT_INVALID si la forma no es esa; no se verifica contra el atlas | `UBERON:0000955` |
| `imaging.bodyMeshId` | No | `string` | longitud máxima 64 | Malla marcada en el modelo 3D (id alfanumérico, p. ej. `BP44`). 422 BODY_MESH_ID_FORMAT_INVALID si no lo es | `BP44` |
| `imaging.boneTypeConceptId` | No | `string` | formato `uuid` | Tipo de hueso (value set `bone-type`; lo elige el médico, no se deriva). Exige región o estructura UBERON (422 BONE_TYPE_REQUIRES_BODY_STRUCTURE / BONE_TYPE_NOT_IN_CATALOG) | `00000000-0000-4000-8000-000000000001` |
| `externalRequesterName` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `externalRequesterLicense` | No | `string` | longitud máxima 64 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/lab/orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "category": "LAB",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "imaging": {
    "modalityConceptId": "00000000-0000-4000-8000-000000000001",
    "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
    "lateralityConceptId": "00000000-0000-4000-8000-000000000001",
    "contrastConceptId": "00000000-0000-4000-8000-000000000001",
    "bodyStructureUberon": "UBERON:0000955",
    "bodyMeshId": "BP44",
    "boneTypeConceptId": "00000000-0000-4000-8000-000000000001"
  },
  "externalRequesterName": "Nombre de ejemplo",
  "externalRequesterLicense": "valor-ejemplo",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<LabOrderDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "orderId": "00000000-0000-4000-8000-000000000001",
  "studyName": "Nombre de ejemplo",
  "patientName": "Nombre de ejemplo",
  "requesterName": "Nombre de ejemplo",
  "requestedAt": "2026-07-31T12:00:00.000Z",
  "status": "DRAFT",
  "reason": "Texto descriptivo de ejemplo",
  "canReject": true,
  "registeredByPerformer": true,
  "canEdit": true,
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "externalRequesterName": "Nombre de ejemplo",
  "externalRequesterLicense": "valor-ejemplo",
  "files": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fileName": "Nombre de ejemplo",
      "sizeBytes": 1
    }
  ],
  "report": {
    "draftStatus": "DRAFT",
    "publishedVersionId": "00000000-0000-4000-8000-000000000001"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `orderId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `studyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `patientName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `requesterName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `requestedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `status` | Sí | `string` | valores: `DRAFT`, `RECEIVED`, `PROCESSED`, `UPLOADED`, `CANCELLED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `DRAFT` |
| `reason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `canReject` | Sí | `boolean` | Sin restricción adicional declarada | Whether REJECT applies now: a received order with an open specimen. | `true` |
| `registeredByPerformer` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `canEdit` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `codeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `priorityConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `externalRequesterName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `externalRequesterLicense` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `files` | Sí | `array<LabOrderFileDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","fileName":"Nombre de ejemplo","sizeBytes":1}]` |
| `files[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].fileName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `files[].sizeBytes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `report` | Sí | `LabOrderReportStateDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"draftStatus":"DRAFT","publishedVersionId":"00000000-0000-4000-8000-000000000001"}` |
| `report.draftStatus` | Sí | `string` | valores: `DRAFT`, `PUBLISHED`; admite null | Null when the tenant never opened a written report. | `DRAFT` |
| `report.publishedVersionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | NO_PATIENT | Excepción explícita en src/modules/diagnostics/services/lab-portal-order-intake.service.ts |
| 422 | `PRECONDITION_FAILED` | message | Excepción explícita en src/modules/clinical/services/service-request-detail.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/orders"
}
```

---

## 21. PUT /diagnostics/lab/orders/{orderId}

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Corregir una orden que cargó el centro, antes de recibirla
- **Operation ID:** `DiagnosticsLabPortalController_updateOrder`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabPortalController.updateOrder](../../src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts)

### Descripción de negocio

Reemplaza el estudio, su detalle, la prioridad y el solicitante externo. Sólo órdenes con `canEdit`: las de un médico o las ya recibidas responden 409.


### Descripción del sistema

NestJS resuelve `PUT /diagnostics/lab/orders/{orderId}` en `DiagnosticsLabPortalController_updateOrder`. El controlador delega en `LabPortalOrderIntakeService.update`. Valida el body como `UpdateLabOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<LabOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `orderId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateLabOrderDto`; los campos opcionales se omiten.

```http
PUT /diagnostics/lab/orders/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "category": "LAB"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `orderId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `codeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `category` | Sí | `string` | valores: `LAB`, `IMAGING` | Sin descripción específica en el contrato OpenAPI. | `LAB` |
| `priorityConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `specimenTypeConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `imaging` | No | `ImagingDetailDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"modalityConceptId":"00000000-0000-4000-8000-000000000001","bodySiteConceptId":"00000000-0000-4000-8000-000000000001","lateralityConceptId":"00000000-0000-4000-8000-000000000001","contrastConceptId":"00000000-0000-4000-8000-000000000001","bodyStructureUberon":"UBERON:0000955","bodyMeshId":"BP44","boneTypeConceptId":"00000000-0000-4000-8000-000000000001"}` |
| `imaging.modalityConceptId` | No | `string` | formato `uuid` | Modalidad (value set `service-request-imaging-modality`). Si el estudio del catálogo ya fija una y no se envía, se toma la del estudio; si se envía otra: 422 MODALITY_STUDY_MISMATCH | `00000000-0000-4000-8000-000000000001` |
| `imaging.bodySiteConceptId` | No | `string` | formato `uuid` | Región corporal (value set `imaging-body-structure`). Obligatoria en estudios de imagen del catálogo (422 BODY_SITE_REQUIRED) | `00000000-0000-4000-8000-000000000001` |
| `imaging.lateralityConceptId` | No | `string` | formato `uuid` | Lateralidad (value set `condition-laterality`: izquierda, derecha, bilateral). Exige región; prohibida si la región no es par (422 LATERALITY_NOT_APPLICABLE) | `00000000-0000-4000-8000-000000000001` |
| `imaging.contrastConceptId` | No | `string` | formato `uuid` | Contraste (value set `imaging-contrast`). Exige modalidad (422 CONTRAST_REQUIRES_MODALITY) | `00000000-0000-4000-8000-000000000001` |
| `imaging.bodyStructureUberon` | No | `string` | longitud máxima 64 | Estructura marcada en el modelo 3D del cuerpo (`UBERON:<n>`). 422 BODY_STRUCTURE_FORMAT_INVALID si la forma no es esa; no se verifica contra el atlas | `UBERON:0000955` |
| `imaging.bodyMeshId` | No | `string` | longitud máxima 64 | Malla marcada en el modelo 3D (id alfanumérico, p. ej. `BP44`). 422 BODY_MESH_ID_FORMAT_INVALID si no lo es | `BP44` |
| `imaging.boneTypeConceptId` | No | `string` | formato `uuid` | Tipo de hueso (value set `bone-type`; lo elige el médico, no se deriva). Exige región o estructura UBERON (422 BONE_TYPE_REQUIRES_BODY_STRUCTURE / BONE_TYPE_NOT_IN_CATALOG) | `00000000-0000-4000-8000-000000000001` |
| `externalRequesterName` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `externalRequesterLicense` | No | `string` | longitud máxima 64 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /diagnostics/lab/orders/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "category": "LAB",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "imaging": {
    "modalityConceptId": "00000000-0000-4000-8000-000000000001",
    "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
    "lateralityConceptId": "00000000-0000-4000-8000-000000000001",
    "contrastConceptId": "00000000-0000-4000-8000-000000000001",
    "bodyStructureUberon": "UBERON:0000955",
    "bodyMeshId": "BP44",
    "boneTypeConceptId": "00000000-0000-4000-8000-000000000001"
  },
  "externalRequesterName": "Nombre de ejemplo",
  "externalRequesterLicense": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabOrderDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 409 | La orden no es editable | `Promise<LabOrderDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "orderId": "00000000-0000-4000-8000-000000000001",
  "studyName": "Nombre de ejemplo",
  "patientName": "Nombre de ejemplo",
  "requesterName": "Nombre de ejemplo",
  "requestedAt": "2026-07-31T12:00:00.000Z",
  "status": "DRAFT",
  "reason": "Texto descriptivo de ejemplo",
  "canReject": true,
  "registeredByPerformer": true,
  "canEdit": true,
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "externalRequesterName": "Nombre de ejemplo",
  "externalRequesterLicense": "valor-ejemplo",
  "files": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fileName": "Nombre de ejemplo",
      "sizeBytes": 1
    }
  ],
  "report": {
    "draftStatus": "DRAFT",
    "publishedVersionId": "00000000-0000-4000-8000-000000000001"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `orderId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `studyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `patientName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `requesterName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `requestedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `status` | Sí | `string` | valores: `DRAFT`, `RECEIVED`, `PROCESSED`, `UPLOADED`, `CANCELLED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `DRAFT` |
| `reason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `canReject` | Sí | `boolean` | Sin restricción adicional declarada | Whether REJECT applies now: a received order with an open specimen. | `true` |
| `registeredByPerformer` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `canEdit` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `codeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `priorityConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `externalRequesterName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `externalRequesterLicense` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `files` | Sí | `array<LabOrderFileDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","fileName":"Nombre de ejemplo","sizeBytes":1}]` |
| `files[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].fileName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `files[].sizeBytes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `report` | Sí | `LabOrderReportStateDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"draftStatus":"DRAFT","publishedVersionId":"00000000-0000-4000-8000-000000000001"}` |
| `report.draftStatus` | Sí | `string` | valores: `DRAFT`, `PUBLISHED`; admite null | Null when the tenant never opened a written report. | `DRAFT` |
| `report.publishedVersionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Sólo se editan las órdenes que cargó el centro y que todavía no se recibieron. | Excepción explícita en src/modules/diagnostics/services/lab-portal-order-intake.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | message | Excepción explícita en src/modules/clinical/services/service-request-detail.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/orders/{orderId}"
}
```

---

## 22. POST /diagnostics/lab/orders/{orderId}/transitions

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Un paso del camino de la orden (RECEIVE, PROCESS, REJECT, CANCEL)
- **Operation ID:** `DiagnosticsLabPortalController_transition`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabPortalController.transition](../../src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts)

### Descripción de negocio

CANCEL (desde DRAFT o RECEIVED) y REJECT (desde RECEIVED) valen para toda orden, imagenología incluida, y exigen `reason`: el ejecutor agrega un evento propio (`service_request_performer_events`) sin tocar la orden del solicitante. Una orden cancelada o rechazada deja de poder reservarse. Un paso que el estado no admite responde 409.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/lab/orders/{orderId}/transitions` en `DiagnosticsLabPortalController_transition`. El controlador delega en `LabPortalOrdersService.transition`. Valida el body como `LabOrderTransitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<LabOrderDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `orderId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LabOrderTransitionDto`; los campos opcionales se omiten.

```http
POST /diagnostics/lab/orders/00000000-0000-4000-8000-000000000001/transitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "action": "RECEIVE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `orderId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `action` | Sí | `string` | valores: `RECEIVE`, `PROCESS`, `CANCEL`, `REJECT` | Sin descripción específica en el contrato OpenAPI. | `RECEIVE` |
| `reason` | No | `string` | longitud máxima 1000; patrón runtime `/\S/` | Required (non-blank) when action is CANCEL or REJECT; ignored by RECEIVE and PROCESS | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/lab/orders/00000000-0000-4000-8000-000000000001/transitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "action": "RECEIVE",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 400 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 409 | El estado actual no admite ese paso | `Promise<LabOrderDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabOrderDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabOrderDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "orderId": "00000000-0000-4000-8000-000000000001",
  "studyName": "Nombre de ejemplo",
  "patientName": "Nombre de ejemplo",
  "requesterName": "Nombre de ejemplo",
  "requestedAt": "2026-07-31T12:00:00.000Z",
  "status": "DRAFT",
  "reason": "Texto descriptivo de ejemplo",
  "canReject": true,
  "registeredByPerformer": true,
  "canEdit": true,
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "externalRequesterName": "Nombre de ejemplo",
  "externalRequesterLicense": "valor-ejemplo",
  "files": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fileName": "Nombre de ejemplo",
      "sizeBytes": 1
    }
  ],
  "report": {
    "draftStatus": "DRAFT",
    "publishedVersionId": "00000000-0000-4000-8000-000000000001"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `orderId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `studyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `patientName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `requesterName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `requestedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `status` | Sí | `string` | valores: `DRAFT`, `RECEIVED`, `PROCESSED`, `UPLOADED`, `CANCELLED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `DRAFT` |
| `reason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `canReject` | Sí | `boolean` | Sin restricción adicional declarada | Whether REJECT applies now: a received order with an open specimen. | `true` |
| `registeredByPerformer` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `canEdit` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `codeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `priorityConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `externalRequesterName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `externalRequesterLicense` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `files` | Sí | `array<LabOrderFileDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","fileName":"Nombre de ejemplo","sizeBytes":1}]` |
| `files[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].fileName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `files[].sizeBytes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `report` | Sí | `LabOrderReportStateDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"draftStatus":"DRAFT","publishedVersionId":"00000000-0000-4000-8000-000000000001"}` |
| `report.draftStatus` | Sí | `string` | valores: `DRAFT`, `PUBLISHED`; admite null | Null when the tenant never opened a written report. | `DRAFT` |
| `report.publishedVersionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | La orden no está en un estado que admita ese paso. | Excepción explícita en src/modules/diagnostics/services/lab-portal-orders.service.ts |
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
  "path": "/diagnostics/lab/orders/{orderId}/transitions"
}
```

---

## 23. POST /diagnostics/lab/patients/lookup

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Paciente por número de documento, para cargar su orden
- **Operation ID:** `DiagnosticsLabPortalController_lookupPatient`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabPortalController.lookupPatient](../../src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts)

### Descripción de negocio

Coincidencia exacta con el documento de identidad vigente. `POST` porque el documento es PHI y no viaja en la URL. 404 si nadie lo tiene.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/lab/patients/lookup` en `DiagnosticsLabPortalController_lookupPatient`. El controlador delega en `LabPortalOrderIntakeService.lookupPatient`. Valida el body como `LabPatientLookupDto` y consume `application/json`. El tipo de retorno estático es `Promise<LabPatientMatchDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LabPatientLookupDto`; los campos opcionales se omiten.

```http
POST /diagnostics/lab/patients/lookup HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "nationalId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `nationalId` | Sí | `string` | longitud máxima 40; patrón runtime `NOT_BLANK` | Exact national id number | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/lab/patients/lookup HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "nationalId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabPatientMatchDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LabPatientMatchDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabPatientMatchDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabPatientMatchDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LabPatientMatchDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LabPatientMatchDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabPatientMatchDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabPatientMatchDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabPatientMatchDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabPatientMatchDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabPatientMatchDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "displayName": "Nombre de ejemplo",
  "patientCode": "CODIGO_EJEMPLO"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `displayName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `patientCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | NO_PATIENT | Excepción explícita en src/modules/diagnostics/services/lab-portal-order-intake.service.ts |
| 409 | `CONFLICT` | Ese documento figura en más de un paciente. Pida a soporte que lo revise. | Excepción explícita en src/modules/diagnostics/services/lab-portal-order-intake.service.ts |
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
  "path": "/diagnostics/lab/patients/lookup"
}
```

---

## 24. GET /diagnostics/lab/result-files

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Resultados subidos por el laboratorio
- **Operation ID:** `DiagnosticsLabResultsController_listResultFiles`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabResultsController.listResultFiles](../../src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts)

### Descripción de negocio

Sin búsqueda por texto: puede ser un nombre de paciente y no viaja en la URL. Para buscar, `POST /diagnostics/lab/result-files/search`.


### Descripción del sistema

NestJS resuelve `GET /diagnostics/lab/result-files` en `DiagnosticsLabResultsController_listResultFiles`. El controlador delega en `LabPortalResultsService.list`. No recibe body. El tipo de retorno estático es `Promise<LabResultFilePageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `kind` | query | No | `string` | valores: `PDF`, `IMAGE`, `VIDEO`, `AUDIO`, `TEXT`, `DICOM`, `OTHER` | Sin descripción específica en OpenAPI. | `PDF` |
| `orderId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `includeWithdrawn` | query | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `true` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/lab/result-files HTTP/1.1
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
GET /diagnostics/lab/result-files?kind=PDF&orderId=00000000-0000-4000-8000-000000000001&includeWithdrawn=true HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<LabResultFilePageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabResultFilePageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fileName": "Nombre de ejemplo",
      "contentType": "valor-ejemplo",
      "sizeBytes": 1,
      "kind": "PDF",
      "uploadedAt": "2026-07-31T12:00:00.000Z",
      "uploadedBy": "valor-ejemplo",
      "orderId": "00000000-0000-4000-8000-000000000001",
      "orderLabel": "valor-ejemplo",
      "patientName": "Nombre de ejemplo",
      "note": "valor-ejemplo",
      "notified": true,
      "status": "AVAILABLE",
      "withdrawnReason": "Texto descriptivo de ejemplo"
    }
  ],
  "count": 1,
  "totalBytes": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<LabResultFileDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","fileName":"Nombre de ejemplo","contentType":"valor-ejemplo","sizeBytes":1,"kind":"PDF","uploadedAt":"2026-07-31T12:00:00.000Z","uploadedBy":"valor-ejemplo","orderId":"00000000-0000-4000-8000-000000000001","orderLabel":"valor-ejemplo","patientName":"Nombre de ejemplo","note":"valor-ejemplo","notified":true,"status":"AVAILABLE","withdrawnReason":"Texto descriptivo de ejemplo"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].fileName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].contentType` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].sizeBytes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].kind` | Sí | `string` | valores: `PDF`, `IMAGE`, `VIDEO`, `AUDIO`, `TEXT`, `DICOM`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `PDF` |
| `items[].uploadedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].uploadedBy` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].orderId` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].orderLabel` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].patientName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].note` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].notified` | Sí | `boolean` | Sin restricción adicional declarada | The API does not send notifications from this portal: always `false`. | `true` |
| `items[].status` | Sí | `string` | valores: `AVAILABLE`, `WITHDRAWN` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `items[].withdrawnReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `totalBytes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

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
  "path": "/diagnostics/lab/result-files"
}
```

---

## 25. GET /diagnostics/lab/result-files/{id}/content

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Descargar un resultado subido
- **Operation ID:** `DiagnosticsLabResultsController_getResultContent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabResultsController.getResultContent](../../src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts)

### Descripción de negocio

Descargar un resultado subido. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /diagnostics/lab/result-files/{id}/content` en `DiagnosticsLabResultsController_getResultContent`. El controlador delega en `LabPortalResultsService.content`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/lab/result-files/00000000-0000-4000-8000-000000000001/content HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostics/lab/result-files/00000000-0000-4000-8000-000000000001/content HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Bytes del archivo | `Promise<void>` | No |
| 400 | Consulta completada correctamente. | `Promise<void>` | No |
| 401 | Consulta completada correctamente. | `Promise<void>` | No |
| 403 | Consulta completada correctamente. | `Promise<void>` | No |
| 404 | Consulta completada correctamente. | `Promise<void>` | No |
| 429 | Consulta completada correctamente. | `Promise<void>` | No |
| 500 | Consulta completada correctamente. | `Promise<void>` | No |
| 504 | Consulta completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | La descarga de archivos no está disponible | Excepción explícita en src/modules/diagnostics/services/lab-portal-results.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/result-files/{id}/content"
}
```

---

## 26. POST /diagnostics/lab/result-files/{id}/withdrawal

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Retirar un resultado subido por error (queda en el historial)
- **Operation ID:** `DiagnosticsLabResultsController_withdrawResult`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabResultsController.withdrawResult](../../src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts)

### Descripción de negocio

Retirar un resultado subido por error (queda en el historial). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/lab/result-files/{id}/withdrawal` en `DiagnosticsLabResultsController_withdrawResult`. El controlador delega en `LabPortalResultWritesService.withdraw`. Valida el body como `LabResultWithdrawalDto` y consume `application/json`. El tipo de retorno estático es `Promise<LabResultFileDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LabResultWithdrawalDto`; los campos opcionales se omiten.

```http
POST /diagnostics/lab/result-files/00000000-0000-4000-8000-000000000001/withdrawal HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | longitud mínima 1; longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/lab/result-files/00000000-0000-4000-8000-000000000001/withdrawal HTTP/1.1
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
| 200 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabResultFileDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "fileName": "Nombre de ejemplo",
  "contentType": "valor-ejemplo",
  "sizeBytes": 1,
  "kind": "PDF",
  "uploadedAt": "2026-07-31T12:00:00.000Z",
  "uploadedBy": "valor-ejemplo",
  "orderId": "00000000-0000-4000-8000-000000000001",
  "orderLabel": "valor-ejemplo",
  "patientName": "Nombre de ejemplo",
  "note": "valor-ejemplo",
  "notified": true,
  "status": "AVAILABLE",
  "withdrawnReason": "Texto descriptivo de ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `fileName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `contentType` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sizeBytes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `kind` | Sí | `string` | valores: `PDF`, `IMAGE`, `VIDEO`, `AUDIO`, `TEXT`, `DICOM`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `PDF` |
| `uploadedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `uploadedBy` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `orderId` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `orderLabel` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `patientName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `note` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `notified` | Sí | `boolean` | Sin restricción adicional declarada | The API does not send notifications from this portal: always `false`. | `true` |
| `status` | Sí | `string` | valores: `AVAILABLE`, `WITHDRAWN` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `withdrawnReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El archivo ya estaba retirado. | Excepción explícita en src/modules/diagnostics/services/lab-portal-result-writes.service.ts |
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
  "path": "/diagnostics/lab/result-files/{id}/withdrawal"
}
```

---

## 27. POST /diagnostics/lab/result-files/search

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Buscar entre los resultados subidos (filtros en el cuerpo)
- **Operation ID:** `DiagnosticsLabResultsController_searchResultFiles`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabResultsController.searchResultFiles](../../src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts)

### Descripción de negocio

Buscar entre los resultados subidos (filtros en el cuerpo). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/lab/result-files/search` en `DiagnosticsLabResultsController_searchResultFiles`. El controlador delega en `LabPortalResultsService.list`. Valida el body como `LabResultFileSearchDto` y consume `application/json`. El tipo de retorno estático es `Promise<LabResultFilePageDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LabResultFileSearchDto`; los campos opcionales se omiten.

```http
POST /diagnostics/lab/result-files/search HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kind` | No | `string` | valores: `PDF`, `IMAGE`, `VIDEO`, `AUDIO`, `TEXT`, `DICOM`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `PDF` |
| `orderId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `includeWithdrawn` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `q` | No | `string` | longitud máxima 120 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/lab/result-files/search HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "kind": "PDF",
  "orderId": "00000000-0000-4000-8000-000000000001",
  "includeWithdrawn": true,
  "q": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabResultFilePageDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabResultFilePageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabResultFilePageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fileName": "Nombre de ejemplo",
      "contentType": "valor-ejemplo",
      "sizeBytes": 1,
      "kind": "PDF",
      "uploadedAt": "2026-07-31T12:00:00.000Z",
      "uploadedBy": "valor-ejemplo",
      "orderId": "00000000-0000-4000-8000-000000000001",
      "orderLabel": "valor-ejemplo",
      "patientName": "Nombre de ejemplo",
      "note": "valor-ejemplo",
      "notified": true,
      "status": "AVAILABLE",
      "withdrawnReason": "Texto descriptivo de ejemplo"
    }
  ],
  "count": 1,
  "totalBytes": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<LabResultFileDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","fileName":"Nombre de ejemplo","contentType":"valor-ejemplo","sizeBytes":1,"kind":"PDF","uploadedAt":"2026-07-31T12:00:00.000Z","uploadedBy":"valor-ejemplo","orderId":"00000000-0000-4000-8000-000000000001","orderLabel":"valor-ejemplo","patientName":"Nombre de ejemplo","note":"valor-ejemplo","notified":true,"status":"AVAILABLE","withdrawnReason":"Texto descriptivo de ejemplo"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].fileName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].contentType` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].sizeBytes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].kind` | Sí | `string` | valores: `PDF`, `IMAGE`, `VIDEO`, `AUDIO`, `TEXT`, `DICOM`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `PDF` |
| `items[].uploadedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].uploadedBy` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].orderId` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].orderLabel` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].patientName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].note` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].notified` | Sí | `boolean` | Sin restricción adicional declarada | The API does not send notifications from this portal: always `false`. | `true` |
| `items[].status` | Sí | `string` | valores: `AVAILABLE`, `WITHDRAWN` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `items[].withdrawnReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `totalBytes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/diagnostics/lab/result-files/search"
}
```

---

## 28. GET /diagnostics/lab/result-targets

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Órdenes procesadas a las que se puede adjuntar un resultado
- **Operation ID:** `DiagnosticsLabPortalController_listResultTargets`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabPortalController.listResultTargets](../../src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts)

### Descripción de negocio

Órdenes procesadas a las que se puede adjuntar un resultado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /diagnostics/lab/result-targets` en `DiagnosticsLabPortalController_listResultTargets`. El controlador delega en `LabPortalResultsService.targets`. No recibe body. El tipo de retorno estático es `Promise<LabResultTargetPageDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/lab/result-targets HTTP/1.1
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
GET /diagnostics/lab/result-targets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabResultTargetPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<LabResultTargetPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<LabResultTargetPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<LabResultTargetPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<LabResultTargetPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<LabResultTargetPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<LabResultTargetPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabResultTargetPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "orderId": "00000000-0000-4000-8000-000000000001",
      "studyName": "Nombre de ejemplo",
      "patientName": "Nombre de ejemplo",
      "requesterName": "Nombre de ejemplo",
      "requestedAt": "2026-07-31T12:00:00.000Z",
      "fileCount": 1
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<LabResultTargetDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"orderId":"00000000-0000-4000-8000-000000000001","studyName":"Nombre de ejemplo","patientName":"Nombre de ejemplo","requesterName":"Nombre de ejemplo","requestedAt":"2026-07-31T12:00:00.000Z","fileCount":1}]` |
| `items[].orderId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].studyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].patientName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].requesterName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].requestedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].fileCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

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
  "path": "/diagnostics/lab/result-targets"
}
```

---

## 29. POST /diagnostics/lab/result-uploads

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Empezar la subida por partes de un resultado
- **Operation ID:** `DiagnosticsLabUploadsController_start`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabUploadsController.start](../../src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts)

### Descripción de negocio

Exige una orden procesada del tenant activo (409 si no lo está). El tamaño total no puede superar `FILE_STORAGE_MAX_SIZE_BYTES` (422).


### Descripción del sistema

NestJS resuelve `POST /diagnostics/lab/result-uploads` en `DiagnosticsLabUploadsController_start`. El controlador delega en `LabPortalUploadsService.start`. Valida el body como `LabResultUploadStartDto` y consume `application/json`. El tipo de retorno estático es `Promise<LabResultUploadSessionDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LabResultUploadStartDto`; los campos opcionales se omiten.

```http
POST /diagnostics/lab/result-uploads HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fileName": "Nombre de ejemplo",
  "contentType": "valor-ejemplo",
  "sizeBytes": 1,
  "orderId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fileName` | Sí | `string` | longitud mínima 1; longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `contentType` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sizeBytes` | Sí | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `orderId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `note` | No | `string` | longitud máxima 1000; admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `notify` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/lab/result-uploads HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fileName": "Nombre de ejemplo",
  "contentType": "valor-ejemplo",
  "sizeBytes": 1,
  "orderId": "00000000-0000-4000-8000-000000000001",
  "note": "valor-ejemplo",
  "notify": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<LabResultUploadSessionDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LabResultUploadSessionDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabResultUploadSessionDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabResultUploadSessionDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LabResultUploadSessionDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LabResultUploadSessionDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabResultUploadSessionDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabResultUploadSessionDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabResultUploadSessionDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabResultUploadSessionDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabResultUploadSessionDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "uploadId": "00000000-0000-4000-8000-000000000001",
  "chunkSizeBytes": 1,
  "totalParts": 1,
  "receivedParts": [
    1
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `uploadId` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `chunkSizeBytes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `totalParts` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `receivedParts` | Sí | `array<number>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[1]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Hay demasiadas subidas abiertas; termine o cancele alguna. | Excepción explícita en src/modules/diagnostics/services/lab-portal-uploads.service.ts |
| 409 | `CONFLICT` | Marque la orden como procesada antes de subir sus resultados. | Excepción explícita en src/modules/diagnostics/services/lab-portal-results.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El archivo excede el tamaño máximo permitido | Excepción explícita en src/modules/diagnostics/services/lab-portal-uploads.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/result-uploads"
}
```

---

## 30. DELETE /diagnostics/lab/result-uploads/{uploadId}

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Cancelar una subida abierta
- **Operation ID:** `DiagnosticsLabUploadsController_abort`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabUploadsController.abort](../../src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts)

### Descripción de negocio

Cancelar una subida abierta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `DELETE /diagnostics/lab/result-uploads/{uploadId}` en `DiagnosticsLabUploadsController_abort`. El controlador delega en `LabPortalUploadsService.abort`. No recibe body. El tipo de retorno estático es `void`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `uploadId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /diagnostics/lab/result-uploads/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `uploadId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /diagnostics/lab/result-uploads/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 204 | Operación completada sin cuerpo de respuesta. | `void` | No |
| 400 | Operación completada correctamente. | `void` | No |
| 401 | Operación completada correctamente. | `void` | No |
| 403 | Operación completada correctamente. | `void` | No |
| 404 | Operación completada correctamente. | `void` | No |
| 409 | Operación completada correctamente. | `void` | No |
| 422 | Operación completada correctamente. | `void` | No |
| 429 | Operación completada correctamente. | `void` | No |
| 500 | Operación completada correctamente. | `void` | No |
| 504 | Operación completada correctamente. | `void` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | La subida se está cerrando. | Excepción explícita en src/modules/diagnostics/services/lab-portal-uploads.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/result-uploads/{uploadId}"
}
```

---

## 31. POST /diagnostics/lab/result-uploads/{uploadId}/complete

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Cerrar la subida: guarda el archivo y lo publica en el informe
- **Operation ID:** `DiagnosticsLabUploadsController_complete`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabUploadsController.complete](../../src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts)

### Descripción de negocio

Cerrar la subida: guarda el archivo y lo publica en el informe. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/lab/result-uploads/{uploadId}/complete` en `DiagnosticsLabUploadsController_complete`. El controlador delega en `LabPortalUploadsService.complete`. No recibe body. El tipo de retorno estático es `Promise<LabResultFileDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `uploadId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /diagnostics/lab/result-uploads/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `uploadId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /diagnostics/lab/result-uploads/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<LabResultFileDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabResultFileDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabResultFileDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "fileName": "Nombre de ejemplo",
  "contentType": "valor-ejemplo",
  "sizeBytes": 1,
  "kind": "PDF",
  "uploadedAt": "2026-07-31T12:00:00.000Z",
  "uploadedBy": "valor-ejemplo",
  "orderId": "00000000-0000-4000-8000-000000000001",
  "orderLabel": "valor-ejemplo",
  "patientName": "Nombre de ejemplo",
  "note": "valor-ejemplo",
  "notified": true,
  "status": "AVAILABLE",
  "withdrawnReason": "Texto descriptivo de ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `fileName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `contentType` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sizeBytes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `kind` | Sí | `string` | valores: `PDF`, `IMAGE`, `VIDEO`, `AUDIO`, `TEXT`, `DICOM`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `PDF` |
| `uploadedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `uploadedBy` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `orderId` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `orderLabel` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `patientName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `note` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `notified` | Sí | `boolean` | Sin restricción adicional declarada | The API does not send notifications from this portal: always `false`. | `true` |
| `status` | Sí | `string` | valores: `AVAILABLE`, `WITHDRAWN` | Sin descripción específica en el contrato OpenAPI. | `AVAILABLE` |
| `withdrawnReason` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La subida no existe o ya se cerró. | Excepción explícita en src/modules/diagnostics/services/lab-portal-uploads.service.ts |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/files.service.ts |
| 409 | `CONFLICT` | Faltan ${missing.length} partes del archivo. | Excepción explícita en src/modules/diagnostics/services/lab-portal-uploads.service.ts |
| 409 | `CONFLICT` | La subida ya se está cerrando. | Excepción explícita en src/modules/diagnostics/services/lab-portal-uploads.service.ts |
| 409 | `CONFLICT` | Marque la orden como procesada antes de subir sus resultados. | Excepción explícita en src/modules/diagnostics/services/lab-portal-results.service.ts |
| 422 | `PRECONDITION_FAILED` | El archivo está bajo retención legal y no puede borrarse | Excepción explícita en src/modules/common/services/files.service.ts |
| 422 | `PRECONDITION_FAILED` | No se recibió contenido en el campo "file" | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | El archivo excede el tamaño máximo permitido | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | Las fotos HEIC, HEIF o AVIF no se aceptan: enviala como JPEG, PNG, WEBP o GIF | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | El contenido no corresponde a ningún formato de archivo permitido | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | El formato del archivo no está permitido para esta categoría | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/result-uploads/{uploadId}/complete"
}
```

---

## 32. PUT /diagnostics/lab/result-uploads/{uploadId}/parts/{index}

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Mandar una parte (bytes crudos)
- **Operation ID:** `DiagnosticsLabUploadsController_putPart`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabUploadsController.putPart](../../src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts)

### Descripción de negocio

Otro Content-Type distinto de octet-stream es 415.


### Descripción del sistema

NestJS resuelve `PUT /diagnostics/lab/result-uploads/{uploadId}/parts/{index}` en `DiagnosticsLabUploadsController_putPart`. El controlador delega en `LabPortalUploadsService.expectedPartSize`, `LabPortalUploadsService.putPart`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `uploadId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `index` | path | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
PUT /diagnostics/lab/result-uploads/00000000-0000-4000-8000-000000000001/parts/1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `uploadId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
PUT /diagnostics/lab/result-uploads/00000000-0000-4000-8000-000000000001/parts/1 HTTP/1.1
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
| 504 | Operación completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 400 | `VALIDATION_FAILED` | La parte ${index} está fuera de rango. | Excepción explícita en src/modules/diagnostics/services/lab-portal-uploads.service.ts |
| 400 | `VALIDATION_FAILED` | La parte ${index} trae ${part.byteLength} bytes y se esperaban ${expected}. | Excepción explícita en src/modules/diagnostics/services/lab-portal-uploads.service.ts |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La subida no existe o ya se cerró. | Excepción explícita en src/modules/diagnostics/services/lab-portal-uploads.service.ts |
| 409 | `CONFLICT` | La subida se está cerrando. | Excepción explícita en src/modules/diagnostics/services/lab-portal-uploads.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/lab/result-uploads/{uploadId}/parts/{index}"
}
```

---

## 33. GET /diagnostics/lab/summary

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-lab-portal`
- **Nombre:** Resumen del laboratorio del tenant activo
- **Operation ID:** `DiagnosticsLabPortalController_getSummary`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabPortalController.getSummary](../../src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts)

### Descripción de negocio

Resumen del laboratorio del tenant activo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /diagnostics/lab/summary` en `DiagnosticsLabPortalController_getSummary`. El controlador delega en `LabPortalSummaryService.summary`. No recibe body. El tipo de retorno estático es `Promise<LabSummaryDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/lab/summary HTTP/1.1
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
GET /diagnostics/lab/summary HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabSummaryDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<LabSummaryDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<LabSummaryDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<LabSummaryDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<LabSummaryDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<LabSummaryDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<LabSummaryDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabSummaryDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "labName": "Nombre de ejemplo",
  "published": 1,
  "drafts": 1,
  "withdrawn": 1,
  "unavailable": 1,
  "ordersWithoutResults": 1,
  "resultFiles": 1,
  "resultBytes": 1,
  "byCategory": [
    {
      "categoryId": "00000000-0000-4000-8000-000000000001",
      "category": "valor-ejemplo",
      "count": 1
    }
  ],
  "recentActivity": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "at": "2026-07-31T12:00:00.000Z",
      "kind": {},
      "text": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `labName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `published` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `drafts` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `withdrawn` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `unavailable` | Sí | `number` | Sin restricción adicional declarada | Services (not withdrawn) switched off with "available today" = false | `1` |
| `ordersWithoutResults` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `resultFiles` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `resultBytes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `byCategory` | Sí | `array<LabCategoryCountDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"categoryId":"00000000-0000-4000-8000-000000000001","category":"valor-ejemplo","count":1}]` |
| `byCategory[].categoryId` | Sí | `string` | formato `uuid`; admite null | Null for the «Sin categoría» bucket | `00000000-0000-4000-8000-000000000001` |
| `byCategory[].category` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `byCategory[].count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `recentActivity` | Sí | `array<LabActivityEntryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","at":"2026-07-31T12:00:00.000Z","kind":{},"text":"valor-ejemplo"}]` |
| `recentActivity[].id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `recentActivity[].at` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `recentActivity[].kind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof LAB_ACTIVITY_KINDS)[number] | `{}` |
| `recentActivity[].text` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

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
  "path": "/diagnostics/lab/summary"
}
```

---

## 34. GET /diagnostics/patients/{patientProfileId}/imaging-studies

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-imaging`
- **Nombre:** Listar los estudios de imagen del paciente
- **Operation ID:** `DiagnosticsImagingController_listStudies`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsImagingController.listStudies](../../src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts)

### Descripción de negocio

Exige un vínculo asistencial vigente entre el profesional y el paciente: sin él responde 404, igual que un paciente inexistente.

Contexto declarado en el controlador: Estudios de imagen de un paciente. Es la lectura que cierra el circuito: quien pidió la prueba puede encontrar su resultado sin conocer de antemano el uuid del estudio.

### Descripción del sistema

NestJS resuelve `GET /diagnostics/patients/{patientProfileId}/imaging-studies` en `DiagnosticsImagingController_listStudies`. El controlador delega en `DiagnosticsImagingService.listStudiesByPatient`. No recibe body. El tipo de retorno estático es `Promise<ImagingStudySummaryDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |
| `offset` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/patients/00000000-0000-4000-8000-000000000001/imaging-studies?limit=1&offset=1 HTTP/1.1
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
GET /diagnostics/patients/00000000-0000-4000-8000-000000000001/imaging-studies?limit=1&offset=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ImagingStudySummaryDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<ImagingStudySummaryDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<ImagingStudySummaryDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<ImagingStudySummaryDto[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<ImagingStudySummaryDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<ImagingStudySummaryDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<ImagingStudySummaryDto[]>` | No |
| 504 | Consulta completada correctamente. | `Promise<ImagingStudySummaryDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ImagingStudySummaryDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "patientProfileId": "00000000-0000-4000-8000-000000000001",
    "serviceRequestId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "studyInstanceUid": "00000000-0000-4000-8000-000000000001"
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Paciente no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/patients/{patientProfileId}/imaging-studies"
}
```

---

## 35. GET /diagnostics/patients/{patientProfileId}/orders

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-orders`
- **Nombre:** Órdenes de laboratorio e imagenología del paciente, con sus informes
- **Operation ID:** `DiagnosticsOrdersController_getPatientOrders`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsOrdersController.getPatientOrders](../../src/modules/diagnostics/controllers/diagnostics-orders.controller.ts)

### Descripción de negocio

Cierra el circuito del módulo: el alta de la orden es POST /clinical/service-requests y ésta es la lectura que la encuentra.

Contexto declarado en el controlador: Órdenes de laboratorio e imagenología del paciente, con sus informes.

### Descripción del sistema

NestJS resuelve `GET /diagnostics/patients/{patientProfileId}/orders` en `DiagnosticsOrdersController_getPatientOrders`. El controlador delega en `DiagnosticsOrdersService.getPatientOrders`. No recibe body. El tipo de retorno estático es `Promise<PatientDiagnosticOrdersResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope aplicado a cada bloque (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/patients/00000000-0000-4000-8000-000000000001/orders HTTP/1.1
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
GET /diagnostics/patients/00000000-0000-4000-8000-000000000001/orders?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PatientDiagnosticOrdersResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PatientDiagnosticOrdersResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PatientDiagnosticOrdersResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PatientDiagnosticOrdersResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PatientDiagnosticOrdersResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PatientDiagnosticOrdersResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PatientDiagnosticOrdersResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PatientDiagnosticOrdersResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientDiagnosticOrdersResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "orders": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "encounterId": "00000000-0000-4000-8000-000000000001",
      "formInstanceId": "00000000-0000-4000-8000-000000000001",
      "reasonConditionId": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "categoryConceptId": "00000000-0000-4000-8000-000000000001",
      "category": {},
      "basedOnNoteIds": [
        "valor-ejemplo"
      ],
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "priorityConceptId": "00000000-0000-4000-8000-000000000001",
      "requesterProfileId": "00000000-0000-4000-8000-000000000001",
      "performerSelectionConceptId": "00000000-0000-4000-8000-000000000001",
      "performerPractitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "suggestedPracticeSiteId": "00000000-0000-4000-8000-000000000001",
      "suggestedPracticeSiteName": "Nombre de ejemplo",
      "suggestedCareSpace": {
        "id": "00000000-0000-4000-8000-000000000001",
        "code": "CODIGO_EJEMPLO",
        "name": "Nombre de ejemplo"
      },
      "createdAt": "2026-07-31T12:00:00.000Z",
      "previousDiagnosticReportId": "00000000-0000-4000-8000-000000000001",
      "duplicateOverrideReason": "Texto descriptivo de ejemplo"
    }
  ],
  "reports": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "serviceRequestId": "00000000-0000-4000-8000-000000000001",
      "encounterId": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "categoryConceptId": "00000000-0000-4000-8000-000000000001",
      "lifecycleStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "currentVersionId": "00000000-0000-4000-8000-000000000001",
      "currentReleasedVersionId": "00000000-0000-4000-8000-000000000001",
      "resultReleaseStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "releasedVersionId": "00000000-0000-4000-8000-000000000001",
      "patientVisibility": {},
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente leído. | `00000000-0000-4000-8000-000000000001` |
| `orders` | Sí | `array<DiagnosticOrderSummaryDto>` | Sin restricción adicional declarada | Órdenes de laboratorio e imagenología, de la más nueva a la más vieja. | `[{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","encounterId":"00000000-0000-4000-8000-000000000001","formInstanceId":"00000000-0000-4000-8000-000000000001","reasonConditionId":"00000000-0000-4000-8000-000000000001","codeConceptId":"00000000-0000-4000-8000-000000000001","categoryConceptId":"00000000-0000-4000-8000-000000000001","category":{},"basedOnNoteIds":["valor-ejemplo"],"statusConceptId":"00000000-0000-4000-8000-000000000001","priorityConceptId":"00000000-0000-4000-8000-000000000001","requesterProfileId":"00000000-0000-4000-8000-000000000001","performerSelectionConceptId":"00000000-0000-4000-8000-000000000001","performerPractitionerProfileId":"00000000-0000-4000-8000-000000000001","suggestedPracticeSiteId":"00000000-0000-4000-8000-000000000001","suggestedPracticeSiteName":"Nombre de ejemplo","suggestedCareSpace":{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo"},"createdAt":"2026-07-31T12:00:00.000Z","previousDiagnosticReportId":"00000000-0000-4000-8000-000000000001","duplicateOverrideReason":"Texto descriptivo de ejemplo"}]` |
| `orders[].id` | Sí | `string` | formato `uuid` | Identificador de la orden. | `00000000-0000-4000-8000-000000000001` |
| `orders[].patientProfileId` | Sí | `string` | formato `uuid` | Paciente al que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `orders[].encounterId` | No | `string` | formato `uuid` | Encuentro en el que se pidió, si se pidió durante uno. | `00000000-0000-4000-8000-000000000001` |
| `orders[].formInstanceId` | No | `string` | formato `uuid` | P43: instancia del formulario médico de la que salió la orden, si salió de uno. | `00000000-0000-4000-8000-000000000001` |
| `orders[].reasonConditionId` | No | `string` | formato `uuid` | v4295: diagnóstico que el estudio se pidió para confirmar, descartar o seguir; ausente si no lo declara. | `00000000-0000-4000-8000-000000000001` |
| `orders[].codeConceptId` | Sí | `string` | formato `uuid` | Qué se pidió (concept id). | `00000000-0000-4000-8000-000000000001` |
| `orders[].categoryConceptId` | No | `string` | formato `uuid` | Laboratorio o imagenología (concept id). | `00000000-0000-4000-8000-000000000001` |
| `orders[].category` | No | `object` | Sin restricción adicional declarada | P40: categoría de análisis derivada del concepto; ausente = sin clasificar. | `{}` |
| `orders[].basedOnNoteIds` | Sí | `array<string>` | formato `uuid` | P40: notas médicas que motivan la orden, en el orden en que se citaron. | `["valor-ejemplo"]` |
| `orders[].statusConceptId` | Sí | `string` | formato `uuid` | Estado de la orden (concept id). | `00000000-0000-4000-8000-000000000001` |
| `orders[].priorityConceptId` | No | `string` | formato `uuid` | Prioridad (concept id). | `00000000-0000-4000-8000-000000000001` |
| `orders[].requesterProfileId` | No | `string` | formato `uuid` | Profesional que la solicitó. | `00000000-0000-4000-8000-000000000001` |
| `orders[].performerSelectionConceptId` | Sí | `string` | formato `uuid`; admite null | Modo de ejecutor recomendado (concept id); `null` en una orden anterior a ese dato. | `00000000-0000-4000-8000-000000000001` |
| `orders[].performerPractitionerProfileId` | Sí | `string` | formato `uuid`; admite null | Médico ejecutor («lo hago yo»), o `null`. | `00000000-0000-4000-8000-000000000001` |
| `orders[].suggestedPracticeSiteId` | Sí | `string` | formato `uuid`; admite null | Sede sugerida, o `null`. | `00000000-0000-4000-8000-000000000001` |
| `orders[].suggestedPracticeSiteName` | Sí | `string` | admite null | Nombre de la sede sugerida, o `null`. | `Nombre de ejemplo` |
| `orders[].suggestedCareSpace` | No | `object` | admite null | Punto de toma sugerido (F5b) | `{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo"}` |
| `orders[].suggestedCareSpace.id` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `orders[].suggestedCareSpace.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `orders[].suggestedCareSpace.name` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `orders[].createdAt` | Sí | `string` | formato `date-time` | Cuándo se pidió. | `2026-07-31T12:00:00.000Z` |
| `orders[].previousDiagnosticReportId` | No | `string` | formato `uuid` | El informe previo que satisface este pedido (antiduplicación, v4.2.17). Presente cuando el médico eligió reutilizar o repetir un estudio duplicado; `undefined` en cualquier otro caso. | `00000000-0000-4000-8000-000000000001` |
| `orders[].duplicateOverrideReason` | No | `string` | Sin restricción adicional declarada | Justificación del médico si repitió un estudio duplicado (antiduplicación). | `Texto descriptivo de ejemplo` |
| `reports` | Sí | `array<DiagnosticReportSummaryDto>` | Sin restricción adicional declarada | Informes diagnósticos, de la más nueva a la más vieja. | `[{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","serviceRequestId":"00000000-0000-4000-8000-000000000001","encounterId":"00000000-0000-4000-8000-000000000001","codeConceptId":"00000000-0000-4000-8000-000000000001","categoryConceptId":"00000000-0000-4000-8000-000000000001","lifecycleStatusConceptId":"00000000-0000-4000-8000-000000000001","currentVersionId":"00000000-0000-4000-8000-000000000001","currentReleasedVersionId":"00000000-0000-4000-8000-000000000001","resultReleaseStatusConceptId":"00000000-0000-4000-8000-000000000001","releasedVersionId":"00000000-0000-4000-8000-000000000001","patientVisibility":{},"createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `reports[].id` | Sí | `string` | formato `uuid` | Identificador del informe. | `00000000-0000-4000-8000-000000000001` |
| `reports[].patientProfileId` | Sí | `string` | formato `uuid` | Paciente al que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `reports[].serviceRequestId` | No | `string` | formato `uuid` | Orden que lo originó, si cuelga de una. | `00000000-0000-4000-8000-000000000001` |
| `reports[].encounterId` | No | `string` | formato `uuid` | Encuentro asociado, si lo hay. | `00000000-0000-4000-8000-000000000001` |
| `reports[].codeConceptId` | Sí | `string` | formato `uuid` | Qué informa (concept id). | `00000000-0000-4000-8000-000000000001` |
| `reports[].categoryConceptId` | No | `string` | formato `uuid` | Categoría (concept id). | `00000000-0000-4000-8000-000000000001` |
| `reports[].lifecycleStatusConceptId` | Sí | `string` | formato `uuid` | Estado del ciclo de vida (concept id). | `00000000-0000-4000-8000-000000000001` |
| `reports[].currentVersionId` | No | `string` | formato `uuid` | Versión vigente, esté liberada o no. | `00000000-0000-4000-8000-000000000001` |
| `reports[].currentReleasedVersionId` | No | `string` | formato `uuid` | Versión liberada al paciente, si alguna lo está. | `00000000-0000-4000-8000-000000000001` |
| `reports[].resultReleaseStatusConceptId` | No | `string` | formato `uuid` | Estado de liberación de resultados (concept id). | `00000000-0000-4000-8000-000000000001` |
| `reports[].releasedVersionId` | Sí | `string` | formato `uuid`; admite null | Released version whose patient visibility `patientVisibility` reports. | `00000000-0000-4000-8000-000000000001` |
| `reports[].patientVisibility` | Sí | `object` | Sin restricción adicional declarada | Latest release event of that version: `HELD` means the requester still has to release it (`POST /diagnostics/reports/:id/patient-release`). | `{}` |
| `reports[].createdAt` | Sí | `string` | formato `date-time` | Cuándo se emitió. | `2026-07-31T12:00:00.000Z` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a cada bloque. | `1` |
| `truncated` | Sí | `array<string>` | Sin restricción adicional declarada | Bloques que quedaron recortados por el tope. | `["valor-ejemplo"]` |

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
  "path": "/diagnostics/patients/{patientProfileId}/orders"
}
```

---

## 36. GET /diagnostics/patients/{patientProfileId}/reports/{reportId}

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-orders`
- **Nombre:** Resultado liberado de un informe del paciente
- **Operation ID:** `DiagnosticsOrdersController_getReleasedResult`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsOrdersController.getReleasedResult](../../src/modules/diagnostics/controllers/diagnostics-orders.controller.ts)

### Descripción de negocio

Valores con unidad, rango de referencia e interpretación, conclusión, fecha de liberación y archivos de la versión liberada vigente. Un informe sin liberar responde 404.

Contexto declarado en el controlador: El resultado liberado de un informe del paciente: valores, conclusión y archivos. Misma puerta que la lista de órdenes (`ClinicalRecordAccessGuard`, 403 sin acceso a la historia) y mismo alcance de lectura: pasada la puerta, lo que la lista no mostraría (inexistente, de otro paciente u organización, fuera del alcance) o sin versión liberada responde el mismo 404.

### Descripción del sistema

NestJS resuelve `GET /diagnostics/patients/{patientProfileId}/reports/{reportId}` en `DiagnosticsOrdersController_getReleasedResult`. El controlador delega en `DiagnosticsPractitionerResultsService.getReleasedResult`. No recibe body. El tipo de retorno estático es `Promise<PractitionerDiagnosticResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reportId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/patients/00000000-0000-4000-8000-000000000001/reports/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `patientProfileId`, `reportId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostics/patients/00000000-0000-4000-8000-000000000001/reports/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PractitionerDiagnosticResultDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<PractitionerDiagnosticResultDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PractitionerDiagnosticResultDto>` | No |
| 403 | Sin acceso a la historia | `Promise<PractitionerDiagnosticResultDto>` | No |
| 404 | No existe, no es de ese paciente u organización, o no está liberado | `Promise<PractitionerDiagnosticResultDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PractitionerDiagnosticResultDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PractitionerDiagnosticResultDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<PractitionerDiagnosticResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PractitionerDiagnosticResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reportId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "codeDisplay": "CODIGO_EJEMPLO",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "clinicalStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "issuedAt": "2026-07-31T12:00:00.000Z",
  "releasedAt": "2026-07-31T12:00:00.000Z",
  "patientVisible": true,
  "conclusionText": "valor-ejemplo",
  "values": [
    {
      "observationId": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "value": "valor-ejemplo",
      "valueKind": "QUANTITY",
      "valueConceptId": "00000000-0000-4000-8000-000000000001",
      "unitConceptId": "00000000-0000-4000-8000-000000000001",
      "unit": "valor-ejemplo",
      "referenceRange": {
        "low": "valor-ejemplo",
        "high": "valor-ejemplo",
        "text": "valor-ejemplo",
        "unitConceptId": "00000000-0000-4000-8000-000000000001",
        "unit": "valor-ejemplo"
      },
      "interpretationConceptId": "00000000-0000-4000-8000-000000000001",
      "interpretationCode": "CODIGO_EJEMPLO",
      "interpretation": "valor-ejemplo",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "effectiveAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "files": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fileId": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "contentRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "presentationFormatConceptId": "00000000-0000-4000-8000-000000000001",
      "ordinal": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reportId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `codeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `codeDisplay` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `categoryConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `clinicalStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `issuedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `releasedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `patientVisible` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `conclusionText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `values` | Sí | `array<DiagnosticResultValueDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"observationId":"00000000-0000-4000-8000-000000000001","codeConceptId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","value":"valor-ejemplo","valueKind":"QUANTITY","valueConceptId":"00000000-0000-4000-8000-000000000001","unitConceptId":"00000000-0000-4000-8000-000000000001","unit":"valor-ejemplo","referenceRange":{"low":"valor-ejemplo","high":"valor-ejemplo","text":"valor-ejemplo","unitConceptId":"00000000-0000-4000-8000-000000000001","unit":"valor-ejemplo"},"interpretationConceptId":"00000000-0000-4000-8000-000000000001","interpretationCode":"CODIGO_EJEMPLO","interpretation":"valor-ejemplo","statusConceptId":"00000000-0000-4000-8000-000000000001","effectiveAt":"2026-07-31T12:00:00.000Z"}]` |
| `values[].observationId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `values[].codeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `values[].name` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `values[].value` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `values[].valueKind` | Sí | `string` | valores: `QUANTITY`, `DECIMAL`, `INTEGER`, `TEXT`, `BOOLEAN`, `CONCEPT`, `DATETIME`, `DATE`; admite null | Sin descripción específica en el contrato OpenAPI. | `QUANTITY` |
| `values[].valueConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `values[].unitConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `values[].unit` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `values[].referenceRange` | Sí | `DiagnosticResultReferenceRangeDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"low":"valor-ejemplo","high":"valor-ejemplo","text":"valor-ejemplo","unitConceptId":"00000000-0000-4000-8000-000000000001","unit":"valor-ejemplo"}` |
| `values[].referenceRange.low` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `values[].referenceRange.high` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `values[].referenceRange.text` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `values[].referenceRange.unitConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `values[].referenceRange.unit` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `values[].interpretationConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `values[].interpretationCode` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `values[].interpretation` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `values[].statusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `values[].effectiveAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `files` | Sí | `array<DiagnosticResultFileSummaryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","contentRoleConceptId":"00000000-0000-4000-8000-000000000001","presentationFormatConceptId":"00000000-0000-4000-8000-000000000001","ordinal":1}]` |
| `files[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].fileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].name` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `files[].contentRoleConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].presentationFormatConceptId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].ordinal` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |

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
  "path": "/diagnostics/patients/{patientProfileId}/reports/{reportId}"
}
```

---

## 37. GET /diagnostics/patients/{patientProfileId}/reports/{reportId}/files/{fileId}/content

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-orders`
- **Nombre:** Descargar un archivo del resultado liberado
- **Operation ID:** `DiagnosticsOrdersController_getReleasedResultFileContent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsOrdersController.getReleasedResultFileContent](../../src/modules/diagnostics/controllers/diagnostics-orders.controller.ts)

### Descripción de negocio

Autoriza por acceso a la historia, alcance de lectura, informe liberado del paciente y archivo de esa versión. Todo lo demás responde 404.

Contexto declarado en el controlador: Los bytes de un archivo del resultado liberado.

### Descripción del sistema

NestJS resuelve `GET /diagnostics/patients/{patientProfileId}/reports/{reportId}/files/{fileId}/content` en `DiagnosticsOrdersController_getReleasedResultFileContent`. El controlador delega en `DiagnosticsPractitionerResultsService.getReleasedResultFileContent`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reportId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `fileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/patients/00000000-0000-4000-8000-000000000001/reports/00000000-0000-4000-8000-000000000001/files/00000000-0000-4000-8000-000000000001/content HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `patientProfileId`, `reportId`, `fileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostics/patients/00000000-0000-4000-8000-000000000001/reports/00000000-0000-4000-8000-000000000001/files/00000000-0000-4000-8000-000000000001/content HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Bytes del archivo | `Promise<void>` | No |
| 400 | Consulta completada correctamente. | `Promise<void>` | No |
| 401 | Consulta completada correctamente. | `Promise<void>` | No |
| 403 | Sin acceso a la historia | `Promise<void>` | No |
| 404 | El informe no está disponible o el archivo no cuelga de su versión liberada | `Promise<void>` | No |
| 429 | Consulta completada correctamente. | `Promise<void>` | No |
| 500 | Consulta completada correctamente. | `Promise<void>` | No |
| 504 | Consulta completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | La descarga de archivos no está disponible | Excepción explícita en src/modules/diagnostics/services/diagnostics-practitioner-results.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/patients/{patientProfileId}/reports/{reportId}/files/{fileId}/content"
}
```

---

## 38. POST /diagnostics/report-drafts

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-report-drafts`
- **Nombre:** Abrir (u obtener) el borrador del informe de una orden
- **Operation ID:** `DiagnosticsReportDraftsController_open`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportDraftsController.open](../../src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts)

### Descripción de negocio

Abrir (u obtener) el borrador del informe de una orden. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/report-drafts` en `DiagnosticsReportDraftsController_open`. El controlador delega en `ReportDraftsService.open`. Valida el body como `CreateReportDraftDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReportDraftDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateReportDraftDto`; los campos opcionales se omiten.

```http
POST /diagnostics/report-drafts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "serviceRequestId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `serviceRequestId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/report-drafts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "serviceRequestId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReportDraftDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "status": "DRAFT",
  "body": {
    "clave": "valor"
  },
  "conclusionText": "valor-ejemplo",
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "patientVisibility": {},
  "rowVersion": 1,
  "diagnosticReportId": "00000000-0000-4000-8000-000000000001",
  "publishedVersionId": "00000000-0000-4000-8000-000000000001",
  "officialFileId": "00000000-0000-4000-8000-000000000001",
  "publishedAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "files": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fileId": "00000000-0000-4000-8000-000000000001",
      "role": {},
      "ordinal": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | valores: `DRAFT`, `PUBLISHED` | Sin descripción específica en el contrato OpenAPI. | `DRAFT` |
| `body` | Sí | `object` | Sin restricción adicional declarada | `{ version: 1, blocks: Block[] }` with heading, paragraph and list blocks. | `{"clave":"valor"}` |
| `conclusionText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `signerProfileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientVisibility` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof REPORT_PATIENT_VISIBILITIES)[number] | `{}` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `diagnosticReportId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `publishedVersionId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `officialFileId` | Sí | `string` | formato `uuid`; admite null | File id of the official PDF; null until published. | `00000000-0000-4000-8000-000000000001` |
| `publishedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `files` | Sí | `array<ReportDraftFileDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","role":{},"ordinal":1}]` |
| `files[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].fileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].role` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof REPORT_DRAFT_FILE_ROLES)[number] | `{}` |
| `files[].ordinal` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/diagnostics/report-drafts"
}
```

---

## 39. GET /diagnostics/report-drafts/{id}

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-report-drafts`
- **Nombre:** Borrador del informe
- **Operation ID:** `DiagnosticsReportDraftsController_get`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportDraftsController.get](../../src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts)

### Descripción de negocio

Borrador del informe. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /diagnostics/report-drafts/{id}` en `DiagnosticsReportDraftsController_get`. El controlador delega en `ReportDraftsService.get`. No recibe body. El tipo de retorno estático es `Promise<ReportDraftDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/report-drafts/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostics/report-drafts/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ReportDraftDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ReportDraftDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ReportDraftDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ReportDraftDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ReportDraftDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ReportDraftDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ReportDraftDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReportDraftDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "status": "DRAFT",
  "body": {
    "clave": "valor"
  },
  "conclusionText": "valor-ejemplo",
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "patientVisibility": {},
  "rowVersion": 1,
  "diagnosticReportId": "00000000-0000-4000-8000-000000000001",
  "publishedVersionId": "00000000-0000-4000-8000-000000000001",
  "officialFileId": "00000000-0000-4000-8000-000000000001",
  "publishedAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "files": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fileId": "00000000-0000-4000-8000-000000000001",
      "role": {},
      "ordinal": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | valores: `DRAFT`, `PUBLISHED` | Sin descripción específica en el contrato OpenAPI. | `DRAFT` |
| `body` | Sí | `object` | Sin restricción adicional declarada | `{ version: 1, blocks: Block[] }` with heading, paragraph and list blocks. | `{"clave":"valor"}` |
| `conclusionText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `signerProfileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientVisibility` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof REPORT_PATIENT_VISIBILITIES)[number] | `{}` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `diagnosticReportId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `publishedVersionId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `officialFileId` | Sí | `string` | formato `uuid`; admite null | File id of the official PDF; null until published. | `00000000-0000-4000-8000-000000000001` |
| `publishedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `files` | Sí | `array<ReportDraftFileDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","role":{},"ordinal":1}]` |
| `files[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].fileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].role` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof REPORT_DRAFT_FILE_ROLES)[number] | `{}` |
| `files[].ordinal` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

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
  "path": "/diagnostics/report-drafts/{id}"
}
```

---

## 40. PUT /diagnostics/report-drafts/{id}

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-report-drafts`
- **Nombre:** Guardar el borrador (409 si cambió o ya se publicó)
- **Operation ID:** `DiagnosticsReportDraftsController_update`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportDraftsController.update](../../src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts)

### Descripción de negocio

Guardar el borrador (409 si cambió o ya se publicó). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /diagnostics/report-drafts/{id}` en `DiagnosticsReportDraftsController_update`. El controlador delega en `ReportDraftsService.update`. Valida el body como `UpdateReportDraftDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReportDraftDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateReportDraftDto`; los campos opcionales se omiten.

```http
PUT /diagnostics/report-drafts/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "rowVersion": 1,
  "body": {
    "clave": "valor"
  },
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "patientVisibility": "VISIBLE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `rowVersion` | Sí | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `body` | Sí | `object` | Sin restricción adicional declarada | `{ version: 1, blocks: Block[] }` | `{"clave":"valor"}` |
| `signerProfileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientVisibility` | Sí | `string` | valores: `VISIBLE`, `HELD` | Sin descripción específica en el contrato OpenAPI. | `VISIBLE` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /diagnostics/report-drafts/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "rowVersion": 1,
  "body": {
    "clave": "valor"
  },
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "patientVisibility": "VISIBLE"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReportDraftDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "status": "DRAFT",
  "body": {
    "clave": "valor"
  },
  "conclusionText": "valor-ejemplo",
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "patientVisibility": {},
  "rowVersion": 1,
  "diagnosticReportId": "00000000-0000-4000-8000-000000000001",
  "publishedVersionId": "00000000-0000-4000-8000-000000000001",
  "officialFileId": "00000000-0000-4000-8000-000000000001",
  "publishedAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "files": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fileId": "00000000-0000-4000-8000-000000000001",
      "role": {},
      "ordinal": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | valores: `DRAFT`, `PUBLISHED` | Sin descripción específica en el contrato OpenAPI. | `DRAFT` |
| `body` | Sí | `object` | Sin restricción adicional declarada | `{ version: 1, blocks: Block[] }` with heading, paragraph and list blocks. | `{"clave":"valor"}` |
| `conclusionText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `signerProfileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientVisibility` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof REPORT_PATIENT_VISIBILITIES)[number] | `{}` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `diagnosticReportId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `publishedVersionId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `officialFileId` | Sí | `string` | formato `uuid`; admite null | File id of the official PDF; null until published. | `00000000-0000-4000-8000-000000000001` |
| `publishedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `files` | Sí | `array<ReportDraftFileDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","role":{},"ordinal":1}]` |
| `files[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].fileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].role` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof REPORT_DRAFT_FILE_ROLES)[number] | `{}` |
| `files[].ordinal` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El firmante elegido no está entre los profesionales de la organización | Excepción explícita en src/modules/diagnostics/services/report-signers.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/report-drafts/{id}"
}
```

---

## 41. POST /diagnostics/report-drafts/{id}/files

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-report-drafts`
- **Nombre:** Adjuntar documento, audio o anexo al borrador
- **Operation ID:** `DiagnosticsReportDraftsController_attachFile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportDraftsController.attachFile](../../src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts)

### Descripción de negocio

Adjuntar documento, audio o anexo al borrador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/report-drafts/{id}/files` en `DiagnosticsReportDraftsController_attachFile`. El controlador delega en `ReportDraftsService.attachFile`. Valida el body como `AttachReportDraftFileDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReportDraftDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AttachReportDraftFileDto`; los campos opcionales se omiten.

```http
POST /diagnostics/report-drafts/00000000-0000-4000-8000-000000000001/files HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fileId": "00000000-0000-4000-8000-000000000001",
  "role": "DOCUMENT"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `role` | Sí | `string` | valores: `DOCUMENT`, `AUDIO`, `ANNEX` | Sin descripción específica en el contrato OpenAPI. | `DOCUMENT` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/report-drafts/00000000-0000-4000-8000-000000000001/files HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fileId": "00000000-0000-4000-8000-000000000001",
  "role": "DOCUMENT"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReportDraftDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReportDraftDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "status": "DRAFT",
  "body": {
    "clave": "valor"
  },
  "conclusionText": "valor-ejemplo",
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "patientVisibility": {},
  "rowVersion": 1,
  "diagnosticReportId": "00000000-0000-4000-8000-000000000001",
  "publishedVersionId": "00000000-0000-4000-8000-000000000001",
  "officialFileId": "00000000-0000-4000-8000-000000000001",
  "publishedAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "files": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fileId": "00000000-0000-4000-8000-000000000001",
      "role": {},
      "ordinal": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | valores: `DRAFT`, `PUBLISHED` | Sin descripción específica en el contrato OpenAPI. | `DRAFT` |
| `body` | Sí | `object` | Sin restricción adicional declarada | `{ version: 1, blocks: Block[] }` with heading, paragraph and list blocks. | `{"clave":"valor"}` |
| `conclusionText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `signerProfileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientVisibility` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof REPORT_PATIENT_VISIBILITIES)[number] | `{}` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `diagnosticReportId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `publishedVersionId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `officialFileId` | Sí | `string` | formato `uuid`; admite null | File id of the official PDF; null until published. | `00000000-0000-4000-8000-000000000001` |
| `publishedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `files` | Sí | `array<ReportDraftFileDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","role":{},"ordinal":1}]` |
| `files[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].fileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].role` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof REPORT_DRAFT_FILE_ROLES)[number] | `{}` |
| `files[].ordinal` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El archivo ya está en el borrador | Excepción explícita en src/modules/diagnostics/services/report-drafts.service.ts |
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
  "path": "/diagnostics/report-drafts/{id}/files"
}
```

---

## 42. DELETE /diagnostics/report-drafts/{id}/files/{draftFileId}

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-report-drafts`
- **Nombre:** Quitar un archivo del borrador
- **Operation ID:** `DiagnosticsReportDraftsController_removeFile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportDraftsController.removeFile](../../src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts)

### Descripción de negocio

Quitar un archivo del borrador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `DELETE /diagnostics/report-drafts/{id}/files/{draftFileId}` en `DiagnosticsReportDraftsController_removeFile`. El controlador delega en `ReportDraftsService.removeFile`. No recibe body. El tipo de retorno estático es `Promise<ReportDraftDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `draftFileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /diagnostics/report-drafts/00000000-0000-4000-8000-000000000001/files/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`, `draftFileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /diagnostics/report-drafts/00000000-0000-4000-8000-000000000001/files/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ReportDraftDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReportDraftDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "status": "DRAFT",
  "body": {
    "clave": "valor"
  },
  "conclusionText": "valor-ejemplo",
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "patientVisibility": {},
  "rowVersion": 1,
  "diagnosticReportId": "00000000-0000-4000-8000-000000000001",
  "publishedVersionId": "00000000-0000-4000-8000-000000000001",
  "officialFileId": "00000000-0000-4000-8000-000000000001",
  "publishedAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "files": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fileId": "00000000-0000-4000-8000-000000000001",
      "role": {},
      "ordinal": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | valores: `DRAFT`, `PUBLISHED` | Sin descripción específica en el contrato OpenAPI. | `DRAFT` |
| `body` | Sí | `object` | Sin restricción adicional declarada | `{ version: 1, blocks: Block[] }` with heading, paragraph and list blocks. | `{"clave":"valor"}` |
| `conclusionText` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `signerProfileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientVisibility` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof REPORT_PATIENT_VISIBILITIES)[number] | `{}` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `diagnosticReportId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `publishedVersionId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `officialFileId` | Sí | `string` | formato `uuid`; admite null | File id of the official PDF; null until published. | `00000000-0000-4000-8000-000000000001` |
| `publishedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `files` | Sí | `array<ReportDraftFileDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","role":{},"ordinal":1}]` |
| `files[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].fileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `files[].role` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof REPORT_DRAFT_FILE_ROLES)[number] | `{}` |
| `files[].ordinal` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

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
  "path": "/diagnostics/report-drafts/{id}/files/{draftFileId}"
}
```

---

## 43. POST /diagnostics/report-drafts/{id}/preview

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-report-drafts`
- **Nombre:** Vista previa en PDF con marca de agua «BORRADOR»
- **Operation ID:** `DiagnosticsReportPublishController_preview`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportPublishController.preview](../../src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts)

### Descripción de negocio

Vista previa en PDF con marca de agua «BORRADOR». Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/report-drafts/{id}/preview` en `DiagnosticsReportPublishController_preview`. El controlador delega en `ReportPublishService.preview`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /diagnostics/report-drafts/00000000-0000-4000-8000-000000000001/preview HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /diagnostics/report-drafts/00000000-0000-4000-8000-000000000001/preview HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | application/pdf | `Promise<void>` | No |
| 400 | Operación completada correctamente. | `Promise<void>` | No |
| 401 | Operación completada correctamente. | `Promise<void>` | No |
| 403 | Operación completada correctamente. | `Promise<void>` | No |
| 404 | Operación completada correctamente. | `Promise<void>` | No |
| 409 | Operación completada correctamente. | `Promise<void>` | No |
| 422 | Operación completada correctamente. | `Promise<void>` | No |
| 429 | Operación completada correctamente. | `Promise<void>` | No |
| 500 | Operación completada correctamente. | `Promise<void>` | No |
| 504 | Operación completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/report-drafts/{id}/preview"
}
```

---

## 44. POST /diagnostics/report-drafts/{id}/publish

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-report-drafts`
- **Nombre:** Publicar el informe: versión inmutable, PDF oficial y liberación
- **Operation ID:** `DiagnosticsReportPublishController_publish`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportPublishController.publish](../../src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts)

### Descripción de negocio

Publicar el informe: versión inmutable, PDF oficial y liberación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/report-drafts/{id}/publish` en `DiagnosticsReportPublishController_publish`. El controlador delega en `ReportPublishService.publish`. Valida el body como `PublishReportDraftDto` y consume `application/json`. El tipo de retorno estático es `Promise<PublishedReportDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishReportDraftDto`; los campos opcionales se omiten.

```http
POST /diagnostics/report-drafts/00000000-0000-4000-8000-000000000001/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "rowVersion": 1,
  "confirmIrreversible": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `rowVersion` | Sí | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `confirmIrreversible` | Sí | `boolean` | valores: `true` | Sin descripción específica en el contrato OpenAPI. | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/report-drafts/00000000-0000-4000-8000-000000000001/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "rowVersion": 1,
  "confirmIrreversible": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublishedReportDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PublishedReportDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PublishedReportDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PublishedReportDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PublishedReportDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PublishedReportDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PublishedReportDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PublishedReportDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PublishedReportDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PublishedReportDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PublishedReportDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublishedReportDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reportId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "officialFileId": "00000000-0000-4000-8000-000000000001",
  "status": "PUBLISHED",
  "patientVisibility": {}
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reportId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `officialFileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | valores: `PUBLISHED` | Sin descripción específica en el contrato OpenAPI. | `PUBLISHED` |
| `patientVisibility` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof REPORT_PATIENT_VISIBILITIES)[number] | `{}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Para publicar hacen falta un firmante y el texto del informe | Excepción explícita en src/modules/diagnostics/services/report-publish.service.ts |
| 422 | `PRECONDITION_FAILED` | El firmante elegido no está entre los profesionales de la organización | Excepción explícita en src/modules/diagnostics/services/report-signers.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | El artefacto generado no tiene contenido | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | El artefacto generado excede el tamaño máximo permitido | Excepción explícita en src/modules/common/services/file-upload.service.ts |
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
  "path": "/diagnostics/report-drafts/{id}/publish"
}
```

---

## 45. POST /diagnostics/report-drafts/{id}/signature-request

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-report-drafts`
- **Nombre:** Pedir al firmante elegido que revise y publique con su firma
- **Operation ID:** `DiagnosticsReportPublishController_requestSignature`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportPublishController.requestSignature](../../src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts)

### Descripción de negocio

Solo el firmante publica con su propia firma (403 REPORT_SIGNER_MUST_PUBLISH para cualquier otro); quien prepara el borrador le avisa con esta ruta.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/report-drafts/{id}/signature-request` en `DiagnosticsReportPublishController_requestSignature`. El controlador delega en `ReportPublishService.requestSignature`. No recibe body. El tipo de retorno estático es `Promise<{ readonly requested: true }>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /diagnostics/report-drafts/00000000-0000-4000-8000-000000000001/signature-request HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /diagnostics/report-drafts/00000000-0000-4000-8000-000000000001/signature-request HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<{ readonly requested: true }>` | No |
| 400 | Operación completada correctamente. | `Promise<{ readonly requested: true }>` | No |
| 401 | Operación completada correctamente. | `Promise<{ readonly requested: true }>` | No |
| 403 | Operación completada correctamente. | `Promise<{ readonly requested: true }>` | No |
| 404 | Operación completada correctamente. | `Promise<{ readonly requested: true }>` | No |
| 409 | Operación completada correctamente. | `Promise<{ readonly requested: true }>` | No |
| 422 | Operación completada correctamente. | `Promise<{ readonly requested: true }>` | No |
| 429 | Operación completada correctamente. | `Promise<{ readonly requested: true }>` | No |
| 500 | Operación completada correctamente. | `Promise<{ readonly requested: true }>` | No |
| 504 | Operación completada correctamente. | `Promise<{ readonly requested: true }>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ readonly requested: true }`. Ejemplo completo derivado de ese DTO:

```json
{
  "requested": {}
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `requested` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: true | `{}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | Para pedir la firma hacen falta un firmante y el texto del informe | Excepción explícita en src/modules/diagnostics/services/report-publish.service.ts |
| 422 | `PRECONDITION_FAILED` | El firmante elegido no está entre los profesionales de la organización | Excepción explícita en src/modules/diagnostics/services/report-signers.service.ts |
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
  "path": "/diagnostics/report-drafts/{id}/signature-request"
}
```

---

## 46. GET /diagnostics/report-drafts/signers

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-report-drafts`
- **Nombre:** Profesionales que pueden firmar informes
- **Operation ID:** `DiagnosticsReportDraftsController_listSigners`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportDraftsController.listSigners](../../src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts)

### Descripción de negocio

Profesionales que pueden firmar informes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Declared before `:id`, so `signers` is never parsed as an id.

### Descripción del sistema

NestJS resuelve `GET /diagnostics/report-drafts/signers` en `DiagnosticsReportDraftsController_listSigners`. El controlador delega en `ReportSignersService.list`, `EntityManager.fork`. No recibe body. El tipo de retorno estático es `Promise<ReportSignerListDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/report-drafts/signers HTTP/1.1
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
GET /diagnostics/report-drafts/signers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReportSignerListDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ReportSignerListDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ReportSignerListDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ReportSignerListDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ReportSignerListDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ReportSignerListDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ReportSignerListDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReportSignerListDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "profileId": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "registration": "valor-ejemplo",
      "hasSignature": true,
      "hasSeal": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ReportSignerDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"profileId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","registration":"valor-ejemplo","hasSignature":true,"hasSeal":true}]` |
| `items[].profileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].registration` | Sí | `string` | admite null | National registration (matrícula), if declared. | `valor-ejemplo` |
| `items[].hasSignature` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].hasSeal` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

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
  "path": "/diagnostics/report-drafts/signers"
}
```

---

## 47. GET /diagnostics/report-issuer-settings

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-report-drafts`
- **Nombre:** Firma, sello y responsable de los informes
- **Operation ID:** `DiagnosticsReportReleaseController_getSettings`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportReleaseController.getSettings](../../src/modules/diagnostics/controllers/diagnostics-report-release.controller.ts)

### Descripción de negocio

Firma, sello y responsable de los informes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /diagnostics/report-issuer-settings` en `DiagnosticsReportReleaseController_getSettings`. El controlador delega en `ReportIssuerSettingsService.get`. No recibe body. El tipo de retorno estático es `Promise<ReportIssuerSettingsDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/report-issuer-settings HTTP/1.1
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
GET /diagnostics/report-issuer-settings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReportIssuerSettingsDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "signatureFileId": "00000000-0000-4000-8000-000000000001",
  "sealFileId": "00000000-0000-4000-8000-000000000001",
  "responsibleName": "Nombre de ejemplo",
  "responsibleTitle": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `signatureFileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sealFileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `responsibleName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `responsibleTitle` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere pertenecer a la organización, o ser administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/report-issuer-settings"
}
```

---

## 48. PUT /diagnostics/report-issuer-settings

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-report-drafts`
- **Nombre:** Cambiar firma, sello y responsable (OWNER/ADMIN)
- **Operation ID:** `DiagnosticsReportReleaseController_setSettings`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportReleaseController.setSettings](../../src/modules/diagnostics/controllers/diagnostics-report-release.controller.ts)

### Descripción de negocio

Cambiar firma, sello y responsable (OWNER/ADMIN). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /diagnostics/report-issuer-settings` en `DiagnosticsReportReleaseController_setSettings`. El controlador delega en `ReportIssuerSettingsService.set`. Valida el body como `UpdateReportIssuerSettingsDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReportIssuerSettingsDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateReportIssuerSettingsDto`; los campos opcionales se omiten.

```http
PUT /diagnostics/report-issuer-settings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "signatureFileId": "00000000-0000-4000-8000-000000000001",
  "sealFileId": "00000000-0000-4000-8000-000000000001",
  "responsibleName": "Nombre de ejemplo",
  "responsibleTitle": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `signatureFileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sealFileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `responsibleName` | Sí | `string` | longitud máxima 120; admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `responsibleTitle` | Sí | `string` | longitud máxima 120; admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /diagnostics/report-issuer-settings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "signatureFileId": "00000000-0000-4000-8000-000000000001",
  "sealFileId": "00000000-0000-4000-8000-000000000001",
  "responsibleName": "Nombre de ejemplo",
  "responsibleTitle": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ReportIssuerSettingsDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReportIssuerSettingsDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "signatureFileId": "00000000-0000-4000-8000-000000000001",
  "sealFileId": "00000000-0000-4000-8000-000000000001",
  "responsibleName": "Nombre de ejemplo",
  "responsibleTitle": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `signatureFileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sealFileId` | Sí | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `responsibleName` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `responsibleTitle` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma | Excepción explícita en src/modules/directory/services/tenant-administration.service.ts |
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
  "path": "/diagnostics/report-issuer-settings"
}
```

---

## 49. POST /diagnostics/reports/{reportId}/patient-release

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-report-drafts`
- **Nombre:** Liberar al paciente un resultado retenido
- **Operation ID:** `DiagnosticsReportReleaseController_releaseToPatient`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportReleaseController.releaseToPatient](../../src/modules/diagnostics/controllers/diagnostics-report-release.controller.ts)

### Descripción de negocio

Liberar al paciente un resultado retenido. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/reports/{reportId}/patient-release` en `DiagnosticsReportReleaseController_releaseToPatient`. El controlador delega en `ReportReleaseService.releaseToPatient`. No recibe body. El tipo de retorno estático es `Promise<PatientReleaseResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `reportId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /diagnostics/reports/00000000-0000-4000-8000-000000000001/patient-release HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `reportId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /diagnostics/reports/00000000-0000-4000-8000-000000000001/patient-release HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PatientReleaseResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PatientReleaseResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PatientReleaseResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PatientReleaseResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PatientReleaseResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PatientReleaseResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PatientReleaseResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PatientReleaseResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PatientReleaseResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PatientReleaseResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientReleaseResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reportId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "patientVisibility": "VISIBLE"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reportId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientVisibility` | Sí | `string` | valores: `VISIBLE` | Sin descripción específica en el contrato OpenAPI. | `VISIBLE` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 409 | `CONFLICT` | El resultado ya está visible para el paciente | Excepción explícita en src/modules/diagnostics/services/report-release.service.ts |
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
  "path": "/diagnostics/reports/{reportId}/patient-release"
}
```

---

## 50. POST /diagnostics/reports/{reportId}/versions

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-reports`
- **Nombre:** Crear/enmendar versión de informe diagnóstico
- **Operation ID:** `DiagnosticsReportsController_createVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportsController.createVersion](../../src/modules/diagnostics/controllers/diagnostics-reports.controller.ts)

### Descripción de negocio

Crear/enmendar versión de informe diagnóstico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/reports/{reportId}/versions` en `DiagnosticsReportsController_createVersion`. El controlador delega en `ReportImmutabilityService.assertWritable`, `DiagnosticsReportsService.createReportVersion`. Valida el body como `CreateReportVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `reportId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateReportVersionDto`; los campos opcionales se omiten.

```http
POST /diagnostics/reports/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `reportId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `custodianTenantId` | No | `string` | formato `uuid` | Tenant custodio (por defecto el del token) | `00000000-0000-4000-8000-000000000001` |
| `conclusionText` | No | `string` | longitud máxima 20000 | Conclusión clínica | `valor-ejemplo` |
| `authorProfileId` | No | `string` | formato `uuid` | Autor (profesional validador) | `00000000-0000-4000-8000-000000000001` |
| `supersedesVersionId` | No | `string` | formato `uuid` | Versión previa que enmienda | `00000000-0000-4000-8000-000000000001` |
| `amendmentReasonConceptId` | No | `string` | formato `uuid` | Motivo de enmienda (concept id) | `00000000-0000-4000-8000-000000000001` |
| `amendmentReasonText` | No | `string` | longitud máxima 2000 | Texto del motivo de enmienda | `Texto descriptivo de ejemplo` |
| `results` | No | `array<ReportResultItemDto>` | Sin restricción adicional declarada | Observaciones enlazadas | `[{"observationId":"00000000-0000-4000-8000-000000000001","resultRoleConceptId":"00000000-0000-4000-8000-000000000001","ordinal":1}]` |
| `results[].observationId` | No | `string` | formato `uuid` | Observación enlazada | `00000000-0000-4000-8000-000000000001` |
| `results[].resultRoleConceptId` | No | `string` | formato `uuid` | Rol del resultado (concept id) | `00000000-0000-4000-8000-000000000001` |
| `results[].ordinal` | No | `number` | mínimo 0 | Orden dentro del informe | `1` |
| `files` | No | `array<ReportFileItemDto>` | Sin restricción adicional declarada | Archivos adjuntos | `[{"fileId":"00000000-0000-4000-8000-000000000001","contentRoleConceptId":"00000000-0000-4000-8000-000000000001","ordinal":1}]` |
| `files[].fileId` | No | `string` | formato `uuid` | Archivo (common.files) | `00000000-0000-4000-8000-000000000001` |
| `files[].contentRoleConceptId` | No | `string` | formato `uuid` | Rol del contenido (concept id) | `00000000-0000-4000-8000-000000000001` |
| `files[].ordinal` | No | `number` | mínimo 0 | Orden | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/reports/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "conclusionText": "valor-ejemplo",
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "supersedesVersionId": "00000000-0000-4000-8000-000000000001",
  "amendmentReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "amendmentReasonText": "Texto descriptivo de ejemplo",
  "results": [
    {
      "observationId": "00000000-0000-4000-8000-000000000001",
      "resultRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "ordinal": 1
    }
  ],
  "files": [
    {
      "fileId": "00000000-0000-4000-8000-000000000001",
      "contentRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "ordinal": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La versión que se enmienda no existe en este informe | Excepción explícita en src/modules/diagnostics/services/diagnostics-reports.service.ts |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostics/services/diagnostics-scope.service.ts |
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
  "path": "/diagnostics/reports/{reportId}/versions"
}
```

---

## 51. POST /diagnostics/reports/{reportId}/versions/{versionId}/release

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-reports`
- **Nombre:** Validar y liberar una versión del informe
- **Operation ID:** `DiagnosticsReportsController_releaseVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportsController.releaseVersion](../../src/modules/diagnostics/controllers/diagnostics-reports.controller.ts)

### Descripción de negocio

Validar y liberar una versión del informe. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/reports/{reportId}/versions/{versionId}/release` en `DiagnosticsReportsController_releaseVersion`. El controlador delega en `ReportImmutabilityService.assertWritable`, `DiagnosticsReportsService.releaseVersion`. Valida el body como `ReleaseReportVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `reportId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReleaseReportVersionDto`; los campos opcionales se omiten.

```http
POST /diagnostics/reports/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000001/release HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `reportId`, `versionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientVisibility` | No | `string` | valores: `VISIBLE`, `HIDDEN` | Visibilidad al paciente | `VISIBLE` |
| `reasonConceptId` | No | `string` | formato `uuid` | Motivo (concept id) | `00000000-0000-4000-8000-000000000001` |
| `policyVersion` | No | `string` | longitud máxima 120 | Versión de la política aplicada | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/reports/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000001/release HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientVisibility": "VISIBLE",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001",
  "policyVersion": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión de informe no encontrada | Excepción explícita en src/modules/diagnostics/services/diagnostics-reports.service.ts |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostics/services/diagnostics-scope.service.ts |
| 409 | `CONFLICT` | La versión ya fue liberada | Excepción explícita en src/modules/diagnostics/services/diagnostics-reports.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La versión no es elegible para liberación | Excepción explícita en src/modules/diagnostics/services/diagnostics-reports.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/reports/{reportId}/versions/{versionId}/release"
}
```

---

## 52. POST /diagnostics/results/{observationId}/verifications

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-laboratory`
- **Nombre:** Verificar (técnica/facultativa) un resultado
- **Operation ID:** `DiagnosticsLabController_verifyResult`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabController.verifyResult](../../src/modules/diagnostics/controllers/diagnostics-lab.controller.ts)

### Descripción de negocio

Verificar (técnica/facultativa) un resultado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/results/{observationId}/verifications` en `DiagnosticsLabController_verifyResult`. El controlador delega en `DiagnosticsLabService.verifyResult`. Valida el body como `VerifyResultDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `observationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VerifyResultDto`; los campos opcionales se omiten.

```http
POST /diagnostics/results/00000000-0000-4000-8000-000000000001/verifications HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "level": "TECHNICAL",
  "verifiedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `observationId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `level` | Sí | `string` | valores: `TECHNICAL`, `MEDICAL` | Nivel de verificación | `TECHNICAL` |
| `verifiedByProfileId` | Sí | `string` | formato `uuid` | Profesional que verifica | `00000000-0000-4000-8000-000000000001` |
| `custodianTenantId` | No | `string` | formato `uuid` | Tenant custodio (por defecto el del token) | `00000000-0000-4000-8000-000000000001` |
| `resultConceptId` | No | `string` | formato `uuid` | Resultado de la verificación (concept id) | `00000000-0000-4000-8000-000000000001` |
| `previousVerificationId` | No | `string` | formato `uuid` | Verificación previa que se encadena | `00000000-0000-4000-8000-000000000001` |
| `verificationComment` | No | `string` | longitud máxima 2000 | Comentario de la verificación | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/results/00000000-0000-4000-8000-000000000001/verifications HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "level": "TECHNICAL",
  "verifiedByProfileId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "resultConceptId": "00000000-0000-4000-8000-000000000001",
  "previousVerificationId": "00000000-0000-4000-8000-000000000001",
  "verificationComment": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostics/services/diagnostics-scope.service.ts |
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
  "path": "/diagnostics/results/{observationId}/verifications"
}
```

---

## 53. GET /diagnostics/service-requests/{id}

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-reception`
- **Nombre:** Detalle de una orden dirigida al tenant activo
- **Operation ID:** `DiagnosticsReceptionController_getServiceRequest`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReceptionController.getServiceRequest](../../src/modules/diagnostics/controllers/diagnostics-reception.controller.ts)

### Descripción de negocio

Detalle de una orden dirigida al tenant activo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Una orden del ejecutor con su detalle. Una orden de otro ejecutor o inexistente: 404 (no se distinguen).

### Descripción del sistema

NestJS resuelve `GET /diagnostics/service-requests/{id}` en `DiagnosticsReceptionController_getServiceRequest`. El controlador delega en `DiagnosticsWorklistService.getById`. No recibe body. El tipo de retorno estático es `Promise<WorklistItemDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/service-requests/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostics/service-requests/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<WorklistItemDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<WorklistItemDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<WorklistItemDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<WorklistItemDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<WorklistItemDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<WorklistItemDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<WorklistItemDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<WorklistItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WorklistItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "state": {},
  "scope": {}
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `state` | Sí | `object` | Sin restricción adicional declarada | Derivado, no guardado: PENDING (sin acesión ni estudio), RECEIVED (acesión, muestra recibida o estudio de imagen), IN_PROCESS (orden de trabajo abierta; en imagen, informe en curso), REPORTED (informe liberado), CANCELLED (revocada o satisfecha por informe previo) | `{}` |
| `scope` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof WORKLIST_SCOPES)[number] | `{}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Orden no encontrada | Excepción explícita en src/modules/diagnostics/services/diagnostics-worklist.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/service-requests/{id}"
}
```

---

## 54. POST /diagnostics/service-requests/inbox

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-reception`
- **Nombre:** Bandeja de órdenes de laboratorio por recibir
- **Operation ID:** `DiagnosticsReceptionController_listInbox`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReceptionController.listInbox](../../src/modules/diagnostics/controllers/diagnostics-reception.controller.ts)

### Descripción de negocio

Órdenes vigentes de laboratorio o anatomía patológica derivadas al laboratorio del tenant activo (`performer_tenant_id`) y todavía sin acesión, con las muestras ya recibidas. De la más vieja a la más nueva. Filtros en el cuerpo: la búsqueda por paciente no viaja en la URL.

Contexto declarado en el controlador: Bandeja de recepción, paginada por cursor. `POST` y no `GET`: la búsqueda por paciente es PHI y no viaja en la URL.

### Descripción del sistema

NestJS resuelve `POST /diagnostics/service-requests/inbox` en `DiagnosticsReceptionController_listInbox`. El controlador delega en `DiagnosticsReceptionService.listInbox`. Valida el body como `LabInboxQueryDto` y consume `application/json`. El tipo de retorno estático es `Promise<LabInboxPageDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LabInboxQueryDto`; los campos opcionales se omiten.

```http
POST /diagnostics/service-requests/inbox HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `cursor` | No | `string` | longitud máxima 512 | Cursor opaco devuelto por la página anterior (`nextCursor`) | `valor-ejemplo` |
| `limit` | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en el contrato OpenAPI. | `25` |
| `patientQuery` | No | `string` | longitud mínima 2; longitud máxima 80 | Nombre o código del paciente (sin distinguir mayúsculas ni tildes) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/service-requests/inbox HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "cursor": "valor-ejemplo",
  "limit": 25,
  "patientQuery": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LabInboxPageDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LabInboxPageDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LabInboxPageDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LabInboxPageDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LabInboxPageDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LabInboxPageDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LabInboxPageDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LabInboxPageDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LabInboxPageDto>` | No |
| 504 | Operación completada correctamente. | `Promise<LabInboxPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LabInboxPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "serviceRequestId": "00000000-0000-4000-8000-000000000001",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "patientDisplayName": "Nombre de ejemplo",
      "patientCode": "CODIGO_EJEMPLO",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "codeDisplay": "CODIGO_EJEMPLO",
      "categoryConceptId": "00000000-0000-4000-8000-000000000001",
      "priorityConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "requesterProfileId": "00000000-0000-4000-8000-000000000001",
      "requestingTenantId": "00000000-0000-4000-8000-000000000001",
      "requestingTenantName": "Nombre de ejemplo",
      "requestedAt": "2026-07-31T12:00:00.000Z",
      "requisitionId": "00000000-0000-4000-8000-000000000001",
      "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "specimenTypeDisplay": "valor-ejemplo",
      "components": [
        {
          "conceptId": "00000000-0000-4000-8000-000000000001",
          "display": "valor-ejemplo",
          "ordinal": 1
        }
      ],
      "componentsSpecified": true,
      "imaging": {
        "modalityConceptId": "00000000-0000-4000-8000-000000000001",
        "modalityDisplay": "valor-ejemplo",
        "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
        "bodySiteDisplay": "valor-ejemplo",
        "lateralityConceptId": "00000000-0000-4000-8000-000000000001",
        "lateralityDisplay": "valor-ejemplo",
        "contrastConceptId": "00000000-0000-4000-8000-000000000001",
        "contrastDisplay": "valor-ejemplo",
        "bodyStructureUberon": "valor-ejemplo",
        "bodyMeshId": "00000000-0000-4000-8000-000000000001",
        "boneTypeConceptId": "00000000-0000-4000-8000-000000000001",
        "boneTypeDisplay": "valor-ejemplo"
      },
      "summary": "valor-ejemplo",
      "specimens": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "patientProfileId": "00000000-0000-4000-8000-000000000001",
          "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001",
          "statusConceptId": "00000000-0000-4000-8000-000000000001",
          "collectedAt": "2026-07-31T12:00:00.000Z",
          "receivedAt": "2026-07-31T12:00:00.000Z",
          "containers": [
            {
              "id": "00000000-0000-4000-8000-000000000001",
              "containerIdentifier": "valor-ejemplo",
              "containerTypeConceptId": "00000000-0000-4000-8000-000000000001",
              "statusConceptId": "00000000-0000-4000-8000-000000000001"
            }
          ],
          "custodyEvents": [
            {
              "id": "00000000-0000-4000-8000-000000000001",
              "specimenContainerId": "00000000-0000-4000-8000-000000000001",
              "custodyEventTypeConceptId": "00000000-0000-4000-8000-000000000001",
              "occurredAt": "2026-07-31T12:00:00.000Z",
              "fromPartyTypeConceptId": "00000000-0000-4000-8000-000000000001",
              "toPartyTypeConceptId": "00000000-0000-4000-8000-000000000001",
              "sealIdentifier": "valor-ejemplo",
              "signedByUserId": "00000000-0000-4000-8000-000000000001"
            }
          ]
        }
      ]
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<LabInboxItemDto>` | Sin restricción adicional declarada | Las órdenes de la página, de la más vieja a la más nueva. | `[{"serviceRequestId":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","patientDisplayName":"Nombre de ejemplo","patientCode":"CODIGO_EJEMPLO","codeConceptId":"00000000-0000-4000-8000-000000000001","codeDisplay":"CODIGO_EJEMPLO","categoryConceptId":"00000000-0000-4000-8000-000000000001","priorityConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","requesterProfileId":"00000000-0000-4000-8000-000000000001","requestingTenantId":"00000000-0000-4000-8000-000000000001","requestingTenantName":"Nombre de ejemplo","requestedAt":"2026-07-31T12:00:00.000Z","requisitionId":"00000000-0000-4000-8000-000000000001","specimenTypeConceptId":"00000000-0000-4000-8000-000000000001","specimenTypeDisplay":"valor-ejemplo","components":[{"conceptId":"00000000-0000-4000-8000-000000000001","display":"valor-ejemplo","ordinal":1}],"componentsSpecified":true,"imaging":{"modalityConceptId":"00000000-0000-4000-8000-000000000001","modalityDisplay":"valor-ejemplo","bodySiteConceptId":"00000000-0000-4000-8000-000000000001","bodySiteDisplay":"valor-ejemplo","lateralityConceptId":"00000000-0000-4000-8000-000000000001","lateralityDisplay":"valor-ejemplo","contrastConceptId":"00000000-0000-4000-8000-000000000001","contrastDisplay":"valor-ejemplo","bodyStructureUberon":"valor-ejemplo","bodyMeshId":"00000000-0000-4000-8000-000000000001","boneTypeConceptId":"00000000-0000-4000-8000-000000000001","boneTypeDisplay":"valor-ejemplo"},"summary":"valor-ejemplo","specimens":[{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","specimenTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","collectedAt":"2026-07-31T12:00:00.000Z","receivedAt":"2026-07-31T12:00:00.000Z","containers":[{"id":"00000000-0000-4000-8000-000000000001","containerIdentifier":"valor-ejemplo","containerTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001"}],"custodyEvents":[{"id":"00000000-0000-4000-8000-000000000001","specimenContainerId":"00000000-0000-4000-8000-000000000001","custodyEventTypeConceptId":"00000000-0000-4000-8000-000000000001","occurredAt":"2026-07-31T12:00:00.000Z","fromPartyTypeConceptId":"00000000-0000-4000-8000-000000000001","toPartyTypeConceptId":"00000000-0000-4000-8000-000000000001","sealIdentifier":"valor-ejemplo","signedByUserId":"00000000-0000-4000-8000-000000000001"}]}]}]` |
| `items[].serviceRequestId` | Sí | `string` | formato `uuid` | La orden de servicio (`clinical.service_requests`). | `00000000-0000-4000-8000-000000000001` |
| `items[].patientProfileId` | Sí | `string` | formato `uuid` | Paciente de la orden. | `00000000-0000-4000-8000-000000000001` |
| `items[].patientDisplayName` | Sí | `string` | admite null | Nombre pintable del paciente, si se conoce. | `Nombre de ejemplo` |
| `items[].patientCode` | Sí | `string` | admite null | Código de paciente (historia clínica), si se conoce. | `CODIGO_EJEMPLO` |
| `items[].codeConceptId` | Sí | `string` | formato `uuid` | Estudio pedido (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].codeDisplay` | Sí | `string` | admite null | Nombre del estudio pedido, del catálogo. | `CODIGO_EJEMPLO` |
| `items[].categoryConceptId` | Sí | `string` | formato `uuid`; admite null | Categoría de la orden (laboratorio o anatomía patológica). | `00000000-0000-4000-8000-000000000001` |
| `items[].priorityConceptId` | Sí | `string` | formato `uuid`; admite null | Prioridad de la orden (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Estado de la orden (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].requesterProfileId` | Sí | `string` | formato `uuid`; admite null | Profesional que pidió el estudio, si consta. | `00000000-0000-4000-8000-000000000001` |
| `items[].requestingTenantId` | Sí | `string` | formato `uuid` | Organización que emitió la orden (su custodio). | `00000000-0000-4000-8000-000000000001` |
| `items[].requestingTenantName` | Sí | `string` | admite null | Nombre de la organización que emitió la orden. | `Nombre de ejemplo` |
| `items[].requestedAt` | Sí | `string` | formato `date-time` | Cuándo se emitió la orden. | `2026-07-31T12:00:00.000Z` |
| `items[].requisitionId` | No | `string` | formato `uuid`; admite null | v4.2.82: requisición que agrupa los estudios pedidos juntos; `null` = alta individual. | `00000000-0000-4000-8000-000000000001` |
| `items[].specimenTypeConceptId` | No | `string` | formato `uuid`; admite null | v4.2.82: muestra pedida por el médico; `null` = no se indicó. | `00000000-0000-4000-8000-000000000001` |
| `items[].specimenTypeDisplay` | No | `string` | admite null | v4.2.82: nombre legible de la muestra pedida. | `valor-ejemplo` |
| `items[].components` | No | `array<ServiceRequestComponentDto>` | Sin restricción adicional declarada | v4.2.82: componentes marcados del panel, en el orden en que se marcaron. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","display":"valor-ejemplo","ordinal":1}]` |
| `items[].components[].conceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].components[].display` | No | `string` | Sin restricción adicional declarada | Nombre legible (castellano si existe) | `valor-ejemplo` |
| `items[].components[].ordinal` | No | `number` | Sin restricción adicional declarada | Posición, desde 1, en el orden en que se marcó | `1` |
| `items[].componentsSpecified` | No | `boolean` | Sin restricción adicional declarada | v4.2.82: `false` = orden sin detalle de componentes («estudio completo»). | `true` |
| `items[].imaging` | No | `ServiceRequestImagingDto` | Sin restricción adicional declarada | v4.2.82: modalidad, región, lateralidad y contraste; `null` si no es imagen o no los trae. | `{"modalityConceptId":"00000000-0000-4000-8000-000000000001","modalityDisplay":"valor-ejemplo","bodySiteConceptId":"00000000-0000-4000-8000-000000000001","bodySiteDisplay":"valor-ejemplo","lateralityConceptId":"00000000-0000-4000-8000-000000000001","lateralityDisplay":"valor-ejemplo","contrastConceptId":"00000000-0000-4000-8000-000000000001","contrastDisplay":"valor-ejemplo","bodyStructureUberon":"valor-ejemplo","bodyMeshId":"00000000-0000-4000-8000-000000000001","boneTypeConceptId":"00000000-0000-4000-8000-000000000001","boneTypeDisplay":"valor-ejemplo"}` |
| `items[].imaging.modalityConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].imaging.modalityDisplay` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].imaging.bodySiteConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].imaging.bodySiteDisplay` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].imaging.lateralityConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].imaging.lateralityDisplay` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].imaging.contrastConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].imaging.contrastDisplay` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].imaging.bodyStructureUberon` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].imaging.bodyMeshId` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].imaging.boneTypeConceptId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].imaging.boneTypeDisplay` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].summary` | No | `string` | Sin restricción adicional declarada | v4.2.82: resumen legible armado por el servidor, p. ej. «Hemograma · 3 componentes» o «Radiografía de mano · Mano · Izquierda · sin contraste». | `valor-ejemplo` |
| `items[].specimens` | Sí | `array<SpecimenDetailDto>` | Sin restricción adicional declarada | Muestras que este laboratorio ya recibió para la orden y todavía no acesionó, con sus contenedores y su cadena de custodia. Vacío mientras nadie recibió nada; un espécimen rechazado sigue acá con su estado, para que se vea por qué hace falta otra muestra. | `[{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","specimenTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","collectedAt":"2026-07-31T12:00:00.000Z","receivedAt":"2026-07-31T12:00:00.000Z","containers":[{"id":"00000000-0000-4000-8000-000000000001","containerIdentifier":"valor-ejemplo","containerTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001"}],"custodyEvents":[{"id":"00000000-0000-4000-8000-000000000001","specimenContainerId":"00000000-0000-4000-8000-000000000001","custodyEventTypeConceptId":"00000000-0000-4000-8000-000000000001","occurredAt":"2026-07-31T12:00:00.000Z","fromPartyTypeConceptId":"00000000-0000-4000-8000-000000000001","toPartyTypeConceptId":"00000000-0000-4000-8000-000000000001","sealIdentifier":"valor-ejemplo","signedByUserId":"00000000-0000-4000-8000-000000000001"}]}]` |
| `items[].specimens[].id` | Sí | `string` | formato `uuid` | Identificador del espécimen. | `00000000-0000-4000-8000-000000000001` |
| `items[].specimens[].patientProfileId` | Sí | `string` | formato `uuid` | Paciente dueño del espécimen. | `00000000-0000-4000-8000-000000000001` |
| `items[].specimens[].specimenTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de espécimen (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].specimens[].statusConceptId` | Sí | `string` | formato `uuid` | Estado del espécimen (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].specimens[].collectedAt` | No | `string` | formato `date-time` | Cuándo se recolectó, si ya ocurrió. | `2026-07-31T12:00:00.000Z` |
| `items[].specimens[].receivedAt` | No | `string` | formato `date-time` | Cuándo se recibió en el laboratorio, si ya ocurrió. | `2026-07-31T12:00:00.000Z` |
| `items[].specimens[].containers` | Sí | `array<SpecimenContainerDto>` | Sin restricción adicional declarada | Sus contenedores. | `[{"id":"00000000-0000-4000-8000-000000000001","containerIdentifier":"valor-ejemplo","containerTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].specimens[].containers[].id` | Sí | `string` | formato `uuid` | Identificador del contenedor. | `00000000-0000-4000-8000-000000000001` |
| `items[].specimens[].containers[].containerIdentifier` | Sí | `string` | Sin restricción adicional declarada | Identificador físico del contenedor (etiqueta/código). | `valor-ejemplo` |
| `items[].specimens[].containers[].containerTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de contenedor (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].specimens[].containers[].statusConceptId` | Sí | `string` | formato `uuid` | Estado del contenedor (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].specimens[].custodyEvents` | Sí | `array<SpecimenCustodyEventDto>` | Sin restricción adicional declarada | Su cadena de custodia, del evento más viejo al más nuevo. | `[{"id":"00000000-0000-4000-8000-000000000001","specimenContainerId":"00000000-0000-4000-8000-000000000001","custodyEventTypeConceptId":"00000000-0000-4000-8000-000000000001","occurredAt":"2026-07-31T12:00:00.000Z","fromPartyTypeConceptId":"00000000-0000-4000-8000-000000000001","toPartyTypeConceptId":"00000000-0000-4000-8000-000000000001","sealIdentifier":"valor-ejemplo","signedByUserId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].specimens[].custodyEvents[].id` | Sí | `string` | formato `uuid` | Identificador del evento. | `00000000-0000-4000-8000-000000000001` |
| `items[].specimens[].custodyEvents[].specimenContainerId` | No | `string` | formato `uuid` | Contenedor al que se refiere el traslado, si el evento fue de un contenedor. | `00000000-0000-4000-8000-000000000001` |
| `items[].specimens[].custodyEvents[].custodyEventTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de evento (concept id): recepción, traslado, almacenamiento, etc. | `00000000-0000-4000-8000-000000000001` |
| `items[].specimens[].custodyEvents[].occurredAt` | Sí | `string` | formato `date-time` | Cuándo ocurrió. | `2026-07-31T12:00:00.000Z` |
| `items[].specimens[].custodyEvents[].fromPartyTypeConceptId` | No | `string` | formato `uuid` | De qué tipo de parte salió (concept id), si se registró. | `00000000-0000-4000-8000-000000000001` |
| `items[].specimens[].custodyEvents[].toPartyTypeConceptId` | No | `string` | formato `uuid` | A qué tipo de parte llegó (concept id), si se registró. | `00000000-0000-4000-8000-000000000001` |
| `items[].specimens[].custodyEvents[].sealIdentifier` | No | `string` | Sin restricción adicional declarada | Sello de custodia, si se usó uno. | `valor-ejemplo` |
| `items[].specimens[].custodyEvents[].signedByUserId` | No | `string` | formato `uuid` | Quién firmó el evento. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas filas trae la página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | Sí | `string` | admite null | Cursor de la página siguiente, o `null` si no hay más. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/diagnostics/service-requests/inbox"
}
```

---

## 55. POST /diagnostics/service-requests/worklist

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-reception`
- **Nombre:** Bandeja del ejecutor: órdenes de laboratorio o imagen con estado derivado
- **Operation ID:** `DiagnosticsReceptionController_listWorklist`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReceptionController.listWorklist](../../src/modules/diagnostics/controllers/diagnostics-reception.controller.ts)

### Descripción de negocio

Órdenes derivadas al tenant activo (`performer_tenant_id`), de la más nueva a la más vieja, con `state` derivado (PENDING, RECEIVED, IN_PROCESS, REPORTED, CANCELLED) y el detalle pedido (muestra, componentes, modalidad/región/lateralidad/contraste y un `summary` legible). `scope` LAB incluye anatomía patológica.

Contexto declarado en el controlador: Bandeja del ejecutor (laboratorio o imagenología) con el estado derivado de datos reales y el detalle pedido. `POST` de lectura por la búsqueda de paciente (PHI).

### Descripción del sistema

NestJS resuelve `POST /diagnostics/service-requests/worklist` en `DiagnosticsReceptionController_listWorklist`. El controlador delega en `DiagnosticsWorklistService.list`. Valida el body como `WorklistQueryDto` y consume `application/json`. El tipo de retorno estático es `Promise<WorklistPageDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `WorklistQueryDto`; los campos opcionales se omiten.

```http
POST /diagnostics/service-requests/worklist HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "scope": "LAB"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `scope` | Sí | `string` | valores: `LAB`, `IMAGING` | Sin descripción específica en el contrato OpenAPI. | `LAB` |
| `states` | No | `array<string>` | máximo 5 elemento(s) | Estados derivados a incluir. Omitido = todos (PENDING, RECEIVED, IN_PROCESS, REPORTED, CANCELLED) | `["PENDING"]` |
| `cursor` | No | `string` | longitud máxima 512 | Cursor opaco (`nextCursor`) | `valor-ejemplo` |
| `limit` | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en el contrato OpenAPI. | `25` |
| `patientQuery` | No | `string` | longitud mínima 2; longitud máxima 80 | Nombre o código del paciente (sin tildes ni mayúsculas) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/service-requests/worklist HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "scope": "LAB",
  "states": [
    "PENDING"
  ],
  "cursor": "valor-ejemplo",
  "limit": 25,
  "patientQuery": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<WorklistPageDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WorklistPageDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WorklistPageDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WorklistPageDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WorklistPageDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WorklistPageDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WorklistPageDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WorklistPageDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WorklistPageDto>` | No |
| 504 | Operación completada correctamente. | `Promise<WorklistPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WorklistPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "state": {},
      "scope": {}
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<WorklistItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"state":{},"scope":{}}]` |
| `items[].state` | Sí | `object` | Sin restricción adicional declarada | Derivado, no guardado: PENDING (sin acesión ni estudio), RECEIVED (acesión, muestra recibida o estudio de imagen), IN_PROCESS (orden de trabajo abierta; en imagen, informe en curso), REPORTED (informe liberado), CANCELLED (revocada o satisfecha por informe previo) | `{}` |
| `items[].scope` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: (typeof WORKLIST_SCOPES)[number] | `{}` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `nextCursor` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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
  "path": "/diagnostics/service-requests/worklist"
}
```

---

## 56. POST /diagnostics/specimens

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-specimens`
- **Nombre:** Registrar un espécimen (soporte para acesión)
- **Operation ID:** `DiagnosticsSpecimensController_createSpecimen`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsSpecimensController.createSpecimen](../../src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts)

### Descripción de negocio

Registrar un espécimen (soporte para acesión). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Soporte: alta de espécimen.

### Descripción del sistema

NestJS resuelve `POST /diagnostics/specimens` en `DiagnosticsSpecimensController_createSpecimen`. El controlador delega en `DiagnosticsSpecimensService.createSpecimen`. Valida el body como `CreateSpecimenDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateSpecimenDto`; los campos opcionales se omiten.

```http
POST /diagnostics/specimens HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente dueño del espécimen | `00000000-0000-4000-8000-000000000001` |
| `custodianTenantId` | No | `string` | formato `uuid` | Tenant custodio: el del contexto (X-Tenant-Id). Si se envía y no coincide, responde 404 | `00000000-0000-4000-8000-000000000001` |
| `specimenTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de espécimen (concept id) | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | No | `string` | formato `uuid` | Orden clínica de origen | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `bodySiteConceptId` | No | `string` | formato `uuid` | Sitio anatómico (concept id) | `00000000-0000-4000-8000-000000000001` |
| `collectionMethodConceptId` | No | `string` | formato `uuid` | Método de recolección (concept id) | `00000000-0000-4000-8000-000000000001` |
| `collectorProfileId` | No | `string` | formato `uuid` | Profesional que recolecta | `00000000-0000-4000-8000-000000000001` |
| `collectionCareSpaceId` | No | `string` | formato `uuid` | Punto de toma (F5b) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/specimens HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "collectionMethodConceptId": "00000000-0000-4000-8000-000000000001",
  "collectorProfileId": "00000000-0000-4000-8000-000000000001",
  "collectionCareSpaceId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Espacio no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-specimens.service.ts |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostics/services/diagnostics-scope.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El espacio no es un punto de toma disponible | Excepción explícita en src/modules/diagnostics/services/diagnostics-specimens.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/specimens"
}
```

---

## 57. GET /diagnostics/specimens/{id}

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-specimens`
- **Nombre:** Detalle de un espécimen (con su cadena de custodia)
- **Operation ID:** `DiagnosticsSpecimensController_getSpecimen`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsSpecimensController.getSpecimen](../../src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts)

### Descripción de negocio

Acotado al tenant del contexto: otro laboratorio recibe 404.

Contexto declarado en el controlador: Lectura (CL-47): detalle de un espécimen con su cadena de custodia.

### Descripción del sistema

NestJS resuelve `GET /diagnostics/specimens/{id}` en `DiagnosticsSpecimensController_getSpecimen`. El controlador delega en `DiagnosticsSpecimensService.getSpecimen`. No recibe body. El tipo de retorno estático es `Promise<SpecimenDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/specimens/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostics/specimens/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SpecimenDetailDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SpecimenDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SpecimenDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SpecimenDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<SpecimenDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SpecimenDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SpecimenDetailDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<SpecimenDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SpecimenDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "collectedAt": "2026-07-31T12:00:00.000Z",
  "receivedAt": "2026-07-31T12:00:00.000Z",
  "containers": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "containerIdentifier": "valor-ejemplo",
      "containerTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "custodyEvents": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "specimenContainerId": "00000000-0000-4000-8000-000000000001",
      "custodyEventTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "occurredAt": "2026-07-31T12:00:00.000Z",
      "fromPartyTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "toPartyTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "sealIdentifier": "valor-ejemplo",
      "signedByUserId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del espécimen. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente dueño del espécimen. | `00000000-0000-4000-8000-000000000001` |
| `specimenTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de espécimen (concept id). | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Estado del espécimen (concept id). | `00000000-0000-4000-8000-000000000001` |
| `collectedAt` | No | `string` | formato `date-time` | Cuándo se recolectó, si ya ocurrió. | `2026-07-31T12:00:00.000Z` |
| `receivedAt` | No | `string` | formato `date-time` | Cuándo se recibió en el laboratorio, si ya ocurrió. | `2026-07-31T12:00:00.000Z` |
| `containers` | Sí | `array<SpecimenContainerDto>` | Sin restricción adicional declarada | Sus contenedores. | `[{"id":"00000000-0000-4000-8000-000000000001","containerIdentifier":"valor-ejemplo","containerTypeConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `containers[].id` | Sí | `string` | formato `uuid` | Identificador del contenedor. | `00000000-0000-4000-8000-000000000001` |
| `containers[].containerIdentifier` | Sí | `string` | Sin restricción adicional declarada | Identificador físico del contenedor (etiqueta/código). | `valor-ejemplo` |
| `containers[].containerTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de contenedor (concept id). | `00000000-0000-4000-8000-000000000001` |
| `containers[].statusConceptId` | Sí | `string` | formato `uuid` | Estado del contenedor (concept id). | `00000000-0000-4000-8000-000000000001` |
| `custodyEvents` | Sí | `array<SpecimenCustodyEventDto>` | Sin restricción adicional declarada | Su cadena de custodia, del evento más viejo al más nuevo. | `[{"id":"00000000-0000-4000-8000-000000000001","specimenContainerId":"00000000-0000-4000-8000-000000000001","custodyEventTypeConceptId":"00000000-0000-4000-8000-000000000001","occurredAt":"2026-07-31T12:00:00.000Z","fromPartyTypeConceptId":"00000000-0000-4000-8000-000000000001","toPartyTypeConceptId":"00000000-0000-4000-8000-000000000001","sealIdentifier":"valor-ejemplo","signedByUserId":"00000000-0000-4000-8000-000000000001"}]` |
| `custodyEvents[].id` | Sí | `string` | formato `uuid` | Identificador del evento. | `00000000-0000-4000-8000-000000000001` |
| `custodyEvents[].specimenContainerId` | No | `string` | formato `uuid` | Contenedor al que se refiere el traslado, si el evento fue de un contenedor. | `00000000-0000-4000-8000-000000000001` |
| `custodyEvents[].custodyEventTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de evento (concept id): recepción, traslado, almacenamiento, etc. | `00000000-0000-4000-8000-000000000001` |
| `custodyEvents[].occurredAt` | Sí | `string` | formato `date-time` | Cuándo ocurrió. | `2026-07-31T12:00:00.000Z` |
| `custodyEvents[].fromPartyTypeConceptId` | No | `string` | formato `uuid` | De qué tipo de parte salió (concept id), si se registró. | `00000000-0000-4000-8000-000000000001` |
| `custodyEvents[].toPartyTypeConceptId` | No | `string` | formato `uuid` | A qué tipo de parte llegó (concept id), si se registró. | `00000000-0000-4000-8000-000000000001` |
| `custodyEvents[].sealIdentifier` | No | `string` | Sin restricción adicional declarada | Sello de custodia, si se usó uno. | `valor-ejemplo` |
| `custodyEvents[].signedByUserId` | No | `string` | formato `uuid` | Quién firmó el evento. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Espécimen no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-specimens.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/specimens/{id}"
}
```

---

## 58. POST /diagnostics/specimens/{id}/containers

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-specimens`
- **Nombre:** Registrar un contenedor de espécimen (soporte para custodia)
- **Operation ID:** `DiagnosticsSpecimensController_createContainer`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsSpecimensController.createContainer](../../src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts)

### Descripción de negocio

Registrar un contenedor de espécimen (soporte para custodia). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Soporte: alta de contenedor.

### Descripción del sistema

NestJS resuelve `POST /diagnostics/specimens/{id}/containers` en `DiagnosticsSpecimensController_createContainer`. El controlador delega en `DiagnosticsSpecimensService.createContainer`. Valida el body como `CreateContainerDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateContainerDto`; los campos opcionales se omiten.

```http
POST /diagnostics/specimens/00000000-0000-4000-8000-000000000001/containers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "containerIdentifier": "valor-ejemplo",
  "containerTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `containerIdentifier` | Sí | `string` | longitud mínima 1; longitud máxima 120 | Identificador del contenedor | `valor-ejemplo` |
| `containerTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de contenedor (concept id) | `00000000-0000-4000-8000-000000000001` |
| `additiveConceptId` | No | `string` | formato `uuid` | Aditivo (concept id) | `00000000-0000-4000-8000-000000000001` |
| `parentContainerId` | No | `string` | formato `uuid` | Contenedor padre | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/specimens/00000000-0000-4000-8000-000000000001/containers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "containerIdentifier": "valor-ejemplo",
  "containerTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "additiveConceptId": "00000000-0000-4000-8000-000000000001",
  "parentContainerId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contenedor no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-specimens.service.ts |
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
  "path": "/diagnostics/specimens/{id}/containers"
}
```

---

## 59. POST /diagnostics/specimens/{id}/rejection

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-specimens`
- **Nombre:** Rechazar espécimen y solicitar recolección
- **Operation ID:** `DiagnosticsSpecimensController_reject`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsSpecimensController.reject](../../src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts)

### Descripción de negocio

Rechazar espécimen y solicitar recolección. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/specimens/{id}/rejection` en `DiagnosticsSpecimensController_reject`. El controlador delega en `DiagnosticsSpecimensService.reject`. Valida el body como `RejectSpecimenDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RejectSpecimenDto`; los campos opcionales se omiten.

```http
POST /diagnostics/specimens/00000000-0000-4000-8000-000000000001/rejection HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "rejectionReasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `rejectionReasonConceptId` | Sí | `string` | formato `uuid` | Motivo de rechazo (concept id) | `00000000-0000-4000-8000-000000000001` |
| `notes` | No | `string` | longitud máxima 2000 | Notas del rechazo | `Texto descriptivo de ejemplo` |
| `recollectionRequired` | No | `boolean` | Sin restricción adicional declarada | ¿Requiere nueva recolección? | `true` |
| `recollectionServiceRequestId` | No | `string` | formato `uuid` | Nueva orden de recolección | `00000000-0000-4000-8000-000000000001` |
| `rejectedByProfileId` | No | `string` | formato `uuid` | Profesional que rechaza | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/specimens/00000000-0000-4000-8000-000000000001/rejection HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "rejectionReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "notes": "Texto descriptivo de ejemplo",
  "recollectionRequired": true,
  "recollectionServiceRequestId": "00000000-0000-4000-8000-000000000001",
  "rejectedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResourceCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id del recurso creado | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del recurso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostics/services/diagnostics-scope.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El espécimen ya está rechazado | Excepción explícita en src/modules/diagnostics/services/diagnostics-specimens.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/diagnostics/specimens/{id}/rejection"
}
```

---

## 60. GET /diagnostics/work-orders

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-laboratory`
- **Nombre:** Listar las órdenes de trabajo del laboratorio
- **Operation ID:** `DiagnosticsLabController_listWorkOrders`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabController.listWorkOrders](../../src/modules/diagnostics/controllers/diagnostics-lab.controller.ts)

### Descripción de negocio

Acotado siempre al tenant del contexto.

Contexto declarado en el controlador: Cola de trabajo del laboratorio. `diagnostics` no tenía ninguna lectura: la orden creada sólo existía en la respuesta de su propio POST, así que nadie podía consultar qué quedaba pendiente.

### Descripción del sistema

NestJS resuelve `GET /diagnostics/work-orders` en `DiagnosticsLabController_listWorkOrders`. El controlador delega en `DiagnosticsLabService.listWorkOrders`. No recibe body. El tipo de retorno estático es `Promise<WorkOrderSummaryDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `laboratoryAccessionId` | query | No | `string` | formato `uuid` | Accesión de laboratorio | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | query | No | `string` | formato `uuid` | Estado de la orden | `00000000-0000-4000-8000-000000000001` |
| `assignedProfileId` | query | No | `string` | formato `uuid` | Profesional asignado | `00000000-0000-4000-8000-000000000001` |
| `collectionCareSpaceId` | query | No | `string` | formato `uuid` | Punto de toma (F5b) | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `offset` | query | No | `number` | mínimo 0 | Sin descripción específica en OpenAPI. | `0` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /diagnostics/work-orders HTTP/1.1
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
GET /diagnostics/work-orders?laboratoryAccessionId=00000000-0000-4000-8000-000000000001&statusConceptId=00000000-0000-4000-8000-000000000001&assignedProfileId=00000000-0000-4000-8000-000000000001&collectionCareSpaceId=00000000-0000-4000-8000-000000000001&limit=50&offset=0 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<WorkOrderSummaryDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<WorkOrderSummaryDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<WorkOrderSummaryDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<WorkOrderSummaryDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<WorkOrderSummaryDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<WorkOrderSummaryDto[]>` | No |
| 504 | Consulta completada correctamente. | `Promise<WorkOrderSummaryDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WorkOrderSummaryDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "workOrderNumber": "valor-ejemplo",
    "laboratoryAccessionId": "00000000-0000-4000-8000-000000000001",
    "statusConceptId": "00000000-0000-4000-8000-000000000001",
    "priorityConceptId": "00000000-0000-4000-8000-000000000001",
    "assignedProfileId": "00000000-0000-4000-8000-000000000001",
    "scheduledAt": "2026-07-31T12:00:00.000Z",
    "completedAt": "2026-07-31T12:00:00.000Z",
    "collectionPoint": {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo"
    }
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
  "path": "/diagnostics/work-orders"
}
```

---

## 61. POST /diagnostics/work-orders

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-laboratory`
- **Nombre:** Abrir orden de trabajo y desglosar pruebas
- **Operation ID:** `DiagnosticsLabController_createWorkOrder`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsLabController.createWorkOrder](../../src/modules/diagnostics/controllers/diagnostics-lab.controller.ts)

### Descripción de negocio

Abrir orden de trabajo y desglosar pruebas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/work-orders` en `DiagnosticsLabController_createWorkOrder`. El controlador delega en `DiagnosticsLabService.createWorkOrder`. Valida el body como `CreateWorkOrderDto` y consume `application/json`. El tipo de retorno estático es `Promise<WorkOrderCreatedDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateWorkOrderDto`; los campos opcionales se omiten.

```http
POST /diagnostics/work-orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "laboratoryAccessionId": "00000000-0000-4000-8000-000000000001",
  "tests": [
    {
      "serviceRequestId": "00000000-0000-4000-8000-000000000001",
      "testCodeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `laboratoryAccessionId` | Sí | `string` | formato `uuid` | Acesión de laboratorio en estado recibido | `00000000-0000-4000-8000-000000000001` |
| `custodianTenantId` | No | `string` | formato `uuid` | Tenant custodio (por defecto el del token) | `00000000-0000-4000-8000-000000000001` |
| `workOrderNumber` | No | `string` | longitud máxima 120 | Nº de orden (se genera si se omite) | `valor-ejemplo` |
| `priorityConceptId` | No | `string` | formato `uuid` | Prioridad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `assignedLaboratoryUnitId` | No | `string` | formato `uuid` | Unidad de laboratorio asignada | `00000000-0000-4000-8000-000000000001` |
| `tests` | Sí | `array<WorkOrderTestItemDto>` | Sin restricción adicional declarada | Pruebas a desglosar | `[{"serviceRequestId":"00000000-0000-4000-8000-000000000001","testCodeConceptId":"00000000-0000-4000-8000-000000000001","specimenId":"00000000-0000-4000-8000-000000000001","methodConceptId":"00000000-0000-4000-8000-000000000001","analyzerDeviceId":"00000000-0000-4000-8000-000000000001"}]` |
| `tests[].serviceRequestId` | Sí | `string` | formato `uuid` | Orden clínica que solicita la prueba | `00000000-0000-4000-8000-000000000001` |
| `tests[].testCodeConceptId` | Sí | `string` | formato `uuid` | Código de prueba (concept id) | `00000000-0000-4000-8000-000000000001` |
| `tests[].specimenId` | No | `string` | formato `uuid` | Espécimen sobre el que se corre | `00000000-0000-4000-8000-000000000001` |
| `tests[].methodConceptId` | No | `string` | formato `uuid` | Método (concept id) | `00000000-0000-4000-8000-000000000001` |
| `tests[].analyzerDeviceId` | No | `string` | formato `uuid` | Analizador asignado (device id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostics/work-orders HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "laboratoryAccessionId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "workOrderNumber": "valor-ejemplo",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "assignedLaboratoryUnitId": "00000000-0000-4000-8000-000000000001",
  "tests": [
    {
      "serviceRequestId": "00000000-0000-4000-8000-000000000001",
      "testCodeConceptId": "00000000-0000-4000-8000-000000000001",
      "specimenId": "00000000-0000-4000-8000-000000000001",
      "methodConceptId": "00000000-0000-4000-8000-000000000001",
      "analyzerDeviceId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<WorkOrderCreatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WorkOrderCreatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WorkOrderCreatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WorkOrderCreatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WorkOrderCreatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WorkOrderCreatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WorkOrderCreatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WorkOrderCreatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WorkOrderCreatedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<WorkOrderCreatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WorkOrderCreatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "testIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `testIds` | Sí | `array<string>` | formato `uuid` | Ids de las pruebas creadas | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostics/services/diagnostics-scope.service.ts |
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
  "path": "/diagnostics/work-orders"
}
```

---

## 62. POST /dicomweb/studies

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-imaging`
- **Nombre:** Ingestar estudio DICOM (STOW-RS) y ubicaciones de objeto
- **Operation ID:** `DiagnosticsImagingController_storeStudy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsImagingController.storeStudy](../../src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts)

### Descripción de negocio

Ingestar estudio DICOM (STOW-RS) y ubicaciones de objeto. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /dicomweb/studies` en `DiagnosticsImagingController_storeStudy`. El controlador delega en `DiagnosticsImagingService.storeStudy`. Valida el body como `StoreImagingStudyDto` y consume `application/json`. El tipo de retorno estático es `Promise<ImagingStudyStoredDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `StoreImagingStudyDto`; los campos opcionales se omiten.

```http
POST /dicomweb/studies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "imagingEndpointId": "00000000-0000-4000-8000-000000000001",
  "dicomStudyInstanceUid": "00000000-0000-4000-8000-000000000001",
  "series": [
    {
      "dicomSeriesInstanceUid": "00000000-0000-4000-8000-000000000001"
    }
  ]
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente del estudio | `00000000-0000-4000-8000-000000000001` |
| `imagingEndpointId` | Sí | `string` | formato `uuid` | Endpoint DICOM activo | `00000000-0000-4000-8000-000000000001` |
| `dicomStudyInstanceUid` | Sí | `string` | longitud máxima 200 | DICOM Study Instance UID | `00000000-0000-4000-8000-000000000001` |
| `custodianTenantId` | No | `string` | formato `uuid` | Tenant custodio (por defecto el del token) | `00000000-0000-4000-8000-000000000001` |
| `accessionNumber` | No | `string` | longitud máxima 120 | Nº de acesión del estudio | `valor-ejemplo` |
| `encounterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `series` | Sí | `array<StowSeriesDto>` | Sin restricción adicional declarada | Series del estudio | `[{"dicomSeriesInstanceUid":"00000000-0000-4000-8000-000000000001","modalityConceptId":"00000000-0000-4000-8000-000000000001","seriesNumber":1,"instances":[{"dicomSopInstanceUid":"00000000-0000-4000-8000-000000000001","sopClassConceptId":"00000000-0000-4000-8000-000000000001","instanceNumber":1,"retrievalUri":"valor-ejemplo","storageBackendId":"00000000-0000-4000-8000-000000000001","objectKey":"valor-ejemplo","contentHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","sizeBytes":"valor-ejemplo"}]}]` |
| `series[].dicomSeriesInstanceUid` | Sí | `string` | longitud máxima 200 | DICOM Series Instance UID | `00000000-0000-4000-8000-000000000001` |
| `series[].modalityConceptId` | No | `string` | formato `uuid` | Modalidad de la serie (concept id) | `00000000-0000-4000-8000-000000000001` |
| `series[].seriesNumber` | No | `number` | mínimo 0 | Nº de serie | `1` |
| `series[].instances` | No | `array<StowInstanceDto>` | Sin restricción adicional declarada | Instancias SOP de la serie | `[{"dicomSopInstanceUid":"00000000-0000-4000-8000-000000000001","sopClassConceptId":"00000000-0000-4000-8000-000000000001","instanceNumber":1,"retrievalUri":"valor-ejemplo","storageBackendId":"00000000-0000-4000-8000-000000000001","objectKey":"valor-ejemplo","contentHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","sizeBytes":"valor-ejemplo"}]` |
| `series[].instances[].dicomSopInstanceUid` | No | `string` | longitud máxima 200 | DICOM SOP Instance UID | `00000000-0000-4000-8000-000000000001` |
| `series[].instances[].sopClassConceptId` | No | `string` | formato `uuid` | SOP Class (concept id) | `00000000-0000-4000-8000-000000000001` |
| `series[].instances[].instanceNumber` | No | `number` | mínimo 0 | Nº de instancia | `1` |
| `series[].instances[].retrievalUri` | No | `string` | longitud máxima 2000 | URI de recuperación | `valor-ejemplo` |
| `series[].instances[].storageBackendId` | No | `string` | formato `uuid` | Backend de almacenamiento del objeto binario | `00000000-0000-4000-8000-000000000001` |
| `series[].instances[].objectKey` | No | `string` | longitud máxima 2000 | Object key en el backend (requerido si hay backend) | `valor-ejemplo` |
| `series[].instances[].contentHash` | No | `string` | longitud máxima 200 | Hash del contenido del objeto | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `series[].instances[].sizeBytes` | No | `string` | longitud máxima 40 | Tamaño en bytes | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /dicomweb/studies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "imagingEndpointId": "00000000-0000-4000-8000-000000000001",
  "dicomStudyInstanceUid": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "accessionNumber": "valor-ejemplo",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "series": [
    {
      "dicomSeriesInstanceUid": "00000000-0000-4000-8000-000000000001",
      "modalityConceptId": "00000000-0000-4000-8000-000000000001",
      "seriesNumber": 1,
      "instances": [
        {
          "dicomSopInstanceUid": "00000000-0000-4000-8000-000000000001",
          "sopClassConceptId": "00000000-0000-4000-8000-000000000001",
          "instanceNumber": 1,
          "retrievalUri": "valor-ejemplo",
          "storageBackendId": "00000000-0000-4000-8000-000000000001",
          "objectKey": "valor-ejemplo",
          "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "sizeBytes": "valor-ejemplo"
        }
      ]
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ImagingStudyStoredDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ImagingStudyStoredDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ImagingStudyStoredDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ImagingStudyStoredDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ImagingStudyStoredDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ImagingStudyStoredDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ImagingStudyStoredDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ImagingStudyStoredDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ImagingStudyStoredDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ImagingStudyStoredDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ImagingStudyStoredDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "numberOfSeries": 1,
  "numberOfInstances": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `numberOfSeries` | Sí | `number` | Sin restricción adicional declarada | Nº de series creadas | `1` |
| `numberOfInstances` | Sí | `number` | Sin restricción adicional declarada | Nº de instancias creadas | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | message | Excepción explícita en src/modules/diagnostics/services/diagnostics-scope.service.ts |
| 409 | `CONFLICT` | El estudio DICOM ya fue almacenado | Excepción explícita en src/modules/diagnostics/services/diagnostics-imaging.service.ts |
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
  "path": "/dicomweb/studies"
}
```

---

## 63. GET /public/diagnostic-reports/{versionId}/verify

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-public`
- **Nombre:** Verificar la autenticidad de un informe diagnóstico
- **Operation ID:** `DiagnosticsReportVerifyPublicController_verify`
- **Autenticación:** Pública
- **Implementación:** [DiagnosticsReportVerifyPublicController.verify](../../src/modules/diagnostics/controllers/diagnostics-report-verify-public.controller.ts)

### Descripción de negocio

Sin autenticación y sin PHI: estado, fecha de emisión, emisor, estudio y SHA-256.


### Descripción del sistema

NestJS resuelve `GET /public/diagnostic-reports/{versionId}/verify` en `DiagnosticsReportVerifyPublicController_verify`. El controlador delega en `ReportReleaseService.verify`. No recibe body. El tipo de retorno estático es `Promise<ReportVerificationDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/diagnostic-reports/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Deben ser UUID válidos: `versionId`.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/diagnostic-reports/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReportVerificationDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<ReportVerificationDto>` | No |
| 404 | El informe no existe o no es oficial | `Promise<ReportVerificationDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ReportVerificationDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ReportVerificationDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ReportVerificationDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReportVerificationDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "status": "PUBLISHED",
  "issuedAt": "2026-07-31T12:00:00.000Z",
  "issuerName": "Nombre de ejemplo",
  "studyName": "Nombre de ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `PUBLISHED` | Sin descripción específica en el contrato OpenAPI. | `PUBLISHED` |
| `issuedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `issuerName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `studyName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `contentHash` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Informe no encontrado | Excepción explícita en src/modules/diagnostics/services/report-release.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/diagnostic-reports/{versionId}/verify"
}
```

---

