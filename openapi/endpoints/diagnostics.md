<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `diagnostics`

Referencia exhaustiva de 18 operación(es) del módulo `diagnostics`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `diagnostics-imaging`, `diagnostics-laboratory`, `diagnostics-reports`, `diagnostics-specimens`
- **Controladores:** `DiagnosticsImagingController`, `DiagnosticsLabController`, `DiagnosticsReportsController`, `DiagnosticsSpecimensController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /diagnostics/accessions](#1-post-diagnostics-accessions) — Acesionar especímenes recibidos en laboratorio
2. [POST /diagnostics/analyzer-runs](#2-post-diagnostics-analyzer-runs) — Abrir una corrida de analizador (soporte para ingesta)
3. [POST /diagnostics/analyzer-runs/{id}/messages](#3-post-diagnostics-analyzer-runs-id-messages) — Ingerir mensaje de resultado de analizador (LIS/HL7/ASTM)
4. [POST /diagnostics/clinical-media](#4-post-diagnostics-clinical-media) — Adjuntar media clínica / imagen al chart
5. [POST /diagnostics/containers/{id}/custody-events](#5-post-diagnostics-containers-id-custody-events) — Registrar cadena de custodia / traslado de contenedor
6. [POST /diagnostics/critical-results](#6-post-diagnostics-critical-results) — Detectar y notificar un resultado crítico
7. [POST /diagnostics/critical-results/{id}/acknowledge](#7-post-diagnostics-critical-results-id-acknowledge) — Acusar recibo / escalar notificación crítica
8. [POST /diagnostics/data-quality-events](#8-post-diagnostics-data-quality-events) — Registrar evento de calidad de datos + enlazar provenance
9. [POST /diagnostics/imaging-endpoints](#9-post-diagnostics-imaging-endpoints) — Registrar un endpoint DICOM (soporte para STOW-RS)
10. [POST /diagnostics/imaging-studies/{id}/dose-events](#10-post-diagnostics-imaging-studies-id-dose-events) — Registrar evento de dosis de radiación
11. [POST /diagnostics/reports/{reportId}/versions](#11-post-diagnostics-reports-reportid-versions) — Crear/enmendar versión de informe diagnóstico
12. [POST /diagnostics/reports/{reportId}/versions/{versionId}/release](#12-post-diagnostics-reports-reportid-versions-versionid-release) — Validar y liberar una versión del informe
13. [POST /diagnostics/results/{observationId}/verifications](#13-post-diagnostics-results-observationid-verifications) — Verificar (técnica/facultativa) un resultado
14. [POST /diagnostics/specimens](#14-post-diagnostics-specimens) — Registrar un espécimen (soporte para acesión)
15. [POST /diagnostics/specimens/{id}/containers](#15-post-diagnostics-specimens-id-containers) — Registrar un contenedor de espécimen (soporte para custodia)
16. [POST /diagnostics/specimens/{id}/rejection](#16-post-diagnostics-specimens-id-rejection) — Rechazar espécimen y solicitar recolección
17. [POST /diagnostics/work-orders](#17-post-diagnostics-work-orders) — Abrir orden de trabajo y desglosar pruebas
18. [POST /dicomweb/studies](#18-post-dicomweb-studies) — Ingestar estudio DICOM (STOW-RS) y ubicaciones de objeto

---

## 1. POST /diagnostics/accessions

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

## 2. POST /diagnostics/analyzer-runs

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

## 3. POST /diagnostics/analyzer-runs/{id}/messages

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

## 4. POST /diagnostics/clinical-media

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

## 5. POST /diagnostics/containers/{id}/custody-events

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

## 6. POST /diagnostics/critical-results

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

## 7. POST /diagnostics/critical-results/{id}/acknowledge

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

## 8. POST /diagnostics/data-quality-events

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

## 9. POST /diagnostics/imaging-endpoints

- **Módulo:** `diagnostics`
- **Etiqueta OpenAPI:** `diagnostics-imaging`
- **Nombre:** Registrar un endpoint DICOM (soporte para STOW-RS)
- **Operation ID:** `DiagnosticsImagingController_createEndpoint`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DiagnosticsImagingController.createEndpoint](../../src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts)

### Descripción de negocio

Registrar un endpoint DICOM (soporte para STOW-RS). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Soporte: alta de endpoint DICOM.

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

## 10. POST /diagnostics/imaging-studies/{id}/dose-events

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

## 11. POST /diagnostics/reports/{reportId}/versions

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

## 12. POST /diagnostics/reports/{reportId}/versions/{versionId}/release

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

## 13. POST /diagnostics/results/{observationId}/verifications

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

## 14. POST /diagnostics/specimens

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

## 15. POST /diagnostics/specimens/{id}/containers

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

## 16. POST /diagnostics/specimens/{id}/rejection

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

## 17. POST /diagnostics/work-orders

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

## 18. POST /dicomweb/studies

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

