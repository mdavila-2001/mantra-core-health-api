<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `object_storage`

Referencia exhaustiva de 13 operación(es) del módulo `object_storage`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `dicomweb`, `object-storage`
- **Controladores:** `DicomWebController`, `ObjectStorageController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid}](#1-get-dicomweb-studies-studyuid-series-seriesuid-instances-sopuid) — Resolver una instancia DICOM y registrar el acceso (WADO-RS)
2. [POST /object-storage/archive-jobs/build](#2-post-object-storage-archive-jobs-build) — Archivar el objeto a almacenamiento frío
3. [POST /object-storage/dicom/studies/catalog](#3-post-object-storage-dicom-studies-catalog) — Catalogar la jerarquía DICOM estudio/serie/instancia
4. [POST /object-storage/large-payloads](#4-post-object-storage-large-payloads) — Registrar un payload grande y vincularlo a su entidad de origen
5. [POST /object-storage/namespaces/{code}/uploads/initiate](#5-post-object-storage-namespaces-code-uploads-initiate) — Iniciar una carga multiparte
6. [POST /object-storage/objects/{manifestId}/request-deletion](#6-post-object-storage-objects-manifestid-request-deletion) — Solicitar el borrado gobernado
7. [POST /object-storage/objects/{manifestId}/versions](#7-post-object-storage-objects-manifestid-versions) — Crear una versión nueva del objeto
8. [POST /object-storage/uploads/{id}/complete](#8-post-object-storage-uploads-id-complete) — Completar la carga y materializar la versión del objeto
9. [POST /object-storage/versions/{versionId}/integrity-checks](#9-post-object-storage-versions-versionid-integrity-checks) — Registrar la verificación de integridad
10. [POST /object-storage/versions/{versionId}/legal-holds](#10-post-object-storage-versions-versionid-legal-holds) — Colocar una retención legal
11. [DELETE /object-storage/versions/{versionId}/legal-holds/{holdId}](#11-delete-object-storage-versions-versionid-legal-holds-holdid) — Liberar una retención legal
12. [POST /object-storage/versions/{versionId}/retention-lock](#12-post-object-storage-versions-versionid-retention-lock) — Aplicar retención WORM sobre la versión
13. [POST /object-storage/versions/{versionId}/signed-url](#13-post-object-storage-versions-versionid-signed-url) — Emitir acceso firmado a una versión

---

## 1. GET /dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid}

- **Módulo:** `object_storage`
- **Etiqueta OpenAPI:** `dicomweb`
- **Nombre:** Resolver una instancia DICOM y registrar el acceso (WADO-RS)
- **Operation ID:** `DicomWebController_resolveInstance`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DicomWebController.resolveInstance](../../src/modules/object_storage/controllers/dicomweb.controller.ts)

### Descripción de negocio

El intento denegado también se registra: un log que sólo guarda los accesos correctos no sirve para vigilar los indebidos.


### Descripción del sistema

NestJS resuelve `GET /dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid}` en `DicomWebController_resolveInstance`. El controlador delega en `DicomCatalogService.resolveInstance`. No recibe body. El tipo de retorno estático es `Promise<DicomInstanceAccessResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `studyUid` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `seriesUid` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sopUid` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `purposeOfUse` | query | No | `string` | Sin restricción adicional declarada | Propósito de uso; sin él el acceso se deniega y queda registrado | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /dicomweb/studies/00000000-0000-4000-8000-000000000001/series/00000000-0000-4000-8000-000000000001/instances/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DICOM_VIEWER`, `CLINICIAN`, `STORAGE_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /dicomweb/studies/00000000-0000-4000-8000-000000000001/series/00000000-0000-4000-8000-000000000001/instances/00000000-0000-4000-8000-000000000001?purposeOfUse=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DicomInstanceAccessResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<DicomInstanceAccessResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DicomInstanceAccessResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DicomInstanceAccessResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<DicomInstanceAccessResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DicomInstanceAccessResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DicomInstanceAccessResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DicomInstanceAccessResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "accessLogId": "00000000-0000-4000-8000-000000000001",
  "outcome": "valor-ejemplo",
  "objectManifestId": "00000000-0000-4000-8000-000000000001",
  "currentVersionId": "00000000-0000-4000-8000-000000000001",
  "denialReason": "Texto descriptivo de ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `accessLogId` | Sí | `string` | formato `uuid` | Registro del acceso | `00000000-0000-4000-8000-000000000001` |
| `outcome` | Sí | `string` | Sin restricción adicional declarada | Valor de outcome mantenido por la instancia. | `valor-ejemplo` |
| `objectManifestId` | No | `string` | formato `uuid` | Objeto que contiene el píxel | `00000000-0000-4000-8000-000000000001` |
| `currentVersionId` | No | `string` | formato `uuid` | Versión vigente del objeto | `00000000-0000-4000-8000-000000000001` |
| `denialReason` | No | `string` | Sin restricción adicional declarada | Por qué se denegó | `Texto descriptivo de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DICOM_VIEWER, CLINICIAN, STORAGE_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid}"
}
```

---

## 2. POST /object-storage/archive-jobs/build

- **Módulo:** `object_storage`
- **Etiqueta OpenAPI:** `object-storage`
- **Nombre:** Archivar el objeto a almacenamiento frío
- **Operation ID:** `ObjectStorageController_buildArchiveJob`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ObjectStorageController.buildArchiveJob](../../src/modules/object_storage/controllers/object-storage.controller.ts)

### Descripción de negocio

Una retención legal viva impide degradar la clase.


### Descripción del sistema

NestJS resuelve `POST /object-storage/archive-jobs/build` en `ObjectStorageController_buildArchiveJob`. El controlador delega en `ObjectGovernanceService.buildArchiveJob`. Valida el body como `BuildArchiveJobDto` y consume `application/json`. El tipo de retorno estático es `Promise<ArchiveJobResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BuildArchiveJobDto`; los campos opcionales se omiten.

```http
POST /object-storage/archive-jobs/build HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "objectManifestId": "00000000-0000-4000-8000-000000000001",
  "archiveType": "valor-ejemplo",
  "archiveNamespaceId": "00000000-0000-4000-8000-000000000001",
  "manifestHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "providerUri": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `STORAGE_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `objectManifestId` | Sí | `string` | formato `uuid` | Objeto que se archiva | `00000000-0000-4000-8000-000000000001` |
| `archiveType` | Sí | `string` | longitud máxima 100 | Naturaleza del archivado | `valor-ejemplo` |
| `archiveNamespaceId` | Sí | `string` | formato `uuid` | Espacio frío de destino | `00000000-0000-4000-8000-000000000001` |
| `manifestHash` | Sí | `string` | longitud máxima 200 | Hash del lote; lo hace idempotente | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `providerUri` | Sí | `string` | Sin restricción adicional declarada | URI de la copia fría | `valor-ejemplo` |
| `sourceScopeJson` | No | `object` | Sin restricción adicional declarada | Qué entra en el lote | `{}` |
| `storageClass` | No | `string` | longitud máxima 100 | Clase fría de destino | `glacier` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /object-storage/archive-jobs/build HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "objectManifestId": "00000000-0000-4000-8000-000000000001",
  "archiveType": "valor-ejemplo",
  "archiveNamespaceId": "00000000-0000-4000-8000-000000000001",
  "manifestHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "providerUri": "valor-ejemplo",
  "sourceScopeJson": {},
  "storageClass": "glacier"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ArchiveJobResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "objectManifestId": "00000000-0000-4000-8000-000000000001",
  "recordCount": "valor-ejemplo",
  "lifecycleState": "valor-ejemplo",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `objectManifestId` | Sí | `string` | formato `uuid` | Identificador asociado a object manifest. | `00000000-0000-4000-8000-000000000001` |
| `recordCount` | Sí | `string` | Sin restricción adicional declarada | Versiones movidas a frío; cadena por ser bigint | `valor-ejemplo` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Ciclo de vida en el que queda el objeto | `valor-ejemplo` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si ese lote ya se había archivado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, STORAGE_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto no encontrado | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El objeto no tiene ninguna versión | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión está bajo retención legal: no se puede mover a frío | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/object-storage/archive-jobs/build"
}
```

---

## 3. POST /object-storage/dicom/studies/catalog

- **Módulo:** `object_storage`
- **Etiqueta OpenAPI:** `object-storage`
- **Nombre:** Catalogar la jerarquía DICOM estudio/serie/instancia
- **Operation ID:** `ObjectStorageController_catalogDicomStudy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ObjectStorageController.catalogDicomStudy](../../src/modules/object_storage/controllers/object-storage.controller.ts)

### Descripción de negocio

Reentrante: reenviar el mismo estudio no duplica nada.


### Descripción del sistema

NestJS resuelve `POST /object-storage/dicom/studies/catalog` en `ObjectStorageController_catalogDicomStudy`. El controlador delega en `DicomCatalogService.catalogStudy`. Valida el body como `CatalogDicomStudyDto` y consume `application/json`. El tipo de retorno estático es `Promise<CatalogDicomStudyResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CatalogDicomStudyDto`; los campos opcionales se omiten.

```http
POST /object-storage/dicom/studies/catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "studyInstanceUid": "00000000-0000-4000-8000-000000000001",
  "series": [
    {
      "seriesInstanceUid": "00000000-0000-4000-8000-000000000001",
      "instances": [
        {
          "sopInstanceUid": "00000000-0000-4000-8000-000000000001",
          "objectManifestId": "00000000-0000-4000-8000-000000000001"
        }
      ]
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PACS_GATEWAY`, `SYSTEM`, `STORAGE_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `studyInstanceUid` | Sí | `string` | longitud máxima 200 | Study Instance UID | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `imagingStudyId` | No | `string` | formato `uuid` | Estudio en el módulo de diagnóstico | `00000000-0000-4000-8000-000000000001` |
| `accessionNumber` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `studyDate` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `series` | Sí | `array<DicomSeriesDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"seriesInstanceUid":"00000000-0000-4000-8000-000000000001","modality":"valor-ejemplo","seriesNumber":1,"bodyPartExamined":"valor-ejemplo","thumbnailObjectManifestId":"00000000-0000-4000-8000-000000000001","instances":[{"sopInstanceUid":"00000000-0000-4000-8000-000000000001","objectManifestId":"00000000-0000-4000-8000-000000000001","sopClassUid":"00000000-0000-4000-8000-000000000001","instanceNumber":1,"transferSyntaxUid":"00000000-0000-4000-8000-000000000001","frameCount":1,"metadataJson":{}}]}]` |
| `series[].seriesInstanceUid` | Sí | `string` | longitud máxima 200 | Series Instance UID | `00000000-0000-4000-8000-000000000001` |
| `series[].modality` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `series[].seriesNumber` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `series[].bodyPartExamined` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `series[].thumbnailObjectManifestId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `series[].instances` | Sí | `array<DicomInstanceDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"sopInstanceUid":"00000000-0000-4000-8000-000000000001","objectManifestId":"00000000-0000-4000-8000-000000000001","sopClassUid":"00000000-0000-4000-8000-000000000001","instanceNumber":1,"transferSyntaxUid":"00000000-0000-4000-8000-000000000001","frameCount":1,"metadataJson":{}}]` |
| `series[].instances[].sopInstanceUid` | Sí | `string` | longitud máxima 200 | SOP Instance UID | `00000000-0000-4000-8000-000000000001` |
| `series[].instances[].objectManifestId` | Sí | `string` | formato `uuid` | Objeto ya materializado con el píxel | `00000000-0000-4000-8000-000000000001` |
| `series[].instances[].sopClassUid` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `series[].instances[].instanceNumber` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `series[].instances[].transferSyntaxUid` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `series[].instances[].frameCount` | No | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `series[].instances[].metadataJson` | No | `object` | Sin restricción adicional declarada | Metadatos DICOM sin identificadores directos | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /object-storage/dicom/studies/catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "studyInstanceUid": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "imagingStudyId": "00000000-0000-4000-8000-000000000001",
  "accessionNumber": "valor-ejemplo",
  "studyDate": "2026-07-31T12:00:00.000Z",
  "series": [
    {
      "seriesInstanceUid": "00000000-0000-4000-8000-000000000001",
      "modality": "valor-ejemplo",
      "seriesNumber": 1,
      "bodyPartExamined": "valor-ejemplo",
      "thumbnailObjectManifestId": "00000000-0000-4000-8000-000000000001",
      "instances": [
        {
          "sopInstanceUid": "00000000-0000-4000-8000-000000000001",
          "objectManifestId": "00000000-0000-4000-8000-000000000001",
          "sopClassUid": "00000000-0000-4000-8000-000000000001",
          "instanceNumber": 1,
          "transferSyntaxUid": "00000000-0000-4000-8000-000000000001",
          "frameCount": 1,
          "metadataJson": {}
        }
      ]
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CatalogDicomStudyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CatalogDicomStudyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CatalogDicomStudyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CatalogDicomStudyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CatalogDicomStudyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CatalogDicomStudyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CatalogDicomStudyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CatalogDicomStudyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CatalogDicomStudyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CatalogDicomStudyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "studyId": "00000000-0000-4000-8000-000000000001",
  "studyInstanceUid": "00000000-0000-4000-8000-000000000001",
  "seriesCount": 1,
  "instanceCount": 1,
  "instancesAdded": 1,
  "instancesSkipped": 1,
  "studyCreated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `studyId` | Sí | `string` | formato `uuid` | Identificador asociado a study. | `00000000-0000-4000-8000-000000000001` |
| `studyInstanceUid` | Sí | `string` | Sin restricción adicional declarada | Valor de study instance uid mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `seriesCount` | Sí | `number` | Sin restricción adicional declarada | Series del estudio tras catalogar | `1` |
| `instanceCount` | Sí | `number` | Sin restricción adicional declarada | Instancias del estudio tras catalogar | `1` |
| `instancesAdded` | Sí | `number` | Sin restricción adicional declarada | Instancias nuevas registradas en esta llamada | `1` |
| `instancesSkipped` | Sí | `number` | Sin restricción adicional declarada | Instancias que ya estaban catalogadas | `1` |
| `studyCreated` | Sí | `boolean` | Sin restricción adicional declarada | true si el estudio se creó en esta llamada | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PACS_GATEWAY, SYSTEM, STORAGE_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El objeto de la instancia no existe | Excepción explícita en src/modules/object_storage/services/dicom-catalog.service.ts |
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
  "path": "/object-storage/dicom/studies/catalog"
}
```

---

## 4. POST /object-storage/large-payloads

- **Módulo:** `object_storage`
- **Etiqueta OpenAPI:** `object-storage`
- **Nombre:** Registrar un payload grande y vincularlo a su entidad de origen
- **Operation ID:** `ObjectStorageController_registerLargePayload`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ObjectStorageController.registerLargePayload](../../src/modules/object_storage/controllers/object-storage.controller.ts)

### Descripción de negocio

Un payload por origen y tipo.


### Descripción del sistema

NestJS resuelve `POST /object-storage/large-payloads` en `ObjectStorageController_registerLargePayload`. El controlador delega en `ObjectStorageService.registerLargePayload`. Valida el body como `RegisterLargePayloadDto` y consume `application/json`. El tipo de retorno estático es `Promise<LargePayloadResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterLargePayloadDto`; los campos opcionales se omiten.

```http
POST /object-storage/large-payloads HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "objectManifestId": "00000000-0000-4000-8000-000000000001",
  "payloadType": "valor-ejemplo",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "containsPhi": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `STORAGE_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `objectManifestId` | Sí | `string` | formato `uuid` | Objeto ya materializado | `00000000-0000-4000-8000-000000000001` |
| `payloadType` | Sí | `string` | longitud máxima 100 | Naturaleza del payload | `valor-ejemplo` |
| `sourceEntityType` | Sí | `string` | longitud máxima 100 | Entidad de origen | `valor-ejemplo` |
| `sourceEntityId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `contentHash` | Sí | `string` | longitud máxima 200 | Hash del contenido | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `containsPhi` | Sí | `boolean` | Sin restricción adicional declarada | Si lleva datos de paciente; gobierna su tratamiento | `true` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /object-storage/large-payloads HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "objectManifestId": "00000000-0000-4000-8000-000000000001",
  "payloadType": "valor-ejemplo",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "containsPhi": true,
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<LargePayloadResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LargePayloadResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LargePayloadResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LargePayloadResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LargePayloadResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LargePayloadResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LargePayloadResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LargePayloadResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LargePayloadResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LargePayloadResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "objectManifestId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `objectManifestId` | Sí | `string` | formato `uuid` | Identificador asociado a object manifest. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si ese origen y tipo ya estaban registrados | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, STORAGE_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto no encontrado | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
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
  "path": "/object-storage/large-payloads"
}
```

---

## 5. POST /object-storage/namespaces/{code}/uploads/initiate

- **Módulo:** `object_storage`
- **Etiqueta OpenAPI:** `object-storage`
- **Nombre:** Iniciar una carga multiparte
- **Operation ID:** `ObjectStorageController_initiateUpload`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ObjectStorageController.initiateUpload](../../src/modules/object_storage/controllers/object-storage.controller.ts)

### Descripción de negocio

La clave de destino es opaca: no debe llevar datos del paciente.


### Descripción del sistema

NestJS resuelve `POST /object-storage/namespaces/{code}/uploads/initiate` en `ObjectStorageController_initiateUpload`. El controlador delega en `ObjectStorageService.initiateUpload`. Valida el body como `InitiateUploadDto` y consume `application/json`. El tipo de retorno estático es `Promise<UploadResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `code` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `InitiateUploadDto`; los campos opcionales se omiten.

```http
POST /object-storage/namespaces/CODIGO_EJEMPLO/uploads/initiate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "providerUploadId": "00000000-0000-4000-8000-000000000001",
  "targetObjectKey": "valor-ejemplo",
  "expectedSizeBytes": "10485760"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `STORAGE_CLIENT`, `SYSTEM`, `STORAGE_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `providerUploadId` | Sí | `string` | longitud máxima 300 | Identificador de la carga en el proveedor | `00000000-0000-4000-8000-000000000001` |
| `targetObjectKey` | Sí | `string` | longitud máxima 500 | Clave de destino. Opaca: no debe llevar datos del paciente. | `valor-ejemplo` |
| `expectedSizeBytes` | Sí | `string` | Sin restricción adicional declarada | Tamaño esperado en bytes; cadena por ser bigint | `10485760` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `expiresAt` | No | `string` | formato `date-time` | Cuándo caduca la carga a medias | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /object-storage/namespaces/CODIGO_EJEMPLO/uploads/initiate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "providerUploadId": "00000000-0000-4000-8000-000000000001",
  "targetObjectKey": "valor-ejemplo",
  "expectedSizeBytes": "10485760",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<UploadResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<UploadResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<UploadResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<UploadResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<UploadResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<UploadResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<UploadResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<UploadResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<UploadResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<UploadResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `UploadResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "namespaceId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `namespaceId` | Sí | `string` | formato `uuid` | Identificador asociado a namespace. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si esa carga del proveedor ya estaba iniciada | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: STORAGE_CLIENT, SYSTEM, STORAGE_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Espacio de nombres no encontrado | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El espacio de nombres no está activo | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/object-storage/namespaces/{code}/uploads/initiate"
}
```

---

## 6. POST /object-storage/objects/{manifestId}/request-deletion

- **Módulo:** `object_storage`
- **Etiqueta OpenAPI:** `object-storage`
- **Nombre:** Solicitar el borrado gobernado
- **Operation ID:** `ObjectStorageController_requestDeletion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ObjectStorageController.requestDeletion](../../src/modules/object_storage/controllers/object-storage.controller.ts)

### Descripción de negocio

Retención legal y retención de cumplimiento vigente lo abortan.


### Descripción del sistema

NestJS resuelve `POST /object-storage/objects/{manifestId}/request-deletion` en `ObjectStorageController_requestDeletion`. El controlador delega en `ObjectGovernanceService.requestDeletion`. Valida el body como `ObjectStorageRequestDeletionDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeletionMarkerResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `manifestId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ObjectStorageRequestDeletionDto`; los campos opcionales se omiten.

```http
POST /object-storage/objects/00000000-0000-4000-8000-000000000001/request-deletion HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `COMPLIANCE_OFFICER`, `STORAGE_ADMIN`.
- Deben ser UUID válidos: `manifestId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | Sin restricción adicional declarada | Por qué se borra | `Texto descriptivo de ejemplo` |
| `requestedByJobId` | No | `string` | formato `uuid` | Job que ejecutará el borrado | `00000000-0000-4000-8000-000000000001` |
| `effectiveAt` | No | `string` | formato `date-time` | Cuándo se hace efectivo | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /object-storage/objects/00000000-0000-4000-8000-000000000001/request-deletion HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo",
  "requestedByJobId": "00000000-0000-4000-8000-000000000001",
  "effectiveAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DeletionMarkerResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeletionMarkerResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeletionMarkerResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeletionMarkerResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DeletionMarkerResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeletionMarkerResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeletionMarkerResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeletionMarkerResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeletionMarkerResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeletionMarkerResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeletionMarkerResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "objectManifestId": "00000000-0000-4000-8000-000000000001",
  "lifecycleState": "valor-ejemplo",
  "verificationStatus": "valor-ejemplo",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `objectManifestId` | Sí | `string` | formato `uuid` | Identificador asociado a object manifest. | `00000000-0000-4000-8000-000000000001` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Ciclo de vida en el que queda el objeto | `valor-ejemplo` |
| `verificationStatus` | Sí | `string` | Sin restricción adicional declarada | Valor de verification status mantenido por la instancia. | `valor-ejemplo` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si el borrado ya estaba solicitado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: COMPLIANCE_OFFICER, STORAGE_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto no encontrado | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El objeto está bajo retención legal: no se puede borrar | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 422 | `PRECONDITION_FAILED` | El objeto está bajo retención de cumplimiento vigente | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/object-storage/objects/{manifestId}/request-deletion"
}
```

---

## 7. POST /object-storage/objects/{manifestId}/versions

- **Módulo:** `object_storage`
- **Etiqueta OpenAPI:** `object-storage`
- **Nombre:** Crear una versión nueva del objeto
- **Operation ID:** `ObjectStorageController_createVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ObjectStorageController.createVersion](../../src/modules/object_storage/controllers/object-storage.controller.ts)

### Descripción de negocio

Exige versionado habilitado y contenido distinto al vigente.


### Descripción del sistema

NestJS resuelve `POST /object-storage/objects/{manifestId}/versions` en `ObjectStorageController_createVersion`. El controlador delega en `ObjectStorageService.createVersion`. Valida el body como `CreateVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ObjectVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `manifestId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateVersionDto`; los campos opcionales se omiten.

```http
POST /object-storage/objects/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "providerVersionId": "00000000-0000-4000-8000-000000000001",
  "objectKey": "valor-ejemplo",
  "sizeBytes": "valor-ejemplo",
  "etag": "valor-ejemplo",
  "mimeType": "valor-ejemplo",
  "providerUri": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `STORAGE_ADMIN`.
- Deben ser UUID válidos: `manifestId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sha256` | Sí | `string` | patrón runtime `SHA256_PATTERN` | SHA-256 del contenido nuevo | `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb` |
| `providerVersionId` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `objectKey` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sizeBytes` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `etag` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `mimeType` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `providerUri` | Sí | `string` | Sin restricción adicional declarada | URI del objeto en el proveedor | `valor-ejemplo` |
| `compression` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `storageClass` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `encryption` | No | `EncryptionEnvelopeDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"algorithm":"valor-ejemplo","keyManagementProvider":"valor-ejemplo","encryptedDataKey":"valor-ejemplo","keyVersion":"valor-ejemplo","encryptionContextHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}` |
| `encryption.algorithm` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `encryption.keyManagementProvider` | No | `string` | longitud máxima 100 | Proveedor de gestión de claves | `valor-ejemplo` |
| `encryption.encryptedDataKey` | No | `string` | Sin restricción adicional declarada | Clave de datos cifrada. Nunca la clave en claro. | `valor-ejemplo` |
| `encryption.keyVersion` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `encryption.encryptionContextHash` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /object-storage/objects/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "providerVersionId": "00000000-0000-4000-8000-000000000001",
  "objectKey": "valor-ejemplo",
  "sizeBytes": "valor-ejemplo",
  "etag": "valor-ejemplo",
  "mimeType": "valor-ejemplo",
  "providerUri": "valor-ejemplo",
  "compression": "valor-ejemplo",
  "storageClass": "valor-ejemplo",
  "encryption": {
    "algorithm": "valor-ejemplo",
    "keyManagementProvider": "valor-ejemplo",
    "encryptedDataKey": "valor-ejemplo",
    "keyVersion": "valor-ejemplo",
    "encryptionContextHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ObjectVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "manifestId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "manifestCreated": true,
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `manifestId` | Sí | `string` | formato `uuid` | Identificador asociado a manifest. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Identificador asociado a version. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `sha256` | Sí | `string` | Sin restricción adicional declarada | Valor de sha256 mantenido por la instancia. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `manifestCreated` | Sí | `boolean` | Sin restricción adicional declarada | true si el manifiesto se creó en esta operación | `true` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si ese contenido ya estaba versionado y no se duplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, STORAGE_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto no encontrado | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 404 | `NOT_FOUND` | Espacio de nombres no encontrado | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El objeto no está activo | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 422 | `PRECONDITION_FAILED` | El espacio de nombres no tiene versionado habilitado | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/object-storage/objects/{manifestId}/versions"
}
```

---

## 8. POST /object-storage/uploads/{id}/complete

- **Módulo:** `object_storage`
- **Etiqueta OpenAPI:** `object-storage`
- **Nombre:** Completar la carga y materializar la versión del objeto
- **Operation ID:** `ObjectStorageController_completeUpload`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ObjectStorageController.completeUpload](../../src/modules/object_storage/controllers/object-storage.controller.ts)

### Descripción de negocio

El tamaño recibido debe cuadrar con el declarado al iniciar.


### Descripción del sistema

NestJS resuelve `POST /object-storage/uploads/{id}/complete` en `ObjectStorageController_completeUpload`. El controlador delega en `ObjectStorageService.completeUpload`. Valida el body como `CompleteUploadDto` y consume `application/json`. El tipo de retorno estático es `Promise<ObjectVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CompleteUploadDto`; los campos opcionales se omiten.

```http
POST /object-storage/uploads/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "logicalObjectId": "00000000-0000-4000-8000-000000000001",
  "objectType": "valor-ejemplo",
  "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "receivedSizeBytes": "valor-ejemplo",
  "providerVersionId": "00000000-0000-4000-8000-000000000001",
  "etag": "valor-ejemplo",
  "mimeType": "valor-ejemplo",
  "providerUri": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `STORAGE_CLIENT`, `SYSTEM`, `STORAGE_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `logicalObjectId` | Sí | `string` | longitud máxima 300 | Identificador lógico del objeto en el espacio | `00000000-0000-4000-8000-000000000001` |
| `objectType` | Sí | `string` | longitud máxima 100 | Naturaleza del objeto | `valor-ejemplo` |
| `sha256` | Sí | `string` | patrón runtime `SHA256_PATTERN` | SHA-256 del contenido subido | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `receivedSizeBytes` | Sí | `string` | Sin restricción adicional declarada | Tamaño recibido; debe cuadrar con el esperado | `valor-ejemplo` |
| `providerVersionId` | Sí | `string` | longitud máxima 300 | Identificador de la versión en el proveedor | `00000000-0000-4000-8000-000000000001` |
| `etag` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `mimeType` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `providerUri` | Sí | `string` | Sin restricción adicional declarada | URI del objeto en el proveedor | `valor-ejemplo` |
| `patientProfileId` | No | `string` | formato `uuid` | Paciente al que pertenece, si aplica | `00000000-0000-4000-8000-000000000001` |
| `compression` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `storageClass` | No | `string` | longitud máxima 100 | Clase de almacenamiento; por defecto, la del espacio | `valor-ejemplo` |
| `encryption` | No | `EncryptionEnvelopeDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"algorithm":"valor-ejemplo","keyManagementProvider":"valor-ejemplo","encryptedDataKey":"valor-ejemplo","keyVersion":"valor-ejemplo","encryptionContextHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}` |
| `encryption.algorithm` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `encryption.keyManagementProvider` | No | `string` | longitud máxima 100 | Proveedor de gestión de claves | `valor-ejemplo` |
| `encryption.encryptedDataKey` | No | `string` | Sin restricción adicional declarada | Clave de datos cifrada. Nunca la clave en claro. | `valor-ejemplo` |
| `encryption.keyVersion` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `encryption.encryptionContextHash` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /object-storage/uploads/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "logicalObjectId": "00000000-0000-4000-8000-000000000001",
  "objectType": "valor-ejemplo",
  "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "receivedSizeBytes": "valor-ejemplo",
  "providerVersionId": "00000000-0000-4000-8000-000000000001",
  "etag": "valor-ejemplo",
  "mimeType": "valor-ejemplo",
  "providerUri": "valor-ejemplo",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "compression": "valor-ejemplo",
  "storageClass": "valor-ejemplo",
  "encryption": {
    "algorithm": "valor-ejemplo",
    "keyManagementProvider": "valor-ejemplo",
    "encryptedDataKey": "valor-ejemplo",
    "keyVersion": "valor-ejemplo",
    "encryptionContextHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ObjectVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ObjectVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "manifestId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "manifestCreated": true,
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `manifestId` | Sí | `string` | formato `uuid` | Identificador asociado a manifest. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Identificador asociado a version. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `sha256` | Sí | `string` | Sin restricción adicional declarada | Valor de sha256 mantenido por la instancia. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `manifestCreated` | Sí | `boolean` | Sin restricción adicional declarada | true si el manifiesto se creó en esta operación | `true` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si ese contenido ya estaba versionado y no se duplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: STORAGE_CLIENT, SYSTEM, STORAGE_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Carga no encontrada | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 404 | `NOT_FOUND` | Espacio de nombres no encontrado | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La carga ya no está en curso | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 422 | `PRECONDITION_FAILED` | La carga caducó | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 422 | `PRECONDITION_FAILED` | El tamaño recibido no coincide con el declarado | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/object-storage/uploads/{id}/complete"
}
```

---

## 9. POST /object-storage/versions/{versionId}/integrity-checks

- **Módulo:** `object_storage`
- **Etiqueta OpenAPI:** `object-storage`
- **Nombre:** Registrar la verificación de integridad
- **Operation ID:** `ObjectStorageController_recordIntegrityCheck`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ObjectStorageController.recordIntegrityCheck](../../src/modules/object_storage/controllers/object-storage.controller.ts)

### Descripción de negocio

El resultado se deriva del hash; no cuadrar marca el objeto corrupto.


### Descripción del sistema

NestJS resuelve `POST /object-storage/versions/{versionId}/integrity-checks` en `ObjectStorageController_recordIntegrityCheck`. El controlador delega en `ObjectGovernanceService.recordIntegrityCheck`. Valida el body como `RecordIntegrityCheckDto` y consume `application/json`. El tipo de retorno estático es `Promise<IntegrityCheckResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordIntegrityCheckDto`; los campos opcionales se omiten.

```http
POST /object-storage/versions/00000000-0000-4000-8000-000000000001/integrity-checks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "actualHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `STORAGE_ADMIN`.
- Deben ser UUID válidos: `versionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `actualHash` | Sí | `string` | patrón runtime `SHA256_PATTERN` | SHA-256 recomputado sobre el objeto almacenado | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `repairJobId` | No | `string` | formato `uuid` | Job de reparación si hay que repararlo | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /object-storage/versions/00000000-0000-4000-8000-000000000001/integrity-checks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "actualHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "repairJobId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IntegrityCheckResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IntegrityCheckResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IntegrityCheckResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IntegrityCheckResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IntegrityCheckResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IntegrityCheckResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IntegrityCheckResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IntegrityCheckResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IntegrityCheckResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IntegrityCheckResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IntegrityCheckResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "expectedHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "actualHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "lifecycleState": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Derivado de comparar el hash esperado con el recomputado | `ok` |
| `expectedHash` | Sí | `string` | Sin restricción adicional declarada | Valor de expected hash mantenido por la instancia. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `actualHash` | Sí | `string` | Sin restricción adicional declarada | Valor de actual hash mantenido por la instancia. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Ciclo de vida en el que queda el objeto | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, STORAGE_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión no encontrada | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 404 | `NOT_FOUND` | Objeto no encontrado | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
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
  "path": "/object-storage/versions/{versionId}/integrity-checks"
}
```

---

## 10. POST /object-storage/versions/{versionId}/legal-holds

- **Módulo:** `object_storage`
- **Etiqueta OpenAPI:** `object-storage`
- **Nombre:** Colocar una retención legal
- **Operation ID:** `ObjectStorageController_placeLegalHold`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ObjectStorageController.placeLegalHold](../../src/modules/object_storage/controllers/object-storage.controller.ts)

### Descripción de negocio

Anula cualquier borrado, incluso con la retención vencida.


### Descripción del sistema

NestJS resuelve `POST /object-storage/versions/{versionId}/legal-holds` en `ObjectStorageController_placeLegalHold`. El controlador delega en `ObjectGovernanceService.placeLegalHold`. Valida el body como `PlaceLegalHoldDto` y consume `application/json`. El tipo de retorno estático es `Promise<LegalHoldResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PlaceLegalHoldDto`; los campos opcionales se omiten.

```http
POST /object-storage/versions/00000000-0000-4000-8000-000000000001/legal-holds HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "legalCaseReference": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `LEGAL_COUNSEL`, `STORAGE_ADMIN`.
- Deben ser UUID válidos: `versionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `legalCaseReference` | Sí | `string` | longitud máxima 200 | Referencia del caso legal | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /object-storage/versions/00000000-0000-4000-8000-000000000001/legal-holds HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "legalCaseReference": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LegalHoldResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "objectVersionId": "00000000-0000-4000-8000-000000000001",
  "holdState": "valor-ejemplo",
  "lifecycleState": "valor-ejemplo",
  "activeHolds": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `objectVersionId` | Sí | `string` | formato `uuid` | Identificador asociado a object version. | `00000000-0000-4000-8000-000000000001` |
| `holdState` | Sí | `string` | Sin restricción adicional declarada | Valor de hold state mantenido por la instancia. | `valor-ejemplo` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Ciclo de vida en el que queda el objeto | `valor-ejemplo` |
| `activeHolds` | Sí | `number` | Sin restricción adicional declarada | Retenciones legales que siguen vivas sobre la versión | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: LEGAL_COUNSEL, STORAGE_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión no encontrada | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 404 | `NOT_FOUND` | Objeto no encontrado | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
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
  "path": "/object-storage/versions/{versionId}/legal-holds"
}
```

---

## 11. DELETE /object-storage/versions/{versionId}/legal-holds/{holdId}

- **Módulo:** `object_storage`
- **Etiqueta OpenAPI:** `object-storage`
- **Nombre:** Liberar una retención legal
- **Operation ID:** `ObjectStorageController_releaseLegalHold`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ObjectStorageController.releaseLegalHold](../../src/modules/object_storage/controllers/object-storage.controller.ts)

### Descripción de negocio

El objeto vuelve a su estado anterior sólo si no queda ninguna viva.


### Descripción del sistema

NestJS resuelve `DELETE /object-storage/versions/{versionId}/legal-holds/{holdId}` en `ObjectStorageController_releaseLegalHold`. El controlador delega en `ObjectGovernanceService.releaseLegalHold`. No recibe body. El tipo de retorno estático es `Promise<LegalHoldResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `holdId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /object-storage/versions/00000000-0000-4000-8000-000000000001/legal-holds/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `LEGAL_COUNSEL`, `STORAGE_ADMIN`.
- Deben ser UUID válidos: `versionId`, `holdId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /object-storage/versions/00000000-0000-4000-8000-000000000001/legal-holds/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LegalHoldResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LegalHoldResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "objectVersionId": "00000000-0000-4000-8000-000000000001",
  "holdState": "valor-ejemplo",
  "lifecycleState": "valor-ejemplo",
  "activeHolds": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `objectVersionId` | Sí | `string` | formato `uuid` | Identificador asociado a object version. | `00000000-0000-4000-8000-000000000001` |
| `holdState` | Sí | `string` | Sin restricción adicional declarada | Valor de hold state mantenido por la instancia. | `valor-ejemplo` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Ciclo de vida en el que queda el objeto | `valor-ejemplo` |
| `activeHolds` | Sí | `number` | Sin restricción adicional declarada | Retenciones legales que siguen vivas sobre la versión | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: LEGAL_COUNSEL, STORAGE_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Retención legal no encontrada | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 404 | `NOT_FOUND` | Versión no encontrada | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 404 | `NOT_FOUND` | Objeto no encontrado | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 409 | `CONFLICT` | La retención legal ya está liberada | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 422 | `PRECONDITION_FAILED` | La retención es de otra versión | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/object-storage/versions/{versionId}/legal-holds/{holdId}"
}
```

---

## 12. POST /object-storage/versions/{versionId}/retention-lock

- **Módulo:** `object_storage`
- **Etiqueta OpenAPI:** `object-storage`
- **Nombre:** Aplicar retención WORM sobre la versión
- **Operation ID:** `ObjectStorageController_applyRetentionLock`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ObjectStorageController.applyRetentionLock](../../src/modules/object_storage/controllers/object-storage.controller.ts)

### Descripción de negocio

El modo `compliance` no se acorta ni se libera antes de tiempo.


### Descripción del sistema

NestJS resuelve `POST /object-storage/versions/{versionId}/retention-lock` en `ObjectStorageController_applyRetentionLock`. El controlador delega en `ObjectGovernanceService.applyRetentionLock`. Valida el body como `ApplyRetentionLockDto` y consume `application/json`. El tipo de retorno estático es `Promise<RetentionLockResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ApplyRetentionLockDto`; los campos opcionales se omiten.

```http
POST /object-storage/versions/00000000-0000-4000-8000-000000000001/retention-lock HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "lockMode": "compliance",
  "retainUntil": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `COMPLIANCE_OFFICER`, `STORAGE_ADMIN`.
- Deben ser UUID válidos: `versionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `lockMode` | Sí | `string` | valores: `compliance`, `governance` | `compliance` es WORM: no se acorta ni se libera antes de tiempo | `compliance` |
| `retainUntil` | Sí | `string` | formato `date-time` | Hasta cuándo se retiene; debe ser futuro | `2026-07-31T12:00:00.000Z` |
| `policyCode` | No | `string` | longitud máxima 100 | Política que lo justifica | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /object-storage/versions/00000000-0000-4000-8000-000000000001/retention-lock HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "lockMode": "compliance",
  "retainUntil": "2026-07-31T12:00:00.000Z",
  "policyCode": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RetentionLockResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RetentionLockResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RetentionLockResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RetentionLockResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RetentionLockResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RetentionLockResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RetentionLockResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RetentionLockResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RetentionLockResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RetentionLockResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RetentionLockResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "objectVersionId": "00000000-0000-4000-8000-000000000001",
  "lockMode": "valor-ejemplo",
  "retainUntil": "2026-07-31T12:00:00.000Z",
  "lifecycleState": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `objectVersionId` | Sí | `string` | formato `uuid` | Identificador asociado a object version. | `00000000-0000-4000-8000-000000000001` |
| `lockMode` | Sí | `string` | Sin restricción adicional declarada | Valor de lock mode mantenido por la instancia. | `valor-ejemplo` |
| `retainUntil` | Sí | `string` | formato `date-time` | Valor de retain until mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Ciclo de vida en el que queda el objeto | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: COMPLIANCE_OFFICER, STORAGE_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión no encontrada | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 404 | `NOT_FOUND` | Objeto no encontrado | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 409 | `CONFLICT` | La versión ya tiene una retención vigente | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La retención debe terminar en el futuro | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 422 | `PRECONDITION_FAILED` | El espacio de nombres no tiene bloqueo de objetos habilitado | Excepción explícita en src/modules/object_storage/services/object-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/object-storage/versions/{versionId}/retention-lock"
}
```

---

## 13. POST /object-storage/versions/{versionId}/signed-url

- **Módulo:** `object_storage`
- **Etiqueta OpenAPI:** `object-storage`
- **Nombre:** Emitir acceso firmado a una versión
- **Operation ID:** `ObjectStorageController_issueSignedUrl`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ObjectStorageController.issueSignedUrl](../../src/modules/object_storage/controllers/object-storage.controller.ts)

### Descripción de negocio

Lo frío exige rehidratación previa; el acceso queda registrado.


### Descripción del sistema

NestJS resuelve `POST /object-storage/versions/{versionId}/signed-url` en `ObjectStorageController_issueSignedUrl`. El controlador delega en `ObjectStorageService.issueSignedUrl`. Valida el body como `IssueSignedUrlDto` y consume `application/json`. El tipo de retorno estático es `Promise<SignedUrlResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IssueSignedUrlDto`; los campos opcionales se omiten.

```http
POST /object-storage/versions/00000000-0000-4000-8000-000000000001/signed-url HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeOfUseCode": "CODIGO_EJEMPLO"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DICOM_VIEWER`, `CLINICIAN`, `SYSTEM`, `STORAGE_ADMIN`.
- Deben ser UUID válidos: `versionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `purposeOfUseCode` | Sí | `string` | longitud máxima 100 | Propósito de uso; sin él no se emite | `CODIGO_EJEMPLO` |
| `expiresInSeconds` | No | `number` | mínimo 30 | Segundos de validez | `300` |
| `studyInstanceUid` | No | `string` | longitud máxima 200 | Study UID si el objeto es DICOM | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /object-storage/versions/00000000-0000-4000-8000-000000000001/signed-url HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeOfUseCode": "CODIGO_EJEMPLO",
  "expiresInSeconds": 300,
  "studyInstanceUid": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SignedUrlResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SignedUrlResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SignedUrlResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SignedUrlResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SignedUrlResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SignedUrlResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SignedUrlResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SignedUrlResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SignedUrlResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SignedUrlResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SignedUrlResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "objectVersionId": "00000000-0000-4000-8000-000000000001",
  "providerUri": "valor-ejemplo",
  "expiresAt": "2026-07-31T12:00:00.000Z",
  "keyVersion": "valor-ejemplo",
  "accessLogId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `objectVersionId` | Sí | `string` | formato `uuid` | Identificador asociado a object version. | `00000000-0000-4000-8000-000000000001` |
| `providerUri` | Sí | `string` | Sin restricción adicional declarada | URI del proveedor sobre la que se firma | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | formato `date-time` | Cuándo caduca el acceso | `2026-07-31T12:00:00.000Z` |
| `keyVersion` | No | `string` | Sin restricción adicional declarada | Versión de la clave con la que se descifra | `valor-ejemplo` |
| `accessLogId` | No | `string` | formato `uuid` | Registro del acceso si el objeto es DICOM | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DICOM_VIEWER, CLINICIAN, SYSTEM, STORAGE_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión no encontrada | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 404 | `NOT_FOUND` | Objeto no encontrado | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 404 | `NOT_FOUND` | La versión no tiene ubicación primaria | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El objeto no está disponible | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión está en almacenamiento frío: requiere rehidratación previa | Excepción explícita en src/modules/object_storage/services/object-storage.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/object-storage/versions/{versionId}/signed-url"
}
```

---

