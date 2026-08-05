<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `health_data`

Referencia exhaustiva de 15 operación(es) del módulo `health_data`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `fhir-r5`, `health-data`
- **Controladores:** `FhirR5Controller`, `HealthDataController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /fhir/r5/$export](#1-post-fhir-r5-export) — Exportar un Bundle FHIR interoperable con su manifiesto
2. [GET /fhir/r5/Patient/{id}/$everything](#2-get-fhir-r5-patient-id-everything) — Servir la historia longitudinal del paciente
3. [POST /health-data/canonical-resources/{id}/bindings](#3-post-health-data-canonical-resources-id-bindings) — Enlazar el recurso a una entidad de dominio
4. [POST /health-data/canonical-resources/{id}/identifiers](#4-post-health-data-canonical-resources-id-identifiers) — Registrar un identificador de negocio del recurso
5. [POST /health-data/canonical-resources/{id}/relationships](#5-post-health-data-canonical-resources-id-relationships) — Relacionar dos recursos canónicos
6. [POST /health-data/canonical-resources/{id}/retire](#6-post-health-data-canonical-resources-id-retire) — Retirar el recurso canónico (borrado lógico)
7. [POST /health-data/canonical-resources/project](#7-post-health-data-canonical-resources-project) — Proyectar el registro a recurso canónico y versionarlo
8. [POST /health-data/deidentification-runs](#8-post-health-data-deidentification-runs) — Registrar una corrida de de-identificación
9. [POST /health-data/identity/candidates/{id}/decision](#9-post-health-data-identity-candidates-id-decision) — Resolver un candidato de identidad longitudinal
10. [POST /health-data/ingestion-batches](#10-post-health-data-ingestion-batches) — Abrir un lote de ingesta desde una conexión de origen
11. [POST /health-data/ingestion-batches/{id}/close](#11-post-health-data-ingestion-batches-id-close) — Cerrar el lote conciliando sus contadores
12. [POST /health-data/ingestion-batches/{id}/records](#12-post-health-data-ingestion-batches-id-records) — Registrar un registro crudo del lote
13. [POST /health-data/quality-runs](#13-post-health-data-quality-runs) — Ejecutar reglas de calidad y abrir incidencias
14. [POST /health-data/timeline-entries](#14-post-health-data-timeline-entries) — Proyectar una entrada de la línea de tiempo del paciente
15. [POST /health-data/versions/{id}/validate](#15-post-health-data-versions-id-validate) — Validar la versión contra un perfil FHIR R5

---

## 1. POST /fhir/r5/$export

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `fhir-r5`
- **Nombre:** Exportar un Bundle FHIR interoperable con su manifiesto
- **Operation ID:** `FhirR5Controller_exportBundle`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FhirR5Controller.exportBundle](../../src/modules/health_data/controllers/fhir-r5.controller.ts)

### Descripción de negocio

El propósito de uso es obligatorio y el hash sella lo entregado.


### Descripción del sistema

NestJS resuelve `POST /fhir/r5/$export` en `FhirR5Controller_exportBundle`. El controlador delega en `DataReleaseService.exportBundle`. Valida el body como `ExportBundleDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExportJobResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExportBundleDto`; los campos opcionales se omiten.

```http
POST /fhir/r5/$export HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "exportTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUseConceptId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "recordCount": "412"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRIVACY_OFFICER`, `HEALTH_DATA_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `exportTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de exportación (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `purposeOfUseConceptId` | Sí | `string` | formato `uuid` | Propósito de uso; sin él no se exporta | `00000000-0000-4000-8000-000000000001` |
| `contentHash` | Sí | `string` | longitud máxima 200 | Hash del Bundle entregado; lo sella | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `recordCount` | Sí | `string` | Sin restricción adicional declarada | Recursos incluidos; cadena por ser bigint | `412` |
| `patientProfileId` | No | `string` | formato `uuid` | Paciente exportado | `00000000-0000-4000-8000-000000000001` |
| `cohortDefinitionId` | No | `string` | formato `uuid` | Cohorte exportada | `00000000-0000-4000-8000-000000000001` |
| `consentDirectiveId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `deidentificationRunId` | No | `string` | formato `uuid` | Corrida de de-identificación aplicada, si la hubo | `00000000-0000-4000-8000-000000000001` |
| `fileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sizeBytes` | No | `string` | Sin restricción adicional declarada | Tamaño en bytes; cadena por ser bigint | `valor-ejemplo` |
| `encryptionProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `retentionPolicyId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `expiresAt` | No | `string` | formato `date-time` | Cuándo caduca la entrega | `2026-07-31T12:00:00.000Z` |
| `deliveryDestinationJson` | No | `object` | Sin restricción adicional declarada | A dónde se entrega | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /fhir/r5/$export HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "exportTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUseConceptId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "recordCount": "412",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "cohortDefinitionId": "00000000-0000-4000-8000-000000000001",
  "consentDirectiveId": "00000000-0000-4000-8000-000000000001",
  "deidentificationRunId": "00000000-0000-4000-8000-000000000001",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "sizeBytes": "valor-ejemplo",
  "encryptionProfileId": "00000000-0000-4000-8000-000000000001",
  "retentionPolicyId": "00000000-0000-4000-8000-000000000001",
  "expiresAt": "2026-07-31T12:00:00.000Z",
  "deliveryDestinationJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ExportJobResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExportJobResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExportJobResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExportJobResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExportJobResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExportJobResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExportJobResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExportJobResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExportJobResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExportJobResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "manifestId": "00000000-0000-4000-8000-000000000001",
  "manifestVersion": 1,
  "provenanceRecordId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `manifestId` | Sí | `string` | formato `uuid` | Manifiesto inmutable del Bundle | `00000000-0000-4000-8000-000000000001` |
| `manifestVersion` | Sí | `number` | Sin restricción adicional declarada | Valor de manifest version mantenido por la instancia. | `1` |
| `provenanceRecordId` | Sí | `string` | formato `uuid` | Procedencia registrada de la exportación | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRIVACY_OFFICER, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Corrida de de-identificación no encontrada | Excepción explícita en src/modules/health_data/services/data-release.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La exportación necesita un paciente o una cohorte | Excepción explícita en src/modules/health_data/services/data-release.service.ts |
| 422 | `PRECONDITION_FAILED` | La corrida de de-identificación no está completada | Excepción explícita en src/modules/health_data/services/data-release.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/fhir/r5/$export"
}
```

---

## 2. GET /fhir/r5/Patient/{id}/$everything

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `fhir-r5`
- **Nombre:** Servir la historia longitudinal del paciente
- **Operation ID:** `FhirR5Controller_serveEverything`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FhirR5Controller.serveEverything](../../src/modules/health_data/controllers/fhir-r5.controller.ts)

### Descripción de negocio

La identidad se expande por el clúster del MPI: dos perfiles resueltos como la misma persona tienen una sola historia.


### Descripción del sistema

NestJS resuelve `GET /fhir/r5/Patient/{id}/$everything` en `FhirR5Controller_serveEverything`. El controlador delega en `DataReleaseService.serveEverything`. No recibe body. El tipo de retorno estático es `Promise<EverythingBundleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `custodian` | query | No | `string` | formato `uuid` | Custodio por el que se acota la búsqueda | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /fhir/r5/Patient/00000000-0000-4000-8000-000000000001/$everything HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INTEROP_CONSUMER`, `CLINICAL_INFORMATICIAN`, `HEALTH_DATA_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /fhir/r5/Patient/00000000-0000-4000-8000-000000000001/$everything?custodian=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<EverythingBundleResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<EverythingBundleResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<EverythingBundleResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<EverythingBundleResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<EverythingBundleResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<EverythingBundleResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<EverythingBundleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EverythingBundleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "includedPatientProfileIds": [
    "valor-ejemplo"
  ],
  "identityClusterId": "00000000-0000-4000-8000-000000000001",
  "entries": [
    {
      "resourceId": "00000000-0000-4000-8000-000000000001",
      "resourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "versionId": "00000000-0000-4000-8000-000000000001",
      "versionNumber": 1,
      "payload": {
        "clave": "valor"
      }
    }
  ],
  "total": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Paciente por el que se preguntó | `00000000-0000-4000-8000-000000000001` |
| `includedPatientProfileIds` | Sí | `array<string>` | formato `uuid` | Perfiles del clúster de identidad que se expandieron | `["valor-ejemplo"]` |
| `identityClusterId` | No | `string` | formato `uuid` | Clúster de identidad resuelto | `00000000-0000-4000-8000-000000000001` |
| `entries` | Sí | `array<EverythingEntryDto>` | Sin restricción adicional declarada | Valor de entries mantenido por la instancia. | `[{"resourceId":"00000000-0000-4000-8000-000000000001","resourceTypeConceptId":"00000000-0000-4000-8000-000000000001","versionId":"00000000-0000-4000-8000-000000000001","versionNumber":1,"payload":{"clave":"valor"}}]` |
| `entries[].resourceId` | Sí | `string` | formato `uuid` | Identificador asociado a resource. | `00000000-0000-4000-8000-000000000001` |
| `entries[].resourceTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a resource type concept. | `00000000-0000-4000-8000-000000000001` |
| `entries[].versionId` | Sí | `string` | formato `uuid` | Identificador asociado a version. | `00000000-0000-4000-8000-000000000001` |
| `entries[].versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `entries[].payload` | Sí | `object` | Sin restricción adicional declarada | Payload normalizado de la versión vigente | `{"clave":"valor"}` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Recursos incluidos | `1` |
| `contentHash` | Sí | `string` | Sin restricción adicional declarada | Hash del Bundle; permite validar la frescura de una caché | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INTEROP_CONSUMER, CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/fhir/r5/Patient/{id}/$everything"
}
```

---

## 3. POST /health-data/canonical-resources/{id}/bindings

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `health-data`
- **Nombre:** Enlazar el recurso a una entidad de dominio
- **Operation ID:** `HealthDataController_createBinding`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthDataController.createBinding](../../src/modules/health_data/controllers/health-data.controller.ts)

### Descripción de negocio

Es una referencia: la tabla clínica sigue siendo la fuente operativa.


### Descripción del sistema

NestJS resuelve `POST /health-data/canonical-resources/{id}/bindings` en `HealthDataController_createBinding`. El controlador delega en `CanonicalResourcesService.createBinding`. Valida el body como `CreateResourceBindingDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResourceBindingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateResourceBindingDto`; los campos opcionales se omiten.

```http
POST /health-data/canonical-resources/00000000-0000-4000-8000-000000000001/bindings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "domainEntityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "domainEntityId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICAL_INFORMATICIAN`, `HEALTH_DATA_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `domainEntityTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de entidad de dominio (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `domainEntityId` | Sí | `string` | formato `uuid` | Entidad de dominio concreta | `00000000-0000-4000-8000-000000000001` |
| `bindingRoleConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `mappingVersionId` | No | `string` | formato `uuid` | Versión del mapeo terminológico aplicado | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-data/canonical-resources/00000000-0000-4000-8000-000000000001/bindings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "domainEntityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "domainEntityId": "00000000-0000-4000-8000-000000000001",
  "bindingRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "mappingVersionId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ResourceBindingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResourceBindingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResourceBindingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResourceBindingResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResourceBindingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResourceBindingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResourceBindingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResourceBindingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResourceBindingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResourceBindingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResourceBindingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "canonicalHealthResourceId": "00000000-0000-4000-8000-000000000001",
  "bindingStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "lineageEdgeId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `canonicalHealthResourceId` | Sí | `string` | formato `uuid` | Identificador asociado a canonical health resource. | `00000000-0000-4000-8000-000000000001` |
| `bindingStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a binding status concept. | `00000000-0000-4000-8000-000000000001` |
| `lineageEdgeId` | Sí | `string` | formato `uuid` | Arista de linaje versión → entidad de dominio | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Recurso canónico no encontrado | Excepción explícita en src/modules/health_data/services/canonical-resources.service.ts |
| 409 | `CONFLICT` | Ese enlace ya existe | Excepción explícita en src/modules/health_data/services/canonical-resources.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El recurso está retirado | Excepción explícita en src/modules/health_data/services/canonical-resources.service.ts |
| 422 | `PRECONDITION_FAILED` | El recurso no tiene versión vigente | Excepción explícita en src/modules/health_data/services/canonical-resources.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-data/canonical-resources/{id}/bindings"
}
```

---

## 4. POST /health-data/canonical-resources/{id}/identifiers

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `health-data`
- **Nombre:** Registrar un identificador de negocio del recurso
- **Operation ID:** `HealthDataController_registerIdentifier`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthDataController.registerIdentifier](../../src/modules/health_data/controllers/health-data.controller.ts)

### Descripción de negocio

Sólo un identificador principal vigente por sistema emisor.


### Descripción del sistema

NestJS resuelve `POST /health-data/canonical-resources/{id}/identifiers` en `HealthDataController_registerIdentifier`. El controlador delega en `CanonicalResourcesService.registerIdentifier`. Valida el body como `RegisterIdentifierDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdentifierResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterIdentifierDto`; los campos opcionales se omiten.

```http
POST /health-data/canonical-resources/00000000-0000-4000-8000-000000000001/identifiers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "identifierSystem": "valor-ejemplo",
  "identifierValue": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INGESTION_WORKER`, `CLINICAL_INFORMATICIAN`, `HEALTH_DATA_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `identifierSystem` | Sí | `string` | longitud máxima 300 | Sistema emisor del identificador | `valor-ejemplo` |
| `identifierValue` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `identifierTypeConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assigningAuthority` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `isPrimary` | No | `boolean` | Sin restricción adicional declarada | Sólo uno vigente por sistema; el anterior se cierra | `false` |
| `effectiveFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-data/canonical-resources/00000000-0000-4000-8000-000000000001/identifiers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "identifierSystem": "valor-ejemplo",
  "identifierValue": "valor-ejemplo",
  "identifierTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "assigningAuthority": "valor-ejemplo",
  "isPrimary": false,
  "effectiveFrom": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdentifierResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "canonicalHealthResourceId": "00000000-0000-4000-8000-000000000001",
  "isPrimary": true,
  "supersededIdentifierId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `canonicalHealthResourceId` | Sí | `string` | formato `uuid` | Identificador asociado a canonical health resource. | `00000000-0000-4000-8000-000000000001` |
| `isPrimary` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is primary mantenido por la instancia. | `true` |
| `supersededIdentifierId` | No | `string` | formato `uuid` | Identificador principal que se cerró | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INGESTION_WORKER, CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Recurso canónico no encontrado | Excepción explícita en src/modules/health_data/services/canonical-resources.service.ts |
| 409 | `CONFLICT` | El recurso ya tiene ese identificador | Excepción explícita en src/modules/health_data/services/canonical-resources.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El recurso está retirado | Excepción explícita en src/modules/health_data/services/canonical-resources.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-data/canonical-resources/{id}/identifiers"
}
```

---

## 5. POST /health-data/canonical-resources/{id}/relationships

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `health-data`
- **Nombre:** Relacionar dos recursos canónicos
- **Operation ID:** `HealthDataController_createRelationship`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthDataController.createRelationship](../../src/modules/health_data/controllers/health-data.controller.ts)

### Descripción de negocio

Una relación nueva del mismo par y tipo cierra la anterior.


### Descripción del sistema

NestJS resuelve `POST /health-data/canonical-resources/{id}/relationships` en `HealthDataController_createRelationship`. El controlador delega en `CanonicalResourcesService.createRelationship`. Valida el body como `HealthDataCreateRelationshipDto` y consume `application/json`. El tipo de retorno estático es `Promise<RelationshipResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `HealthDataCreateRelationshipDto`; los campos opcionales se omiten.

```http
POST /health-data/canonical-resources/00000000-0000-4000-8000-000000000001/relationships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetResourceId": "00000000-0000-4000-8000-000000000001",
  "relationshipTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_STEWARD`, `CLINICAL_INFORMATICIAN`, `HEALTH_DATA_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `targetResourceId` | Sí | `string` | formato `uuid` | Recurso al que apunta la relación | `00000000-0000-4000-8000-000000000001` |
| `relationshipTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de relación (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `relationshipRoleConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `effectiveFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `confidenceScore` | No | `string` | Sin restricción adicional declarada | Confianza, como cadena decimal | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-data/canonical-resources/00000000-0000-4000-8000-000000000001/relationships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetResourceId": "00000000-0000-4000-8000-000000000001",
  "relationshipTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "relationshipRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "confidenceScore": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RelationshipResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "sourceConceptId": "00000000-0000-4000-8000-000000000001",
  "targetConceptId": "00000000-0000-4000-8000-000000000001",
  "relationshipTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "ordinal": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id de la relación creada | `00000000-0000-4000-8000-000000000001` |
| `sourceConceptId` | Sí | `string` | Sin restricción adicional declarada | Id del concepto origen | `00000000-0000-4000-8000-000000000001` |
| `targetConceptId` | Sí | `string` | Sin restricción adicional declarada | Id del concepto destino | `00000000-0000-4000-8000-000000000001` |
| `relationshipTypeConceptId` | Sí | `string` | Sin restricción adicional declarada | Tipo de relación (concepto) | `00000000-0000-4000-8000-000000000001` |
| `ordinal` | No | `number` | Sin restricción adicional declarada | Orden dentro de las relaciones del mismo tipo | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_STEWARD, CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Recurso canónico no encontrado | Excepción explícita en src/modules/health_data/services/canonical-resources.service.ts |
| 404 | `NOT_FOUND` | Recurso canónico destino no encontrado | Excepción explícita en src/modules/health_data/services/canonical-resources.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un recurso no se relaciona consigo mismo | Excepción explícita en src/modules/health_data/services/canonical-resources.service.ts |
| 422 | `PRECONDITION_FAILED` | Los recursos son de custodios distintos | Excepción explícita en src/modules/health_data/services/canonical-resources.service.ts |
| 422 | `PRECONDITION_FAILED` | Alguno de los recursos está retirado | Excepción explícita en src/modules/health_data/services/canonical-resources.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-data/canonical-resources/{id}/relationships"
}
```

---

## 6. POST /health-data/canonical-resources/{id}/retire

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `health-data`
- **Nombre:** Retirar el recurso canónico (borrado lógico)
- **Operation ID:** `HealthDataController_retireResource`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthDataController.retireResource](../../src/modules/health_data/controllers/health-data.controller.ts)

### Descripción de negocio

Las versiones nunca se borran; se cierran enlaces y relaciones vigentes.


### Descripción del sistema

NestJS resuelve `POST /health-data/canonical-resources/{id}/retire` en `HealthDataController_retireResource`. El controlador delega en `CanonicalResourcesService.retireResource`. Valida el body como `RetireResourceDto` y consume `application/json`. El tipo de retorno estático es `Promise<RetireResourceResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RetireResourceDto`; los campos opcionales se omiten.

```http
POST /health-data/canonical-resources/00000000-0000-4000-8000-000000000001/retire HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICAL_INFORMATICIAN`, `HEALTH_DATA_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | Sin restricción adicional declarada | Por qué se retira | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-data/canonical-resources/00000000-0000-4000-8000-000000000001/retire HTTP/1.1
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
| 200 | Operación completada correctamente. | `Promise<RetireResourceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RetireResourceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RetireResourceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RetireResourceResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RetireResourceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RetireResourceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RetireResourceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RetireResourceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RetireResourceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RetireResourceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RetireResourceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "lifecycleStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "closedBindings": 1,
  "closedRelationships": 1,
  "provenanceRecordId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `lifecycleStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a lifecycle status concept. | `00000000-0000-4000-8000-000000000001` |
| `closedBindings` | Sí | `number` | Sin restricción adicional declarada | Bindings que quedan cerrados | `1` |
| `closedRelationships` | Sí | `number` | Sin restricción adicional declarada | Relaciones que quedan cerradas | `1` |
| `provenanceRecordId` | Sí | `string` | formato `uuid` | Procedencia registrada del retiro | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Recurso canónico no encontrado | Excepción explícita en src/modules/health_data/services/canonical-resources.service.ts |
| 409 | `CONFLICT` | El recurso ya está retirado | Excepción explícita en src/modules/health_data/services/canonical-resources.service.ts |
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
  "path": "/health-data/canonical-resources/{id}/retire"
}
```

---

## 7. POST /health-data/canonical-resources/project

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `health-data`
- **Nombre:** Proyectar el registro a recurso canónico y versionarlo
- **Operation ID:** `HealthDataController_projectResource`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthDataController.projectResource](../../src/modules/health_data/controllers/health-data.controller.ts)

### Descripción de negocio

Un payload idéntico al vigente no genera versión nueva.


### Descripción del sistema

NestJS resuelve `POST /health-data/canonical-resources/project` en `HealthDataController_projectResource`. El controlador delega en `HealthIngestionService.projectResource`. Valida el body como `ProjectCanonicalResourceDto` y consume `application/json`. El tipo de retorno estático es `Promise<CanonicalResourceVersionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ProjectCanonicalResourceDto`; los campos opcionales se omiten.

```http
POST /health-data/canonical-resources/project HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "healthIngestionRecordId": "00000000-0000-4000-8000-000000000001",
  "logicalIdentifier": "valor-ejemplo",
  "normalizedPayloadJson": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INGESTION_WORKER`, `HEALTH_DATA_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `healthIngestionRecordId` | Sí | `string` | formato `uuid` | Registro crudo del que sale la proyección | `00000000-0000-4000-8000-000000000001` |
| `logicalIdentifier` | Sí | `string` | longitud máxima 300 | Identificador lógico del recurso en el custodio | `valor-ejemplo` |
| `normalizedPayloadJson` | Sí | `object` | Sin restricción adicional declarada | Payload normalizado del recurso | `{}` |
| `custodianTenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Paciente al que pertenece el recurso | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sourceSystemId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `payloadFormatConceptId` | No | `string` | formato `uuid` | Formato del payload (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `originalPayloadFileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `effectiveStartAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `securityLabelsJson` | No | `object` | Sin restricción adicional declarada | Etiquetas de seguridad del recurso | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-data/canonical-resources/project HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "healthIngestionRecordId": "00000000-0000-4000-8000-000000000001",
  "logicalIdentifier": "valor-ejemplo",
  "normalizedPayloadJson": {},
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "sourceSystemId": "00000000-0000-4000-8000-000000000001",
  "payloadFormatConceptId": "00000000-0000-4000-8000-000000000001",
  "originalPayloadFileId": "00000000-0000-4000-8000-000000000001",
  "effectiveStartAt": "2026-07-31T12:00:00.000Z",
  "securityLabelsJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CanonicalResourceVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CanonicalResourceVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CanonicalResourceVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CanonicalResourceVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CanonicalResourceVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CanonicalResourceVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CanonicalResourceVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CanonicalResourceVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CanonicalResourceVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CanonicalResourceVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "created": true,
  "unchanged": true,
  "provenanceRecordId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `resourceId` | Sí | `string` | formato `uuid` | Identificador asociado a resource. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | No | `string` | formato `uuid` | Ausente si el contenido no cambió | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | No | `number` | Sin restricción adicional declarada | Ausente si el contenido no cambió | `1` |
| `contentHash` | Sí | `string` | Sin restricción adicional declarada | Valor de content hash mantenido por la instancia. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `created` | Sí | `boolean` | Sin restricción adicional declarada | true si el recurso se creó en esta proyección | `true` |
| `unchanged` | Sí | `boolean` | Sin restricción adicional declarada | true si el payload es idéntico al vigente y no se versionó | `true` |
| `provenanceRecordId` | No | `string` | formato `uuid` | Procedencia registrada de la ingesta | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INGESTION_WORKER, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Registro de ingesta no encontrado | Excepción explícita en src/modules/health_data/services/health-ingestion.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El registro no está en cola de proyección | Excepción explícita en src/modules/health_data/services/health-ingestion.service.ts |
| 422 | `PRECONDITION_FAILED` | El recurso está retirado | Excepción explícita en src/modules/health_data/services/health-ingestion.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-data/canonical-resources/project"
}
```

---

## 8. POST /health-data/deidentification-runs

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `health-data`
- **Nombre:** Registrar una corrida de de-identificación
- **Operation ID:** `HealthDataController_recordDeidRun`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthDataController.recordDeidRun](../../src/modules/health_data/controllers/health-data.controller.ts)

### Descripción de negocio

La clave de re-identificación vive en el vault; aquí sólo su referencia.


### Descripción del sistema

NestJS resuelve `POST /health-data/deidentification-runs` en `HealthDataController_recordDeidRun`. El controlador delega en `DataReleaseService.recordDeidRun`. Valida el body como `RecordDeidRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeidRunResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordDeidRunDto`; los campos opcionales se omiten.

```http
POST /health-data/deidentification-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "healthDeidentificationProfileId": "00000000-0000-4000-8000-000000000001",
  "purposeConceptId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "outcome": "COMPLETED",
  "recordsProcessed": "5000"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRIVACY_OFFICER`, `HEALTH_DATA_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `healthDeidentificationProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `purposeConceptId` | Sí | `string` | formato `uuid` | Propósito de la liberación (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `startedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `outcome` | Sí | `string` | valores: `COMPLETED`, `FAILED` | Sin descripción específica en el contrato OpenAPI. | `COMPLETED` |
| `recordsProcessed` | Sí | `string` | Sin restricción adicional declarada | Registros procesados; cadena por ser bigint | `5000` |
| `consentDirectiveId` | No | `string` | formato `uuid` | Directiva de consentimiento que autoriza el propósito | `00000000-0000-4000-8000-000000000001` |
| `inputManifestFileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `outputManifestFileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `recordsRejected` | No | `string` | Sin restricción adicional declarada | Cadena por ser bigint | `3` |
| `verificationSummaryJson` | No | `object` | Sin restricción adicional declarada | Resultado de la verificación de re-identificación | `{}` |
| `sourceVersionIds` | No | `array<string>` | formato `uuid` | Versiones canónicas de las que salió la salida | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-data/deidentification-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "healthDeidentificationProfileId": "00000000-0000-4000-8000-000000000001",
  "purposeConceptId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "outcome": "COMPLETED",
  "recordsProcessed": "5000",
  "consentDirectiveId": "00000000-0000-4000-8000-000000000001",
  "inputManifestFileId": "00000000-0000-4000-8000-000000000001",
  "outputManifestFileId": "00000000-0000-4000-8000-000000000001",
  "recordsRejected": "3",
  "verificationSummaryJson": {},
  "sourceVersionIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DeidRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeidRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeidRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeidRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeidRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeidRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeidRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeidRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeidRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeidRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "provenanceRecordId": "00000000-0000-4000-8000-000000000001",
  "lineageEdgeCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `provenanceRecordId` | Sí | `string` | formato `uuid` | Procedencia registrada de la de-identificación | `00000000-0000-4000-8000-000000000001` |
| `lineageEdgeCount` | Sí | `number` | Sin restricción adicional declarada | Aristas de linaje versión → manifiesto de salida | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRIVACY_OFFICER, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Perfil de de-identificación no encontrado | Excepción explícita en src/modules/health_data/services/data-release.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El perfil de de-identificación no está activo | Excepción explícita en src/modules/health_data/services/data-release.service.ts |
| 422 | `PRECONDITION_FAILED` | Una corrida completada debe declarar su manifiesto de salida | Excepción explícita en src/modules/health_data/services/data-release.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-data/deidentification-runs"
}
```

---

## 9. POST /health-data/identity/candidates/{id}/decision

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `health-data`
- **Nombre:** Resolver un candidato de identidad longitudinal
- **Operation ID:** `HealthDataController_resolveCandidate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthDataController.resolveCandidate](../../src/modules/health_data/controllers/health-data.controller.ts)

### Descripción de negocio

Nunca hay fusión automática: siempre decide una persona.


### Descripción del sistema

NestJS resuelve `POST /health-data/identity/candidates/{id}/decision` en `HealthDataController_resolveCandidate`. El controlador delega en `PatientIdentityService.resolveCandidate`. Valida el body como `ResolveMatchCandidateDto` y consume `application/json`. El tipo de retorno estático es `Promise<MatchDecisionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ResolveMatchCandidateDto`; los campos opcionales se omiten.

```http
POST /health-data/identity/candidates/00000000-0000-4000-8000-000000000001/decision HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "MATCH",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MPI_STEWARD`, `HEALTH_DATA_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `MATCH`, `NO_MATCH` | Sin descripción específica en el contrato OpenAPI. | `MATCH` |
| `reasonText` | Sí | `string` | Sin restricción adicional declarada | Por qué se decide así | `Texto descriptivo de ejemplo` |
| `evidenceJson` | No | `object` | Sin restricción adicional declarada | Evidencia en la que se apoya la decisión | `{}` |
| `memberRoleConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-data/identity/candidates/00000000-0000-4000-8000-000000000001/decision HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "MATCH",
  "reasonText": "Texto descriptivo de ejemplo",
  "evidenceJson": {},
  "memberRoleConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MatchDecisionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MatchDecisionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MatchDecisionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MatchDecisionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MatchDecisionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MatchDecisionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MatchDecisionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MatchDecisionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MatchDecisionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MatchDecisionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MatchDecisionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "candidateStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "clusterId": "00000000-0000-4000-8000-000000000001",
  "clusterCreated": true,
  "addedMemberIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `candidateStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a candidate status concept. | `00000000-0000-4000-8000-000000000001` |
| `clusterId` | No | `string` | formato `uuid` | Clúster en el que quedan los dos perfiles | `00000000-0000-4000-8000-000000000001` |
| `clusterCreated` | Sí | `boolean` | Sin restricción adicional declarada | true si el clúster se creó en esta decisión | `true` |
| `addedMemberIds` | Sí | `array<string>` | formato `uuid` | Miembros añadidos al clúster | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MPI_STEWARD, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Candidato no encontrado | Excepción explícita en src/modules/health_data/services/patient-identity.service.ts |
| 409 | `CONFLICT` | El candidato ya tiene decisión | Excepción explícita en src/modules/health_data/services/patient-identity.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El candidato ya está resuelto | Excepción explícita en src/modules/health_data/services/patient-identity.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-data/identity/candidates/{id}/decision"
}
```

---

## 10. POST /health-data/ingestion-batches

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `health-data`
- **Nombre:** Abrir un lote de ingesta desde una conexión de origen
- **Operation ID:** `HealthDataController_openBatch`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthDataController.openBatch](../../src/modules/health_data/controllers/health-data.controller.ts)

### Descripción de negocio

El mismo identificador en la misma conexión es el mismo lote: no se reabre.


### Descripción del sistema

NestJS resuelve `POST /health-data/ingestion-batches` en `HealthDataController_openBatch`. El controlador delega en `HealthIngestionService.openBatch`. Valida el body como `OpenIngestionBatchDto` y consume `application/json`. El tipo de retorno estático es `Promise<IngestionBatchResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `OpenIngestionBatchDto`; los campos opcionales se omiten.

```http
POST /health-data/ingestion-batches HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "healthSourceConnectionId": "00000000-0000-4000-8000-000000000001",
  "batchIdentifier": "valor-ejemplo",
  "ingestionModeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INGESTION_WORKER`, `HEALTH_DATA_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `healthSourceConnectionId` | Sí | `string` | formato `uuid` | Conexión de origen que trae el lote | `00000000-0000-4000-8000-000000000001` |
| `batchIdentifier` | Sí | `string` | longitud máxima 200 | Identificador del lote en el origen | `valor-ejemplo` |
| `ingestionModeConceptId` | Sí | `string` | formato `uuid` | Modo de ingesta (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sourcePeriodStart` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `sourcePeriodEnd` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `payloadManifestFileId` | No | `string` | formato `uuid` | Manifiesto del payload en almacenamiento | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-data/ingestion-batches HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "healthSourceConnectionId": "00000000-0000-4000-8000-000000000001",
  "batchIdentifier": "valor-ejemplo",
  "ingestionModeConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourcePeriodStart": "2026-07-31T12:00:00.000Z",
  "sourcePeriodEnd": "2026-07-31T12:00:00.000Z",
  "payloadManifestFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IngestionBatchResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IngestionBatchResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IngestionBatchResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IngestionBatchResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IngestionBatchResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IngestionBatchResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IngestionBatchResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IngestionBatchResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IngestionBatchResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IngestionBatchResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "batchIdentifier": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `batchIdentifier` | Sí | `string` | Sin restricción adicional declarada | Valor de batch identifier mantenido por la instancia. | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si el lote ya existía y se devuelve el mismo | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INGESTION_WORKER, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Conexión de origen no encontrada | Excepción explícita en src/modules/health_data/services/health-ingestion.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La conexión de origen no está activa | Excepción explícita en src/modules/health_data/services/health-ingestion.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-data/ingestion-batches"
}
```

---

## 11. POST /health-data/ingestion-batches/{id}/close

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `health-data`
- **Nombre:** Cerrar el lote conciliando sus contadores
- **Operation ID:** `HealthDataController_closeBatch`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthDataController.closeBatch](../../src/modules/health_data/controllers/health-data.controller.ts)

### Descripción de negocio

Los contadores se cuentan contra la tabla de registros.


### Descripción del sistema

NestJS resuelve `POST /health-data/ingestion-batches/{id}/close` en `HealthDataController_closeBatch`. El controlador delega en `HealthIngestionService.closeBatch`. Valida el body como `CloseIngestionBatchDto` y consume `application/json`. El tipo de retorno estático es `Promise<CloseBatchResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CloseIngestionBatchDto`; los campos opcionales se omiten.

```http
POST /health-data/ingestion-batches/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INGESTION_WORKER`, `HEALTH_DATA_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `contentHash` | No | `string` | longitud máxima 200 | Hash del contenido completo del lote | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `recordsRejected` | No | `number` | mínimo 0 | Registros que el origen rechazó antes de llegar | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-data/ingestion-batches/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "recordsRejected": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CloseBatchResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CloseBatchResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CloseBatchResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CloseBatchResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CloseBatchResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CloseBatchResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CloseBatchResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CloseBatchResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CloseBatchResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CloseBatchResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CloseBatchResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "recordsReceived": "valor-ejemplo",
  "recordsAccepted": "valor-ejemplo",
  "recordsRejected": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `recordsReceived` | Sí | `string` | Sin restricción adicional declarada | Registros recibidos, contados contra la tabla; cadena por ser bigint | `valor-ejemplo` |
| `recordsAccepted` | Sí | `string` | Sin restricción adicional declarada | Cadena por ser bigint | `valor-ejemplo` |
| `recordsRejected` | Sí | `string` | Sin restricción adicional declarada | Cadena por ser bigint | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INGESTION_WORKER, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Lote no encontrado | Excepción explícita en src/modules/health_data/services/health-ingestion.service.ts |
| 409 | `CONFLICT` | El lote ya está cerrado | Excepción explícita en src/modules/health_data/services/health-ingestion.service.ts |
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
  "path": "/health-data/ingestion-batches/{id}/close"
}
```

---

## 12. POST /health-data/ingestion-batches/{id}/records

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `health-data`
- **Nombre:** Registrar un registro crudo del lote
- **Operation ID:** `HealthDataController_recordIngestionRecord`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthDataController.recordIngestionRecord](../../src/modules/health_data/controllers/health-data.controller.ts)

### Descripción de negocio

Se deduplica por lote, identificador de origen y versión de origen.


### Descripción del sistema

NestJS resuelve `POST /health-data/ingestion-batches/{id}/records` en `HealthDataController_recordIngestionRecord`. El controlador delega en `HealthIngestionService.recordIngestionRecord`. Valida el body como `RecordIngestionRecordDto` y consume `application/json`. El tipo de retorno estático es `Promise<IngestionRecordResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordIngestionRecordDto`; los campos opcionales se omiten.

```http
POST /health-data/ingestion-batches/00000000-0000-4000-8000-000000000001/records HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceRecordIdentifier": "valor-ejemplo",
  "resourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "payloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INGESTION_WORKER`, `HEALTH_DATA_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sourceRecordIdentifier` | Sí | `string` | longitud máxima 300 | Identificador del registro en el origen | `valor-ejemplo` |
| `resourceTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de recurso (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `payloadHash` | Sí | `string` | longitud máxima 200 | Hash del payload; detecta que nada cambió | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `sourceVersion` | No | `string` | longitud máxima 100 | Versión del registro en el origen | `valor-ejemplo` |
| `sourceLastUpdatedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `payloadFileId` | No | `string` | formato `uuid` | Payload persistido en almacenamiento | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-data/ingestion-batches/00000000-0000-4000-8000-000000000001/records HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceRecordIdentifier": "valor-ejemplo",
  "resourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "payloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "sourceVersion": "valor-ejemplo",
  "sourceLastUpdatedAt": "2026-07-31T12:00:00.000Z",
  "payloadFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IngestionRecordResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IngestionRecordResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IngestionRecordResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IngestionRecordResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IngestionRecordResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IngestionRecordResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IngestionRecordResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IngestionRecordResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IngestionRecordResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IngestionRecordResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IngestionRecordResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "processingStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `processingStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a processing status concept. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si el registro ya estaba en el lote | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INGESTION_WORKER, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Lote no encontrado | Excepción explícita en src/modules/health_data/services/health-ingestion.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El lote ya no está recibiendo registros | Excepción explícita en src/modules/health_data/services/health-ingestion.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-data/ingestion-batches/{id}/records"
}
```

---

## 13. POST /health-data/quality-runs

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `health-data`
- **Nombre:** Ejecutar reglas de calidad y abrir incidencias
- **Operation ID:** `HealthDataController_recordQualityRun`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthDataController.recordQualityRun](../../src/modules/health_data/controllers/health-data.controller.ts)

### Descripción de negocio

Una incidencia idéntica ya abierta no se duplica.


### Descripción del sistema

NestJS resuelve `POST /health-data/quality-runs` en `HealthDataController_recordQualityRun`. El controlador delega en `HealthValidationService.recordQualityRun`. Valida el body como `RecordQualityRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<QualityRunResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordQualityRunDto`; los campos opcionales se omiten.

```http
POST /health-data/quality-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "healthDataQualityRuleSetId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "recordsEvaluated": "1200"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_STEWARD`, `HEALTH_DATA_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `healthDataQualityRuleSetId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `startedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `recordsEvaluated` | Sí | `string` | Sin restricción adicional declarada | Registros evaluados; cadena por ser bigint | `1200` |
| `healthIngestionBatchId` | No | `string` | formato `uuid` | Ámbito: lote de ingesta | `00000000-0000-4000-8000-000000000001` |
| `canonicalResourceId` | No | `string` | formato `uuid` | Ámbito: recurso canónico | `00000000-0000-4000-8000-000000000001` |
| `findings` | No | `array<QualityFindingDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"healthDataQualityRuleId":"00000000-0000-4000-8000-000000000001","canonicalHealthResourceId":"00000000-0000-4000-8000-000000000001","canonicalResourceVersionId":"00000000-0000-4000-8000-000000000001","fieldPath":"valor-ejemplo","observedValueHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]` |
| `findings[].healthDataQualityRuleId` | No | `string` | formato `uuid` | Regla que se incumple | `00000000-0000-4000-8000-000000000001` |
| `findings[].canonicalHealthResourceId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `findings[].canonicalResourceVersionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `findings[].fieldPath` | No | `string` | longitud máxima 500 | Campo afectado | `valor-ejemplo` |
| `findings[].observedValueHash` | No | `string` | longitud máxima 200 | Hash del valor observado; el valor en claro no se guarda | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `summaryJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-data/quality-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "healthDataQualityRuleSetId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "recordsEvaluated": "1200",
  "healthIngestionBatchId": "00000000-0000-4000-8000-000000000001",
  "canonicalResourceId": "00000000-0000-4000-8000-000000000001",
  "findings": [
    {
      "healthDataQualityRuleId": "00000000-0000-4000-8000-000000000001",
      "canonicalHealthResourceId": "00000000-0000-4000-8000-000000000001",
      "canonicalResourceVersionId": "00000000-0000-4000-8000-000000000001",
      "fieldPath": "valor-ejemplo",
      "observedValueHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }
  ],
  "summaryJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `QualityRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "evaluatedRecordCount": "valor-ejemplo",
  "failedRecordCount": "valor-ejemplo",
  "issuesOpened": 1,
  "datasetQuarantined": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `evaluatedRecordCount` | Sí | `string` | Sin restricción adicional declarada | Valor de evaluated record count mantenido por la instancia. | `valor-ejemplo` |
| `failedRecordCount` | Sí | `string` | Sin restricción adicional declarada | Valor de failed record count mantenido por la instancia. | `valor-ejemplo` |
| `issuesOpened` | Sí | `number` | Sin restricción adicional declarada | Hallazgos abiertos | `1` |
| `datasetQuarantined` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si una regla bloqueante puso el dataset en cuarentena | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_STEWARD, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Conjunto de reglas no encontrado | Excepción explícita en src/modules/health_data/services/health-validation.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La corrida necesita un ámbito: lote de ingesta o recurso canónico | Excepción explícita en src/modules/health_data/services/health-validation.service.ts |
| 422 | `PRECONDITION_FAILED` | El conjunto de reglas no está activo | Excepción explícita en src/modules/health_data/services/health-validation.service.ts |
| 422 | `PRECONDITION_FAILED` | El hallazgo apunta a una regla que no está activa en el conjunto | Excepción explícita en src/modules/health_data/services/health-validation.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-data/quality-runs"
}
```

---

## 14. POST /health-data/timeline-entries

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `health-data`
- **Nombre:** Proyectar una entrada de la línea de tiempo del paciente
- **Operation ID:** `HealthDataController_projectTimelineEntry`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthDataController.projectTimelineEntry](../../src/modules/health_data/controllers/health-data.controller.ts)

### Descripción de negocio

Idempotente por entidad de origen y tipo de evento.


### Descripción del sistema

NestJS resuelve `POST /health-data/timeline-entries` en `HealthDataController_projectTimelineEntry`. El controlador delega en `PatientIdentityService.projectTimelineEntry`. Valida el body como `ProjectTimelineEntryDto` y consume `application/json`. El tipo de retorno estático es `Promise<TimelineEntryResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ProjectTimelineEntryDto`; los campos opcionales se omiten.

```http
POST /health-data/timeline-entries HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "eventTime": "2026-07-31T12:00:00.000Z",
  "eventTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "sourceEntityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `HEALTH_DATA_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `eventTime` | Sí | `string` | formato `date-time` | Cuándo ocurrió el evento clínico | `2026-07-31T12:00:00.000Z` |
| `eventTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de evento (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `sourceEntityTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de la entidad de origen (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `sourceEntityId` | Sí | `string` | formato `uuid` | Entidad de origen concreta | `00000000-0000-4000-8000-000000000001` |
| `custodianTenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organizationId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `title` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `summaryRedacted` | No | `string` | Sin restricción adicional declarada | Resumen ya redactado según el consentimiento; nunca el dato clínico en claro | `valor-ejemplo` |
| `clinicalPriorityConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientVisibilityConceptId` | No | `string` | formato `uuid` | Visibilidad para el paciente | `00000000-0000-4000-8000-000000000001` |
| `securityLabelsJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-data/timeline-entries HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "eventTime": "2026-07-31T12:00:00.000Z",
  "eventTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "sourceEntityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "organizationId": "00000000-0000-4000-8000-000000000001",
  "title": "valor-ejemplo",
  "summaryRedacted": "valor-ejemplo",
  "clinicalPriorityConceptId": "00000000-0000-4000-8000-000000000001",
  "patientVisibilityConceptId": "00000000-0000-4000-8000-000000000001",
  "securityLabelsJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TimelineEntryResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TimelineEntryResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TimelineEntryResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TimelineEntryResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TimelineEntryResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TimelineEntryResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TimelineEntryResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TimelineEntryResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TimelineEntryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TimelineEntryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si la entrada ya existía para esa entidad y evento | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/health-data/timeline-entries"
}
```

---

## 15. POST /health-data/versions/{id}/validate

- **Módulo:** `health_data`
- **Etiqueta OpenAPI:** `health-data`
- **Nombre:** Validar la versión contra un perfil FHIR R5
- **Operation ID:** `HealthDataController_validateVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthDataController.validateVersion](../../src/modules/health_data/controllers/health-data.controller.ts)

### Descripción de negocio

El resultado se deriva de las severidades; un error manda el recurso a cuarentena.


### Descripción del sistema

NestJS resuelve `POST /health-data/versions/{id}/validate` en `HealthDataController_validateVersion`. El controlador delega en `HealthValidationService.validateVersion`. Valida el body como `ValidateVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ValidationRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ValidateVersionDto`; los campos opcionales se omiten.

```http
POST /health-data/versions/00000000-0000-4000-8000-000000000001/validate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fhirProfileVersionId": "00000000-0000-4000-8000-000000000001",
  "validatorVersion": "valor-ejemplo",
  "startedAt": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INGESTION_WORKER`, `HEALTH_DATA_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fhirProfileVersionId` | Sí | `string` | formato `uuid` | Versión del perfil FHIR contra la que se valida | `00000000-0000-4000-8000-000000000001` |
| `validatorVersion` | Sí | `string` | longitud máxima 100 | Versión del validador que produjo el resultado | `valor-ejemplo` |
| `startedAt` | Sí | `string` | formato `date-time` | Cuándo empezó la validación | `2026-07-31T12:00:00.000Z` |
| `issues` | No | `array<ValidationIssueDto>` | Sin restricción adicional declarada | Hallazgos del validador | `[{"severity":"FATAL","issueCode":"CODIGO_EJEMPLO","expressionPath":"valor-ejemplo","diagnosticsText":"valor-ejemplo","locationJson":{}}]` |
| `issues[].severity` | No | `string` | valores: `FATAL`, `ERROR`, `WARNING`, `INFORMATION` | Sin descripción específica en el contrato OpenAPI. | `FATAL` |
| `issues[].issueCode` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `issues[].expressionPath` | No | `string` | longitud máxima 500 | Ruta FHIRPath del hallazgo | `valor-ejemplo` |
| `issues[].diagnosticsText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `issues[].locationJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `summaryJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-data/versions/00000000-0000-4000-8000-000000000001/validate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fhirProfileVersionId": "00000000-0000-4000-8000-000000000001",
  "validatorVersion": "valor-ejemplo",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "issues": [
    {
      "severity": "FATAL",
      "issueCode": "CODIGO_EJEMPLO",
      "expressionPath": "valor-ejemplo",
      "diagnosticsText": "valor-ejemplo",
      "locationJson": {}
    }
  ],
  "summaryJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ValidationRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ValidationRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ValidationRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ValidationRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ValidationRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ValidationRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ValidationRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ValidationRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ValidationRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ValidationRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ValidationRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "resultConceptId": "00000000-0000-4000-8000-000000000001",
  "issueCount": 1,
  "quarantined": true,
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `resultConceptId` | Sí | `string` | formato `uuid` | Resultado derivado de las severidades halladas | `00000000-0000-4000-8000-000000000001` |
| `issueCount` | Sí | `number` | Sin restricción adicional declarada | Valor de issue count mantenido por la instancia. | `1` |
| `quarantined` | Sí | `boolean` | Sin restricción adicional declarada | true si el recurso quedó en cuarentena | `true` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si esa validación ya se había corrido | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INGESTION_WORKER, HEALTH_DATA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión canónica no encontrada | Excepción explícita en src/modules/health_data/services/health-validation.service.ts |
| 404 | `NOT_FOUND` | Versión del perfil FHIR no encontrada | Excepción explícita en src/modules/health_data/services/health-validation.service.ts |
| 404 | `NOT_FOUND` | Recurso canónico no encontrado | Excepción explícita en src/modules/health_data/services/health-validation.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La versión del perfil no está activa | Excepción explícita en src/modules/health_data/services/health-validation.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-data/versions/{id}/validate"
}
```

---

