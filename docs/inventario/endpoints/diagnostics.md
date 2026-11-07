<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `diagnostics`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 63 (63 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 20 · MEDIO 12 · BAJO 31
- **Tablas distintas que tocan:** 93
- **Respuestas de error y detalle contractual:** `openapi/endpoints/diagnostics.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/diagnostic-results/me` | Resultados de laboratorio, informes e imagen del titular | BAJO | 7 | PATIENT |
| 2 | GET | `/diagnostic-results/me/{reportId}` | Un resultado del titular, con sus archivos | BAJO | 7 | PATIENT |
| 3 | GET | `/diagnostic-results/me/{reportId}/files/{fileId}/content` | Descargar un archivo de un resultado del titular | BAJO | 9 | PATIENT |
| 4 | GET | `/diagnostic-results/me/{reportId}/shares` | Con quién está compartido un resultado | BAJO | 4 | PATIENT |
| 5 | POST | `/diagnostic-results/me/{reportId}/shares` | Compartir temporalmente un resultado con un profesional | MEDIO | 11 | PATIENT |
| 6 | POST | `/diagnostic-results/me/{reportId}/shares/{shareId}/revoke` | Dejar de compartir un resultado | MEDIO | 5 | PATIENT |
| 7 | GET | `/diagnostic-results/me/orders` | Órdenes de laboratorio e imagen del titular | BAJO | 29 | PATIENT |
| 8 | POST | `/diagnostics/accessions` | Acesionar especímenes recibidos en laboratorio | ALTO | 6 | sesión (sin roles) |
| 9 | GET | `/diagnostics/accessions/{id}` | Detalle de una acesión (especímenes, contenedores y custodia) | BAJO | 5 | sesión (sin roles) |
| 10 | POST | `/diagnostics/analyzer-runs` | Abrir una corrida de analizador (soporte para ingesta) | ALTO | 1 | sesión (sin roles) |
| 11 | POST | `/diagnostics/analyzer-runs/{id}/messages` | Ingerir mensaje de resultado de analizador (LIS/HL7/ASTM) | ALTO | 8 | sesión (sin roles) |
| 12 | POST | `/diagnostics/clinical-media` | Adjuntar media clínica / imagen al chart | MEDIO | 6 | CLINICIAN, PRACTITIONER |
| 13 | POST | `/diagnostics/containers/{id}/custody-events` | Registrar cadena de custodia / traslado de contenedor | ALTO | 5 | sesión (sin roles) |
| 14 | POST | `/diagnostics/critical-results` | Detectar y notificar un resultado crítico | MEDIO | 17 | CLINICIAN, PRACTITIONER |
| 15 | POST | `/diagnostics/critical-results/{id}/acknowledge` | Acusar recibo / escalar notificación crítica | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 16 | POST | `/diagnostics/data-quality-events` | Registrar evento de calidad de datos + enlazar provenance | MEDIO | 5 | CLINICIAN, PRACTITIONER |
| 17 | POST | `/diagnostics/imaging-endpoints` | Registrar un endpoint DICOM (soporte para STOW-RS) | MEDIO | 1 | CLINICIAN, PRACTITIONER |
| 18 | POST | `/diagnostics/imaging-studies/{id}/dose-events` | Registrar evento de dosis de radiación | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 19 | GET | `/diagnostics/lab/orders` | Órdenes derivadas al laboratorio, con su estado derivado | BAJO | 17 | sesión (sin roles) |
| 20 | POST | `/diagnostics/lab/orders` | El centro carga una orden que llega en papel o por mostrador | ALTO | 26 | sesión (sin roles) |
| 21 | PUT | `/diagnostics/lab/orders/{orderId}` | Corregir una orden que cargó el centro, antes de recibirla | ALTO | 23 | sesión (sin roles) |
| 22 | POST | `/diagnostics/lab/orders/{orderId}/transitions` | Un paso del camino de la orden (RECEIVE, PROCESS, REJECT, CANCEL) | ALTO | 30 | sesión (sin roles) |
| 23 | POST | `/diagnostics/lab/patients/lookup` | Paciente por número de documento, para cargar su orden | BAJO | 4 | sesión (sin roles) |
| 24 | GET | `/diagnostics/lab/result-files` | Resultados subidos por el laboratorio | BAJO | 16 | sesión (sin roles) |
| 25 | GET | `/diagnostics/lab/result-files/{id}/content` | Descargar un resultado subido | BAJO | 16 | sesión (sin roles) |
| 26 | POST | `/diagnostics/lab/result-files/{id}/withdrawal` | Retirar un resultado subido por error (queda en el historial) | ALTO | 22 | sesión (sin roles) |
| 27 | POST | `/diagnostics/lab/result-files/search` | Buscar entre los resultados subidos (filtros en el cuerpo) | BAJO | 16 | sesión (sin roles) |
| 28 | GET | `/diagnostics/lab/result-targets` | Órdenes procesadas a las que se puede adjuntar un resultado | BAJO | 16 | sesión (sin roles) |
| 29 | POST | `/diagnostics/lab/result-uploads` | Empezar la subida por partes de un resultado | BAJO | 16 | sesión (sin roles) |
| 30 | DELETE | `/diagnostics/lab/result-uploads/{uploadId}` | Cancelar una subida abierta | BAJO | 0 | sesión (sin roles) |
| 31 | POST | `/diagnostics/lab/result-uploads/{uploadId}/complete` | Cerrar la subida: guarda el archivo y lo publica en el informe | ALTO | 31 | sesión (sin roles) |
| 32 | PUT | `/diagnostics/lab/result-uploads/{uploadId}/parts/{index}` | Mandar una parte (bytes crudos) | BAJO | 0 | sesión (sin roles) |
| 33 | GET | `/diagnostics/lab/summary` | Resumen del laboratorio del tenant activo | BAJO | 20 | sesión (sin roles) |
| 34 | GET | `/diagnostics/patients/{patientProfileId}/imaging-studies` | Listar los estudios de imagen del paciente | BAJO | 4 | CLINICIAN, PRACTITIONER |
| 35 | GET | `/diagnostics/patients/{patientProfileId}/orders` | Órdenes de laboratorio e imagenología del paciente, con sus informes | BAJO | 9 | CLINICIAN, PRACTITIONER |
| 36 | GET | `/diagnostics/patients/{patientProfileId}/reports/{reportId}` | Resultado liberado de un informe del paciente | BAJO | 13 | CLINICIAN, PRACTITIONER |
| 37 | GET | `/diagnostics/patients/{patientProfileId}/reports/{reportId}/files/{fileId}/content` | Descargar un archivo del resultado liberado | BAJO | 10 | CLINICIAN, PRACTITIONER |
| 38 | POST | `/diagnostics/report-drafts` | Abrir (u obtener) el borrador del informe de una orden | ALTO | 5 | sesión (sin roles) |
| 39 | GET | `/diagnostics/report-drafts/{id}` | Borrador del informe | BAJO | 4 | sesión (sin roles) |
| 40 | PUT | `/diagnostics/report-drafts/{id}` | Guardar el borrador (409 si cambió o ya se publicó) | BAJO | 9 | sesión (sin roles) |
| 41 | POST | `/diagnostics/report-drafts/{id}/files` | Adjuntar documento, audio o anexo al borrador | ALTO | 5 | sesión (sin roles) |
| 42 | DELETE | `/diagnostics/report-drafts/{id}/files/{draftFileId}` | Quitar un archivo del borrador | ALTO | 5 | sesión (sin roles) |
| 43 | POST | `/diagnostics/report-drafts/{id}/preview` | Vista previa en PDF con marca de agua «BORRADOR» | BAJO | 13 | sesión (sin roles) |
| 44 | POST | `/diagnostics/report-drafts/{id}/publish` | Publicar el informe: versión inmutable, PDF oficial y liberación | ALTO | 43 | sesión (sin roles) |
| 45 | POST | `/diagnostics/report-drafts/{id}/signature-request` | Pedir al firmante elegido que revise y publique con su firma | ALTO | 17 | sesión (sin roles) |
| 46 | GET | `/diagnostics/report-drafts/signers` | Profesionales que pueden firmar informes | BAJO | 5 | sesión (sin roles) |
| 47 | GET | `/diagnostics/report-issuer-settings` | Firma, sello y responsable de los informes | BAJO | 2 | sesión (sin roles) |
| 48 | PUT | `/diagnostics/report-issuer-settings` | Cambiar firma, sello y responsable (OWNER/ADMIN) | ALTO | 3 | sesión (sin roles) |
| 49 | POST | `/diagnostics/reports/{reportId}/patient-release` | Liberar al paciente un resultado retenido | MEDIO | 18 | CLINICIAN, PRACTITIONER |
| 50 | POST | `/diagnostics/reports/{reportId}/versions` | Crear/enmendar versión de informe diagnóstico | MEDIO | 8 | CLINICIAN, PRACTITIONER |
| 51 | POST | `/diagnostics/reports/{reportId}/versions/{versionId}/release` | Validar y liberar una versión del informe | MEDIO | 6 | CLINICIAN, PRACTITIONER |
| 52 | POST | `/diagnostics/results/{observationId}/verifications` | Verificar (técnica/facultativa) un resultado | ALTO | 3 | sesión (sin roles) |
| 53 | GET | `/diagnostics/service-requests/{id}` | Detalle de una orden dirigida al tenant activo | BAJO | 11 | sesión (sin roles) |
| 54 | POST | `/diagnostics/service-requests/inbox` | Bandeja de órdenes de laboratorio por recibir | BAJO | 12 | sesión (sin roles) |
| 55 | POST | `/diagnostics/service-requests/worklist` | Bandeja del ejecutor: órdenes de laboratorio o imagen con estado derivado | BAJO | 11 | sesión (sin roles) |
| 56 | POST | `/diagnostics/specimens` | Registrar un espécimen (soporte para acesión) | ALTO | 4 | sesión (sin roles) |
| 57 | GET | `/diagnostics/specimens/{id}` | Detalle de un espécimen (con su cadena de custodia) | BAJO | 3 | sesión (sin roles) |
| 58 | POST | `/diagnostics/specimens/{id}/containers` | Registrar un contenedor de espécimen (soporte para custodia) | ALTO | 3 | sesión (sin roles) |
| 59 | POST | `/diagnostics/specimens/{id}/rejection` | Rechazar espécimen y solicitar recolección | ALTO | 5 | sesión (sin roles) |
| 60 | GET | `/diagnostics/work-orders` | Listar las órdenes de trabajo del laboratorio | BAJO | 6 | sesión (sin roles) |
| 61 | POST | `/diagnostics/work-orders` | Abrir orden de trabajo y desglosar pruebas | ALTO | 6 | sesión (sin roles) |
| 62 | POST | `/dicomweb/studies` | Ingestar estudio DICOM (STOW-RS) y ubicaciones de objeto | MEDIO | 8 | CLINICIAN, PRACTITIONER |
| 63 | GET | `/public/diagnostic-reports/{versionId}/verify` | Verificar la autenticidad de un informe diagnóstico | BAJO | 5 | pública |

---

## 1. GET /diagnostic-results/me

- **Origen:** CONTRATO
- **Nombre:** Resultados de laboratorio, informes e imagen del titular
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsPatientResultsController.listOwnResults` — `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:82`

### Qué es y para qué sirve (negocio)

Resultados de laboratorio, informes e imagen del titular. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-results/me` la atiende `DiagnosticsPatientResultsController.listOwnResults` (src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:82). Exige sesión con alguno de los roles PATIENT. Delega en `DiagnosticsPatientResultsService.listOwnResults`. Lee clinical.diagnostic_reports, diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_results, diagnostics.diagnostic_report_versions, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:82` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResults → DiagnosticsPatientResultsService.listOwnResults → DiagnosticOrdersRepository.findReportsForPatientPortal | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:111` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResults → DiagnosticsPatientResultsService.listOwnResults → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findReleaseEventsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:444` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResults → DiagnosticsPatientResultsService.listOwnResults → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_results` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResults → DiagnosticsPatientResultsService.listOwnResults → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findResultsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:490` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResults → DiagnosticsPatientResultsService.listOwnResults → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResults → DiagnosticsPatientResultsService.listOwnResults → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:102` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResults → DiagnosticsPatientResultsService.listOwnResults → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | Tope de informes considerados (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientDiagnosticResultsResponseDto>` · DTO `PatientDiagnosticResultsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | — | Paciente leído. | `src/modules/diagnostics/dto/patient-results.dto.ts:81` |
| `items` | `array<PatientDiagnosticResultDto>` | Sí | — | — | Resultados liberados, del más nuevo al más viejo. | `src/modules/diagnostics/dto/patient-results.dto.ts:85` |
| `items[].reportId` | `string` | Sí | formato uuid | — | Informe (`clinical.diagnostic_reports`). | `src/modules/diagnostics/dto/patient-results.dto.ts:31` |
| `items[].versionId` | `string` | Sí | formato uuid | — | Versión liberada que se está mostrando. | `src/modules/diagnostics/dto/patient-results.dto.ts:34` |
| `items[].versionNumber` | `number` | Sí | — | — | Número de esa versión; una enmienda posterior tiene un número mayor. | `src/modules/diagnostics/dto/patient-results.dto.ts:37` |
| `items[].serviceRequestId` | `string` | No | formato uuid | — | Orden que lo originó, si cuelga de una. | `src/modules/diagnostics/dto/patient-results.dto.ts:40` |
| `items[].codeConceptId` | `string` | Sí | formato uuid | — | Qué informa (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:43` |
| `items[].categoryConceptId` | `string` | No | formato uuid | — | Laboratorio o imagenología (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:46` |
| `items[].custodianTenantId` | `string` | Sí | formato uuid | — | Organización que lo emitió y lo custodia. | `src/modules/diagnostics/dto/patient-results.dto.ts:49` |
| `items[].conclusionText` | `string` | No | — | — | Conclusión firmada, si la versión la trae. | `src/modules/diagnostics/dto/patient-results.dto.ts:52` |
| `items[].issuedAt` | `string` | No | formato date-time | — | Cuándo se emitió la versión. | `src/modules/diagnostics/dto/patient-results.dto.ts:55` |
| `items[].releasedAt` | `string` | Sí | formato date-time | — | Cuándo se liberó al paciente. | `src/modules/diagnostics/dto/patient-results.dto.ts:58` |
| `items[].clinicalStatusConceptId` | `string` | Sí | formato uuid | — | Estado clínico de la versión (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:61` |
| `items[].observationIds` | `array<string>` | Sí | formato uuid | — | Observaciones enlazadas a la versión. | `src/modules/diagnostics/dto/patient-results.dto.ts:65` |
| `items[].files` | `array<DiagnosticResultFileDto>` | Sí | — | — | Archivos descargables de la versión. | `src/modules/diagnostics/dto/patient-results.dto.ts:69` |
| `items[].files[].id` | `string` | Sí | formato uuid | — | Identificador del enlace informe↔archivo. | `src/modules/diagnostics/dto/patient-result-file.dto.ts:18` |
| `items[].files[].fileId` | `string` | Sí | formato uuid | — | Archivo en `common.files`; se descarga por `/common/files/{id}/content`. | `src/modules/diagnostics/dto/patient-result-file.dto.ts:21` |
| `items[].files[].contentRoleConceptId` | `string` | Sí | formato uuid | — | Qué es el archivo dentro del informe (concept id). | `src/modules/diagnostics/dto/patient-result-file.dto.ts:24` |
| `items[].files[].role` | `string` | Sí | valores: OFFICIAL, ANNEX | — | The same content role without UUIDs: `OFFICIAL` is the signed PDF of a published report, `ANNEX` one of its annexes, `null` any other file. | `src/modules/diagnostics/dto/patient-result-file.dto.ts:31` |
| `items[].files[].presentationFormatConceptId` | `string` | No | formato uuid | — | Formato de presentación (concept id), si se declaró. | `src/modules/diagnostics/dto/patient-result-file.dto.ts:35` |
| `items[].files[].ordinal` | `number` | No | — | — | Posición dentro del informe. | `src/modules/diagnostics/dto/patient-result-file.dto.ts:38` |
| `limit` | `number` | Sí | — | — | Tope aplicado. | `src/modules/diagnostics/dto/patient-results.dto.ts:88` |
| `truncated` | `boolean` | Sí | — | — | La lista quedó recortada por el tope. | `src/modules/diagnostics/dto/patient-results.dto.ts:91` |

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
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:100` |
| INTEGRACION | `test/integration/report-drafts.int-spec.ts:279` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsPatientResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /diagnostic-results/me/{reportId}

- **Origen:** CONTRATO
- **Nombre:** Un resultado del titular, con sus archivos
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsPatientResultsController.getOwnResult` — `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:144`

### Qué es y para qué sirve (negocio)

Un resultado del titular, con sus archivos. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-results/me/{reportId}` la atiende `DiagnosticsPatientResultsController.getOwnResult` (src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:144). Exige sesión con alguno de los roles PATIENT. Delega en `DiagnosticsPatientResultsService.getOwnResult`. Lee clinical.diagnostic_reports, diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_results, diagnostics.diagnostic_report_versions, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:144` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: reportId | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:144` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResult → DiagnosticsPatientResultsService.getOwnResult → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticOrdersRepository.findReportById | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:235` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResult → DiagnosticsPatientResultsService.getOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findReleaseEventsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:444` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResult → DiagnosticsPatientResultsService.getOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_results` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResult → DiagnosticsPatientResultsService.getOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findResultsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:490` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResult → DiagnosticsPatientResultsService.getOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResult → DiagnosticsPatientResultsService.getOwnResult → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:102` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResult → DiagnosticsPatientResultsService.getOwnResult → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `reportId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientDiagnosticResultDto>` · DTO `PatientDiagnosticResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reportId` | `string` | Sí | formato uuid | — | Informe (`clinical.diagnostic_reports`). | `src/modules/diagnostics/dto/patient-results.dto.ts:31` |
| `versionId` | `string` | Sí | formato uuid | — | Versión liberada que se está mostrando. | `src/modules/diagnostics/dto/patient-results.dto.ts:34` |
| `versionNumber` | `number` | Sí | — | — | Número de esa versión; una enmienda posterior tiene un número mayor. | `src/modules/diagnostics/dto/patient-results.dto.ts:37` |
| `serviceRequestId` | `string` | No | formato uuid | — | Orden que lo originó, si cuelga de una. | `src/modules/diagnostics/dto/patient-results.dto.ts:40` |
| `codeConceptId` | `string` | Sí | formato uuid | — | Qué informa (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:43` |
| `categoryConceptId` | `string` | No | formato uuid | — | Laboratorio o imagenología (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:46` |
| `custodianTenantId` | `string` | Sí | formato uuid | — | Organización que lo emitió y lo custodia. | `src/modules/diagnostics/dto/patient-results.dto.ts:49` |
| `conclusionText` | `string` | No | — | — | Conclusión firmada, si la versión la trae. | `src/modules/diagnostics/dto/patient-results.dto.ts:52` |
| `issuedAt` | `string` | No | formato date-time | — | Cuándo se emitió la versión. | `src/modules/diagnostics/dto/patient-results.dto.ts:55` |
| `releasedAt` | `string` | Sí | formato date-time | — | Cuándo se liberó al paciente. | `src/modules/diagnostics/dto/patient-results.dto.ts:58` |
| `clinicalStatusConceptId` | `string` | Sí | formato uuid | — | Estado clínico de la versión (concept id). | `src/modules/diagnostics/dto/patient-results.dto.ts:61` |
| `observationIds` | `array<string>` | Sí | formato uuid | — | Observaciones enlazadas a la versión. | `src/modules/diagnostics/dto/patient-results.dto.ts:65` |
| `files` | `array<DiagnosticResultFileDto>` | Sí | — | — | Archivos descargables de la versión. | `src/modules/diagnostics/dto/patient-results.dto.ts:69` |
| `files[].id` | `string` | Sí | formato uuid | — | Identificador del enlace informe↔archivo. | `src/modules/diagnostics/dto/patient-result-file.dto.ts:18` |
| `files[].fileId` | `string` | Sí | formato uuid | — | Archivo en `common.files`; se descarga por `/common/files/{id}/content`. | `src/modules/diagnostics/dto/patient-result-file.dto.ts:21` |
| `files[].contentRoleConceptId` | `string` | Sí | formato uuid | — | Qué es el archivo dentro del informe (concept id). | `src/modules/diagnostics/dto/patient-result-file.dto.ts:24` |
| `files[].role` | `string` | Sí | valores: OFFICIAL, ANNEX | — | The same content role without UUIDs: `OFFICIAL` is the signed PDF of a published report, `ANNEX` one of its annexes, `null` any other file. | `src/modules/diagnostics/dto/patient-result-file.dto.ts:31` |
| `files[].presentationFormatConceptId` | `string` | No | formato uuid | — | Formato de presentación (concept id), si se declaró. | `src/modules/diagnostics/dto/patient-result-file.dto.ts:35` |
| `files[].ordinal` | `number` | No | — | — | Posición dentro del informe. | `src/modules/diagnostics/dto/patient-result-file.dto.ts:38` |

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

## 3. GET /diagnostic-results/me/{reportId}/files/{fileId}/content

- **Origen:** CONTRATO
- **Nombre:** Descargar un archivo de un resultado del titular
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsPatientResultsController.getOwnResultFileContent` — `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:173`

### Qué es y para qué sirve (negocio)

Descargar un archivo de un resultado del titular. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-results/me/{reportId}/files/{fileId}/content` la atiende `DiagnosticsPatientResultsController.getOwnResultFileContent` (src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:173). Exige sesión con alguno de los roles PATIENT. Delega en `DiagnosticsPatientResultsService.getOwnResultFileContent`. Lee clinical.diagnostic_reports, common.file_versions, common.files, diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_results, diagnostics.diagnostic_report_versions, profiles.patient_profiles y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:173` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: reportId, fileId | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:173` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResultFileContent → DiagnosticsPatientResultsService.getOwnResultFileContent → DiagnosticOrdersRepository.findReportById | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:235` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResultFileContent → DiagnosticsPatientResultsService.getOwnResultFileContent → FileUploadService.downloadForAuthorizedContext → FileUploadService.serveCurrentVersion → AttachableFileService.assertUsableForAuthorizedContext → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResultFileContent → DiagnosticsPatientResultsService.getOwnResultFileContent → FileUploadService.downloadForAuthorizedContext → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResultFileContent → DiagnosticsPatientResultsService.getOwnResultFileContent → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findReleaseEventsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:444` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResultFileContent → DiagnosticsPatientResultsService.getOwnResultFileContent → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_results` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResultFileContent → DiagnosticsPatientResultsService.getOwnResultFileContent → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findResultsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:490` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResultFileContent → DiagnosticsPatientResultsService.getOwnResultFileContent → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResultFileContent → DiagnosticsPatientResultsService.getOwnResultFileContent → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:102` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.getOwnResultFileContent → DiagnosticsPatientResultsService.getOwnResultFileContent → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `reportId` | path | Sí | `string` | — |
| `fileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: {labels.notFound}; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente; PreconditionFailedException: La descarga de archivos no está disponible |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: S3 object body is empty |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/report-drafts.int-spec.ts:292` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsPatientResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /diagnostic-results/me/{reportId}/shares

- **Origen:** CONTRATO
- **Nombre:** Con quién está compartido un resultado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsPatientResultsController.listOwnResultShares` — `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:247`

### Qué es y para qué sirve (negocio)

Con quién está compartido un resultado. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-results/me/{reportId}/shares` la atiende `DiagnosticsPatientResultsController.listOwnResultShares` (src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:247). Exige sesión con alguno de los roles PATIENT. Delega en `DiagnosticsPatientResultsService.listOwnResultShares`. Lee authz.resource_scope_grants, clinical.diagnostic_reports, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:247` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: reportId | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:247` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResultShares → DiagnosticsPatientResultsService.listOwnResultShares → ResourceScopeGrantsRepository.findForResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:94` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResultShares → DiagnosticsPatientResultsService.listOwnResultShares → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticOrdersRepository.findReportById | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:235` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResultShares → DiagnosticsPatientResultsService.listOwnResultShares → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:102` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnResultShares → DiagnosticsPatientResultsService.listOwnResultShares → DiagnosticsPatientResultsService.namesByUserId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `reportId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DiagnosticResultSharesResponseDto>` · DTO `DiagnosticResultSharesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reportId` | `string` | Sí | formato uuid | — | Informe consultado. | `src/modules/diagnostics/dto/patient-results.dto.ts:324` |
| `items` | `array<DiagnosticResultShareDto>` | Sí | — | — | Los compartidos, del más nuevo al más viejo. | `src/modules/diagnostics/dto/patient-results.dto.ts:328` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del grant. | `src/modules/diagnostics/dto/patient-results.dto.ts:297` |
| `items[].reportId` | `string` | Sí | formato uuid | — | Informe compartido. | `src/modules/diagnostics/dto/patient-results.dto.ts:300` |
| `items[].practitionerUserId` | `string` | Sí | formato uuid | — | Cuenta del profesional con quien se compartió. | `src/modules/diagnostics/dto/patient-results.dto.ts:303` |
| `items[].practitionerName` | `string` | No | — | — | Nombre del profesional, para que «Compartido con» no muestre un uuid. Ausente si la cuenta perdió su vínculo con la persona. | `src/modules/diagnostics/dto/patient-results.dto.ts:309` |
| `items[].validFrom` | `string` | Sí | formato date-time | — | Desde cuándo vale. | `src/modules/diagnostics/dto/patient-results.dto.ts:312` |
| `items[].validTo` | `string` | No | formato date-time | — | Hasta cuándo vale. | `src/modules/diagnostics/dto/patient-results.dto.ts:315` |
| `items[].active` | `boolean` | Sí | — | — | Si el grant está vigente en este momento. | `src/modules/diagnostics/dto/patient-results.dto.ts:318` |

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

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:307` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsPatientResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /diagnostic-results/me/{reportId}/shares

- **Origen:** CONTRATO
- **Nombre:** Compartir temporalmente un resultado con un profesional
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsPatientResultsController.shareOwnResult` — `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:220`

### Qué es y para qué sirve (negocio)

Compartir temporalmente un resultado con un profesional. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-results/me/{reportId}/shares` la atiende `DiagnosticsPatientResultsController.shareOwnResult` (src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:220). Exige sesión con alguno de los roles PATIENT. Valida el cuerpo como `ShareDiagnosticResultDto` (2 campos, 2 obligatorios). Delega en `DiagnosticsPatientResultsService.shareOwnResult`. Crea filas en authz.resource_scope_grants. Actualiza authz.resource_scope_grants. Lee authz.care_relationships, authz.resource_scope_grants, clinical.diagnostic_reports, diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_results, diagnostics.diagnostic_report_versions, profiles.patient_profiles y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:220` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: reportId | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:220` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.care_relationships` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → CareRelationshipsRepository.findActive | `src/modules/authz/repositories/care-relationships.repository.ts:69` |
| `authz.resource_scope_grants` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult | `src/modules/diagnostics/services/diagnostics-patient-results.service.ts:552` |
| `authz.resource_scope_grants` | ESCRIBE | CREA | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → ResourceScopeGrantsRepository.create | `src/modules/authz/repositories/resource-scope-grants.repository.ts:132` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → ResourceScopeGrantsRepository.findExisting | `src/modules/authz/repositories/resource-scope-grants.repository.ts:60` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticOrdersRepository.findReportById | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:235` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findReleaseEventsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:444` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_results` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findResultsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:490` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:102` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.shareOwnResult → DiagnosticsPatientResultsService.shareOwnResult → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `reportId` | path | Sí | `string` | — |

### Cuerpo — DTO `ShareDiagnosticResultDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/diagnostics/dto/patient-results.dto.ts:285` |
| `validUntil` | `string` | Sí | formato date-time | `@Type(() => Date)` `@IsDate()` | — | `src/modules/diagnostics/dto/patient-results.dto.ts:291` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "validUntil": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "validUntil": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<DiagnosticResultShareDto>` · DTO `DiagnosticResultShareDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del grant. | `src/modules/diagnostics/dto/patient-results.dto.ts:297` |
| `reportId` | `string` | Sí | formato uuid | — | Informe compartido. | `src/modules/diagnostics/dto/patient-results.dto.ts:300` |
| `practitionerUserId` | `string` | Sí | formato uuid | — | Cuenta del profesional con quien se compartió. | `src/modules/diagnostics/dto/patient-results.dto.ts:303` |
| `practitionerName` | `string` | No | — | — | Nombre del profesional, para que «Compartido con» no muestre un uuid. Ausente si la cuenta perdió su vínculo con la persona. | `src/modules/diagnostics/dto/patient-results.dto.ts:309` |
| `validFrom` | `string` | Sí | formato date-time | — | Desde cuándo vale. | `src/modules/diagnostics/dto/patient-results.dto.ts:312` |
| `validTo` | `string` | No | formato date-time | — | Hasta cuándo vale. | `src/modules/diagnostics/dto/patient-results.dto.ts:315` |
| `active` | `boolean` | Sí | — | — | Si el grant está vigente en este momento. | `src/modules/diagnostics/dto/patient-results.dto.ts:318` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: El informe no pertenece a esta cuenta |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Informe no encontrado; ResourceNotFoundException: El profesional no tiene una cuenta activa en el portal |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El vencimiento del acceso compartido tiene que ser futuro; PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil de paciente; PreconditionFailedException: El profesional no tiene una relación asistencial vigente con este paciente; PreconditionFailedException: No hace falta compartirse un resultado con uno mismo; PreconditionFailedException: Sólo se puede compartir un resultado ya liberado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:249` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsPatientResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /diagnostic-results/me/{reportId}/shares/{shareId}/revoke

- **Origen:** CONTRATO
- **Nombre:** Dejar de compartir un resultado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsPatientResultsController.revokeOwnResultShare` — `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:273`

### Qué es y para qué sirve (negocio)

Dejar de compartir un resultado. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostic-results/me/{reportId}/shares/{shareId}/revoke` la atiende `DiagnosticsPatientResultsController.revokeOwnResultShare` (src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:273). Exige sesión con alguno de los roles PATIENT. Delega en `DiagnosticsPatientResultsService.revokeOwnResultShare`. Actualiza authz.resource_scope_grants. Lee authz.resource_scope_grants, clinical.diagnostic_reports, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:273` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: reportId, shareId | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:273` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.resource_scope_grants` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsPatientResultsController.revokeOwnResultShare → DiagnosticsPatientResultsService.revokeOwnResultShare | `src/modules/diagnostics/services/diagnostics-patient-results.service.ts:687` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.revokeOwnResultShare → DiagnosticsPatientResultsService.revokeOwnResultShare → ResourceScopeGrantsRepository.findByIdForResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:118` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.revokeOwnResultShare → DiagnosticsPatientResultsService.revokeOwnResultShare → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticOrdersRepository.findReportById | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:235` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.revokeOwnResultShare → DiagnosticsPatientResultsService.revokeOwnResultShare → DiagnosticsPatientResultsService.requireOwnReport → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:102` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.revokeOwnResultShare → DiagnosticsPatientResultsService.revokeOwnResultShare → DiagnosticsPatientResultsService.namesByUserId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador del grant. | `src/modules/diagnostics/dto/patient-results.dto.ts:297` |
| `reportId` | `string` | Sí | formato uuid | — | Informe compartido. | `src/modules/diagnostics/dto/patient-results.dto.ts:300` |
| `practitionerUserId` | `string` | Sí | formato uuid | — | Cuenta del profesional con quien se compartió. | `src/modules/diagnostics/dto/patient-results.dto.ts:303` |
| `practitionerName` | `string` | No | — | — | Nombre del profesional, para que «Compartido con» no muestre un uuid. Ausente si la cuenta perdió su vínculo con la persona. | `src/modules/diagnostics/dto/patient-results.dto.ts:309` |
| `validFrom` | `string` | Sí | formato date-time | — | Desde cuándo vale. | `src/modules/diagnostics/dto/patient-results.dto.ts:312` |
| `validTo` | `string` | No | formato date-time | — | Hasta cuándo vale. | `src/modules/diagnostics/dto/patient-results.dto.ts:315` |
| `active` | `boolean` | Sí | — | — | Si el grant está vigente en este momento. | `src/modules/diagnostics/dto/patient-results.dto.ts:318` |

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

## 7. GET /diagnostic-results/me/orders

- **Origen:** CONTRATO
- **Nombre:** Órdenes de laboratorio e imagen del titular
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsPatientResultsController.listOwnOrders` — `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:116`

### Qué es y para qué sirve (negocio)

Órdenes de laboratorio e imagen del titular. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostic-results/me/orders` la atiende `DiagnosticsPatientResultsController.listOwnOrders` (src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:116). Exige sesión con alguno de los roles PATIENT. Delega en `DiagnosticsPatientResultsService.listOwnOrders`. Lee clinical.diagnostic_reports, clinical.service_request_components, clinical.service_requests, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_units, diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_results y 21 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/diagnostics/controllers/diagnostics-patient-results.controller.ts:116` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.releasedReportByOrder → DiagnosticOrdersRepository.findReportsByServiceRequests | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:172` |
| `clinical.service_request_components` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → ServiceRequestDetailService.describe → ServiceRequestDetailService.loadComponents | `src/modules/clinical/services/service-request-detail.service.ts:462` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticOrdersRepository.findOrdersForPatientPortal | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:143` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:137` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → LinkedClaimOrderService.loadSnapshots → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findDiagnosticUnits | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:139` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.releasedReportByOrder → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findReleaseEventsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:444` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.releasedReportByOrder → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_results` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.releasedReportByOrder → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findResultsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:490` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.releasedReportByOrder → DiagnosticsPatientResultsService.projectReleasedResults → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `insurance.claim_adjudication_versions` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:97` |
| `insurance.claim_line_adjudications` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:116` |
| `insurance.claim_reversals` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:104` |
| `insurance.insurance_carriers` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:110` |
| `insurance.insurance_claim_lines` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:96` |
| `insurance.insurance_claims` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:86` |
| `insurance.insurance_plans` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:105` |
| `insurance.insurance_products` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:121` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:84` |
| `insurance.patient_explanations_of_benefit` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:100` |
| `pharmacy_inventory.inventory_reservation_lines` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:132` |
| `pharmacy_inventory.inventory_reservations` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.ownedOrders | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:43` |
| `pharmacy_inventory.pharmacy_order_substitutions` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → LinkedClaimOrderService.loadSnapshots → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findProposedSubstitutions | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:111` |
| `pharmacy.pharmacies` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → LinkedClaimOrderService.loadSnapshots → LinkedClaimOrderService.resolveBatch → LinkedOrderDataRepository.findPharmacies | `src/modules/insurance/infrastructure/repositories/linked-order-data.repository.ts:146` |
| `pharmacy.pharmacy_products` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.load | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:143` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → SuggestedSiteNamesReader.namesFor | `src/modules/clinical/services/suggested-site-names.reader.ts:31` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:102` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → DiagnosticsPatientResultsService.resolveOwnPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → PatientSettlementService.forOrders → PatientSettlementRepository.ownedOrders | `src/modules/insurance/infrastructure/repositories/patient-settlement.repository.ts:63` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | DiagnosticsPatientResultsController.listOwnOrders → DiagnosticsPatientResultsService.listOwnOrders → ServiceRequestDetailService.describe → ServiceRequestDetailService.displays → ConceptDesignationsRepository.findPreferredByLanguageForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:176` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | Tope de órdenes (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientOwnOrdersResponseDto>` · DTO `PatientOwnOrdersResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:236` |
| `items` | `array<PatientOrderSummaryDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:240` |
| `items[].modalityConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:184` |
| `items[].modalityDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:186` |
| `items[].bodySiteConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:188` |
| `items[].bodySiteDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:190` |
| `items[].lateralityConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:192` |
| `items[].lateralityDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:194` |
| `items[].bodyStructureUberon` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:196` |
| `items[].bodyMeshId` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:198` |
| `items[].boneTypeConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:200` |
| `items[].boneTypeDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:202` |
| `items[].insuranceSettlement` | `PatientInsuranceSettlementDto` | Sí | admite null | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:119` |
| `items[].insuranceSettlement.claimId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `items[].insuranceSettlement.claimIdentifier` | `string` | Sí | — | — | — | sin fuente |
| `items[].insuranceSettlement.adjudicationVersionId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `items[].insuranceSettlement.adjudicationVersion` | `number` | Sí | formato int32; mínimo 1 | — | — | sin fuente |
| `items[].insuranceSettlement.eobId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `items[].insuranceSettlement.carrierName` | `string` | Sí | — | — | — | sin fuente |
| `items[].insuranceSettlement.policyIdentifier` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].insuranceSettlement.totalBilledAmount` | `string` | Sí | — | — | Total facturado, decimal exacto | sin fuente |
| `items[].insuranceSettlement.totalApprovedAmount` | `string` | Sí | — | — | Aporte del seguro, decimal exacto | sin fuente |
| `items[].insuranceSettlement.totalPatientAmount` | `string` | Sí | — | — | Cargo confirmado al paciente, decimal exacto | sin fuente |
| `items[].insuranceSettlement.totalDeniedAmount` | `string` | Sí | — | — | Importe excluido sin asignar, decimal exacto | sin fuente |
| `items[].insuranceSettlement.currencyCode` | `string` | Sí | — | — | — | sin fuente |
| `items[].insuranceSettlement.result` | `string` | Sí | valores: APPROVED, PARTIALLY_APPROVED, DENIED | — | — | sin fuente |
| `items[].insuranceSettlement.exclusions` | `array<PatientInsuranceSettlementExclusionDto>` | Sí | — | — | — | sin fuente |
| `items[].insuranceSettlement.exclusions[].claimLineId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `items[].insuranceSettlement.exclusions[].itemId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `items[].insuranceSettlement.exclusions[].itemName` | `string` | Sí | — | — | — | sin fuente |
| `items[].insuranceSettlement.exclusions[].amount` | `string` | Sí | — | — | Importe decimal exacto excluido | sin fuente |
| `items[].insuranceSettlement.exclusions[].policyClauseReference` | `string` | Sí | — | — | — | sin fuente |
| `items[].insuranceSettlement.exclusions[].denialRationale` | `string` | Sí | admite null | — | — | sin fuente |
| `items[].insuranceSettlementAvailability` | `string` | Sí | valores: AVAILABLE, PENDING_PUBLICATION, UNDER_REVIEW, NOT_AVAILABLE | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:124` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:127` |
| `items[].requisitionId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:131` |
| `items[].codeDisplay` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:135` |
| `items[].specimenTypeConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:139` |
| `items[].specimenTypeDisplay` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:143` |
| `items[].components` | `array<ServiceRequestComponentDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:147` |
| `items[].components[].conceptId` | `string` | Sí | formato uuid | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:139` |
| `items[].components[].display` | `string` | Sí | — | — | Nombre legible (castellano si existe) | `src/modules/clinical/dto/service-request-detail.dto.ts:142` |
| `items[].components[].ordinal` | `number` | Sí | — | — | Posición, desde 1, en el orden en que se marcó | `src/modules/clinical/dto/service-request-detail.dto.ts:147` |
| `items[].componentsSpecified` | `boolean` | Sí | — | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:150` |
| `items[].imaging` | `ServiceRequestImagingDto` | Sí | admite null | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:154` |
| `items[].imaging.modalityConceptId` | `string` | No | formato uuid; admite null | — | — | sin fuente |
| `items[].imaging.modalityDisplay` | `string` | No | admite null | — | — | sin fuente |
| `items[].imaging.bodySiteConceptId` | `string` | No | formato uuid; admite null | — | — | sin fuente |
| `items[].imaging.bodySiteDisplay` | `string` | No | admite null | — | — | sin fuente |
| `items[].imaging.lateralityConceptId` | `string` | No | formato uuid; admite null | — | — | sin fuente |
| `items[].imaging.lateralityDisplay` | `string` | No | admite null | — | — | sin fuente |
| `items[].imaging.contrastConceptId` | `string` | No | formato uuid; admite null | — | — | sin fuente |
| `items[].imaging.contrastDisplay` | `string` | No | admite null | — | — | sin fuente |
| `items[].imaging.bodyStructureUberon` | `string` | No | admite null | — | — | sin fuente |
| `items[].imaging.bodyMeshId` | `string` | No | admite null | — | — | sin fuente |
| `items[].imaging.boneTypeConceptId` | `string` | No | formato uuid; admite null | — | — | sin fuente |
| `items[].imaging.boneTypeDisplay` | `string` | No | admite null | — | — | sin fuente |
| `items[].summary` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:157` |
| `items[].encounterId` | `string` | No | formato uuid | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:160` |
| `items[].reasonConditionId` | `string` | No | formato uuid | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:167` |
| `items[].codeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:170` |
| `items[].categoryConceptId` | `string` | No | formato uuid | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:173` |
| `items[].category` | `string` | No | valores: LAB, IMAGING, OTHER | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:181` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:184` |
| `items[].priorityConceptId` | `string` | No | formato uuid | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:187` |
| `items[].performerSelectionConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:195` |
| `items[].performerPractitionerProfileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:199` |
| `items[].suggestedPracticeSiteId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:203` |
| `items[].suggestedPracticeSiteName` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:207` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:210` |
| `items[].preparationInstructions` | `string` | No | — | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:220` |
| `items[].hasReleasedResult` | `boolean` | Sí | — | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:223` |
| `items[].reportId` | `string` | No | formato uuid | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:226` |
| `limit` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:243` |
| `truncated` | `boolean` | Sí | — | — | — | `src/modules/diagnostics/dto/patient-results.dto.ts:246` |

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
| INTEGRACION | `test/integration/hardening/mch-027.int-spec.ts:207` |
| INTEGRACION | `test/integration/lab-portal-order-intake.int-spec.ts:101` |
| INTEGRACION | `test/integration/lab-reception-inbox.int-spec.ts:150` |
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:920` |
| INTEGRACION | `test/integration/patient-coverage-copays.int-spec.ts:153` |
| INTEGRACION | `test/integration/patient-diagnostic-orders.int-spec.ts:75` |
| INTEGRACION | `test/integration/report-drafts.int-spec.ts:145` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsPatientResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /diagnostics/accessions

- **Origen:** CONTRATO
- **Nombre:** Acesionar especímenes recibidos en laboratorio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsSpecimensController.accession` — `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:104`

### Qué es y para qué sirve (negocio)

Acesionar especímenes recibidos en laboratorio. Caso de uso UC-20-01: Acesionar especímenes recibidos. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:107`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/accessions` la atiende `DiagnosticsSpecimensController.accession` (src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:104). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateAccessionDto` (6 campos, 2 obligatorios). Delega en `DiagnosticsSpecimensService.accession`. Crea filas en diagnostics.accession_specimens, diagnostics.laboratory_accessions, diagnostics.specimen_chain_of_custody_events. Actualiza diagnostics.specimens. Lee clinical.service_requests, diagnostics.specimens.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.accession → DiagnosticsSpecimensService.accession → DiagnosticsScopeService.serviceRequest → ClinicalRefsRepository.findServiceRequest | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:32` |
| `diagnostics.accession_specimens` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.accession → DiagnosticsSpecimensService.accession → SpecimensRepository.addAccessionSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:352` |
| `diagnostics.laboratory_accessions` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.accession → DiagnosticsSpecimensService.accession → SpecimensRepository.createAccession | `src/modules/diagnostics/repositories/specimens.repository.ts:307` |
| `diagnostics.specimen_chain_of_custody_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.accession → DiagnosticsSpecimensService.accession → SpecimensRepository.recordCustodyEvent | `src/modules/diagnostics/repositories/specimens.repository.ts:407` |
| `diagnostics.specimens` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsSpecimensController.accession → DiagnosticsSpecimensService.accession | `src/modules/diagnostics/services/diagnostics-specimens.service.ts:207` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.accession → DiagnosticsSpecimensService.accession → DiagnosticsScopeService.specimen → SpecimensRepository.findSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:168` |

### Cuerpo — DTO `CreateAccessionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente dueño de la acesión | `src/modules/diagnostics/dto/specimens.dto.ts:110` |
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant custodio: el del contexto (X-Tenant-Id). Si se envía y no coincide, responde 404 | `src/modules/diagnostics/dto/specimens.dto.ts:122` |
| `specimenIds` | `array<string>` | Sí | formato uuid | `@IsArray()` `@ArrayNotEmpty()` `@IsUUID('4', { each: true })` | Especímenes a acesionar | `src/modules/diagnostics/dto/specimens.dto.ts:135` |
| `accessionNumber` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Nº de acesión (se genera si se omite) | `src/modules/diagnostics/dto/specimens.dto.ts:144` |
| `priorityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Prioridad (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:155` |
| `serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/diagnostics/dto/specimens.dto.ts:163` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message}; ResourceNotFoundException: Espécimen no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El espécimen está rechazado y no puede acesionarse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:336` |
| INTEGRACION | `test/integration/lab-reception-inbox.int-spec.ts:258` |
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.spec.ts:46` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-01`

---

## 9. GET /diagnostics/accessions/{id}

- **Origen:** CONTRATO
- **Nombre:** Detalle de una acesión (especímenes, contenedores y custodia)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsSpecimensController.getAccession` — `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:78`

### Qué es y para qué sirve (negocio)

Detalle de una acesión (especímenes, contenedores y custodia). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/accessions/{id}` la atiende `DiagnosticsSpecimensController.getAccession` (src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:78). Exige sesión; el controlador no declara roles. Delega en `DiagnosticsSpecimensService.getAccession`. Lee diagnostics.accession_specimens, diagnostics.laboratory_accessions, diagnostics.specimen_chain_of_custody_events, diagnostics.specimen_containers, diagnostics.specimens.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:78` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:78` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.accession_specimens` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.getAccession → DiagnosticsSpecimensService.getAccession → SpecimensRepository.findAccessionSpecimens | `src/modules/diagnostics/repositories/specimens.repository.ts:217` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.getAccession → DiagnosticsSpecimensService.getAccession → SpecimensRepository.findAccessionForTenant | `src/modules/diagnostics/repositories/specimens.repository.ts:209` |
| `diagnostics.specimen_chain_of_custody_events` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.getAccession → DiagnosticsSpecimensService.getAccession → SpecimensRepository.findCustodyEventsBySpecimenIds | `src/modules/diagnostics/repositories/specimens.repository.ts:261` |
| `diagnostics.specimen_containers` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.getAccession → DiagnosticsSpecimensService.getAccession → SpecimensRepository.findContainersBySpecimenIds | `src/modules/diagnostics/repositories/specimens.repository.ts:248` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.getAccession → DiagnosticsSpecimensService.getAccession → SpecimensRepository.findSpecimensByIds | `src/modules/diagnostics/repositories/specimens.repository.ts:239` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AccessionDetailDto>` · DTO `AccessionDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la acesión. | `src/modules/diagnostics/dto/specimens.dto.ts:443` |
| `custodianTenantId` | `string` | Sí | formato uuid | — | Tenant custodio (el laboratorio que la recibió). | `src/modules/diagnostics/dto/specimens.dto.ts:446` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Paciente dueño de la acesión. | `src/modules/diagnostics/dto/specimens.dto.ts:449` |
| `accessionNumber` | `string` | Sí | — | — | Número de acesión. | `src/modules/diagnostics/dto/specimens.dto.ts:452` |
| `receivedAt` | `string` | Sí | formato date-time | — | Cuándo se recibió. | `src/modules/diagnostics/dto/specimens.dto.ts:455` |
| `priorityConceptId` | `string` | Sí | formato uuid | — | Prioridad (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:458` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la acesión (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:461` |
| `specimens` | `array<AccessionSpecimenDetailDto>` | Sí | — | — | Los especímenes acesionados, con su contenedor y su custodia. | `src/modules/diagnostics/dto/specimens.dto.ts:465` |
| `specimens[].accessionSpecimenId` | `string` | Sí | formato uuid | — | Identificador del item de acesión (`accession_specimens`). | `src/modules/diagnostics/dto/specimens.dto.ts:424` |
| `specimens[].sequenceNumber` | `number` | Sí | — | — | Posición dentro de la acesión. | `src/modules/diagnostics/dto/specimens.dto.ts:427` |
| `specimens[].statusConceptId` | `string` | Sí | formato uuid | — | Estado del item dentro de la acesión (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:430` |
| `specimens[].specimen` | `SpecimenDetailDto` | Sí | — | — | El espécimen, con sus contenedores y su custodia. | `src/modules/diagnostics/dto/specimens.dto.ts:433` |
| `specimens[].specimen.id` | `string` | Sí | formato uuid | — | Identificador del espécimen. | `src/modules/diagnostics/dto/specimens.dto.ts:393` |
| `specimens[].specimen.patientProfileId` | `string` | Sí | formato uuid | — | Paciente dueño del espécimen. | `src/modules/diagnostics/dto/specimens.dto.ts:396` |
| `specimens[].specimen.specimenTypeConceptId` | `string` | Sí | formato uuid | — | Tipo de espécimen (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:399` |
| `specimens[].specimen.statusConceptId` | `string` | Sí | formato uuid | — | Estado del espécimen (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:402` |
| `specimens[].specimen.collectedAt` | `string` | No | formato date-time | — | Cuándo se recolectó, si ya ocurrió. | `src/modules/diagnostics/dto/specimens.dto.ts:406` |
| `specimens[].specimen.receivedAt` | `string` | No | formato date-time | — | Cuándo se recibió en el laboratorio, si ya ocurrió. | `src/modules/diagnostics/dto/specimens.dto.ts:410` |
| `specimens[].specimen.containers` | `array<SpecimenContainerDto>` | Sí | — | — | Sus contenedores. | `src/modules/diagnostics/dto/specimens.dto.ts:414` |
| `specimens[].specimen.containers[].id` | `string` | Sí | formato uuid | — | Identificador del contenedor. | `src/modules/diagnostics/dto/specimens.dto.ts:378` |
| `specimens[].specimen.containers[].containerIdentifier` | `string` | Sí | — | — | Identificador físico del contenedor (etiqueta/código). | `src/modules/diagnostics/dto/specimens.dto.ts:381` |
| `specimens[].specimen.containers[].containerTypeConceptId` | `string` | Sí | formato uuid | — | Tipo de contenedor (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:384` |
| `specimens[].specimen.containers[].statusConceptId` | `string` | Sí | formato uuid | — | Estado del contenedor (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:387` |
| `specimens[].specimen.custodyEvents` | `array<SpecimenCustodyEventDto>` | Sí | — | — | Su cadena de custodia, del evento más viejo al más nuevo. | `src/modules/diagnostics/dto/specimens.dto.ts:418` |
| `specimens[].specimen.custodyEvents[].id` | `string` | Sí | formato uuid | — | Identificador del evento. | `src/modules/diagnostics/dto/specimens.dto.ts:351` |
| `specimens[].specimen.custodyEvents[].specimenContainerId` | `string` | No | formato uuid | — | Contenedor al que se refiere el traslado, si el evento fue de un contenedor. | `src/modules/diagnostics/dto/specimens.dto.ts:354` |
| `specimens[].specimen.custodyEvents[].custodyEventTypeConceptId` | `string` | Sí | formato uuid | — | Tipo de evento (concept id): recepción, traslado, almacenamiento, etc. | `src/modules/diagnostics/dto/specimens.dto.ts:357` |
| `specimens[].specimen.custodyEvents[].occurredAt` | `string` | Sí | formato date-time | — | Cuándo ocurrió. | `src/modules/diagnostics/dto/specimens.dto.ts:360` |
| `specimens[].specimen.custodyEvents[].fromPartyTypeConceptId` | `string` | No | formato uuid | — | De qué tipo de parte salió (concept id), si se registró. | `src/modules/diagnostics/dto/specimens.dto.ts:363` |
| `specimens[].specimen.custodyEvents[].toPartyTypeConceptId` | `string` | No | formato uuid | — | A qué tipo de parte llegó (concept id), si se registró. | `src/modules/diagnostics/dto/specimens.dto.ts:366` |
| `specimens[].specimen.custodyEvents[].sealIdentifier` | `string` | No | — | — | Sello de custodia, si se usó uno. | `src/modules/diagnostics/dto/specimens.dto.ts:369` |
| `specimens[].specimen.custodyEvents[].signedByUserId` | `string` | No | formato uuid | — | Quién firmó el evento. | `src/modules/diagnostics/dto/specimens.dto.ts:372` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Acesión no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:346` |
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.spec.ts:89` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsSpecimensController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /diagnostics/analyzer-runs

- **Origen:** CONTRATO
- **Nombre:** Abrir una corrida de analizador (soporte para ingesta)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabController.createAnalyzerRun` — `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:91`

### Qué es y para qué sirve (negocio)

Abrir una corrida de analizador (soporte para ingesta). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/analyzer-runs` la atiende `DiagnosticsLabController.createAnalyzerRun` (src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:91). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateAnalyzerRunDto` (5 campos, 2 obligatorios). Delega en `DiagnosticsLabService.createAnalyzerRun`. Crea filas en diagnostics.analyzer_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:91` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.analyzer_runs` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabController.createAnalyzerRun → DiagnosticsLabService.createAnalyzerRun → LabWorkRepository.createAnalyzerRun | `src/modules/diagnostics/repositories/lab-work.repository.ts:325` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab.controller.spec.ts:39` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /diagnostics/analyzer-runs/{id}/messages

- **Origen:** CONTRATO
- **Nombre:** Ingerir mensaje de resultado de analizador (LIS/HL7/ASTM)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabController.ingestMessage` — `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:109`

### Qué es y para qué sirve (negocio)

Ingerir mensaje de resultado de analizador (LIS/HL7/ASTM). Caso de uso UC-20-05: Ingerir mensaje de resultado (LIS/HL7/ASTM). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:113`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/analyzer-runs/{id}/messages` la atiende `DiagnosticsLabController.ingestMessage` (src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:109). Exige sesión; el controlador no declara roles. Valida el cuerpo como `IngestAnalyzerMessageDto` (6 campos, 1 obligatorio). Delega en `DiagnosticsLabService.ingestMessage`. Crea filas en diagnostics.analyzer_result_messages. Actualiza diagnostics.laboratory_work_order_tests. Lee clinical.observations, common.files, diagnostics.analyzer_result_messages, diagnostics.analyzer_runs, diagnostics.laboratory_work_order_tests, diagnostics.laboratory_work_orders.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:109` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:109` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.observations` | LEE | LEE | DIRECTA | DiagnosticsLabController.ingestMessage → DiagnosticsLabService.ingestMessage → DiagnosticsScopeService.observation → ClinicalRefsRepository.findObservation | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:37` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsLabController.ingestMessage → DiagnosticsLabService.ingestMessage → DiagnosticsScopeService.file → ClinicalRefsRepository.findFile | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:42` |
| `diagnostics.analyzer_result_messages` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabController.ingestMessage → DiagnosticsLabService.ingestMessage → LabWorkRepository.recordMessage | `src/modules/diagnostics/repositories/lab-work.repository.ts:395` |
| `diagnostics.analyzer_result_messages` | LEE | LEE | DIRECTA | DiagnosticsLabController.ingestMessage → DiagnosticsLabService.ingestMessage → LabWorkRepository.findMessageByControlId | `src/modules/diagnostics/repositories/lab-work.repository.ts:347` |
| `diagnostics.analyzer_runs` | LEE | LEE | DIRECTA | DiagnosticsLabController.ingestMessage → DiagnosticsLabService.ingestMessage → LabWorkRepository.findAnalyzerRun | `src/modules/diagnostics/repositories/lab-work.repository.ts:258` |
| `diagnostics.laboratory_work_order_tests` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsLabController.ingestMessage → DiagnosticsLabService.ingestMessage | `src/modules/diagnostics/services/diagnostics-lab.service.ts:265` |
| `diagnostics.laboratory_work_order_tests` | LEE | LEE | DIRECTA | DiagnosticsLabController.ingestMessage → DiagnosticsLabService.ingestMessage → LabWorkRepository.findWorkOrderTest | `src/modules/diagnostics/repositories/lab-work.repository.ts:247` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabController.ingestMessage → DiagnosticsLabService.ingestMessage → LabWorkRepository.findWorkOrder | `src/modules/diagnostics/repositories/lab-work.repository.ts:233` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
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

## 12. POST /diagnostics/clinical-media

- **Origen:** CONTRATO
- **Nombre:** Adjuntar media clínica / imagen al chart
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsImagingController.attachMedia` — `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:128`

### Qué es y para qué sirve (negocio)

Adjuntar media clínica / imagen al chart. Caso de uso UC-20-12: Adjuntar media clínica / imagen. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:121`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/clinical-media` la atiende `DiagnosticsImagingController.attachMedia` (src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:128). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AttachClinicalMediaDto` (16 campos, 2 obligatorios). Delega en `DiagnosticsMediaQualityService.attachMedia`. Crea filas en diagnostics.clinical_media, diagnostics.media_annotations. Lee clinical.diagnostic_reports, clinical.encounters, common.files, diagnostics.clinical_media.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:128` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsImagingController.attachMedia → DiagnosticsMediaQualityService.attachMedia → DiagnosticsScopeService.report → DiagnosticOrdersRepository.findReportById | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:235` |
| `clinical.encounters` | LEE | LEE | DIRECTA | DiagnosticsImagingController.attachMedia → DiagnosticsMediaQualityService.attachMedia → DiagnosticsScopeService.encounter → ClinicalRefsRepository.findEncounter | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:24` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsImagingController.attachMedia → DiagnosticsMediaQualityService.attachMedia → DiagnosticsScopeService.file → ClinicalRefsRepository.findFile | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:42` |
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 409 | `CONFLICT` | ConflictException: El archivo ya está adjunto como media clínica |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.spec.ts:79` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-12`

---

## 13. POST /diagnostics/containers/{id}/custody-events

- **Origen:** CONTRATO
- **Nombre:** Registrar cadena de custodia / traslado de contenedor
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsSpecimensController.custodyEvent` — `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:156`

### Qué es y para qué sirve (negocio)

Registrar cadena de custodia / traslado de contenedor. Caso de uso UC-20-03: Cadena de custodia / traslado. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:110`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/containers/{id}/custody-events` la atiende `DiagnosticsSpecimensController.custodyEvent` (src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:156). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ContainerCustodyEventDto` (9 campos, 1 obligatorio). Delega en `DiagnosticsSpecimensService.recordCustodyEvent`. Crea filas en diagnostics.specimen_chain_of_custody_events, diagnostics.specimen_container_events. Actualiza diagnostics.specimen_containers. Lee diagnostics.specimen_containers, diagnostics.specimens.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:156` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:156` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.specimen_chain_of_custody_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.custodyEvent → DiagnosticsSpecimensService.recordCustodyEvent → SpecimensRepository.recordCustodyEvent | `src/modules/diagnostics/repositories/specimens.repository.ts:407` |
| `diagnostics.specimen_container_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.custodyEvent → DiagnosticsSpecimensService.recordCustodyEvent → SpecimensRepository.recordContainerEvent | `src/modules/diagnostics/repositories/specimens.repository.ts:531` |
| `diagnostics.specimen_containers` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsSpecimensController.custodyEvent → DiagnosticsSpecimensService.recordCustodyEvent | `src/modules/diagnostics/services/diagnostics-specimens.service.ts:358` |
| `diagnostics.specimen_containers` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.custodyEvent → DiagnosticsSpecimensService.recordCustodyEvent → DiagnosticsScopeService.container → SpecimensRepository.findContainer | `src/modules/diagnostics/repositories/specimens.repository.ts:196` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.custodyEvent → DiagnosticsSpecimensService.recordCustodyEvent → DiagnosticsScopeService.container → SpecimensRepository.findSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:168` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ContainerCustodyEventDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `specimenId` | `string` | Sí | formato uuid | `@IsUUID()` | Espécimen asociado al contenedor | `src/modules/diagnostics/dto/specimens.dto.ts:266` |
| `eventTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de evento de contenedor (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:277` |
| `toPartyTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de parte destino (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:288` |
| `toPartyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id de parte destino | `src/modules/diagnostics/dto/specimens.dto.ts:296` |
| `temperatureCelsius` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | Temperatura en °C | `src/modules/diagnostics/dto/specimens.dto.ts:305` |
| `sealIdentifier` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Sello de custodia | `src/modules/diagnostics/dto/specimens.dto.ts:314` |
| `evidenceHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash de evidencia | `src/modules/diagnostics/dto/specimens.dto.ts:323` |
| `destinationStatusConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Estado destino del contenedor (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:334` |
| `notes` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Notas del traslado | `src/modules/diagnostics/dto/specimens.dto.ts:343` |

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
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.spec.ts:76` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-03`

---

## 14. POST /diagnostics/critical-results

- **Origen:** CONTRATO
- **Nombre:** Detectar y notificar un resultado crítico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportsController.detectCritical` — `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:90`

### Qué es y para qué sirve (negocio)

Detectar y notificar un resultado crítico. Caso de uso UC-20-09: Detectar y notificar resultado crítico. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:117`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/critical-results` la atiende `DiagnosticsReportsController.detectCritical` (src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:90). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `DetectCriticalResultDto` (7 campos, 2 obligatorios). Delega en `CriticalResultDetectionService.detect`. Crea filas en diagnostics.critical_result_notifications, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza messaging.in_app_notifications. Lee clinical.diagnostic_reports, clinical.encounters, clinical.observations, clinical.service_requests, diagnostics.critical_result_notifications, directory.tenant_memberships, messaging.in_app_notifications, messaging.message_channels y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → DiagnosticsReportsService.detectCritical → DiagnosticsScopeService.report → DiagnosticOrdersRepository.findReportById | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:235` |
| `clinical.encounters` | LEE | LEE | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → CriticalResultDetectionService.notifyResponsible → CriticalResultDetectionService.responsibleOf → ClinicalRefsRepository.findEncounter | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:24` |
| `clinical.observations` | LEE | LEE | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → DiagnosticsReportsService.detectCritical → DiagnosticsScopeService.observation → ClinicalRefsRepository.findObservation | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:37` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → CriticalResultDetectionService.notifyResponsible → CriticalResultDetectionService.responsibleOf → ClinicalRefsRepository.findServiceRequest | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:32` |
| `diagnostics.critical_result_notifications` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → DiagnosticsReportsService.detectCritical → ReportsRepository.createCriticalNotification | `src/modules/diagnostics/repositories/reports.repository.ts:368` |
| `diagnostics.critical_result_notifications` | LEE | LEE | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → DiagnosticsReportsService.detectCritical → ReportsRepository.criticalExistsForObservation | `src/modules/diagnostics/repositories/reports.repository.ts:391` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → CriticalResultDetectionService.notifyResponsible → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsRepository.listActiveTenantIds | `src/modules/messaging/repositories/notifications.repository.ts:867` |
| `messaging.in_app_notifications` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → CriticalResultDetectionService.notifyResponsible → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp | `src/modules/messaging/services/notifications.service.ts:1449` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → CriticalResultDetectionService.notifyResponsible → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:712` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → CriticalResultDetectionService.notifyResponsible → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:847` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → CriticalResultDetectionService.notifyResponsible → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:191` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → CriticalResultDetectionService.notifyResponsible → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:439` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → CriticalResultDetectionService.notifyResponsible → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:516` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → CriticalResultDetectionService.notifyResponsible → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:272` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → CriticalResultDetectionService.notifyResponsible → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:407` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → CriticalResultDetectionService.notifyResponsible → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:214` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsReportsController.detectCritical → CriticalResultDetectionService.detect → CriticalResultDetectionService.notifyResponsible → CriticalResultDetectionService.responsibleOf → CriticalResultDetectionService.userOf → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 409 | `CONFLICT` | ConflictException: Ya existe una notificación crítica para la observación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-reports.controller.spec.ts:69` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-09`

---

## 15. POST /diagnostics/critical-results/{id}/acknowledge

- **Origen:** CONTRATO
- **Nombre:** Acusar recibo / escalar notificación crítica
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportsController.acknowledge` — `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:106`

### Qué es y para qué sirve (negocio)

Acusar recibo / escalar notificación crítica. Caso de uso UC-20-10: Acusar recibo / escalar. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:118`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/critical-results/{id}/acknowledge` la atiende `DiagnosticsReportsController.acknowledge` (src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:106). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AcknowledgeCriticalResultDto` (2 campos, 1 obligatorio). Delega en `DiagnosticsReportsService.acknowledgeCritical`. Actualiza diagnostics.critical_result_notifications. Lee diagnostics.critical_result_notifications.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:106` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.critical_result_notifications` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsReportsController.acknowledge → DiagnosticsReportsService.acknowledgeCritical | `src/modules/diagnostics/services/diagnostics-reports.service.ts:295` |
| `diagnostics.critical_result_notifications` | LEE | LEE | DIRECTA | DiagnosticsReportsController.acknowledge → DiagnosticsReportsService.acknowledgeCritical → DiagnosticsScopeService.criticalNotification → ReportsRepository.findCriticalNotification | `src/modules/diagnostics/repositories/reports.repository.ts:156` |

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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: El autor debe ser el profesional que firma |
| 409 | `CONFLICT` | ConflictException: La notificación ya fue reconocida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-reports.controller.spec.ts:76` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-10`

---

## 16. POST /diagnostics/data-quality-events

- **Origen:** CONTRATO
- **Nombre:** Registrar evento de calidad de datos + enlazar provenance
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsImagingController.recordDataQuality` — `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:161`

### Qué es y para qué sirve (negocio)

Registrar evento de calidad de datos + enlazar provenance. Caso de uso UC-20-14: Evento de calidad de datos + provenance. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:123`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/data-quality-events` la atiende `DiagnosticsImagingController.recordDataQuality` (src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:161). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateDataQualityEventDto` (9 campos, 2 obligatorios). Delega en `DiagnosticsMediaQualityService.recordDataQualityEvent`. Crea filas en diagnostics.diagnostic_data_quality_events, diagnostics.diagnostic_provenance_links. Lee clinical.observations, diagnostics.imaging_studies, diagnostics.specimens.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:161` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.observations` | LEE | LEE | DIRECTA | DiagnosticsImagingController.recordDataQuality → DiagnosticsMediaQualityService.recordDataQualityEvent → DiagnosticsScopeService.dataQualityTarget → ClinicalRefsRepository.findObservation | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:37` |
| `diagnostics.diagnostic_data_quality_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.recordDataQuality → DiagnosticsMediaQualityService.recordDataQualityEvent → MediaQualityRepository.createDataQualityEvent | `src/modules/diagnostics/repositories/media-quality.repository.ts:244` |
| `diagnostics.diagnostic_provenance_links` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.recordDataQuality → DiagnosticsMediaQualityService.recordDataQualityEvent → MediaQualityRepository.addProvenanceLink | `src/modules/diagnostics/repositories/media-quality.repository.ts:303` |
| `diagnostics.imaging_studies` | LEE | LEE | DIRECTA | DiagnosticsImagingController.recordDataQuality → DiagnosticsMediaQualityService.recordDataQualityEvent → DiagnosticsScopeService.dataQualityTarget → ImagingRepository.findStudy | `src/modules/diagnostics/repositories/imaging.repository.ts:142` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsImagingController.recordDataQuality → DiagnosticsMediaQualityService.recordDataQualityEvent → DiagnosticsScopeService.dataQualityTarget → SpecimensRepository.findSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:168` |

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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: El autor debe ser el profesional que firma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.spec.ts:96` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-14`

---

## 17. POST /diagnostics/imaging-endpoints

- **Origen:** CONTRATO
- **Nombre:** Registrar un endpoint DICOM (soporte para STOW-RS)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsImagingController.createEndpoint` — `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:92`

### Qué es y para qué sirve (negocio)

Registrar un endpoint DICOM (soporte para STOW-RS). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/imaging-endpoints` la atiende `DiagnosticsImagingController.createEndpoint` (src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:92). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateImagingEndpointDto` (4 campos, 1 obligatorio). Delega en `DiagnosticsImagingService.createEndpoint`. Crea filas en diagnostics.imaging_endpoints.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.imaging_endpoints` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.createEndpoint → DiagnosticsImagingService.createEndpoint → ImagingRepository.createEndpoint | `src/modules/diagnostics/repositories/imaging.repository.ts:179` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.spec.ts:43` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsImagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /diagnostics/imaging-studies/{id}/dose-events

- **Origen:** CONTRATO
- **Nombre:** Registrar evento de dosis de radiación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsImagingController.recordDose` — `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:144`

### Qué es y para qué sirve (negocio)

Registrar evento de dosis de radiación. Caso de uso UC-20-13: Registrar dosis de radiación. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:122`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/imaging-studies/{id}/dose-events` la atiende `DiagnosticsImagingController.recordDose` (src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:144). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `RecordDoseEventDto` (8 campos, 0 obligatorios). Delega en `DiagnosticsImagingService.recordDoseEvent`. Crea filas en diagnostics.radiation_dose_events. Lee diagnostics.imaging_series, diagnostics.imaging_studies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:144` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:144` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.imaging_series` | LEE | LEE | DIRECTA | DiagnosticsImagingController.recordDose → DiagnosticsImagingService.recordDoseEvent → DiagnosticsScopeService.seriesOfStudy → ImagingRepository.findSeriesInStudy | `src/modules/diagnostics/repositories/imaging.repository.ts:151` |
| `diagnostics.imaging_studies` | LEE | LEE | DIRECTA | DiagnosticsImagingController.recordDose → DiagnosticsImagingService.recordDoseEvent → DiagnosticsScopeService.study → ImagingRepository.findStudy | `src/modules/diagnostics/repositories/imaging.repository.ts:142` |
| `diagnostics.radiation_dose_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.recordDose → DiagnosticsImagingService.recordDoseEvent → ImagingRepository.recordDoseEvent | `src/modules/diagnostics/repositories/imaging.repository.ts:446` |

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
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.spec.ts:85` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-13`

---

## 19. GET /diagnostics/lab/orders

- **Origen:** CONTRATO
- **Nombre:** Órdenes derivadas al laboratorio, con su estado derivado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabPortalController.listOrders` — `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:71`

### Qué es y para qué sirve (negocio)

Órdenes derivadas al laboratorio, con su estado derivado. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/lab/orders` la atiende `DiagnosticsLabPortalController.listOrders` (src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:71). Exige sesión; el controlador no declara roles. Delega en `LabPortalOrdersService.list`. Lee clinical.diagnostic_reports, clinical.service_requests, common.file_versions, common.files, diagnostics.accession_specimens, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions, diagnostics.laboratory_accessions y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:71` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → LabPortalRepository.findReports | `src/modules/diagnostics/repositories/lab-portal.repository.ts:161` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalRepository.findOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:85` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:191` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:186` |
| `diagnostics.accession_specimens` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → LabPortalRepository.findAccessionItems | `src/modules/diagnostics/repositories/lab-portal.repository.ts:136` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → LabPortalRepository.findAccessions | `src/modules/diagnostics/repositories/lab-portal.repository.ts:112` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → LabPortalRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:125` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalOrdersService.toDtos → ReportDraftsRepository.findByOrders | `src/modules/diagnostics/repositories/report-drafts.repository.ts:45` |
| `diagnostics.service_request_performer_events` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → LabPortalEventsRepository.findLatestByOrders | `src/modules/diagnostics/repositories/lab-portal-events.repository.ts:31` |
| `diagnostics.specimen_rejection_events` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → LabPortalRepository.findRejections | `src/modules/diagnostics/repositories/lab-portal.repository.ts:147` |
| `iam.users` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → LabPortalRepository.findUserNames | `src/modules/diagnostics/repositories/lab-portal.repository.ts:213` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listOrders → LabPortalOrdersService.list → LabPortalSnapshotService.load → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LabOrderPageDto>` · DTO `LabOrderPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<LabOrderDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:125` |
| `items[].orderId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:78` |
| `items[].studyName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:79` |
| `items[].patientName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:80` |
| `items[].requesterName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:81` |
| `items[].requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:82` |
| `items[].status` | `string` | Sí | valores: DRAFT, RECEIVED, PROCESSED, UPLOADED, CANCELLED, REJECTED | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:83` |
| `items[].reason` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:84` |
| `items[].canReject` | `boolean` | Sí | — | — | Whether REJECT applies now: a received order with an open specimen. | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:89` |
| `items[].registeredByPerformer` | `boolean` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:91` |
| `items[].canEdit` | `boolean` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:93` |
| `items[].codeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:94` |
| `items[].priorityConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:96` |
| `items[].externalRequesterName` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:98` |
| `items[].externalRequesterLicense` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:100` |
| `items[].files` | `array<LabOrderFileDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:101` |
| `items[].files[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:60` |
| `items[].files[].fileName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:61` |
| `items[].files[].sizeBytes` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:62` |
| `items[].report` | `LabOrderReportStateDto` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:103` |
| `items[].report.draftStatus` | `string` | Sí | valores: DRAFT, PUBLISHED; admite null | — | Null when the tenant never opened a written report. | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:72` |
| `items[].report.publishedVersionId` | `string` | No | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:73` |
| `count` | `number` | Sí | — | — | Orders of the laboratory in total, not just the ones in this page. | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:127` |
| `nextCursor` | `string` | No | — | — | Present when older orders remain: send it back as `cursor`. | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:129` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-portal-order-intake.int-spec.ts:73` |
| INTEGRACION | `test/integration/report-drafts.int-spec.ts:492` |
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.spec.ts:59` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabPortalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /diagnostics/lab/orders

- **Origen:** CONTRATO
- **Nombre:** El centro carga una orden que llega en papel o por mostrador
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabPortalController.createOrder` — `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:102`

### Qué es y para qué sirve (negocio)

El centro carga una orden que llega en papel o por mostrador. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/lab/orders` la atiende `DiagnosticsLabPortalController.createOrder` (src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:102). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateLabOrderDto` (15 campos, 3 obligatorios). Delega en `LabPortalOrderIntakeService.create`. Crea filas en clinical.service_requests, messaging.domain_events, messaging.outbox_messages. Lee clinical.diagnostic_reports, clinical.service_requests, common.file_versions, common.files, diagnostics.accession_specimens, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions, diagnostics.laboratory_accessions y 15 más. Publica ServiceRequestPlaced.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:102` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalSnapshotService.load → LabPortalRepository.findReports | `src/modules/diagnostics/repositories/lab-portal.repository.ts:161` |
| `clinical.service_requests` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create | `src/modules/diagnostics/services/lab-portal-order-intake.service.ts:105` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalRepository.findOrder | `src/modules/diagnostics/repositories/lab-portal.repository.ts:98` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:191` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:186` |
| `diagnostics.accession_specimens` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalSnapshotService.load → LabPortalRepository.findAccessionItems | `src/modules/diagnostics/repositories/lab-portal.repository.ts:136` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalSnapshotService.load → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalSnapshotService.load → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalSnapshotService.load → LabPortalRepository.findAccessions | `src/modules/diagnostics/repositories/lab-portal.repository.ts:112` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalSnapshotService.load → LabPortalRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:125` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → ReportDraftsRepository.findByOrders | `src/modules/diagnostics/repositories/report-drafts.repository.ts:45` |
| `diagnostics.service_request_performer_events` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalSnapshotService.load → LabPortalEventsRepository.findLatestByOrders | `src/modules/diagnostics/repositories/lab-portal-events.repository.ts:31` |
| `diagnostics.specimen_rejection_events` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalSnapshotService.load → LabPortalRepository.findRejections | `src/modules/diagnostics/repositories/lab-portal.repository.ts:147` |
| `iam.users` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalSnapshotService.load → LabPortalRepository.findUserNames | `src/modules/diagnostics/repositories/lab-portal.repository.ts:213` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create | `src/modules/diagnostics/services/lab-portal-order-intake.service.ts:94` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.read → LabPortalSnapshotService.load → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |
| `terminology.concept_properties` | LEE | LEE | POR_SQL | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.prepare → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.findStudy → TerminologyStudyCatalogAdapter.property | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:132` |
| `terminology.concept_relationships` | LEE | LEE | POR_SQL | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.prepare → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.panelComponentIds | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:69` |
| `terminology.value_set_members` | LEE | LEE | POR_SQL | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.prepare → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |
| `terminology.value_set_versions` | LEE | LEE | POR_SQL | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.prepare → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |
| `terminology.value_sets` | LEE | LEE | POR_SQL | DiagnosticsLabPortalController.createOrder → LabPortalOrderIntakeService.create → LabPortalOrderIntakeService.prepare → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `ServiceRequestPlaced` | `src/modules/diagnostics/services/lab-portal-order-intake.service.ts:123` |

### Cuerpo — DTO `CreateLabOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `codeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:28` |
| `category` | `string` | Sí | valores: LAB, IMAGING | `@IsIn(LAB_ORDER_CATEGORIES)` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:33` |
| `priorityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:38` |
| `specimenTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:44` |
| `imaging` | `ImagingDetailDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => ImagingDetailDto)` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:51` |
| `imaging.modalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Modalidad (value set `service-request-imaging-modality`). Si el estudio del catálogo ya fija una y no se envía, se toma la del estudio; si se envía otra: 422 MODALITY_STUDY_MISMATCH | `src/modules/clinical/dto/service-request-detail.dto.ts:18` |
| `imaging.bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Región corporal (value set `imaging-body-structure`). Obligatoria en estudios de imagen del catálogo (422 BODY_SITE_REQUIRED) | `src/modules/clinical/dto/service-request-detail.dto.ts:27` |
| `imaging.lateralityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Lateralidad (value set `condition-laterality`: izquierda, derecha, bilateral). Exige región; prohibida si la región no es par (422 LATERALITY_NOT_APPLICABLE) | `src/modules/clinical/dto/service-request-detail.dto.ts:36` |
| `imaging.contrastConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Contraste (value set `imaging-contrast`). Exige modalidad (422 CONTRAST_REQUIRES_MODALITY) | `src/modules/clinical/dto/service-request-detail.dto.ts:45` |
| `imaging.bodyStructureUberon` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | Estructura marcada en el modelo 3D del cuerpo (`UBERON:<n>`). 422 BODY_STRUCTURE_FORMAT_INVALID si la forma no es esa; no se verifica contra el atlas | `src/modules/clinical/dto/service-request-detail.dto.ts:56` |
| `imaging.bodyMeshId` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | Malla marcada en el modelo 3D (id alfanumérico, p. ej. `BP44`). 422 BODY_MESH_ID_FORMAT_INVALID si no lo es | `src/modules/clinical/dto/service-request-detail.dto.ts:67` |
| `imaging.boneTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Tipo de hueso (value set `bone-type`; lo elige el médico, no se deriva). Exige región o estructura UBERON (422 BONE_TYPE_REQUIRES_BODY_STRUCTURE / BONE_TYPE_NOT_IN_CATALOG) | `src/modules/clinical/dto/service-request-detail.dto.ts:76` |
| `externalRequesterName` | `string` | No | longitud máxima 200; patrón runtime NOT_BLANK | `@IsOptional()` `@IsString()` `@Matches(NOT_BLANK)` `@MaxLength(200)` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:59` |
| `externalRequesterLicense` | `string` | No | longitud máxima 64; patrón runtime NOT_BLANK | `@IsOptional()` `@IsString()` `@Matches(NOT_BLANK)` `@MaxLength(64)` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:66` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:74` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "category": "LAB",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<LabOrderDto>` · DTO `LabOrderDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `orderId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:78` |
| `studyName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:79` |
| `patientName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:80` |
| `requesterName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:81` |
| `requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:82` |
| `status` | `string` | Sí | valores: DRAFT, RECEIVED, PROCESSED, UPLOADED, CANCELLED, REJECTED | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:83` |
| `reason` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:84` |
| `canReject` | `boolean` | Sí | — | — | Whether REJECT applies now: a received order with an open specimen. | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:89` |
| `registeredByPerformer` | `boolean` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:91` |
| `canEdit` | `boolean` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:93` |
| `codeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:94` |
| `priorityConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:96` |
| `externalRequesterName` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:98` |
| `externalRequesterLicense` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:100` |
| `files` | `array<LabOrderFileDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:101` |
| `files[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:60` |
| `files[].fileName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:61` |
| `files[].sizeBytes` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:62` |
| `report` | `LabOrderReportStateDto` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:103` |
| `report.draftStatus` | `string` | Sí | valores: DRAFT, PUBLISHED; admite null | — | Null when the tenant never opened a written report. | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:72` |
| `report.publishedVersionId` | `string` | No | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:73` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {NO_PATIENT}; PreconditionFailedException: {message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-portal-order-intake.int-spec.ts:153` |
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.spec.ts:62` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabPortalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. PUT /diagnostics/lab/orders/{orderId}

- **Origen:** CONTRATO
- **Nombre:** Corregir una orden que cargó el centro, antes de recibirla
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabPortalController.updateOrder` — `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:123`

### Qué es y para qué sirve (negocio)

Corregir una orden que cargó el centro, antes de recibirla. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PUT /diagnostics/lab/orders/{orderId}` la atiende `DiagnosticsLabPortalController.updateOrder` (src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:123). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateLabOrderDto` (14 campos, 2 obligatorios). Delega en `LabPortalOrderIntakeService.update`. Actualiza clinical.service_requests. Lee clinical.diagnostic_reports, clinical.service_requests, common.file_versions, common.files, diagnostics.accession_specimens, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions, diagnostics.laboratory_accessions y 14 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:123` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: orderId | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:123` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → LabPortalRepository.findReports | `src/modules/diagnostics/repositories/lab-portal.repository.ts:161` |
| `clinical.service_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update | `src/modules/diagnostics/services/lab-portal-order-intake.service.ts:162` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalRepository.findOrder | `src/modules/diagnostics/repositories/lab-portal.repository.ts:98` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:191` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:186` |
| `diagnostics.accession_specimens` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → LabPortalRepository.findAccessionItems | `src/modules/diagnostics/repositories/lab-portal.repository.ts:136` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → LabPortalRepository.findAccessions | `src/modules/diagnostics/repositories/lab-portal.repository.ts:112` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → LabPortalRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:125` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalOrderIntakeService.read → ReportDraftsRepository.findByOrders | `src/modules/diagnostics/repositories/report-drafts.repository.ts:45` |
| `diagnostics.service_request_performer_events` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → LabPortalEventsRepository.findLatestByOrders | `src/modules/diagnostics/repositories/lab-portal-events.repository.ts:31` |
| `diagnostics.specimen_rejection_events` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → LabPortalRepository.findRejections | `src/modules/diagnostics/repositories/lab-portal.repository.ts:147` |
| `iam.users` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → LabPortalRepository.findUserNames | `src/modules/diagnostics/repositories/lab-portal.repository.ts:213` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalSnapshotService.load → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |
| `terminology.concept_properties` | LEE | LEE | POR_SQL | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalOrderIntakeService.prepare → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.findStudy → TerminologyStudyCatalogAdapter.property | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:132` |
| `terminology.concept_relationships` | LEE | LEE | POR_SQL | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalOrderIntakeService.prepare → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.panelComponentIds | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:69` |
| `terminology.value_set_members` | LEE | LEE | POR_SQL | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalOrderIntakeService.prepare → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |
| `terminology.value_set_versions` | LEE | LEE | POR_SQL | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalOrderIntakeService.prepare → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |
| `terminology.value_sets` | LEE | LEE | POR_SQL | DiagnosticsLabPortalController.updateOrder → LabPortalOrderIntakeService.update → LabPortalOrderIntakeService.prepare → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `orderId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateLabOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `codeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:28` |
| `category` | `string` | Sí | valores: LAB, IMAGING | `@IsIn(LAB_ORDER_CATEGORIES)` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:33` |
| `priorityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:38` |
| `specimenTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:44` |
| `imaging` | `ImagingDetailDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => ImagingDetailDto)` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:51` |
| `imaging.modalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Modalidad (value set `service-request-imaging-modality`). Si el estudio del catálogo ya fija una y no se envía, se toma la del estudio; si se envía otra: 422 MODALITY_STUDY_MISMATCH | `src/modules/clinical/dto/service-request-detail.dto.ts:18` |
| `imaging.bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Región corporal (value set `imaging-body-structure`). Obligatoria en estudios de imagen del catálogo (422 BODY_SITE_REQUIRED) | `src/modules/clinical/dto/service-request-detail.dto.ts:27` |
| `imaging.lateralityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Lateralidad (value set `condition-laterality`: izquierda, derecha, bilateral). Exige región; prohibida si la región no es par (422 LATERALITY_NOT_APPLICABLE) | `src/modules/clinical/dto/service-request-detail.dto.ts:36` |
| `imaging.contrastConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Contraste (value set `imaging-contrast`). Exige modalidad (422 CONTRAST_REQUIRES_MODALITY) | `src/modules/clinical/dto/service-request-detail.dto.ts:45` |
| `imaging.bodyStructureUberon` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | Estructura marcada en el modelo 3D del cuerpo (`UBERON:<n>`). 422 BODY_STRUCTURE_FORMAT_INVALID si la forma no es esa; no se verifica contra el atlas | `src/modules/clinical/dto/service-request-detail.dto.ts:56` |
| `imaging.bodyMeshId` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | Malla marcada en el modelo 3D (id alfanumérico, p. ej. `BP44`). 422 BODY_MESH_ID_FORMAT_INVALID si no lo es | `src/modules/clinical/dto/service-request-detail.dto.ts:67` |
| `imaging.boneTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Tipo de hueso (value set `bone-type`; lo elige el médico, no se deriva). Exige región o estructura UBERON (422 BONE_TYPE_REQUIRES_BODY_STRUCTURE / BONE_TYPE_NOT_IN_CATALOG) | `src/modules/clinical/dto/service-request-detail.dto.ts:76` |
| `externalRequesterName` | `string` | No | longitud máxima 200; patrón runtime NOT_BLANK | `@IsOptional()` `@IsString()` `@Matches(NOT_BLANK)` `@MaxLength(200)` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:59` |
| `externalRequesterLicense` | `string` | No | longitud máxima 64; patrón runtime NOT_BLANK | `@IsOptional()` `@IsString()` `@Matches(NOT_BLANK)` `@MaxLength(64)` | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:66` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "category": "LAB"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<LabOrderDto>` · DTO `LabOrderDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `orderId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:78` |
| `studyName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:79` |
| `patientName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:80` |
| `requesterName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:81` |
| `requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:82` |
| `status` | `string` | Sí | valores: DRAFT, RECEIVED, PROCESSED, UPLOADED, CANCELLED, REJECTED | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:83` |
| `reason` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:84` |
| `canReject` | `boolean` | Sí | — | — | Whether REJECT applies now: a received order with an open specimen. | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:89` |
| `registeredByPerformer` | `boolean` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:91` |
| `canEdit` | `boolean` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:93` |
| `codeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:94` |
| `priorityConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:96` |
| `externalRequesterName` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:98` |
| `externalRequesterLicense` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:100` |
| `files` | `array<LabOrderFileDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:101` |
| `files[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:60` |
| `files[].fileName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:61` |
| `files[].sizeBytes` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:62` |
| `report` | `LabOrderReportStateDto` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:103` |
| `report.draftStatus` | `string` | Sí | valores: DRAFT, PUBLISHED; admite null | — | Null when the tenant never opened a written report. | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:72` |
| `report.publishedVersionId` | `string` | No | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:73` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Sólo se editan las órdenes que cargó el centro y que todavía no se recibieron. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-portal-order-intake.int-spec.ts:200` |
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.spec.ts:70` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabPortalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /diagnostics/lab/orders/{orderId}/transitions

- **Origen:** CONTRATO
- **Nombre:** Un paso del camino de la orden (RECEIVE, PROCESS, REJECT, CANCEL)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabPortalController.transition` — `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:145`

### Qué es y para qué sirve (negocio)

Un paso del camino de la orden (RECEIVE, PROCESS, REJECT, CANCEL). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/lab/orders/{orderId}/transitions` la atiende `DiagnosticsLabPortalController.transition` (src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:145). Exige sesión; el controlador no declara roles. Valida el cuerpo como `LabOrderTransitionDto` (2 campos, 1 obligatorio). Delega en `LabPortalOrdersService.transition`. Crea filas en diagnostics.accession_specimens, diagnostics.laboratory_accessions, diagnostics.laboratory_work_order_tests, diagnostics.laboratory_work_orders, diagnostics.service_request_performer_events, diagnostics.specimen_chain_of_custody_events, diagnostics.specimen_rejection_events, diagnostics.specimens. Actualiza diagnostics.accession_specimens, diagnostics.laboratory_work_order_tests, diagnostics.laboratory_work_orders, diagnostics.specimens. Lee clinical.diagnostic_reports, clinical.service_requests, common.file_versions, common.files, diagnostics.accession_specimens, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions, diagnostics.laboratory_accessions y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:145` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: orderId | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:145` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → LabPortalRepository.findReports | `src/modules/diagnostics/repositories/lab-portal.repository.ts:161` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalRepository.findOrder | `src/modules/diagnostics/repositories/lab-portal.repository.ts:98` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:191` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:186` |
| `diagnostics.accession_specimens` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalOrdersService.receive → SpecimensRepository.addAccessionSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:352` |
| `diagnostics.accession_specimens` | ESCRIBE | ACTUALIZA | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalOrderOutcomeService.reject → LabPortalOrderOutcomeService.rejectSpecimens | `src/modules/diagnostics/services/lab-portal-order-outcome.service.ts:113` |
| `diagnostics.accession_specimens` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → LabPortalRepository.findAccessionItems | `src/modules/diagnostics/repositories/lab-portal.repository.ts:136` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `diagnostics.laboratory_accessions` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalOrdersService.receive → SpecimensRepository.createAccession | `src/modules/diagnostics/repositories/specimens.repository.ts:307` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → LabPortalRepository.findAccessions | `src/modules/diagnostics/repositories/lab-portal.repository.ts:112` |
| `diagnostics.laboratory_work_order_tests` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalOrdersService.process → LabWorkRepository.createWorkOrderTest | `src/modules/diagnostics/repositories/lab-work.repository.ts:298` |
| `diagnostics.laboratory_work_order_tests` | ESCRIBE | ACTUALIZA | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalOrderOutcomeService.reject → LabPortalOrderOutcomeService.rejectSpecimens → SpecimensRepository.cancelTestsForSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:553` |
| `diagnostics.laboratory_work_orders` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalOrdersService.process | `src/modules/diagnostics/services/lab-portal-orders.service.ts:279` |
| `diagnostics.laboratory_work_orders` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalOrdersService.process → LabWorkRepository.createWorkOrder | `src/modules/diagnostics/repositories/lab-work.repository.ts:272` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → LabPortalRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:125` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalOrdersService.toDtos → ReportDraftsRepository.findByOrders | `src/modules/diagnostics/repositories/report-drafts.repository.ts:45` |
| `diagnostics.service_request_performer_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalOrderOutcomeService.reject → LabPortalEventsRepository.record | `src/modules/diagnostics/repositories/lab-portal-events.repository.ts:49` |
| `diagnostics.service_request_performer_events` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → LabPortalEventsRepository.findLatestByOrders | `src/modules/diagnostics/repositories/lab-portal-events.repository.ts:31` |
| `diagnostics.specimen_chain_of_custody_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalOrdersService.receive → SpecimensRepository.recordCustodyEvent | `src/modules/diagnostics/repositories/specimens.repository.ts:407` |
| `diagnostics.specimen_rejection_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalOrderOutcomeService.reject → LabPortalOrderOutcomeService.rejectSpecimens → SpecimensRepository.recordRejection | `src/modules/diagnostics/repositories/specimens.repository.ts:459` |
| `diagnostics.specimen_rejection_events` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → LabPortalRepository.findRejections | `src/modules/diagnostics/repositories/lab-portal.repository.ts:147` |
| `diagnostics.specimens` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalOrdersService.receive | `src/modules/diagnostics/services/lab-portal-orders.service.ts:247` |
| `diagnostics.specimens` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalOrdersService.receive → SpecimensRepository.createSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:276` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalOrderOutcomeService.reject → LabPortalOrderOutcomeService.rejectSpecimens → SpecimensRepository.findSpecimensByIds | `src/modules/diagnostics/repositories/specimens.repository.ts:239` |
| `iam.users` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → LabPortalRepository.findUserNames | `src/modules/diagnostics/repositories/lab-portal.repository.ts:213` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.transition → LabPortalOrdersService.transition → LabPortalSnapshotService.load → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `orderId` | path | Sí | `string` | — |

### Cuerpo — DTO `LabOrderTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `action` | `string` | Sí | valores: RECEIVE, PROCESS, CANCEL, REJECT | `@IsIn(LAB_ORDER_ACTIONS)` | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:36` |
| `reason` | `string` | No | longitud máxima 1000; patrón runtime /\S/ | `@ValidateIf( (body: LabOrderTransitionDto) => REASON_REQUIRED.includes(body.action) \|\| body.reason !== undefined, )` `@IsString({ message: REASON_MESSAGE })` `@Matches(/\S/, { message: REASON_MESSAGE })` `@MaxLength(1000)` | Required (non-blank) when action is CANCEL or REJECT; ignored by RECEIVE and PROCESS | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:55` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "action": "RECEIVE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "action": "RECEIVE",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<LabOrderDto>` · DTO `LabOrderDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `orderId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:78` |
| `studyName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:79` |
| `patientName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:80` |
| `requesterName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:81` |
| `requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:82` |
| `status` | `string` | Sí | valores: DRAFT, RECEIVED, PROCESSED, UPLOADED, CANCELLED, REJECTED | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:83` |
| `reason` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:84` |
| `canReject` | `boolean` | Sí | — | — | Whether REJECT applies now: a received order with an open specimen. | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:89` |
| `registeredByPerformer` | `boolean` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:91` |
| `canEdit` | `boolean` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:93` |
| `codeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:94` |
| `priorityConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:96` |
| `externalRequesterName` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:98` |
| `externalRequesterLicense` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:100` |
| `files` | `array<LabOrderFileDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:101` |
| `files[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:60` |
| `files[].fileName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:61` |
| `files[].sizeBytes` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:62` |
| `report` | `LabOrderReportStateDto` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:103` |
| `report.draftStatus` | `string` | Sí | valores: DRAFT, PUBLISHED; admite null | — | Null when the tenant never opened a written report. | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:72` |
| `report.publishedVersionId` | `string` | No | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:73` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La orden no está en un estado que admita ese paso. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-portal-order-intake.int-spec.ts:228` |
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.spec.ts:60` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabPortalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /diagnostics/lab/patients/lookup

- **Origen:** CONTRATO
- **Nombre:** Paciente por número de documento, para cargar su orden
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabPortalController.lookupPatient` — `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:85`

### Qué es y para qué sirve (negocio)

Paciente por número de documento, para cargar su orden. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/lab/patients/lookup` la atiende `DiagnosticsLabPortalController.lookupPatient` (src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:85). Exige sesión; el controlador no declara roles. Valida el cuerpo como `LabPatientLookupDto` (1 campo, 1 obligatorio). Delega en `LabPortalOrderIntakeService.lookupPatient`. Lee common.identifiers, profiles.patient_profiles, profiles.person_profiles, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:85` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.identifiers` | LEE | LEE | POR_SQL | DiagnosticsLabPortalController.lookupPatient → LabPortalOrderIntakeService.lookupPatient | `src/modules/diagnostics/services/lab-portal-order-intake.service.ts:59` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.lookupPatient → LabPortalOrderIntakeService.lookupPatient → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.lookupPatient → LabPortalOrderIntakeService.lookupPatient → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.lookupPatient → LabPortalOrderIntakeService.lookupPatient → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |

### Cuerpo — DTO `LabPatientLookupDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nationalId` | `string` | Sí | longitud máxima 40; patrón runtime NOT_BLANK | `@IsString()` `@Matches(NOT_BLANK)` `@MaxLength(40)` | Exact national id number | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:86` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<LabPatientMatchDto>` · DTO `LabPatientMatchDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:91` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:92` |
| `patientCode` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-order-intake.dto.ts:93` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {NO_PATIENT} |
| 409 | `CONFLICT` | ConflictException: Ese documento figura en más de un paciente. Pida a soporte que lo revise. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-portal-order-intake.int-spec.ts:138` |
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.spec.ts:61` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabPortalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. GET /diagnostics/lab/result-files

- **Origen:** CONTRATO
- **Nombre:** Resultados subidos por el laboratorio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabResultsController.listResultFiles` — `src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts:52`

### Qué es y para qué sirve (negocio)

Resultados subidos por el laboratorio. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/lab/result-files` la atiende `DiagnosticsLabResultsController.listResultFiles` (src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts:52). Exige sesión; el controlador no declara roles. Delega en `LabPortalResultsService.list`. Lee clinical.diagnostic_reports, clinical.service_requests, common.file_versions, common.files, diagnostics.accession_specimens, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions, diagnostics.laboratory_accessions y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findReports | `src/modules/diagnostics/repositories/lab-portal.repository.ts:161` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalRepository.findOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:85` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:191` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:186` |
| `diagnostics.accession_specimens` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findAccessionItems | `src/modules/diagnostics/repositories/lab-portal.repository.ts:136` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findAccessions | `src/modules/diagnostics/repositories/lab-portal.repository.ts:112` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:125` |
| `diagnostics.service_request_performer_events` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalEventsRepository.findLatestByOrders | `src/modules/diagnostics/repositories/lab-portal-events.repository.ts:31` |
| `diagnostics.specimen_rejection_events` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findRejections | `src/modules/diagnostics/repositories/lab-portal.repository.ts:147` |
| `iam.users` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findUserNames | `src/modules/diagnostics/repositories/lab-portal.repository.ts:213` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.listResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `kind` | query | No | `string` | — |
| `orderId` | query | No | `string` | — |
| `includeWithdrawn` | query | No | `boolean` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LabResultFilePageDto>` · DTO `LabResultFilePageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<LabResultFileDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:99` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:79` |
| `items[].fileName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:80` |
| `items[].contentType` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:81` |
| `items[].sizeBytes` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:82` |
| `items[].kind` | `string` | Sí | valores: PDF, IMAGE, VIDEO, AUDIO, TEXT, DICOM, OTHER | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:83` |
| `items[].uploadedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:84` |
| `items[].uploadedBy` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:85` |
| `items[].orderId` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:86` |
| `items[].orderLabel` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:87` |
| `items[].patientName` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:88` |
| `items[].note` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:89` |
| `items[].notified` | `boolean` | Sí | — | — | The API does not send notifications from this portal: always `false`. | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:91` |
| `items[].status` | `string` | Sí | valores: AVAILABLE, WITHDRAWN | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:93` |
| `items[].withdrawnReason` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:95` |
| `count` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:100` |
| `totalBytes` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:101` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.spec.ts:76` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. GET /diagnostics/lab/result-files/{id}/content

- **Origen:** CONTRATO
- **Nombre:** Descargar un resultado subido
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabResultsController.getResultContent` — `src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts:81`

### Qué es y para qué sirve (negocio)

Descargar un resultado subido. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/lab/result-files/{id}/content` la atiende `DiagnosticsLabResultsController.getResultContent` (src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts:81). Exige sesión; el controlador no declara roles. Delega en `LabPortalResultsService.content`. Lee clinical.diagnostic_reports, clinical.service_requests, common.file_versions, common.files, diagnostics.accession_specimens, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions, diagnostics.laboratory_accessions y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts:81` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate → LabPortalRepository.findReportsByIds | `src/modules/diagnostics/repositories/lab-portal.repository.ts:173` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate → LabPortalRepository.findOrder | `src/modules/diagnostics/repositories/lab-portal.repository.ts:98` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:191` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → FileUploadService.downloadForAuthorizedContext → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `diagnostics.accession_specimens` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalRepository.findAccessionItems | `src/modules/diagnostics/repositories/lab-portal.repository.ts:136` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate | `src/modules/diagnostics/services/lab-portal-results.service.ts:165` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate | `src/modules/diagnostics/services/lab-portal-results.service.ts:167` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalRepository.findAccessions | `src/modules/diagnostics/repositories/lab-portal.repository.ts:112` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:125` |
| `diagnostics.service_request_performer_events` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalEventsRepository.findLatestByOrders | `src/modules/diagnostics/repositories/lab-portal-events.repository.ts:31` |
| `diagnostics.specimen_rejection_events` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalRepository.findRejections | `src/modules/diagnostics/repositories/lab-portal.repository.ts:147` |
| `iam.users` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalRepository.findUserNames | `src/modules/diagnostics/repositories/lab-portal.repository.ts:213` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.getResultContent → LabPortalResultsService.content → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: {labels.notFound}; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La descarga de archivos no está disponible |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: S3 object body is empty |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. POST /diagnostics/lab/result-files/{id}/withdrawal

- **Origen:** CONTRATO
- **Nombre:** Retirar un resultado subido por error (queda en el historial)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabResultsController.withdrawResult` — `src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts:101`

### Qué es y para qué sirve (negocio)

Retirar un resultado subido por error (queda en el historial). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/lab/result-files/{id}/withdrawal` la atiende `DiagnosticsLabResultsController.withdrawResult` (src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts:101). Exige sesión; el controlador no declara roles. Valida el cuerpo como `LabResultWithdrawalDto` (1 campo, 1 obligatorio). Delega en `LabPortalResultWritesService.withdraw`. Crea filas en diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions. Actualiza clinical.diagnostic_reports, diagnostics.diagnostic_report_versions. Lee clinical.diagnostic_reports, clinical.service_requests, common.file_versions, common.files, diagnostics.accession_specimens, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions, diagnostics.laboratory_accessions y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts:101` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts:101` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultWritesService.publish | `src/modules/diagnostics/services/lab-portal-result-writes.service.ts:196` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate → LabPortalRepository.findReportsByIds | `src/modules/diagnostics/repositories/lab-portal.repository.ts:173` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate → LabPortalRepository.findOrder | `src/modules/diagnostics/repositories/lab-portal.repository.ts:98` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:191` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:186` |
| `diagnostics.accession_specimens` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalRepository.findAccessionItems | `src/modules/diagnostics/repositories/lab-portal.repository.ts:136` |
| `diagnostics.diagnostic_release_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultWritesService.publish → ReportsRepository.recordReleaseEvent | `src/modules/diagnostics/repositories/reports.repository.ts:341` |
| `diagnostics.diagnostic_report_files` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultWritesService.publish → ReportsRepository.addFile | `src/modules/diagnostics/repositories/reports.repository.ts:286` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate | `src/modules/diagnostics/services/lab-portal-results.service.ts:165` |
| `diagnostics.diagnostic_report_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultWritesService.publish | `src/modules/diagnostics/services/lab-portal-result-writes.service.ts:179` |
| `diagnostics.diagnostic_report_versions` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultWritesService.publish → ReportsRepository.createVersion | `src/modules/diagnostics/repositories/reports.repository.ts:188` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate | `src/modules/diagnostics/services/lab-portal-results.service.ts:167` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalRepository.findAccessions | `src/modules/diagnostics/repositories/lab-portal.repository.ts:112` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:125` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → ReportImmutabilityService.assertWritable → ReportDraftsRepository.findPublishedByReport | `src/modules/diagnostics/repositories/report-drafts.repository.ts:76` |
| `diagnostics.service_request_performer_events` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalEventsRepository.findLatestByOrders | `src/modules/diagnostics/repositories/lab-portal-events.repository.ts:31` |
| `diagnostics.specimen_rejection_events` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalRepository.findRejections | `src/modules/diagnostics/repositories/lab-portal.repository.ts:147` |
| `iam.users` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabPortalRepository.findUserNames | `src/modules/diagnostics/repositories/lab-portal.repository.ts:213` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.withdrawResult → LabPortalResultWritesService.withdraw → LabPortalResultsService.locate → LabPortalSnapshotService.load → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `LabResultWithdrawalDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | longitud mínima 1; longitud máxima 1000 | `@Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value, )` `@IsString()` `@IsNotEmpty()` `@MaxLength(1000)` | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:74` |

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

### Respuesta — `Promise<LabResultFileDto>` · DTO `LabResultFileDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:79` |
| `fileName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:80` |
| `contentType` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:81` |
| `sizeBytes` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:82` |
| `kind` | `string` | Sí | valores: PDF, IMAGE, VIDEO, AUDIO, TEXT, DICOM, OTHER | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:83` |
| `uploadedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:84` |
| `uploadedBy` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:85` |
| `orderId` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:86` |
| `orderLabel` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:87` |
| `patientName` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:88` |
| `note` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:89` |
| `notified` | `boolean` | Sí | — | — | The API does not send notifications from this portal: always `false`. | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:91` |
| `status` | `string` | Sí | valores: AVAILABLE, WITHDRAWN | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:93` |
| `withdrawnReason` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:95` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El archivo ya estaba retirado. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.spec.ts:78` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. POST /diagnostics/lab/result-files/search

- **Origen:** CONTRATO
- **Nombre:** Buscar entre los resultados subidos (filtros en el cuerpo)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabResultsController.searchResultFiles` — `src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts:66`

### Qué es y para qué sirve (negocio)

Buscar entre los resultados subidos (filtros en el cuerpo). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/lab/result-files/search` la atiende `DiagnosticsLabResultsController.searchResultFiles` (src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts:66). Exige sesión; el controlador no declara roles. Valida el cuerpo como `LabResultFileSearchDto` (4 campos, 0 obligatorios). Delega en `LabPortalResultsService.list`. Lee clinical.diagnostic_reports, clinical.service_requests, common.file_versions, common.files, diagnostics.accession_specimens, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions, diagnostics.laboratory_accessions y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-results.controller.ts:66` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findReports | `src/modules/diagnostics/repositories/lab-portal.repository.ts:161` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalRepository.findOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:85` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:191` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:186` |
| `diagnostics.accession_specimens` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findAccessionItems | `src/modules/diagnostics/repositories/lab-portal.repository.ts:136` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findAccessions | `src/modules/diagnostics/repositories/lab-portal.repository.ts:112` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:125` |
| `diagnostics.service_request_performer_events` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalEventsRepository.findLatestByOrders | `src/modules/diagnostics/repositories/lab-portal-events.repository.ts:31` |
| `diagnostics.specimen_rejection_events` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findRejections | `src/modules/diagnostics/repositories/lab-portal.repository.ts:147` |
| `iam.users` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findUserNames | `src/modules/diagnostics/repositories/lab-portal.repository.ts:213` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsLabResultsController.searchResultFiles → LabPortalResultsService.list → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Cuerpo — DTO `LabResultFileSearchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `string` | No | valores: PDF, IMAGE, VIDEO, AUDIO, TEXT, DICOM, OTHER | `@IsOptional()` `@IsIn(LAB_RESULT_KINDS)` | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:40` |
| `orderId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:45` |
| `includeWithdrawn` | `boolean` | No | — | `@IsOptional()` `@Transform(toBoolean)` `@IsBoolean()` | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:52` |
| `q` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:62` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "kind": "PDF",
  "orderId": "00000000-0000-4000-8000-000000000001",
  "includeWithdrawn": true,
  "q": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<LabResultFilePageDto>` · DTO `LabResultFilePageDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<LabResultFileDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:99` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:79` |
| `items[].fileName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:80` |
| `items[].contentType` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:81` |
| `items[].sizeBytes` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:82` |
| `items[].kind` | `string` | Sí | valores: PDF, IMAGE, VIDEO, AUDIO, TEXT, DICOM, OTHER | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:83` |
| `items[].uploadedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:84` |
| `items[].uploadedBy` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:85` |
| `items[].orderId` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:86` |
| `items[].orderLabel` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:87` |
| `items[].patientName` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:88` |
| `items[].note` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:89` |
| `items[].notified` | `boolean` | Sí | — | — | The API does not send notifications from this portal: always `false`. | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:91` |
| `items[].status` | `string` | Sí | valores: AVAILABLE, WITHDRAWN | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:93` |
| `items[].withdrawnReason` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:95` |
| `count` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:100` |
| `totalBytes` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:101` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.spec.ts:77` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabResultsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. GET /diagnostics/lab/result-targets

- **Origen:** CONTRATO
- **Nombre:** Órdenes procesadas a las que se puede adjuntar un resultado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabPortalController.listResultTargets` — `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:171`

### Qué es y para qué sirve (negocio)

Órdenes procesadas a las que se puede adjuntar un resultado. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/lab/result-targets` la atiende `DiagnosticsLabPortalController.listResultTargets` (src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:171). Exige sesión; el controlador no declara roles. Delega en `LabPortalResultsService.targets`. Lee clinical.diagnostic_reports, clinical.service_requests, common.file_versions, common.files, diagnostics.accession_specimens, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions, diagnostics.laboratory_accessions y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:171` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findReports | `src/modules/diagnostics/repositories/lab-portal.repository.ts:161` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalRepository.findOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:85` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:191` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:186` |
| `diagnostics.accession_specimens` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findAccessionItems | `src/modules/diagnostics/repositories/lab-portal.repository.ts:136` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findAccessions | `src/modules/diagnostics/repositories/lab-portal.repository.ts:112` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:125` |
| `diagnostics.service_request_performer_events` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalEventsRepository.findLatestByOrders | `src/modules/diagnostics/repositories/lab-portal-events.repository.ts:31` |
| `diagnostics.specimen_rejection_events` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findRejections | `src/modules/diagnostics/repositories/lab-portal.repository.ts:147` |
| `iam.users` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findUserNames | `src/modules/diagnostics/repositories/lab-portal.repository.ts:213` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.listResultTargets → LabPortalResultsService.targets → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LabResultTargetPageDto>` · DTO `LabResultTargetPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<LabResultTargetDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:143` |
| `items[].orderId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:134` |
| `items[].studyName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:135` |
| `items[].patientName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:136` |
| `items[].requesterName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:137` |
| `items[].requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:138` |
| `items[].fileCount` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:139` |
| `count` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-orders.dto.ts:144` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.spec.ts:75` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabPortalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /diagnostics/lab/result-uploads

- **Origen:** CONTRATO
- **Nombre:** Empezar la subida por partes de un resultado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabUploadsController.start` — `src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:99`

### Qué es y para qué sirve (negocio)

Empezar la subida por partes de un resultado. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/lab/result-uploads` la atiende `DiagnosticsLabUploadsController.start` (src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:99). Exige sesión; el controlador no declara roles. Valida el cuerpo como `LabResultUploadStartDto` (6 campos, 4 obligatorios). Delega en `LabPortalUploadsService.start`. Lee clinical.diagnostic_reports, clinical.service_requests, common.file_versions, common.files, diagnostics.accession_specimens, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions, diagnostics.laboratory_accessions y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:99` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findReports | `src/modules/diagnostics/repositories/lab-portal.repository.ts:161` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalRepository.findOrder | `src/modules/diagnostics/repositories/lab-portal.repository.ts:98` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:191` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:186` |
| `diagnostics.accession_specimens` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findAccessionItems | `src/modules/diagnostics/repositories/lab-portal.repository.ts:136` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findAccessions | `src/modules/diagnostics/repositories/lab-portal.repository.ts:112` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:125` |
| `diagnostics.service_request_performer_events` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalEventsRepository.findLatestByOrders | `src/modules/diagnostics/repositories/lab-portal-events.repository.ts:31` |
| `diagnostics.specimen_rejection_events` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findRejections | `src/modules/diagnostics/repositories/lab-portal.repository.ts:147` |
| `iam.users` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findUserNames | `src/modules/diagnostics/repositories/lab-portal.repository.ts:213` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.start → LabPortalUploadsService.start → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Cuerpo — DTO `LabResultUploadStartDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileName` | `string` | Sí | longitud mínima 1; longitud máxima 255 | `@Transform(trimmed)` `@IsString()` `@IsNotEmpty()` `@MaxLength(255)` | — | `src/modules/diagnostics/dto/lab-portal-uploads.dto.ts:24` |
| `contentType` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/diagnostics/dto/lab-portal-uploads.dto.ts:30` |
| `sizeBytes` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | — | `src/modules/diagnostics/dto/lab-portal-uploads.dto.ts:35` |
| `orderId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/diagnostics/dto/lab-portal-uploads.dto.ts:43` |
| `note` | `string` | No | longitud máxima 1000; admite null | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/diagnostics/dto/lab-portal-uploads.dto.ts:49` |
| `notify` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/diagnostics/dto/lab-portal-uploads.dto.ts:55` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fileName": "Nombre de ejemplo",
  "contentType": "valor-ejemplo",
  "sizeBytes": 1,
  "orderId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fileName": "Nombre de ejemplo",
  "contentType": "valor-ejemplo",
  "sizeBytes": 1,
  "orderId": "00000000-0000-4000-8000-000000000001",
  "note": "valor-ejemplo",
  "notify": true
}
```

</details>

### Respuesta — `Promise<LabResultUploadSessionDto>` · DTO `LabResultUploadSessionDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `uploadId` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-uploads.dto.ts:60` |
| `chunkSizeBytes` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-uploads.dto.ts:61` |
| `totalParts` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-uploads.dto.ts:62` |
| `receivedParts` | `array<number>` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-uploads.dto.ts:63` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Marque la orden como procesada antes de subir sus resultados.; ConflictException: Hay demasiadas subidas abiertas; termine o cancele alguna. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El archivo excede el tamaño máximo permitido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.spec.ts:79` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabUploadsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. DELETE /diagnostics/lab/result-uploads/{uploadId}

- **Origen:** CONTRATO
- **Nombre:** Cancelar una subida abierta
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabUploadsController.abort` — `src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:153`

### Qué es y para qué sirve (negocio)

Cancelar una subida abierta. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`DELETE /diagnostics/lab/result-uploads/{uploadId}` la atiende `DiagnosticsLabUploadsController.abort` (src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:153). Exige sesión; el controlador no declara roles. Delega en `LabPortalUploadsService.abort`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:153` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: uploadId | `src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:153` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `uploadId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `void` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La subida se está cerrando. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.spec.ts:81` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabUploadsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. POST /diagnostics/lab/result-uploads/{uploadId}/complete

- **Origen:** CONTRATO
- **Nombre:** Cerrar la subida: guarda el archivo y lo publica en el informe
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabUploadsController.complete` — `src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:137`

### Qué es y para qué sirve (negocio)

Cerrar la subida: guarda el archivo y lo publica en el informe. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/lab/result-uploads/{uploadId}/complete` la atiende `DiagnosticsLabUploadsController.complete` (src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:137). Exige sesión; el controlador no declara roles. Delega en `LabPortalUploadsService.complete`. Crea filas en clinical.diagnostic_reports, common.file_versions, common.files, diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions, messaging.queued_jobs. Actualiza clinical.diagnostic_reports, common.files, diagnostics.diagnostic_report_versions, diagnostics.laboratory_work_order_tests, messaging.queued_jobs. Lee clinical.diagnostic_reports, clinical.service_requests, common.file_versions, common.files, diagnostics.accession_specimens, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions, diagnostics.laboratory_accessions y 11 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:137` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: uploadId | `src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:137` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultWritesService.attach → DiagnosticReportsRepository.create | `src/modules/clinical/repositories/diagnostic-reports.repository.ts:77` |
| `clinical.diagnostic_reports` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultWritesService.attach → LabPortalResultWritesService.publish | `src/modules/diagnostics/services/lab-portal-result-writes.service.ts:196` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findReports | `src/modules/diagnostics/repositories/lab-portal.repository.ts:161` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultsService.assertUploadable → LabPortalRepository.findOrder | `src/modules/diagnostics/repositories/lab-portal.repository.ts:98` |
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → FileUploadService.upload → FileUploadService.persistBytes → FilesService.createFile → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:142` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:191` |
| `common.files` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → FileUploadService.upload → FileUploadService.persistBytes → FilesService.createFile → FilesRepository.create | `src/modules/common/repositories/files.repository.ts:52` |
| `common.files` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalUploadsService.discardStored → FilesService.softDelete | `src/modules/common/services/files.service.ts:567` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:186` |
| `diagnostics.accession_specimens` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findAccessionItems | `src/modules/diagnostics/repositories/lab-portal.repository.ts:136` |
| `diagnostics.diagnostic_release_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultWritesService.attach → LabPortalResultWritesService.publish → ReportsRepository.recordReleaseEvent | `src/modules/diagnostics/repositories/reports.repository.ts:341` |
| `diagnostics.diagnostic_report_files` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultWritesService.attach → LabPortalResultWritesService.publish → ReportsRepository.addFile | `src/modules/diagnostics/repositories/reports.repository.ts:286` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultWritesService.attach → LabPortalResultsService.locate | `src/modules/diagnostics/services/lab-portal-results.service.ts:165` |
| `diagnostics.diagnostic_report_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultWritesService.attach → LabPortalResultWritesService.publish | `src/modules/diagnostics/services/lab-portal-result-writes.service.ts:179` |
| `diagnostics.diagnostic_report_versions` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultWritesService.attach → LabPortalResultWritesService.publish → ReportsRepository.createVersion | `src/modules/diagnostics/repositories/reports.repository.ts:188` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultWritesService.attach → LabPortalResultsService.locate | `src/modules/diagnostics/services/lab-portal-results.service.ts:167` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findAccessions | `src/modules/diagnostics/repositories/lab-portal.repository.ts:112` |
| `diagnostics.laboratory_work_order_tests` | ESCRIBE | ACTUALIZA | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultWritesService.attach | `src/modules/diagnostics/services/lab-portal-result-writes.service.ts:123` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultWritesService.attach → LabPortalRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:125` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultWritesService.attach → ReportImmutabilityService.assertWritable → ReportDraftsRepository.findPublishedByReport | `src/modules/diagnostics/repositories/report-drafts.repository.ts:76` |
| `diagnostics.service_request_performer_events` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalEventsRepository.findLatestByOrders | `src/modules/diagnostics/repositories/lab-portal-events.repository.ts:31` |
| `diagnostics.specimen_rejection_events` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findRejections | `src/modules/diagnostics/repositories/lab-portal.repository.ts:147` |
| `iam.users` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabPortalRepository.findUserNames | `src/modules/diagnostics/repositories/lab-portal.repository.ts:213` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → FileUploadService.upload → FileUploadService.persistBytes → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:77` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → FileUploadService.upload → FileUploadService.persistBytes → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:101` |
| `messaging.queued_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → FileUploadService.upload → FileUploadService.persistBytes → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.reuse → StorageLifecycleCoordinator.change | `src/common/storage/storage-lifecycle-coordinator.service.ts:656` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalUploadsService.discardStored → FilesService.softDelete → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsLabUploadsController.complete → LabPortalUploadsService.complete → LabPortalResultsService.assertUploadable → LabPortalSnapshotService.load → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `uploadId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LabResultFileDto>` · DTO `LabResultFileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:79` |
| `fileName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:80` |
| `contentType` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:81` |
| `sizeBytes` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:82` |
| `kind` | `string` | Sí | valores: PDF, IMAGE, VIDEO, AUDIO, TEXT, DICOM, OTHER | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:83` |
| `uploadedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:84` |
| `uploadedBy` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:85` |
| `orderId` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:86` |
| `orderLabel` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:87` |
| `patientName` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:88` |
| `note` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:89` |
| `notified` | `boolean` | Sí | — | — | The API does not send notifications from this portal: always `false`. | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:91` |
| `status` | `string` | Sí | valores: AVAILABLE, WITHDRAWN | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:93` |
| `withdrawnReason` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/lab-portal-results.dto.ts:95` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: No tiene permiso para modificar este archivo |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La subida no existe o ya se cerró.; ResourceNotFoundException: Archivo no encontrado |
| 409 | `CONFLICT` | ConflictException: Faltan {missing.length} partes del archivo.; ConflictException: La subida ya se está cerrando.; ConflictException: Marque la orden como procesada antes de subir sus resultados. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se recibió contenido en el campo "file"; PreconditionFailedException: El archivo excede el tamaño máximo permitido; PreconditionFailedException: Las fotos HEIC, HEIF o AVIF no se aceptan: enviala como JPEG, PNG, WEBP o GIF; PreconditionFailedException: El contenido no corresponde a ningún formato de archivo permitido; PreconditionFailedException: El formato del archivo no está permitido para esta categoría; PreconditionFailedException: El archivo está bajo retención legal y no puede borrarse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: WRITE_RESERVATION_REQUIRED; StorageLifecycleDenied: FILE_NOT_LIVE; StorageLifecycleDenied: VERSION_UNKNOWN; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.spec.ts:80` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabUploadsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. PUT /diagnostics/lab/result-uploads/{uploadId}/parts/{index}

- **Origen:** CONTRATO
- **Nombre:** Mandar una parte (bytes crudos)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabUploadsController.putPart` — `src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:115`

### Qué es y para qué sirve (negocio)

Mandar una parte (bytes crudos). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PUT /diagnostics/lab/result-uploads/{uploadId}/parts/{index}` la atiende `DiagnosticsLabUploadsController.putPart` (src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:115). Exige sesión; el controlador no declara roles. Delega en `LabPortalUploadsService.expectedPartSize`, `LabPortalUploadsService.putPart`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:115` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: uploadId | `src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `uploadId` | path | Sí | `string` | — |
| `index` | path | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; BadRequestException: La parte {index} está fuera de rango.; BadRequestException: La parte {index} trae {part.byteLength} bytes y se esperaban {expected}. |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La subida no existe o ya se cerró. |
| 409 | `CONFLICT` | ConflictException: La subida se está cerrando. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab-uploads.controller.spec.ts:82` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabUploadsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. GET /diagnostics/lab/summary

- **Origen:** CONTRATO
- **Nombre:** Resumen del laboratorio del tenant activo
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabPortalController.getSummary` — `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:65`

### Qué es y para qué sirve (negocio)

Resumen del laboratorio del tenant activo. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/lab/summary` la atiende `DiagnosticsLabPortalController.getSummary` (src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:65). Exige sesión; el controlador no declara roles. Delega en `LabPortalSummaryService.summary`. Lee clinical.diagnostic_reports, clinical.service_requests, common.file_versions, common.files, diagnostic_units.diagnostic_service_categories, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_units, diagnostics.accession_specimens y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.ts:65` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findReports | `src/modules/diagnostics/repositories/lab-portal.repository.ts:161` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalRepository.findOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:85` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:191` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findFileMeta | `src/modules/diagnostics/repositories/lab-portal.repository.ts:186` |
| `diagnostic_units.diagnostic_service_categories` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalRepository.findCategories | `src/modules/diagnostics/repositories/lab-portal.repository.ts:247` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalRepository.findOfferings | `src/modules/diagnostics/repositories/lab-portal.repository.ts:229` |
| `diagnostic_units.diagnostic_units` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalRepository.findOfferings | `src/modules/diagnostics/repositories/lab-portal.repository.ts:223` |
| `diagnostics.accession_specimens` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findAccessionItems | `src/modules/diagnostics/repositories/lab-portal.repository.ts:136` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findAccessions | `src/modules/diagnostics/repositories/lab-portal.repository.ts:112` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:125` |
| `diagnostics.service_request_performer_events` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalEventsRepository.findLatestByOrders | `src/modules/diagnostics/repositories/lab-portal-events.repository.ts:31` |
| `diagnostics.specimen_rejection_events` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findRejections | `src/modules/diagnostics/repositories/lab-portal.repository.ts:147` |
| `directory.tenants` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabReceptionRepository.findTenantNames | `src/modules/diagnostics/repositories/lab-reception.repository.ts:206` |
| `iam.users` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabPortalRepository.findUserNames | `src/modules/diagnostics/repositories/lab-portal.repository.ts:213` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsLabPortalController.getSummary → LabPortalSummaryService.summary → LabPortalSnapshotService.loadAll → LabPortalSnapshotService.load → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LabSummaryDto>` · DTO `LabSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `labName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:34` |
| `published` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:35` |
| `drafts` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:36` |
| `withdrawn` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:37` |
| `unavailable` | `number` | Sí | — | — | Services (not withdrawn) switched off with "available today" = false | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:42` |
| `ordersWithoutResults` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:43` |
| `resultFiles` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:44` |
| `resultBytes` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:45` |
| `byCategory` | `array<LabCategoryCountDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:47` |
| `byCategory[].categoryId` | `string` | Sí | formato uuid; admite null | — | Null for the «Sin categoría» bucket | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:27` |
| `byCategory[].category` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:28` |
| `byCategory[].count` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:29` |
| `recentActivity` | `array<LabActivityEntryDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:49` |
| `recentActivity[].id` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:14` |
| `recentActivity[].at` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:15` |
| `recentActivity[].kind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof LAB_ACTIVITY_KINDS)[number] | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:16` |
| `recentActivity[].text` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/lab-portal-summary.dto.ts:17` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab-portal.controller.spec.ts:58` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabPortalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. GET /diagnostics/patients/{patientProfileId}/imaging-studies

- **Origen:** CONTRATO
- **Nombre:** Listar los estudios de imagen del paciente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsImagingController.listStudies` — `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:67`

### Qué es y para qué sirve (negocio)

Listar los estudios de imagen del paciente. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/patients/{patientProfileId}/imaging-studies` la atiende `DiagnosticsImagingController.listStudies` (src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:67). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `DiagnosticsImagingService.listStudiesByPatient`. Lee authz.care_relationships, diagnostics.imaging_studies, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | offset (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:67` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.care_relationships` | LEE | LEE | DIRECTA | DiagnosticsImagingController.listStudies → DiagnosticsImagingService.listStudiesByPatient → DiagnosticsPatientAccessService.assertCanReadPatient → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:101` |
| `diagnostics.imaging_studies` | LEE | LEE | DIRECTA | DiagnosticsImagingController.listStudies → DiagnosticsImagingService.listStudiesByPatient → ImagingRepository.findStudiesByPatient | `src/modules/diagnostics/repositories/imaging.repository.ts:134` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | DiagnosticsImagingController.listStudies → DiagnosticsImagingService.listStudiesByPatient → DiagnosticsPatientAccessService.assertCanReadPatient → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsImagingController.listStudies → DiagnosticsImagingService.listStudiesByPatient → DiagnosticsPatientAccessService.assertCanReadPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.spec.ts:53` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsImagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. GET /diagnostics/patients/{patientProfileId}/orders

- **Origen:** CONTRATO
- **Nombre:** Órdenes de laboratorio e imagenología del paciente, con sus informes
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsOrdersController.getPatientOrders` — `src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:72`

### Qué es y para qué sirve (negocio)

Órdenes de laboratorio e imagenología del paciente, con sus informes. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/patients/{patientProfileId}/orders` la atiende `DiagnosticsOrdersController.getPatientOrders` (src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:72). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `DiagnosticsOrdersService.getPatientOrders`. Lee clinical.diagnostic_reports, clinical.encounters, clinical.service_request_notes, clinical.service_requests, diagnostics.diagnostic_release_events, practice.care_spaces, practice.practice_sites, profiles.person_account_links y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:72` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:72` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getPatientOrders → DiagnosticsOrdersService.getPatientOrders → DiagnosticOrdersRepository.findReportsByPatient | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:80` |
| `clinical.encounters` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getPatientOrders → DiagnosticsOrdersService.getPatientOrders → ClinicalScopeFilterService.build → ClinicalScopeRepository.findEncounterIds | `src/modules/clinical/repositories/clinical-scope.repository.ts:70` |
| `clinical.service_request_notes` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getPatientOrders → DiagnosticsOrdersService.getPatientOrders → ServiceRequestNotesService.noteIdsFor | `src/modules/clinical/services/service-request-notes.service.ts:160` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getPatientOrders → DiagnosticsOrdersService.getPatientOrders → DiagnosticOrdersRepository.findOrdersByPatient | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:49` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getPatientOrders → DiagnosticsOrdersService.getPatientOrders → RequesterReportsReader.visibilityOf → ReportsRepository.findReleaseEventsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:444` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | DiagnosticsOrdersController.getPatientOrders → DiagnosticsOrdersService.getPatientOrders | `src/modules/diagnostics/services/diagnostics-orders.service.ts:159` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getPatientOrders → DiagnosticsOrdersService.getPatientOrders → SuggestedSiteNamesReader.namesFor | `src/modules/clinical/services/suggested-site-names.reader.ts:31` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getPatientOrders → DiagnosticsOrdersService.getPatientOrders → ClinicalScopeFilterService.build → PersonAccountLinksRepository.findActiveUserIdsByPersons | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:122` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getPatientOrders → DiagnosticsOrdersService.getPatientOrders → ClinicalScopeFilterService.build → PractitionerSpecialtiesRepository.findProfileIdsBySpecialties | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:214` |

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
| `patientProfileId` | `string` | Sí | formato uuid | — | Paciente leído. | `src/modules/diagnostics/dto/orders.dto.ts:165` |
| `orders` | `array<DiagnosticOrderSummaryDto>` | Sí | — | — | Órdenes de laboratorio e imagenología, de la más nueva a la más vieja. | `src/modules/diagnostics/dto/orders.dto.ts:169` |
| `orders[].id` | `string` | Sí | formato uuid | — | Identificador de la orden. | `src/modules/diagnostics/dto/orders.dto.ts:23` |
| `orders[].patientProfileId` | `string` | Sí | formato uuid | — | Paciente al que pertenece. | `src/modules/diagnostics/dto/orders.dto.ts:26` |
| `orders[].encounterId` | `string` | No | formato uuid | — | Encuentro en el que se pidió, si se pidió durante uno. | `src/modules/diagnostics/dto/orders.dto.ts:29` |
| `orders[].formInstanceId` | `string` | No | formato uuid | — | P43: instancia del formulario médico de la que salió la orden, si salió de uno. | `src/modules/diagnostics/dto/orders.dto.ts:32` |
| `orders[].reasonConditionId` | `string` | No | formato uuid | — | v4295: diagnóstico que el estudio se pidió para confirmar, descartar o seguir; ausente si no lo declara. | `src/modules/diagnostics/dto/orders.dto.ts:35` |
| `orders[].codeConceptId` | `string` | Sí | formato uuid | — | Qué se pidió (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:38` |
| `orders[].categoryConceptId` | `string` | No | formato uuid | — | Laboratorio o imagenología (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:41` |
| `orders[].category` | `object` | No | — | — | P40: categoría de análisis derivada del concepto; ausente = sin clasificar. | `src/modules/diagnostics/dto/orders.dto.ts:45` |
| `orders[].basedOnNoteIds` | `array<string>` | Sí | formato uuid | — | P40: notas médicas que motivan la orden, en el orden en que se citaron. | `src/modules/diagnostics/dto/orders.dto.ts:49` |
| `orders[].statusConceptId` | `string` | Sí | formato uuid | — | Estado de la orden (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:52` |
| `orders[].priorityConceptId` | `string` | No | formato uuid | — | Prioridad (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:55` |
| `orders[].requesterProfileId` | `string` | No | formato uuid | — | Profesional que la solicitó. | `src/modules/diagnostics/dto/orders.dto.ts:58` |
| `orders[].performerSelectionConceptId` | `string` | Sí | formato uuid; admite null | — | Modo de ejecutor recomendado (concept id); `null` en una orden anterior a ese dato. | `src/modules/diagnostics/dto/orders.dto.ts:62` |
| `orders[].performerPractitionerProfileId` | `string` | Sí | formato uuid; admite null | — | Médico ejecutor («lo hago yo»), o `null`. | `src/modules/diagnostics/dto/orders.dto.ts:66` |
| `orders[].suggestedPracticeSiteId` | `string` | Sí | formato uuid; admite null | — | Sede sugerida, o `null`. | `src/modules/diagnostics/dto/orders.dto.ts:70` |
| `orders[].suggestedPracticeSiteName` | `string` | Sí | admite null | — | Nombre de la sede sugerida, o `null`. | `src/modules/diagnostics/dto/orders.dto.ts:74` |
| `orders[].suggestedCareSpace` | `object` | No | admite null | — | Punto de toma sugerido (F5b) | `src/modules/diagnostics/dto/orders.dto.ts:81` |
| `orders[].suggestedCareSpace.id` | `string` | No | — | — | — | sin fuente |
| `orders[].suggestedCareSpace.code` | `string` | No | — | — | — | sin fuente |
| `orders[].suggestedCareSpace.name` | `string` | No | — | — | — | sin fuente |
| `orders[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se pidió. | `src/modules/diagnostics/dto/orders.dto.ts:84` |
| `orders[].previousDiagnosticReportId` | `string` | No | formato uuid | — | El informe previo que satisface este pedido (antiduplicación, v4.2.17). Presente cuando el médico eligió reutilizar o repetir un estudio duplicado; `undefined` en cualquier otro caso. | `src/modules/diagnostics/dto/orders.dto.ts:91` |
| `orders[].duplicateOverrideReason` | `string` | No | — | — | Justificación del médico si repitió un estudio duplicado (antiduplicación). | `src/modules/diagnostics/dto/orders.dto.ts:94` |
| `reports` | `array<DiagnosticReportSummaryDto>` | Sí | — | — | Informes diagnósticos, de la más nueva a la más vieja. | `src/modules/diagnostics/dto/orders.dto.ts:173` |
| `reports[].id` | `string` | Sí | formato uuid | — | Identificador del informe. | `src/modules/diagnostics/dto/orders.dto.ts:107` |
| `reports[].patientProfileId` | `string` | Sí | formato uuid | — | Paciente al que pertenece. | `src/modules/diagnostics/dto/orders.dto.ts:110` |
| `reports[].serviceRequestId` | `string` | No | formato uuid | — | Orden que lo originó, si cuelga de una. | `src/modules/diagnostics/dto/orders.dto.ts:113` |
| `reports[].encounterId` | `string` | No | formato uuid | — | Encuentro asociado, si lo hay. | `src/modules/diagnostics/dto/orders.dto.ts:116` |
| `reports[].codeConceptId` | `string` | Sí | formato uuid | — | Qué informa (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:119` |
| `reports[].categoryConceptId` | `string` | No | formato uuid | — | Categoría (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:122` |
| `reports[].lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Estado del ciclo de vida (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:125` |
| `reports[].currentVersionId` | `string` | No | formato uuid | — | Versión vigente, esté liberada o no. | `src/modules/diagnostics/dto/orders.dto.ts:128` |
| `reports[].currentReleasedVersionId` | `string` | No | formato uuid | — | Versión liberada al paciente, si alguna lo está. | `src/modules/diagnostics/dto/orders.dto.ts:131` |
| `reports[].resultReleaseStatusConceptId` | `string` | No | formato uuid | — | Estado de liberación de resultados (concept id). | `src/modules/diagnostics/dto/orders.dto.ts:135` |
| `reports[].releasedVersionId` | `string` | Sí | formato uuid; admite null | — | Released version whose patient visibility `patientVisibility` reports. | `src/modules/diagnostics/dto/orders.dto.ts:139` |
| `reports[].patientVisibility` | `object` | Sí | — | — | Latest release event of that version: `HELD` means the requester still has to release it (`POST /diagnostics/reports/:id/patient-release`). | `src/modules/diagnostics/dto/orders.dto.ts:146` |
| `reports[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se emitió. | `src/modules/diagnostics/dto/orders.dto.ts:149` |
| `limit` | `number` | Sí | — | — | Tope aplicado a cada bloque. | `src/modules/diagnostics/dto/orders.dto.ts:176` |
| `truncated` | `array<string>` | Sí | — | — | Bloques que quedaron recortados por el tope. | `src/modules/diagnostics/dto/orders.dto.ts:179` |

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
| INTEGRACION | `test/integration/p40-orden-basada-en-notas.int-spec.ts:304` |
| INTEGRACION | `test/integration/report-drafts.int-spec.ts:389` |
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-orders.controller.spec.ts:58` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. GET /diagnostics/patients/{patientProfileId}/reports/{reportId}

- **Origen:** CONTRATO
- **Nombre:** Resultado liberado de un informe del paciente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsOrdersController.getReleasedResult` — `src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:120`

### Qué es y para qué sirve (negocio)

Resultado liberado de un informe del paciente. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/patients/{patientProfileId}/reports/{reportId}` la atiende `DiagnosticsOrdersController.getReleasedResult` (src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:120). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `DiagnosticsPractitionerResultsService.getReleasedResult`. Lee clinical.diagnostic_reports, clinical.encounters, clinical.observation_reference_ranges, clinical.observations, clinical.service_requests, common.files, diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_files y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:120` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId, reportId | `src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:120` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResult → DiagnosticsPractitionerResultsService.getReleasedResult → DiagnosticsPractitionerResultsService.readVisible | `src/modules/diagnostics/services/diagnostics-practitioner-results.service.ts:249` |
| `clinical.encounters` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResult → DiagnosticsPractitionerResultsService.getReleasedResult → DiagnosticsPractitionerResultsService.readVisible → ClinicalScopeFilterService.build → ClinicalScopeRepository.findEncounterIds | `src/modules/clinical/repositories/clinical-scope.repository.ts:70` |
| `clinical.observation_reference_ranges` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResult → DiagnosticsPractitionerResultsService.getReleasedResult → DiagnosticsPractitionerResultsService.project → ClinicalRefsRepository.findReferenceRanges | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:66` |
| `clinical.observations` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResult → DiagnosticsPractitionerResultsService.getReleasedResult → DiagnosticsPractitionerResultsService.project → ClinicalRefsRepository.findObservations | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:54` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResult → DiagnosticsPractitionerResultsService.getReleasedResult → DiagnosticsPractitionerResultsService.readVisible → RequesterReportsReader.readIssued → RequesterReportsReader.issuedWhere | `src/modules/diagnostics/services/requester-reports.reader.ts:118` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResult → DiagnosticsPractitionerResultsService.getReleasedResult → DiagnosticsPractitionerResultsService.project → ClinicalRefsRepository.findFiles | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:76` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResult → DiagnosticsPractitionerResultsService.getReleasedResult → DiagnosticsPractitionerResultsService.project → DiagnosticsPractitionerResultsService.requireReleased → ReportsRepository.findReleaseEventsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:444` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResult → DiagnosticsPractitionerResultsService.getReleasedResult → DiagnosticsPractitionerResultsService.project → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_results` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResult → DiagnosticsPractitionerResultsService.getReleasedResult → DiagnosticsPractitionerResultsService.project → ReportsRepository.findResultsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:490` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResult → DiagnosticsPractitionerResultsService.getReleasedResult → DiagnosticsPractitionerResultsService.project → DiagnosticsPractitionerResultsService.requireReleased → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResult → DiagnosticsPractitionerResultsService.getReleasedResult → DiagnosticsPractitionerResultsService.readVisible → ClinicalScopeFilterService.build → PersonAccountLinksRepository.findActiveUserIdsByPersons | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:122` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResult → DiagnosticsPractitionerResultsService.getReleasedResult → DiagnosticsPractitionerResultsService.readVisible → ClinicalScopeFilterService.build → PractitionerSpecialtiesRepository.findProfileIdsBySpecialties | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:214` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResult → DiagnosticsPractitionerResultsService.getReleasedResult → DiagnosticsPractitionerResultsService.project → ClinicalRefsRepository.findConceptLabels | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:85` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |
| `reportId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerDiagnosticResultDto>` · DTO `PractitionerDiagnosticResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reportId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/orders.dto.ts:315` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/orders.dto.ts:318` |
| `serviceRequestId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:322` |
| `codeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/orders.dto.ts:325` |
| `codeDisplay` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:328` |
| `categoryConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:332` |
| `versionId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/orders.dto.ts:335` |
| `versionNumber` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/orders.dto.ts:338` |
| `clinicalStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/orders.dto.ts:341` |
| `issuedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:345` |
| `releasedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/orders.dto.ts:348` |
| `patientVisible` | `boolean` | Sí | — | — | — | `src/modules/diagnostics/dto/orders.dto.ts:351` |
| `conclusionText` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:354` |
| `values` | `array<DiagnosticResultValueDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/orders.dto.ts:358` |
| `values[].observationId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/orders.dto.ts:223` |
| `values[].codeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/orders.dto.ts:226` |
| `values[].name` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:229` |
| `values[].value` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:236` |
| `values[].valueKind` | `string` | Sí | valores: QUANTITY, DECIMAL, INTEGER, TEXT, BOOLEAN, CONCEPT, DATETIME, DATE; admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:240` |
| `values[].valueConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:244` |
| `values[].unitConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:248` |
| `values[].unit` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:251` |
| `values[].referenceRange` | `DiagnosticResultReferenceRangeDto` | Sí | admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:258` |
| `values[].referenceRange.low` | `string` | Sí | admite null | — | — | sin fuente |
| `values[].referenceRange.high` | `string` | Sí | admite null | — | — | sin fuente |
| `values[].referenceRange.text` | `string` | Sí | admite null | — | — | sin fuente |
| `values[].referenceRange.unitConceptId` | `string` | Sí | formato uuid; admite null | — | — | sin fuente |
| `values[].referenceRange.unit` | `string` | Sí | admite null | — | — | sin fuente |
| `values[].interpretationConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:262` |
| `values[].interpretationCode` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:266` |
| `values[].interpretation` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:270` |
| `values[].statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/orders.dto.ts:273` |
| `values[].effectiveAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:277` |
| `files` | `array<DiagnosticResultFileSummaryDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/orders.dto.ts:362` |
| `files[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/orders.dto.ts:283` |
| `files[].fileId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/orders.dto.ts:289` |
| `files[].name` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:292` |
| `files[].contentRoleConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/orders.dto.ts:295` |
| `files[].presentationFormatConceptId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:299` |
| `files[].ordinal` | `number` | Sí | admite null | — | — | `src/modules/diagnostics/dto/orders.dto.ts:302` |

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
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-orders.controller.spec.ts:101` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 37. GET /diagnostics/patients/{patientProfileId}/reports/{reportId}/files/{fileId}/content

- **Origen:** CONTRATO
- **Nombre:** Descargar un archivo del resultado liberado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsOrdersController.getReleasedResultFileContent` — `src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:162`

### Qué es y para qué sirve (negocio)

Descargar un archivo del resultado liberado. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/patients/{patientProfileId}/reports/{reportId}/files/{fileId}/content` la atiende `DiagnosticsOrdersController.getReleasedResultFileContent` (src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:162). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `DiagnosticsPractitionerResultsService.getReleasedResultFileContent`. Lee clinical.diagnostic_reports, clinical.encounters, clinical.service_requests, common.file_versions, common.files, diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:162` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId, reportId, fileId | `src/modules/diagnostics/controllers/diagnostics-orders.controller.ts:162` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.readVisible | `src/modules/diagnostics/services/diagnostics-practitioner-results.service.ts:249` |
| `clinical.encounters` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.readVisible → ClinicalScopeFilterService.build → ClinicalScopeRepository.findEncounterIds | `src/modules/clinical/repositories/clinical-scope.repository.ts:70` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.readVisible → RequesterReportsReader.readIssued → RequesterReportsReader.issuedWhere | `src/modules/diagnostics/services/requester-reports.reader.ts:118` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.getReleasedResultFileContent → FileUploadService.downloadForAuthorizedContext → FileUploadService.serveCurrentVersion → AttachableFileService.assertUsableForAuthorizedContext → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.getReleasedResultFileContent → FileUploadService.downloadForAuthorizedContext → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.requireReleased → ReportsRepository.findReleaseEventsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:444` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.getReleasedResultFileContent → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.requireReleased → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.readVisible → ClinicalScopeFilterService.build → PersonAccountLinksRepository.findActiveUserIdsByPersons | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:122` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | DiagnosticsOrdersController.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.getReleasedResultFileContent → DiagnosticsPractitionerResultsService.readVisible → ClinicalScopeFilterService.build → PractitionerSpecialtiesRepository.findProfileIdsBySpecialties | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:214` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |
| `reportId` | path | Sí | `string` | — |
| `fileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: {labels.notFound}; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La descarga de archivos no está disponible |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: S3 object body is empty |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-orders.controller.spec.ts:118` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. POST /diagnostics/report-drafts

- **Origen:** CONTRATO
- **Nombre:** Abrir (u obtener) el borrador del informe de una orden
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportDraftsController.open` — `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:73`

### Qué es y para qué sirve (negocio)

Abrir (u obtener) el borrador del informe de una orden. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/report-drafts` la atiende `DiagnosticsReportDraftsController.open` (src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:73). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateReportDraftDto` (1 campo, 1 obligatorio). Delega en `ReportDraftsService.open`. Crea filas en diagnostics.report_drafts. Lee clinical.service_requests, diagnostics.diagnostic_report_files, diagnostics.report_draft_files, diagnostics.report_drafts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.open → ReportDraftsService.open → ReportDraftsService.reportableOrder | `src/modules/diagnostics/services/report-drafts.service.ts:67` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.open → ReportDraftsService.open → ReportDraftsService.toDto → ReportDraftsRepository.findOfficialFileId | `src/modules/diagnostics/repositories/report-drafts.repository.ts:56` |
| `diagnostics.report_draft_files` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.open → ReportDraftsService.open → ReportDraftsService.toDto → ReportDraftsRepository.findFiles | `src/modules/diagnostics/repositories/report-drafts.repository.ts:64` |
| `diagnostics.report_drafts` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportDraftsController.open → ReportDraftsService.open | `src/modules/diagnostics/services/report-drafts.service.ts:115` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.open → ReportDraftsService.open → ReportDraftsRepository.findByOrder | `src/modules/diagnostics/repositories/report-drafts.repository.ts:32` |

### Cuerpo — DTO `CreateReportDraftDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `serviceRequestId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/diagnostics/dto/report-draft-write.dto.ts:21` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "serviceRequestId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "serviceRequestId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ReportDraftDto>` · DTO `ReportDraftDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:20` |
| `serviceRequestId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:21` |
| `status` | `string` | Sí | valores: DRAFT, PUBLISHED | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:23` |
| `body` | `object` | Sí | — | — | `{ version: 1, blocks: Block[] }` with heading, paragraph and list blocks. | `src/modules/diagnostics/dto/report-draft.dto.ts:30` |
| `conclusionText` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:31` |
| `signerProfileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:33` |
| `patientVisibility` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof REPORT_PATIENT_VISIBILITIES)[number] | `src/modules/diagnostics/dto/report-draft.dto.ts:35` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:36` |
| `diagnosticReportId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:38` |
| `publishedVersionId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:40` |
| `officialFileId` | `string` | Sí | formato uuid; admite null | — | File id of the official PDF; null until published. | `src/modules/diagnostics/dto/report-draft.dto.ts:47` |
| `publishedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:49` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:50` |
| `files` | `array<ReportDraftFileDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:51` |
| `files[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:12` |
| `files[].fileId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:13` |
| `files[].role` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof REPORT_DRAFT_FILE_ROLES)[number] | `src/modules/diagnostics/dto/report-draft.dto.ts:14` |
| `files[].ordinal` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:15` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/report-drafts.int-spec.ts:173` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReportDraftsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 39. GET /diagnostics/report-drafts/{id}

- **Origen:** CONTRATO
- **Nombre:** Borrador del informe
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportDraftsController.get` — `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:90`

### Qué es y para qué sirve (negocio)

Borrador del informe. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/report-drafts/{id}` la atiende `DiagnosticsReportDraftsController.get` (src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:90). Exige sesión; el controlador no declara roles. Delega en `ReportDraftsService.get`. Lee clinical.service_requests, diagnostics.diagnostic_report_files, diagnostics.report_draft_files, diagnostics.report_drafts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:90` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.get → ReportDraftsService.get → ReportDraftsService.load → ReportDraftsService.reportableOrder | `src/modules/diagnostics/services/report-drafts.service.ts:67` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.get → ReportDraftsService.get → ReportDraftsService.toDto → ReportDraftsRepository.findOfficialFileId | `src/modules/diagnostics/repositories/report-drafts.repository.ts:56` |
| `diagnostics.report_draft_files` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.get → ReportDraftsService.get → ReportDraftsService.toDto → ReportDraftsRepository.findFiles | `src/modules/diagnostics/repositories/report-drafts.repository.ts:64` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.get → ReportDraftsService.get → ReportDraftsService.load → ReportDraftsRepository.findById | `src/modules/diagnostics/repositories/report-drafts.repository.ts:24` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReportDraftDto>` · DTO `ReportDraftDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:20` |
| `serviceRequestId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:21` |
| `status` | `string` | Sí | valores: DRAFT, PUBLISHED | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:23` |
| `body` | `object` | Sí | — | — | `{ version: 1, blocks: Block[] }` with heading, paragraph and list blocks. | `src/modules/diagnostics/dto/report-draft.dto.ts:30` |
| `conclusionText` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:31` |
| `signerProfileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:33` |
| `patientVisibility` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof REPORT_PATIENT_VISIBILITIES)[number] | `src/modules/diagnostics/dto/report-draft.dto.ts:35` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:36` |
| `diagnosticReportId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:38` |
| `publishedVersionId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:40` |
| `officialFileId` | `string` | Sí | formato uuid; admite null | — | File id of the official PDF; null until published. | `src/modules/diagnostics/dto/report-draft.dto.ts:47` |
| `publishedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:49` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:50` |
| `files` | `array<ReportDraftFileDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:51` |
| `files[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:12` |
| `files[].fileId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:13` |
| `files[].role` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof REPORT_DRAFT_FILE_ROLES)[number] | `src/modules/diagnostics/dto/report-draft.dto.ts:14` |
| `files[].ordinal` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:15` |

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
| INTEGRACION | `test/integration/report-drafts.int-spec.ts:207` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReportDraftsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 40. PUT /diagnostics/report-drafts/{id}

- **Origen:** CONTRATO
- **Nombre:** Guardar el borrador (409 si cambió o ya se publicó)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportDraftsController.update` — `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:100`

### Qué es y para qué sirve (negocio)

Guardar el borrador (409 si cambió o ya se publicó). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PUT /diagnostics/report-drafts/{id}` la atiende `DiagnosticsReportDraftsController.update` (src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:100). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateReportDraftDto` (4 campos, 4 obligatorios). Delega en `ReportDraftsService.update`. Lee clinical.service_requests, diagnostics.diagnostic_report_files, diagnostics.report_draft_files, diagnostics.report_drafts, directory.tenant_memberships, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations, profiles.person_account_links y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:100` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:100` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.update → ReportDraftsService.update → ReportDraftsService.load → ReportDraftsService.reportableOrder | `src/modules/diagnostics/services/report-drafts.service.ts:67` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.update → ReportDraftsService.update → ReportDraftsService.toDto → ReportDraftsRepository.findOfficialFileId | `src/modules/diagnostics/repositories/report-drafts.repository.ts:56` |
| `diagnostics.report_draft_files` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.update → ReportDraftsService.update → ReportDraftsService.toDto → ReportDraftsRepository.findFiles | `src/modules/diagnostics/repositories/report-drafts.repository.ts:64` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.update → ReportDraftsService.update → ReportDraftsService.load → ReportDraftsRepository.findById | `src/modules/diagnostics/repositories/report-drafts.repository.ts:24` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.update → ReportDraftsService.update → ReportSignersService.assertSigner → ReportSignersService.list | `src/modules/diagnostics/services/report-signers.service.ts:39` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.update → ReportDraftsService.update → ReportSignersService.assertSigner → ReportSignersService.list → ReportSignersService.identities | `src/modules/diagnostics/services/report-signers.service.ts:86` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.update → ReportDraftsService.update → ReportSignersService.assertSigner → ReportSignersService.list → ReportSignersService.identities | `src/modules/diagnostics/services/report-signers.service.ts:88` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.update → ReportDraftsService.update → ReportSignersService.assertSigner → ReportSignersService.list | `src/modules/diagnostics/services/report-signers.service.ts:45` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.update → ReportDraftsService.update → ReportSignersService.assertSigner → ReportSignersService.list → ReportSignersService.identities | `src/modules/diagnostics/services/report-signers.service.ts:87` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateReportDraftDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `rowVersion` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | — | `src/modules/diagnostics/dto/report-draft-write.dto.ts:30` |
| `body` | `object` | Sí | — | `@IsObject()` | `{ version: 1, blocks: Block[] }` | `src/modules/diagnostics/dto/report-draft-write.dto.ts:39` |
| `signerProfileId` | `string` | Sí | formato uuid; admite null | `@ValidateIf((_object, value) => value !== null)` `@IsUUID()` | — | `src/modules/diagnostics/dto/report-draft-write.dto.ts:45` |
| `patientVisibility` | `string` | Sí | valores: VISIBLE, HELD | `@IsIn(REPORT_PATIENT_VISIBILITIES)` | — | `src/modules/diagnostics/dto/report-draft-write.dto.ts:49` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "rowVersion": 1,
  "body": {
    "clave": "valor"
  },
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "patientVisibility": "VISIBLE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "rowVersion": 1,
  "body": {
    "clave": "valor"
  },
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "patientVisibility": "VISIBLE"
}
```

</details>

### Respuesta — `Promise<ReportDraftDto>` · DTO `ReportDraftDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:20` |
| `serviceRequestId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:21` |
| `status` | `string` | Sí | valores: DRAFT, PUBLISHED | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:23` |
| `body` | `object` | Sí | — | — | `{ version: 1, blocks: Block[] }` with heading, paragraph and list blocks. | `src/modules/diagnostics/dto/report-draft.dto.ts:30` |
| `conclusionText` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:31` |
| `signerProfileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:33` |
| `patientVisibility` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof REPORT_PATIENT_VISIBILITIES)[number] | `src/modules/diagnostics/dto/report-draft.dto.ts:35` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:36` |
| `diagnosticReportId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:38` |
| `publishedVersionId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:40` |
| `officialFileId` | `string` | Sí | formato uuid; admite null | — | File id of the official PDF; null until published. | `src/modules/diagnostics/dto/report-draft.dto.ts:47` |
| `publishedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:49` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:50` |
| `files` | `array<ReportDraftFileDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:51` |
| `files[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:12` |
| `files[].fileId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:13` |
| `files[].role` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof REPORT_DRAFT_FILE_ROLES)[number] | `src/modules/diagnostics/dto/report-draft.dto.ts:14` |
| `files[].ordinal` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:15` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El firmante elegido no está entre los profesionales de la organización |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/report-drafts.int-spec.ts:211` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReportDraftsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 41. POST /diagnostics/report-drafts/{id}/files

- **Origen:** CONTRATO
- **Nombre:** Adjuntar documento, audio o anexo al borrador
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportDraftsController.attachFile` — `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:117`

### Qué es y para qué sirve (negocio)

Adjuntar documento, audio o anexo al borrador. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/report-drafts/{id}/files` la atiende `DiagnosticsReportDraftsController.attachFile` (src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:117). Exige sesión; el controlador no declara roles. Valida el cuerpo como `AttachReportDraftFileDto` (2 campos, 2 obligatorios). Delega en `ReportDraftsService.attachFile`. Crea filas en diagnostics.report_draft_files. Lee clinical.service_requests, diagnostics.diagnostic_report_files, diagnostics.report_draft_files, diagnostics.report_drafts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:117` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:117` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.attachFile → ReportDraftsService.attachFile → ReportDraftsService.load → ReportDraftsService.reportableOrder | `src/modules/diagnostics/services/report-drafts.service.ts:67` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.attachFile → ReportDraftsService.attachFile → ReportDraftsService.toDto → ReportDraftsRepository.findOfficialFileId | `src/modules/diagnostics/repositories/report-drafts.repository.ts:56` |
| `diagnostics.report_draft_files` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportDraftsController.attachFile → ReportDraftsService.attachFile | `src/modules/diagnostics/services/report-drafts.service.ts:211` |
| `diagnostics.report_draft_files` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.attachFile → ReportDraftsService.attachFile → ReportDraftsRepository.findFiles | `src/modules/diagnostics/repositories/report-drafts.repository.ts:64` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.attachFile → ReportDraftsService.attachFile → ReportDraftsService.load → ReportDraftsRepository.findById | `src/modules/diagnostics/repositories/report-drafts.repository.ts:24` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AttachReportDraftFileDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/diagnostics/dto/report-draft-write.dto.ts:57` |
| `role` | `string` | Sí | valores: DOCUMENT, AUDIO, ANNEX | `@IsIn(REPORT_DRAFT_FILE_ROLES)` | — | `src/modules/diagnostics/dto/report-draft-write.dto.ts:61` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001",
  "role": "DOCUMENT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001",
  "role": "DOCUMENT"
}
```

</details>

### Respuesta — `Promise<ReportDraftDto>` · DTO `ReportDraftDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:20` |
| `serviceRequestId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:21` |
| `status` | `string` | Sí | valores: DRAFT, PUBLISHED | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:23` |
| `body` | `object` | Sí | — | — | `{ version: 1, blocks: Block[] }` with heading, paragraph and list blocks. | `src/modules/diagnostics/dto/report-draft.dto.ts:30` |
| `conclusionText` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:31` |
| `signerProfileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:33` |
| `patientVisibility` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof REPORT_PATIENT_VISIBILITIES)[number] | `src/modules/diagnostics/dto/report-draft.dto.ts:35` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:36` |
| `diagnosticReportId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:38` |
| `publishedVersionId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:40` |
| `officialFileId` | `string` | Sí | formato uuid; admite null | — | File id of the official PDF; null until published. | `src/modules/diagnostics/dto/report-draft.dto.ts:47` |
| `publishedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:49` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:50` |
| `files` | `array<ReportDraftFileDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:51` |
| `files[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:12` |
| `files[].fileId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:13` |
| `files[].role` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof REPORT_DRAFT_FILE_ROLES)[number] | `src/modules/diagnostics/dto/report-draft.dto.ts:14` |
| `files[].ordinal` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:15` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El archivo ya está en el borrador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReportDraftsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 42. DELETE /diagnostics/report-drafts/{id}/files/{draftFileId}

- **Origen:** CONTRATO
- **Nombre:** Quitar un archivo del borrador
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportDraftsController.removeFile` — `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:133`

### Qué es y para qué sirve (negocio)

Quitar un archivo del borrador. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`DELETE /diagnostics/report-drafts/{id}/files/{draftFileId}` la atiende `DiagnosticsReportDraftsController.removeFile` (src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:133). Exige sesión; el controlador no declara roles. Delega en `ReportDraftsService.removeFile`. Borra de diagnostics.report_draft_files. Lee clinical.service_requests, diagnostics.diagnostic_report_files, diagnostics.report_draft_files, diagnostics.report_drafts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:133` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, draftFileId | `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:133` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.removeFile → ReportDraftsService.removeFile → ReportDraftsService.load → ReportDraftsService.reportableOrder | `src/modules/diagnostics/services/report-drafts.service.ts:67` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.removeFile → ReportDraftsService.removeFile → ReportDraftsService.toDto → ReportDraftsRepository.findOfficialFileId | `src/modules/diagnostics/repositories/report-drafts.repository.ts:56` |
| `diagnostics.report_draft_files` | BORRA | BORRA | POR_TIPO | DiagnosticsReportDraftsController.removeFile → ReportDraftsService.removeFile | `src/modules/diagnostics/services/report-drafts.service.ts:240` |
| `diagnostics.report_draft_files` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.removeFile → ReportDraftsService.removeFile | `src/modules/diagnostics/services/report-drafts.service.ts:235` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.removeFile → ReportDraftsService.removeFile → ReportDraftsService.load → ReportDraftsRepository.findById | `src/modules/diagnostics/repositories/report-drafts.repository.ts:24` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `draftFileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReportDraftDto>` · DTO `ReportDraftDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:20` |
| `serviceRequestId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:21` |
| `status` | `string` | Sí | valores: DRAFT, PUBLISHED | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:23` |
| `body` | `object` | Sí | — | — | `{ version: 1, blocks: Block[] }` with heading, paragraph and list blocks. | `src/modules/diagnostics/dto/report-draft.dto.ts:30` |
| `conclusionText` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:31` |
| `signerProfileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:33` |
| `patientVisibility` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof REPORT_PATIENT_VISIBILITIES)[number] | `src/modules/diagnostics/dto/report-draft.dto.ts:35` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:36` |
| `diagnosticReportId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:38` |
| `publishedVersionId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:40` |
| `officialFileId` | `string` | Sí | formato uuid; admite null | — | File id of the official PDF; null until published. | `src/modules/diagnostics/dto/report-draft.dto.ts:47` |
| `publishedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:49` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:50` |
| `files` | `array<ReportDraftFileDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:51` |
| `files[].id` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:12` |
| `files[].fileId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:13` |
| `files[].role` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof REPORT_DRAFT_FILE_ROLES)[number] | `src/modules/diagnostics/dto/report-draft.dto.ts:14` |
| `files[].ordinal` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft.dto.ts:15` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReportDraftsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 43. POST /diagnostics/report-drafts/{id}/preview

- **Origen:** CONTRATO
- **Nombre:** Vista previa en PDF con marca de agua «BORRADOR»
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportPublishController.preview` — `src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts:42`

### Qué es y para qué sirve (negocio)

Vista previa en PDF con marca de agua «BORRADOR». Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/report-drafts/{id}/preview` la atiende `DiagnosticsReportPublishController.preview` (src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts:42). Exige sesión; el controlador no declara roles. Delega en `ReportPublishService.preview`. Lee clinical.service_requests, common.file_versions, common.files, community.public_profiles, diagnostics.report_drafts, diagnostics.report_issuer_settings, directory.tenants, profiles.health_practitioner_profiles y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts:42` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts:42` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.preview → ReportPublishService.preview → ReportDraftsService.load → ReportDraftsService.reportableOrder | `src/modules/diagnostics/services/report-drafts.service.ts:67` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.preview → ReportPublishService.preview → DiagnosticReportPdfService.render → DiagnosticReportPdfService.image → FileUploadService.downloadForAuthorizedContext → FileUploadService.serveCurrentVersion → AttachableFileService.assertUsableForAuthorizedContext → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.preview → ReportPublishService.preview → DiagnosticReportPdfService.render → DiagnosticReportPdfService.image → FileUploadService.downloadForAuthorizedContext → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `community.public_profiles` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.preview → ReportPublishService.preview → DiagnosticReportPdfService.render | `src/modules/diagnostics/services/diagnostic-report-pdf.service.ts:61` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.preview → ReportPublishService.preview → ReportDraftsService.load → ReportDraftsRepository.findById | `src/modules/diagnostics/repositories/report-drafts.repository.ts:24` |
| `diagnostics.report_issuer_settings` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.preview → ReportPublishService.preview → DiagnosticReportPdfService.render → ReportDraftsRepository.findIssuerSettings | `src/modules/diagnostics/repositories/report-drafts.repository.ts:97` |
| `directory.tenants` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.preview → ReportPublishService.preview → DiagnosticReportPdfService.render → LabReceptionRepository.findTenantNames | `src/modules/diagnostics/repositories/lab-reception.repository.ts:206` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.preview → ReportPublishService.preview → DiagnosticReportPdfService.render → ReportSignersService.identities | `src/modules/diagnostics/services/report-signers.service.ts:86` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.preview → ReportPublishService.preview → DiagnosticReportPdfService.render → ReportSignersService.identities | `src/modules/diagnostics/services/report-signers.service.ts:88` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.preview → ReportPublishService.preview → DiagnosticReportPdfService.render → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.preview → ReportPublishService.preview → DiagnosticReportPdfService.render → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.preview → ReportPublishService.preview → DiagnosticReportPdfService.render → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.preview → ReportPublishService.preview → DiagnosticReportPdfService.render → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReportPublishController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 44. POST /diagnostics/report-drafts/{id}/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar el informe: versión inmutable, PDF oficial y liberación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportPublishController.publish` — `src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts:63`

### Qué es y para qué sirve (negocio)

Publicar el informe: versión inmutable, PDF oficial y liberación. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/report-drafts/{id}/publish` la atiende `DiagnosticsReportPublishController.publish` (src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts:63). Exige sesión; el controlador no declara roles. Valida el cuerpo como `PublishReportDraftDto` (2 campos, 2 obligatorios). Delega en `ReportPublishService.publish`. Crea filas en clinical.diagnostic_reports, common.file_versions, common.files, diagnostics.diagnostic_release_events, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions, messaging.in_app_notifications, messaging.notification_deliveries y 2 más. Actualiza clinical.diagnostic_reports, diagnostics.laboratory_work_order_tests, diagnostics.report_drafts, messaging.in_app_notifications, messaging.queued_jobs. Lee clinical.diagnostic_reports, clinical.service_requests, common.file_versions, common.files, community.public_profiles, diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_versions, diagnostics.laboratory_accessions y 20 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts:63` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportPublicationWriter.write → ReportPublicationWriter.createReport → DiagnosticReportsRepository.create | `src/modules/clinical/repositories/diagnostic-reports.repository.ts:77` |
| `clinical.diagnostic_reports` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportPublicationWriter.write → DiagnosticOrdersRepository.markReportReleased | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:287` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportPublicationWriter.findReport | `src/modules/diagnostics/services/report-publication.writer.ts:84` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportDraftsService.load → ReportDraftsService.reportableOrder | `src/modules/diagnostics/services/report-drafts.service.ts:67` |
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → FileUploadService.storeGenerated → FileUploadService.persistBytes → FilesService.createFile → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:142` |
| `common.file_versions` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → DiagnosticReportPdfService.render → DiagnosticReportPdfService.image → FileUploadService.downloadForAuthorizedContext → FileUploadService.serveCurrentVersion → AttachableFileService.assertUsableForAuthorizedContext → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → FileUploadService.storeGenerated → FileUploadService.persistBytes → FilesService.createFile → FilesRepository.create | `src/modules/common/repositories/files.repository.ts:52` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → DiagnosticReportPdfService.render → DiagnosticReportPdfService.image → FileUploadService.downloadForAuthorizedContext → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `community.public_profiles` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → DiagnosticReportPdfService.render | `src/modules/diagnostics/services/diagnostic-report-pdf.service.ts:61` |
| `diagnostics.diagnostic_release_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportPublicationWriter.write → ReportsRepository.recordReleaseEvent | `src/modules/diagnostics/repositories/reports.repository.ts:341` |
| `diagnostics.diagnostic_report_files` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportPublicationWriter.write → ReportsRepository.addFile | `src/modules/diagnostics/repositories/reports.repository.ts:286` |
| `diagnostics.diagnostic_report_files` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportPublicationWriter.write → ReportsRepository.findFilesByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:469` |
| `diagnostics.diagnostic_report_versions` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportPublicationWriter.write | `src/modules/diagnostics/services/report-publication.writer.ts:121` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportPublicationWriter.write → ReportsRepository.findVersionsByReports | `src/modules/diagnostics/repositories/reports.repository.ts:418` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportPublicationWriter.write → ReportPublicationWriter.markTestsReported → LabPortalRepository.findAccessions | `src/modules/diagnostics/repositories/lab-portal.repository.ts:112` |
| `diagnostics.laboratory_work_order_tests` | ESCRIBE | ACTUALIZA | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportPublicationWriter.write → ReportPublicationWriter.markTestsReported | `src/modules/diagnostics/services/report-publication.writer.ts:235` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportPublicationWriter.write → ReportPublicationWriter.markTestsReported → LabPortalRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-portal.repository.ts:125` |
| `diagnostics.report_draft_files` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportPublicationWriter.write → ReportDraftsRepository.findFiles | `src/modules/diagnostics/repositories/report-drafts.repository.ts:64` |
| `diagnostics.report_drafts` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportPublicationWriter.write | `src/modules/diagnostics/services/report-publication.writer.ts:184` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportPublicationWriter.write | `src/modules/diagnostics/services/report-publication.writer.ts:106` |
| `diagnostics.report_issuer_settings` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → DiagnosticReportPdfService.render → ReportDraftsRepository.findIssuerSettings | `src/modules/diagnostics/repositories/report-drafts.repository.ts:97` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportSignersService.assertSigner → ReportSignersService.list | `src/modules/diagnostics/services/report-signers.service.ts:39` |
| `directory.tenants` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → DiagnosticReportPdfService.render → LabReceptionRepository.findTenantNames | `src/modules/diagnostics/repositories/lab-reception.repository.ts:206` |
| `messaging.in_app_notifications` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportNotificationsService.published → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp | `src/modules/messaging/services/notifications.service.ts:1449` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportNotificationsService.published → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:712` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportNotificationsService.published → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:847` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportNotificationsService.published → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:191` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → FileUploadService.storeGenerated → FileUploadService.persistBytes → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:77` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportNotificationsService.published → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:439` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportNotificationsService.published → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:516` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportNotificationsService.published → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:272` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportNotificationsService.published → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:407` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → FileUploadService.storeGenerated → FileUploadService.persistBytes → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:101` |
| `messaging.queued_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsReportPublishController.publish → ReportPublishService.publish → FileUploadService.storeGenerated → FileUploadService.persistBytes → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.reuse → StorageLifecycleCoordinator.change | `src/common/storage/storage-lifecycle-coordinator.service.ts:656` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → FileUploadService.storeGenerated → FileUploadService.persistBytes → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findJobByDedupeKey | `src/modules/messaging/repositories/queues.repository.ts:132` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportNotificationsService.published → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:214` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → DiagnosticReportPdfService.render → ReportSignersService.identities | `src/modules/diagnostics/services/report-signers.service.ts:86` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → DiagnosticReportPdfService.render → ReportSignersService.identities | `src/modules/diagnostics/services/report-signers.service.ts:88` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → DiagnosticReportPdfService.render → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → ReportSignersService.assertSigner → ReportSignersService.list | `src/modules/diagnostics/services/report-signers.service.ts:45` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → DiagnosticReportPdfService.render → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → DiagnosticReportPdfService.render → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.publish → ReportPublishService.publish → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishReportDraftDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `rowVersion` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | — | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:13` |
| `confirmIrreversible` | `boolean` | Sí | valores: true | `@Equals(true, { message: 'Confirme que la publicación es irreversible' })` | — | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:18` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "rowVersion": 1,
  "confirmIrreversible": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "rowVersion": 1,
  "confirmIrreversible": true
}
```

</details>

### Respuesta — `Promise<PublishedReportDto>` · DTO `PublishedReportDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reportId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:23` |
| `versionId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:24` |
| `officialFileId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:25` |
| `status` | `string` | Sí | valores: PUBLISHED | — | — | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:26` |
| `patientVisibility` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof REPORT_PATIENT_VISIBILITIES)[number] | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:28` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Solo el profesional firmante puede publicar el informe con su firma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Para publicar hacen falta un firmante y el texto del informe; PreconditionFailedException: El firmante elegido no está entre los profesionales de la organización; PreconditionFailedException: El artefacto generado no tiene contenido; PreconditionFailedException: El artefacto generado excede el tamaño máximo permitido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: WRITE_RESERVATION_REQUIRED |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/report-drafts.int-spec.ts:239` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReportPublishController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 45. POST /diagnostics/report-drafts/{id}/signature-request

- **Origen:** CONTRATO
- **Nombre:** Pedir al firmante elegido que revise y publique con su firma
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportPublishController.requestSignature` — `src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts:81`

### Qué es y para qué sirve (negocio)

Pedir al firmante elegido que revise y publique con su firma. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/report-drafts/{id}/signature-request` la atiende `DiagnosticsReportPublishController.requestSignature` (src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts:81). Exige sesión; el controlador no declara roles. Delega en `ReportPublishService.requestSignature`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza messaging.in_app_notifications. Lee clinical.service_requests, diagnostics.report_drafts, directory.tenant_memberships, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.provider_channel_configs, messaging.recipient_preferences y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-report-publish.controller.ts:81` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportDraftsService.load → ReportDraftsService.reportableOrder | `src/modules/diagnostics/services/report-drafts.service.ts:67` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportDraftsService.load → ReportDraftsRepository.findById | `src/modules/diagnostics/repositories/report-drafts.repository.ts:24` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportSignersService.assertSigner → ReportSignersService.list | `src/modules/diagnostics/services/report-signers.service.ts:39` |
| `messaging.in_app_notifications` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportNotificationsService.signatureRequested → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp | `src/modules/messaging/services/notifications.service.ts:1449` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportNotificationsService.signatureRequested → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:712` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportNotificationsService.signatureRequested → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:847` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportNotificationsService.signatureRequested → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:191` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportNotificationsService.signatureRequested → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:439` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportNotificationsService.signatureRequested → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:516` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportNotificationsService.signatureRequested → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:272` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportNotificationsService.signatureRequested → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:407` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportNotificationsService.signatureRequested → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:214` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportSignersService.assertSigner → ReportSignersService.list → ReportSignersService.identities | `src/modules/diagnostics/services/report-signers.service.ts:86` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportSignersService.assertSigner → ReportSignersService.list → ReportSignersService.identities | `src/modules/diagnostics/services/report-signers.service.ts:88` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportSignersService.assertSigner → ReportSignersService.list | `src/modules/diagnostics/services/report-signers.service.ts:45` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → ReportSignersService.assertSigner → ReportSignersService.list → ReportSignersService.identities | `src/modules/diagnostics/services/report-signers.service.ts:87` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsReportPublishController.requestSignature → ReportPublishService.requestSignature → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<{ readonly requested: true }>` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Para pedir la firma hacen falta un firmante y el texto del informe; PreconditionFailedException: El firmante elegido no está entre los profesionales de la organización |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/report-drafts.int-spec.ts:257` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReportPublishController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 46. GET /diagnostics/report-drafts/signers

- **Origen:** CONTRATO
- **Nombre:** Profesionales que pueden firmar informes
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportDraftsController.listSigners` — `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:50`

### Qué es y para qué sirve (negocio)

Profesionales que pueden firmar informes. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/report-drafts/signers` la atiende `DiagnosticsReportDraftsController.listSigners` (src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:50). Exige sesión; el controlador no declara roles. Delega en `ReportSignersService.list`, `EntityManager.fork`. Lee directory.tenant_memberships, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations, profiles.person_account_links, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-report-drafts.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.listSigners → ReportSignersService.list | `src/modules/diagnostics/services/report-signers.service.ts:39` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.listSigners → ReportSignersService.list → ReportSignersService.identities | `src/modules/diagnostics/services/report-signers.service.ts:86` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.listSigners → ReportSignersService.list → ReportSignersService.identities | `src/modules/diagnostics/services/report-signers.service.ts:88` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.listSigners → ReportSignersService.list | `src/modules/diagnostics/services/report-signers.service.ts:45` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsReportDraftsController.listSigners → ReportSignersService.list → ReportSignersService.identities | `src/modules/diagnostics/services/report-signers.service.ts:87` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReportSignerListDto>` · DTO `ReportSignerListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ReportSignerDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/report-signers.dto.ts:14` |
| `items[].profileId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-signers.dto.ts:5` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/report-signers.dto.ts:6` |
| `items[].registration` | `string` | Sí | admite null | — | National registration (matrícula), if declared. | `src/modules/diagnostics/dto/report-signers.dto.ts:8` |
| `items[].hasSignature` | `boolean` | Sí | — | — | — | `src/modules/diagnostics/dto/report-signers.dto.ts:9` |
| `items[].hasSeal` | `boolean` | Sí | — | — | — | `src/modules/diagnostics/dto/report-signers.dto.ts:10` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/report-drafts.int-spec.ts:197` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReportDraftsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 47. GET /diagnostics/report-issuer-settings

- **Origen:** CONTRATO
- **Nombre:** Firma, sello y responsable de los informes
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportReleaseController.getSettings` — `src/modules/diagnostics/controllers/diagnostics-report-release.controller.ts:58`

### Qué es y para qué sirve (negocio)

Firma, sello y responsable de los informes. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/report-issuer-settings` la atiende `DiagnosticsReportReleaseController.getSettings` (src/modules/diagnostics/controllers/diagnostics-report-release.controller.ts:58). Exige sesión; el controlador no declara roles. Delega en `ReportIssuerSettingsService.get`. Lee diagnostics.report_issuer_settings, directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-report-release.controller.ts:58` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.report_issuer_settings` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.getSettings → ReportIssuerSettingsService.get → ReportDraftsRepository.findIssuerSettings | `src/modules/diagnostics/repositories/report-drafts.repository.ts:97` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.getSettings → ReportIssuerSettingsService.get → TenantAdministrationService.assertCanRead → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:76` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReportIssuerSettingsDto>` · DTO `ReportIssuerSettingsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `signatureFileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-issuer-settings.dto.ts:40` |
| `sealFileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-issuer-settings.dto.ts:42` |
| `responsibleName` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/report-issuer-settings.dto.ts:43` |
| `responsibleTitle` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/report-issuer-settings.dto.ts:46` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere pertenecer a la organización, o ser administrador de la plataforma |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReportReleaseController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 48. PUT /diagnostics/report-issuer-settings

- **Origen:** CONTRATO
- **Nombre:** Cambiar firma, sello y responsable (OWNER/ADMIN)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportReleaseController.setSettings` — `src/modules/diagnostics/controllers/diagnostics-report-release.controller.ts:67`

### Qué es y para qué sirve (negocio)

Cambiar firma, sello y responsable (OWNER/ADMIN). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PUT /diagnostics/report-issuer-settings` la atiende `DiagnosticsReportReleaseController.setSettings` (src/modules/diagnostics/controllers/diagnostics-report-release.controller.ts:67). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateReportIssuerSettingsDto` (4 campos, 4 obligatorios). Delega en `ReportIssuerSettingsService.set`. Crea filas en diagnostics.report_issuer_settings. Lee diagnostics.report_issuer_settings, directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-report-release.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.report_issuer_settings` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportReleaseController.setSettings → ReportIssuerSettingsService.set | `src/modules/diagnostics/services/report-issuer-settings.service.ts:71` |
| `diagnostics.report_issuer_settings` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.setSettings → ReportIssuerSettingsService.set → ReportDraftsRepository.findIssuerSettings | `src/modules/diagnostics/repositories/report-drafts.repository.ts:97` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.setSettings → ReportIssuerSettingsService.set → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:76` |

### Cuerpo — DTO `UpdateReportIssuerSettingsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `signatureFileId` | `string` | Sí | formato uuid; admite null | `@ValidateIf((_object, value) => value !== null)` `@IsUUID()` | — | `src/modules/diagnostics/dto/report-issuer-settings.dto.ts:14` |
| `sealFileId` | `string` | Sí | formato uuid; admite null | `@ValidateIf((_object, value) => value !== null)` `@IsUUID()` | — | `src/modules/diagnostics/dto/report-issuer-settings.dto.ts:20` |
| `responsibleName` | `string` | Sí | longitud máxima 120; admite null | `@Transform(trimOrNull)` `@ValidateIf((_object, value) => value !== null)` `@IsString()` `@MaxLength(120)` | — | `src/modules/diagnostics/dto/report-issuer-settings.dto.ts:27` |
| `responsibleTitle` | `string` | Sí | longitud máxima 120; admite null | `@Transform(trimOrNull)` `@ValidateIf((_object, value) => value !== null)` `@IsString()` `@MaxLength(120)` | — | `src/modules/diagnostics/dto/report-issuer-settings.dto.ts:34` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "signatureFileId": "00000000-0000-4000-8000-000000000001",
  "sealFileId": "00000000-0000-4000-8000-000000000001",
  "responsibleName": "Nombre de ejemplo",
  "responsibleTitle": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "signatureFileId": "00000000-0000-4000-8000-000000000001",
  "sealFileId": "00000000-0000-4000-8000-000000000001",
  "responsibleName": "Nombre de ejemplo",
  "responsibleTitle": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ReportIssuerSettingsDto>` · DTO `ReportIssuerSettingsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `signatureFileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-issuer-settings.dto.ts:40` |
| `sealFileId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/diagnostics/dto/report-issuer-settings.dto.ts:42` |
| `responsibleName` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/report-issuer-settings.dto.ts:43` |
| `responsibleTitle` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/report-issuer-settings.dto.ts:46` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReportReleaseController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 49. POST /diagnostics/reports/{reportId}/patient-release

- **Origen:** CONTRATO
- **Nombre:** Liberar al paciente un resultado retenido
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportReleaseController.releaseToPatient` — `src/modules/diagnostics/controllers/diagnostics-report-release.controller.ts:42`

### Qué es y para qué sirve (negocio)

Liberar al paciente un resultado retenido. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/reports/{reportId}/patient-release` la atiende `DiagnosticsReportReleaseController.releaseToPatient` (src/modules/diagnostics/controllers/diagnostics-report-release.controller.ts:42). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `ReportReleaseService.releaseToPatient`. Crea filas en diagnostics.diagnostic_release_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza clinical.diagnostic_reports, messaging.in_app_notifications. Lee clinical.diagnostic_reports, clinical.service_requests, diagnostics.diagnostic_release_events, diagnostics.report_drafts, directory.tenant_memberships, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-report-release.controller.ts:42` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: reportId | `src/modules/diagnostics/controllers/diagnostics-report-release.controller.ts:42` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → DiagnosticOrdersRepository.markReportReleased | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:287` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient | `src/modules/diagnostics/services/report-release.service.ts:58` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient | `src/modules/diagnostics/services/report-release.service.ts:60` |
| `diagnostics.diagnostic_release_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → ReportsRepository.recordReleaseEvent | `src/modules/diagnostics/repositories/reports.repository.ts:341` |
| `diagnostics.diagnostic_release_events` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → ReportsRepository.findReleaseEventsByVersions | `src/modules/diagnostics/repositories/reports.repository.ts:444` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → ReportDraftsRepository.findPublishedByReport | `src/modules/diagnostics/repositories/report-drafts.repository.ts:76` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → ReportNotificationsService.releasedToPatient → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsRepository.listActiveTenantIds | `src/modules/messaging/repositories/notifications.repository.ts:867` |
| `messaging.in_app_notifications` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → ReportNotificationsService.releasedToPatient → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp | `src/modules/messaging/services/notifications.service.ts:1449` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → ReportNotificationsService.releasedToPatient → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:712` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → ReportNotificationsService.releasedToPatient → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:847` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → ReportNotificationsService.releasedToPatient → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:191` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → ReportNotificationsService.releasedToPatient → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:439` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → ReportNotificationsService.releasedToPatient → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:516` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → ReportNotificationsService.releasedToPatient → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:272` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → ReportNotificationsService.releasedToPatient → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:407` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → ReportNotificationsService.releasedToPatient → ReportNotificationsService.emitAll → NotificationsService.emitInApp → NotificationsService.writeInRecipientInbox → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:214` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → ReportNotificationsService.releasedToPatient → ReportNotificationsService.userOf → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsReportReleaseController.releaseToPatient → ReportReleaseService.releaseToPatient → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `reportId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientReleaseResultDto>` · DTO `PatientReleaseResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reportId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:33` |
| `versionId` | `string` | Sí | formato uuid | — | — | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:34` |
| `patientVisibility` | `string` | Sí | valores: VISIBLE | — | — | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:35` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El resultado ya está visible para el paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/report-drafts.int-spec.ts:527` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReportReleaseController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 50. POST /diagnostics/reports/{reportId}/versions

- **Origen:** CONTRATO
- **Nombre:** Crear/enmendar versión de informe diagnóstico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportsController.createVersion` — `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:51`

### Qué es y para qué sirve (negocio)

Crear/enmendar versión de informe diagnóstico. Caso de uso UC-20-07: Crear/enmendar versión de informe. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:115`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/reports/{reportId}/versions` la atiende `DiagnosticsReportsController.createVersion` (src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:51). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateReportVersionDto` (14 campos, 0 obligatorios). Delega en `ReportImmutabilityService.assertWritable`, `DiagnosticsReportsService.createReportVersion`. Crea filas en diagnostics.diagnostic_report_files, diagnostics.diagnostic_report_results, diagnostics.diagnostic_report_versions. Lee clinical.diagnostic_reports, clinical.observations, common.files, diagnostics.diagnostic_report_versions, diagnostics.report_drafts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: reportId | `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:51` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsReportsController.createVersion → DiagnosticsReportsService.createReportVersion → DiagnosticsScopeService.report → DiagnosticOrdersRepository.findReportById | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:235` |
| `clinical.observations` | LEE | LEE | DIRECTA | DiagnosticsReportsController.createVersion → DiagnosticsReportsService.createReportVersion → DiagnosticsScopeService.observation → ClinicalRefsRepository.findObservation | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:37` |
| `common.files` | LEE | LEE | DIRECTA | DiagnosticsReportsController.createVersion → DiagnosticsReportsService.createReportVersion → DiagnosticsScopeService.file → ClinicalRefsRepository.findFile | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:42` |
| `diagnostics.diagnostic_report_files` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportsController.createVersion → DiagnosticsReportsService.createReportVersion → ReportsRepository.addFile | `src/modules/diagnostics/repositories/reports.repository.ts:286` |
| `diagnostics.diagnostic_report_results` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportsController.createVersion → DiagnosticsReportsService.createReportVersion → ReportsRepository.addResult | `src/modules/diagnostics/repositories/reports.repository.ts:237` |
| `diagnostics.diagnostic_report_versions` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportsController.createVersion → DiagnosticsReportsService.createReportVersion → ReportsRepository.createVersion | `src/modules/diagnostics/repositories/reports.repository.ts:188` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsReportsController.createVersion → DiagnosticsReportsService.createReportVersion → ReportsRepository.findVersionInReport | `src/modules/diagnostics/repositories/reports.repository.ts:142` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsReportsController.createVersion → ReportImmutabilityService.assertWritable → ReportDraftsRepository.findPublishedByReport | `src/modules/diagnostics/repositories/report-drafts.repository.ts:76` |

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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: El autor debe ser el profesional que firma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message}; ResourceNotFoundException: La versión que se enmienda no existe en este informe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:89` |
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-reports.controller.spec.ts:47` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-07`

---

## 51. POST /diagnostics/reports/{reportId}/versions/{versionId}/release

- **Origen:** CONTRATO
- **Nombre:** Validar y liberar una versión del informe
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportsController.releaseVersion` — `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:70`

### Qué es y para qué sirve (negocio)

Validar y liberar una versión del informe. Caso de uso UC-20-08: Validar y liberar. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:116`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/reports/{reportId}/versions/{versionId}/release` la atiende `DiagnosticsReportsController.releaseVersion` (src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:70). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ReleaseReportVersionDto` (3 campos, 0 obligatorios). Delega en `ReportImmutabilityService.assertWritable`, `DiagnosticsReportsService.releaseVersion`. Crea filas en diagnostics.diagnostic_release_events. Actualiza clinical.diagnostic_reports, diagnostics.diagnostic_report_versions. Lee clinical.diagnostic_reports, diagnostics.diagnostic_report_versions, diagnostics.report_drafts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:70` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: reportId, versionId | `src/modules/diagnostics/controllers/diagnostics-reports.controller.ts:70` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsReportsController.releaseVersion → DiagnosticsReportsService.releaseVersion → DiagnosticOrdersRepository.markReportReleased | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:287` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | DiagnosticsReportsController.releaseVersion → DiagnosticsReportsService.releaseVersion → DiagnosticsScopeService.report → DiagnosticOrdersRepository.findReportById | `src/modules/diagnostics/repositories/diagnostic-orders.repository.ts:235` |
| `diagnostics.diagnostic_release_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsReportsController.releaseVersion → DiagnosticsReportsService.releaseVersion → ReportsRepository.recordReleaseEvent | `src/modules/diagnostics/repositories/reports.repository.ts:341` |
| `diagnostics.diagnostic_report_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsReportsController.releaseVersion → DiagnosticsReportsService.releaseVersion | `src/modules/diagnostics/services/diagnostics-reports.service.ts:190` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsReportsController.releaseVersion → DiagnosticsReportsService.releaseVersion → ReportsRepository.findVersionInReport | `src/modules/diagnostics/repositories/reports.repository.ts:142` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsReportsController.releaseVersion → ReportImmutabilityService.assertWritable → ReportDraftsRepository.findPublishedByReport | `src/modules/diagnostics/repositories/report-drafts.repository.ts:76` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message}; ResourceNotFoundException: Versión de informe no encontrada |
| 409 | `CONFLICT` | ConflictException: La versión ya fue liberada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión no es elegible para liberación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:120` |
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-reports.controller.spec.ts:57` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-08`

---

## 52. POST /diagnostics/results/{observationId}/verifications

- **Origen:** CONTRATO
- **Nombre:** Verificar (técnica/facultativa) un resultado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabController.verifyResult` — `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:128`

### Qué es y para qué sirve (negocio)

Verificar (técnica/facultativa) un resultado. Caso de uso UC-20-06: Verificar (técnica/facultativa). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:114`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/results/{observationId}/verifications` la atiende `DiagnosticsLabController.verifyResult` (src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:128). Exige sesión; el controlador no declara roles. Valida el cuerpo como `VerifyResultDto` (6 campos, 2 obligatorios). Delega en `DiagnosticsLabService.verifyResult`. Crea filas en diagnostics.result_verifications. Actualiza diagnostics.laboratory_work_order_tests. Lee clinical.observations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:128` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: observationId | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:128` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.observations` | LEE | LEE | DIRECTA | DiagnosticsLabController.verifyResult → DiagnosticsLabService.verifyResult → DiagnosticsScopeService.observation → ClinicalRefsRepository.findObservation | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:37` |
| `diagnostics.laboratory_work_order_tests` | ESCRIBE | ACTUALIZA | DIRECTA | DiagnosticsLabController.verifyResult → DiagnosticsLabService.verifyResult → LabWorkRepository.markTestsVerifiedForObservation | `src/modules/diagnostics/repositories/lab-work.repository.ts:479` |
| `diagnostics.result_verifications` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabController.verifyResult → DiagnosticsLabService.verifyResult → LabWorkRepository.recordVerification | `src/modules/diagnostics/repositories/lab-work.repository.ts:455` |

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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: El autor debe ser el profesional que firma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab.controller.spec.ts:55` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-06`

---

## 53. GET /diagnostics/service-requests/{id}

- **Origen:** CONTRATO
- **Nombre:** Detalle de una orden dirigida al tenant activo
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReceptionController.getServiceRequest` — `src/modules/diagnostics/controllers/diagnostics-reception.controller.ts:101`

### Qué es y para qué sirve (negocio)

Detalle de una orden dirigida al tenant activo. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/service-requests/{id}` la atiende `DiagnosticsReceptionController.getServiceRequest` (src/modules/diagnostics/controllers/diagnostics-reception.controller.ts:101). Exige sesión; el controlador no declara roles. Delega en `DiagnosticsWorklistService.getById`. Lee clinical.service_request_components, clinical.service_requests, diagnostics.specimen_chain_of_custody_events, diagnostics.specimen_containers, diagnostics.specimens, directory.tenants, profiles.patient_profiles, profiles.person_profiles y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-reception.controller.ts:101` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-reception.controller.ts:101` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_request_components` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.getServiceRequest → DiagnosticsWorklistService.getById → DiagnosticsReceptionService.toItems → ServiceRequestDetailService.describe → ServiceRequestDetailService.loadComponents | `src/modules/clinical/services/service-request-detail.service.ts:462` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.getServiceRequest → DiagnosticsWorklistService.getById | `src/modules/diagnostics/services/diagnostics-worklist.service.ts:160` |
| `diagnostics.specimen_chain_of_custody_events` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.getServiceRequest → DiagnosticsWorklistService.getById → DiagnosticsReceptionService.toItems → SpecimensRepository.findCustodyEventsBySpecimenIds | `src/modules/diagnostics/repositories/specimens.repository.ts:261` |
| `diagnostics.specimen_containers` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.getServiceRequest → DiagnosticsWorklistService.getById → DiagnosticsReceptionService.toItems → SpecimensRepository.findContainersBySpecimenIds | `src/modules/diagnostics/repositories/specimens.repository.ts:248` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.getServiceRequest → DiagnosticsWorklistService.getById → DiagnosticsReceptionService.toItems → LabReceptionRepository.findSpecimensForServiceRequests | `src/modules/diagnostics/repositories/lab-reception.repository.ts:122` |
| `directory.tenants` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.getServiceRequest → DiagnosticsWorklistService.getById → DiagnosticsReceptionService.toItems → LabReceptionRepository.findTenantNames | `src/modules/diagnostics/repositories/lab-reception.repository.ts:206` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.getServiceRequest → DiagnosticsWorklistService.getById → DiagnosticsReceptionService.toItems → DiagnosticsReceptionService.loadLabels → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.getServiceRequest → DiagnosticsWorklistService.getById → DiagnosticsReceptionService.toItems → DiagnosticsReceptionService.loadLabels → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.getServiceRequest → DiagnosticsWorklistService.getById → DiagnosticsReceptionService.toItems → DiagnosticsReceptionService.loadLabels → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.getServiceRequest → DiagnosticsWorklistService.getById → DiagnosticsReceptionService.toItems → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.getServiceRequest → DiagnosticsWorklistService.getById → DiagnosticsReceptionService.toItems → ServiceRequestDetailService.describe → ServiceRequestDetailService.displays → ConceptDesignationsRepository.findPreferredByLanguageForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:176` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<WorklistItemDto>` · DTO `WorklistItemDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `state` | `object` | Sí | — | — | Derivado, no guardado: PENDING (sin acesión ni estudio), RECEIVED (acesión, muestra recibida o estudio de imagen), IN_PROCESS (orden de trabajo abierta; en imagen, informe en curso), REPORTED (informe liberado), CANCELLED (revocada o satisfecha por informe previo) | `src/modules/diagnostics/dto/worklist.dto.ts:88` |
| `scope` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof WORKLIST_SCOPES)[number] | `src/modules/diagnostics/dto/worklist.dto.ts:91` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-reception.controller.spec.ts:57` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReceptionController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 54. POST /diagnostics/service-requests/inbox

- **Origen:** CONTRATO
- **Nombre:** Bandeja de órdenes de laboratorio por recibir
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReceptionController.listInbox` — `src/modules/diagnostics/controllers/diagnostics-reception.controller.ts:53`

### Qué es y para qué sirve (negocio)

Bandeja de órdenes de laboratorio por recibir. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/service-requests/inbox` la atiende `DiagnosticsReceptionController.listInbox` (src/modules/diagnostics/controllers/diagnostics-reception.controller.ts:53). Exige sesión; el controlador no declara roles. Valida el cuerpo como `LabInboxQueryDto` (3 campos, 0 obligatorios). Delega en `DiagnosticsReceptionService.listInbox`. Lee clinical.service_request_components, clinical.service_requests, diagnostics.laboratory_accessions, diagnostics.specimen_chain_of_custody_events, diagnostics.specimen_containers, diagnostics.specimens, directory.tenants, profiles.patient_profiles y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-reception.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_request_components` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listInbox → DiagnosticsReceptionService.listInbox → DiagnosticsReceptionService.toItems → ServiceRequestDetailService.describe → ServiceRequestDetailService.loadComponents | `src/modules/clinical/services/service-request-detail.service.ts:462` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listInbox → DiagnosticsReceptionService.listInbox → LabReceptionRepository.findInboxCandidates | `src/modules/diagnostics/repositories/lab-reception.repository.ts:76` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listInbox → DiagnosticsReceptionService.listInbox → LabReceptionRepository.findAccessionedServiceRequestIds | `src/modules/diagnostics/repositories/lab-reception.repository.ts:97` |
| `diagnostics.specimen_chain_of_custody_events` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listInbox → DiagnosticsReceptionService.listInbox → DiagnosticsReceptionService.toItems → SpecimensRepository.findCustodyEventsBySpecimenIds | `src/modules/diagnostics/repositories/specimens.repository.ts:261` |
| `diagnostics.specimen_containers` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listInbox → DiagnosticsReceptionService.listInbox → DiagnosticsReceptionService.toItems → SpecimensRepository.findContainersBySpecimenIds | `src/modules/diagnostics/repositories/specimens.repository.ts:248` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listInbox → DiagnosticsReceptionService.listInbox → DiagnosticsReceptionService.toItems → LabReceptionRepository.findSpecimensForServiceRequests | `src/modules/diagnostics/repositories/lab-reception.repository.ts:122` |
| `directory.tenants` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listInbox → DiagnosticsReceptionService.listInbox → DiagnosticsReceptionService.toItems → LabReceptionRepository.findTenantNames | `src/modules/diagnostics/repositories/lab-reception.repository.ts:206` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listInbox → DiagnosticsReceptionService.listInbox → DiagnosticsReceptionService.loadLabels → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listInbox → DiagnosticsReceptionService.listInbox → DiagnosticsReceptionService.loadLabels → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listInbox → DiagnosticsReceptionService.listInbox → DiagnosticsReceptionService.loadLabels → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listInbox → DiagnosticsReceptionService.listInbox → DiagnosticsReceptionService.toItems → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listInbox → DiagnosticsReceptionService.listInbox → DiagnosticsReceptionService.toItems → ServiceRequestDetailService.describe → ServiceRequestDetailService.displays → ConceptDesignationsRepository.findPreferredByLanguageForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:176` |

### Cuerpo — DTO `LabInboxQueryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `cursor` | `string` | No | longitud máxima 512 | `@IsOptional()` `@IsString()` `@MaxLength(512)` | Cursor opaco devuelto por la página anterior (`nextCursor`) | `src/modules/diagnostics/dto/reception.dto.ts:36` |
| `limit` | `number` | No | mínimo 1; máximo 100 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(1)` `@Max(100)` | — | `src/modules/diagnostics/dto/reception.dto.ts:45` |
| `patientQuery` | `string` | No | longitud mínima 2; longitud máxima 80 | `@IsOptional()` `@Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value, )` `@IsString()` `@MinLength(2)` `@MaxLength(80)` | Nombre o código del paciente (sin distinguir mayúsculas ni tildes) | `src/modules/diagnostics/dto/reception.dto.ts:64` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "cursor": "valor-ejemplo",
  "limit": 25,
  "patientQuery": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<LabInboxPageDto>` · DTO `LabInboxPageDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<LabInboxItemDto>` | Sí | — | — | Las órdenes de la página, de la más vieja a la más nueva. | `src/modules/diagnostics/dto/reception.dto.ts:157` |
| `items[].serviceRequestId` | `string` | Sí | formato uuid | — | La orden de servicio (`clinical.service_requests`). | `src/modules/diagnostics/dto/reception.dto.ts:70` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | Paciente de la orden. | `src/modules/diagnostics/dto/reception.dto.ts:73` |
| `items[].patientDisplayName` | `string` | Sí | admite null | — | Nombre pintable del paciente, si se conoce. | `src/modules/diagnostics/dto/reception.dto.ts:77` |
| `items[].patientCode` | `string` | Sí | admite null | — | Código de paciente (historia clínica), si se conoce. | `src/modules/diagnostics/dto/reception.dto.ts:80` |
| `items[].codeConceptId` | `string` | Sí | formato uuid | — | Estudio pedido (concept id). | `src/modules/diagnostics/dto/reception.dto.ts:83` |
| `items[].codeDisplay` | `string` | Sí | admite null | — | Nombre del estudio pedido, del catálogo. | `src/modules/diagnostics/dto/reception.dto.ts:86` |
| `items[].categoryConceptId` | `string` | Sí | formato uuid; admite null | — | Categoría de la orden (laboratorio o anatomía patológica). | `src/modules/diagnostics/dto/reception.dto.ts:90` |
| `items[].priorityConceptId` | `string` | Sí | formato uuid; admite null | — | Prioridad de la orden (concept id). | `src/modules/diagnostics/dto/reception.dto.ts:94` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado de la orden (concept id). | `src/modules/diagnostics/dto/reception.dto.ts:97` |
| `items[].requesterProfileId` | `string` | Sí | formato uuid; admite null | — | Profesional que pidió el estudio, si consta. | `src/modules/diagnostics/dto/reception.dto.ts:101` |
| `items[].requestingTenantId` | `string` | Sí | formato uuid | — | Organización que emitió la orden (su custodio). | `src/modules/diagnostics/dto/reception.dto.ts:104` |
| `items[].requestingTenantName` | `string` | Sí | admite null | — | Nombre de la organización que emitió la orden. | `src/modules/diagnostics/dto/reception.dto.ts:108` |
| `items[].requestedAt` | `string` | Sí | formato date-time | — | Cuándo se emitió la orden. | `src/modules/diagnostics/dto/reception.dto.ts:111` |
| `items[].requisitionId` | `string` | No | formato uuid; admite null | — | v4.2.82: requisición que agrupa los estudios pedidos juntos; `null` = alta individual. | `src/modules/diagnostics/dto/reception.dto.ts:115` |
| `items[].specimenTypeConceptId` | `string` | No | formato uuid; admite null | — | v4.2.82: muestra pedida por el médico; `null` = no se indicó. | `src/modules/diagnostics/dto/reception.dto.ts:119` |
| `items[].specimenTypeDisplay` | `string` | No | admite null | — | v4.2.82: nombre legible de la muestra pedida. | `src/modules/diagnostics/dto/reception.dto.ts:123` |
| `items[].components` | `array<ServiceRequestComponentDto>` | No | — | — | v4.2.82: componentes marcados del panel, en el orden en que se marcaron. | `src/modules/diagnostics/dto/reception.dto.ts:127` |
| `items[].components[].conceptId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:139` |
| `items[].components[].display` | `string` | No | — | — | Nombre legible (castellano si existe) | `src/modules/clinical/dto/service-request-detail.dto.ts:142` |
| `items[].components[].ordinal` | `number` | No | — | — | Posición, desde 1, en el orden en que se marcó | `src/modules/clinical/dto/service-request-detail.dto.ts:147` |
| `items[].componentsSpecified` | `boolean` | No | — | — | v4.2.82: `false` = orden sin detalle de componentes («estudio completo»). | `src/modules/diagnostics/dto/reception.dto.ts:131` |
| `items[].imaging` | `ServiceRequestImagingDto` | No | — | — | v4.2.82: modalidad, región, lateralidad y contraste; `null` si no es imagen o no los trae. | `src/modules/diagnostics/dto/reception.dto.ts:135` |
| `items[].imaging.modalityConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:153` |
| `items[].imaging.modalityDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:155` |
| `items[].imaging.bodySiteConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:157` |
| `items[].imaging.bodySiteDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:159` |
| `items[].imaging.lateralityConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:161` |
| `items[].imaging.lateralityDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:163` |
| `items[].imaging.contrastConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:165` |
| `items[].imaging.contrastDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:167` |
| `items[].imaging.bodyStructureUberon` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:169` |
| `items[].imaging.bodyMeshId` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:171` |
| `items[].imaging.boneTypeConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:173` |
| `items[].imaging.boneTypeDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:175` |
| `items[].summary` | `string` | No | — | — | v4.2.82: resumen legible armado por el servidor, p. ej. «Hemograma · 3 componentes» o «Radiografía de mano · Mano · Izquierda · sin contraste». | `src/modules/diagnostics/dto/reception.dto.ts:142` |
| `items[].specimens` | `array<SpecimenDetailDto>` | Sí | — | — | Muestras que este laboratorio ya recibió para la orden y todavía no acesionó, con sus contenedores y su cadena de custodia. Vacío mientras nadie recibió nada; un espécimen rechazado sigue acá con su estado, para que se vea por qué hace falta otra muestra. | `src/modules/diagnostics/dto/reception.dto.ts:151` |
| `items[].specimens[].id` | `string` | Sí | formato uuid | — | Identificador del espécimen. | `src/modules/diagnostics/dto/specimens.dto.ts:393` |
| `items[].specimens[].patientProfileId` | `string` | Sí | formato uuid | — | Paciente dueño del espécimen. | `src/modules/diagnostics/dto/specimens.dto.ts:396` |
| `items[].specimens[].specimenTypeConceptId` | `string` | Sí | formato uuid | — | Tipo de espécimen (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:399` |
| `items[].specimens[].statusConceptId` | `string` | Sí | formato uuid | — | Estado del espécimen (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:402` |
| `items[].specimens[].collectedAt` | `string` | No | formato date-time | — | Cuándo se recolectó, si ya ocurrió. | `src/modules/diagnostics/dto/specimens.dto.ts:406` |
| `items[].specimens[].receivedAt` | `string` | No | formato date-time | — | Cuándo se recibió en el laboratorio, si ya ocurrió. | `src/modules/diagnostics/dto/specimens.dto.ts:410` |
| `items[].specimens[].containers` | `array<SpecimenContainerDto>` | Sí | — | — | Sus contenedores. | `src/modules/diagnostics/dto/specimens.dto.ts:414` |
| `items[].specimens[].containers[].id` | `string` | Sí | formato uuid | — | Identificador del contenedor. | `src/modules/diagnostics/dto/specimens.dto.ts:378` |
| `items[].specimens[].containers[].containerIdentifier` | `string` | Sí | — | — | Identificador físico del contenedor (etiqueta/código). | `src/modules/diagnostics/dto/specimens.dto.ts:381` |
| `items[].specimens[].containers[].containerTypeConceptId` | `string` | Sí | formato uuid | — | Tipo de contenedor (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:384` |
| `items[].specimens[].containers[].statusConceptId` | `string` | Sí | formato uuid | — | Estado del contenedor (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:387` |
| `items[].specimens[].custodyEvents` | `array<SpecimenCustodyEventDto>` | Sí | — | — | Su cadena de custodia, del evento más viejo al más nuevo. | `src/modules/diagnostics/dto/specimens.dto.ts:418` |
| `items[].specimens[].custodyEvents[].id` | `string` | Sí | formato uuid | — | Identificador del evento. | `src/modules/diagnostics/dto/specimens.dto.ts:351` |
| `items[].specimens[].custodyEvents[].specimenContainerId` | `string` | No | formato uuid | — | Contenedor al que se refiere el traslado, si el evento fue de un contenedor. | `src/modules/diagnostics/dto/specimens.dto.ts:354` |
| `items[].specimens[].custodyEvents[].custodyEventTypeConceptId` | `string` | Sí | formato uuid | — | Tipo de evento (concept id): recepción, traslado, almacenamiento, etc. | `src/modules/diagnostics/dto/specimens.dto.ts:357` |
| `items[].specimens[].custodyEvents[].occurredAt` | `string` | Sí | formato date-time | — | Cuándo ocurrió. | `src/modules/diagnostics/dto/specimens.dto.ts:360` |
| `items[].specimens[].custodyEvents[].fromPartyTypeConceptId` | `string` | No | formato uuid | — | De qué tipo de parte salió (concept id), si se registró. | `src/modules/diagnostics/dto/specimens.dto.ts:363` |
| `items[].specimens[].custodyEvents[].toPartyTypeConceptId` | `string` | No | formato uuid | — | A qué tipo de parte llegó (concept id), si se registró. | `src/modules/diagnostics/dto/specimens.dto.ts:366` |
| `items[].specimens[].custodyEvents[].sealIdentifier` | `string` | No | — | — | Sello de custodia, si se usó uno. | `src/modules/diagnostics/dto/specimens.dto.ts:369` |
| `items[].specimens[].custodyEvents[].signedByUserId` | `string` | No | formato uuid | — | Quién firmó el evento. | `src/modules/diagnostics/dto/specimens.dto.ts:372` |
| `count` | `number` | Sí | — | — | Cuántas filas trae la página. | `src/modules/diagnostics/dto/reception.dto.ts:160` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/diagnostics/dto/reception.dto.ts:163` |
| `nextCursor` | `string` | Sí | admite null | — | Cursor de la página siguiente, o `null` si no hay más. | `src/modules/diagnostics/dto/reception.dto.ts:166` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-reception-inbox.int-spec.ts:121` |
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-reception.controller.spec.ts:30` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReceptionController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 55. POST /diagnostics/service-requests/worklist

- **Origen:** CONTRATO
- **Nombre:** Bandeja del ejecutor: órdenes de laboratorio o imagen con estado derivado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReceptionController.listWorklist` — `src/modules/diagnostics/controllers/diagnostics-reception.controller.ts:77`

### Qué es y para qué sirve (negocio)

Bandeja del ejecutor: órdenes de laboratorio o imagen con estado derivado. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/service-requests/worklist` la atiende `DiagnosticsReceptionController.listWorklist` (src/modules/diagnostics/controllers/diagnostics-reception.controller.ts:77). Exige sesión; el controlador no declara roles. Valida el cuerpo como `WorklistQueryDto` (5 campos, 1 obligatorio). Delega en `DiagnosticsWorklistService.list`. Lee clinical.service_request_components, clinical.service_requests, diagnostics.specimen_chain_of_custody_events, diagnostics.specimen_containers, diagnostics.specimens, directory.tenants, profiles.patient_profiles, profiles.person_profiles y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-reception.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_request_components` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listWorklist → DiagnosticsWorklistService.list → DiagnosticsReceptionService.toItems → ServiceRequestDetailService.describe → ServiceRequestDetailService.loadComponents | `src/modules/clinical/services/service-request-detail.service.ts:462` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listWorklist → DiagnosticsWorklistService.list | `src/modules/diagnostics/services/diagnostics-worklist.service.ts:104` |
| `diagnostics.specimen_chain_of_custody_events` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listWorklist → DiagnosticsWorklistService.list → DiagnosticsReceptionService.toItems → SpecimensRepository.findCustodyEventsBySpecimenIds | `src/modules/diagnostics/repositories/specimens.repository.ts:261` |
| `diagnostics.specimen_containers` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listWorklist → DiagnosticsWorklistService.list → DiagnosticsReceptionService.toItems → SpecimensRepository.findContainersBySpecimenIds | `src/modules/diagnostics/repositories/specimens.repository.ts:248` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listWorklist → DiagnosticsWorklistService.list → DiagnosticsReceptionService.toItems → LabReceptionRepository.findSpecimensForServiceRequests | `src/modules/diagnostics/repositories/lab-reception.repository.ts:122` |
| `directory.tenants` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listWorklist → DiagnosticsWorklistService.list → DiagnosticsReceptionService.toItems → LabReceptionRepository.findTenantNames | `src/modules/diagnostics/repositories/lab-reception.repository.ts:206` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listWorklist → DiagnosticsWorklistService.list → DiagnosticsReceptionService.loadLabels → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:152` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listWorklist → DiagnosticsWorklistService.list → DiagnosticsReceptionService.loadLabels → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:151` |
| `profiles.persons` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listWorklist → DiagnosticsWorklistService.list → DiagnosticsReceptionService.loadLabels → LabReceptionRepository.findPatientLabels | `src/modules/diagnostics/repositories/lab-reception.repository.ts:155` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listWorklist → DiagnosticsWorklistService.list → DiagnosticsReceptionService.toItems → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | DiagnosticsReceptionController.listWorklist → DiagnosticsWorklistService.list → DiagnosticsReceptionService.toItems → ServiceRequestDetailService.describe → ServiceRequestDetailService.displays → ConceptDesignationsRepository.findPreferredByLanguageForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:176` |

### Cuerpo — DTO `WorklistQueryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `scope` | `string` | Sí | valores: LAB, IMAGING | `@IsIn(WORKLIST_SCOPES)` | — | `src/modules/diagnostics/dto/worklist.dto.ts:37` |
| `states` | `array<string>` | No | máximo 5 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(5)` `@ArrayUnique()` `@IsIn(STATES, { each: true })` | Estados derivados a incluir. Omitido = todos (PENDING, RECEIVED, IN_PROCESS, REPORTED, CANCELLED) | `src/modules/diagnostics/dto/worklist.dto.ts:50` |
| `cursor` | `string` | No | longitud máxima 512 | `@IsOptional()` `@IsString()` `@MaxLength(512)` | Cursor opaco (`nextCursor`) | `src/modules/diagnostics/dto/worklist.dto.ts:56` |
| `limit` | `number` | No | mínimo 1; máximo 100 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(1)` `@Max(100)` | — | `src/modules/diagnostics/dto/worklist.dto.ts:64` |
| `patientQuery` | `string` | No | longitud mínima 2; longitud máxima 80 | `@IsOptional()` `@Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value, )` `@IsString()` `@MinLength(2)` `@MaxLength(80)` | Nombre o código del paciente (sin tildes ni mayúsculas) | `src/modules/diagnostics/dto/worklist.dto.ts:78` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "scope": "LAB"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<WorklistPageDto>` · DTO `WorklistPageDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<WorklistItemDto>` | Sí | — | — | — | `src/modules/diagnostics/dto/worklist.dto.ts:95` |
| `items[].state` | `object` | Sí | — | — | Derivado, no guardado: PENDING (sin acesión ni estudio), RECEIVED (acesión, muestra recibida o estudio de imagen), IN_PROCESS (orden de trabajo abierta; en imagen, informe en curso), REPORTED (informe liberado), CANCELLED (revocada o satisfecha por informe previo) | `src/modules/diagnostics/dto/worklist.dto.ts:88` |
| `items[].scope` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof WORKLIST_SCOPES)[number] | `src/modules/diagnostics/dto/worklist.dto.ts:91` |
| `count` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/worklist.dto.ts:96` |
| `limit` | `number` | Sí | — | — | — | `src/modules/diagnostics/dto/worklist.dto.ts:97` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/diagnostics/dto/worklist.dto.ts:98` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-reception.controller.spec.ts:56` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReceptionController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 56. POST /diagnostics/specimens

- **Origen:** CONTRATO
- **Nombre:** Registrar un espécimen (soporte para acesión)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsSpecimensController.createSpecimen` — `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:57`

### Qué es y para qué sirve (negocio)

Registrar un espécimen (soporte para acesión). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/specimens` la atiende `DiagnosticsSpecimensController.createSpecimen` (src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:57). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateSpecimenDto` (9 campos, 2 obligatorios). Delega en `DiagnosticsSpecimensService.createSpecimen`. Crea filas en diagnostics.specimen_collection_events, diagnostics.specimens. Lee clinical.encounters, clinical.service_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.createSpecimen → DiagnosticsSpecimensService.createSpecimen → DiagnosticsScopeService.encounter → ClinicalRefsRepository.findEncounter | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:24` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.createSpecimen → DiagnosticsSpecimensService.createSpecimen → DiagnosticsScopeService.serviceRequest → ClinicalRefsRepository.findServiceRequest | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:32` |
| `diagnostics.specimen_collection_events` | ESCRIBE | CREA | POR_SQL | DiagnosticsSpecimensController.createSpecimen → DiagnosticsSpecimensService.createSpecimen | `src/modules/diagnostics/services/diagnostics-specimens.service.ts:120` |
| `diagnostics.specimens` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.createSpecimen → DiagnosticsSpecimensService.createSpecimen → SpecimensRepository.createSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:276` |

### Cuerpo — DTO `CreateSpecimenDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente dueño del espécimen | `src/modules/diagnostics/dto/specimens.dto.ts:20` |
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant custodio: el del contexto (X-Tenant-Id). Si se envía y no coincide, responde 404 | `src/modules/diagnostics/dto/specimens.dto.ts:32` |
| `specimenTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de espécimen (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:42` |
| `serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Orden clínica de origen | `src/modules/diagnostics/dto/specimens.dto.ts:53` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/diagnostics/dto/specimens.dto.ts:61` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio anatómico (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:72` |
| `collectionMethodConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Método de recolección (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:83` |
| `collectorProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional que recolecta | `src/modules/diagnostics/dto/specimens.dto.ts:94` |
| `collectionCareSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Punto de toma (F5b) | `src/modules/diagnostics/dto/specimens.dto.ts:100` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
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
  "collectorProfileId": "00000000-0000-4000-8000-000000000001",
  "collectionCareSpaceId": "00000000-0000-4000-8000-000000000001"
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message}; ResourceNotFoundException: Espacio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El espacio no es un punto de toma disponible |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:326` |
| INTEGRACION | `test/integration/infrastructure-f5b.int-spec.ts:113` |
| INTEGRACION | `test/integration/lab-reception-inbox.int-spec.ts:228` |
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.spec.ts:39` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsSpecimensController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 57. GET /diagnostics/specimens/{id}

- **Origen:** CONTRATO
- **Nombre:** Detalle de un espécimen (con su cadena de custodia)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsSpecimensController.getSpecimen` — `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:91`

### Qué es y para qué sirve (negocio)

Detalle de un espécimen (con su cadena de custodia). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/specimens/{id}` la atiende `DiagnosticsSpecimensController.getSpecimen` (src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:91). Exige sesión; el controlador no declara roles. Delega en `DiagnosticsSpecimensService.getSpecimen`. Lee diagnostics.specimen_chain_of_custody_events, diagnostics.specimen_containers, diagnostics.specimens.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:91` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:91` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.specimen_chain_of_custody_events` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.getSpecimen → DiagnosticsSpecimensService.getSpecimen → SpecimensRepository.findCustodyEventsBySpecimenIds | `src/modules/diagnostics/repositories/specimens.repository.ts:261` |
| `diagnostics.specimen_containers` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.getSpecimen → DiagnosticsSpecimensService.getSpecimen → SpecimensRepository.findContainersBySpecimenIds | `src/modules/diagnostics/repositories/specimens.repository.ts:248` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.getSpecimen → DiagnosticsSpecimensService.getSpecimen → SpecimensRepository.findSpecimenForTenant | `src/modules/diagnostics/repositories/specimens.repository.ts:230` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SpecimenDetailDto>` · DTO `SpecimenDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del espécimen. | `src/modules/diagnostics/dto/specimens.dto.ts:393` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Paciente dueño del espécimen. | `src/modules/diagnostics/dto/specimens.dto.ts:396` |
| `specimenTypeConceptId` | `string` | Sí | formato uuid | — | Tipo de espécimen (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:399` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado del espécimen (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:402` |
| `collectedAt` | `string` | No | formato date-time | — | Cuándo se recolectó, si ya ocurrió. | `src/modules/diagnostics/dto/specimens.dto.ts:406` |
| `receivedAt` | `string` | No | formato date-time | — | Cuándo se recibió en el laboratorio, si ya ocurrió. | `src/modules/diagnostics/dto/specimens.dto.ts:410` |
| `containers` | `array<SpecimenContainerDto>` | Sí | — | — | Sus contenedores. | `src/modules/diagnostics/dto/specimens.dto.ts:414` |
| `containers[].id` | `string` | Sí | formato uuid | — | Identificador del contenedor. | `src/modules/diagnostics/dto/specimens.dto.ts:378` |
| `containers[].containerIdentifier` | `string` | Sí | — | — | Identificador físico del contenedor (etiqueta/código). | `src/modules/diagnostics/dto/specimens.dto.ts:381` |
| `containers[].containerTypeConceptId` | `string` | Sí | formato uuid | — | Tipo de contenedor (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:384` |
| `containers[].statusConceptId` | `string` | Sí | formato uuid | — | Estado del contenedor (concept id). | `src/modules/diagnostics/dto/specimens.dto.ts:387` |
| `custodyEvents` | `array<SpecimenCustodyEventDto>` | Sí | — | — | Su cadena de custodia, del evento más viejo al más nuevo. | `src/modules/diagnostics/dto/specimens.dto.ts:418` |
| `custodyEvents[].id` | `string` | Sí | formato uuid | — | Identificador del evento. | `src/modules/diagnostics/dto/specimens.dto.ts:351` |
| `custodyEvents[].specimenContainerId` | `string` | No | formato uuid | — | Contenedor al que se refiere el traslado, si el evento fue de un contenedor. | `src/modules/diagnostics/dto/specimens.dto.ts:354` |
| `custodyEvents[].custodyEventTypeConceptId` | `string` | Sí | formato uuid | — | Tipo de evento (concept id): recepción, traslado, almacenamiento, etc. | `src/modules/diagnostics/dto/specimens.dto.ts:357` |
| `custodyEvents[].occurredAt` | `string` | Sí | formato date-time | — | Cuándo ocurrió. | `src/modules/diagnostics/dto/specimens.dto.ts:360` |
| `custodyEvents[].fromPartyTypeConceptId` | `string` | No | formato uuid | — | De qué tipo de parte salió (concept id), si se registró. | `src/modules/diagnostics/dto/specimens.dto.ts:363` |
| `custodyEvents[].toPartyTypeConceptId` | `string` | No | formato uuid | — | A qué tipo de parte llegó (concept id), si se registró. | `src/modules/diagnostics/dto/specimens.dto.ts:366` |
| `custodyEvents[].sealIdentifier` | `string` | No | — | — | Sello de custodia, si se usó uno. | `src/modules/diagnostics/dto/specimens.dto.ts:369` |
| `custodyEvents[].signedByUserId` | `string` | No | formato uuid | — | Quién firmó el evento. | `src/modules/diagnostics/dto/specimens.dto.ts:372` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espécimen no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:353` |
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.spec.ts:99` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsSpecimensController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 58. POST /diagnostics/specimens/{id}/containers

- **Origen:** CONTRATO
- **Nombre:** Registrar un contenedor de espécimen (soporte para custodia)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsSpecimensController.createContainer` — `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:137`

### Qué es y para qué sirve (negocio)

Registrar un contenedor de espécimen (soporte para custodia). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/specimens/{id}/containers` la atiende `DiagnosticsSpecimensController.createContainer` (src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:137). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateContainerDto` (4 campos, 2 obligatorios). Delega en `DiagnosticsSpecimensService.createContainer`. Crea filas en diagnostics.specimen_containers. Lee diagnostics.specimen_containers, diagnostics.specimens.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:137` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:137` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `diagnostics.specimen_containers` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.createContainer → DiagnosticsSpecimensService.createContainer → SpecimensRepository.createContainer | `src/modules/diagnostics/repositories/specimens.repository.ts:486` |
| `diagnostics.specimen_containers` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.createContainer → DiagnosticsSpecimensService.createContainer → DiagnosticsScopeService.container → SpecimensRepository.findContainer | `src/modules/diagnostics/repositories/specimens.repository.ts:196` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.createContainer → DiagnosticsSpecimensService.createContainer → DiagnosticsScopeService.specimen → SpecimensRepository.findSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:168` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateContainerDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `containerIdentifier` | `string` | Sí | longitud mínima 1; longitud máxima 120 | `@IsString()` `@IsNotEmpty()` `@MaxLength(120)` | Identificador del contenedor | `src/modules/diagnostics/dto/specimens.dto.ts:227` |
| `containerTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de contenedor (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:237` |
| `additiveConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Aditivo (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:245` |
| `parentContainerId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Contenedor padre | `src/modules/diagnostics/dto/specimens.dto.ts:253` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Contenedor no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/lab-reception-inbox.int-spec.ts:238` |
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.spec.ts:62` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsSpecimensController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 59. POST /diagnostics/specimens/{id}/rejection

- **Origen:** CONTRATO
- **Nombre:** Rechazar espécimen y solicitar recolección
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsSpecimensController.reject` — `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:120`

### Qué es y para qué sirve (negocio)

Rechazar espécimen y solicitar recolección. Caso de uso UC-20-02: Rechazar espécimen y solicitar recolección. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:108`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/specimens/{id}/rejection` la atiende `DiagnosticsSpecimensController.reject` (src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:120). Exige sesión; el controlador no declara roles. Valida el cuerpo como `RejectSpecimenDto` (5 campos, 1 obligatorio). Delega en `DiagnosticsSpecimensService.reject`. Crea filas en diagnostics.specimen_rejection_events. Actualiza diagnostics.laboratory_work_order_tests, diagnostics.specimens. Lee clinical.service_requests, diagnostics.specimens.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:120` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.ts:120` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.reject → DiagnosticsSpecimensService.reject → DiagnosticsScopeService.serviceRequest → ClinicalRefsRepository.findServiceRequest | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:32` |
| `diagnostics.laboratory_work_order_tests` | ESCRIBE | ACTUALIZA | DIRECTA | DiagnosticsSpecimensController.reject → DiagnosticsSpecimensService.reject → SpecimensRepository.cancelTestsForSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:553` |
| `diagnostics.specimen_rejection_events` | ESCRIBE | CREA | DIRECTA | DiagnosticsSpecimensController.reject → DiagnosticsSpecimensService.reject → SpecimensRepository.recordRejection | `src/modules/diagnostics/repositories/specimens.repository.ts:459` |
| `diagnostics.specimens` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsSpecimensController.reject → DiagnosticsSpecimensService.reject | `src/modules/diagnostics/services/diagnostics-specimens.service.ts:265` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsSpecimensController.reject → DiagnosticsSpecimensService.reject → DiagnosticsScopeService.specimen → SpecimensRepository.findSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:168` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RejectSpecimenDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `rejectionReasonConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Motivo de rechazo (concept id) | `src/modules/diagnostics/dto/specimens.dto.ts:176` |
| `notes` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Notas del rechazo | `src/modules/diagnostics/dto/specimens.dto.ts:185` |
| `recollectionRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Requiere nueva recolección? | `src/modules/diagnostics/dto/specimens.dto.ts:193` |
| `recollectionServiceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nueva orden de recolección | `src/modules/diagnostics/dto/specimens.dto.ts:204` |
| `rejectedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional que rechaza | `src/modules/diagnostics/dto/specimens.dto.ts:215` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El espécimen ya está rechazado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-specimens.controller.spec.ts:52` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-02`

---

## 60. GET /diagnostics/work-orders

- **Origen:** CONTRATO
- **Nombre:** Listar las órdenes de trabajo del laboratorio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabController.listWorkOrders` — `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:63`

### Qué es y para qué sirve (negocio)

Listar las órdenes de trabajo del laboratorio. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /diagnostics/work-orders` la atiende `DiagnosticsLabController.listWorkOrders` (src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:63). Exige sesión; el controlador no declara roles. Delega en `DiagnosticsLabService.listWorkOrders`. Lee clinical.service_requests, diagnostics.laboratory_accessions, diagnostics.laboratory_work_orders, diagnostics.specimen_collection_events, diagnostics.specimens, practice.care_spaces.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | POR_SQL | DiagnosticsLabController.listWorkOrders → DiagnosticsLabService.listWorkOrders → LabWorkRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-work.repository.ts:174` |
| `diagnostics.laboratory_accessions` | LEE | LEE | POR_SQL | DiagnosticsLabController.listWorkOrders → DiagnosticsLabService.listWorkOrders → LabWorkRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-work.repository.ts:174` |
| `diagnostics.laboratory_work_orders` | LEE | LEE | DIRECTA | DiagnosticsLabController.listWorkOrders → DiagnosticsLabService.listWorkOrders → LabWorkRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-work.repository.ts:188` |
| `diagnostics.specimen_collection_events` | LEE | LEE | POR_SQL | DiagnosticsLabController.listWorkOrders → DiagnosticsLabService.listWorkOrders → LabWorkRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-work.repository.ts:174` |
| `diagnostics.specimens` | LEE | LEE | POR_SQL | DiagnosticsLabController.listWorkOrders → DiagnosticsLabService.listWorkOrders → LabWorkRepository.findWorkOrders | `src/modules/diagnostics/repositories/lab-work.repository.ts:174` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | DiagnosticsLabController.listWorkOrders → DiagnosticsLabService.listWorkOrders → LabWorkRepository.collectionPointsOf | `src/modules/diagnostics/repositories/lab-work.repository.ts:210` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `laboratoryAccessionId` | query | No | `string` | Accesión de laboratorio |
| `statusConceptId` | query | No | `string` | Estado de la orden |
| `assignedProfileId` | query | No | `string` | Profesional asignado |
| `collectionCareSpaceId` | query | No | `string` | Punto de toma (F5b) |
| `limit` | query | No | `number` | — |
| `offset` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<WorkOrderSummaryDto[]>` · DTO `WorkOrderSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la orden. | `src/modules/diagnostics/dto/lab.dto.ts:369` |
| `workOrderNumber` | `string` | Sí | — | — | Número legible de la orden. | `src/modules/diagnostics/dto/lab.dto.ts:371` |
| `laboratoryAccessionId` | `string` | Sí | formato uuid | — | Accesión de laboratorio de la que cuelga. | `src/modules/diagnostics/dto/lab.dto.ts:373` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la orden. | `src/modules/diagnostics/dto/lab.dto.ts:375` |
| `priorityConceptId` | `string` | Sí | formato uuid | — | Prioridad. | `src/modules/diagnostics/dto/lab.dto.ts:377` |
| `assignedProfileId` | `string` | No | formato uuid | — | Profesional asignado, si lo hay. | `src/modules/diagnostics/dto/lab.dto.ts:379` |
| `scheduledAt` | `string` | No | formato date-time | — | Cuándo está programada. | `src/modules/diagnostics/dto/lab.dto.ts:382` |
| `completedAt` | `string` | No | formato date-time | — | Cuándo se completó. | `src/modules/diagnostics/dto/lab.dto.ts:385` |
| `collectionPoint` | `object` | No | admite null | — | Punto de toma {id, code, name} (F5b) | `src/modules/diagnostics/dto/lab.dto.ts:391` |
| `collectionPoint.id` | `string` | No | — | — | — | sin fuente |
| `collectionPoint.code` | `string` | No | — | — | — | sin fuente |
| `collectionPoint.name` | `string` | No | — | — | — | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5b.int-spec.ts:146` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsLabController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 61. POST /diagnostics/work-orders

- **Origen:** CONTRATO
- **Nombre:** Abrir orden de trabajo y desglosar pruebas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsLabController.createWorkOrder` — `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:75`

### Qué es y para qué sirve (negocio)

Abrir orden de trabajo y desglosar pruebas. Caso de uso UC-20-04: Abrir orden de trabajo y desglosar pruebas. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:111`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /diagnostics/work-orders` la atiende `DiagnosticsLabController.createWorkOrder` (src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:75). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateWorkOrderDto` (11 campos, 4 obligatorios). Delega en `DiagnosticsLabService.createWorkOrder`. Crea filas en diagnostics.laboratory_work_order_tests, diagnostics.laboratory_work_orders. Actualiza diagnostics.laboratory_accessions. Lee clinical.service_requests, diagnostics.laboratory_accessions, diagnostics.specimens.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/diagnostics/controllers/diagnostics-lab.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsLabController.createWorkOrder → DiagnosticsLabService.createWorkOrder → DiagnosticsScopeService.serviceRequest → ClinicalRefsRepository.findServiceRequest | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:32` |
| `diagnostics.laboratory_accessions` | ESCRIBE | ACTUALIZA | POR_TIPO | DiagnosticsLabController.createWorkOrder → DiagnosticsLabService.createWorkOrder | `src/modules/diagnostics/services/diagnostics-lab.service.ts:154` |
| `diagnostics.laboratory_accessions` | LEE | LEE | DIRECTA | DiagnosticsLabController.createWorkOrder → DiagnosticsLabService.createWorkOrder → DiagnosticsScopeService.accession → SpecimensRepository.findAccession | `src/modules/diagnostics/repositories/specimens.repository.ts:182` |
| `diagnostics.laboratory_work_order_tests` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabController.createWorkOrder → DiagnosticsLabService.createWorkOrder → LabWorkRepository.createWorkOrderTest | `src/modules/diagnostics/repositories/lab-work.repository.ts:298` |
| `diagnostics.laboratory_work_orders` | ESCRIBE | CREA | DIRECTA | DiagnosticsLabController.createWorkOrder → DiagnosticsLabService.createWorkOrder → LabWorkRepository.createWorkOrder | `src/modules/diagnostics/repositories/lab-work.repository.ts:272` |
| `diagnostics.specimens` | LEE | LEE | DIRECTA | DiagnosticsLabController.createWorkOrder → DiagnosticsLabService.createWorkOrder → DiagnosticsScopeService.specimenOfPatient → DiagnosticsScopeService.specimen → SpecimensRepository.findSpecimen | `src/modules/diagnostics/repositories/specimens.repository.ts:168` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-lab.controller.spec.ts:32` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-04`

---

## 62. POST /dicomweb/studies

- **Origen:** CONTRATO
- **Nombre:** Ingestar estudio DICOM (STOW-RS) y ubicaciones de objeto
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsImagingController.storeStudy` — `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:110`

### Qué es y para qué sirve (negocio)

Ingestar estudio DICOM (STOW-RS) y ubicaciones de objeto. Caso de uso UC-20-11: Ingestar estudio DICOM (STOW-RS). Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/diagnostics/README.md:120`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /dicomweb/studies` la atiende `DiagnosticsImagingController.storeStudy` (src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:110). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `StoreImagingStudyDto` (20 campos, 5 obligatorios). Delega en `DiagnosticsImagingService.storeStudy`. Crea filas en diagnostics.dicom_object_locations, diagnostics.imaging_instances, diagnostics.imaging_series, diagnostics.imaging_studies. Lee clinical.encounters, clinical.service_requests, diagnostics.imaging_endpoints, diagnostics.imaging_studies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.ts:110` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | DiagnosticsImagingController.storeStudy → DiagnosticsImagingService.storeStudy → DiagnosticsScopeService.encounter → ClinicalRefsRepository.findEncounter | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:24` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsImagingController.storeStudy → DiagnosticsImagingService.storeStudy → DiagnosticsScopeService.serviceRequest → ClinicalRefsRepository.findServiceRequest | `src/modules/diagnostics/repositories/clinical-refs.repository.ts:32` |
| `diagnostics.dicom_object_locations` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.storeStudy → DiagnosticsImagingService.storeStudy → ImagingRepository.createObjectLocation | `src/modules/diagnostics/repositories/imaging.repository.ts:375` |
| `diagnostics.imaging_endpoints` | LEE | LEE | DIRECTA | DiagnosticsImagingController.storeStudy → DiagnosticsImagingService.storeStudy → DiagnosticsScopeService.endpoint → ImagingRepository.findEndpoint | `src/modules/diagnostics/repositories/imaging.repository.ts:107` |
| `diagnostics.imaging_instances` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.storeStudy → DiagnosticsImagingService.storeStudy → ImagingRepository.createInstance | `src/modules/diagnostics/repositories/imaging.repository.ts:312` |
| `diagnostics.imaging_series` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.storeStudy → DiagnosticsImagingService.storeStudy → ImagingRepository.createSeries | `src/modules/diagnostics/repositories/imaging.repository.ts:260` |
| `diagnostics.imaging_studies` | ESCRIBE | CREA | DIRECTA | DiagnosticsImagingController.storeStudy → DiagnosticsImagingService.storeStudy → ImagingRepository.createStudy | `src/modules/diagnostics/repositories/imaging.repository.ts:201` |
| `diagnostics.imaging_studies` | LEE | LEE | DIRECTA | DiagnosticsImagingController.storeStudy → DiagnosticsImagingService.storeStudy → ImagingRepository.findStudyByUid | `src/modules/diagnostics/repositories/imaging.repository.ts:165` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: {message} |
| 409 | `CONFLICT` | ConflictException: El estudio DICOM ya fue almacenado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/diagnostics/controllers/diagnostics-imaging.controller.spec.ts:72` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `UC-20-11`

---

## 63. GET /public/diagnostic-reports/{versionId}/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar la autenticidad de un informe diagnóstico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DiagnosticsReportVerifyPublicController.verify` — `src/modules/diagnostics/controllers/diagnostics-report-verify-public.controller.ts:27`

### Qué es y para qué sirve (negocio)

Verificar la autenticidad de un informe diagnóstico. Dentro del módulo (descripción del modelo, en inglés): «Connects laboratory and imaging workflows to the patient chart while the heavy binary content remains in PACS/VNA or governed object storage.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_20_diagnostics.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /public/diagnostic-reports/{versionId}/verify` la atiende `DiagnosticsReportVerifyPublicController.verify` (src/modules/diagnostics/controllers/diagnostics-report-verify-public.controller.ts:27). Es una ruta pública: no exige token. Delega en `ReportReleaseService.verify`. Lee clinical.service_requests, diagnostics.diagnostic_report_versions, diagnostics.report_drafts, directory.tenants, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/diagnostics/controllers/diagnostics-report-verify-public.controller.ts:27` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId | `src/modules/diagnostics/controllers/diagnostics-report-verify-public.controller.ts:27` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/diagnostics/controllers/diagnostics-report-verify-public.controller.ts:27` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | DiagnosticsReportVerifyPublicController.verify → ReportReleaseService.verify | `src/modules/diagnostics/services/report-release.service.ts:130` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | DiagnosticsReportVerifyPublicController.verify → ReportReleaseService.verify | `src/modules/diagnostics/services/report-release.service.ts:127` |
| `diagnostics.report_drafts` | LEE | LEE | DIRECTA | DiagnosticsReportVerifyPublicController.verify → ReportReleaseService.verify → ReportDraftsRepository.findPublishedByVersion | `src/modules/diagnostics/repositories/report-drafts.repository.ts:87` |
| `directory.tenants` | LEE | LEE | DIRECTA | DiagnosticsReportVerifyPublicController.verify → ReportReleaseService.verify → LabReceptionRepository.findTenantNames | `src/modules/diagnostics/repositories/lab-reception.repository.ts:206` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | DiagnosticsReportVerifyPublicController.verify → ReportReleaseService.verify → LabReceptionRepository.findConceptDisplays | `src/modules/diagnostics/repositories/lab-reception.repository.ts:188` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReportVerificationDto>` · DTO `ReportVerificationDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: PUBLISHED | — | — | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:40` |
| `issuedAt` | `string` | Sí | formato date-time | — | — | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:41` |
| `issuerName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:42` |
| `studyName` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:43` |
| `contentHash` | `string` | Sí | — | — | — | `src/modules/diagnostics/dto/report-draft-publish.dto.ts:44` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Informe no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/diagnostics.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/report-drafts.int-spec.ts:306` |

### Flujos

- Módulo Diagnostics (20) — Laboratorio, Imagen Médica y Media Clínica — etapa `ctrl:DiagnosticsReportVerifyPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

