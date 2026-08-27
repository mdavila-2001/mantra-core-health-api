<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `diagnostics`

Referencia exhaustiva de 27 operación(es) del módulo `diagnostics`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `diagnostics-imaging`, `diagnostics-laboratory`, `diagnostics-orders`, `diagnostics-patient-results`, `diagnostics-reports`, `diagnostics-specimens`
- **Controladores:** `DiagnosticsImagingController`, `DiagnosticsLabController`, `DiagnosticsOrdersController`, `DiagnosticsPatientResultsController`, `DiagnosticsReportsController`, `DiagnosticsSpecimensController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /diagnostic-results/me](#1-get-diagnostic-results-me) — Resultados de laboratorio, informes e imagen del titular
2. [GET /diagnostic-results/me/{reportId}](#2-get-diagnostic-results-me-reportid) — Un resultado del titular, con sus archivos
3. [GET /diagnostic-results/me/{reportId}/shares](#3-get-diagnostic-results-me-reportid-shares) — Con quién está compartido un resultado
4. [POST /diagnostic-results/me/{reportId}/shares](#4-post-diagnostic-results-me-reportid-shares) — Compartir temporalmente un resultado con un profesional
5. [POST /diagnostic-results/me/{reportId}/shares/{shareId}/revoke](#5-post-diagnostic-results-me-reportid-shares-shareid-revoke) — Dejar de compartir un resultado
6. [GET /diagnostic-results/me/orders](#6-get-diagnostic-results-me-orders) — Órdenes de laboratorio e imagen del titular
7. [POST /diagnostics/accessions](#7-post-diagnostics-accessions) — Acesionar especímenes recibidos en laboratorio
8. [POST /diagnostics/analyzer-runs](#8-post-diagnostics-analyzer-runs) — Abrir una corrida de analizador (soporte para ingesta)
9. [POST /diagnostics/analyzer-runs/{id}/messages](#9-post-diagnostics-analyzer-runs-id-messages) — Ingerir mensaje de resultado de analizador (LIS/HL7/ASTM)
10. [POST /diagnostics/clinical-media](#10-post-diagnostics-clinical-media) — Adjuntar media clínica / imagen al chart
11. [POST /diagnostics/containers/{id}/custody-events](#11-post-diagnostics-containers-id-custody-events) — Registrar cadena de custodia / traslado de contenedor
12. [POST /diagnostics/critical-results](#12-post-diagnostics-critical-results) — Detectar y notificar un resultado crítico
13. [POST /diagnostics/critical-results/{id}/acknowledge](#13-post-diagnostics-critical-results-id-acknowledge) — Acusar recibo / escalar notificación crítica
14. [POST /diagnostics/data-quality-events](#14-post-diagnostics-data-quality-events) — Registrar evento de calidad de datos + enlazar provenance
15. [POST /diagnostics/imaging-endpoints](#15-post-diagnostics-imaging-endpoints) — Registrar un endpoint DICOM (soporte para STOW-RS)
16. [POST /diagnostics/imaging-studies/{id}/dose-events](#16-post-diagnostics-imaging-studies-id-dose-events) — Registrar evento de dosis de radiación
17. [GET /diagnostics/patients/{patientProfileId}/imaging-studies](#17-get-diagnostics-patients-patientprofileid-imaging-studies) — Listar los estudios de imagen del paciente
18. [GET /diagnostics/patients/{patientProfileId}/orders](#18-get-diagnostics-patients-patientprofileid-orders) — Órdenes de laboratorio e imagenología del paciente, con sus informes
19. [POST /diagnostics/reports/{reportId}/versions](#19-post-diagnostics-reports-reportid-versions) — Crear/enmendar versión de informe diagnóstico
20. [POST /diagnostics/reports/{reportId}/versions/{versionId}/release](#20-post-diagnostics-reports-reportid-versions-versionid-release) — Validar y liberar una versión del informe
21. [POST /diagnostics/results/{observationId}/verifications](#21-post-diagnostics-results-observationid-verifications) — Verificar (técnica/facultativa) un resultado
22. [POST /diagnostics/specimens](#22-post-diagnostics-specimens) — Registrar un espécimen (soporte para acesión)
23. [POST /diagnostics/specimens/{id}/containers](#23-post-diagnostics-specimens-id-containers) — Registrar un contenedor de espécimen (soporte para custodia)
24. [POST /diagnostics/specimens/{id}/rejection](#24-post-diagnostics-specimens-id-rejection) — Rechazar espécimen y solicitar recolección
25. [GET /diagnostics/work-orders](#25-get-diagnostics-work-orders) — Listar las órdenes de trabajo del laboratorio
26. [POST /diagnostics/work-orders](#26-post-diagnostics-work-orders) — Abrir orden de trabajo y desglosar pruebas
27. [POST /dicomweb/studies](#27-post-dicomweb-studies) — Ingestar estudio DICOM (STOW-RS) y ubicaciones de objeto

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
| `items` | Sí | `array<PatientDiagnosticResultDto>` | Sin restricción adicional declarada | Resultados liberados, del más nuevo al más viejo. | `[{"reportId":"00000000-0000-4000-8000-000000000001","versionId":"00000000-0000-4000-8000-000000000001","versionNumber":1,"serviceRequestId":"00000000-0000-4000-8000-000000000001","codeConceptId":"00000000-0000-4000-8000-000000000001","categoryConceptId":"00000000-0000-4000-8000-000000000001","custodianTenantId":"00000000-0000-4000-8000-000000000001","conclusionText":"valor-ejemplo","issuedAt":"2026-07-31T12:00:00.000Z","releasedAt":"2026-07-31T12:00:00.000Z","clinicalStatusConceptId":"00000000-0000-4000-8000-000000000001","observationIds":["valor-ejemplo"],"files":[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","contentRoleConceptId":"00000000-0000-4000-8000-000000000001","presentationFormatConceptId":"00000000-0000-4000-8000-000000000001","ordinal":1}]}]` |
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
| `items[].files` | Sí | `array<DiagnosticResultFileDto>` | Sin restricción adicional declarada | Archivos descargables de la versión. | `[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","contentRoleConceptId":"00000000-0000-4000-8000-000000000001","presentationFormatConceptId":"00000000-0000-4000-8000-000000000001","ordinal":1}]` |
| `items[].files[].id` | Sí | `string` | formato `uuid` | Identificador del enlace informe↔archivo. | `00000000-0000-4000-8000-000000000001` |
| `items[].files[].fileId` | Sí | `string` | formato `uuid` | Archivo en `common.files`; se descarga por `/common/files/{id}/content`. | `00000000-0000-4000-8000-000000000001` |
| `items[].files[].contentRoleConceptId` | Sí | `string` | formato `uuid` | Qué es el archivo dentro del informe (concept id). | `00000000-0000-4000-8000-000000000001` |
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

Cada `fileId` se descarga por `GET /common/files/{id}/content`.

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
| `files` | Sí | `array<DiagnosticResultFileDto>` | Sin restricción adicional declarada | Archivos descargables de la versión. | `[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","contentRoleConceptId":"00000000-0000-4000-8000-000000000001","presentationFormatConceptId":"00000000-0000-4000-8000-000000000001","ordinal":1}]` |
| `files[].id` | Sí | `string` | formato `uuid` | Identificador del enlace informe↔archivo. | `00000000-0000-4000-8000-000000000001` |
| `files[].fileId` | Sí | `string` | formato `uuid` | Archivo en `common.files`; se descarga por `/common/files/{id}/content`. | `00000000-0000-4000-8000-000000000001` |
| `files[].contentRoleConceptId` | Sí | `string` | formato `uuid` | Qué es el archivo dentro del informe (concept id). | `00000000-0000-4000-8000-000000000001` |
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

## 3. GET /diagnostic-results/me/{reportId}/shares

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

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosticResultSharesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "reportId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "reportId": "00000000-0000-4000-8000-000000000001",
      "practitionerUserId": "00000000-0000-4000-8000-000000000001",
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
| `items` | Sí | `array<DiagnosticResultShareDto>` | Sin restricción adicional declarada | Los compartidos, del más nuevo al más viejo. | `[{"id":"00000000-0000-4000-8000-000000000001","reportId":"00000000-0000-4000-8000-000000000001","practitionerUserId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z","active":true}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del grant. | `00000000-0000-4000-8000-000000000001` |
| `items[].reportId` | Sí | `string` | formato `uuid` | Informe compartido. | `00000000-0000-4000-8000-000000000001` |
| `items[].practitionerUserId` | Sí | `string` | formato `uuid` | Cuenta del profesional con quien se compartió. | `00000000-0000-4000-8000-000000000001` |
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

## 4. POST /diagnostic-results/me/{reportId}/shares

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
  "practitionerUserId": "00000000-0000-4000-8000-000000000001",
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
| `practitionerUserId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `validUntil` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `reason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /diagnostic-results/me/00000000-0000-4000-8000-000000000001/shares HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "practitionerUserId": "00000000-0000-4000-8000-000000000001",
  "validUntil": "2026-07-31T12:00:00.000Z",
  "reason": "Texto descriptivo de ejemplo"
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

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosticResultShareDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "reportId": "00000000-0000-4000-8000-000000000001",
  "practitionerUserId": "00000000-0000-4000-8000-000000000001",
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
| 404 | `NOT_FOUND` | Informe no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El vencimiento del acceso compartido tiene que ser futuro | Excepción explícita en src/modules/diagnostics/services/diagnostics-patient-results.service.ts |
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

## 5. POST /diagnostic-results/me/{reportId}/shares/{shareId}/revoke

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

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DiagnosticResultShareDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "reportId": "00000000-0000-4000-8000-000000000001",
  "practitionerUserId": "00000000-0000-4000-8000-000000000001",
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

## 6. GET /diagnostic-results/me/orders

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
| 200 | Operación completada correctamente. | `Promise<PatientOwnOrdersResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PatientOwnOrdersResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PatientOwnOrdersResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PatientOwnOrdersResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PatientOwnOrdersResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PatientOwnOrdersResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientOwnOrdersResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "encounterId": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "categoryConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "priorityConceptId": "00000000-0000-4000-8000-000000000001",
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente leído. | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<PatientOrderSummaryDto>` | Sin restricción adicional declarada | Órdenes, de la más nueva a la más vieja. | `[{"id":"00000000-0000-4000-8000-000000000001","encounterId":"00000000-0000-4000-8000-000000000001","codeConceptId":"00000000-0000-4000-8000-000000000001","categoryConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","priorityConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z","preparationInstructions":"valor-ejemplo","hasReleasedResult":true,"reportId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la orden. | `00000000-0000-4000-8000-000000000001` |
| `items[].encounterId` | No | `string` | formato `uuid` | Encuentro en el que se pidió, si se pidió durante uno. | `00000000-0000-4000-8000-000000000001` |
| `items[].codeConceptId` | Sí | `string` | formato `uuid` | Qué se pidió (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].categoryConceptId` | No | `string` | formato `uuid` | Laboratorio o imagenología (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Estado de la orden (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].priorityConceptId` | No | `string` | formato `uuid` | Prioridad (concept id). | `00000000-0000-4000-8000-000000000001` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Cuándo se pidió. | `2026-07-31T12:00:00.000Z` |
| `items[].preparationInstructions` | No | `string` | Sin restricción adicional declarada | Cómo prepararse: ayunas, horarios, qué llevar. Sale del catálogo de estudios (`diagnostic_study_offerings`), emparejado por concepto. Ausente cuando ningún centro publicó preparación para ese estudio — que es distinto de «no hay que prepararse», y por eso la pantalla no debe inventar un texto tranquilizador cuando falta. | `valor-ejemplo` |
| `items[].hasReleasedResult` | Sí | `boolean` | Sin restricción adicional declarada | Ya hay un resultado liberado y visible para esta orden. | `true` |
| `items[].reportId` | No | `string` | formato `uuid` | El informe a abrir, cuando es verdadero. | `00000000-0000-4000-8000-000000000001` |
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
  "path": "/diagnostic-results/me/orders"
}
```

---

## 7. POST /diagnostics/accessions

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
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente dueño de la acesión | `00000000-0000-4000-8000-000000000001` |
| `custodianTenantId` | No | `string` | formato `uuid` | Tenant custodio (por defecto el del token) | `00000000-0000-4000-8000-000000000001` |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Espécimen no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-specimens.service.ts |
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

## 8. POST /diagnostics/analyzer-runs

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
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
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
| 422 | `PRECONDITION_FAILED` | Falta el tenant custodio de la corrida | Excepción explícita en src/modules/diagnostics/services/diagnostics-lab.service.ts |
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

## 9. POST /diagnostics/analyzer-runs/{id}/messages

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
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
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
| 404 | `NOT_FOUND` | Corrida de analizador no encontrada | Excepción explícita en src/modules/diagnostics/services/diagnostics-lab.service.ts |
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

## 10. POST /diagnostics/clinical-media

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
| 409 | `CONFLICT` | El archivo ya está adjunto como media clínica | Excepción explícita en src/modules/diagnostics/services/diagnostics-media-quality.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Falta el tenant custodio de la media | Excepción explícita en src/modules/diagnostics/services/diagnostics-media-quality.service.ts |
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

## 11. POST /diagnostics/containers/{id}/custody-events

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
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
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

## 12. POST /diagnostics/critical-results

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-reports`
- **Nombre:** Detectar y notificar un resultado crítico
- **Operation ID:** `DiagnosticsReportsController_detectCritical`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportsController.detectCritical](../../src/modules/diagnostics/controllers/diagnostics-reports.controller.ts)

### Descripción de negocio

Detectar y notificar un resultado crítico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/critical-results` en `DiagnosticsReportsController_detectCritical`. El controlador delega en `DiagnosticsReportsService.detectCritical`. Valida el body como `DetectCriticalResultDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

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
| 409 | `CONFLICT` | Ya existe una notificación crítica para la observación | Excepción explícita en src/modules/diagnostics/services/diagnostics-reports.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Falta el tenant custodio de la notificación | Excepción explícita en src/modules/diagnostics/services/diagnostics-reports.service.ts |
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

## 13. POST /diagnostics/critical-results/{id}/acknowledge

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
| 404 | `NOT_FOUND` | Notificación crítica no encontrada | Excepción explícita en src/modules/diagnostics/services/diagnostics-reports.service.ts |
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

## 14. POST /diagnostics/data-quality-events

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
| 422 | `PRECONDITION_FAILED` | Falta el tenant custodio del evento de calidad | Excepción explícita en src/modules/diagnostics/services/diagnostics-media-quality.service.ts |
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

## 15. POST /diagnostics/imaging-endpoints

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
| 409 | `CONFLICT` | Falta el tenant del endpoint de imagen | Excepción explícita en src/modules/diagnostics/services/diagnostics-imaging.service.ts |
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

## 16. POST /diagnostics/imaging-studies/{id}/dose-events

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
| 404 | `NOT_FOUND` | Estudio de imagen no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-imaging.service.ts |
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

## 17. GET /diagnostics/patients/{patientProfileId}/imaging-studies

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-imaging`
- **Nombre:** Listar los estudios de imagen del paciente
- **Operation ID:** `DiagnosticsImagingController_listStudies`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsImagingController.listStudies](../../src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts)

### Descripción de negocio

Listar los estudios de imagen del paciente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

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

## 18. GET /diagnostics/patients/{patientProfileId}/orders

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

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PatientDiagnosticOrdersResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "orders": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "encounterId": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "categoryConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "priorityConceptId": "00000000-0000-4000-8000-000000000001",
      "requesterProfileId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z"
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
| `orders` | Sí | `array<DiagnosticOrderSummaryDto>` | Sin restricción adicional declarada | Órdenes de laboratorio e imagenología, de la más nueva a la más vieja. | `[{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","encounterId":"00000000-0000-4000-8000-000000000001","codeConceptId":"00000000-0000-4000-8000-000000000001","categoryConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","priorityConceptId":"00000000-0000-4000-8000-000000000001","requesterProfileId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `orders[].id` | Sí | `string` | formato `uuid` | Identificador de la orden. | `00000000-0000-4000-8000-000000000001` |
| `orders[].patientProfileId` | Sí | `string` | formato `uuid` | Paciente al que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `orders[].encounterId` | No | `string` | formato `uuid` | Encuentro en el que se pidió, si se pidió durante uno. | `00000000-0000-4000-8000-000000000001` |
| `orders[].codeConceptId` | Sí | `string` | formato `uuid` | Qué se pidió (concept id). | `00000000-0000-4000-8000-000000000001` |
| `orders[].categoryConceptId` | No | `string` | formato `uuid` | Laboratorio o imagenología (concept id). | `00000000-0000-4000-8000-000000000001` |
| `orders[].statusConceptId` | Sí | `string` | formato `uuid` | Estado de la orden (concept id). | `00000000-0000-4000-8000-000000000001` |
| `orders[].priorityConceptId` | No | `string` | formato `uuid` | Prioridad (concept id). | `00000000-0000-4000-8000-000000000001` |
| `orders[].requesterProfileId` | No | `string` | formato `uuid` | Profesional que la solicitó. | `00000000-0000-4000-8000-000000000001` |
| `orders[].createdAt` | Sí | `string` | formato `date-time` | Cuándo se pidió. | `2026-07-31T12:00:00.000Z` |
| `reports` | Sí | `array<DiagnosticReportSummaryDto>` | Sin restricción adicional declarada | Informes diagnósticos, de la más nueva a la más vieja. | `[{"id":"00000000-0000-4000-8000-000000000001","patientProfileId":"00000000-0000-4000-8000-000000000001","serviceRequestId":"00000000-0000-4000-8000-000000000001","encounterId":"00000000-0000-4000-8000-000000000001","codeConceptId":"00000000-0000-4000-8000-000000000001","categoryConceptId":"00000000-0000-4000-8000-000000000001","lifecycleStatusConceptId":"00000000-0000-4000-8000-000000000001","currentVersionId":"00000000-0000-4000-8000-000000000001","currentReleasedVersionId":"00000000-0000-4000-8000-000000000001","resultReleaseStatusConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z"}]` |
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

## 19. POST /diagnostics/reports/{reportId}/versions

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-reports`
- **Nombre:** Crear/enmendar versión de informe diagnóstico
- **Operation ID:** `DiagnosticsReportsController_createVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportsController.createVersion](../../src/modules/diagnostics/controllers/diagnostics-reports.controller.ts)

### Descripción de negocio

Crear/enmendar versión de informe diagnóstico. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/reports/{reportId}/versions` en `DiagnosticsReportsController_createVersion`. El controlador delega en `DiagnosticsReportsService.createReportVersion`. Valida el body como `CreateReportVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

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
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Falta el tenant custodio del informe | Excepción explícita en src/modules/diagnostics/services/diagnostics-reports.service.ts |
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

## 20. POST /diagnostics/reports/{reportId}/versions/{versionId}/release

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-reports`
- **Nombre:** Validar y liberar una versión del informe
- **Operation ID:** `DiagnosticsReportsController_releaseVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsReportsController.releaseVersion](../../src/modules/diagnostics/controllers/diagnostics-reports.controller.ts)

### Descripción de negocio

Validar y liberar una versión del informe. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /diagnostics/reports/{reportId}/versions/{versionId}/release` en `DiagnosticsReportsController_releaseVersion`. El controlador delega en `DiagnosticsReportsService.releaseVersion`. Valida el body como `ReleaseReportVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceCreatedDto>`.

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

## 21. POST /diagnostics/results/{observationId}/verifications

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
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
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
| 422 | `PRECONDITION_FAILED` | Falta el tenant custodio de la verificación | Excepción explícita en src/modules/diagnostics/services/diagnostics-lab.service.ts |
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

## 22. POST /diagnostics/specimens

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
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001"
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
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente dueño del espécimen | `00000000-0000-4000-8000-000000000001` |
| `custodianTenantId` | Sí | `string` | formato `uuid` | Tenant custodio | `00000000-0000-4000-8000-000000000001` |
| `specimenTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de espécimen (concept id) | `00000000-0000-4000-8000-000000000001` |
| `serviceRequestId` | No | `string` | formato `uuid` | Orden clínica de origen | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `bodySiteConceptId` | No | `string` | formato `uuid` | Sitio anatómico (concept id) | `00000000-0000-4000-8000-000000000001` |
| `collectionMethodConceptId` | No | `string` | formato `uuid` | Método de recolección (concept id) | `00000000-0000-4000-8000-000000000001` |
| `collectorProfileId` | No | `string` | formato `uuid` | Profesional que recolecta | `00000000-0000-4000-8000-000000000001` |

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
  "collectorProfileId": "00000000-0000-4000-8000-000000000001"
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
  "path": "/diagnostics/specimens"
}
```

---

## 23. POST /diagnostics/specimens/{id}/containers

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
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
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
| 404 | `NOT_FOUND` | Espécimen no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-specimens.service.ts |
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

## 24. POST /diagnostics/specimens/{id}/rejection

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
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
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
| 404 | `NOT_FOUND` | Espécimen no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-specimens.service.ts |
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

## 25. GET /diagnostics/work-orders

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
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /diagnostics/work-orders?laboratoryAccessionId=00000000-0000-4000-8000-000000000001&statusConceptId=00000000-0000-4000-8000-000000000001&assignedProfileId=00000000-0000-4000-8000-000000000001&limit=50&offset=0 HTTP/1.1
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
    "completedAt": "2026-07-31T12:00:00.000Z"
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

## 26. POST /diagnostics/work-orders

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
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Acesión no encontrada | Excepción explícita en src/modules/diagnostics/services/diagnostics-lab.service.ts |
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

## 27. POST /dicomweb/studies

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
| 404 | `NOT_FOUND` | Endpoint de imagen no encontrado | Excepción explícita en src/modules/diagnostics/services/diagnostics-imaging.service.ts |
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

