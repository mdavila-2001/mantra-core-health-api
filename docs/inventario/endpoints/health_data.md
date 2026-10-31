<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `health_data`

- **Bloque:** Datos y NoSQL (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)
- **Operaciones:** 16 (16 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 14 · BAJO 2
- **Tablas distintas que tocan:** 32
- **Respuestas de error y detalle contractual:** `openapi/endpoints/health-data.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/fhir/r5/$export` | Exportar un Bundle FHIR interoperable con su manifiesto | MEDIO | 13 | PRIVACY_OFFICER, HEALTH_DATA_ADMIN |
| 2 | GET | `/fhir/r5/Patient/{id}/$everything` | Servir la historia longitudinal del paciente | BAJO | 5 | INTEROP_CONSUMER, CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN |
| 3 | POST | `/health-data/canonical-resources/{id}/bindings` | Enlazar el recurso a una entidad de dominio | MEDIO | 5 | CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN |
| 4 | POST | `/health-data/canonical-resources/{id}/identifiers` | Registrar un identificador de negocio del recurso | MEDIO | 5 | INGESTION_WORKER, CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN |
| 5 | POST | `/health-data/canonical-resources/{id}/relationships` | Relacionar dos recursos canónicos | MEDIO | 4 | DATA_STEWARD, CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN |
| 6 | POST | `/health-data/canonical-resources/{id}/retire` | Retirar el recurso canónico (borrado lógico) | MEDIO | 8 | CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN |
| 7 | POST | `/health-data/canonical-resources/project` | Proyectar el registro a recurso canónico y versionarlo | MEDIO | 12 | INGESTION_WORKER, HEALTH_DATA_ADMIN |
| 8 | POST | `/health-data/deidentification-runs` | Registrar una corrida de de-identificación | MEDIO | 9 | PRIVACY_OFFICER, HEALTH_DATA_ADMIN |
| 9 | POST | `/health-data/identity/candidates/{id}/decision` | Resolver un candidato de identidad longitudinal | MEDIO | 9 | MPI_STEWARD, HEALTH_DATA_ADMIN |
| 10 | POST | `/health-data/ingestion-batches` | Abrir un lote de ingesta desde una conexión de origen | MEDIO | 4 | INGESTION_WORKER, HEALTH_DATA_ADMIN |
| 11 | POST | `/health-data/ingestion-batches/{id}/close` | Cerrar el lote conciliando sus contadores | BAJO | 2 | INGESTION_WORKER, HEALTH_DATA_ADMIN |
| 12 | POST | `/health-data/ingestion-batches/{id}/records` | Registrar un registro crudo del lote | MEDIO | 3 | INGESTION_WORKER, HEALTH_DATA_ADMIN |
| 13 | POST | `/health-data/quality-runs` | Ejecutar reglas de calidad y abrir incidencias | MEDIO | 6 | DATA_STEWARD, HEALTH_DATA_ADMIN |
| 14 | POST | `/health-data/source-connections` | Dar de alta una conexión de origen (crea el sistema si no existe) | MEDIO | 3 | HEALTH_DATA_ADMIN, CLINICAL_INFORMATICIAN, DATA_PLATFORM_ADMIN |
| 15 | POST | `/health-data/timeline-entries` | Proyectar una entrada de la línea de tiempo del paciente | MEDIO | 2 | SYSTEM, HEALTH_DATA_ADMIN |
| 16 | POST | `/health-data/versions/{id}/validate` | Validar la versión contra un perfil FHIR R5 | MEDIO | 7 | INGESTION_WORKER, HEALTH_DATA_ADMIN, CLINICAL_INFORMATICIAN |

---

## 1. POST /fhir/r5/$export

- **Origen:** CONTRATO
- **Nombre:** Exportar un Bundle FHIR interoperable con su manifiesto
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FhirR5Controller.exportBundle` — `src/modules/health_data/controllers/fhir-r5.controller.ts:52`

### Qué es y para qué sirve (negocio)

Exportar un Bundle FHIR interoperable con su manifiesto. Caso de uso UC-52-12: Exportar Bundle FHIR con manifiesto. Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_data/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /fhir/r5/$export` la atiende `FhirR5Controller.exportBundle` (src/modules/health_data/controllers/fhir-r5.controller.ts:52). Exige sesión con alguno de los roles PRIVACY_OFFICER, HEALTH_DATA_ADMIN. Valida el cuerpo como `ExportBundleDto` (14 campos, 4 obligatorios). Delega en `DataReleaseService.exportBundle`. Crea filas en health_data.health_export_jobs, health_data.health_export_manifests, health_data.health_provenance_records, health_data.health_provenance_targets. Lee authz.clinical_access_grants, common.files, consent.consents, health_data.canonical_health_resources, health_data.health_deidentification_profiles, health_data.health_deidentification_runs, health_data.patient_identity_clusters, health_data.patient_identity_members y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRIVACY_OFFICER, HEALTH_DATA_ADMIN | `src/modules/health_data/controllers/fhir-r5.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | FhirR5Controller.exportBundle → DataReleaseService.exportBundle → DataReleaseService.assertPatientInTenant → DataReleaseService.resolveReadDecision | `src/modules/health_data/services/data-release.service.ts:503` |
| `common.files` | LEE | LEE | DIRECTA | FhirR5Controller.exportBundle → DataReleaseService.exportBundle → DataReleaseService.assertFileInTenant | `src/modules/health_data/services/data-release.service.ts:632` |
| `consent.consents` | LEE | LEE | DIRECTA | FhirR5Controller.exportBundle → DataReleaseService.exportBundle → DataReleaseService.assertConsentInTenant | `src/modules/health_data/services/data-release.service.ts:602` |
| `health_data.canonical_health_resources` | LEE | LEE | DIRECTA | FhirR5Controller.exportBundle → DataReleaseService.exportBundle → DataReleaseService.assertPatientInTenant → CanonicalResourcesRepository.existsResourceByPatient | `src/modules/health_data/repositories/canonical-resources.repository.ts:207` |
| `health_data.health_deidentification_profiles` | LEE | LEE | DIRECTA | FhirR5Controller.exportBundle → DataReleaseService.exportBundle → DataReleaseService.assertCohortInTenant → DataReleaseRepository.findDeidProfileById | `src/modules/health_data/repositories/data-release.repository.ts:31` |
| `health_data.health_deidentification_runs` | LEE | LEE | DIRECTA | FhirR5Controller.exportBundle → DataReleaseService.exportBundle → DataReleaseRepository.findDeidRunById | `src/modules/health_data/repositories/data-release.repository.ts:183` |
| `health_data.health_export_jobs` | ESCRIBE | CREA | DIRECTA | FhirR5Controller.exportBundle → DataReleaseService.exportBundle → DataReleaseRepository.createExportJob | `src/modules/health_data/repositories/data-release.repository.ts:260` |
| `health_data.health_export_manifests` | ESCRIBE | CREA | DIRECTA | FhirR5Controller.exportBundle → DataReleaseService.exportBundle → DataReleaseRepository.createExportManifest | `src/modules/health_data/repositories/data-release.repository.ts:340` |
| `health_data.health_provenance_records` | ESCRIBE | CREA | DIRECTA | FhirR5Controller.exportBundle → DataReleaseService.exportBundle → HealthProvenanceRepository.createProvenanceRecord | `src/modules/health_data/repositories/health-provenance.repository.ts:122` |
| `health_data.health_provenance_targets` | ESCRIBE | CREA | DIRECTA | FhirR5Controller.exportBundle → DataReleaseService.exportBundle → HealthProvenanceRepository.createProvenanceTarget | `src/modules/health_data/repositories/health-provenance.repository.ts:173` |
| `health_data.patient_identity_clusters` | LEE | LEE | DIRECTA | FhirR5Controller.exportBundle → DataReleaseService.exportBundle → DataReleaseService.assertPatientInTenant → PatientIdentityRepository.findLiveMembershipInTenant | `src/modules/health_data/repositories/patient-identity.repository.ts:344` |
| `health_data.patient_identity_members` | LEE | LEE | DIRECTA | FhirR5Controller.exportBundle → DataReleaseService.exportBundle → DataReleaseService.assertPatientInTenant → PatientIdentityRepository.findLiveMembershipInTenant | `src/modules/health_data/repositories/patient-identity.repository.ts:339` |
| `lakehouse.cohort_definitions` | LEE | LEE | DIRECTA | FhirR5Controller.exportBundle → DataReleaseService.exportBundle → DataReleaseService.assertCohortInTenant | `src/modules/health_data/services/data-release.service.ts:571` |

### Cuerpo — DTO `ExportBundleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `exportTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de exportación (catálogo abierto) | `src/modules/health_data/dto/health-data.dto.ts:1495` |
| `purposeOfUseConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Propósito de uso; sin él no se exporta | `src/modules/health_data/dto/health-data.dto.ts:1505` |
| `contentHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash del Bundle entregado; lo sella | `src/modules/health_data/dto/health-data.dto.ts:1516` |
| `recordCount` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Recursos incluidos; cadena por ser bigint | `src/modules/health_data/dto/health-data.dto.ts:1526` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente exportado | `src/modules/health_data/dto/health-data.dto.ts:1534` |
| `cohortDefinitionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cohorte exportada | `src/modules/health_data/dto/health-data.dto.ts:1542` |
| `consentDirectiveId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:1550` |
| `deidentificationRunId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Corrida de de-identificación aplicada, si la hubo | `src/modules/health_data/dto/health-data.dto.ts:1561` |
| `fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:1569` |
| `sizeBytes` | `string` | No | — | `@IsOptional()` `@IsNumberString({ no_symbols: true })` | Tamaño en bytes; cadena por ser bigint | `src/modules/health_data/dto/health-data.dto.ts:1579` |
| `encryptionProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:1587` |
| `retentionPolicyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:1595` |
| `expiresAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo caduca la entrega | `src/modules/health_data/dto/health-data.dto.ts:1606` |
| `deliveryDestinationJson` | `object` | No | — | `@IsOptional()` `@MaxJsonSize(256 * 1024)` `@IsObject()` | A dónde se entrega | `src/modules/health_data/dto/health-data.dto.ts:1615` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "exportTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUseConceptId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "recordCount": "412"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ExportJobResponseDto>` · DTO `ExportJobResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_data/dto/health-data.dto.ts:1626` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/health_data/dto/health-data.dto.ts:1632` |
| `manifestId` | `string` | Sí | formato uuid | — | Manifiesto inmutable del Bundle | `src/modules/health_data/dto/health-data.dto.ts:1641` |
| `manifestVersion` | `number` | Sí | — | — | Valor de manifest version mantenido por la instancia. | `src/modules/health_data/dto/health-data.dto.ts:1647` |
| `provenanceRecordId` | `string` | Sí | formato uuid | — | Procedencia registrada de la exportación | `src/modules/health_data/dto/health-data.dto.ts:1656` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Consentimiento no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La exportación necesita un paciente o una cohorte; PreconditionFailedException: La corrida de de-identificación no está completada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/fhir-r5.controller.spec.ts:35` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `UC-52-12`

---

## 2. GET /fhir/r5/Patient/{id}/$everything

- **Origen:** CONTRATO
- **Nombre:** Servir la historia longitudinal del paciente
- **Bloque:** Datos y NoSQL
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `FhirR5Controller.serveEverything` — `src/modules/health_data/controllers/fhir-r5.controller.ts:73`

### Qué es y para qué sirve (negocio)

Servir la historia longitudinal del paciente. Caso de uso UC-52-13: Servir historia longitudinal. Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_data/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`GET /fhir/r5/Patient/{id}/$everything` la atiende `FhirR5Controller.serveEverything` (src/modules/health_data/controllers/fhir-r5.controller.ts:73). Exige sesión con alguno de los roles INTEROP_CONSUMER, CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN. Delega en `DataReleaseService.serveEverything`. Lee authz.clinical_access_grants, health_data.canonical_health_resource_versions, health_data.canonical_health_resources, health_data.patient_identity_clusters, health_data.patient_identity_members.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: INTEROP_CONSUMER, CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN | `src/modules/health_data/controllers/fhir-r5.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_data/controllers/fhir-r5.controller.ts:73` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | FhirR5Controller.serveEverything → DataReleaseService.serveEverything → DataReleaseService.resolveReadDecision | `src/modules/health_data/services/data-release.service.ts:503` |
| `health_data.canonical_health_resource_versions` | LEE | LEE | DIRECTA | FhirR5Controller.serveEverything → DataReleaseService.serveEverything → CanonicalResourcesRepository.findVersionsByIds | `src/modules/health_data/repositories/canonical-resources.repository.ts:303` |
| `health_data.canonical_health_resources` | LEE | LEE | DIRECTA | FhirR5Controller.serveEverything → DataReleaseService.serveEverything → CanonicalResourcesRepository.findResourcesByPatient | `src/modules/health_data/repositories/canonical-resources.repository.ts:186` |
| `health_data.patient_identity_clusters` | LEE | LEE | DIRECTA | FhirR5Controller.serveEverything → DataReleaseService.serveEverything → PatientIdentityRepository.findLiveMembershipInTenant | `src/modules/health_data/repositories/patient-identity.repository.ts:344` |
| `health_data.patient_identity_members` | LEE | LEE | DIRECTA | FhirR5Controller.serveEverything → DataReleaseService.serveEverything → PatientIdentityRepository.findLiveMembershipInTenant | `src/modules/health_data/repositories/patient-identity.repository.ts:339` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `custodian` | query | No | `string` | Obsoleto: el custodio sale de la sesión (X-Tenant-Id). Si llega y difiere del tenant activo, el paciente no está disponible (404). |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<EverythingBundleResponseDto>` · DTO `EverythingBundleResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | — | Paciente por el que se preguntó | `src/modules/health_data/dto/health-data.dto.ts:1709` |
| `includedPatientProfileIds` | `array<string>` | Sí | formato uuid | — | Perfiles del clúster de identidad que se expandieron | `src/modules/health_data/dto/health-data.dto.ts:1719` |
| `identityClusterId` | `string` | No | formato uuid | — | Clúster de identidad resuelto | `src/modules/health_data/dto/health-data.dto.ts:1728` |
| `entries` | `array<EverythingEntryDto>` | Sí | — | — | Valor de entries mantenido por la instancia. | `src/modules/health_data/dto/health-data.dto.ts:1734` |
| `entries[].resourceId` | `string` | Sí | formato uuid | — | Identificador asociado a resource. | `src/modules/health_data/dto/health-data.dto.ts:1671` |
| `entries[].resourceTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a resource type concept. | `src/modules/health_data/dto/health-data.dto.ts:1677` |
| `entries[].versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/health_data/dto/health-data.dto.ts:1683` |
| `entries[].versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/health_data/dto/health-data.dto.ts:1689` |
| `entries[].payload` | `object` | Sí | — | — | Payload normalizado de la versión vigente | `src/modules/health_data/dto/health-data.dto.ts:1695` |
| `total` | `number` | Sí | — | — | Recursos incluidos | `src/modules/health_data/dto/health-data.dto.ts:1740` |
| `contentHash` | `string` | Sí | — | — | Hash del Bundle; permite validar la frescura de una caché | `src/modules/health_data/dto/health-data.dto.ts:1748` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/fhir-r5.controller.spec.ts:46` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `UC-52-13`

---

## 3. POST /health-data/canonical-resources/{id}/bindings

- **Origen:** CONTRATO
- **Nombre:** Enlazar el recurso a una entidad de dominio
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthDataController.createBinding` — `src/modules/health_data/controllers/health-data.controller.ts:235`

### Qué es y para qué sirve (negocio)

Enlazar el recurso a una entidad de dominio. Caso de uso UC-52-06: Enlazar a entidad de dominio. Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_data/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /health-data/canonical-resources/{id}/bindings` la atiende `HealthDataController.createBinding` (src/modules/health_data/controllers/health-data.controller.ts:235). Exige sesión con alguno de los roles CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN. Valida el cuerpo como `CreateResourceBindingDto` (4 campos, 2 obligatorios). Delega en `CanonicalResourcesService.createBinding`. Crea filas en health_data.canonical_resource_bindings, health_data.health_lineage_edges. Actualiza health_data.canonical_health_resources. Lee health_data.canonical_health_resources, health_data.canonical_resource_bindings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN | `src/modules/health_data/controllers/health-data.controller.ts:235` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_data/controllers/health-data.controller.ts:235` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.canonical_health_resources` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthDataController.createBinding → CanonicalResourcesService.createBinding | `src/modules/health_data/services/canonical-resources.service.ts:329` |
| `health_data.canonical_health_resources` | LEE | LEE | DIRECTA | HealthDataController.createBinding → CanonicalResourcesService.createBinding → CanonicalResourcesRepository.findResourceForUpdate | `src/modules/health_data/repositories/canonical-resources.repository.ts:158` |
| `health_data.canonical_resource_bindings` | ESCRIBE | CREA | DIRECTA | HealthDataController.createBinding → CanonicalResourcesService.createBinding → CanonicalResourcesRepository.createBinding | `src/modules/health_data/repositories/canonical-resources.repository.ts:554` |
| `health_data.canonical_resource_bindings` | LEE | LEE | DIRECTA | HealthDataController.createBinding → CanonicalResourcesService.createBinding → CanonicalResourcesRepository.findBinding | `src/modules/health_data/repositories/canonical-resources.repository.ts:590` |
| `health_data.health_lineage_edges` | ESCRIBE | CREA | DIRECTA | HealthDataController.createBinding → CanonicalResourcesService.createBinding → HealthProvenanceRepository.createLineageEdge | `src/modules/health_data/repositories/health-provenance.repository.ts:202` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateResourceBindingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `domainEntityTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de entidad de dominio (catálogo abierto) | `src/modules/health_data/dto/health-data.dto.ts:748` |
| `domainEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | Entidad de dominio concreta | `src/modules/health_data/dto/health-data.dto.ts:755` |
| `bindingRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:763` |
| `mappingVersionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Versión del mapeo terminológico aplicado | `src/modules/health_data/dto/health-data.dto.ts:774` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "domainEntityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "domainEntityId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "domainEntityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "domainEntityId": "00000000-0000-4000-8000-000000000001",
  "bindingRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "mappingVersionId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ResourceBindingResponseDto>` · DTO `ResourceBindingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_data/dto/health-data.dto.ts:785` |
| `canonicalHealthResourceId` | `string` | Sí | formato uuid | — | Identificador asociado a canonical health resource. | `src/modules/health_data/dto/health-data.dto.ts:791` |
| `bindingStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a binding status concept. | `src/modules/health_data/dto/health-data.dto.ts:797` |
| `lineageEdgeId` | `string` | Sí | formato uuid | — | Arista de linaje versión → entidad de dominio | `src/modules/health_data/dto/health-data.dto.ts:806` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso canónico no encontrado |
| 409 | `CONFLICT` | ConflictException: Ese enlace ya existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El recurso está retirado; PreconditionFailedException: El recurso no tiene versión vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/health-data.controller.spec.ts:127` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `UC-52-06`

---

## 4. POST /health-data/canonical-resources/{id}/identifiers

- **Origen:** CONTRATO
- **Nombre:** Registrar un identificador de negocio del recurso
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthDataController.registerIdentifier` — `src/modules/health_data/controllers/health-data.controller.ts:195`

### Qué es y para qué sirve (negocio)

Registrar un identificador de negocio del recurso. Caso de uso UC-52-04: Identificadores de negocio. Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_data/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /health-data/canonical-resources/{id}/identifiers` la atiende `HealthDataController.registerIdentifier` (src/modules/health_data/controllers/health-data.controller.ts:195). Exige sesión con alguno de los roles INGESTION_WORKER, CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN. Valida el cuerpo como `RegisterIdentifierDto` (6 campos, 2 obligatorios). Delega en `CanonicalResourcesService.registerIdentifier`. Crea filas en health_data.canonical_resource_identifiers. Actualiza health_data.canonical_health_resources, health_data.canonical_resource_identifiers. Lee health_data.canonical_health_resources, health_data.canonical_resource_identifiers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: INGESTION_WORKER, CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN | `src/modules/health_data/controllers/health-data.controller.ts:195` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_data/controllers/health-data.controller.ts:195` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.canonical_health_resources` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthDataController.registerIdentifier → CanonicalResourcesService.registerIdentifier | `src/modules/health_data/services/canonical-resources.service.ts:126` |
| `health_data.canonical_health_resources` | LEE | LEE | DIRECTA | HealthDataController.registerIdentifier → CanonicalResourcesService.registerIdentifier → CanonicalResourcesRepository.findResourceForUpdate | `src/modules/health_data/repositories/canonical-resources.repository.ts:158` |
| `health_data.canonical_resource_identifiers` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthDataController.registerIdentifier → CanonicalResourcesService.registerIdentifier | `src/modules/health_data/services/canonical-resources.service.ts:111` |
| `health_data.canonical_resource_identifiers` | ESCRIBE | CREA | DIRECTA | HealthDataController.registerIdentifier → CanonicalResourcesService.registerIdentifier → CanonicalResourcesRepository.createIdentifier | `src/modules/health_data/repositories/canonical-resources.repository.ts:348` |
| `health_data.canonical_resource_identifiers` | LEE | LEE | DIRECTA | HealthDataController.registerIdentifier → CanonicalResourcesService.registerIdentifier → CanonicalResourcesRepository.findIdentifier | `src/modules/health_data/repositories/canonical-resources.repository.ts:380` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RegisterIdentifierDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `identifierSystem` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | Sistema emisor del identificador | `src/modules/health_data/dto/health-data.dto.ts:571` |
| `identifierValue` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/health_data/dto/health-data.dto.ts:579` |
| `identifierTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:587` |
| `assigningAuthority` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/health_data/dto/health-data.dto.ts:596` |
| `isPrimary` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Sólo uno vigente por sistema; el anterior se cierra | `src/modules/health_data/dto/health-data.dto.ts:607` |
| `effectiveFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/health_data/dto/health-data.dto.ts:615` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "identifierSystem": "valor-ejemplo",
  "identifierValue": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "identifierSystem": "valor-ejemplo",
  "identifierValue": "valor-ejemplo",
  "identifierTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "assigningAuthority": "valor-ejemplo",
  "isPrimary": false,
  "effectiveFrom": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<IdentifierResponseDto>` · DTO `IdentifierResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_data/dto/health-data.dto.ts:626` |
| `canonicalHealthResourceId` | `string` | Sí | formato uuid | — | Identificador asociado a canonical health resource. | `src/modules/health_data/dto/health-data.dto.ts:632` |
| `isPrimary` | `boolean` | Sí | — | — | Valor de is primary mantenido por la instancia. | `src/modules/health_data/dto/health-data.dto.ts:638` |
| `supersededIdentifierId` | `string` | No | formato uuid | — | Identificador principal que se cerró | `src/modules/health_data/dto/health-data.dto.ts:647` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso canónico no encontrado |
| 409 | `CONFLICT` | ConflictException: El recurso ya tiene ese identificador |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El recurso está retirado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/health-data.controller.spec.ts:107` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `UC-52-04`

---

## 5. POST /health-data/canonical-resources/{id}/relationships

- **Origen:** CONTRATO
- **Nombre:** Relacionar dos recursos canónicos
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthDataController.createRelationship` — `src/modules/health_data/controllers/health-data.controller.ts:215`

### Qué es y para qué sirve (negocio)

Relacionar dos recursos canónicos. Caso de uso UC-52-05: Relacionar recursos (grafo clínico). Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_data/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /health-data/canonical-resources/{id}/relationships` la atiende `HealthDataController.createRelationship` (src/modules/health_data/controllers/health-data.controller.ts:215). Exige sesión con alguno de los roles DATA_STEWARD, CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN. Valida el cuerpo como `HealthDataCreateRelationshipDto` (5 campos, 2 obligatorios). Delega en `CanonicalResourcesService.createRelationship`. Crea filas en health_data.canonical_resource_relationships. Actualiza health_data.canonical_resource_relationships. Lee health_data.canonical_health_resources, health_data.canonical_resource_relationships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_STEWARD, CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN | `src/modules/health_data/controllers/health-data.controller.ts:215` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_data/controllers/health-data.controller.ts:215` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.canonical_health_resources` | LEE | LEE | DIRECTA | HealthDataController.createRelationship → CanonicalResourcesService.createRelationship → CanonicalResourcesRepository.findResourceForUpdate | `src/modules/health_data/repositories/canonical-resources.repository.ts:158` |
| `health_data.canonical_resource_relationships` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthDataController.createRelationship → CanonicalResourcesService.createRelationship | `src/modules/health_data/services/canonical-resources.service.ts:226` |
| `health_data.canonical_resource_relationships` | ESCRIBE | CREA | DIRECTA | HealthDataController.createRelationship → CanonicalResourcesService.createRelationship → CanonicalResourcesRepository.createRelationship | `src/modules/health_data/repositories/canonical-resources.repository.ts:446` |
| `health_data.canonical_resource_relationships` | LEE | LEE | DIRECTA | HealthDataController.createRelationship → CanonicalResourcesService.createRelationship → CanonicalResourcesRepository.findLiveRelationshipForUpdate | `src/modules/health_data/repositories/canonical-resources.repository.ts:469` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `HealthDataCreateRelationshipDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetResourceId` | `string` | Sí | formato uuid | `@IsUUID()` | Recurso al que apunta la relación | `src/modules/health_data/dto/health-data.dto.ts:665` |
| `relationshipTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de relación (catálogo abierto) | `src/modules/health_data/dto/health-data.dto.ts:675` |
| `relationshipRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:683` |
| `effectiveFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/health_data/dto/health-data.dto.ts:691` |
| `confidenceScore` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Confianza, como cadena decimal | `src/modules/health_data/dto/health-data.dto.ts:699` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "targetResourceId": "00000000-0000-4000-8000-000000000001",
  "relationshipTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "targetResourceId": "00000000-0000-4000-8000-000000000001",
  "relationshipTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "relationshipRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "confidenceScore": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<RelationshipResponseDto>` · DTO `RelationshipResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id de la relación creada | `src/modules/health_data/dto/health-data.dto.ts:710` |
| `sourceConceptId` | `string` | Sí | — | — | Id del concepto origen | sin fuente |
| `targetConceptId` | `string` | Sí | — | — | Id del concepto destino | sin fuente |
| `relationshipTypeConceptId` | `string` | Sí | — | — | Tipo de relación (concepto) | sin fuente |
| `ordinal` | `number` | No | — | — | Orden dentro de las relaciones del mismo tipo | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso canónico no encontrado; ResourceNotFoundException: Recurso canónico destino no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un recurso no se relaciona consigo mismo; PreconditionFailedException: Los recursos son de custodios distintos; PreconditionFailedException: Alguno de los recursos está retirado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/health-data.controller.spec.ts:117` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `UC-52-05`

---

## 6. POST /health-data/canonical-resources/{id}/retire

- **Origen:** CONTRATO
- **Nombre:** Retirar el recurso canónico (borrado lógico)
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthDataController.retireResource` — `src/modules/health_data/controllers/health-data.controller.ts:362`

### Qué es y para qué sirve (negocio)

Retirar el recurso canónico (borrado lógico). Caso de uso UC-52-14: Retiro gobernado del recurso. Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_data/README.md:61`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /health-data/canonical-resources/{id}/retire` la atiende `HealthDataController.retireResource` (src/modules/health_data/controllers/health-data.controller.ts:362). Exige sesión con alguno de los roles CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN. Valida el cuerpo como `RetireResourceDto` (1 campo, 1 obligatorio). Delega en `CanonicalResourcesService.retireResource`. Crea filas en health_data.health_provenance_records, health_data.health_provenance_targets. Actualiza health_data.canonical_health_resources, health_data.canonical_resource_bindings, health_data.canonical_resource_relationships. Lee health_data.canonical_health_resources, health_data.canonical_resource_bindings, health_data.canonical_resource_relationships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICAL_INFORMATICIAN, HEALTH_DATA_ADMIN | `src/modules/health_data/controllers/health-data.controller.ts:362` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_data/controllers/health-data.controller.ts:362` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.canonical_health_resources` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthDataController.retireResource → CanonicalResourcesService.retireResource | `src/modules/health_data/services/canonical-resources.service.ts:402` |
| `health_data.canonical_health_resources` | LEE | LEE | DIRECTA | HealthDataController.retireResource → CanonicalResourcesService.retireResource → CanonicalResourcesRepository.findResourceForUpdate | `src/modules/health_data/repositories/canonical-resources.repository.ts:158` |
| `health_data.canonical_resource_bindings` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthDataController.retireResource → CanonicalResourcesService.retireResource | `src/modules/health_data/services/canonical-resources.service.ts:377` |
| `health_data.canonical_resource_bindings` | LEE | LEE | DIRECTA | HealthDataController.retireResource → CanonicalResourcesService.retireResource → CanonicalResourcesRepository.findLiveBindingsForUpdate | `src/modules/health_data/repositories/canonical-resources.repository.ts:609` |
| `health_data.canonical_resource_relationships` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthDataController.retireResource → CanonicalResourcesService.retireResource | `src/modules/health_data/services/canonical-resources.service.ts:383` |
| `health_data.canonical_resource_relationships` | LEE | LEE | DIRECTA | HealthDataController.retireResource → CanonicalResourcesService.retireResource → CanonicalResourcesRepository.findLiveRelationshipsForUpdate | `src/modules/health_data/repositories/canonical-resources.repository.ts:492` |
| `health_data.health_provenance_records` | ESCRIBE | CREA | DIRECTA | HealthDataController.retireResource → CanonicalResourcesService.retireResource → HealthProvenanceRepository.createProvenanceRecord | `src/modules/health_data/repositories/health-provenance.repository.ts:122` |
| `health_data.health_provenance_targets` | ESCRIBE | CREA | DIRECTA | HealthDataController.retireResource → CanonicalResourcesService.retireResource → HealthProvenanceRepository.createProvenanceTarget | `src/modules/health_data/repositories/health-provenance.repository.ts:173` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RetireResourceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | longitud máxima 1000 | `@IsString()` `@MaxLength(1000)` | Por qué se retira | `src/modules/health_data/dto/health-data.dto.ts:1763` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<RetireResourceResponseDto>` · DTO `RetireResourceResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_data/dto/health-data.dto.ts:1774` |
| `lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a lifecycle status concept. | `src/modules/health_data/dto/health-data.dto.ts:1780` |
| `closedBindings` | `number` | Sí | — | — | Bindings que quedan cerrados | `src/modules/health_data/dto/health-data.dto.ts:1786` |
| `closedRelationships` | `number` | Sí | — | — | Relaciones que quedan cerradas | `src/modules/health_data/dto/health-data.dto.ts:1792` |
| `provenanceRecordId` | `string` | Sí | formato uuid | — | Procedencia registrada del retiro | `src/modules/health_data/dto/health-data.dto.ts:1801` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Recurso canónico no encontrado |
| 409 | `CONFLICT` | ConflictException: El recurso ya está retirado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/health-data.controller.spec.ts:194` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `UC-52-14`

---

## 7. POST /health-data/canonical-resources/project

- **Origen:** CONTRATO
- **Nombre:** Proyectar el registro a recurso canónico y versionarlo
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthDataController.projectResource` — `src/modules/health_data/controllers/health-data.controller.ts:175`

### Qué es y para qué sirve (negocio)

Proyectar el registro a recurso canónico y versionarlo. Caso de uso UC-52-03: Proyectar recurso canónico y versionarlo. Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_data/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /health-data/canonical-resources/project` la atiende `HealthDataController.projectResource` (src/modules/health_data/controllers/health-data.controller.ts:175). Exige sesión con alguno de los roles INGESTION_WORKER, HEALTH_DATA_ADMIN. Valida el cuerpo como `ProjectCanonicalResourceDto` (11 campos, 3 obligatorios). Delega en `HealthIngestionService.projectResource`. Crea filas en health_data.canonical_health_resource_versions, health_data.canonical_health_resources, health_data.health_lineage_edges, health_data.health_provenance_records, health_data.health_provenance_targets. Actualiza health_data.canonical_health_resources. Lee health_data.canonical_health_resource_versions, health_data.canonical_health_resources, health_data.health_ingestion_batches, health_data.health_ingestion_records, health_data.health_source_connections, health_data.health_source_systems.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: INGESTION_WORKER, HEALTH_DATA_ADMIN | `src/modules/health_data/controllers/health-data.controller.ts:175` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.canonical_health_resource_versions` | ESCRIBE | CREA | DIRECTA | HealthDataController.projectResource → HealthIngestionService.projectResource → CanonicalResourcesRepository.createResourceVersion | `src/modules/health_data/repositories/canonical-resources.repository.ts:235` |
| `health_data.canonical_health_resource_versions` | LEE | LEE | DIRECTA | HealthDataController.projectResource → HealthIngestionService.projectResource → CanonicalResourcesRepository.findLatestVersion | `src/modules/health_data/repositories/canonical-resources.repository.ts:285` |
| `health_data.canonical_health_resources` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthDataController.projectResource → HealthIngestionService.projectResource | `src/modules/health_data/services/health-ingestion.service.ts:478` |
| `health_data.canonical_health_resources` | ESCRIBE | CREA | DIRECTA | HealthDataController.projectResource → HealthIngestionService.projectResource → CanonicalResourcesRepository.createResource | `src/modules/health_data/repositories/canonical-resources.repository.ts:119` |
| `health_data.canonical_health_resources` | LEE | LEE | DIRECTA | HealthDataController.projectResource → HealthIngestionService.projectResource → CanonicalResourcesRepository.findResourceByLogicalIdForUpdate | `src/modules/health_data/repositories/canonical-resources.repository.ts:172` |
| `health_data.health_ingestion_batches` | LEE | LEE | DIRECTA | HealthDataController.projectResource → HealthIngestionService.projectResource → HealthIngestionRepository.findBatchById | `src/modules/health_data/repositories/health-ingestion.repository.ts:278` |
| `health_data.health_ingestion_records` | LEE | LEE | DIRECTA | HealthDataController.projectResource → HealthIngestionService.projectResource → HealthIngestionRepository.findRecordForUpdate | `src/modules/health_data/repositories/health-ingestion.repository.ts:368` |
| `health_data.health_lineage_edges` | ESCRIBE | CREA | DIRECTA | HealthDataController.projectResource → HealthIngestionService.projectResource → HealthProvenanceRepository.createLineageEdge | `src/modules/health_data/repositories/health-provenance.repository.ts:202` |
| `health_data.health_provenance_records` | ESCRIBE | CREA | DIRECTA | HealthDataController.projectResource → HealthIngestionService.projectResource → HealthProvenanceRepository.createProvenanceRecord | `src/modules/health_data/repositories/health-provenance.repository.ts:122` |
| `health_data.health_provenance_targets` | ESCRIBE | CREA | DIRECTA | HealthDataController.projectResource → HealthIngestionService.projectResource → HealthProvenanceRepository.createProvenanceTarget | `src/modules/health_data/repositories/health-provenance.repository.ts:173` |
| `health_data.health_source_connections` | LEE | LEE | DIRECTA | HealthDataController.projectResource → HealthIngestionService.projectResource → HealthIngestionService.assertSourceSystemCoherent → HealthIngestionRepository.findConnectionById | `src/modules/health_data/repositories/health-ingestion.repository.ts:127` |
| `health_data.health_source_systems` | LEE | LEE | DIRECTA | HealthDataController.projectResource → HealthIngestionService.projectResource → HealthIngestionService.assertSourceSystemCoherent → HealthIngestionRepository.findSourceSystemById | `src/modules/health_data/repositories/health-ingestion.repository.ts:141` |

### Cuerpo — DTO `ProjectCanonicalResourceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `healthIngestionRecordId` | `string` | Sí | formato uuid | `@IsUUID()` | Registro crudo del que sale la proyección | `src/modules/health_data/dto/health-data.dto.ts:403` |
| `logicalIdentifier` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | Identificador lógico del recurso en el custodio | `src/modules/health_data/dto/health-data.dto.ts:414` |
| `normalizedPayloadJson` | `object` | Sí | — | `@MaxJsonSize(256 * 1024)` `@IsObject()` | Payload normalizado del recurso | `src/modules/health_data/dto/health-data.dto.ts:422` |
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Obsoleto: el custodio se deriva de la sesión (X-Tenant-Id). Si llega, debe coincidir con él; nunca es fuente de verdad. | `src/modules/health_data/dto/health-data.dto.ts:435` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente al que pertenece el recurso | `src/modules/health_data/dto/health-data.dto.ts:446` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:454` |
| `sourceSystemId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:462` |
| `payloadFormatConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Formato del payload (catálogo abierto) | `src/modules/health_data/dto/health-data.dto.ts:473` |
| `originalPayloadFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:481` |
| `effectiveStartAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/health_data/dto/health-data.dto.ts:489` |
| `securityLabelsJson` | `object` | No | — | `@IsOptional()` `@MaxJsonSize(256 * 1024)` `@IsObject()` | Etiquetas de seguridad del recurso | `src/modules/health_data/dto/health-data.dto.ts:498` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "healthIngestionRecordId": "00000000-0000-4000-8000-000000000001",
  "logicalIdentifier": "valor-ejemplo",
  "normalizedPayloadJson": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CanonicalResourceVersionResponseDto>` · DTO `CanonicalResourceVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `resourceId` | `string` | Sí | formato uuid | — | Identificador asociado a resource. | `src/modules/health_data/dto/health-data.dto.ts:509` |
| `versionId` | `string` | No | formato uuid | — | Ausente si el contenido no cambió | `src/modules/health_data/dto/health-data.dto.ts:518` |
| `versionNumber` | `number` | No | — | — | Ausente si el contenido no cambió | `src/modules/health_data/dto/health-data.dto.ts:524` |
| `contentHash` | `string` | Sí | — | — | Valor de content hash mantenido por la instancia. | `src/modules/health_data/dto/health-data.dto.ts:530` |
| `created` | `boolean` | Sí | — | — | true si el recurso se creó en esta proyección | `src/modules/health_data/dto/health-data.dto.ts:536` |
| `unchanged` | `boolean` | Sí | — | — | true si el payload es idéntico al vigente y no se versionó | `src/modules/health_data/dto/health-data.dto.ts:544` |
| `provenanceRecordId` | `string` | No | formato uuid | — | Procedencia registrada de la ingesta | `src/modules/health_data/dto/health-data.dto.ts:553` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El sistema de origen no corresponde a la conexión del lote; PreconditionFailedException: El registro no está en cola de proyección; PreconditionFailedException: El recurso está retirado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/health-data.controller.spec.ts:97` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `UC-52-03`

---

## 8. POST /health-data/deidentification-runs

- **Origen:** CONTRATO
- **Nombre:** Registrar una corrida de de-identificación
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthDataController.recordDeidRun` — `src/modules/health_data/controllers/health-data.controller.ts:341`

### Qué es y para qué sirve (negocio)

Registrar una corrida de de-identificación. Caso de uso UC-52-11: Corrida de de-identificación. Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_data/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /health-data/deidentification-runs` la atiende `HealthDataController.recordDeidRun` (src/modules/health_data/controllers/health-data.controller.ts:341). Exige sesión con alguno de los roles PRIVACY_OFFICER, HEALTH_DATA_ADMIN. Valida el cuerpo como `RecordDeidRunDto` (11 campos, 5 obligatorios). Delega en `DataReleaseService.recordDeidRun`. Crea filas en health_data.health_deidentification_runs, health_data.health_lineage_edges, health_data.health_provenance_records, health_data.health_provenance_targets. Lee common.files, consent.consents, health_data.canonical_health_resource_versions, health_data.canonical_health_resources, health_data.health_deidentification_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRIVACY_OFFICER, HEALTH_DATA_ADMIN | `src/modules/health_data/controllers/health-data.controller.ts:341` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.files` | LEE | LEE | DIRECTA | HealthDataController.recordDeidRun → DataReleaseService.recordDeidRun → DataReleaseService.assertFileInTenant | `src/modules/health_data/services/data-release.service.ts:632` |
| `consent.consents` | LEE | LEE | DIRECTA | HealthDataController.recordDeidRun → DataReleaseService.recordDeidRun → DataReleaseService.assertConsentInTenant | `src/modules/health_data/services/data-release.service.ts:602` |
| `health_data.canonical_health_resource_versions` | LEE | LEE | DIRECTA | HealthDataController.recordDeidRun → DataReleaseService.recordDeidRun → DataReleaseService.assertVersionsInTenant → CanonicalResourcesRepository.findVersionsByIds | `src/modules/health_data/repositories/canonical-resources.repository.ts:303` |
| `health_data.canonical_health_resources` | LEE | LEE | DIRECTA | HealthDataController.recordDeidRun → DataReleaseService.recordDeidRun → DataReleaseService.assertVersionsInTenant → CanonicalResourcesRepository.findResourcesByIds | `src/modules/health_data/repositories/canonical-resources.repository.ts:225` |
| `health_data.health_deidentification_profiles` | LEE | LEE | DIRECTA | HealthDataController.recordDeidRun → DataReleaseService.recordDeidRun → DataReleaseRepository.findDeidProfileById | `src/modules/health_data/repositories/data-release.repository.ts:31` |
| `health_data.health_deidentification_runs` | ESCRIBE | CREA | DIRECTA | HealthDataController.recordDeidRun → DataReleaseService.recordDeidRun → DataReleaseRepository.createDeidRun | `src/modules/health_data/repositories/data-release.repository.ts:150` |
| `health_data.health_lineage_edges` | ESCRIBE | CREA | DIRECTA | HealthDataController.recordDeidRun → DataReleaseService.recordDeidRun → HealthProvenanceRepository.createLineageEdge | `src/modules/health_data/repositories/health-provenance.repository.ts:202` |
| `health_data.health_provenance_records` | ESCRIBE | CREA | DIRECTA | HealthDataController.recordDeidRun → DataReleaseService.recordDeidRun → HealthProvenanceRepository.createProvenanceRecord | `src/modules/health_data/repositories/health-provenance.repository.ts:122` |
| `health_data.health_provenance_targets` | ESCRIBE | CREA | DIRECTA | HealthDataController.recordDeidRun → DataReleaseService.recordDeidRun → HealthProvenanceRepository.createProvenanceTarget | `src/modules/health_data/repositories/health-provenance.repository.ts:173` |

### Cuerpo — DTO `RecordDeidRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `healthDeidentificationProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:1351` |
| `purposeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Propósito de la liberación (catálogo abierto) | `src/modules/health_data/dto/health-data.dto.ts:1361` |
| `startedAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/health_data/dto/health-data.dto.ts:1368` |
| `outcome` | `string` | Sí | valores: COMPLETED, FAILED | `@IsIn(DEID_OUTCOMES)` | — | `src/modules/health_data/dto/health-data.dto.ts:1375` |
| `recordsProcessed` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Registros procesados; cadena por ser bigint | `src/modules/health_data/dto/health-data.dto.ts:1385` |
| `consentDirectiveId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Directiva de consentimiento que autoriza el propósito | `src/modules/health_data/dto/health-data.dto.ts:1396` |
| `inputManifestFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:1404` |
| `outputManifestFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:1412` |
| `recordsRejected` | `string` | No | — | `@IsOptional()` `@IsNumberString({ no_symbols: true })` | Cadena por ser bigint | `src/modules/health_data/dto/health-data.dto.ts:1420` |
| `verificationSummaryJson` | `object` | No | — | `@IsOptional()` `@MaxJsonSize(256 * 1024)` `@IsObject()` | Resultado de la verificación de re-identificación | `src/modules/health_data/dto/health-data.dto.ts:1431` |
| `sourceVersionIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID(undefined, { each: true })` | Versiones canónicas de las que salió la salida | `src/modules/health_data/dto/health-data.dto.ts:1444` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "healthDeidentificationProfileId": "00000000-0000-4000-8000-000000000001",
  "purposeConceptId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "outcome": "COMPLETED",
  "recordsProcessed": "5000"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<DeidRunResponseDto>` · DTO `DeidRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_data/dto/health-data.dto.ts:1455` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/health_data/dto/health-data.dto.ts:1461` |
| `provenanceRecordId` | `string` | Sí | formato uuid | — | Procedencia registrada de la de-identificación | `src/modules/health_data/dto/health-data.dto.ts:1470` |
| `lineageEdgeCount` | `number` | Sí | — | — | Aristas de linaje versión → manifiesto de salida | `src/modules/health_data/dto/health-data.dto.ts:1478` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de origen no encontrada; ResourceNotFoundException: Consentimiento no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El perfil de de-identificación no está activo; PreconditionFailedException: Una corrida completada debe declarar su manifiesto de salida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/health-data.controller.spec.ts:184` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `UC-52-11`

---

## 9. POST /health-data/identity/candidates/{id}/decision

- **Origen:** CONTRATO
- **Nombre:** Resolver un candidato de identidad longitudinal
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthDataController.resolveCandidate` — `src/modules/health_data/controllers/health-data.controller.ts:301`

### Qué es y para qué sirve (negocio)

Resolver un candidato de identidad longitudinal. Caso de uso UC-52-09: Resolver identidad longitudinal (MPI). Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_data/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /health-data/identity/candidates/{id}/decision` la atiende `HealthDataController.resolveCandidate` (src/modules/health_data/controllers/health-data.controller.ts:301). Exige sesión con alguno de los roles MPI_STEWARD, HEALTH_DATA_ADMIN. Valida el cuerpo como `ResolveMatchCandidateDto` (4 campos, 2 obligatorios). Delega en `PatientIdentityService.resolveCandidate`. Crea filas en health_data.patient_identity_clusters, health_data.patient_identity_members, health_data.patient_match_decisions. Actualiza health_data.patient_identity_clusters, health_data.patient_match_candidates. Lee health_data.patient_identity_clusters, health_data.patient_identity_members, health_data.patient_match_candidates, health_data.patient_match_decisions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MPI_STEWARD, HEALTH_DATA_ADMIN | `src/modules/health_data/controllers/health-data.controller.ts:301` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_data/controllers/health-data.controller.ts:301` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.patient_identity_clusters` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthDataController.resolveCandidate → PatientIdentityService.resolveCandidate | `src/modules/health_data/services/patient-identity.service.ts:169` |
| `health_data.patient_identity_clusters` | ESCRIBE | CREA | DIRECTA | HealthDataController.resolveCandidate → PatientIdentityService.resolveCandidate → PatientIdentityRepository.createCluster | `src/modules/health_data/repositories/patient-identity.repository.ts:153` |
| `health_data.patient_identity_clusters` | LEE | LEE | DIRECTA | HealthDataController.resolveCandidate → PatientIdentityService.resolveCandidate → PatientIdentityRepository.findClusterByMemberForUpdate | `src/modules/health_data/repositories/patient-identity.repository.ts:200` |
| `health_data.patient_identity_members` | ESCRIBE | CREA | DIRECTA | HealthDataController.resolveCandidate → PatientIdentityService.resolveCandidate → PatientIdentityRepository.createMember | `src/modules/health_data/repositories/patient-identity.repository.ts:256` |
| `health_data.patient_identity_members` | LEE | LEE | DIRECTA | HealthDataController.resolveCandidate → PatientIdentityService.resolveCandidate → PatientIdentityRepository.findClusterByMemberForUpdate | `src/modules/health_data/repositories/patient-identity.repository.ts:192` |
| `health_data.patient_match_candidates` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthDataController.resolveCandidate → PatientIdentityService.resolveCandidate | `src/modules/health_data/services/patient-identity.service.ts:100` |
| `health_data.patient_match_candidates` | LEE | LEE | DIRECTA | HealthDataController.resolveCandidate → PatientIdentityService.resolveCandidate → PatientIdentityRepository.findCandidateForUpdate | `src/modules/health_data/repositories/patient-identity.repository.ts:47` |
| `health_data.patient_match_decisions` | ESCRIBE | CREA | DIRECTA | HealthDataController.resolveCandidate → PatientIdentityService.resolveCandidate → PatientIdentityRepository.createDecision | `src/modules/health_data/repositories/patient-identity.repository.ts:84` |
| `health_data.patient_match_decisions` | LEE | LEE | DIRECTA | HealthDataController.resolveCandidate → PatientIdentityService.resolveCandidate → PatientIdentityRepository.findDecisionByCandidate | `src/modules/health_data/repositories/patient-identity.repository.ts:112` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ResolveMatchCandidateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: MATCH, NO_MATCH | `@IsIn(MATCH_DECISIONS)` | — | `src/modules/health_data/dto/health-data.dto.ts:1124` |
| `reasonText` | `string` | Sí | longitud máxima 1000 | `@IsString()` `@MaxLength(1000)` | Por qué se decide así | `src/modules/health_data/dto/health-data.dto.ts:1132` |
| `evidenceJson` | `object` | No | — | `@IsOptional()` `@MaxJsonSize(256 * 1024)` `@IsObject()` | Evidencia en la que se apoya la decisión | `src/modules/health_data/dto/health-data.dto.ts:1143` |
| `memberRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:1151` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "MATCH",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "MATCH",
  "reasonText": "Texto descriptivo de ejemplo",
  "evidenceJson": {},
  "memberRoleConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<MatchDecisionResponseDto>` · DTO `MatchDecisionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_data/dto/health-data.dto.ts:1162` |
| `candidateStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a candidate status concept. | `src/modules/health_data/dto/health-data.dto.ts:1168` |
| `clusterId` | `string` | No | formato uuid | — | Clúster en el que quedan los dos perfiles | `src/modules/health_data/dto/health-data.dto.ts:1177` |
| `clusterCreated` | `boolean` | Sí | — | — | true si el clúster se creó en esta decisión | `src/modules/health_data/dto/health-data.dto.ts:1183` |
| `addedMemberIds` | `array<string>` | Sí | formato uuid | — | Miembros añadidos al clúster | `src/modules/health_data/dto/health-data.dto.ts:1193` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Candidato no encontrado |
| 409 | `CONFLICT` | ConflictException: El candidato ya tiene decisión |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El candidato ya está resuelto |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/health-data.controller.spec.ts:160` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `UC-52-09`

---

## 10. POST /health-data/ingestion-batches

- **Origen:** CONTRATO
- **Nombre:** Abrir un lote de ingesta desde una conexión de origen
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthDataController.openBatch` — `src/modules/health_data/controllers/health-data.controller.ts:113`

### Qué es y para qué sirve (negocio)

Abrir un lote de ingesta desde una conexión de origen. Caso de uso UC-52-01: Abrir lote desde una conexión de origen. Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_data/README.md:48`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /health-data/ingestion-batches` la atiende `HealthDataController.openBatch` (src/modules/health_data/controllers/health-data.controller.ts:113). Exige sesión con alguno de los roles INGESTION_WORKER, HEALTH_DATA_ADMIN. Valida el cuerpo como `OpenIngestionBatchDto` (7 campos, 3 obligatorios). Delega en `HealthIngestionService.openBatch`. Crea filas en health_data.health_ingestion_batches. Lee health_data.health_ingestion_batches, health_data.health_source_connections, health_data.health_source_systems.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: INGESTION_WORKER, HEALTH_DATA_ADMIN | `src/modules/health_data/controllers/health-data.controller.ts:113` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_ingestion_batches` | ESCRIBE | CREA | DIRECTA | HealthDataController.openBatch → HealthIngestionService.openBatch → HealthIngestionRepository.createBatch | `src/modules/health_data/repositories/health-ingestion.repository.ts:245` |
| `health_data.health_ingestion_batches` | LEE | LEE | DIRECTA | HealthDataController.openBatch → HealthIngestionService.openBatch → HealthIngestionRepository.findBatchByIdentifier | `src/modules/health_data/repositories/health-ingestion.repository.ts:305` |
| `health_data.health_source_connections` | LEE | LEE | DIRECTA | HealthDataController.openBatch → HealthIngestionService.openBatch → HealthIngestionRepository.findConnectionForUpdate | `src/modules/health_data/repositories/health-ingestion.repository.ts:108` |
| `health_data.health_source_systems` | LEE | LEE | DIRECTA | HealthDataController.openBatch → HealthIngestionService.openBatch → HealthIngestionRepository.findSourceSystemById | `src/modules/health_data/repositories/health-ingestion.repository.ts:141` |

### Cuerpo — DTO `OpenIngestionBatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `healthSourceConnectionId` | `string` | Sí | formato uuid | `@IsUUID()` | Conexión de origen que trae el lote | `src/modules/health_data/dto/health-data.dto.ts:136` |
| `batchIdentifier` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Identificador del lote en el origen | `src/modules/health_data/dto/health-data.dto.ts:147` |
| `ingestionModeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Modo de ingesta (catálogo abierto) | `src/modules/health_data/dto/health-data.dto.ts:157` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Obsoleto: el tenant se deriva de la sesión (X-Tenant-Id). Si llega, debe coincidir con él; nunca es fuente de verdad. | `src/modules/health_data/dto/health-data.dto.ts:170` |
| `sourcePeriodStart` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/health_data/dto/health-data.dto.ts:178` |
| `sourcePeriodEnd` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/health_data/dto/health-data.dto.ts:186` |
| `payloadManifestFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Manifiesto del payload en almacenamiento | `src/modules/health_data/dto/health-data.dto.ts:197` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "healthSourceConnectionId": "00000000-0000-4000-8000-000000000001",
  "batchIdentifier": "valor-ejemplo",
  "ingestionModeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<IngestionBatchResponseDto>` · DTO `IngestionBatchResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_data/dto/health-data.dto.ts:208` |
| `batchIdentifier` | `string` | Sí | — | — | Valor de batch identifier mantenido por la instancia. | `src/modules/health_data/dto/health-data.dto.ts:214` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/health_data/dto/health-data.dto.ts:220` |
| `duplicate` | `boolean` | Sí | — | — | true si el lote ya existía y se devuelve el mismo | `src/modules/health_data/dto/health-data.dto.ts:228` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La conexión de origen no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/health-data.controller.spec.ts:64` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `UC-52-01`

---

## 11. POST /health-data/ingestion-batches/{id}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar el lote conciliando sus contadores
- **Bloque:** Datos y NoSQL
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthDataController.closeBatch` — `src/modules/health_data/controllers/health-data.controller.ts:155`

### Qué es y para qué sirve (negocio)

Cerrar el lote conciliando sus contadores. Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /health-data/ingestion-batches/{id}/close` la atiende `HealthDataController.closeBatch` (src/modules/health_data/controllers/health-data.controller.ts:155). Exige sesión con alguno de los roles INGESTION_WORKER, HEALTH_DATA_ADMIN. Valida el cuerpo como `CloseIngestionBatchDto` (2 campos, 0 obligatorios). Delega en `HealthIngestionService.closeBatch`. Lee health_data.health_ingestion_batches, health_data.health_ingestion_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: INGESTION_WORKER, HEALTH_DATA_ADMIN | `src/modules/health_data/controllers/health-data.controller.ts:155` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_data/controllers/health-data.controller.ts:155` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_ingestion_batches` | LEE | LEE | DIRECTA | HealthDataController.closeBatch → HealthIngestionService.closeBatch → HealthIngestionRepository.findBatchForUpdate | `src/modules/health_data/repositories/health-ingestion.repository.ts:292` |
| `health_data.health_ingestion_records` | LEE | LEE | DIRECTA | HealthDataController.closeBatch → HealthIngestionService.closeBatch → HealthIngestionRepository.findRecordsByBatch | `src/modules/health_data/repositories/health-ingestion.repository.ts:400` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CloseIngestionBatchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `contentHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash del contenido completo del lote | `src/modules/health_data/dto/health-data.dto.ts:336` |
| `recordsRejected` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Registros que el origen rechazó antes de llegar | `src/modules/health_data/dto/health-data.dto.ts:348` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "recordsRejected": 1
}
```

</details>

### Respuesta — `Promise<CloseBatchResponseDto>` · DTO `CloseBatchResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_data/dto/health-data.dto.ts:359` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/health_data/dto/health-data.dto.ts:365` |
| `recordsReceived` | `string` | Sí | — | — | Registros recibidos, contados contra la tabla; cadena por ser bigint | `src/modules/health_data/dto/health-data.dto.ts:374` |
| `recordsAccepted` | `string` | Sí | — | — | Cadena por ser bigint | `src/modules/health_data/dto/health-data.dto.ts:380` |
| `recordsRejected` | `string` | Sí | — | — | Cadena por ser bigint | `src/modules/health_data/dto/health-data.dto.ts:386` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El lote ya está cerrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/health-data.controller.spec.ts:87` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `ctrl:HealthDataController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /health-data/ingestion-batches/{id}/records

- **Origen:** CONTRATO
- **Nombre:** Registrar un registro crudo del lote
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthDataController.recordIngestionRecord` — `src/modules/health_data/controllers/health-data.controller.ts:134`

### Qué es y para qué sirve (negocio)

Registrar un registro crudo del lote. Caso de uso UC-52-02: Registro crudo y cierre con conteos. Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_data/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /health-data/ingestion-batches/{id}/records` la atiende `HealthDataController.recordIngestionRecord` (src/modules/health_data/controllers/health-data.controller.ts:134). Exige sesión con alguno de los roles INGESTION_WORKER, HEALTH_DATA_ADMIN. Valida el cuerpo como `RecordIngestionRecordDto` (6 campos, 3 obligatorios). Delega en `HealthIngestionService.recordIngestionRecord`. Crea filas en health_data.health_ingestion_records. Lee health_data.health_ingestion_batches, health_data.health_ingestion_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: INGESTION_WORKER, HEALTH_DATA_ADMIN | `src/modules/health_data/controllers/health-data.controller.ts:134` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_data/controllers/health-data.controller.ts:134` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_ingestion_batches` | LEE | LEE | DIRECTA | HealthDataController.recordIngestionRecord → HealthIngestionService.recordIngestionRecord → HealthIngestionRepository.findBatchForUpdate | `src/modules/health_data/repositories/health-ingestion.repository.ts:292` |
| `health_data.health_ingestion_records` | ESCRIBE | CREA | DIRECTA | HealthDataController.recordIngestionRecord → HealthIngestionService.recordIngestionRecord → HealthIngestionRepository.createRecord | `src/modules/health_data/repositories/health-ingestion.repository.ts:324` |
| `health_data.health_ingestion_records` | LEE | LEE | DIRECTA | HealthDataController.recordIngestionRecord → HealthIngestionService.recordIngestionRecord → HealthIngestionRepository.findRecordBySource | `src/modules/health_data/repositories/health-ingestion.repository.ts:382` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordIngestionRecordDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sourceRecordIdentifier` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | Identificador del registro en el origen | `src/modules/health_data/dto/health-data.dto.ts:246` |
| `resourceTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de recurso (catálogo abierto) | `src/modules/health_data/dto/health-data.dto.ts:256` |
| `payloadHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash del payload; detecta que nada cambió | `src/modules/health_data/dto/health-data.dto.ts:267` |
| `sourceVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Versión del registro en el origen | `src/modules/health_data/dto/health-data.dto.ts:279` |
| `sourceLastUpdatedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/health_data/dto/health-data.dto.ts:287` |
| `payloadFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Payload persistido en almacenamiento | `src/modules/health_data/dto/health-data.dto.ts:298` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "sourceRecordIdentifier": "valor-ejemplo",
  "resourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "payloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "sourceRecordIdentifier": "valor-ejemplo",
  "resourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "payloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "sourceVersion": "valor-ejemplo",
  "sourceLastUpdatedAt": "2026-07-31T12:00:00.000Z",
  "payloadFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<IngestionRecordResponseDto>` · DTO `IngestionRecordResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_data/dto/health-data.dto.ts:309` |
| `processingStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a processing status concept. | `src/modules/health_data/dto/health-data.dto.ts:315` |
| `duplicate` | `boolean` | Sí | — | — | true si el registro ya estaba en el lote | `src/modules/health_data/dto/health-data.dto.ts:321` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El lote ya no está recibiendo registros |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/health-data.controller.spec.ts:74` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `UC-52-02`

---

## 13. POST /health-data/quality-runs

- **Origen:** CONTRATO
- **Nombre:** Ejecutar reglas de calidad y abrir incidencias
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthDataController.recordQualityRun` — `src/modules/health_data/controllers/health-data.controller.ts:281`

### Qué es y para qué sirve (negocio)

Ejecutar reglas de calidad y abrir incidencias. Caso de uso UC-52-08: Reglas de calidad e incidencias. Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_data/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /health-data/quality-runs` la atiende `HealthDataController.recordQualityRun` (src/modules/health_data/controllers/health-data.controller.ts:281). Exige sesión con alguno de los roles DATA_STEWARD, HEALTH_DATA_ADMIN. Valida el cuerpo como `RecordQualityRunDto` (12 campos, 3 obligatorios). Delega en `HealthValidationService.recordQualityRun`. Crea filas en health_data.health_data_quality_issues, health_data.health_data_quality_runs. Actualiza health_data.health_data_quality_runs. Lee health_data.health_data_quality_issues, health_data.health_data_quality_rule_sets, health_data.health_data_quality_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_STEWARD, HEALTH_DATA_ADMIN | `src/modules/health_data/controllers/health-data.controller.ts:281` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_data_quality_issues` | ESCRIBE | CREA | DIRECTA | HealthDataController.recordQualityRun → HealthValidationService.recordQualityRun → HealthValidationRepository.createQualityIssue | `src/modules/health_data/repositories/health-validation.repository.ts:306` |
| `health_data.health_data_quality_issues` | LEE | LEE | DIRECTA | HealthDataController.recordQualityRun → HealthValidationService.recordQualityRun → HealthValidationRepository.findOpenIssue | `src/modules/health_data/repositories/health-validation.repository.ts:339` |
| `health_data.health_data_quality_rule_sets` | LEE | LEE | DIRECTA | HealthDataController.recordQualityRun → HealthValidationService.recordQualityRun → HealthValidationRepository.findRuleSetById | `src/modules/health_data/repositories/health-validation.repository.ts:183` |
| `health_data.health_data_quality_rules` | LEE | LEE | DIRECTA | HealthDataController.recordQualityRun → HealthValidationService.recordQualityRun → HealthValidationRepository.findActiveRules | `src/modules/health_data/repositories/health-validation.repository.ts:192` |
| `health_data.health_data_quality_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthDataController.recordQualityRun → HealthValidationService.recordQualityRun | `src/modules/health_data/services/health-validation.service.ts:304` |
| `health_data.health_data_quality_runs` | ESCRIBE | CREA | DIRECTA | HealthDataController.recordQualityRun → HealthValidationService.recordQualityRun → HealthValidationRepository.createQualityRun | `src/modules/health_data/repositories/health-validation.repository.ts:246` |

### Cuerpo — DTO `RecordQualityRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `healthDataQualityRuleSetId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:1018` |
| `startedAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/health_data/dto/health-data.dto.ts:1025` |
| `recordsEvaluated` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Registros evaluados; cadena por ser bigint | `src/modules/health_data/dto/health-data.dto.ts:1035` |
| `healthIngestionBatchId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ámbito: lote de ingesta | `src/modules/health_data/dto/health-data.dto.ts:1046` |
| `canonicalResourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ámbito: recurso canónico | `src/modules/health_data/dto/health-data.dto.ts:1057` |
| `findings` | `array<HealthDataQualityFindingDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => QualityFindingDto)` | — | `src/modules/health_data/dto/health-data.dto.ts:1067` |
| `findings[].healthDataQualityRuleId` | `string` | No | formato uuid | — | Regla que se incumple | sin fuente |
| `findings[].canonicalHealthResourceId` | `string` | No | formato uuid | — | — | sin fuente |
| `findings[].canonicalResourceVersionId` | `string` | No | formato uuid | — | — | sin fuente |
| `findings[].fieldPath` | `string` | No | longitud máxima 500 | — | Campo afectado | sin fuente |
| `findings[].observedValueHash` | `string` | No | longitud máxima 200 | — | Hash del valor observado; el valor en claro no se guarda | sin fuente |
| `summaryJson` | `object` | No | — | `@IsOptional()` `@MaxJsonSize(256 * 1024)` `@IsObject()` | — | `src/modules/health_data/dto/health-data.dto.ts:1076` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "healthDataQualityRuleSetId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "recordsEvaluated": "1200"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<QualityRunResponseDto>` · DTO `QualityRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_data/dto/health-data.dto.ts:1087` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | sin fuente |
| `evaluatedRecordCount` | `string` | Sí | — | — | Valor de evaluated record count mantenido por la instancia. | sin fuente |
| `failedRecordCount` | `string` | Sí | — | — | Valor de failed record count mantenido por la instancia. | sin fuente |
| `issuesOpened` | `number` | Sí | — | — | Hallazgos abiertos | sin fuente |
| `datasetQuarantined` | `boolean` | Sí | — | — | Verdadero si una regla bloqueante puso el dataset en cuarentena | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conjunto de reglas no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La corrida necesita un ámbito: lote de ingesta o recurso canónico; PreconditionFailedException: El conjunto de reglas no está activo; PreconditionFailedException: El hallazgo apunta a una regla que no está activa en el conjunto |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/health-data.controller.spec.ts:147` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `UC-52-08`

---

## 14. POST /health-data/source-connections

- **Origen:** CONTRATO
- **Nombre:** Dar de alta una conexión de origen (crea el sistema si no existe)
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthDataController.createSourceConnection` — `src/modules/health_data/controllers/health-data.controller.ts:93`

### Qué es y para qué sirve (negocio)

Dar de alta una conexión de origen (crea el sistema si no existe). Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /health-data/source-connections` la atiende `HealthDataController.createSourceConnection` (src/modules/health_data/controllers/health-data.controller.ts:93). Exige sesión con alguno de los roles HEALTH_DATA_ADMIN, CLINICAL_INFORMATICIAN, DATA_PLATFORM_ADMIN. Valida el cuerpo como `CreateSourceConnectionDto` (7 campos, 6 obligatorios). Delega en `HealthIngestionService.createSourceConnection`. Crea filas en health_data.health_source_connections, health_data.health_source_systems. Lee health_data.health_source_systems.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: HEALTH_DATA_ADMIN, CLINICAL_INFORMATICIAN, DATA_PLATFORM_ADMIN | `src/modules/health_data/controllers/health-data.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_source_connections` | ESCRIBE | CREA | DIRECTA | HealthDataController.createSourceConnection → HealthIngestionService.createSourceConnection → HealthIngestionRepository.createConnection | `src/modules/health_data/repositories/health-ingestion.repository.ts:218` |
| `health_data.health_source_systems` | ESCRIBE | CREA | DIRECTA | HealthDataController.createSourceConnection → HealthIngestionService.createSourceConnection → HealthIngestionRepository.createSourceSystem | `src/modules/health_data/repositories/health-ingestion.repository.ts:183` |
| `health_data.health_source_systems` | LEE | LEE | DIRECTA | HealthDataController.createSourceConnection → HealthIngestionService.createSourceConnection → HealthIngestionRepository.findSourceSystemByCode | `src/modules/health_data/repositories/health-ingestion.repository.ts:157` |

### Cuerpo — DTO `CreateSourceConnectionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Obsoleto: el tenant se deriva de la sesión (X-Tenant-Id). Si llega, debe coincidir con él; nunca es fuente de verdad. | `src/modules/health_data/dto/health-data.dto.ts:66` |
| `sourceSystemCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del sistema de origen; se crea si no existe | `src/modules/health_data/dto/health-data.dto.ts:77` |
| `sourceSystemName` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre del sistema de origen | `src/modules/health_data/dto/health-data.dto.ts:85` |
| `sourceTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de sistema de origen | `src/modules/health_data/dto/health-data.dto.ts:92` |
| `trustLevelConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Nivel de confianza del origen | `src/modules/health_data/dto/health-data.dto.ts:99` |
| `connectionTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de conexión | `src/modules/health_data/dto/health-data.dto.ts:106` |
| `endpointUri` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | URI del extremo del origen | `src/modules/health_data/dto/health-data.dto.ts:114` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "sourceSystemCode": "CODIGO_EJEMPLO",
  "sourceSystemName": "Nombre de ejemplo",
  "sourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "trustLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "connectionTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "endpointUri": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceSystemCode": "CODIGO_EJEMPLO",
  "sourceSystemName": "Nombre de ejemplo",
  "sourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "trustLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "connectionTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "endpointUri": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<SourceConnectionResponseDto>` · DTO `SourceConnectionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la conexión. | `src/modules/health_data/dto/health-data.dto.ts:120` |
| `healthSourceSystemId` | `string` | Sí | formato uuid | — | Sistema de origen del que cuelga (creado o reutilizado). | `src/modules/health_data/dto/health-data.dto.ts:122` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto de estado: nace activa. | `src/modules/health_data/dto/health-data.dto.ts:124` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `ctrl:HealthDataController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /health-data/timeline-entries

- **Origen:** CONTRATO
- **Nombre:** Proyectar una entrada de la línea de tiempo del paciente
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthDataController.projectTimelineEntry` — `src/modules/health_data/controllers/health-data.controller.ts:322`

### Qué es y para qué sirve (negocio)

Proyectar una entrada de la línea de tiempo del paciente. Caso de uso UC-52-10: Proyectar entrada de línea de tiempo. Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_data/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /health-data/timeline-entries` la atiende `HealthDataController.projectTimelineEntry` (src/modules/health_data/controllers/health-data.controller.ts:322). Exige sesión con alguno de los roles SYSTEM, HEALTH_DATA_ADMIN. Valida el cuerpo como `ProjectTimelineEntryDto` (13 campos, 5 obligatorios). Delega en `PatientIdentityService.projectTimelineEntry`. Crea filas en health_data.patient_timeline_entries. Lee health_data.patient_timeline_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, HEALTH_DATA_ADMIN | `src/modules/health_data/controllers/health-data.controller.ts:322` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.patient_timeline_entries` | ESCRIBE | CREA | DIRECTA | HealthDataController.projectTimelineEntry → PatientIdentityService.projectTimelineEntry → PatientIdentityRepository.createTimelineEntry | `src/modules/health_data/repositories/patient-identity.repository.ts:414` |
| `health_data.patient_timeline_entries` | LEE | LEE | DIRECTA | HealthDataController.projectTimelineEntry → PatientIdentityService.projectTimelineEntry → PatientIdentityRepository.findTimelineEntryBySource | `src/modules/health_data/repositories/patient-identity.repository.ts:447` |

### Cuerpo — DTO `ProjectTimelineEntryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:1207` |
| `eventTime` | `string` | Sí | formato date-time | `@IsISO8601()` | Cuándo ocurrió el evento clínico | `src/modules/health_data/dto/health-data.dto.ts:1217` |
| `eventTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de evento (catálogo abierto) | `src/modules/health_data/dto/health-data.dto.ts:1227` |
| `sourceEntityTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de la entidad de origen (catálogo abierto) | `src/modules/health_data/dto/health-data.dto.ts:1237` |
| `sourceEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | Entidad de origen concreta | `src/modules/health_data/dto/health-data.dto.ts:1244` |
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:1252` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:1260` |
| `organizationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:1268` |
| `title` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/health_data/dto/health-data.dto.ts:1277` |
| `summaryRedacted` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Resumen ya redactado según el consentimiento; nunca el dato clínico en claro | `src/modules/health_data/dto/health-data.dto.ts:1290` |
| `clinicalPriorityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/health_data/dto/health-data.dto.ts:1298` |
| `patientVisibilityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Visibilidad para el paciente | `src/modules/health_data/dto/health-data.dto.ts:1309` |
| `securityLabelsJson` | `object` | No | — | `@IsOptional()` `@MaxJsonSize(256 * 1024)` `@IsObject()` | — | `src/modules/health_data/dto/health-data.dto.ts:1318` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "eventTime": "2026-07-31T12:00:00.000Z",
  "eventTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "sourceEntityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<TimelineEntryResponseDto>` · DTO `TimelineEntryResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_data/dto/health-data.dto.ts:1329` |
| `duplicate` | `boolean` | Sí | — | — | true si la entrada ya existía para esa entidad y evento | `src/modules/health_data/dto/health-data.dto.ts:1337` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/health-data.controller.spec.ts:174` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `UC-52-10`

---

## 16. POST /health-data/versions/{id}/validate

- **Origen:** CONTRATO
- **Nombre:** Validar la versión contra un perfil FHIR R5
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `HealthDataController.validateVersion` — `src/modules/health_data/controllers/health-data.controller.ts:256`

### Qué es y para qué sirve (negocio)

Validar la versión contra un perfil FHIR R5. Caso de uso UC-52-07: Validar contra perfil FHIR R5. Dentro del módulo (descripción del modelo, en inglés): «Provides a governed international-grade health data center: source onboarding, ingestion, canonical versioned resources, patient identity resolution, FHIR validation, quality, provenance, lineage, terminology mapping, controlled exports…» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/health_data/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_52_health_data_platform.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /health-data/versions/{id}/validate` la atiende `HealthDataController.validateVersion` (src/modules/health_data/controllers/health-data.controller.ts:256). Exige sesión con alguno de los roles INGESTION_WORKER, HEALTH_DATA_ADMIN, CLINICAL_INFORMATICIAN. Valida el cuerpo como `ValidateVersionDto` (10 campos, 3 obligatorios). Delega en `HealthValidationService.validateVersion`. Crea filas en health_data.fhir_validation_issues, health_data.fhir_validation_runs. Actualiza health_data.canonical_health_resources. Lee health_data.canonical_health_resource_versions, health_data.canonical_health_resources, health_data.fhir_profile_versions, health_data.fhir_validation_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: INGESTION_WORKER, HEALTH_DATA_ADMIN, CLINICAL_INFORMATICIAN | `src/modules/health_data/controllers/health-data.controller.ts:256` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/health_data/controllers/health-data.controller.ts:256` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.canonical_health_resource_versions` | LEE | LEE | DIRECTA | HealthDataController.validateVersion → HealthValidationService.validateVersion → CanonicalResourcesRepository.findVersionById | `src/modules/health_data/repositories/canonical-resources.repository.ts:271` |
| `health_data.canonical_health_resources` | ESCRIBE | ACTUALIZA | POR_TIPO | HealthDataController.validateVersion → HealthValidationService.validateVersion | `src/modules/health_data/services/health-validation.service.ts:165` |
| `health_data.canonical_health_resources` | LEE | LEE | DIRECTA | HealthDataController.validateVersion → HealthValidationService.validateVersion → CanonicalResourcesRepository.findResourceForUpdate | `src/modules/health_data/repositories/canonical-resources.repository.ts:158` |
| `health_data.fhir_profile_versions` | LEE | LEE | DIRECTA | HealthDataController.validateVersion → HealthValidationService.validateVersion → HealthValidationRepository.findProfileVersionById | `src/modules/health_data/repositories/health-validation.repository.ts:36` |
| `health_data.fhir_validation_issues` | ESCRIBE | CREA | DIRECTA | HealthDataController.validateVersion → HealthValidationService.validateVersion → HealthValidationRepository.createValidationIssue | `src/modules/health_data/repositories/health-validation.repository.ts:154` |
| `health_data.fhir_validation_runs` | ESCRIBE | CREA | DIRECTA | HealthDataController.validateVersion → HealthValidationService.validateVersion → HealthValidationRepository.createValidationRun | `src/modules/health_data/repositories/health-validation.repository.ts:85` |
| `health_data.fhir_validation_runs` | LEE | LEE | DIRECTA | HealthDataController.validateVersion → HealthValidationService.validateVersion → HealthValidationRepository.findValidationRun | `src/modules/health_data/repositories/health-validation.repository.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ValidateVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fhirProfileVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión del perfil FHIR contra la que se valida | `src/modules/health_data/dto/health-data.dto.ts:874` |
| `validatorVersion` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Versión del validador que produjo el resultado | `src/modules/health_data/dto/health-data.dto.ts:885` |
| `startedAt` | `string` | Sí | formato date-time | `@IsISO8601()` | Cuándo empezó la validación | `src/modules/health_data/dto/health-data.dto.ts:895` |
| `issues` | `array<ValidationIssueDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ValidationIssueDto)` | Hallazgos del validador | `src/modules/health_data/dto/health-data.dto.ts:908` |
| `issues[].severity` | `string` | No | valores: FATAL, ERROR, WARNING, INFORMATION | `@IsIn(ISSUE_SEVERITIES)` | — | `src/modules/health_data/dto/health-data.dto.ts:822` |
| `issues[].issueCode` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/health_data/dto/health-data.dto.ts:831` |
| `issues[].expressionPath` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Ruta FHIRPath del hallazgo | `src/modules/health_data/dto/health-data.dto.ts:843` |
| `issues[].diagnosticsText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/health_data/dto/health-data.dto.ts:852` |
| `issues[].locationJson` | `object` | No | — | `@IsOptional()` `@MaxJsonSize(256 * 1024)` `@IsObject()` | — | `src/modules/health_data/dto/health-data.dto.ts:861` |
| `summaryJson` | `object` | No | — | `@IsOptional()` `@MaxJsonSize(256 * 1024)` `@IsObject()` | — | `src/modules/health_data/dto/health-data.dto.ts:917` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fhirProfileVersionId": "00000000-0000-4000-8000-000000000001",
  "validatorVersion": "valor-ejemplo",
  "startedAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ValidationRunResponseDto>` · DTO `ValidationRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/health_data/dto/health-data.dto.ts:928` |
| `resultConceptId` | `string` | Sí | formato uuid | — | Resultado derivado de las severidades halladas | `src/modules/health_data/dto/health-data.dto.ts:937` |
| `issueCount` | `number` | Sí | — | — | Valor de issue count mantenido por la instancia. | `src/modules/health_data/dto/health-data.dto.ts:943` |
| `quarantined` | `boolean` | Sí | — | — | true si el recurso quedó en cuarentena | `src/modules/health_data/dto/health-data.dto.ts:949` |
| `duplicate` | `boolean` | Sí | — | — | true si esa validación ya se había corrido | `src/modules/health_data/dto/health-data.dto.ts:955` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión canónica no encontrada; ResourceNotFoundException: Versión del perfil FHIR no encontrada; ResourceNotFoundException: Recurso canónico no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión del perfil no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/health_data.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/health_data/controllers/health-data.controller.spec.ts:137` |

### Flujos

- Módulo 52 — Plataforma de Datos de Salud — etapa `UC-52-07`

---

