<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `diagnostics`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 27 (27 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 20 · BAJO 7
- **Tablas distintas que tocan:** 33
- **Respuestas de error y detalle contractual:** `openapi/endpoints/diagnostics.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/diagnostic-results/me` | Resultados de laboratorio, informes e imagen del titular | BAJO | 7 | PATIENT |
| 2 | GET | `/diagnostic-results/me/{reportId}` | Un resultado del titular, con sus archivos | BAJO | 7 | PATIENT |
| 3 | GET | `/diagnostic-results/me/{reportId}/shares` | Con quién está compartido un resultado | BAJO | 4 | PATIENT |
| 4 | POST | `/diagnostic-results/me/{reportId}/shares` | Compartir temporalmente un resultado con un profesional | MEDIO | 10 | PATIENT |
| 5 | POST | `/diagnostic-results/me/{reportId}/shares/{shareId}/revoke` | Dejar de compartir un resultado | MEDIO | 5 | PATIENT |
| 6 | GET | `/diagnostic-results/me/orders` | Órdenes de laboratorio e imagen del titular | BAJO | 9 | PATIENT |
| 7 | POST | `/diagnostics/accessions` | Acesionar especímenes recibidos en laboratorio | MEDIO | 5 | CLINICIAN, PRACTITIONER |
| 8 | POST | `/diagnostics/analyzer-runs` | Abrir una corrida de analizador (soporte para ingesta) | MEDIO | 1 | CLINICIAN, PRACTITIONER |
| 9 | POST | `/diagnostics/analyzer-runs/{id}/messages` | Ingerir mensaje de resultado de analizador (LIS/HL7/ASTM) | MEDIO | 5 | CLINICIAN, PRACTITIONER |
| 10 | POST | `/diagnostics/clinical-media` | Adjuntar media clínica / imagen al chart | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 11 | POST | `/diagnostics/containers/{id}/custody-events` | Registrar cadena de custodia / traslado de contenedor | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 12 | POST | `/diagnostics/critical-results` | Detectar y notificar un resultado crítico | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 13 | POST | `/diagnostics/critical-results/{id}/acknowledge` | Acusar recibo / escalar notificación crítica | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 14 | POST | `/diagnostics/data-quality-events` | Registrar evento de calidad de datos + enlazar provenance | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 15 | POST | `/diagnostics/imaging-endpoints` | Registrar un endpoint DICOM (soporte para STOW-RS) | MEDIO | 1 | CLINICIAN, PRACTITIONER |
| 16 | POST | `/diagnostics/imaging-studies/{id}/dose-events` | Registrar evento de dosis de radiación | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 17 | GET | `/diagnostics/patients/{patientProfileId}/imaging-studies` | Listar los estudios de imagen del paciente | BAJO | 1 | CLINICIAN, PRACTITIONER |
| 18 | GET | `/diagnostics/patients/{patientProfileId}/orders` | Órdenes de laboratorio e imagenología del paciente, con sus informes | BAJO | 2 | CLINICIAN, PRACTITIONER |
| 19 | POST | `/diagnostics/reports/{reportId}/versions` | Crear/enmendar versión de informe diagnóstico | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 20 | POST | `/diagnostics/reports/{reportId}/versions/{versionId}/release` | Validar y liberar una versión del informe | MEDIO | 5 | CLINICIAN, PRACTITIONER |
| 21 | POST | `/diagnostics/results/{observationId}/verifications` | Verificar (técnica/facultativa) un resultado | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 22 | POST | `/diagnostics/specimens` | Registrar un espécimen (soporte para acesión) | MEDIO | 1 | CLINICIAN, PRACTITIONER |
| 23 | POST | `/diagnostics/specimens/{id}/containers` | Registrar un contenedor de espécimen (soporte para custodia) | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 24 | POST | `/diagnostics/specimens/{id}/rejection` | Rechazar espécimen y solicitar recolección | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 25 | GET | `/diagnostics/work-orders` | Listar las órdenes de trabajo del laboratorio | BAJO | 1 | CLINICIAN, PRACTITIONER |
| 26 | POST | `/diagnostics/work-orders` | Abrir orden de trabajo y desglosar pruebas | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 27 | POST | `/dicomweb/studies` | Ingestar estudio DICOM (STOW-RS) y ubicaciones de objeto | MEDIO | 6 | CLINICIAN, PRACTITIONER |

---

## 1. GET /diagnostic-results/me

- **Origen:** CONTRATO
- **Nombre:** Resultados de laboratorio, informes e imagen del titular
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsPatientResultsController.listOwnResults` — `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:76`

### Qué es y para qué sirve (negocio)

Resultados de laboratorio, informes e imagen del titular. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-results/me` la atiende `DiagnosticsPatientResultsController.listOwnResults` (src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:76). Exige sesión con alguno de los roles PATIENT. Delega en `DiagnosticsPatientResultsService.listOwnResults`. Lee clinical.diagnostic_reports, diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_results, diagnostics.diagnostic_report_versions, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:76` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResults → DiagnosticsPatientResultsService.listOwnResults → DiagnosticOrdersRepository.findReportsForPatientPortal | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:111` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResults → DiagnosticsPatientResultsService.listOwnResults → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findReleaseEventsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:444` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResults → DiagnosticsPatientResultsService.listOwnResults → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_results` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResults → DiagnosticsPatientResultsService.listOwnResults → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findResultsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:490` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResults → DiagnosticsPatientResultsService.listOwnResults → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResults → DiagnosticsPatientResultsService.listOwnResults → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResults → DiagnosticsPatientResultsService.listOwnResults → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | Tope de informes considerados (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientDiagnosticResultsResponseDto>` · DTO `PatientDiagnosticResultsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | — | Paciente leído. | `src/modules/diagnostics/dto/patient-results.dto.ts:97` |
| `items` | `array<PatientDiagnosticResultDto>` | Sí | — | — | Resultados liberados, del más nuevo al más viejo. | `src/modules/diagnostics/dto/patient-results.dto.ts:101` |
| `items[].reportId` | `string` | Sí | formato uuid | — | Informe (`clinical.diagnostic_reports`). | `src/modules/diagnostics/dto/patient-results.dto.ts:47` |
| `items[].versionId` | `string` | Sí | formato uuid | — | Versión liberada que se está mostrando. | `src/modules/diagnostics/dto/patient-results.dto.ts:50` |
| `items[].versionNumber` | `number` | Sí | — | — | Número de esa versión; una enmienda posterior tiene un número mayor. | `src/modules/diagnostics/dto/patient-results.dto.ts:53` |
| `items[].serviceRequestId` | `string` | No | formato uuid | — | Orden que lo originó, si cuelga de una. | `src/modules/diagnostics/dto/patient-results.dto.ts:56` |
| `items[].codeConceptId` | `string` | Sí | formato uuid | — | Qué informa (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:59` |
| `items[].categoryConceptId` | `string` | No | formato uuid | — | Laboratorio o imagenología (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:62` |
| `items[].custodianTenantId` | `string` | Sí | formato uuid | — | Organización que lo emitió y lo custodia. | `src/modules/diagnostics/dto/patient-results.dto.ts:65` |
| `items[].conclusionText` | `string` | No | — | — | Conclusión firmada, si la versión la trae. | `src/modules/diagnostics/dto/patient-results.dto.ts:68` |
| `items[].issuedAt` | `string` | No | formato date-time | — | Cuándo se emitió la versión. | `src/modules/diagnostics/dto/patient-results.dto.ts:71` |
| `items[].releasedAt` | `string` | Sí | formato date-time | — | Cuándo se liberó al paciente. | `src/modules/diagnostics/dto/patient-results.dto.ts:74` |
| `items[].clinicalStatusConceptId` | `string` | Sí | formato uuid | — | Estado clínico de la versión (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:77` |
| `items[].observationIds` | `array<string>` | Sí | formato uuid | — | Observaciones enlazadas a la versión. | `src/modules/diagnostics/dto/patient-results.dto.ts:81` |
| `items[].files` | `array<DiagnosticResultFileDto>` | Sí | — | — | Archivos descargables de la versión. | `src/modules/diagnostics/dto/patient-results.dto.ts:85` |
| `items[].files[].id` | `string` | Sí | formato uuid | — | Identificador del enlace informe↔archivo. | `src/modules/diagnostics/dto/patient-results.dto.ts:21` |
| `items[].files[].fileId` | `string` | Sí | formato uuid | — | Archivo en `common.files`; se descarga por `/common/files/{id}/content`. | `src/modules/diagnostics/dto/patient-results.dto.ts:24` |
| `items[].files[].contentRoleConceptId` | `string` | Sí | formato uuid | — | Qué es el archivo dentro del informe (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:27` |
| `items[].files[].presentationFormatConceptId` | `string` | No | formato uuid | — | Formato de presentación (concept id), si se declaró. | `src/modules/diagnostics/dto/patient-results.dto.ts:31` |
| `items[].files[].ordinal` | `number` | No | — | — | Posición dentro del informe. | `src/modules/diagnostics/dto/patient-results.dto.ts:34` |
| `limit` | `number` | Sí | — | — | Tope aplicado. | `src/modules/diagnostics/dto/patient-results.dto.ts:104` |
| `truncated` | `boolean` | Sí | — | — | La lista quedó recortada por el tope. | `src/modules/diagnostics/dto/patient-results.dto.ts:107` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsPatientResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /diagnostic-results/me/{reportId}

- **Origen:** CONTRATO
- **Nombre:** Un resultado del titular, con sus archivos
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsPatientResultsController.getOwnResult` — `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:135`

### Qué es y para qué sirve (negocio)

Un resultado del titular, con sus archivos. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-results/me/{reportId}` la atiende `DiagnosticsPatientResultsController.getOwnResult` (src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:135). Exige sesión con alguno de los roles PATIENT. Delega en `DiagnosticsPatientResultsService.getOwnResult`. Lee clinical.diagnostic_reports, diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_results, diagnostics.diagnostic_report_versions, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:135` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: reportId | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:135` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResult → DiagnosticsPatientResultsService.getOwnResult → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticOrdersRepository.findReportById | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:235` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResult → DiagnosticsPatientResultsService.getOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findReleaseEventsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:444` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResult → DiagnosticsPatientResultsService.getOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_results` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResult → DiagnosticsPatientResultsService.getOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findResultsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:490` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResult → DiagnosticsPatientResultsService.getOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResult → DiagnosticsPatientResultsService.getOwnResult → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResult → DiagnosticsPatientResultsService.getOwnResult → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `reportId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientDiagnosticResultDto>` · DTO `PatientDiagnosticResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reportId` | `string` | Sí | formato uuid | — | Informe (`clinical.diagnostic_reports`). | `src/modules/diagnostics/dto/patient-results.dto.ts:47` |
| `versionId` | `string` | Sí | formato uuid | — | Versión liberada que se está mostrando. | `src/modules/diagnostics/dto/patient-results.dto.ts:50` |
| `versionNumber` | `number` | Sí | — | — | Número de esa versión; una enmienda posterior tiene un número mayor. | `src/modules/diagnostics/dto/patient-results.dto.ts:53` |
| `serviceRequestId` | `string` | No | formato uuid | — | Orden que lo originó, si cuelga de una. | `src/modules/diagnostics/dto/patient-results.dto.ts:56` |
| `codeConceptId` | `string` | Sí | formato uuid | — | Qué informa (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:59` |
| `categoryConceptId` | `string` | No | formato uuid | — | Laboratorio o imagenología (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:62` |
| `custodianTenantId` | `string` | Sí | formato uuid | — | Organización que lo emitió y lo custodia. | `src/modules/diagnostics/dto/patient-results.dto.ts:65` |
| `conclusionText` | `string` | No | — | — | Conclusión firmada, si la versión la trae. | `src/modules/diagnostics/dto/patient-results.dto.ts:68` |
| `issuedAt` | `string` | No | formato date-time | — | Cuándo se emitió la versión. | `src/modules/diagnostics/dto/patient-results.dto.ts:71` |
| `releasedAt` | `string` | Sí | formato date-time | — | Cuándo se liberó al paciente. | `src/modules/diagnostics/dto/patient-results.dto.ts:74` |
| `clinicalStatusConceptId` | `string` | Sí | formato uuid | — | Estado clínico de la versión (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:77` |
| `observationIds` | `array<string>` | Sí | formato uuid | — | Observaciones enlazadas a la versión. | `src/modules/diagnostics/dto/patient-results.dto.ts:81` |
| `files` | `array<DiagnosticResultFileDto>` | Sí | — | — | Archivos descargables de la versión. | `src/modules/diagnostics/dto/patient-results.dto.ts:85` |
| `files[].id` | `string` | Sí | formato uuid | — | Identificador del enlace informe↔archivo. | `src/modules/diagnostics/dto/patient-results.dto.ts:21` |
| `files[].fileId` | `string` | Sí | formato uuid | — | Archivo en `common.files`; se descarga por `/common/files/{id}/content`. | `src/modules/diagnostics/dto/patient-results.dto.ts:24` |
| `files[].contentRoleConceptId` | `string` | Sí | formato uuid | — | Qué es el archivo dentro del informe (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:27` |
| `files[].presentationFormatConceptId` | `string` | No | formato uuid | — | Formato de presentación (concept id), si se declaró. | `src/modules/diagnostics/dto/patient-results.dto.ts:31` |
| `files[].ordinal` | `number` | No | — | — | Posición dentro del informe. | `src/modules/diagnostics/dto/patient-results.dto.ts:34` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: El informe no pertenece a esta cuenta |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Informe no encontrado; ResourceNotFoundException: El resultado todavía no está disponible |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsPatientResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /diagnostic-results/me/{reportId}/shares

- **Origen:** CONTRATO
- **Nombre:** Con quién está compartido un resultado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsPatientResultsController.listOwnResultShares` — `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:178`

### Qué es y para qué sirve (negocio)

Con quién está compartido un resultado. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-results/me/{reportId}/shares` la atiende `DiagnosticsPatientResultsController.listOwnResultShares` (src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:178). Exige sesión con alguno de los roles PATIENT. Delega en `DiagnosticsPatientResultsService.listOwnResultShares`. Lee authz.resource_scope_grants, clinical.diagnostic_reports, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:178` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: reportId | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:178` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResultShares → DiagnosticsPatientResultsService.listOwnResultShares → ResourceScopeGrantsRepository.findForResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:94` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResultShares → DiagnosticsPatientResultsService.listOwnResultShares → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticOrdersRepository.findReportById | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:235` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResultShares → DiagnosticsPatientResultsService.listOwnResultShares → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResultShares → DiagnosticsPatientResultsService.listOwnResultShares → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `reportId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DiagnosticResultSharesResponseDto>` · DTO `DiagnosticResultSharesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reportId` | `string` | Sí | formato uuid | — | Informe consultado. | `src/modules/diagnostics/dto/patient-results.dto.ts:246` |
| `items` | `array<DiagnosticResultShareDto>` | Sí | — | — | Los compartidos, del más nuevo al más viejo. | `src/modules/diagnostics/dto/patient-results.dto.ts:250` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del grant. | `src/modules/diagnostics/dto/patient-results.dto.ts:225` |
| `items[].reportId` | `string` | Sí | formato uuid | — | Informe compartido. | `src/modules/diagnostics/dto/patient-results.dto.ts:228` |
| `items[].practitionerUserId` | `string` | Sí | formato uuid | — | Cuenta del profesional con quien se compartió. | `src/modules/diagnostics/dto/patient-results.dto.ts:231` |
| `items[].validFrom` | `string` | Sí | formato date-time | — | Desde cuándo vale. | `src/modules/diagnostics/dto/patient-results.dto.ts:234` |
| `items[].validTo` | `string` | No | formato date-time | — | Hasta cuándo vale. | `src/modules/diagnostics/dto/patient-results.dto.ts:237` |
| `items[].active` | `boolean` | Sí | — | — | Si el grant está vigente en este momento. | `src/modules/diagnostics/dto/patient-results.dto.ts:240` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: El informe no pertenece a esta cuenta |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Informe no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsPatientResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /diagnostic-results/me/{reportId}/shares

- **Origen:** CONTRATO
- **Nombre:** Compartir temporalmente un resultado con un profesional
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsPatientResultsController.shareOwnResult` — `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:156`

### Qué es y para qué sirve (negocio)

Compartir temporalmente un resultado con un profesional. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-results/me/{reportId}/shares` la atiende `DiagnosticsPatientResultsController.shareOwnResult` (src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:156). Exige sesión con alguno de los roles PATIENT. Valida el cuerpo como `ShareDiagnosticResultDto` (3 campos, 2 obligatorios). Delega en `DiagnosticsPatientResultsService.shareOwnResult`. Crea filas en authz.resource_scope_grants. Actualiza authz.resource_scope_grants. Lee authz.resource_scope_grants, clinical.diagnostic_reports, diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_results, diagnostics.diagnostic_report_versions, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:156` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: reportId | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:156` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.resource_scope_grants` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult | `src/modules/diagnostics/services/diagnostics-patient-results.service.ts:376` |
| `authz.resource_scope_grants` | ESCRIBE | CREA | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → ResourceScopeGrantsRepository.create | `src/modules/authz/repositories/resource-scope-grants.repository.ts:132` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → ResourceScopeGrantsRepository.findExisting | `src/modules/authz/repositories/resource-scope-grants.repository.ts:60` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticOrdersRepository.findReportById | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:235` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findReleaseEventsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:444` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_results` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findResultsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:490` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `reportId` | path | Sí | `string` | — |

### Cuerpo — DTO `ShareDiagnosticResultDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerUserId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/diagnostics/dto/patient-results.dto.ts:206` |
| `validUntil` | `string` | Sí | formato date-time | `@Type(() => Date)` `@IsDate()` | — | `src/modules/diagnostics/dto/patient-results.dto.ts:212` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/diagnostics/dto/patient-results.dto.ts:219` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practitionerUserId": "00000000-0000-4000-8000-000000000001",
  "validUntil": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practitionerUserId": "00000000-0000-4000-8000-000000000001",
  "validUntil": "2026-07-31T12:00:00.000Z",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<DiagnosticResultShareDto>` · DTO `DiagnosticResultShareDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del grant. | `src/modules/diagnostics/dto/patient-results.dto.ts:225` |
| `reportId` | `string` | Sí | formato uuid | — | Informe compartido. | `src/modules/diagnostics/dto/patient-results.dto.ts:228` |
| `practitionerUserId` | `string` | Sí | formato uuid | — | Cuenta del profesional con quien se compartió. | `src/modules/diagnostics/dto/patient-results.dto.ts:231` |
| `validFrom` | `string` | Sí | formato date-time | — | Desde cuándo vale. | `src/modules/diagnostics/dto/patient-results.dto.ts:234` |
| `validTo` | `string` | No | formato date-time | — | Hasta cuándo vale. | `src/modules/diagnostics/dto/patient-results.dto.ts:237` |
| `active` | `boolean` | Sí | — | — | Si el grant está vigente en este momento. | `src/modules/diagnostics/dto/patient-results.dto.ts:240` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: El informe no pertenece a esta cuenta |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Informe no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El vencimiento del acceso compartido tiene que ser futuro; PreconditionFailedException: No hace falta compartirse un resultado con uno mismo; PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente; PreconditionFailedException: Sólo se puede compartir un resultado ya liberado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsPatientResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /diagnostic-results/me/{reportId}/shares/{shareId}/revoke

- **Origen:** CONTRATO
- **Nombre:** Dejar de compartir un resultado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsPatientResultsController.revokeOwnResultShare` — `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:199`

### Qué es y para qué sirve (negocio)

Dejar de compartir un resultado. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-results/me/{reportId}/shares/{shareId}/revoke` la atiende `DiagnosticsPatientResultsController.revokeOwnResultShare` (src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:199). Exige sesión con alguno de los roles PATIENT. Delega en `DiagnosticsPatientResultsService.revokeOwnResultShare`. Actualiza authz.resource_scope_grants. Lee authz.resource_scope_grants, clinical.diagnostic_reports, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:199` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: reportId, shareId | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:199` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.resource_scope_grants` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsPatientResultsController.revokeOwnResultShare → DiagnosticsPatientResultsService.revokeOwnResultShare | `src/modules/diagnostics/services/diagnostics-patient-results.service.ts:503` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.revokeOwnResultShare → DiagnosticsPatientResultsService.revokeOwnResultShare → ResourceScopeGrantsRepository.findByIdForResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:118` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.revokeOwnResultShare → DiagnosticsPatientResultsService.revokeOwnResultShare → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticOrdersRepository.findReportById | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:235` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.revokeOwnResultShare → DiagnosticsPatientResultsService.revokeOwnResultShare → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.revokeOwnResultShare → DiagnosticsPatientResultsService.revokeOwnResultShare → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `reportId` | path | Sí | `string` | — |
| `shareId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DiagnosticResultShareDto>` · DTO `DiagnosticResultShareDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del grant. | `src/modules/diagnostics/dto/patient-results.dto.ts:225` |
| `reportId` | `string` | Sí | formato uuid | — | Informe compartido. | `src/modules/diagnostics/dto/patient-results.dto.ts:228` |
| `practitionerUserId` | `string` | Sí | formato uuid | — | Cuenta del profesional con quien se compartió. | `src/modules/diagnostics/dto/patient-results.dto.ts:231` |
| `validFrom` | `string` | Sí | formato date-time | — | Desde cuándo vale. | `src/modules/diagnostics/dto/patient-results.dto.ts:234` |
| `validTo` | `string` | No | formato date-time | — | Hasta cuándo vale. | `src/modules/diagnostics/dto/patient-results.dto.ts:237` |
| `active` | `boolean` | Sí | — | — | Si el grant está vigente en este momento. | `src/modules/diagnostics/dto/patient-results.dto.ts:240` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: El informe no pertenece a esta cuenta |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Informe no encontrado; ResourceNotFoundException: Ese resultado no está compartido así |
| 409 | `CONFLICT` | ConflictException: Ese acceso compartido ya estaba cerrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsPatientResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /diagnostic-results/me/orders

- **Origen:** CONTRATO
- **Nombre:** Órdenes de laboratorio e imagen del titular
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsPatientResultsController.listOwnOrders` — `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:109`

### Qué es y para qué sirve (negocio)

Órdenes de laboratorio e imagen del titular. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-results/me/orders` la atiende `DiagnosticsPatientResultsController.listOwnOrders` (src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:109). Exige sesión con alguno de los roles PATIENT. Delega en `DiagnosticsPatientResultsService.listOwnOrders`. Lee clinical.diagnostic_reports, clinical.service_requests, diagnostic_units.diagnostic_study_offerings, diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_results, diagnostics.diagnostic_report_versions, profiles.patient_profiles y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:109` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.informeLiberadoPorOrden → DiagnosticOrdersRepository.findReportsByServiceRequests | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:172` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticOrdersRepository.findOrdersForPatientPortal | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:143` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.preparacionPorConcepto → DiagnosticOrdersRepository.findPreparationByStudyConcepts | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:213` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.informeLiberadoPorOrden → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findReleaseEventsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:444` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.informeLiberadoPorOrden → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_results` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.informeLiberadoPorOrden → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findResultsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:490` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.informeLiberadoPorOrden → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | Tope de órdenes (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientOwnOrdersResponseDto>` · DTO `PatientOwnOrdersResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | — | Paciente leído. | `src/modules/diagnostics/dto/patient-results.dto.ts:176` |
| `items` | `array<PatientOrderSummaryDto>` | Sí | — | — | Órdenes, de la más nueva a la más vieja. | `src/modules/diagnostics/dto/patient-results.dto.ts:180` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la orden. | `src/modules/diagnostics/dto/patient-results.dto.ts:132` |
| `items[].encounterId` | `string` | No | formato uuid | — | Encuentro en el que se pidió, si se pidió durante uno. | `src/modules/diagnostics/dto/patient-results.dto.ts:135` |
| `items[].codeConceptId` | `string` | Sí | formato uuid | — | Qué se pidió (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:138` |
| `items[].categoryConceptId` | `string` | No | formato uuid | — | Laboratorio o imagenología (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:141` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado de la orden (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:144` |
| `items[].priorityConceptId` | `string` | No | formato uuid | — | Prioridad (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:147` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se pidió. | `src/modules/diagnostics/dto/patient-results.dto.ts:150` |
| `items[].preparationInstructions` | `string` | No | — | — | Cómo prepararse: ayunas, horarios, qué llevar. Sale del catálogo de estudios (`diagnostic_study_offerings`), emparejado por concepto. Ausente cuando ningún centro publicó preparación para ese estudio — que es distinto de «no hay que prepararse», y por eso la pantalla no debe inventar un texto tranquilizador cuando falta. | `src/modules/diagnostics/dto/patient-results.dto.ts:160` |
| `items[].hasReleasedResult` | `boolean` | Sí | — | — | Ya hay un resultado liberado y visible para esta orden. | `src/modules/diagnostics/dto/patient-results.dto.ts:163` |
| `items[].reportId` | `string` | No | formato uuid | — | El informe a abrir, cuando es verdadero. | `src/modules/diagnostics/dto/patient-results.dto.ts:166` |
| `limit` | `number` | Sí | — | — | Tope aplicado. | `src/modules/diagnostics/dto/patient-results.dto.ts:183` |
| `truncated` | `boolean` | Sí | — | — | La lista quedó recortada por el tope. | `src/modules/diagnostics/dto/patient-results.dto.ts:186` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-diagnostic-orders.int-spec.ts:65` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsPatientResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /diagnostics/accessions

- **Origen:** CONTRATO
- **Nombre:** Acesionar especímenes recibidos en laboratorio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsSpecimensController.accession` — `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:52`

### Qué es y para qué sirve (negocio)

Acesionar especímenes recibidos en laboratorio. Caso de uso UC-20-01: Acesionar especímenes recibidos. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/accessions` la atiende `DiagnosticsSpecimensController.accession` (src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:52). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateAccessionDto` (6 campos, 2 obligatorios). Delega en `DiagnosticsSpecimensService.accession`. Crea filas en diagnostics.accession_specimens, diagnostics.laboratory_accessions, diagnostics.specimen_chain_of_custody_events. Actualiza diagnostics.specimens. Lee diagnostics.specimens.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.accession_specimens` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.accession → DiagnosticsSpecimensService.accession → SpecimensRepository.addAccessionSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:273` |
| `diagnostics.laboratory_accessions` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.accession → DiagnosticsSpecimensService.accession → SpecimensRepository.createAccession | `src/modules/diagnostics/repositories/specimens.repository.ts:228` |
| `diagnostics.specimen_chain_of_custody_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.accession → DiagnosticsSpecimensService.accession → SpecimensRepository.recordCustodyEvent | `src/modules/diagnostics/repositories/specimens.repository.ts:328` |
| `diagnostics.specimens` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsSpecimensController.accession → DiagnosticsSpecimensService.accession | `src/modules/diagnostics/services/diagnostics-specimens.service.ts:137` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.accession → DiagnosticsSpecimensService.accession → SpecimensRepository.findSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:158` |

### Cuerpo — DTO `CreateAccessionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente dueño de la acesión | `src/modules/diagnostics/dto/specimens.dto.ts:99` |
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant custodio (por defecto el del token) | `src/modules/diagnostics/dto/specimens.dto.ts:110` |
| `specimenIds` | `array<string>` | Sí | formato uuid | `@IsArray()` `@ArrayNotEmpty()` `@IsUUID('4', { each: true })` | Especímenes a acesionar | `src/modules/diagnostics/dto/specimens.dto.ts:123` |
| `accessionNumber` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Nº de acesión (se genera si se omite) | `src/modules/diagnostics/dto/specimens.dto.ts:132` |
| `priorityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Prioridad (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:143` |
| `serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/diagnostics/dto/specimens.dto.ts:151` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "specimenIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<AccessionCreatedDto>` · DTO `AccessionCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/diagnostics/dto/responses.dto.ts:36` |
| `status` | `string` | Sí | formato uuid | — | Valor de status mantenido por la instancia. | `src/modules/diagnostics/dto/responses.dto.ts:42` |
| `accessionSpecimenIds` | `array<string>` | Sí | formato uuid | — | Ids de accession_specimens | `src/modules/diagnostics/dto/responses.dto.ts:52` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espécimen no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El espécimen está rechazado y no puede acesionarse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.spec.ts:43` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-01`

---

## 8. POST /diagnostics/analyzer-runs

- **Origen:** CONTRATO
- **Nombre:** Abrir una corrida de analizador (soporte para ingesta)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabController.createAnalyzerRun` — `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:78`

### Qué es y para qué sirve (negocio)

Abrir una corrida de analizador (soporte para ingesta). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/analyzer-runs` la atiende `DiagnosticsLabController.createAnalyzerRun` (src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:78). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateAnalyzerRunDto` (5 campos, 2 obligatorios). Delega en `DiagnosticsLabService.createAnalyzerRun`. Crea filas en diagnostics.analyzer_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:78` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.analyzer_runs` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabController.createAnalyzerRun → DiagnosticsLabService.createAnalyzerRun → LabWorkRepository.createAnalyzerRun | `src/modules/diagnostics/repositories/lab-work.repository.ts:264` |

### Cuerpo — DTO `CreateAnalyzerRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `analyzerDeviceId` | `string` | Sí | formato uuid | `@IsUUID()` | Analizador (device id) | `src/modules/diagnostics/dto/lab.dto.ts:142` |
| `runIdentifier` | `string` | Sí | longitud máxima 120 | `@IsString()` `@MaxLength(120)` | Identificador de la corrida | `src/modules/diagnostics/dto/lab.dto.ts:150` |
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant custodio (por defecto el del token) | `src/modules/diagnostics/dto/lab.dto.ts:161` |
| `reagentLotId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Lote de reactivo | `src/modules/diagnostics/dto/lab.dto.ts:169` |
| `calibrationReference` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia de calibración | `src/modules/diagnostics/dto/lab.dto.ts:178` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "analyzerDeviceId": "00000000-0000-4000-8000-000000000001",
  "runIdentifier": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "analyzerDeviceId": "00000000-0000-4000-8000-000000000001",
  "runIdentifier": "valor-ejemplo",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "reagentLotId": "00000000-0000-4000-8000-000000000001",
  "calibrationReference": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant custodio de la corrida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab.controller.spec.ts:39` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /diagnostics/analyzer-runs/{id}/messages

- **Origen:** CONTRATO
- **Nombre:** Ingerir mensaje de resultado de analizador (LIS/HL7/ASTM)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabController.ingestMessage` — `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:91`

### Qué es y para qué sirve (negocio)

Ingerir mensaje de resultado de analizador (LIS/HL7/ASTM). Caso de uso UC-20-05: Ingerir mensaje de resultado (LIS/HL7/ASTM). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/analyzer-runs/{id}/messages` la atiende `DiagnosticsLabController.ingestMessage` (src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:91). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `IngestAnalyzerMessageDto` (6 campos, 1 obligatorio). Delega en `DiagnosticsLabService.ingestMessage`. Crea filas en diagnostics.analyzer_result_messages. Actualiza diagnostics.laboratory_work_order_tests. Lee diagnostics.analyzer_result_messages, diagnostics.analyzer_runs, diagnostics.laboratory_work_order_tests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:91` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:91` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.analyzer_result_messages` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabController.ingestMessage → DiagnosticsLabService.ingestMessage → LabWorkRepository.recordMessage | `src/modules/diagnostics/repositories/lab-work.repository.ts:334` |
| `diagnostics.analyzer_result_messages` | LEE | LEE | DIRECTA | DiagnosticsLabController.ingestMessage → DiagnosticsLabService.ingestMessage → LabWorkRepository.findMessageByControlId | `src/modules/diagnostics/repositories/lab-work.repository.ts:286` |
| `diagnostics.analyzer_runs` | LEE | LEE | DIRECTA | DiagnosticsLabController.ingestMessage → DiagnosticsLabService.ingestMessage → LabWorkRepository.findAnalyzerRun | `src/modules/diagnostics/repositories/lab-work.repository.ts:197` |
| `diagnostics.laboratory_work_order_tests` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsLabController.ingestMessage → DiagnosticsLabService.ingestMessage | `src/modules/diagnostics/services/diagnostics-lab.service.ts:230` |
| `diagnostics.laboratory_work_order_tests` | LEE | LEE | DIRECTA | DiagnosticsLabController.ingestMessage → DiagnosticsLabService.ingestMessage → LabWorkRepository.findWorkOrderTest | `src/modules/diagnostics/repositories/lab-work.repository.ts:186` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `IngestAnalyzerMessageDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `payloadHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash idempotente del payload crudo | `src/modules/diagnostics/dto/lab.dto.ts:189` |
| `messageFormatConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Formato del mensaje (concept id) | `src/modules/diagnostics/dto/lab.dto.ts:200` |
| `messageControlId` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Message control id (idempotencia por corrida) | `src/modules/diagnostics/dto/lab.dto.ts:211` |
| `laboratoryWorkOrderTestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Prueba de la orden a completar | `src/modules/diagnostics/dto/lab.dto.ts:222` |
| `mappedObservationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Observación mapeada (clinical.observations) | `src/modules/diagnostics/dto/lab.dto.ts:233` |
| `rawMessageFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo del mensaje crudo (common.files) | `src/modules/diagnostics/dto/lab.dto.ts:244` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "payloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "payloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "messageFormatConceptId": "00000000-0000-4000-8000-000000000001",
  "messageControlId": "00000000-0000-4000-8000-000000000001",
  "laboratoryWorkOrderTestId": "00000000-0000-4000-8000-000000000001",
  "mappedObservationId": "00000000-0000-4000-8000-000000000001",
  "rawMessageFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Corrida de analizador no encontrada |
| 409 | `CONFLICT` | ConflictException: El mensaje ya fue ingerido para esta corrida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab.controller.spec.ts:45` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-05`

---

## 10. POST /diagnostics/clinical-media

- **Origen:** CONTRATO
- **Nombre:** Adjuntar media clínica / imagen al chart
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsImagingController.attachMedia` — `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:106`

### Qué es y para qué sirve (negocio)

Adjuntar media clínica / imagen al chart. Caso de uso UC-20-12: Adjuntar media clínica / imagen. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:27`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/clinical-media` la atiende `DiagnosticsImagingController.attachMedia` (src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:106). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AttachClinicalMediaDto` (16 campos, 2 obligatorios). Delega en `DiagnosticsMediaQualityService.attachMedia`. Crea filas en diagnostics.clinical_media, diagnostics.media_annotations. Lee diagnostics.clinical_media.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.clinical_media` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.attachMedia → DiagnosticsMediaQualityService.attachMedia → MediaQualityRepository.createMedia | `src/modules/diagnostics/repositories/media-quality.repository.ts:142` |
| `diagnostics.clinical_media` | LEE | LEE | DIRECTA | DiagnosticsImagingController.attachMedia → DiagnosticsMediaQualityService.attachMedia → MediaQualityRepository.findMediaByFile | `src/modules/diagnostics/repositories/media-quality.repository.ts:131` |
| `diagnostics.media_annotations` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.attachMedia → DiagnosticsMediaQualityService.attachMedia → MediaQualityRepository.addAnnotation | `src/modules/diagnostics/repositories/media-quality.repository.ts:215` |

### Cuerpo — DTO `AttachClinicalMediaDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente dueño de la media | `src/modules/diagnostics/dto/media-quality.dto.ts:68` |
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | Archivo ya cargado (common.files) | `src/modules/diagnostics/dto/media-quality.dto.ts:78` |
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant custodio (por defecto el del token) | `src/modules/diagnostics/dto/media-quality.dto.ts:89` |
| `mediaTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de media (concept id) | `src/modules/diagnostics/dto/media-quality.dto.ts:100` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio anatómico (concept id) | `src/modules/diagnostics/dto/media-quality.dto.ts:111` |
| `viewConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Vista/proyección (concept id) | `src/modules/diagnostics/dto/media-quality.dto.ts:122` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro | `src/modules/diagnostics/dto/media-quality.dto.ts:130` |
| `diagnosticReportId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Informe diagnóstico al que se adjunta | `src/modules/diagnostics/dto/media-quality.dto.ts:141` |
| `patientVisibilityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Visibilidad al paciente (concept id) | `src/modules/diagnostics/dto/media-quality.dto.ts:152` |
| `capturedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional que captura | `src/modules/diagnostics/dto/media-quality.dto.ts:163` |
| `annotations` | `array<MediaAnnotationItemDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => MediaAnnotationItemDto)` | Anotaciones IA/manual | `src/modules/diagnostics/dto/media-quality.dto.ts:176` |
| `annotations[].annotationTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de anotación (concept id) | `src/modules/diagnostics/dto/media-quality.dto.ts:23` |
| `annotations[].labelText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Etiqueta textual | `src/modules/diagnostics/dto/media-quality.dto.ts:32` |
| `annotations[].confidenceScore` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | Score de confianza (0..1) | `src/modules/diagnostics/dto/media-quality.dto.ts:41` |
| `annotations[].algorithmModelReference` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia del modelo/algoritmo IA | `src/modules/diagnostics/dto/media-quality.dto.ts:50` |
| `annotations[].authorProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Autor de la anotación | `src/modules/diagnostics/dto/media-quality.dto.ts:58` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El archivo ya está adjunto como media clínica |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant custodio de la media |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.spec.ts:63` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-12`

---

## 11. POST /diagnostics/containers/{id}/custody-events

- **Origen:** CONTRATO
- **Nombre:** Registrar cadena de custodia / traslado de contenedor
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsSpecimensController.custodyEvent` — `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:89`

### Qué es y para qué sirve (negocio)

Registrar cadena de custodia / traslado de contenedor. Caso de uso UC-20-03: Cadena de custodia / traslado. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/containers/{id}/custody-events` la atiende `DiagnosticsSpecimensController.custodyEvent` (src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:89). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ContainerCustodyEventDto` (9 campos, 1 obligatorio). Delega en `DiagnosticsSpecimensService.recordCustodyEvent`. Crea filas en diagnostics.specimen_chain_of_custody_events, diagnostics.specimen_container_events. Actualiza diagnostics.specimen_containers. Lee diagnostics.specimen_containers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:89` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:89` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.specimen_chain_of_custody_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.custodyEvent → DiagnosticsSpecimensService.recordCustodyEvent → SpecimensRepository.recordCustodyEvent | `src/modules/diagnostics/repositories/specimens.repository.ts:328` |
| `diagnostics.specimen_container_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.custodyEvent → DiagnosticsSpecimensService.recordCustodyEvent → SpecimensRepository.recordContainerEvent | `src/modules/diagnostics/repositories/specimens.repository.ts:452` |
| `diagnostics.specimen_containers` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsSpecimensController.custodyEvent → DiagnosticsSpecimensService.recordCustodyEvent | `src/modules/diagnostics/services/diagnostics-specimens.service.ts:274` |
| `diagnostics.specimen_containers` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.custodyEvent → DiagnosticsSpecimensService.recordCustodyEvent → SpecimensRepository.findContainer | `src/modules/diagnostics/repositories/specimens.repository.ts:186` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ContainerCustodyEventDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `specimenId` | `string` | Sí | formato uuid | `@IsUUID()` | Espécimen asociado al contenedor | `src/modules/diagnostics/dto/specimens.dto.ts:254` |
| `eventTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de evento de contenedor (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:265` |
| `toPartyTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de parte destino (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:276` |
| `toPartyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id de parte destino | `src/modules/diagnostics/dto/specimens.dto.ts:284` |
| `temperatureCelsius` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | Temperatura en °C | `src/modules/diagnostics/dto/specimens.dto.ts:293` |
| `sealIdentifier` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Sello de custodia | `src/modules/diagnostics/dto/specimens.dto.ts:302` |
| `evidenceHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash de evidencia | `src/modules/diagnostics/dto/specimens.dto.ts:311` |
| `destinationStatusConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Estado destino del contenedor (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:322` |
| `notes` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Notas del traslado | `src/modules/diagnostics/dto/specimens.dto.ts:331` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "specimenId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contenedor no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.spec.ts:73` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-03`

---

## 12. POST /diagnostics/critical-results

- **Origen:** CONTRATO
- **Nombre:** Detectar y notificar un resultado crítico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportsController.detectCritical` — `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:64`

### Qué es y para qué sirve (negocio)

Detectar y notificar un resultado crítico. Caso de uso UC-20-09: Detectar y notificar resultado crítico. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:23`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/critical-results` la atiende `DiagnosticsReportsController.detectCritical` (src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:64). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `DetectCriticalResultDto` (7 campos, 2 obligatorios). Delega en `DiagnosticsReportsService.detectCritical`. Crea filas en diagnostics.critical_result_notifications. Lee diagnostics.critical_result_notifications.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.critical_result_notifications` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportsController.detectCritical → DiagnosticsReportsService.detectCritical → ReportsRepository.createCriticalNotification | `src/modules/diagnostics/repositories/reports.repository.ts:368` |
| `diagnostics.critical_result_notifications` | LEE | LEE | DIRECTA | DiagnosticsReportsController.detectCritical → DiagnosticsReportsService.detectCritical → ReportsRepository.criticalExistsForObservation | `src/modules/diagnostics/repositories/reports.repository.ts:391` |

### Cuerpo — DTO `DetectCriticalResultDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `observationId` | `string` | Sí | formato uuid | `@IsUUID()` | Observación con valor crítico | `src/modules/diagnostics/dto/reports.dto.ts:203` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente afectado | `src/modules/diagnostics/dto/reports.dto.ts:210` |
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant custodio (por defecto el del token) | `src/modules/diagnostics/dto/reports.dto.ts:221` |
| `criticalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Criticidad (concept id) | `src/modules/diagnostics/dto/reports.dto.ts:232` |
| `diagnosticReportId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Informe diagnóstico relacionado | `src/modules/diagnostics/dto/reports.dto.ts:243` |
| `detectedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional que detecta | `src/modules/diagnostics/dto/reports.dto.ts:254` |
| `escalationDueInMinutes` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Minutos hasta escalar (SLA) | `src/modules/diagnostics/dto/reports.dto.ts:263` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "observationId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una notificación crítica para la observación |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant custodio de la notificación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-reports.controller.spec.ts:56` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-09`

---

## 13. POST /diagnostics/critical-results/{id}/acknowledge

- **Origen:** CONTRATO
- **Nombre:** Acusar recibo / escalar notificación crítica
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportsController.acknowledge` — `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:75`

### Qué es y para qué sirve (negocio)

Acusar recibo / escalar notificación crítica. Caso de uso UC-20-10: Acusar recibo / escalar. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:24`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/critical-results/{id}/acknowledge` la atiende `DiagnosticsReportsController.acknowledge` (src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:75). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AcknowledgeCriticalResultDto` (2 campos, 1 obligatorio). Delega en `DiagnosticsReportsService.acknowledgeCritical`. Actualiza diagnostics.critical_result_notifications. Lee diagnostics.critical_result_notifications.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:75` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.critical_result_notifications` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsReportsController.acknowledge → DiagnosticsReportsService.acknowledgeCritical | `src/modules/diagnostics/services/diagnostics-reports.service.ts:291` |
| `diagnostics.critical_result_notifications` | LEE | LEE | DIRECTA | DiagnosticsReportsController.acknowledge → DiagnosticsReportsService.acknowledgeCritical → ReportsRepository.findCriticalNotification | `src/modules/diagnostics/repositories/reports.repository.ts:156` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AcknowledgeCriticalResultDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `acknowledgedByProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Profesional que acusa recibo | `src/modules/diagnostics/dto/reports.dto.ts:273` |
| `communicationEvidenceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Evidencia de comunicación | `src/modules/diagnostics/dto/reports.dto.ts:284` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "acknowledgedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "acknowledgedByProfileId": "00000000-0000-4000-8000-000000000001",
  "communicationEvidenceId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Notificación crítica no encontrada |
| 409 | `CONFLICT` | ConflictException: La notificación ya fue reconocida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-reports.controller.spec.ts:62` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-10`

---

## 14. POST /diagnostics/data-quality-events

- **Origen:** CONTRATO
- **Nombre:** Registrar evento de calidad de datos + enlazar provenance
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsImagingController.recordDataQuality` — `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:129`

### Qué es y para qué sirve (negocio)

Registrar evento de calidad de datos + enlazar provenance. Caso de uso UC-20-14: Evento de calidad de datos + provenance. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:29`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/data-quality-events` la atiende `DiagnosticsImagingController.recordDataQuality` (src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:129). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateDataQualityEventDto` (9 campos, 2 obligatorios). Delega en `DiagnosticsMediaQualityService.recordDataQualityEvent`. Crea filas en diagnostics.diagnostic_data_quality_events, diagnostics.diagnostic_provenance_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:129` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.diagnostic_data_quality_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.recordDataQuality → DiagnosticsMediaQualityService.recordDataQualityEvent → MediaQualityRepository.createDataQualityEvent | `src/modules/diagnostics/repositories/media-quality.repository.ts:244` |
| `diagnostics.diagnostic_provenance_links` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.recordDataQuality → DiagnosticsMediaQualityService.recordDataQualityEvent → MediaQualityRepository.addProvenanceLink | `src/modules/diagnostics/repositories/media-quality.repository.ts:303` |

### Cuerpo — DTO `CreateDataQualityEventDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del objetivo (specimen/observation/study) | `src/modules/diagnostics/dto/media-quality.dto.ts:189` |
| `ruleCode` | `string` | Sí | longitud máxima 120 | `@IsString()` `@MaxLength(120)` | Código de regla de calidad | `src/modules/diagnostics/dto/media-quality.dto.ts:197` |
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant custodio (por defecto el del token) | `src/modules/diagnostics/dto/media-quality.dto.ts:208` |
| `targetTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de objetivo (concept id) | `src/modules/diagnostics/dto/media-quality.dto.ts:219` |
| `severityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Severidad (concept id) | `src/modules/diagnostics/dto/media-quality.dto.ts:230` |
| `detailsJson` | `object` | No | — | `@IsOptional()` | Detalles del hallazgo (JSON libre) | `src/modules/diagnostics/dto/media-quality.dto.ts:237` |
| `provenanceSourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id de la fuente para enlazar provenance | `src/modules/diagnostics/dto/media-quality.dto.ts:248` |
| `provenanceSourceTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de fuente de provenance (concept id) | `src/modules/diagnostics/dto/media-quality.dto.ts:259` |
| `agentProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional/agente de la derivación | `src/modules/diagnostics/dto/media-quality.dto.ts:270` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "targetId": "00000000-0000-4000-8000-000000000001",
  "ruleCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant custodio del evento de calidad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.spec.ts:80` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-14`

---

## 15. POST /diagnostics/imaging-endpoints

- **Origen:** CONTRATO
- **Nombre:** Registrar un endpoint DICOM (soporte para STOW-RS)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsImagingController.createEndpoint` — `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:80`

### Qué es y para qué sirve (negocio)

Registrar un endpoint DICOM (soporte para STOW-RS). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/imaging-endpoints` la atiende `DiagnosticsImagingController.createEndpoint` (src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:80). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateImagingEndpointDto` (4 campos, 1 obligatorio). Delega en `DiagnosticsImagingService.createEndpoint`. Crea filas en diagnostics.imaging_endpoints.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:80` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.imaging_endpoints` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.createEndpoint → DiagnosticsImagingService.createEndpoint → ImagingRepository.createEndpoint | `src/modules/diagnostics/repositories/imaging.repository.ts:170` |

### Cuerpo — DTO `CreateImagingEndpointDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `baseUri` | `string` | Sí | longitud máxima 2000 | `@IsString()` `@MaxLength(2000)` | URI base del endpoint (STOW-RS/WADO) | `src/modules/diagnostics/dto/imaging.dto.ts:23` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant (por defecto el del token) | `src/modules/diagnostics/dto/imaging.dto.ts:34` |
| `endpointTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de endpoint (concept id) | `src/modules/diagnostics/dto/imaging.dto.ts:45` |
| `storageRegionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Región de almacenamiento (concept id) | `src/modules/diagnostics/dto/imaging.dto.ts:56` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "baseUri": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "baseUri": "valor-ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "endpointTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "storageRegionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Falta el tenant del endpoint de imagen |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.spec.ts:41` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsImagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /diagnostics/imaging-studies/{id}/dose-events

- **Origen:** CONTRATO
- **Nombre:** Registrar evento de dosis de radiación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsImagingController.recordDose` — `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:117`

### Qué es y para qué sirve (negocio)

Registrar evento de dosis de radiación. Caso de uso UC-20-13: Registrar dosis de radiación. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:28`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/imaging-studies/{id}/dose-events` la atiende `DiagnosticsImagingController.recordDose` (src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:117). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `RecordDoseEventDto` (8 campos, 0 obligatorios). Delega en `DiagnosticsImagingService.recordDoseEvent`. Crea filas en diagnostics.radiation_dose_events. Lee diagnostics.imaging_studies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:117` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:117` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.imaging_studies` | LEE | LEE | DIRECTA | DiagnosticsImagingController.recordDose → DiagnosticsImagingService.recordDoseEvent → ImagingRepository.findStudy | `src/modules/diagnostics/repositories/imaging.repository.ts:142` |
| `diagnostics.radiation_dose_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.recordDose → DiagnosticsImagingService.recordDoseEvent → ImagingRepository.recordDoseEvent | `src/modules/diagnostics/repositories/imaging.repository.ts:437` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordDoseEventDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `imagingSeriesId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Serie de imagen relacionada | `src/modules/diagnostics/dto/imaging.dto.ts:265` |
| `doseLengthProduct` | `string` | No | longitud máxima 40 | `@IsOptional()` `@IsString()` `@MaxLength(40)` | Dose Length Product | `src/modules/diagnostics/dto/imaging.dto.ts:274` |
| `computedTomographyDoseIndex` | `string` | No | longitud máxima 40 | `@IsOptional()` `@IsString()` `@MaxLength(40)` | CTDI | `src/modules/diagnostics/dto/imaging.dto.ts:283` |
| `doseAreaProduct` | `string` | No | longitud máxima 40 | `@IsOptional()` `@IsString()` `@MaxLength(40)` | Dose Area Product | `src/modules/diagnostics/dto/imaging.dto.ts:292` |
| `effectiveDoseMsv` | `string` | No | longitud máxima 40 | `@IsOptional()` `@IsString()` `@MaxLength(40)` | Dosis efectiva (mSv) | `src/modules/diagnostics/dto/imaging.dto.ts:301` |
| `unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad de dosis (concept id) | `src/modules/diagnostics/dto/imaging.dto.ts:312` |
| `sourceSopInstanceUid` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | SOP Instance UID de origen (evita doble conteo) | `src/modules/diagnostics/dto/imaging.dto.ts:323` |
| `deviceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Dispositivo/modalidad (device id) | `src/modules/diagnostics/dto/imaging.dto.ts:334` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Estudio de imagen no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.spec.ts:69` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-13`

---

## 17. GET /diagnostics/patients/{patientProfileId}/imaging-studies

- **Origen:** CONTRATO
- **Nombre:** Listar los estudios de imagen del paciente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsImagingController.listStudies` — `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:65`

### Qué es y para qué sirve (negocio)

Listar los estudios de imagen del paciente. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/patients/{patientProfileId}/imaging-studies` la atiende `DiagnosticsImagingController.listStudies` (src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:65). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `DiagnosticsImagingService.listStudiesByPatient`. Lee diagnostics.imaging_studies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:65` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | offset (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:65` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.imaging_studies` | LEE | LEE | DIRECTA | DiagnosticsImagingController.listStudies → DiagnosticsImagingService.listStudiesByPatient → ImagingRepository.findStudiesByPatient | `src/modules/diagnostics/repositories/imaging.repository.ts:134` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |
| `offset` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ImagingStudySummaryDto[]>` · DTO `ImagingStudySummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del estudio. | `src/modules/diagnostics/dto/imaging.dto.ts:340` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Paciente al que pertenece. | `src/modules/diagnostics/dto/imaging.dto.ts:342` |
| `serviceRequestId` | `string` | No | formato uuid | — | Orden clínica que lo originó, si la hay. | `src/modules/diagnostics/dto/imaging.dto.ts:344` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado del estudio. | `src/modules/diagnostics/dto/imaging.dto.ts:346` |
| `studyInstanceUid` | `string` | No | — | — | Identificador DICOM del estudio. | `src/modules/diagnostics/dto/imaging.dto.ts:348` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsImagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. GET /diagnostics/patients/{patientProfileId}/orders

- **Origen:** CONTRATO
- **Nombre:** Órdenes de laboratorio e imagenología del paciente, con sus informes
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsOrdersController.getPatientOrders` — `src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:41`

### Qué es y para qué sirve (negocio)

Órdenes de laboratorio e imagenología del paciente, con sus informes. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/patients/{patientProfileId}/orders` la atiende `DiagnosticsOrdersController.getPatientOrders` (src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:41). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `DiagnosticsOrdersService.getPatientOrders`. Lee clinical.diagnostic_reports, clinical.service_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:41` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getPatientOrders → DiagnosticsOrdersService.getPatientOrders → DiagnosticOrdersRepository.findReportsByPatient | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:80` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getPatientOrders → DiagnosticsOrdersService.getPatientOrders → DiagnosticOrdersRepository.findOrdersByPatient | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:49` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |
| `limit` | query | No | `number` | Tope aplicado a cada bloque (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientDiagnosticOrdersResponseDto>` · DTO `PatientDiagnosticOrdersResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | — | Paciente leído. | `src/modules/diagnostics/dto/orders.dto.ts:98` |
| `orders` | `array<DiagnosticOrderSummaryDto>` | Sí | — | — | Órdenes de laboratorio e imagenología, de la más nueva a la más vieja. | `src/modules/diagnostics/dto/orders.dto.ts:102` |
| `orders[].id` | `string` | Sí | formato uuid | — | Identificador de la orden. | `src/modules/diagnostics/dto/orders.dto.ts:14` |
| `orders[].patientProfileId` | `string` | Sí | formato uuid | — | Paciente al que pertenece. | `src/modules/diagnostics/dto/orders.dto.ts:17` |
| `orders[].encounterId` | `string` | No | formato uuid | — | Encuentro en el que se pidió, si se pidió durante uno. | `src/modules/diagnostics/dto/orders.dto.ts:20` |
| `orders[].codeConceptId` | `string` | Sí | formato uuid | — | Qué se pidió (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:23` |
| `orders[].categoryConceptId` | `string` | No | formato uuid | — | Laboratorio o imagenología (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:26` |
| `orders[].statusConceptId` | `string` | Sí | formato uuid | — | Estado de la orden (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:29` |
| `orders[].priorityConceptId` | `string` | No | formato uuid | — | Prioridad (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:32` |
| `orders[].requesterProfileId` | `string` | No | formato uuid | — | Profesional que la solicitó. | `src/modules/diagnostics/dto/orders.dto.ts:35` |
| `orders[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se pidió. | `src/modules/diagnostics/dto/orders.dto.ts:38` |
| `reports` | `array<DiagnosticReportSummaryDto>` | Sí | — | — | Informes diagnósticos, de la más nueva a la más vieja. | `src/modules/diagnostics/dto/orders.dto.ts:106` |
| `reports[].id` | `string` | Sí | formato uuid | — | Identificador del informe. | `src/modules/diagnostics/dto/orders.dto.ts:51` |
| `reports[].patientProfileId` | `string` | Sí | formato uuid | — | Paciente al que pertenece. | `src/modules/diagnostics/dto/orders.dto.ts:54` |
| `reports[].serviceRequestId` | `string` | No | formato uuid | — | Orden que lo originó, si cuelga de una. | `src/modules/diagnostics/dto/orders.dto.ts:57` |
| `reports[].encounterId` | `string` | No | formato uuid | — | Encuentro asociado, si lo hay. | `src/modules/diagnostics/dto/orders.dto.ts:60` |
| `reports[].codeConceptId` | `string` | Sí | formato uuid | — | Qué informa (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:63` |
| `reports[].categoryConceptId` | `string` | No | formato uuid | — | Categoría (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:66` |
| `reports[].lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Estado del ciclo de vida (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:69` |
| `reports[].currentVersionId` | `string` | No | formato uuid | — | Versión vigente, esté liberada o no. | `src/modules/diagnostics/dto/orders.dto.ts:72` |
| `reports[].currentReleasedVersionId` | `string` | No | formato uuid | — | Versión liberada al paciente, si alguna lo está. | `src/modules/diagnostics/dto/orders.dto.ts:75` |
| `reports[].resultReleaseStatusConceptId` | `string` | No | formato uuid | — | Estado de liberación de resultados (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:79` |
| `reports[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se emitió. | `src/modules/diagnostics/dto/orders.dto.ts:82` |
| `limit` | `number` | Sí | — | — | Tope aplicado a cada bloque. | `src/modules/diagnostics/dto/orders.dto.ts:109` |
| `truncated` | `array<string>` | Sí | — | — | Bloques que quedaron recortados por el tope. | `src/modules/diagnostics/dto/orders.dto.ts:112` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-orders.controller.spec.ts:29` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /diagnostics/reports/{reportId}/versions

- **Origen:** CONTRATO
- **Nombre:** Crear/enmendar versión de informe diagnóstico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportsController.createVersion` — `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:39`

### Qué es y para qué sirve (negocio)

Crear/enmendar versión de informe diagnóstico. Caso de uso UC-20-07: Crear/enmendar versión de informe. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/reports/{reportId}/versions` la atiende `DiagnosticsReportsController.createVersion` (src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:39). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateReportVersionDto` (14 campos, 0 obligatorios). Delega en `DiagnosticsReportsService.createReportVersion`. Crea filas en diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_results, diagnostics.diagnostic_report_versions. Lee diagnostics.diagnostic_report_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:39` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: reportId | `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:39` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.diagnostic_report_files` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportsController.createVersion → DiagnosticsReportsService.createReportVersion → ReportsRepository.addFile | `src/modules/diagnostics/repositories/reports.repository.ts:286` |
| `diagnostics.diagnostic_report_results` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportsController.createVersion → DiagnosticsReportsService.createReportVersion → ReportsRepository.addResult | `src/modules/diagnostics/repositories/reports.repository.ts:237` |
| `diagnostics.diagnostic_report_versions` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportsController.createVersion → DiagnosticsReportsService.createReportVersion → ReportsRepository.createVersion | `src/modules/diagnostics/repositories/reports.repository.ts:188` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsReportsController.createVersion → DiagnosticsReportsService.createReportVersion → ReportsRepository.findVersionInReport | `src/modules/diagnostics/repositories/reports.repository.ts:142` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `reportId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateReportVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant custodio (por defecto el del token) | `src/modules/diagnostics/dto/reports.dto.ts:85` |
| `conclusionText` | `string` | No | longitud máxima 20000 | `@IsOptional()` `@IsString()` `@MaxLength(20000)` | Conclusión clínica | `src/modules/diagnostics/dto/reports.dto.ts:94` |
| `authorProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Autor (profesional validador) | `src/modules/diagnostics/dto/reports.dto.ts:105` |
| `supersedesVersionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Versión previa que enmienda | `src/modules/diagnostics/dto/reports.dto.ts:116` |
| `amendmentReasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Motivo de enmienda (concept id) | `src/modules/diagnostics/dto/reports.dto.ts:127` |
| `amendmentReasonText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Texto del motivo de enmienda | `src/modules/diagnostics/dto/reports.dto.ts:136` |
| `results` | `array<ReportResultItemDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ReportResultItemDto)` | Observaciones enlazadas | `src/modules/diagnostics/dto/reports.dto.ts:149` |
| `results[].observationId` | `string` | No | formato uuid | `@IsUUID()` | Observación enlazada | `src/modules/diagnostics/dto/reports.dto.ts:21` |
| `results[].resultRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol del resultado (concept id) | `src/modules/diagnostics/dto/reports.dto.ts:32` |
| `results[].ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden dentro del informe | `src/modules/diagnostics/dto/reports.dto.ts:41` |
| `files` | `array<ReportFileItemDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ReportFileItemDto)` | Archivos adjuntos | `src/modules/diagnostics/dto/reports.dto.ts:162` |
| `files[].fileId` | `string` | No | formato uuid | `@IsUUID()` | Archivo (common.files) | `src/modules/diagnostics/dto/reports.dto.ts:51` |
| `files[].contentRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol del contenido (concept id) | `src/modules/diagnostics/dto/reports.dto.ts:62` |
| `files[].ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden | `src/modules/diagnostics/dto/reports.dto.ts:71` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La versión que se enmienda no existe en este informe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant custodio del informe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-reports.controller.spec.ts:34` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-07`

---

## 20. POST /diagnostics/reports/{reportId}/versions/{versionId}/release

- **Origen:** CONTRATO
- **Nombre:** Validar y liberar una versión del informe
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportsController.releaseVersion` — `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:51`

### Qué es y para qué sirve (negocio)

Validar y liberar una versión del informe. Caso de uso UC-20-08: Validar y liberar. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/reports/{reportId}/versions/{versionId}/release` la atiende `DiagnosticsReportsController.releaseVersion` (src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:51). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ReleaseReportVersionDto` (3 campos, 0 obligatorios). Delega en `DiagnosticsReportsService.releaseVersion`. Crea filas en diagnostics.diagnostic_release_events. Actualiza clinical.diagnostic_reports, diagnostics.diagnostic_report_versions. Lee clinical.diagnostic_reports, diagnostics.diagnostic_report_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: reportId, versionId | `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:51` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsReportsController.releaseVersion → DiagnosticsReportsService.releaseVersion → DiagnosticOrdersRepository.markReportReleased | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:287` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsReportsController.releaseVersion → DiagnosticsReportsService.releaseVersion → DiagnosticOrdersRepository.findReportById | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:235` |
| `diagnostics.diagnostic_release_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportsController.releaseVersion → DiagnosticsReportsService.releaseVersion → ReportsRepository.recordReleaseEvent | `src/modules/diagnostics/repositories/reports.repository.ts:341` |
| `diagnostics.diagnostic_report_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsReportsController.releaseVersion → DiagnosticsReportsService.releaseVersion | `src/modules/diagnostics/services/diagnostics-reports.service.ts:179` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsReportsController.releaseVersion → DiagnosticsReportsService.releaseVersion → ReportsRepository.findVersionInReport | `src/modules/diagnostics/repositories/reports.repository.ts:142` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `reportId` | path | Sí | `string` | — |
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `ReleaseReportVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientVisibility` | `string` | No | valores: VISIBLE, HIDDEN | `@IsOptional()` `@IsString()` | Visibilidad al paciente | `src/modules/diagnostics/dto/reports.dto.ts:176` |
| `reasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Motivo (concept id) | `src/modules/diagnostics/dto/reports.dto.ts:184` |
| `policyVersion` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Versión de la política aplicada | `src/modules/diagnostics/dto/reports.dto.ts:193` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientVisibility": "VISIBLE",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001",
  "policyVersion": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de informe no encontrada |
| 409 | `CONFLICT` | ConflictException: La versión ya fue liberada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión no es elegible para liberación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-reports.controller.spec.ts:44` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-08`

---

## 21. POST /diagnostics/results/{observationId}/verifications

- **Origen:** CONTRATO
- **Nombre:** Verificar (técnica/facultativa) un resultado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabController.verifyResult` — `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:105`

### Qué es y para qué sirve (negocio)

Verificar (técnica/facultativa) un resultado. Caso de uso UC-20-06: Verificar (técnica/facultativa). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/results/{observationId}/verifications` la atiende `DiagnosticsLabController.verifyResult` (src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:105). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `VerifyResultDto` (6 campos, 2 obligatorios). Delega en `DiagnosticsLabService.verifyResult`. Crea filas en diagnostics.result_verifications. Actualiza diagnostics.laboratory_work_order_tests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:105` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: observationId | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:105` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.laboratory_work_order_tests` | ESCRIBE | ACTUALIZA | DIRECTA | DiagnosticsLabController.verifyResult → DiagnosticsLabService.verifyResult → LabWorkRepository.markTestsVerifiedForObservation | `src/modules/diagnostics/repositories/lab-work.repository.ts:418` |
| `diagnostics.result_verifications` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabController.verifyResult → DiagnosticsLabService.verifyResult → LabWorkRepository.recordVerification | `src/modules/diagnostics/repositories/lab-work.repository.ts:394` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `observationId` | path | Sí | `string` | — |

### Cuerpo — DTO `VerifyResultDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `level` | `string` | Sí | valores: TECHNICAL, MEDICAL | `@IsIn(['TECHNICAL', 'MEDICAL'])` | Nivel de verificación | `src/modules/diagnostics/dto/lab.dto.ts:257` |
| `verifiedByProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Profesional que verifica | `src/modules/diagnostics/dto/lab.dto.ts:264` |
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant custodio (por defecto el del token) | `src/modules/diagnostics/dto/lab.dto.ts:275` |
| `resultConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Resultado de la verificación (concept id) | `src/modules/diagnostics/dto/lab.dto.ts:286` |
| `previousVerificationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Verificación previa que se encadena | `src/modules/diagnostics/dto/lab.dto.ts:297` |
| `verificationComment` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Comentario de la verificación | `src/modules/diagnostics/dto/lab.dto.ts:306` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "level": "TECHNICAL",
  "verifiedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "level": "TECHNICAL",
  "verifiedByProfileId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "resultConceptId": "00000000-0000-4000-8000-000000000001",
  "previousVerificationId": "00000000-0000-4000-8000-000000000001",
  "verificationComment": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant custodio de la verificación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab.controller.spec.ts:55` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-06`

---

## 22. POST /diagnostics/specimens

- **Origen:** CONTRATO
- **Nombre:** Registrar un espécimen (soporte para acesión)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsSpecimensController.createSpecimen` — `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:41`

### Qué es y para qué sirve (negocio)

Registrar un espécimen (soporte para acesión). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/specimens` la atiende `DiagnosticsSpecimensController.createSpecimen` (src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:41). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateSpecimenDto` (8 campos, 3 obligatorios). Delega en `DiagnosticsSpecimensService.createSpecimen`. Crea filas en diagnostics.specimens.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.specimens` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.createSpecimen → DiagnosticsSpecimensService.createSpecimen → SpecimensRepository.createSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:197` |

### Cuerpo — DTO `CreateSpecimenDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente dueño del espécimen | `src/modules/diagnostics/dto/specimens.dto.ts:20` |
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio | `src/modules/diagnostics/dto/specimens.dto.ts:27` |
| `specimenTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de espécimen (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:37` |
| `serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Orden clínica de origen | `src/modules/diagnostics/dto/specimens.dto.ts:48` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/diagnostics/dto/specimens.dto.ts:56` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio anatómico (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:67` |
| `collectionMethodConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Método de recolección (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:78` |
| `collectorProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional que recolecta | `src/modules/diagnostics/dto/specimens.dto.ts:89` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.spec.ts:36` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsSpecimensController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /diagnostics/specimens/{id}/containers

- **Origen:** CONTRATO
- **Nombre:** Registrar un contenedor de espécimen (soporte para custodia)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsSpecimensController.createContainer` — `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:75`

### Qué es y para qué sirve (negocio)

Registrar un contenedor de espécimen (soporte para custodia). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/specimens/{id}/containers` la atiende `DiagnosticsSpecimensController.createContainer` (src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:75). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateContainerDto` (4 campos, 2 obligatorios). Delega en `DiagnosticsSpecimensService.createContainer`. Crea filas en diagnostics.specimen_containers. Lee diagnostics.specimens.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:75` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.specimen_containers` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.createContainer → DiagnosticsSpecimensService.createContainer → SpecimensRepository.createContainer | `src/modules/diagnostics/repositories/specimens.repository.ts:407` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.createContainer → DiagnosticsSpecimensService.createContainer → SpecimensRepository.findSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:158` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateContainerDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `containerIdentifier` | `string` | Sí | longitud mínima 1; longitud máxima 120 | `@IsString()` `@IsNotEmpty()` `@MaxLength(120)` | Identificador del contenedor | `src/modules/diagnostics/dto/specimens.dto.ts:215` |
| `containerTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de contenedor (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:225` |
| `additiveConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Aditivo (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:233` |
| `parentContainerId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Contenedor padre | `src/modules/diagnostics/dto/specimens.dto.ts:241` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "containerIdentifier": "valor-ejemplo",
  "containerTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "containerIdentifier": "valor-ejemplo",
  "containerTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "additiveConceptId": "00000000-0000-4000-8000-000000000001",
  "parentContainerId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espécimen no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.spec.ts:59` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsSpecimensController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /diagnostics/specimens/{id}/rejection

- **Origen:** CONTRATO
- **Nombre:** Rechazar espécimen y solicitar recolección
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsSpecimensController.reject` — `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:63`

### Qué es y para qué sirve (negocio)

Rechazar espécimen y solicitar recolección. Caso de uso UC-20-02: Rechazar espécimen y solicitar recolección. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/specimens/{id}/rejection` la atiende `DiagnosticsSpecimensController.reject` (src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:63). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `RejectSpecimenDto` (5 campos, 1 obligatorio). Delega en `DiagnosticsSpecimensService.reject`. Crea filas en diagnostics.specimen_rejection_events. Actualiza diagnostics.laboratory_work_order_tests, diagnostics.specimens. Lee diagnostics.specimens.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:63` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.laboratory_work_order_tests` | ESCRIBE | ACTUALIZA | DIRECTA | DiagnosticsSpecimensController.reject → DiagnosticsSpecimensService.reject → SpecimensRepository.cancelTestsForSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:474` |
| `diagnostics.specimen_rejection_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.reject → DiagnosticsSpecimensService.reject → SpecimensRepository.recordRejection | `src/modules/diagnostics/repositories/specimens.repository.ts:380` |
| `diagnostics.specimens` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsSpecimensController.reject → DiagnosticsSpecimensService.reject | `src/modules/diagnostics/services/diagnostics-specimens.service.ts:192` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.reject → DiagnosticsSpecimensService.reject → SpecimensRepository.findSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:158` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RejectSpecimenDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `rejectionReasonConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Motivo de rechazo (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:164` |
| `notes` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Notas del rechazo | `src/modules/diagnostics/dto/specimens.dto.ts:173` |
| `recollectionRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Requiere nueva recolección? | `src/modules/diagnostics/dto/specimens.dto.ts:181` |
| `recollectionServiceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nueva orden de recolección | `src/modules/diagnostics/dto/specimens.dto.ts:192` |
| `rejectedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional que rechaza | `src/modules/diagnostics/dto/specimens.dto.ts:203` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "rejectionReasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "rejectionReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "notes": "Texto descriptivo de ejemplo",
  "recollectionRequired": true,
  "recollectionServiceRequestId": "00000000-0000-4000-8000-000000000001",
  "rejectedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/diagnostics/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/diagnostics/dto/responses.dto.ts:18` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espécimen no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El espécimen ya está rechazado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.spec.ts:49` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-02`

---

## 25. GET /diagnostics/work-orders

- **Origen:** CONTRATO
- **Nombre:** Listar las órdenes de trabajo del laboratorio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabController.listWorkOrders` — `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:56`

### Qué es y para qué sirve (negocio)

Listar las órdenes de trabajo del laboratorio. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/work-orders` la atiende `DiagnosticsLabController.listWorkOrders` (src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:56). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `DiagnosticsLabService.listWorkOrders`. Lee diagnostics.laboratory_work_orders.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:56` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabController.listWorkOrders → DiagnosticsLabService.listWorkOrders → LabWorkRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-work.repository.ts:161` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `laboratoryAccessionId` | query | No | `string` | Accesión de laboratorio |
| `statusConceptId` | query | No | `string` | Estado de la orden |
| `assignedProfileId` | query | No | `string` | Profesional asignado |
| `limit` | query | No | `number` | — |
| `offset` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<WorkOrderSummaryDto[]>` · DTO `WorkOrderSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la orden. | `src/modules/diagnostics/dto/lab.dto.ts:363` |
| `workOrderNumber` | `string` | Sí | — | — | Número legible de la orden. | `src/modules/diagnostics/dto/lab.dto.ts:365` |
| `laboratoryAccessionId` | `string` | Sí | formato uuid | — | Accesión de laboratorio de la que cuelga. | `src/modules/diagnostics/dto/lab.dto.ts:367` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la orden. | `src/modules/diagnostics/dto/lab.dto.ts:369` |
| `priorityConceptId` | `string` | Sí | formato uuid | — | Prioridad. | `src/modules/diagnostics/dto/lab.dto.ts:371` |
| `assignedProfileId` | `string` | No | formato uuid | — | Profesional asignado, si lo hay. | `src/modules/diagnostics/dto/lab.dto.ts:373` |
| `scheduledAt` | `string` | No | formato date-time | — | Cuándo está programada. | `src/modules/diagnostics/dto/lab.dto.ts:376` |
| `completedAt` | `string` | No | formato date-time | — | Cuándo se completó. | `src/modules/diagnostics/dto/lab.dto.ts:379` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. POST /diagnostics/work-orders

- **Origen:** CONTRATO
- **Nombre:** Abrir orden de trabajo y desglosar pruebas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabController.createWorkOrder` — `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:67`

### Qué es y para qué sirve (negocio)

Abrir orden de trabajo y desglosar pruebas. Caso de uso UC-20-04: Abrir orden de trabajo y desglosar pruebas. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/work-orders` la atiende `DiagnosticsLabController.createWorkOrder` (src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:67). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateWorkOrderDto` (11 campos, 4 obligatorios). Delega en `DiagnosticsLabService.createWorkOrder`. Crea filas en diagnostics.laboratory_work_order_tests, diagnostics.laboratory_work_orders. Actualiza diagnostics.laboratory_accessions. Lee diagnostics.laboratory_accessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.laboratory_accessions` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsLabController.createWorkOrder → DiagnosticsLabService.createWorkOrder | `src/modules/diagnostics/services/diagnostics-lab.service.ts:132` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsLabController.createWorkOrder → DiagnosticsLabService.createWorkOrder → SpecimensRepository.findAccession | `src/modules/diagnostics/repositories/specimens.repository.ts:172` |
| `diagnostics.laboratory_work_order_tests` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabController.createWorkOrder → DiagnosticsLabService.createWorkOrder → LabWorkRepository.createWorkOrderTest | `src/modules/diagnostics/repositories/lab-work.repository.ts:237` |
| `diagnostics.laboratory_work_orders` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabController.createWorkOrder → DiagnosticsLabService.createWorkOrder → LabWorkRepository.createWorkOrder | `src/modules/diagnostics/repositories/lab-work.repository.ts:211` |

### Cuerpo — DTO `CreateWorkOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `laboratoryAccessionId` | `string` | Sí | formato uuid | `@IsUUID()` | Acesión de laboratorio en estado recibido | `src/modules/diagnostics/dto/lab.dto.ts:77` |
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant custodio (por defecto el del token) | `src/modules/diagnostics/dto/lab.dto.ts:88` |
| `workOrderNumber` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Nº de orden (se genera si se omite) | `src/modules/diagnostics/dto/lab.dto.ts:97` |
| `priorityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Prioridad (concept id) | `src/modules/diagnostics/dto/lab.dto.ts:108` |
| `assignedLaboratoryUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad de laboratorio asignada | `src/modules/diagnostics/dto/lab.dto.ts:119` |
| `tests` | `array<WorkOrderTestItemDto>` | Sí | — | `@IsArray()` `@ArrayNotEmpty()` `@ValidateNested({ each: true })` `@Type(() => WorkOrderTestItemDto)` | Pruebas a desglosar | `src/modules/diagnostics/dto/lab.dto.ts:132` |
| `tests[].serviceRequestId` | `string` | Sí | formato uuid | `@IsUUID()` | Orden clínica que solicita la prueba | `src/modules/diagnostics/dto/lab.dto.ts:27` |
| `tests[].testCodeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código de prueba (concept id) | `src/modules/diagnostics/dto/lab.dto.ts:34` |
| `tests[].specimenId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Espécimen sobre el que se corre | `src/modules/diagnostics/dto/lab.dto.ts:45` |
| `tests[].methodConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Método (concept id) | `src/modules/diagnostics/dto/lab.dto.ts:53` |
| `tests[].analyzerDeviceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Analizador asignado (device id) | `src/modules/diagnostics/dto/lab.dto.ts:64` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<WorkOrderCreatedDto>` · DTO `WorkOrderCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/diagnostics/dto/responses.dto.ts:61` |
| `status` | `string` | Sí | formato uuid | — | Valor de status mantenido por la instancia. | `src/modules/diagnostics/dto/responses.dto.ts:67` |
| `testIds` | `array<string>` | Sí | formato uuid | — | Ids de las pruebas creadas | `src/modules/diagnostics/dto/responses.dto.ts:77` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Acesión no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab.controller.spec.ts:32` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-04`

---

## 27. POST /dicomweb/studies

- **Origen:** CONTRATO
- **Nombre:** Ingestar estudio DICOM (STOW-RS) y ubicaciones de objeto
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsImagingController.storeStudy` — `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:93`

### Qué es y para qué sirve (negocio)

Ingestar estudio DICOM (STOW-RS) y ubicaciones de objeto. Caso de uso UC-20-11: Ingestar estudio DICOM (STOW-RS). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:26`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /dicomweb/studies` la atiende `DiagnosticsImagingController.storeStudy` (src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:93). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `StoreImagingStudyDto` (20 campos, 5 obligatorios). Delega en `DiagnosticsImagingService.storeStudy`. Crea filas en diagnostics.dicom_object_locations, diagnostics.imaging_instances, diagnostics.imaging_series, diagnostics.imaging_studies. Lee diagnostics.imaging_endpoints, diagnostics.imaging_studies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.dicom_object_locations` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.storeStudy → DiagnosticsImagingService.storeStudy → ImagingRepository.createObjectLocation | `src/modules/diagnostics/repositories/imaging.repository.ts:366` |
| `diagnostics.imaging_endpoints` | LEE | LEE | DIRECTA | DiagnosticsImagingController.storeStudy → DiagnosticsImagingService.storeStudy → ImagingRepository.findEndpoint | `src/modules/diagnostics/repositories/imaging.repository.ts:107` |
| `diagnostics.imaging_instances` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.storeStudy → DiagnosticsImagingService.storeStudy → ImagingRepository.createInstance | `src/modules/diagnostics/repositories/imaging.repository.ts:303` |
| `diagnostics.imaging_series` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.storeStudy → DiagnosticsImagingService.storeStudy → ImagingRepository.createSeries | `src/modules/diagnostics/repositories/imaging.repository.ts:251` |
| `diagnostics.imaging_studies` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.storeStudy → DiagnosticsImagingService.storeStudy → ImagingRepository.createStudy | `src/modules/diagnostics/repositories/imaging.repository.ts:192` |
| `diagnostics.imaging_studies` | LEE | LEE | DIRECTA | DiagnosticsImagingController.storeStudy → DiagnosticsImagingService.storeStudy → ImagingRepository.findStudyByUid | `src/modules/diagnostics/repositories/imaging.repository.ts:156` |

### Cuerpo — DTO `StoreImagingStudyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente del estudio | `src/modules/diagnostics/dto/imaging.dto.ts:190` |
| `imagingEndpointId` | `string` | Sí | formato uuid | `@IsUUID()` | Endpoint DICOM activo | `src/modules/diagnostics/dto/imaging.dto.ts:197` |
| `dicomStudyInstanceUid` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | DICOM Study Instance UID | `src/modules/diagnostics/dto/imaging.dto.ts:205` |
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant custodio (por defecto el del token) | `src/modules/diagnostics/dto/imaging.dto.ts:216` |
| `accessionNumber` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Nº de acesión del estudio | `src/modules/diagnostics/dto/imaging.dto.ts:225` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/diagnostics/dto/imaging.dto.ts:233` |
| `serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/diagnostics/dto/imaging.dto.ts:241` |
| `series` | `array<StowSeriesDto>` | Sí | — | `@IsArray()` `@ArrayNotEmpty()` `@ValidateNested({ each: true })` `@Type(() => StowSeriesDto)` | Series del estudio | `src/modules/diagnostics/dto/imaging.dto.ts:251` |
| `series[].dicomSeriesInstanceUid` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | DICOM Series Instance UID | `src/modules/diagnostics/dto/imaging.dto.ts:147` |
| `series[].modalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Modalidad de la serie (concept id) | `src/modules/diagnostics/dto/imaging.dto.ts:158` |
| `series[].seriesNumber` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Nº de serie | `src/modules/diagnostics/dto/imaging.dto.ts:167` |
| `series[].instances` | `array<StowInstanceDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => StowInstanceDto)` | Instancias SOP de la serie | `src/modules/diagnostics/dto/imaging.dto.ts:180` |
| `series[].instances[].dicomSopInstanceUid` | `string` | No | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | DICOM SOP Instance UID | `src/modules/diagnostics/dto/imaging.dto.ts:67` |
| `series[].instances[].sopClassConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | SOP Class (concept id) | `src/modules/diagnostics/dto/imaging.dto.ts:78` |
| `series[].instances[].instanceNumber` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Nº de instancia | `src/modules/diagnostics/dto/imaging.dto.ts:87` |
| `series[].instances[].retrievalUri` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | URI de recuperación | `src/modules/diagnostics/dto/imaging.dto.ts:96` |
| `series[].instances[].storageBackendId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Backend de almacenamiento del objeto binario | `src/modules/diagnostics/dto/imaging.dto.ts:107` |
| `series[].instances[].objectKey` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Object key en el backend (requerido si hay backend) | `src/modules/diagnostics/dto/imaging.dto.ts:118` |
| `series[].instances[].contentHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash del contenido del objeto | `src/modules/diagnostics/dto/imaging.dto.ts:127` |
| `series[].instances[].sizeBytes` | `string` | No | longitud máxima 40 | `@IsOptional()` `@IsString()` `@MaxLength(40)` | Tamaño en bytes | `src/modules/diagnostics/dto/imaging.dto.ts:136` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ImagingStudyStoredDto>` · DTO `ImagingStudyStoredDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/diagnostics/dto/responses.dto.ts:86` |
| `status` | `string` | Sí | formato uuid | — | Valor de status mantenido por la instancia. | `src/modules/diagnostics/dto/responses.dto.ts:92` |
| `numberOfSeries` | `number` | Sí | — | — | Nº de series creadas | `src/modules/diagnostics/dto/responses.dto.ts:98` |
| `numberOfInstances` | `number` | Sí | — | — | Nº de instancias creadas | `src/modules/diagnostics/dto/responses.dto.ts:104` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Endpoint de imagen no encontrado |
| 409 | `CONFLICT` | ConflictException: El estudio DICOM ya fue almacenado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.spec.ts:56` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-11`

---

