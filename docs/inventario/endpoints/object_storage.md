<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `object_storage`

- **Bloque:** Datos y NoSQL (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)
- **Operaciones:** 13 (13 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 13 · BAJO 0
- **Tablas distintas que tocan:** 17
- **Respuestas de error y detalle contractual:** `openapi/endpoints/object-storage.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid}` | Resolver una instancia DICOM y registrar el acceso (WADO-RS) | MEDIO | 5 | DICOM_VIEWER, CLINICIAN, STORAGE_ADMIN |
| 2 | POST | `/object-storage/archive-jobs/build` | Archivar el objeto a almacenamiento frío | MEDIO | 7 | SYSTEM, STORAGE_ADMIN |
| 3 | POST | `/object-storage/dicom/studies/catalog` | Catalogar la jerarquía DICOM estudio/serie/instancia | MEDIO | 9 | PACS_GATEWAY, SYSTEM, STORAGE_ADMIN |
| 4 | POST | `/object-storage/large-payloads` | Registrar un payload grande y vincularlo a su entidad de origen | MEDIO | 4 | SYSTEM, STORAGE_ADMIN |
| 5 | POST | `/object-storage/namespaces/{code}/uploads/initiate` | Iniciar una carga multiparte | MEDIO | 3 | STORAGE_CLIENT, SYSTEM, STORAGE_ADMIN |
| 6 | POST | `/object-storage/objects/{manifestId}/request-deletion` | Solicitar el borrado gobernado | MEDIO | 7 | COMPLIANCE_OFFICER, STORAGE_ADMIN |
| 7 | POST | `/object-storage/objects/{manifestId}/versions` | Crear una versión nueva del objeto | MEDIO | 8 | SYSTEM, STORAGE_ADMIN |
| 8 | POST | `/object-storage/uploads/{id}/complete` | Completar la carga y materializar la versión del objeto | MEDIO | 11 | STORAGE_CLIENT, SYSTEM, STORAGE_ADMIN |
| 9 | POST | `/object-storage/versions/{versionId}/integrity-checks` | Registrar la verificación de integridad | MEDIO | 8 | SYSTEM, STORAGE_ADMIN |
| 10 | POST | `/object-storage/versions/{versionId}/legal-holds` | Colocar una retención legal | MEDIO | 5 | LEGAL_COUNSEL, STORAGE_ADMIN |
| 11 | DELETE | `/object-storage/versions/{versionId}/legal-holds/{holdId}` | Liberar una retención legal | MEDIO | 6 | LEGAL_COUNSEL, STORAGE_ADMIN |
| 12 | POST | `/object-storage/versions/{versionId}/retention-lock` | Aplicar retención WORM sobre la versión | MEDIO | 6 | COMPLIANCE_OFFICER, STORAGE_ADMIN |
| 13 | POST | `/object-storage/versions/{versionId}/signed-url` | Emitir acceso firmado a una versión | MEDIO | 5 | DICOM_VIEWER, CLINICIAN, SYSTEM, STORAGE_ADMIN |

---

## 1. GET /dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid}

- **Origen:** CONTRATO
- **Nombre:** Resolver una instancia DICOM y registrar el acceso (WADO-RS)
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DicomWebController.resolveInstance` — `src/modules/object_storage/controllers/dicomweb.controller.ts:36`

### Qué es y para qué sirve (negocio)

Resolver una instancia DICOM y registrar el acceso (WADO-RS). Caso de uso UC-60-05: Acceso DICOMweb. Dentro del módulo (descripción del modelo, en inglés): «Stores large immutable or versioned binaries: DICOM, reports, PDFs, videos, signed evidence, exports, backups and raw payloads.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/object_storage/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_60_object_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`GET /dicomweb/studies/{studyUid}/series/{seriesUid}/instances/{sopUid}` la atiende `DicomWebController.resolveInstance` (src/modules/object_storage/controllers/dicomweb.controller.ts:36). Exige sesión con alguno de los roles DICOM_VIEWER, CLINICIAN, STORAGE_ADMIN. Delega en `DicomCatalogService.resolveInstance`. Crea filas en object_storage.dicomweb_access_logs. Lee object_storage.dicom_instance_manifests, object_storage.dicom_series_manifests, object_storage.dicom_study_manifests, object_storage.object_manifests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DICOM_VIEWER, CLINICIAN, STORAGE_ADMIN | `src/modules/object_storage/controllers/dicomweb.controller.ts:36` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `object_storage.dicom_instance_manifests` | LEE | LEE | DIRECTA | DicomWebController.resolveInstance → DicomCatalogService.resolveInstance → DicomRepository.findInstanceByUid | `src/modules/object_storage/repositories/dicom.repository.ts:285` |
| `object_storage.dicom_series_manifests` | LEE | LEE | DIRECTA | DicomWebController.resolveInstance → DicomCatalogService.resolveInstance → DicomRepository.findSeriesByUid | `src/modules/object_storage/repositories/dicom.repository.ts:197` |
| `object_storage.dicom_study_manifests` | LEE | LEE | DIRECTA | DicomWebController.resolveInstance → DicomCatalogService.resolveInstance → DicomRepository.findStudyByUid | `src/modules/object_storage/repositories/dicom.repository.ts:108` |
| `object_storage.dicomweb_access_logs` | ESCRIBE | CREA | DIRECTA | DicomWebController.resolveInstance → DicomCatalogService.resolveInstance → DicomRepository.createAccessLog | `src/modules/object_storage/repositories/dicom.repository.ts:348` |
| `object_storage.object_manifests` | LEE | LEE | DIRECTA | DicomWebController.resolveInstance → DicomCatalogService.resolveInstance → ObjectStorageRepository.findManifestById | `src/modules/object_storage/repositories/object-storage.repository.ts:258` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `studyUid` | path | Sí | `string` | — |
| `seriesUid` | path | Sí | `string` | — |
| `sopUid` | path | Sí | `string` | — |
| `purposeOfUse` | query | No | `string` | Propósito de uso; sin él el acceso se deniega y queda registrado |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DicomInstanceAccessResponseDto>` · DTO `DicomInstanceAccessResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `accessLogId` | `string` | Sí | formato uuid | — | Registro del acceso | `src/modules/object_storage/dto/object-storage.dto.ts:680` |
| `outcome` | `string` | Sí | — | — | Valor de outcome mantenido por la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:686` |
| `objectManifestId` | `string` | No | formato uuid | — | Objeto que contiene el píxel | `src/modules/object_storage/dto/object-storage.dto.ts:695` |
| `currentVersionId` | `string` | No | formato uuid | — | Versión vigente del objeto | `src/modules/object_storage/dto/object-storage.dto.ts:704` |
| `denialReason` | `string` | No | — | — | Por qué se denegó | `src/modules/object_storage/dto/object-storage.dto.ts:710` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/object_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/object_storage/controllers/dicomweb.controller.spec.ts:32` |

### Flujos

- Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM) — etapa `UC-60-05`

---

## 2. POST /object-storage/archive-jobs/build

- **Origen:** CONTRATO
- **Nombre:** Archivar el objeto a almacenamiento frío
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObjectStorageController.buildArchiveJob` — `src/modules/object_storage/controllers/object-storage.controller.ts:226`

### Qué es y para qué sirve (negocio)

Archivar el objeto a almacenamiento frío. Caso de uso UC-60-11: Archivar a frío. Dentro del módulo (descripción del modelo, en inglés): «Stores large immutable or versioned binaries: DICOM, reports, PDFs, videos, signed evidence, exports, backups and raw payloads.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/object_storage/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_60_object_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /object-storage/archive-jobs/build` la atiende `ObjectStorageController.buildArchiveJob` (src/modules/object_storage/controllers/object-storage.controller.ts:226). Exige sesión con alguno de los roles SYSTEM, STORAGE_ADMIN. Valida el cuerpo como `BuildArchiveJobDto` (7 campos, 5 obligatorios). Delega en `ObjectGovernanceService.buildArchiveJob`. Crea filas en object_storage.archive_manifests, object_storage.object_locations. Actualiza object_storage.object_manifests. Lee object_storage.archive_manifests, object_storage.object_legal_holds, object_storage.object_manifests, object_storage.object_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, STORAGE_ADMIN | `src/modules/object_storage/controllers/object-storage.controller.ts:226` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `object_storage.archive_manifests` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.buildArchiveJob → ObjectGovernanceService.buildArchiveJob → ObjectGovernanceRepository.createArchiveManifest | `src/modules/object_storage/repositories/object-governance.repository.ts:324` |
| `object_storage.archive_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.buildArchiveJob → ObjectGovernanceService.buildArchiveJob → ObjectGovernanceRepository.findArchiveManifestByHash | `src/modules/object_storage/repositories/object-governance.repository.ts:346` |
| `object_storage.object_legal_holds` | LEE | LEE | DIRECTA | ObjectStorageController.buildArchiveJob → ObjectGovernanceService.buildArchiveJob → ObjectGovernanceRepository.findActiveLegalHolds | `src/modules/object_storage/repositories/object-governance.repository.ts:159` |
| `object_storage.object_locations` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.buildArchiveJob → ObjectGovernanceService.buildArchiveJob → ObjectStorageRepository.createLocation | `src/modules/object_storage/repositories/object-storage.repository.ts:528` |
| `object_storage.object_manifests` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.buildArchiveJob → ObjectGovernanceService.buildArchiveJob | `src/modules/object_storage/services/object-governance.service.ts:489` |
| `object_storage.object_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.buildArchiveJob → ObjectGovernanceService.buildArchiveJob → ObjectStorageRepository.findManifestForUpdate | `src/modules/object_storage/repositories/object-storage.repository.ts:266` |
| `object_storage.object_versions` | LEE | LEE | DIRECTA | ObjectStorageController.buildArchiveJob → ObjectGovernanceService.buildArchiveJob → ObjectStorageRepository.findLatestVersion | `src/modules/object_storage/repositories/object-storage.repository.ts:338` |

### Cuerpo — DTO `BuildArchiveJobDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `objectManifestId` | `string` | Sí | formato uuid | `@IsUUID()` | Objeto que se archiva | `src/modules/object_storage/dto/object-storage.dto.ts:1087` |
| `archiveType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Naturaleza del archivado | `src/modules/object_storage/dto/object-storage.dto.ts:1095` |
| `archiveNamespaceId` | `string` | Sí | formato uuid | `@IsUUID()` | Espacio frío de destino | `src/modules/object_storage/dto/object-storage.dto.ts:1102` |
| `manifestHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash del lote; lo hace idempotente | `src/modules/object_storage/dto/object-storage.dto.ts:1113` |
| `providerUri` | `string` | Sí | — | `@IsString()` | URI de la copia fría | `src/modules/object_storage/dto/object-storage.dto.ts:1120` |
| `sourceScopeJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Qué entra en el lote | `src/modules/object_storage/dto/object-storage.dto.ts:1128` |
| `storageClass` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Clase fría de destino | `src/modules/object_storage/dto/object-storage.dto.ts:1140` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "objectManifestId": "00000000-0000-4000-8000-000000000001",
  "archiveType": "valor-ejemplo",
  "archiveNamespaceId": "00000000-0000-4000-8000-000000000001",
  "manifestHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "providerUri": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ArchiveJobResponseDto>` · DTO `ArchiveJobResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:1151` |
| `objectManifestId` | `string` | Sí | formato uuid | — | Identificador asociado a object manifest. | `src/modules/object_storage/dto/object-storage.dto.ts:1157` |
| `recordCount` | `string` | Sí | — | — | Versiones movidas a frío; cadena por ser bigint | `src/modules/object_storage/dto/object-storage.dto.ts:1165` |
| `lifecycleState` | `string` | Sí | — | — | Ciclo de vida en el que queda el objeto | `src/modules/object_storage/dto/object-storage.dto.ts:1171` |
| `duplicate` | `boolean` | Sí | — | — | true si ese lote ya se había archivado | `src/modules/object_storage/dto/object-storage.dto.ts:1177` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El objeto no tiene ninguna versión; PreconditionFailedException: La versión está bajo retención legal: no se puede mover a frío |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/object_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/object_storage/controllers/object-storage.controller.spec.ts:176` |

### Flujos

- Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM) — etapa `UC-60-11`

---

## 3. POST /object-storage/dicom/studies/catalog

- **Origen:** CONTRATO
- **Nombre:** Catalogar la jerarquía DICOM estudio/serie/instancia
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObjectStorageController.catalogDicomStudy` — `src/modules/object_storage/controllers/object-storage.controller.ts:115`

### Qué es y para qué sirve (negocio)

Catalogar la jerarquía DICOM estudio/serie/instancia. Caso de uso UC-60-04: Catalogar jerarquía DICOM. Dentro del módulo (descripción del modelo, en inglés): «Stores large immutable or versioned binaries: DICOM, reports, PDFs, videos, signed evidence, exports, backups and raw payloads.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/object_storage/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_60_object_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /object-storage/dicom/studies/catalog` la atiende `ObjectStorageController.catalogDicomStudy` (src/modules/object_storage/controllers/object-storage.controller.ts:115). Exige sesión con alguno de los roles PACS_GATEWAY, SYSTEM, STORAGE_ADMIN. Valida el cuerpo como `CatalogDicomStudyDto` (20 campos, 6 obligatorios). Delega en `DicomCatalogService.catalogStudy`. Crea filas en object_storage.dicom_instance_manifests, object_storage.dicom_series_manifests, object_storage.dicom_study_manifests. Actualiza object_storage.dicom_series_manifests, object_storage.dicom_study_manifests. Lee object_storage.dicom_instance_manifests, object_storage.dicom_series_manifests, object_storage.dicom_study_manifests, object_storage.object_manifests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PACS_GATEWAY, SYSTEM, STORAGE_ADMIN | `src/modules/object_storage/controllers/object-storage.controller.ts:115` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `object_storage.dicom_instance_manifests` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.catalogDicomStudy → DicomCatalogService.catalogStudy → DicomRepository.createInstance | `src/modules/object_storage/repositories/dicom.repository.ts:263` |
| `object_storage.dicom_instance_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.catalogDicomStudy → DicomCatalogService.catalogStudy → DicomRepository.findInstanceByUid | `src/modules/object_storage/repositories/dicom.repository.ts:285` |
| `object_storage.dicom_series_manifests` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.catalogDicomStudy → DicomCatalogService.catalogStudy | `src/modules/object_storage/services/dicom-catalog.service.ts:150` |
| `object_storage.dicom_series_manifests` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.catalogDicomStudy → DicomCatalogService.catalogStudy → DicomRepository.createSeries | `src/modules/object_storage/repositories/dicom.repository.ts:149` |
| `object_storage.dicom_series_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.catalogDicomStudy → DicomCatalogService.catalogStudy → DicomRepository.findSeriesByUidForUpdate | `src/modules/object_storage/repositories/dicom.repository.ts:177` |
| `object_storage.dicom_study_manifests` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.catalogDicomStudy → DicomCatalogService.catalogStudy | `src/modules/object_storage/services/dicom-catalog.service.ts:155` |
| `object_storage.dicom_study_manifests` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.catalogDicomStudy → DicomCatalogService.catalogStudy → DicomRepository.createStudy | `src/modules/object_storage/repositories/dicom.repository.ts:63` |
| `object_storage.dicom_study_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.catalogDicomStudy → DicomCatalogService.catalogStudy → DicomRepository.findStudyByUidForUpdate | `src/modules/object_storage/repositories/dicom.repository.ts:90` |
| `object_storage.object_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.catalogDicomStudy → DicomCatalogService.catalogStudy → ObjectStorageRepository.findManifestById | `src/modules/object_storage/repositories/object-storage.repository.ts:258` |

### Cuerpo — DTO `CatalogDicomStudyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `studyInstanceUid` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Study Instance UID | `src/modules/object_storage/dto/object-storage.dto.ts:564` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/object_storage/dto/object-storage.dto.ts:572` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/object_storage/dto/object-storage.dto.ts:580` |
| `imagingStudyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Estudio en el módulo de diagnóstico | `src/modules/object_storage/dto/object-storage.dto.ts:591` |
| `accessionNumber` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:600` |
| `studyDate` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/object_storage/dto/object-storage.dto.ts:608` |
| `series` | `array<DicomSeriesDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => DicomSeriesDto)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:618` |
| `series[].seriesInstanceUid` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Series Instance UID | `src/modules/object_storage/dto/object-storage.dto.ts:508` |
| `series[].modality` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:517` |
| `series[].seriesNumber` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:526` |
| `series[].bodyPartExamined` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:535` |
| `series[].thumbnailObjectManifestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/object_storage/dto/object-storage.dto.ts:543` |
| `series[].instances` | `array<DicomInstanceDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => DicomInstanceDto)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:553` |
| `series[].instances[].sopInstanceUid` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | SOP Instance UID | `src/modules/object_storage/dto/object-storage.dto.ts:439` |
| `series[].instances[].objectManifestId` | `string` | Sí | formato uuid | `@IsUUID()` | Objeto ya materializado con el píxel | `src/modules/object_storage/dto/object-storage.dto.ts:449` |
| `series[].instances[].sopClassUid` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:458` |
| `series[].instances[].instanceNumber` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:467` |
| `series[].instances[].transferSyntaxUid` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:476` |
| `series[].instances[].frameCount` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:485` |
| `series[].instances[].metadataJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Metadatos DICOM sin identificadores directos | `src/modules/object_storage/dto/object-storage.dto.ts:495` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CatalogDicomStudyResponseDto>` · DTO `CatalogDicomStudyResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `studyId` | `string` | Sí | formato uuid | — | Identificador asociado a study. | `src/modules/object_storage/dto/object-storage.dto.ts:629` |
| `studyInstanceUid` | `string` | Sí | — | — | Valor de study instance uid mantenido por la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:635` |
| `seriesCount` | `number` | Sí | — | — | Series del estudio tras catalogar | `src/modules/object_storage/dto/object-storage.dto.ts:641` |
| `instanceCount` | `number` | Sí | — | — | Instancias del estudio tras catalogar | `src/modules/object_storage/dto/object-storage.dto.ts:647` |
| `instancesAdded` | `number` | Sí | — | — | Instancias nuevas registradas en esta llamada | `src/modules/object_storage/dto/object-storage.dto.ts:653` |
| `instancesSkipped` | `number` | Sí | — | — | Instancias que ya estaban catalogadas | `src/modules/object_storage/dto/object-storage.dto.ts:659` |
| `studyCreated` | `boolean` | Sí | — | — | true si el estudio se creó en esta llamada | `src/modules/object_storage/dto/object-storage.dto.ts:665` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El objeto de la instancia no existe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/object_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/object_storage/controllers/object-storage.controller.spec.ts:89` |

### Flujos

- Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM) — etapa `UC-60-04`

---

## 4. POST /object-storage/large-payloads

- **Origen:** CONTRATO
- **Nombre:** Registrar un payload grande y vincularlo a su entidad de origen
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObjectStorageController.registerLargePayload` — `src/modules/object_storage/controllers/object-storage.controller.ts:130`

### Qué es y para qué sirve (negocio)

Registrar un payload grande y vincularlo a su entidad de origen. Caso de uso UC-60-06: Registrar payload grande. Dentro del módulo (descripción del modelo, en inglés): «Stores large immutable or versioned binaries: DICOM, reports, PDFs, videos, signed evidence, exports, backups and raw payloads.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/object_storage/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_60_object_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /object-storage/large-payloads` la atiende `ObjectStorageController.registerLargePayload` (src/modules/object_storage/controllers/object-storage.controller.ts:130). Exige sesión con alguno de los roles SYSTEM, STORAGE_ADMIN. Valida el cuerpo como `RegisterLargePayloadDto` (7 campos, 6 obligatorios). Delega en `ObjectStorageService.registerLargePayload`. Crea filas en object_storage.large_payload_manifests. Actualiza object_storage.object_manifests. Lee object_storage.large_payload_manifests, object_storage.object_manifests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, STORAGE_ADMIN | `src/modules/object_storage/controllers/object-storage.controller.ts:130` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `object_storage.large_payload_manifests` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.registerLargePayload → ObjectStorageService.registerLargePayload → ObjectStorageRepository.createLargePayload | `src/modules/object_storage/repositories/object-storage.repository.ts:616` |
| `object_storage.large_payload_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.registerLargePayload → ObjectStorageService.registerLargePayload → ObjectStorageRepository.findLargePayloadBySource | `src/modules/object_storage/repositories/object-storage.repository.ts:641` |
| `object_storage.object_manifests` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.registerLargePayload → ObjectStorageService.registerLargePayload | `src/modules/object_storage/services/object-storage.service.ts:386` |
| `object_storage.object_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.registerLargePayload → ObjectStorageService.registerLargePayload → ObjectStorageRepository.findManifestForUpdate | `src/modules/object_storage/repositories/object-storage.repository.ts:266` |

### Cuerpo — DTO `RegisterLargePayloadDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `objectManifestId` | `string` | Sí | formato uuid | `@IsUUID()` | Objeto ya materializado | `src/modules/object_storage/dto/object-storage.dto.ts:724` |
| `payloadType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Naturaleza del payload | `src/modules/object_storage/dto/object-storage.dto.ts:732` |
| `sourceEntityType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Entidad de origen | `src/modules/object_storage/dto/object-storage.dto.ts:740` |
| `sourceEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/object_storage/dto/object-storage.dto.ts:747` |
| `contentHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash del contenido | `src/modules/object_storage/dto/object-storage.dto.ts:755` |
| `containsPhi` | `boolean` | Sí | — | `@IsBoolean()` | Si lleva datos de paciente; gobierna su tratamiento | `src/modules/object_storage/dto/object-storage.dto.ts:764` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/object_storage/dto/object-storage.dto.ts:772` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "objectManifestId": "00000000-0000-4000-8000-000000000001",
  "payloadType": "valor-ejemplo",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "containsPhi": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<LargePayloadResponseDto>` · DTO `LargePayloadResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:783` |
| `objectManifestId` | `string` | Sí | formato uuid | — | Identificador asociado a object manifest. | `src/modules/object_storage/dto/object-storage.dto.ts:789` |
| `duplicate` | `boolean` | Sí | — | — | true si ese origen y tipo ya estaban registrados | `src/modules/object_storage/dto/object-storage.dto.ts:797` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/object_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/object_storage/controllers/object-storage.controller.spec.ts:99` |

### Flujos

- Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM) — etapa `UC-60-06`

---

## 5. POST /object-storage/namespaces/{code}/uploads/initiate

- **Origen:** CONTRATO
- **Nombre:** Iniciar una carga multiparte
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObjectStorageController.initiateUpload` — `src/modules/object_storage/controllers/object-storage.controller.ts:69`

### Qué es y para qué sirve (negocio)

Iniciar una carga multiparte. Caso de uso UC-60-01: Iniciar carga multiparte. Dentro del módulo (descripción del modelo, en inglés): «Stores large immutable or versioned binaries: DICOM, reports, PDFs, videos, signed evidence, exports, backups and raw payloads.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/object_storage/README.md:11`) · MODELO (`Mantra Core Health Context/modules/diagram_60_object_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /object-storage/namespaces/{code}/uploads/initiate` la atiende `ObjectStorageController.initiateUpload` (src/modules/object_storage/controllers/object-storage.controller.ts:69). Exige sesión con alguno de los roles STORAGE_CLIENT, SYSTEM, STORAGE_ADMIN. Valida el cuerpo como `InitiateUploadDto` (5 campos, 3 obligatorios). Delega en `ObjectStorageService.initiateUpload`. Crea filas en object_storage.multipart_uploads. Lee object_storage.multipart_uploads, object_storage.object_namespaces.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: STORAGE_CLIENT, SYSTEM, STORAGE_ADMIN | `src/modules/object_storage/controllers/object-storage.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `object_storage.multipart_uploads` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.initiateUpload → ObjectStorageService.initiateUpload → ObjectStorageRepository.createUpload | `src/modules/object_storage/repositories/object-storage.repository.ts:140` |
| `object_storage.multipart_uploads` | LEE | LEE | DIRECTA | ObjectStorageController.initiateUpload → ObjectStorageService.initiateUpload → ObjectStorageRepository.findUploadByProviderId | `src/modules/object_storage/repositories/object-storage.repository.ts:166` |
| `object_storage.object_namespaces` | LEE | LEE | DIRECTA | ObjectStorageController.initiateUpload → ObjectStorageService.initiateUpload → ObjectStorageRepository.findNamespaceByCode | `src/modules/object_storage/repositories/object-storage.repository.ts:81` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `code` | path | Sí | `string` | — |

### Cuerpo — DTO `InitiateUploadDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `providerUploadId` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | Identificador de la carga en el proveedor | `src/modules/object_storage/dto/object-storage.dto.ts:45` |
| `targetObjectKey` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | Clave de destino. Opaca: no debe llevar datos del paciente. | `src/modules/object_storage/dto/object-storage.dto.ts:56` |
| `expectedSizeBytes` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Tamaño esperado en bytes; cadena por ser bigint | `src/modules/object_storage/dto/object-storage.dto.ts:66` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/object_storage/dto/object-storage.dto.ts:74` |
| `expiresAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo caduca la carga a medias | `src/modules/object_storage/dto/object-storage.dto.ts:85` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "providerUploadId": "00000000-0000-4000-8000-000000000001",
  "targetObjectKey": "valor-ejemplo",
  "expectedSizeBytes": "10485760"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "providerUploadId": "00000000-0000-4000-8000-000000000001",
  "targetObjectKey": "valor-ejemplo",
  "expectedSizeBytes": "10485760",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<UploadResponseDto>` · DTO `UploadResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:96` |
| `namespaceId` | `string` | Sí | formato uuid | — | Identificador asociado a namespace. | `src/modules/object_storage/dto/object-storage.dto.ts:102` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:108` |
| `duplicate` | `boolean` | Sí | — | — | true si esa carga del proveedor ya estaba iniciada | `src/modules/object_storage/dto/object-storage.dto.ts:116` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio de nombres no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El espacio de nombres no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/object_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/object_storage/controllers/object-storage.controller.spec.ts:56` |

### Flujos

- Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM) — etapa `UC-60-01`

---

## 6. POST /object-storage/objects/{manifestId}/request-deletion

- **Origen:** CONTRATO
- **Nombre:** Solicitar el borrado gobernado
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObjectStorageController.requestDeletion` — `src/modules/object_storage/controllers/object-storage.controller.ts:240`

### Qué es y para qué sirve (negocio)

Solicitar el borrado gobernado. Caso de uso UC-60-12: Borrado gobernado. Dentro del módulo (descripción del modelo, en inglés): «Stores large immutable or versioned binaries: DICOM, reports, PDFs, videos, signed evidence, exports, backups and raw payloads.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/object_storage/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_60_object_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /object-storage/objects/{manifestId}/request-deletion` la atiende `ObjectStorageController.requestDeletion` (src/modules/object_storage/controllers/object-storage.controller.ts:240). Exige sesión con alguno de los roles COMPLIANCE_OFFICER, STORAGE_ADMIN. Valida el cuerpo como `ObjectStorageRequestDeletionDto` (3 campos, 1 obligatorio). Delega en `ObjectGovernanceService.requestDeletion`. Crea filas en object_storage.object_deletion_markers. Actualiza object_storage.object_manifests. Lee object_storage.object_deletion_markers, object_storage.object_legal_holds, object_storage.object_manifests, object_storage.object_retention_locks, object_storage.object_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: COMPLIANCE_OFFICER, STORAGE_ADMIN | `src/modules/object_storage/controllers/object-storage.controller.ts:240` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: manifestId | `src/modules/object_storage/controllers/object-storage.controller.ts:240` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `object_storage.object_deletion_markers` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.requestDeletion → ObjectGovernanceService.requestDeletion → ObjectGovernanceRepository.createDeletionMarker | `src/modules/object_storage/repositories/object-governance.repository.ts:265` |
| `object_storage.object_deletion_markers` | LEE | LEE | DIRECTA | ObjectStorageController.requestDeletion → ObjectGovernanceService.requestDeletion → ObjectGovernanceRepository.findDeletionMarker | `src/modules/object_storage/repositories/object-governance.repository.ts:285` |
| `object_storage.object_legal_holds` | LEE | LEE | DIRECTA | ObjectStorageController.requestDeletion → ObjectGovernanceService.requestDeletion → ObjectGovernanceRepository.findActiveLegalHolds | `src/modules/object_storage/repositories/object-governance.repository.ts:159` |
| `object_storage.object_manifests` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.requestDeletion → ObjectGovernanceService.requestDeletion | `src/modules/object_storage/services/object-governance.service.ts:579` |
| `object_storage.object_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.requestDeletion → ObjectGovernanceService.requestDeletion → ObjectStorageRepository.findManifestForUpdate | `src/modules/object_storage/repositories/object-storage.repository.ts:266` |
| `object_storage.object_retention_locks` | LEE | LEE | DIRECTA | ObjectStorageController.requestDeletion → ObjectGovernanceService.requestDeletion → ObjectGovernanceRepository.findActiveRetentionLockForUpdate | `src/modules/object_storage/repositories/object-governance.repository.ts:74` |
| `object_storage.object_versions` | LEE | LEE | DIRECTA | ObjectStorageController.requestDeletion → ObjectGovernanceService.requestDeletion → ObjectStorageRepository.findLatestVersion | `src/modules/object_storage/repositories/object-storage.repository.ts:338` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `manifestId` | path | Sí | `string` | — |

### Cuerpo — DTO `ObjectStorageRequestDeletionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | — | `@IsString()` | Por qué se borra | `src/modules/object_storage/dto/object-storage.dto.ts:1192` |
| `requestedByJobId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Job que ejecutará el borrado | `src/modules/object_storage/dto/object-storage.dto.ts:1203` |
| `effectiveAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo se hace efectivo | `src/modules/object_storage/dto/object-storage.dto.ts:1214` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo",
  "requestedByJobId": "00000000-0000-4000-8000-000000000001",
  "effectiveAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<DeletionMarkerResponseDto>` · DTO `DeletionMarkerResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:1225` |
| `objectManifestId` | `string` | Sí | formato uuid | — | Identificador asociado a object manifest. | `src/modules/object_storage/dto/object-storage.dto.ts:1231` |
| `lifecycleState` | `string` | Sí | — | — | Ciclo de vida en el que queda el objeto | `src/modules/object_storage/dto/object-storage.dto.ts:1237` |
| `verificationStatus` | `string` | Sí | — | — | Valor de verification status mantenido por la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:1243` |
| `duplicate` | `boolean` | Sí | — | — | true si el borrado ya estaba solicitado | `src/modules/object_storage/dto/object-storage.dto.ts:1249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El objeto está bajo retención legal: no se puede borrar; PreconditionFailedException: El objeto está bajo retención de cumplimiento vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/object_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/object_storage/controllers/object-storage.controller.spec.ts:186` |

### Flujos

- Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM) — etapa `UC-60-12`

---

## 7. POST /object-storage/objects/{manifestId}/versions

- **Origen:** CONTRATO
- **Nombre:** Crear una versión nueva del objeto
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObjectStorageController.createVersion` — `src/modules/object_storage/controllers/object-storage.controller.ts:100`

### Qué es y para qué sirve (negocio)

Crear una versión nueva del objeto. Caso de uso UC-60-03: Nueva versión inmutable. Dentro del módulo (descripción del modelo, en inglés): «Stores large immutable or versioned binaries: DICOM, reports, PDFs, videos, signed evidence, exports, backups and raw payloads.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/object_storage/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_60_object_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /object-storage/objects/{manifestId}/versions` la atiende `ObjectStorageController.createVersion` (src/modules/object_storage/controllers/object-storage.controller.ts:100). Exige sesión con alguno de los roles SYSTEM, STORAGE_ADMIN. Valida el cuerpo como `CreateVersionDto` (15 campos, 7 obligatorios). Delega en `ObjectStorageService.createVersion`. Crea filas en object_storage.object_checksums, object_storage.object_encryption_envelopes, object_storage.object_locations, object_storage.object_versions. Actualiza object_storage.object_manifests. Lee object_storage.object_manifests, object_storage.object_namespaces, object_storage.object_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, STORAGE_ADMIN | `src/modules/object_storage/controllers/object-storage.controller.ts:100` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: manifestId | `src/modules/object_storage/controllers/object-storage.controller.ts:100` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `object_storage.object_checksums` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.createVersion → ObjectStorageService.createVersion → ObjectStorageService.materialiseVersion → ObjectStorageRepository.createChecksum | `src/modules/object_storage/repositories/object-storage.repository.ts:392` |
| `object_storage.object_encryption_envelopes` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.createVersion → ObjectStorageService.createVersion → ObjectStorageService.materialiseVersion → ObjectStorageRepository.createEncryptionEnvelope | `src/modules/object_storage/repositories/object-storage.repository.ts:462` |
| `object_storage.object_locations` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.createVersion → ObjectStorageService.createVersion → ObjectStorageService.materialiseVersion → ObjectStorageRepository.createLocation | `src/modules/object_storage/repositories/object-storage.repository.ts:528` |
| `object_storage.object_manifests` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.createVersion → ObjectStorageService.createVersion | `src/modules/object_storage/services/object-storage.service.ts:328` |
| `object_storage.object_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.createVersion → ObjectStorageService.createVersion → ObjectStorageRepository.findManifestForUpdate | `src/modules/object_storage/repositories/object-storage.repository.ts:266` |
| `object_storage.object_namespaces` | LEE | LEE | DIRECTA | ObjectStorageController.createVersion → ObjectStorageService.createVersion → ObjectStorageRepository.findNamespaceById | `src/modules/object_storage/repositories/object-storage.repository.ts:95` |
| `object_storage.object_versions` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.createVersion → ObjectStorageService.createVersion → ObjectStorageService.materialiseVersion → ObjectStorageRepository.createVersion | `src/modules/object_storage/repositories/object-storage.repository.ts:293` |
| `object_storage.object_versions` | LEE | LEE | DIRECTA | ObjectStorageController.createVersion → ObjectStorageService.createVersion → ObjectStorageRepository.findVersionBySha | `src/modules/object_storage/repositories/object-storage.repository.ts:351` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `manifestId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sha256` | `string` | Sí | patrón runtime SHA256_PATTERN | `@Matches(SHA256_PATTERN, { message: 'sha256 debe ser un hexadecimal de 64 caracteres', })` | SHA-256 del contenido nuevo | `src/modules/object_storage/dto/object-storage.dto.ts:349` |
| `providerVersionId` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:357` |
| `objectKey` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:365` |
| `sizeBytes` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | — | `src/modules/object_storage/dto/object-storage.dto.ts:372` |
| `etag` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:380` |
| `mimeType` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:388` |
| `providerUri` | `string` | Sí | — | `@IsString()` | URI del objeto en el proveedor | `src/modules/object_storage/dto/object-storage.dto.ts:395` |
| `compression` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:404` |
| `storageClass` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:413` |
| `encryption` | `EncryptionEnvelopeDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => EncryptionEnvelopeDto)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:422` |
| `encryption.algorithm` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:133` |
| `encryption.keyManagementProvider` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Proveedor de gestión de claves | `src/modules/object_storage/dto/object-storage.dto.ts:144` |
| `encryption.encryptedDataKey` | `string` | No | — | `@IsString()` | Clave de datos cifrada. Nunca la clave en claro. | `src/modules/object_storage/dto/object-storage.dto.ts:153` |
| `encryption.keyVersion` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:161` |
| `encryption.encryptionContextHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:170` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ObjectVersionResponseDto>` · DTO `ObjectVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `manifestId` | `string` | Sí | formato uuid | — | Identificador asociado a manifest. | `src/modules/object_storage/dto/object-storage.dto.ts:296` |
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/object_storage/dto/object-storage.dto.ts:302` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:308` |
| `sha256` | `string` | Sí | — | — | Valor de sha256 mantenido por la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:314` |
| `manifestCreated` | `boolean` | Sí | — | — | true si el manifiesto se creó en esta operación | `src/modules/object_storage/dto/object-storage.dto.ts:322` |
| `duplicate` | `boolean` | Sí | — | — | true si ese contenido ya estaba versionado y no se duplicó | `src/modules/object_storage/dto/object-storage.dto.ts:330` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objeto no encontrado; ResourceNotFoundException: Espacio de nombres no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El objeto no está activo; PreconditionFailedException: El espacio de nombres no tiene versionado habilitado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/object_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/object_storage/controllers/object-storage.controller.spec.ts:79` |

### Flujos

- Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM) — etapa `UC-60-03`

---

## 8. POST /object-storage/uploads/{id}/complete

- **Origen:** CONTRATO
- **Nombre:** Completar la carga y materializar la versión del objeto
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObjectStorageController.completeUpload` — `src/modules/object_storage/controllers/object-storage.controller.ts:85`

### Qué es y para qué sirve (negocio)

Completar la carga y materializar la versión del objeto. Caso de uso UC-60-02: Completar y materializar versión. Dentro del módulo (descripción del modelo, en inglés): «Stores large immutable or versioned binaries: DICOM, reports, PDFs, videos, signed evidence, exports, backups and raw payloads.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/object_storage/README.md:12`) · MODELO (`Mantra Core Health Context/modules/diagram_60_object_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /object-storage/uploads/{id}/complete` la atiende `ObjectStorageController.completeUpload` (src/modules/object_storage/controllers/object-storage.controller.ts:85). Exige sesión con alguno de los roles STORAGE_CLIENT, SYSTEM, STORAGE_ADMIN. Valida el cuerpo como `CompleteUploadDto` (17 campos, 8 obligatorios). Delega en `ObjectStorageService.completeUpload`. Crea filas en object_storage.object_checksums, object_storage.object_encryption_envelopes, object_storage.object_locations, object_storage.object_manifests, object_storage.object_versions. Actualiza object_storage.multipart_uploads, object_storage.object_manifests. Lee object_storage.multipart_uploads, object_storage.object_manifests, object_storage.object_namespaces, object_storage.object_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: STORAGE_CLIENT, SYSTEM, STORAGE_ADMIN | `src/modules/object_storage/controllers/object-storage.controller.ts:85` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/object_storage/controllers/object-storage.controller.ts:85` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `object_storage.multipart_uploads` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.completeUpload → ObjectStorageService.completeUpload | `src/modules/object_storage/services/object-storage.service.ts:194` |
| `object_storage.multipart_uploads` | LEE | LEE | DIRECTA | ObjectStorageController.completeUpload → ObjectStorageService.completeUpload → ObjectStorageRepository.findUploadForUpdate | `src/modules/object_storage/repositories/object-storage.repository.ts:180` |
| `object_storage.object_checksums` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.completeUpload → ObjectStorageService.completeUpload → ObjectStorageService.materialiseVersion → ObjectStorageRepository.createChecksum | `src/modules/object_storage/repositories/object-storage.repository.ts:392` |
| `object_storage.object_encryption_envelopes` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.completeUpload → ObjectStorageService.completeUpload → ObjectStorageService.materialiseVersion → ObjectStorageRepository.createEncryptionEnvelope | `src/modules/object_storage/repositories/object-storage.repository.ts:462` |
| `object_storage.object_locations` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.completeUpload → ObjectStorageService.completeUpload → ObjectStorageService.materialiseVersion → ObjectStorageRepository.createLocation | `src/modules/object_storage/repositories/object-storage.repository.ts:528` |
| `object_storage.object_manifests` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.completeUpload → ObjectStorageService.completeUpload | `src/modules/object_storage/services/object-storage.service.ts:236` |
| `object_storage.object_manifests` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.completeUpload → ObjectStorageService.completeUpload → ObjectStorageRepository.createManifest | `src/modules/object_storage/repositories/object-storage.repository.ts:229` |
| `object_storage.object_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.completeUpload → ObjectStorageService.completeUpload → ObjectStorageRepository.findManifestByLogicalIdForUpdate | `src/modules/object_storage/repositories/object-storage.repository.ts:279` |
| `object_storage.object_namespaces` | LEE | LEE | DIRECTA | ObjectStorageController.completeUpload → ObjectStorageService.completeUpload → ObjectStorageRepository.findNamespaceById | `src/modules/object_storage/repositories/object-storage.repository.ts:95` |
| `object_storage.object_versions` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.completeUpload → ObjectStorageService.completeUpload → ObjectStorageService.materialiseVersion → ObjectStorageRepository.createVersion | `src/modules/object_storage/repositories/object-storage.repository.ts:293` |
| `object_storage.object_versions` | LEE | LEE | DIRECTA | ObjectStorageController.completeUpload → ObjectStorageService.completeUpload → ObjectStorageRepository.findVersionBySha | `src/modules/object_storage/repositories/object-storage.repository.ts:351` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CompleteUploadDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `logicalObjectId` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | Identificador lógico del objeto en el espacio | `src/modules/object_storage/dto/object-storage.dto.ts:184` |
| `objectType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Naturaleza del objeto | `src/modules/object_storage/dto/object-storage.dto.ts:192` |
| `sha256` | `string` | Sí | patrón runtime SHA256_PATTERN | `@Matches(SHA256_PATTERN, { message: 'sha256 debe ser un hexadecimal de 64 caracteres', })` | SHA-256 del contenido subido | `src/modules/object_storage/dto/object-storage.dto.ts:204` |
| `receivedSizeBytes` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Tamaño recibido; debe cuadrar con el esperado | `src/modules/object_storage/dto/object-storage.dto.ts:211` |
| `providerVersionId` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | Identificador de la versión en el proveedor | `src/modules/object_storage/dto/object-storage.dto.ts:222` |
| `etag` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:230` |
| `mimeType` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:238` |
| `providerUri` | `string` | Sí | — | `@IsString()` | URI del objeto en el proveedor | `src/modules/object_storage/dto/object-storage.dto.ts:245` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente al que pertenece, si aplica | `src/modules/object_storage/dto/object-storage.dto.ts:256` |
| `compression` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:265` |
| `storageClass` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Clase de almacenamiento; por defecto, la del espacio | `src/modules/object_storage/dto/object-storage.dto.ts:276` |
| `encryption` | `EncryptionEnvelopeDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => EncryptionEnvelopeDto)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:285` |
| `encryption.algorithm` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:133` |
| `encryption.keyManagementProvider` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Proveedor de gestión de claves | `src/modules/object_storage/dto/object-storage.dto.ts:144` |
| `encryption.encryptedDataKey` | `string` | No | — | `@IsString()` | Clave de datos cifrada. Nunca la clave en claro. | `src/modules/object_storage/dto/object-storage.dto.ts:153` |
| `encryption.keyVersion` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:161` |
| `encryption.encryptionContextHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/object_storage/dto/object-storage.dto.ts:170` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ObjectVersionResponseDto>` · DTO `ObjectVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `manifestId` | `string` | Sí | formato uuid | — | Identificador asociado a manifest. | `src/modules/object_storage/dto/object-storage.dto.ts:296` |
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/object_storage/dto/object-storage.dto.ts:302` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:308` |
| `sha256` | `string` | Sí | — | — | Valor de sha256 mantenido por la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:314` |
| `manifestCreated` | `boolean` | Sí | — | — | true si el manifiesto se creó en esta operación | `src/modules/object_storage/dto/object-storage.dto.ts:322` |
| `duplicate` | `boolean` | Sí | — | — | true si ese contenido ya estaba versionado y no se duplicó | `src/modules/object_storage/dto/object-storage.dto.ts:330` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Carga no encontrada; ResourceNotFoundException: Espacio de nombres no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La carga ya no está en curso; PreconditionFailedException: La carga caducó; PreconditionFailedException: El tamaño recibido no coincide con el declarado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/object_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/object_storage/controllers/object-storage.controller.spec.ts:69` |

### Flujos

- Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM) — etapa `UC-60-02`

---

## 9. POST /object-storage/versions/{versionId}/integrity-checks

- **Origen:** CONTRATO
- **Nombre:** Registrar la verificación de integridad
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObjectStorageController.recordIntegrityCheck` — `src/modules/object_storage/controllers/object-storage.controller.ts:210`

### Qué es y para qué sirve (negocio)

Registrar la verificación de integridad. Caso de uso UC-60-10: Verificar integridad. Dentro del módulo (descripción del modelo, en inglés): «Stores large immutable or versioned binaries: DICOM, reports, PDFs, videos, signed evidence, exports, backups and raw payloads.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/object_storage/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_60_object_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /object-storage/versions/{versionId}/integrity-checks` la atiende `ObjectStorageController.recordIntegrityCheck` (src/modules/object_storage/controllers/object-storage.controller.ts:210). Exige sesión con alguno de los roles SYSTEM, STORAGE_ADMIN. Valida el cuerpo como `RecordIntegrityCheckDto` (2 campos, 1 obligatorio). Delega en `ObjectGovernanceService.recordIntegrityCheck`. Crea filas en object_storage.object_integrity_checks. Actualiza object_storage.object_checksums, object_storage.object_locations, object_storage.object_manifests. Lee object_storage.object_checksums, object_storage.object_locations, object_storage.object_manifests, object_storage.object_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, STORAGE_ADMIN | `src/modules/object_storage/controllers/object-storage.controller.ts:210` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId | `src/modules/object_storage/controllers/object-storage.controller.ts:210` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `object_storage.object_checksums` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.recordIntegrityCheck → ObjectGovernanceService.recordIntegrityCheck | `src/modules/object_storage/services/object-governance.service.ts:370` |
| `object_storage.object_checksums` | LEE | LEE | DIRECTA | ObjectStorageController.recordIntegrityCheck → ObjectGovernanceService.recordIntegrityCheck → ObjectStorageRepository.findChecksumForUpdate | `src/modules/object_storage/repositories/object-storage.repository.ts:419` |
| `object_storage.object_integrity_checks` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.recordIntegrityCheck → ObjectGovernanceService.recordIntegrityCheck → ObjectGovernanceRepository.createIntegrityCheck | `src/modules/object_storage/repositories/object-governance.repository.ts:216` |
| `object_storage.object_locations` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.recordIntegrityCheck → ObjectGovernanceService.recordIntegrityCheck | `src/modules/object_storage/services/object-governance.service.ts:382` |
| `object_storage.object_locations` | LEE | LEE | DIRECTA | ObjectStorageController.recordIntegrityCheck → ObjectGovernanceService.recordIntegrityCheck → ObjectStorageRepository.findPrimaryLocationForUpdate | `src/modules/object_storage/repositories/object-storage.repository.ts:548` |
| `object_storage.object_manifests` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.recordIntegrityCheck → ObjectGovernanceService.recordIntegrityCheck | `src/modules/object_storage/services/object-governance.service.ts:387` |
| `object_storage.object_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.recordIntegrityCheck → ObjectGovernanceService.recordIntegrityCheck → ObjectStorageRepository.findManifestForUpdate | `src/modules/object_storage/repositories/object-storage.repository.ts:266` |
| `object_storage.object_versions` | LEE | LEE | DIRECTA | ObjectStorageController.recordIntegrityCheck → ObjectGovernanceService.recordIntegrityCheck → ObjectStorageRepository.findVersionById | `src/modules/object_storage/repositories/object-storage.repository.ts:324` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordIntegrityCheckDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `actualHash` | `string` | Sí | patrón runtime SHA256_PATTERN | `@Matches(SHA256_PATTERN, { message: 'actualHash debe ser un hexadecimal de 64 caracteres', })` | SHA-256 recomputado sobre el objeto almacenado | `src/modules/object_storage/dto/object-storage.dto.ts:1025` |
| `repairJobId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Job de reparación si hay que repararlo | `src/modules/object_storage/dto/object-storage.dto.ts:1036` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "actualHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "actualHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "repairJobId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<IntegrityCheckResponseDto>` · DTO `IntegrityCheckResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:1047` |
| `status` | `string` | Sí | — | — | Derivado de comparar el hash esperado con el recomputado | `src/modules/object_storage/dto/object-storage.dto.ts:1055` |
| `expectedHash` | `string` | Sí | — | — | Valor de expected hash mantenido por la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:1061` |
| `actualHash` | `string` | Sí | — | — | Valor de actual hash mantenido por la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:1067` |
| `lifecycleState` | `string` | Sí | — | — | Ciclo de vida en el que queda el objeto | `src/modules/object_storage/dto/object-storage.dto.ts:1073` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: Objeto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/object_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/object_storage/controllers/object-storage.controller.spec.ts:163` |

### Flujos

- Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM) — etapa `UC-60-10`

---

## 10. POST /object-storage/versions/{versionId}/legal-holds

- **Origen:** CONTRATO
- **Nombre:** Colocar una retención legal
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObjectStorageController.placeLegalHold` — `src/modules/object_storage/controllers/object-storage.controller.ts:160`

### Qué es y para qué sirve (negocio)

Colocar una retención legal. Dentro del módulo (descripción del modelo, en inglés): «Stores large immutable or versioned binaries: DICOM, reports, PDFs, videos, signed evidence, exports, backups and raw payloads.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_60_object_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /object-storage/versions/{versionId}/legal-holds` la atiende `ObjectStorageController.placeLegalHold` (src/modules/object_storage/controllers/object-storage.controller.ts:160). Exige sesión con alguno de los roles LEGAL_COUNSEL, STORAGE_ADMIN. Valida el cuerpo como `PlaceLegalHoldDto` (1 campo, 1 obligatorio). Delega en `ObjectGovernanceService.placeLegalHold`. Crea filas en object_storage.object_legal_holds. Actualiza object_storage.object_manifests. Lee object_storage.object_legal_holds, object_storage.object_manifests, object_storage.object_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: LEGAL_COUNSEL, STORAGE_ADMIN | `src/modules/object_storage/controllers/object-storage.controller.ts:160` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId | `src/modules/object_storage/controllers/object-storage.controller.ts:160` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `object_storage.object_legal_holds` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.placeLegalHold → ObjectGovernanceService.placeLegalHold → ObjectGovernanceRepository.createLegalHold | `src/modules/object_storage/repositories/object-governance.repository.ts:122` |
| `object_storage.object_legal_holds` | LEE | LEE | DIRECTA | ObjectStorageController.placeLegalHold → ObjectGovernanceService.placeLegalHold → ObjectGovernanceRepository.findActiveLegalHolds | `src/modules/object_storage/repositories/object-governance.repository.ts:159` |
| `object_storage.object_manifests` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.placeLegalHold → ObjectGovernanceService.placeLegalHold | `src/modules/object_storage/services/object-governance.service.ts:200` |
| `object_storage.object_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.placeLegalHold → ObjectGovernanceService.placeLegalHold → ObjectStorageRepository.findManifestForUpdate | `src/modules/object_storage/repositories/object-storage.repository.ts:266` |
| `object_storage.object_versions` | LEE | LEE | DIRECTA | ObjectStorageController.placeLegalHold → ObjectGovernanceService.placeLegalHold → ObjectStorageRepository.findVersionById | `src/modules/object_storage/repositories/object-storage.repository.ts:324` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `PlaceLegalHoldDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `legalCaseReference` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Referencia del caso legal | `src/modules/object_storage/dto/object-storage.dto.ts:887` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "legalCaseReference": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "legalCaseReference": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<LegalHoldResponseDto>` · DTO `LegalHoldResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:898` |
| `objectVersionId` | `string` | Sí | formato uuid | — | Identificador asociado a object version. | `src/modules/object_storage/dto/object-storage.dto.ts:904` |
| `holdState` | `string` | Sí | — | — | Valor de hold state mantenido por la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:910` |
| `lifecycleState` | `string` | Sí | — | — | Ciclo de vida en el que queda el objeto | `src/modules/object_storage/dto/object-storage.dto.ts:916` |
| `activeHolds` | `number` | Sí | — | — | Retenciones legales que siguen vivas sobre la versión | `src/modules/object_storage/dto/object-storage.dto.ts:924` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: Objeto no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/object_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/object_storage/controllers/object-storage.controller.spec.ts:122` |

### Flujos

- Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM) — etapa `ctrl:ObjectStorageController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. DELETE /object-storage/versions/{versionId}/legal-holds/{holdId}

- **Origen:** CONTRATO
- **Nombre:** Liberar una retención legal
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObjectStorageController.releaseLegalHold` — `src/modules/object_storage/controllers/object-storage.controller.ts:176`

### Qué es y para qué sirve (negocio)

Liberar una retención legal. Dentro del módulo (descripción del modelo, en inglés): «Stores large immutable or versioned binaries: DICOM, reports, PDFs, videos, signed evidence, exports, backups and raw payloads.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_60_object_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`DELETE /object-storage/versions/{versionId}/legal-holds/{holdId}` la atiende `ObjectStorageController.releaseLegalHold` (src/modules/object_storage/controllers/object-storage.controller.ts:176). Exige sesión con alguno de los roles LEGAL_COUNSEL, STORAGE_ADMIN. Delega en `ObjectGovernanceService.releaseLegalHold`. Actualiza object_storage.object_legal_holds, object_storage.object_manifests. Lee object_storage.object_legal_holds, object_storage.object_manifests, object_storage.object_retention_locks, object_storage.object_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: LEGAL_COUNSEL, STORAGE_ADMIN | `src/modules/object_storage/controllers/object-storage.controller.ts:176` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId, holdId | `src/modules/object_storage/controllers/object-storage.controller.ts:176` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `object_storage.object_legal_holds` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.releaseLegalHold → ObjectGovernanceService.releaseLegalHold | `src/modules/object_storage/services/object-governance.service.ts:279` |
| `object_storage.object_legal_holds` | LEE | LEE | DIRECTA | ObjectStorageController.releaseLegalHold → ObjectGovernanceService.releaseLegalHold → ObjectGovernanceRepository.findLegalHoldForUpdate | `src/modules/object_storage/repositories/object-governance.repository.ts:146` |
| `object_storage.object_manifests` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.releaseLegalHold → ObjectGovernanceService.releaseLegalHold | `src/modules/object_storage/services/object-governance.service.ts:296` |
| `object_storage.object_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.releaseLegalHold → ObjectGovernanceService.releaseLegalHold → ObjectStorageRepository.findManifestForUpdate | `src/modules/object_storage/repositories/object-storage.repository.ts:266` |
| `object_storage.object_retention_locks` | LEE | LEE | DIRECTA | ObjectStorageController.releaseLegalHold → ObjectGovernanceService.releaseLegalHold → ObjectGovernanceRepository.findActiveRetentionLockForUpdate | `src/modules/object_storage/repositories/object-governance.repository.ts:74` |
| `object_storage.object_versions` | LEE | LEE | DIRECTA | ObjectStorageController.releaseLegalHold → ObjectGovernanceService.releaseLegalHold → ObjectStorageRepository.findVersionById | `src/modules/object_storage/repositories/object-storage.repository.ts:324` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |
| `holdId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LegalHoldResponseDto>` · DTO `LegalHoldResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:898` |
| `objectVersionId` | `string` | Sí | formato uuid | — | Identificador asociado a object version. | `src/modules/object_storage/dto/object-storage.dto.ts:904` |
| `holdState` | `string` | Sí | — | — | Valor de hold state mantenido por la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:910` |
| `lifecycleState` | `string` | Sí | — | — | Ciclo de vida en el que queda el objeto | `src/modules/object_storage/dto/object-storage.dto.ts:916` |
| `activeHolds` | `number` | Sí | — | — | Retenciones legales que siguen vivas sobre la versión | `src/modules/object_storage/dto/object-storage.dto.ts:924` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Retención legal no encontrada; ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: Objeto no encontrado |
| 409 | `CONFLICT` | ConflictException: La retención legal ya está liberada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La retención es de otra versión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/object_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/object_storage/controllers/object-storage.controller.spec.ts:135` |

### Flujos

- Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM) — etapa `ctrl:ObjectStorageController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /object-storage/versions/{versionId}/retention-lock

- **Origen:** CONTRATO
- **Nombre:** Aplicar retención WORM sobre la versión
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObjectStorageController.applyRetentionLock` — `src/modules/object_storage/controllers/object-storage.controller.ts:144`

### Qué es y para qué sirve (negocio)

Aplicar retención WORM sobre la versión. Caso de uso UC-60-07: Retención WORM. Dentro del módulo (descripción del modelo, en inglés): «Stores large immutable or versioned binaries: DICOM, reports, PDFs, videos, signed evidence, exports, backups and raw payloads.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/object_storage/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_60_object_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /object-storage/versions/{versionId}/retention-lock` la atiende `ObjectStorageController.applyRetentionLock` (src/modules/object_storage/controllers/object-storage.controller.ts:144). Exige sesión con alguno de los roles COMPLIANCE_OFFICER, STORAGE_ADMIN. Valida el cuerpo como `ApplyRetentionLockDto` (3 campos, 2 obligatorios). Delega en `ObjectGovernanceService.applyRetentionLock`. Crea filas en object_storage.object_retention_locks. Actualiza object_storage.object_manifests. Lee object_storage.object_manifests, object_storage.object_namespaces, object_storage.object_retention_locks, object_storage.object_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: COMPLIANCE_OFFICER, STORAGE_ADMIN | `src/modules/object_storage/controllers/object-storage.controller.ts:144` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId | `src/modules/object_storage/controllers/object-storage.controller.ts:144` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `object_storage.object_manifests` | ESCRIBE | ACTUALIZA | POR_TIPO | ObjectStorageController.applyRetentionLock → ObjectGovernanceService.applyRetentionLock | `src/modules/object_storage/services/object-governance.service.ts:144` |
| `object_storage.object_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.applyRetentionLock → ObjectGovernanceService.applyRetentionLock → ObjectStorageRepository.findManifestForUpdate | `src/modules/object_storage/repositories/object-storage.repository.ts:266` |
| `object_storage.object_namespaces` | LEE | LEE | DIRECTA | ObjectStorageController.applyRetentionLock → ObjectGovernanceService.applyRetentionLock → ObjectStorageRepository.findNamespaceById | `src/modules/object_storage/repositories/object-storage.repository.ts:95` |
| `object_storage.object_retention_locks` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.applyRetentionLock → ObjectGovernanceService.applyRetentionLock → ObjectGovernanceRepository.createRetentionLock | `src/modules/object_storage/repositories/object-governance.repository.ts:53` |
| `object_storage.object_retention_locks` | LEE | LEE | DIRECTA | ObjectStorageController.applyRetentionLock → ObjectGovernanceService.applyRetentionLock → ObjectGovernanceRepository.findActiveRetentionLockForUpdate | `src/modules/object_storage/repositories/object-governance.repository.ts:74` |
| `object_storage.object_versions` | LEE | LEE | DIRECTA | ObjectStorageController.applyRetentionLock → ObjectGovernanceService.applyRetentionLock → ObjectStorageRepository.findVersionById | `src/modules/object_storage/repositories/object-storage.repository.ts:324` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `ApplyRetentionLockDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `lockMode` | `string` | Sí | valores: compliance, governance | `@IsIn(RETENTION_LOCK_MODES)` | `compliance` es WORM: no se acorta ni se libera antes de tiempo | `src/modules/object_storage/dto/object-storage.dto.ts:815` |
| `retainUntil` | `string` | Sí | formato date-time | `@IsISO8601()` | Hasta cuándo se retiene; debe ser futuro | `src/modules/object_storage/dto/object-storage.dto.ts:825` |
| `policyCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Política que lo justifica | `src/modules/object_storage/dto/object-storage.dto.ts:837` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "lockMode": "compliance",
  "retainUntil": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "lockMode": "compliance",
  "retainUntil": "2026-07-31T12:00:00.000Z",
  "policyCode": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<RetentionLockResponseDto>` · DTO `RetentionLockResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:848` |
| `objectVersionId` | `string` | Sí | formato uuid | — | Identificador asociado a object version. | `src/modules/object_storage/dto/object-storage.dto.ts:854` |
| `lockMode` | `string` | Sí | — | — | Valor de lock mode mantenido por la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:860` |
| `retainUntil` | `string` | Sí | formato date-time | — | Valor de retain until mantenido por la instancia. | `src/modules/object_storage/dto/object-storage.dto.ts:866` |
| `lifecycleState` | `string` | Sí | — | — | Ciclo de vida en el que queda el objeto | `src/modules/object_storage/dto/object-storage.dto.ts:872` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: Objeto no encontrado |
| 409 | `CONFLICT` | ConflictException: La versión ya tiene una retención vigente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La retención debe terminar en el futuro; PreconditionFailedException: El espacio de nombres no tiene bloqueo de objetos habilitado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/object_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/object_storage/controllers/object-storage.controller.spec.ts:109` |

### Flujos

- Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM) — etapa `UC-60-07`

---

## 13. POST /object-storage/versions/{versionId}/signed-url

- **Origen:** CONTRATO
- **Nombre:** Emitir acceso firmado a una versión
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObjectStorageController.issueSignedUrl` — `src/modules/object_storage/controllers/object-storage.controller.ts:193`

### Qué es y para qué sirve (negocio)

Emitir acceso firmado a una versión. Caso de uso UC-60-09: Emitir acceso firmado. Dentro del módulo (descripción del modelo, en inglés): «Stores large immutable or versioned binaries: DICOM, reports, PDFs, videos, signed evidence, exports, backups and raw payloads.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/object_storage/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_60_object_storage.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /object-storage/versions/{versionId}/signed-url` la atiende `ObjectStorageController.issueSignedUrl` (src/modules/object_storage/controllers/object-storage.controller.ts:193). Exige sesión con alguno de los roles DICOM_VIEWER, CLINICIAN, SYSTEM, STORAGE_ADMIN. Valida el cuerpo como `IssueSignedUrlDto` (3 campos, 1 obligatorio). Delega en `ObjectStorageService.issueSignedUrl`. Crea filas en object_storage.dicomweb_access_logs. Lee object_storage.object_encryption_envelopes, object_storage.object_locations, object_storage.object_manifests, object_storage.object_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DICOM_VIEWER, CLINICIAN, SYSTEM, STORAGE_ADMIN | `src/modules/object_storage/controllers/object-storage.controller.ts:193` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId | `src/modules/object_storage/controllers/object-storage.controller.ts:193` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `object_storage.dicomweb_access_logs` | ESCRIBE | CREA | DIRECTA | ObjectStorageController.issueSignedUrl → ObjectStorageService.issueSignedUrl → DicomRepository.createAccessLog | `src/modules/object_storage/repositories/dicom.repository.ts:348` |
| `object_storage.object_encryption_envelopes` | LEE | LEE | DIRECTA | ObjectStorageController.issueSignedUrl → ObjectStorageService.issueSignedUrl → ObjectStorageRepository.findEncryptionEnvelope | `src/modules/object_storage/repositories/object-storage.repository.ts:489` |
| `object_storage.object_locations` | LEE | LEE | DIRECTA | ObjectStorageController.issueSignedUrl → ObjectStorageService.issueSignedUrl → ObjectStorageRepository.findPrimaryLocation | `src/modules/object_storage/repositories/object-storage.repository.ts:568` |
| `object_storage.object_manifests` | LEE | LEE | DIRECTA | ObjectStorageController.issueSignedUrl → ObjectStorageService.issueSignedUrl → ObjectStorageRepository.findManifestById | `src/modules/object_storage/repositories/object-storage.repository.ts:258` |
| `object_storage.object_versions` | LEE | LEE | DIRECTA | ObjectStorageController.issueSignedUrl → ObjectStorageService.issueSignedUrl → ObjectStorageRepository.findVersionById | `src/modules/object_storage/repositories/object-storage.repository.ts:324` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `IssueSignedUrlDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `purposeOfUseCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Propósito de uso; sin él no se emite | `src/modules/object_storage/dto/object-storage.dto.ts:942` |
| `expiresInSeconds` | `number` | No | mínimo 30 | `@IsOptional()` `@IsInt()` `@Min(30)` | Segundos de validez | `src/modules/object_storage/dto/object-storage.dto.ts:955` |
| `studyInstanceUid` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Study UID si el objeto es DICOM | `src/modules/object_storage/dto/object-storage.dto.ts:967` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "purposeOfUseCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "purposeOfUseCode": "CODIGO_EJEMPLO",
  "expiresInSeconds": 300,
  "studyInstanceUid": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SignedUrlResponseDto>` · DTO `SignedUrlResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `objectVersionId` | `string` | Sí | formato uuid | — | Identificador asociado a object version. | `src/modules/object_storage/dto/object-storage.dto.ts:978` |
| `providerUri` | `string` | Sí | — | — | URI del proveedor sobre la que se firma | `src/modules/object_storage/dto/object-storage.dto.ts:984` |
| `expiresAt` | `string` | Sí | formato date-time | — | Cuándo caduca el acceso | `src/modules/object_storage/dto/object-storage.dto.ts:990` |
| `keyVersion` | `string` | No | — | — | Versión de la clave con la que se descifra | `src/modules/object_storage/dto/object-storage.dto.ts:998` |
| `accessLogId` | `string` | No | formato uuid | — | Registro del acceso si el objeto es DICOM | `src/modules/object_storage/dto/object-storage.dto.ts:1007` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión no encontrada; ResourceNotFoundException: Objeto no encontrado; ResourceNotFoundException: La versión no tiene ubicación primaria |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El objeto no está disponible; PreconditionFailedException: La versión está en almacenamiento frío: requiere rehidratación previa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/object_storage.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/object_storage/controllers/object-storage.controller.spec.ts:149` |

### Flujos

- Módulo 60 — Almacenamiento de Objetos (blobs, PACS y WORM) — etapa `UC-60-09`

---

