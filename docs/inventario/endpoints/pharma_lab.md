<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `pharma_lab`

- **Bloque:** —
- **Operaciones:** 76 (76 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 6 · MEDIO 40 · BAJO 30
- **Tablas distintas que tocan:** 48
- **Respuestas de error y detalle contractual:** `openapi/endpoints/pharma-lab.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/pharma-labs` | Listar laboratorios farmacéuticos | BAJO | 2 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 2 | POST | `/pharma-labs` | Registrar una organización laboratorio farmacéutico | MEDIO | 6 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 3 | GET | `/pharma-labs/{pharmaLabId}` | Consultar el perfil de un laboratorio | BAJO | 2 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 4 | PATCH | `/pharma-labs/{pharmaLabId}` | Actualizar el perfil institucional | MEDIO | 6 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 5 | POST | `/pharma-labs/{pharmaLabId}/cost-allocations` | Imputar un asiento contable a las dimensiones del laboratorio | MEDIO | 7 | PHARMA_LAB_ADMIN, ACCOUNTANT, FINANCE, PLATFORM_ADMIN |
| 6 | GET | `/pharma-labs/{pharmaLabId}/cost-allocations/report` | Rentabilidad por producto y costos por proyecto del periodo | BAJO | 3 | PHARMA_LAB_ADMIN, ACCOUNTANT, FINANCE, PLATFORM_ADMIN |
| 7 | GET | `/pharma-labs/{pharmaLabId}/link-events` | Historial de vinculaciones y permisos | BAJO | 3 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 8 | GET | `/pharma-labs/{pharmaLabId}/materials` | Listar el material informativo | BAJO | 2 | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, MEDICAL_VISITOR, PLATFORM_ADMIN |
| 9 | POST | `/pharma-labs/{pharmaLabId}/materials` | Crear material informativo (nace en borrador) | MEDIO | 6 | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN |
| 10 | GET | `/pharma-labs/{pharmaLabId}/materials/{materialId}/approvals` | Historial de revisiones del material | BAJO | 3 | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN |
| 11 | GET | `/pharma-labs/{pharmaLabId}/materials/{materialId}/assets` | Listar los adjuntos del material | BAJO | 3 | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, MEDICAL_VISITOR, PLATFORM_ADMIN |
| 12 | POST | `/pharma-labs/{pharmaLabId}/materials/{materialId}/assets` | Adjuntar un archivo al material | MEDIO | 3 | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN |
| 13 | POST | `/pharma-labs/{pharmaLabId}/materials/{materialId}/decision` | Aprobar o rechazar el material | MEDIO | 7 | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN |
| 14 | POST | `/pharma-labs/{pharmaLabId}/materials/{materialId}/submit` | Enviar el material a revisión interna | MEDIO | 7 | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN |
| 15 | GET | `/pharma-labs/{pharmaLabId}/medical-visitors` | Listar los visitadores del laboratorio | BAJO | 2 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 16 | POST | `/pharma-labs/{pharmaLabId}/medical-visitors` | Registrar un visitador médico | ALTO | 16 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 17 | PUT | `/pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/products` | Fijar los productos que el visitador representa | ALTO | 8 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 18 | POST | `/pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/relink` | Revincular a un visitador con nueva autorización | MEDIO | 12 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 19 | PUT | `/pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/specialties` | Fijar las especialidades que el visitador visita | ALTO | 7 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 20 | POST | `/pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/unlink` | Desvincular al visitador y revocar sus accesos | ALTO | 22 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 21 | POST | `/pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/verifications` | Registrar las verificaciones del visitador | MEDIO | 6 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 22 | GET | `/pharma-labs/{pharmaLabId}/pharmacovigilance/reports` | Listar los reportes del laboratorio | BAJO | 2 | PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN |
| 23 | POST | `/pharma-labs/{pharmaLabId}/pharmacovigilance/reports` | Enviar un reporte de farmacovigilancia | MEDIO | 10 | PRACTITIONER, CLINICIAN, PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, BUSINESS_ADMIN |
| 24 | GET | `/pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}` | Consultar un reporte con su trazabilidad | BAJO | 3 | PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN |
| 25 | POST | `/pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}/actions` | Registrar una acción de seguimiento | MEDIO | 7 | PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN |
| 26 | GET | `/pharma-labs/{pharmaLabId}/products` | Listar el catálogo de medicamentos | BAJO | 2 | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, MEDICAL_VISITOR, PLATFORM_ADMIN |
| 27 | POST | `/pharma-labs/{pharmaLabId}/products` | Registrar un medicamento en el catálogo | MEDIO | 5 | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN |
| 28 | PATCH | `/pharma-labs/{pharmaLabId}/products/{productId}` | Actualizar un medicamento | MEDIO | 6 | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN |
| 29 | POST | `/pharma-labs/{pharmaLabId}/products/{productId}/status` | Cambiar el estado regulatorio de un medicamento | MEDIO | 6 | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN |
| 30 | GET | `/pharma-labs/{pharmaLabId}/regulatory-documents` | Listar los documentos del laboratorio | BAJO | 2 | REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN |
| 31 | POST | `/pharma-labs/{pharmaLabId}/regulatory-documents` | Registrar un documento con su primera versión | MEDIO | 6 | REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN |
| 32 | GET | `/pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}` | Consultar un documento y sus versiones | MEDIO | 4 | REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN |
| 33 | GET | `/pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/access-log` | Registro de consultas y descargas | BAJO | 3 | REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN |
| 34 | POST | `/pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/invalidate` | Invalidar el documento sin borrarlo | MEDIO | 8 | REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN |
| 35 | POST | `/pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions` | Sustituir el documento por una versión nueva | MEDIO | 9 | REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN |
| 36 | POST | `/pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions/{versionId}/download` | Registrar la descarga de una versión | MEDIO | 7 | REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN |
| 37 | POST | `/pharma-labs/{pharmaLabId}/regulatory-documents/expirations/review` | Revisar vencimientos y notificar al personal | MEDIO | 5 | REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN |
| 38 | GET | `/pharma-labs/{pharmaLabId}/staff` | Listar el personal del laboratorio | BAJO | 2 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 39 | POST | `/pharma-labs/{pharmaLabId}/staff` | Vincular personal al laboratorio | MEDIO | 7 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 40 | PATCH | `/pharma-labs/{pharmaLabId}/staff/{staffId}/permissions` | Cambiar los permisos de un colaborador | MEDIO | 7 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 41 | POST | `/pharma-labs/{pharmaLabId}/staff/{staffId}/unlink` | Desvincular a un colaborador | MEDIO | 7 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 42 | GET | `/pharma-labs/{pharmaLabId}/visitor-posts` | Listar las publicaciones propuestas | BAJO | 2 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 43 | POST | `/pharma-labs/{pharmaLabId}/visitor-posts/{submissionId}/decision` | Aprobar o rechazar la publicación propuesta | MEDIO | 11 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 44 | POST | `/pharma-labs/notices/{noticeId}/read` | Marcar un aviso como leído | ALTO | 2 | sesión (sin roles) |
| 45 | GET | `/pharma-labs/notices/mine` | Avisos del laboratorio dirigidos a mi cuenta | BAJO | 1 | sesión (sin roles) |
| 46 | GET | `/pharma-labs/reference/concepts` | Diccionario de conceptos del laboratorio farmacéutico | BAJO | 0 | sesión (sin roles) |
| 47 | POST | `/pharma-labs/visitor-posts` | Proponer una publicación como visitador | MEDIO | 7 | MEDICAL_VISITOR |
| 48 | GET | `/visit-agenda/blocks` | Listar los bloqueos vigentes | BAJO | 1 | PRACTITIONER, CLINICIAN |
| 49 | POST | `/visit-agenda/blocks` | Bloquear un laboratorio o un visitador | MEDIO | 4 | PRACTITIONER, CLINICIAN |
| 50 | POST | `/visit-agenda/blocks/{blockId}/lift` | Levantar un bloqueo | MEDIO | 5 | PRACTITIONER, CLINICIAN |
| 51 | GET | `/visit-agenda/doctors/{doctorUserId}` | Consultar la agenda de visitas de un doctor | BAJO | 2 | MEDICAL_VISITOR, PHARMA_LAB_ADMIN, PRACTITIONER, CLINICIAN |
| 52 | GET | `/visit-agenda/me` | Consultar la propia agenda de visitas | BAJO | 2 | PRACTITIONER, CLINICIAN |
| 53 | PUT | `/visit-agenda/me` | Configurar la agenda de visitas del doctor | ALTO | 8 | PRACTITIONER, CLINICIAN |
| 54 | POST | `/visit-records` | Registrar la visita realizada | MEDIO | 15 | MEDICAL_VISITOR |
| 55 | POST | `/visit-records/{visitRecordId}/confirm` | Confirmar que la visita ocurrió | MEDIO | 5 | PRACTITIONER, CLINICIAN |
| 56 | POST | `/visit-records/{visitRecordId}/rating` | Calificar la visita completada | MEDIO | 9 | PRACTITIONER, CLINICIAN |
| 57 | GET | `/visit-records/inbox` | Listar las visitas recibidas | BAJO | 1 | PRACTITIONER, CLINICIAN |
| 58 | GET | `/visit-records/labs/{pharmaLabId}` | Historial de visitas del laboratorio | BAJO | 2 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 59 | GET | `/visit-records/labs/{pharmaLabId}/rating-summary` | Resultados agregados de las calificaciones del laboratorio | BAJO | 3 | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN |
| 60 | POST | `/visit-requests` | Solicitar una visita médica a un doctor | MEDIO | 23 | MEDICAL_VISITOR |
| 61 | GET | `/visit-requests/{visitRequestId}` | Consultar una solicitud con su bitácora | BAJO | 4 | MEDICAL_VISITOR, PRACTITIONER, CLINICIAN |
| 62 | POST | `/visit-requests/{visitRequestId}/accept` | Aceptar la visita | MEDIO | 8 | PRACTITIONER, CLINICIAN |
| 63 | POST | `/visit-requests/{visitRequestId}/cancel` | Cancelar la visita | MEDIO | 10 | MEDICAL_VISITOR, PRACTITIONER, CLINICIAN |
| 64 | POST | `/visit-requests/{visitRequestId}/propose-time` | Proponer otro horario | MEDIO | 17 | PRACTITIONER, CLINICIAN |
| 65 | POST | `/visit-requests/{visitRequestId}/reject` | Rechazar la visita | MEDIO | 8 | PRACTITIONER, CLINICIAN |
| 66 | POST | `/visit-requests/{visitRequestId}/request-info` | Solicitar información adicional al visitador | MEDIO | 7 | PRACTITIONER, CLINICIAN |
| 67 | POST | `/visit-requests/{visitRequestId}/reschedule` | Reprogramar la visita dentro del plazo permitido | MEDIO | 18 | MEDICAL_VISITOR |
| 68 | GET | `/visit-requests/inbox` | Listar las solicitudes de visita recibidas | BAJO | 1 | PRACTITIONER, CLINICIAN |
| 69 | GET | `/visit-requests/mine` | Listar las propias solicitudes de visita | BAJO | 2 | MEDICAL_VISITOR |
| 70 | GET | `/visit-surveys/labs/{pharmaLabId}` | Listar las encuestas del laboratorio | BAJO | 2 | PHARMA_LAB_ADMIN, PLATFORM_ADMIN |
| 71 | POST | `/visit-surveys/labs/{pharmaLabId}` | Configurar una encuesta posterior a la visita | MEDIO | 6 | PHARMA_LAB_ADMIN, PLATFORM_ADMIN |
| 72 | POST | `/visit-surveys/labs/{pharmaLabId}/{surveyId}/close` | Cerrar una encuesta | MEDIO | 6 | PHARMA_LAB_ADMIN, PLATFORM_ADMIN |
| 73 | GET | `/visit-surveys/labs/{pharmaLabId}/{surveyId}/results` | Resultados agregados de la encuesta | BAJO | 5 | PHARMA_LAB_ADMIN, PLATFORM_ADMIN |
| 74 | GET | `/visit-surveys/pending` | Listar las encuestas pendientes de responder | BAJO | 1 | PRACTITIONER, CLINICIAN |
| 75 | GET | `/visit-surveys/responses/{responseId}` | Consultar el cuestionario a responder | BAJO | 3 | PRACTITIONER, CLINICIAN |
| 76 | POST | `/visit-surveys/responses/{responseId}` | Responder la encuesta de la visita | MEDIO | 7 | PRACTITIONER, CLINICIAN |

---

## 1. GET /pharma-labs

- **Origen:** CONTRATO
- **Nombre:** Listar laboratorios farmacéuticos
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabsController.list` — `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:70`

### Qué es y para qué sirve (negocio)

Listar laboratorios farmacéuticos.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs` la atiende `PharmaLabsController.list` (src/modules/pharma_lab/controllers/pharma-labs.controller.ts:70). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Delega en `PharmaLabOrganizationService.listLabs`. Lee pharma_lab.pharma_lab_staff, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:70` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_lab_staff` | LEE | LEE | DIRECTA | PharmaLabsController.list → PharmaLabOrganizationService.listLabs → OrganizationRepository.findLabIdsWhereStaff | `src/modules/pharma_lab/repositories/organization.repository.ts:117` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaLabsController.list → PharmaLabOrganizationService.listLabs → OrganizationRepository.listLabs | `src/modules/pharma_lab/repositories/organization.repository.ts:59` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmaLabs[]>` · DTO `PharmaLabs`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:19` |
| `tenantId` | `string` | Sí | — | `@Property({ fieldName: 'tenant_id', type: 'uuid', unique: true })` | Identificador asociado a tenant. Uno a uno con la organización. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:25` |
| `labTypeConceptId` | `string` | Sí | — | `@Property({ fieldName: 'lab_type_concept_id', type: 'uuid' })` | Tipo de laboratorio: farmacéutico, desarrollador, fabricante, biotecnológica, distribuidor autorizado u organización de investigación. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:32` |
| `legalName` | `string` | Sí | — | `@Property({ fieldName: 'legal_name', columnType: 'varchar' })` | Razón social. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:38` |
| `tradeName` | `string` | No | — | `@Property({ fieldName: 'trade_name', columnType: 'varchar', nullable: true })` | Nombre comercial. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:44` |
| `taxId` | `string` | No | — | `@Property({ fieldName: 'tax_id', columnType: 'varchar', nullable: true })` | Identificación tributaria. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:50` |
| `logoUrl` | `string` | No | — | `@Property({ fieldName: 'logo_url', columnType: 'varchar', nullable: true })` | URL del logotipo institucional. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:56` |
| `description` | `string` | No | — | `@Property({ columnType: 'text', nullable: true })` | Descripción institucional. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:62` |
| `researchAreas` | `array<string>` | No | — | `@Property({ fieldName: 'research_areas', type: 'json', columnType: 'jsonb', nullable: true, })` | Áreas de investigación declaradas. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:73` |
| `contacts` | `object` | No | — | `@Property({ type: 'json', columnType: 'jsonb', nullable: true })` | Contactos institucionales (nombre, cargo, correo, teléfono). | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:79` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado del laboratorio. Es la puerta de la regla del carril: un visitador solo opera mientras su laboratorio esté activo. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:86` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:92` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:98` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:104` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:110` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:116` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /pharma-labs

- **Origen:** CONTRATO
- **Nombre:** Registrar una organización laboratorio farmacéutico
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabsController.create` — `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:52`

### Qué es y para qué sirve (negocio)

Registrar una organización laboratorio farmacéutico.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs` la atiende `PharmaLabsController.create` (src/modules/pharma_lab/controllers/pharma-labs.controller.ts:52). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `CreatePharmaLabDto` (8 campos, 3 obligatorios). Delega en `PharmaLabOrganizationService.createLab`. Crea filas en audit.audit_log, pharma_lab.pharma_labs. Lee audit.audit_log, directory.tenants, iam.sessions, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmaLabsController.create → PharmaLabOrganizationService.createLab → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmaLabsController.create → PharmaLabOrganizationService.createLab → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `directory.tenants` | LEE | LEE | DIRECTA | PharmaLabsController.create → PharmaLabOrganizationService.createLab | `src/modules/pharma_lab/services/pharma-lab-organization.service.ts:78` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmaLabsController.create → PharmaLabOrganizationService.createLab → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_labs` | ESCRIBE | CREA | DIRECTA | PharmaLabsController.create → PharmaLabOrganizationService.createLab → OrganizationRepository.createLab | `src/modules/pharma_lab/repositories/organization.repository.ts:70` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaLabsController.create → PharmaLabOrganizationService.createLab → OrganizationRepository.findLabByTenant | `src/modules/pharma_lab/repositories/organization.repository.ts:35` |

### Cuerpo — DTO `CreatePharmaLabDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant del directorio | `src/modules/pharma_lab/dto/organization.dto.ts:19` |
| `labTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/organization.dto.ts:26` |
| `legalName` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:34` |
| `tradeName` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:43` |
| `taxId` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:52` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/pharma_lab/dto/organization.dto.ts:60` |
| `researchAreas` | `array<string>` | No | máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` `@ArrayMaxSize(50)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:70` |
| `logoUrl` | `string` | No | longitud máxima 1024 | `@IsOptional()` `@IsString()` `@MaxLength(1024)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:79` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "labTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "legalName": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Organización no encontrada |
| 409 | `CONFLICT` | ConflictException: La organización ya está registrada como laboratorio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /pharma-labs/{pharmaLabId}

- **Origen:** CONTRATO
- **Nombre:** Consultar el perfil de un laboratorio
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabsController.getOne` — `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:77`

### Qué es y para qué sirve (negocio)

Consultar el perfil de un laboratorio.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}` la atiende `PharmaLabsController.getOne` (src/modules/pharma_lab/controllers/pharma-labs.controller.ts:77). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Delega en `PharmaLabOrganizationService.getLab`. Lee pharma_lab.pharma_lab_staff, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:77` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_lab_staff` | LEE | LEE | DIRECTA | PharmaLabsController.getOne → PharmaLabOrganizationService.getLab → PharmaLabAccessService.requireAdministeredLab → OrganizationRepository.findStaffByUser | `src/modules/pharma_lab/repositories/organization.repository.ts:101` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaLabsController.getOne → PharmaLabOrganizationService.getLab → PharmaLabAccessService.requireAdministeredLab → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmaLabs>` · DTO `PharmaLabs`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:19` |
| `tenantId` | `string` | Sí | — | `@Property({ fieldName: 'tenant_id', type: 'uuid', unique: true })` | Identificador asociado a tenant. Uno a uno con la organización. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:25` |
| `labTypeConceptId` | `string` | Sí | — | `@Property({ fieldName: 'lab_type_concept_id', type: 'uuid' })` | Tipo de laboratorio: farmacéutico, desarrollador, fabricante, biotecnológica, distribuidor autorizado u organización de investigación. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:32` |
| `legalName` | `string` | Sí | — | `@Property({ fieldName: 'legal_name', columnType: 'varchar' })` | Razón social. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:38` |
| `tradeName` | `string` | No | — | `@Property({ fieldName: 'trade_name', columnType: 'varchar', nullable: true })` | Nombre comercial. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:44` |
| `taxId` | `string` | No | — | `@Property({ fieldName: 'tax_id', columnType: 'varchar', nullable: true })` | Identificación tributaria. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:50` |
| `logoUrl` | `string` | No | — | `@Property({ fieldName: 'logo_url', columnType: 'varchar', nullable: true })` | URL del logotipo institucional. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:56` |
| `description` | `string` | No | — | `@Property({ columnType: 'text', nullable: true })` | Descripción institucional. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:62` |
| `researchAreas` | `array<string>` | No | — | `@Property({ fieldName: 'research_areas', type: 'json', columnType: 'jsonb', nullable: true, })` | Áreas de investigación declaradas. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:73` |
| `contacts` | `object` | No | — | `@Property({ type: 'json', columnType: 'jsonb', nullable: true })` | Contactos institucionales (nombre, cargo, correo, teléfono). | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:79` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado del laboratorio. Es la puerta de la regla del carril: un visitador solo opera mientras su laboratorio esté activo. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:86` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:92` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:98` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:104` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:110` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/pharma_labs.entity.ts:116` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El laboratorio no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. PATCH /pharma-labs/{pharmaLabId}

- **Origen:** CONTRATO
- **Nombre:** Actualizar el perfil institucional
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabsController.update` — `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:87`

### Qué es y para qué sirve (negocio)

Actualizar el perfil institucional.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PATCH /pharma-labs/{pharmaLabId}` la atiende `PharmaLabsController.update` (src/modules/pharma_lab/controllers/pharma-labs.controller.ts:87). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `UpdatePharmaLabDto` (6 campos, 0 obligatorios). Delega en `PharmaLabOrganizationService.updateLab`. Crea filas en audit.audit_log. Actualiza pharma_lab.pharma_labs. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_lab_staff, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:87` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmaLabsController.update → PharmaLabOrganizationService.updateLab → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmaLabsController.update → PharmaLabOrganizationService.updateLab → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmaLabsController.update → PharmaLabOrganizationService.updateLab → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_lab_staff` | LEE | LEE | DIRECTA | PharmaLabsController.update → PharmaLabOrganizationService.updateLab → PharmaLabAccessService.requireAdministeredLab → OrganizationRepository.findStaffByUser | `src/modules/pharma_lab/repositories/organization.repository.ts:101` |
| `pharma_lab.pharma_labs` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmaLabsController.update → PharmaLabOrganizationService.updateLab | `src/modules/pharma_lab/services/pharma-lab-organization.service.ts:143` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaLabsController.update → PharmaLabOrganizationService.updateLab → PharmaLabAccessService.requireAdministeredLab → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdatePharmaLabDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tradeName` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:91` |
| `taxId` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:100` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/pharma_lab/dto/organization.dto.ts:108` |
| `researchAreas` | `array<string>` | No | máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` `@ArrayMaxSize(50)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:118` |
| `logoUrl` | `string` | No | longitud máxima 1024 | `@IsOptional()` `@IsString()` `@MaxLength(1024)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:127` |
| `statusConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/organization.dto.ts:135` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El laboratorio no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /pharma-labs/{pharmaLabId}/cost-allocations

- **Origen:** CONTRATO
- **Nombre:** Imputar un asiento contable a las dimensiones del laboratorio
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabSocialController.allocate` — `src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:110`

### Qué es y para qué sirve (negocio)

Imputar un asiento contable a las dimensiones del laboratorio.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/cost-allocations` la atiende `PharmaLabSocialController.allocate` (src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:110). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, ACCOUNTANT, FINANCE, PLATFORM_ADMIN. Valida el cuerpo como `CreateCostAllocationDto` (11 campos, 5 obligatorios). Delega en `PharmaAnalyticsService.createAllocation`. Crea filas en audit.audit_log, pharma_lab.pharma_cost_allocations. Lee accounting.journal_transactions, audit.audit_log, iam.sessions, pharma_lab.pharma_labs, pharma_lab.pharma_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, ACCOUNTANT, FINANCE, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:110` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:110` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `accounting.journal_transactions` | LEE | LEE | DIRECTA | PharmaLabSocialController.allocate → PharmaAnalyticsService.createAllocation | `src/modules/pharma_lab/services/pharma-analytics.service.ts:92` |
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmaLabSocialController.allocate → PharmaAnalyticsService.createAllocation → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmaLabSocialController.allocate → PharmaAnalyticsService.createAllocation → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmaLabSocialController.allocate → PharmaAnalyticsService.createAllocation → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_cost_allocations` | ESCRIBE | CREA | DIRECTA | PharmaLabSocialController.allocate → PharmaAnalyticsService.createAllocation → AnalyticsRepository.createAllocation | `src/modules/pharma_lab/repositories/analytics.repository.ts:24` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaLabSocialController.allocate → PharmaAnalyticsService.createAllocation → PharmaLabAccessService.requireActiveLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.pharma_products` | LEE | LEE | DIRECTA | PharmaLabSocialController.allocate → PharmaAnalyticsService.createAllocation → CatalogRepository.findProduct | `src/modules/pharma_lab/repositories/catalog.repository.ts:22` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateCostAllocationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `journalTransactionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/accounting.dto.ts:24` |
| `costTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/accounting.dto.ts:31` |
| `amount` | `string` | Sí | — | `@IsNumberString()` | — | `src/modules/pharma_lab/dto/accounting.dto.ts:38` |
| `currencyConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/accounting.dto.ts:45` |
| `allocatedOn` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/pharma_lab/dto/accounting.dto.ts:52` |
| `pharmaProductId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/accounting.dto.ts:60` |
| `projectCode` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | — | `src/modules/pharma_lab/dto/accounting.dto.ts:69` |
| `branchId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/accounting.dto.ts:77` |
| `area` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/accounting.dto.ts:86` |
| `medicalVisitorId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/accounting.dto.ts:94` |
| `campaignCode` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | — | `src/modules/pharma_lab/dto/accounting.dto.ts:103` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "journalTransactionId": "00000000-0000-4000-8000-000000000001",
  "costTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "amount": "1500.00",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "allocatedOn": "2026-07-31"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Asiento contable no encontrado; ResourceNotFoundException: Producto no encontrado en el catálogo del laboratorio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El laboratorio no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabSocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /pharma-labs/{pharmaLabId}/cost-allocations/report

- **Origen:** CONTRATO
- **Nombre:** Rentabilidad por producto y costos por proyecto del periodo
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabSocialController.report` — `src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:130`

### Qué es y para qué sirve (negocio)

Rentabilidad por producto y costos por proyecto del periodo.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}/cost-allocations/report` la atiende `PharmaLabSocialController.report` (src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:130). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, ACCOUNTANT, FINANCE, PLATFORM_ADMIN. Delega en `PharmaAnalyticsService.getReport`. Lee pharma_lab.pharma_cost_allocations, pharma_lab.pharma_labs, pharma_lab.pharma_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, ACCOUNTANT, FINANCE, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:130` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:130` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_cost_allocations` | LEE | LEE | DIRECTA | PharmaLabSocialController.report → PharmaAnalyticsService.getReport → AnalyticsRepository.listAllocations | `src/modules/pharma_lab/repositories/analytics.repository.ts:46` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaLabSocialController.report → PharmaAnalyticsService.getReport → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.pharma_products` | LEE | LEE | DIRECTA | PharmaLabSocialController.report → PharmaAnalyticsService.getReport → CatalogRepository.listProducts | `src/modules/pharma_lab/repositories/catalog.repository.ts:51` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `from` | query | Sí | `string` | — |
| `to` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AllocationReport>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabSocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /pharma-labs/{pharmaLabId}/link-events

- **Origen:** CONTRATO
- **Nombre:** Historial de vinculaciones y permisos
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabsController.listLinkEvents` — `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:169`

### Qué es y para qué sirve (negocio)

Historial de vinculaciones y permisos.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}/link-events` la atiende `PharmaLabsController.listLinkEvents` (src/modules/pharma_lab/controllers/pharma-labs.controller.ts:169). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Delega en `PharmaLabOrganizationService.listLinkEvents`. Lee pharma_lab.pharma_lab_link_events, pharma_lab.pharma_lab_staff, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:169` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:169` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_lab_link_events` | LEE | LEE | DIRECTA | PharmaLabsController.listLinkEvents → PharmaLabOrganizationService.listLinkEvents → OrganizationRepository.listLinkEvents | `src/modules/pharma_lab/repositories/organization.repository.ts:193` |
| `pharma_lab.pharma_lab_staff` | LEE | LEE | DIRECTA | PharmaLabsController.listLinkEvents → PharmaLabOrganizationService.listLinkEvents → PharmaLabAccessService.requireAdministeredLab → OrganizationRepository.findStaffByUser | `src/modules/pharma_lab/repositories/organization.repository.ts:101` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaLabsController.listLinkEvents → PharmaLabOrganizationService.listLinkEvents → PharmaLabAccessService.requireAdministeredLab → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmaLabLinkEvents[]>` · DTO `PharmaLabLinkEvents`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/pharma_lab_link_events.entity.ts:20` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio en cuyo ámbito ocurre el evento. | `src/modules/pharma_lab/entities/pharma_lab_link_events.entity.ts:26` |
| `staffId` | `string` | No | — | `@Property({ fieldName: 'staff_id', type: 'uuid', nullable: true })` | Ficha de personal afectada, si el evento es de personal. | `src/modules/pharma_lab/entities/pharma_lab_link_events.entity.ts:32` |
| `medicalVisitorId` | `string` | No | — | `@Property({ fieldName: 'medical_visitor_id', type: 'uuid', nullable: true })` | Ficha de visitador afectada, si el evento es de un visitador. | `src/modules/pharma_lab/entities/pharma_lab_link_events.entity.ts:38` |
| `subjectUserId` | `string` | Sí | — | `@Property({ fieldName: 'subject_user_id', type: 'uuid' })` | Cuenta afectada. Se guarda desnormalizada a propósito: el evento debe seguir siendo legible aunque la ficha se archive. | `src/modules/pharma_lab/entities/pharma_lab_link_events.entity.ts:45` |
| `eventTypeConceptId` | `string` | Sí | — | `@Property({ fieldName: 'event_type_concept_id', type: 'uuid' })` | Qué ocurrió: vinculación, desvinculación, revinculación o cambio de permisos. | `src/modules/pharma_lab/entities/pharma_lab_link_events.entity.ts:51` |
| `reason` | `string` | No | — | `@Property({ columnType: 'text', nullable: true })` | Motivo declarado por quien ejecuta la acción. | `src/modules/pharma_lab/entities/pharma_lab_link_events.entity.ts:57` |
| `previousPermissions` | `array<string>` | No | — | `@Property({ fieldName: 'previous_permissions', type: 'json', columnType: 'jsonb', nullable: true, })` | Permisos antes del evento. | `src/modules/pharma_lab/entities/pharma_lab_link_events.entity.ts:68` |
| `newPermissions` | `array<string>` | No | — | `@Property({ fieldName: 'new_permissions', type: 'json', columnType: 'jsonb', nullable: true, })` | Permisos después del evento. | `src/modules/pharma_lab/entities/pharma_lab_link_events.entity.ts:79` |
| `revokedSessionCount` | `number` | No | — | `@Property({ fieldName: 'revoked_session_count', columnType: 'int', nullable: true, })` | Cantidad de sesiones revocadas por el evento, cuando aplica. | `src/modules/pharma_lab/entities/pharma_lab_link_events.entity.ts:89` |
| `occurredAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })` | Momento en que ocurrió. | `src/modules/pharma_lab/entities/pharma_lab_link_events.entity.ts:95` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/pharma_lab_link_events.entity.ts:101` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/pharma_lab_link_events.entity.ts:107` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El laboratorio no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /pharma-labs/{pharmaLabId}/materials

- **Origen:** CONTRATO
- **Nombre:** Listar el material informativo
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaCatalogController.listMaterials` — `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:143`

### Qué es y para qué sirve (negocio)

Listar el material informativo.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}/materials` la atiende `PharmaCatalogController.listMaterials` (src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:143). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, MEDICAL_VISITOR, PLATFORM_ADMIN. Delega en `PharmaCatalogService.listMaterials`. Lee pharma_lab.informational_materials, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, MEDICAL_VISITOR, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:143` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:143` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.informational_materials` | LEE | LEE | DIRECTA | PharmaCatalogController.listMaterials → PharmaCatalogService.listMaterials → CatalogRepository.listMaterials | `src/modules/pharma_lab/repositories/catalog.repository.ts:116` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaCatalogController.listMaterials → PharmaCatalogService.listMaterials → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<InformationalMaterials[]>` · DTO `InformationalMaterials`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:18` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio propietario. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:24` |
| `pharmaProductId` | `string` | No | — | `@Property({ fieldName: 'pharma_product_id', type: 'uuid', nullable: true })` | Medicamento al que se asocia, si aplica. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:30` |
| `campaignCode` | `string` | No | — | `@Property({ fieldName: 'campaign_code', columnType: 'varchar', nullable: true, })` | Campaña comercial a la que pertenece. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:40` |
| `specialtyConceptId` | `string` | No | — | `@Property({ fieldName: 'specialty_concept_id', type: 'uuid', nullable: true })` | Especialidad a la que está dirigido. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:46` |
| `medicalVisitorId` | `string` | No | — | `@Property({ fieldName: 'medical_visitor_id', type: 'uuid', nullable: true })` | Visitador al que se asigna en exclusiva, si corresponde. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:52` |
| `title` | `string` | Sí | — | `@Property({ columnType: 'varchar' })` | Título del material. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:58` |
| `kindConceptId` | `string` | Sí | — | `@Property({ fieldName: 'kind_concept_id', type: 'uuid' })` | Tipo: ficha técnica, estudio, documento científico, presentación, video o información regulatoria. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:65` |
| `version` | `string` | Sí | — | `@Property({ columnType: 'varchar' })` | Versión del material. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:71` |
| `authorName` | `string` | No | — | `@Property({ fieldName: 'author_name', columnType: 'varchar', nullable: true })` | Autor. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:77` |
| `approverStaffId` | `string` | No | — | `@Property({ fieldName: 'approver_staff_id', type: 'uuid', nullable: true })` | Responsable de la aprobación. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:83` |
| `validFrom` | `string` | No | — | `@Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })` | Inicio de vigencia. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:89` |
| `validTo` | `string` | No | — | `@Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })` | Fin de vigencia. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:95` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado de revisión/aprobación. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:101` |
| `disclosureLevelConceptId` | `string` | Sí | — | `@Property({ fieldName: 'disclosure_level_concept_id', type: 'uuid' })` | Nivel de divulgación. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:107` |
| `approvedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'approved_at', columnType: 'timestamptz', nullable: true, })` | Momento de la aprobación vigente. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:117` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:123` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:129` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:135` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:141` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/informational_materials.entity.ts:147` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /pharma-labs/{pharmaLabId}/materials

- **Origen:** CONTRATO
- **Nombre:** Crear material informativo (nace en borrador)
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaCatalogController.createMaterial` — `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:125`

### Qué es y para qué sirve (negocio)

Crear material informativo (nace en borrador).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/materials` la atiende `PharmaCatalogController.createMaterial` (src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:125). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. Valida el cuerpo como `CreateInformationalMaterialDto` (11 campos, 4 obligatorios). Delega en `PharmaCatalogService.createMaterial`. Crea filas en audit.audit_log, pharma_lab.informational_materials. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_labs, pharma_lab.pharma_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:125` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:125` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmaCatalogController.createMaterial → PharmaCatalogService.createMaterial → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmaCatalogController.createMaterial → PharmaCatalogService.createMaterial → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmaCatalogController.createMaterial → PharmaCatalogService.createMaterial → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.informational_materials` | ESCRIBE | CREA | DIRECTA | PharmaCatalogController.createMaterial → PharmaCatalogService.createMaterial → CatalogRepository.createMaterial | `src/modules/pharma_lab/repositories/catalog.repository.ts:134` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaCatalogController.createMaterial → PharmaCatalogService.createMaterial → PharmaLabAccessService.requireActiveLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.pharma_products` | LEE | LEE | DIRECTA | PharmaCatalogController.createMaterial → PharmaCatalogService.createMaterial → PharmaCatalogService.requireProduct → CatalogRepository.findProduct | `src/modules/pharma_lab/repositories/catalog.repository.ts:22` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateInformationalMaterialDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `title` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:226` |
| `kindConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:233` |
| `version` | `string` | Sí | longitud máxima 32 | `@IsString()` `@MaxLength(32)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:241` |
| `pharmaProductId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:249` |
| `campaignCode` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:258` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:266` |
| `medicalVisitorId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:274` |
| `authorName` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:283` |
| `validFrom` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:291` |
| `validTo` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:299` |
| `disclosureLevelConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:306` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "title": "valor-ejemplo",
  "kindConceptId": "00000000-0000-4000-8000-000000000001",
  "version": "v1.0",
  "disclosureLevelConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Producto no encontrado en el catálogo del laboratorio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El laboratorio no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. GET /pharma-labs/{pharmaLabId}/materials/{materialId}/approvals

- **Origen:** CONTRATO
- **Nombre:** Historial de revisiones del material
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaCatalogController.listApprovals` — `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:228`

### Qué es y para qué sirve (negocio)

Historial de revisiones del material.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}/materials/{materialId}/approvals` la atiende `PharmaCatalogController.listApprovals` (src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:228). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. Delega en `PharmaCatalogService.listApprovals`. Lee pharma_lab.informational_materials, pharma_lab.material_approvals, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:228` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, materialId | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:228` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.informational_materials` | LEE | LEE | DIRECTA | PharmaCatalogController.listApprovals → PharmaCatalogService.listApprovals → PharmaCatalogService.requireMaterial → CatalogRepository.findMaterial | `src/modules/pharma_lab/repositories/catalog.repository.ts:87` |
| `pharma_lab.material_approvals` | LEE | LEE | DIRECTA | PharmaCatalogController.listApprovals → PharmaCatalogService.listApprovals → CatalogRepository.listApprovals | `src/modules/pharma_lab/repositories/catalog.repository.ts:212` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaCatalogController.listApprovals → PharmaCatalogService.listApprovals → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `materialId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MaterialApprovals[]>` · DTO `MaterialApprovals`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/material_approvals.entity.ts:15` |
| `informationalMaterialId` | `string` | Sí | — | `@Property({ fieldName: 'informational_material_id', type: 'uuid' })` | Material revisado. | `src/modules/pharma_lab/entities/material_approvals.entity.ts:21` |
| `materialVersion` | `string` | Sí | — | `@Property({ fieldName: 'material_version', columnType: 'varchar' })` | Versión del material sobre la que recae la decisión. | `src/modules/pharma_lab/entities/material_approvals.entity.ts:27` |
| `decisionConceptId` | `string` | Sí | — | `@Property({ fieldName: 'decision_concept_id', type: 'uuid' })` | Decisión: aprobado o rechazado. | `src/modules/pharma_lab/entities/material_approvals.entity.ts:33` |
| `reviewerStaffId` | `string` | No | — | `@Property({ fieldName: 'reviewer_staff_id', type: 'uuid', nullable: true })` | Ficha de personal que decide. | `src/modules/pharma_lab/entities/material_approvals.entity.ts:39` |
| `rationale` | `string` | No | — | `@Property({ columnType: 'text', nullable: true })` | Fundamento de la decisión. | `src/modules/pharma_lab/entities/material_approvals.entity.ts:45` |
| `decidedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'decided_at', columnType: 'timestamptz' })` | Momento de la decisión. | `src/modules/pharma_lab/entities/material_approvals.entity.ts:51` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/material_approvals.entity.ts:57` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/material_approvals.entity.ts:63` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Material informativo no encontrado en el laboratorio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. GET /pharma-labs/{pharmaLabId}/materials/{materialId}/assets

- **Origen:** CONTRATO
- **Nombre:** Listar los adjuntos del material
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaCatalogController.listAssets` — `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:177`

### Qué es y para qué sirve (negocio)

Listar los adjuntos del material.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}/materials/{materialId}/assets` la atiende `PharmaCatalogController.listAssets` (src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:177). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, MEDICAL_VISITOR, PLATFORM_ADMIN. Delega en `PharmaCatalogService.listAssets`. Lee pharma_lab.informational_materials, pharma_lab.material_assets, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, MEDICAL_VISITOR, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:177` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, materialId | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:177` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.informational_materials` | LEE | LEE | DIRECTA | PharmaCatalogController.listAssets → PharmaCatalogService.listAssets → PharmaCatalogService.requireMaterial → CatalogRepository.findMaterial | `src/modules/pharma_lab/repositories/catalog.repository.ts:87` |
| `pharma_lab.material_assets` | LEE | LEE | DIRECTA | PharmaCatalogController.listAssets → PharmaCatalogService.listAssets → CatalogRepository.listAssets | `src/modules/pharma_lab/repositories/catalog.repository.ts:174` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaCatalogController.listAssets → PharmaCatalogService.listAssets → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `materialId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MaterialAssets[]>` · DTO `MaterialAssets`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/material_assets.entity.ts:18` |
| `informationalMaterialId` | `string` | Sí | — | `@Property({ fieldName: 'informational_material_id', type: 'uuid' })` | Material al que pertenece el adjunto. | `src/modules/pharma_lab/entities/material_assets.entity.ts:24` |
| `kindConceptId` | `string` | Sí | — | `@Property({ fieldName: 'kind_concept_id', type: 'uuid' })` | Tipo del adjunto. | `src/modules/pharma_lab/entities/material_assets.entity.ts:30` |
| `fileName` | `string` | Sí | — | `@Property({ fieldName: 'file_name', columnType: 'varchar' })` | Nombre visible del adjunto. | `src/modules/pharma_lab/entities/material_assets.entity.ts:36` |
| `storageKey` | `string` | Sí | — | `@Property({ fieldName: 'storage_key', columnType: 'varchar' })` | Referencia del archivo en el almacén. | `src/modules/pharma_lab/entities/material_assets.entity.ts:42` |
| `contentType` | `string` | No | — | `@Property({ fieldName: 'content_type', columnType: 'varchar', nullable: true, })` | Tipo MIME. | `src/modules/pharma_lab/entities/material_assets.entity.ts:52` |
| `sizeBytes` | `string` | No | — | `@Property({ fieldName: 'size_bytes', columnType: 'bigint', nullable: true })` | Tamaño en bytes. | `src/modules/pharma_lab/entities/material_assets.entity.ts:58` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/material_assets.entity.ts:64` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/material_assets.entity.ts:70` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Material informativo no encontrado en el laboratorio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /pharma-labs/{pharmaLabId}/materials/{materialId}/assets

- **Origen:** CONTRATO
- **Nombre:** Adjuntar un archivo al material
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaCatalogController.addAsset` — `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:158`

### Qué es y para qué sirve (negocio)

Adjuntar un archivo al material.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/materials/{materialId}/assets` la atiende `PharmaCatalogController.addAsset` (src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:158). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. Valida el cuerpo como `AddMaterialAssetDto` (5 campos, 3 obligatorios). Delega en `PharmaCatalogService.addAsset`. Crea filas en pharma_lab.material_assets. Lee pharma_lab.informational_materials, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:158` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, materialId | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:158` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.informational_materials` | LEE | LEE | DIRECTA | PharmaCatalogController.addAsset → PharmaCatalogService.addAsset → PharmaCatalogService.requireMaterial → CatalogRepository.findMaterial | `src/modules/pharma_lab/repositories/catalog.repository.ts:87` |
| `pharma_lab.material_assets` | ESCRIBE | CREA | DIRECTA | PharmaCatalogController.addAsset → PharmaCatalogService.addAsset → CatalogRepository.createAsset | `src/modules/pharma_lab/repositories/catalog.repository.ts:152` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaCatalogController.addAsset → PharmaCatalogService.addAsset → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `materialId` | path | Sí | `string` | — |

### Cuerpo — DTO `AddMaterialAssetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kindConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:316` |
| `fileName` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:324` |
| `storageKey` | `string` | Sí | longitud máxima 512 | `@IsString()` `@MaxLength(512)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:332` |
| `contentType` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:341` |
| `sizeBytes` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:349` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "kindConceptId": "00000000-0000-4000-8000-000000000001",
  "fileName": "Nombre de ejemplo",
  "storageKey": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "kindConceptId": "00000000-0000-4000-8000-000000000001",
  "fileName": "Nombre de ejemplo",
  "storageKey": "valor-ejemplo",
  "contentType": "valor-ejemplo",
  "sizeBytes": "104857"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Material informativo no encontrado en el laboratorio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se puede modificar el contenido de un material ya aprobado; cree una versión nueva |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /pharma-labs/{pharmaLabId}/materials/{materialId}/decision

- **Origen:** CONTRATO
- **Nombre:** Aprobar o rechazar el material
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaCatalogController.decideMaterial` — `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:210`

### Qué es y para qué sirve (negocio)

Aprobar o rechazar el material.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/materials/{materialId}/decision` la atiende `PharmaCatalogController.decideMaterial` (src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:210). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. Valida el cuerpo como `DecideMaterialDto` (3 campos, 2 obligatorios). Delega en `PharmaCatalogService.decideMaterial`. Crea filas en audit.audit_log, pharma_lab.material_approvals. Actualiza pharma_lab.informational_materials. Lee audit.audit_log, iam.sessions, pharma_lab.informational_materials, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:210` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, materialId | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:210` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmaCatalogController.decideMaterial → PharmaCatalogService.decideMaterial → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmaCatalogController.decideMaterial → PharmaCatalogService.decideMaterial → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmaCatalogController.decideMaterial → PharmaCatalogService.decideMaterial → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.informational_materials` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmaCatalogController.decideMaterial → PharmaCatalogService.decideMaterial | `src/modules/pharma_lab/services/pharma-catalog.service.ts:447` |
| `pharma_lab.informational_materials` | LEE | LEE | DIRECTA | PharmaCatalogController.decideMaterial → PharmaCatalogService.decideMaterial → PharmaCatalogService.requireMaterial → CatalogRepository.findMaterial | `src/modules/pharma_lab/repositories/catalog.repository.ts:87` |
| `pharma_lab.material_approvals` | ESCRIBE | CREA | DIRECTA | PharmaCatalogController.decideMaterial → PharmaCatalogService.decideMaterial → CatalogRepository.createApproval | `src/modules/pharma_lab/repositories/catalog.repository.ts:189` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaCatalogController.decideMaterial → PharmaCatalogService.decideMaterial → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `materialId` | path | Sí | `string` | — |

### Cuerpo — DTO `DecideMaterialDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decisionConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:359` |
| `reviewerStaffId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:367` |
| `rationale` | `string` | Sí | longitud máxima 1000 | `@IsString()` `@MaxLength(1000)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:375` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decisionConceptId": "00000000-0000-4000-8000-000000000001",
  "rationale": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decisionConceptId": "00000000-0000-4000-8000-000000000001",
  "reviewerStaffId": "00000000-0000-4000-8000-000000000001",
  "rationale": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Material informativo no encontrado en el laboratorio |
| 409 | `CONFLICT` | ConflictException: Solo se decide sobre un material en revisión |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La decisión debe ser aprobar o rechazar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /pharma-labs/{pharmaLabId}/materials/{materialId}/submit

- **Origen:** CONTRATO
- **Nombre:** Enviar el material a revisión interna
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaCatalogController.submitMaterial` — `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:193`

### Qué es y para qué sirve (negocio)

Enviar el material a revisión interna.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/materials/{materialId}/submit` la atiende `PharmaCatalogController.submitMaterial` (src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:193). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. Delega en `PharmaCatalogService.submitMaterialForReview`. Crea filas en audit.audit_log. Actualiza pharma_lab.informational_materials. Lee audit.audit_log, iam.sessions, pharma_lab.informational_materials, pharma_lab.material_assets, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:193` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, materialId | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:193` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmaCatalogController.submitMaterial → PharmaCatalogService.submitMaterialForReview → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmaCatalogController.submitMaterial → PharmaCatalogService.submitMaterialForReview → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmaCatalogController.submitMaterial → PharmaCatalogService.submitMaterialForReview → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.informational_materials` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmaCatalogController.submitMaterial → PharmaCatalogService.submitMaterialForReview | `src/modules/pharma_lab/services/pharma-catalog.service.ts:396` |
| `pharma_lab.informational_materials` | LEE | LEE | DIRECTA | PharmaCatalogController.submitMaterial → PharmaCatalogService.submitMaterialForReview → PharmaCatalogService.requireMaterial → CatalogRepository.findMaterial | `src/modules/pharma_lab/repositories/catalog.repository.ts:87` |
| `pharma_lab.material_assets` | LEE | LEE | DIRECTA | PharmaCatalogController.submitMaterial → PharmaCatalogService.submitMaterialForReview → CatalogRepository.listAssets | `src/modules/pharma_lab/repositories/catalog.repository.ts:174` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaCatalogController.submitMaterial → PharmaCatalogService.submitMaterialForReview → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `materialId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Material informativo no encontrado en el laboratorio |
| 409 | `CONFLICT` | ConflictException: Solo se envía a revisión un material en borrador |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El material no tiene ningún adjunto que revisar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. GET /pharma-labs/{pharmaLabId}/medical-visitors

- **Origen:** CONTRATO
- **Nombre:** Listar los visitadores del laboratorio
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalVisitorsController.list` — `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:73`

### Qué es y para qué sirve (negocio)

Listar los visitadores del laboratorio.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}/medical-visitors` la atiende `MedicalVisitorsController.list` (src/modules/pharma_lab/controllers/medical-visitors.controller.ts:73). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Delega en `MedicalVisitorsService.listVisitors`. Lee pharma_lab.medical_visitors, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:73` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | MedicalVisitorsController.list → MedicalVisitorsService.listVisitors → VisitorsRepository.listVisitors | `src/modules/pharma_lab/repositories/visitors.repository.ts:74` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | MedicalVisitorsController.list → MedicalVisitorsService.listVisitors → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MedicalVisitors[]>` · DTO `MedicalVisitors`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:22` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio del que depende. Sin él la cuenta no puede existir. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:28` |
| `userId` | `string` | Sí | — | `@Property({ fieldName: 'user_id', type: 'uuid', unique: true })` | Cuenta de la plataforma, creada por la organización. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:34` |
| `staffId` | `string` | No | — | `@Property({ fieldName: 'staff_id', type: 'uuid', nullable: true })` | Ficha de personal correspondiente, cuando el visitador es además plantilla. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:40` |
| `fullName` | `string` | Sí | — | `@Property({ fieldName: 'full_name', columnType: 'varchar' })` | Nombre completo tal como lo registra la organización. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:46` |
| `photoUrl` | `string` | No | — | `@Property({ fieldName: 'photo_url', columnType: 'varchar', nullable: true })` | URL de la fotografía. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:52` |
| `internalCode` | `string` | Sí | — | `@Property({ fieldName: 'internal_code', columnType: 'varchar' })` | Código interno del visitador dentro del laboratorio. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:58` |
| `position` | `string` | No | — | `@Property({ columnType: 'varchar', nullable: true })` | Cargo. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:64` |
| `supervisorStaffId` | `string` | No | — | `@Property({ fieldName: 'supervisor_staff_id', type: 'uuid', nullable: true })` | Supervisor, como ficha de personal del mismo laboratorio. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:70` |
| `branchId` | `string` | No | — | `@Property({ fieldName: 'branch_id', type: 'uuid', nullable: true })` | Sede a la que reporta. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:76` |
| `region` | `string` | No | — | `@Property({ columnType: 'varchar', nullable: true })` | Región geográfica asignada. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:82` |
| `commercialArea` | `string` | No | — | `@Property({ fieldName: 'commercial_area', columnType: 'varchar', nullable: true, })` | Área comercial. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:92` |
| `assignedZone` | `string` | No | — | `@Property({ fieldName: 'assigned_zone', columnType: 'varchar', nullable: true, })` | Zona asignada dentro del área comercial. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:102` |
| `startedOn` | `string` | Sí | — | `@Property({ fieldName: 'started_on', columnType: 'date' })` | Fecha de inicio de la vinculación. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:108` |
| `endedOn` | `string` | No | — | `@Property({ fieldName: 'ended_on', columnType: 'date', nullable: true })` | Fecha de finalización prevista o efectiva. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:114` |
| `identityVerificationConceptId` | `string` | Sí | — | `@Property({ fieldName: 'identity_verification_concept_id', type: 'uuid' })` | Verificación de identidad. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:120` |
| `contractVerificationConceptId` | `string` | Sí | — | `@Property({ fieldName: 'contract_verification_concept_id', type: 'uuid' })` | Verificación del contrato. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:126` |
| `credentialVerificationConceptId` | `string` | Sí | — | `@Property({ fieldName: 'credential_verification_concept_id', type: 'uuid' })` | Verificación de credenciales. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:132` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado de la vinculación. `LINK_ACTIVE` es la única que habilita operar. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:138` |
| `publiclyListed` | `boolean` | Sí | — | `@Property({ fieldName: 'publicly_listed', type: 'boolean' })` | Si el perfil se muestra públicamente. Al desvincular pasa a `false` (spec 5331). | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:145` |
| `unlinkedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'unlinked_at', columnType: 'timestamptz', nullable: true, })` | Momento de la desvinculación, cuando ocurrió. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:155` |
| `unlinkReason` | `string` | No | — | `@Property({ fieldName: 'unlink_reason', columnType: 'text', nullable: true })` | Motivo de la desvinculación. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:161` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:167` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:173` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:179` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:185` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/medical_visitors.entity.ts:191` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:MedicalVisitorsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /pharma-labs/{pharmaLabId}/medical-visitors

- **Origen:** CONTRATO
- **Nombre:** Registrar un visitador médico
- **Bloque:** —
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalVisitorsController.create` — `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:56`

### Qué es y para qué sirve (negocio)

Registrar un visitador médico.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/medical-visitors` la atiende `MedicalVisitorsController.create` (src/modules/pharma_lab/controllers/medical-visitors.controller.ts:56). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `CreateMedicalVisitorDto` (14 campos, 4 obligatorios). Delega en `MedicalVisitorsService.createVisitor`. Crea filas en audit.audit_log, authz.user_role_assignments, pharma_lab.medical_visitor_products, pharma_lab.medical_visitor_specialties, pharma_lab.medical_visitors, pharma_lab.pharma_lab_link_events. Borra de pharma_lab.medical_visitor_products, pharma_lab.medical_visitor_specialties. Lee audit.audit_log, authz.roles, authz.user_role_assignments, iam.sessions, iam.users, pharma_lab.medical_visitors, pharma_lab.pharma_labs, pharma_lab.pharma_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:56` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:56` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.roles` | LEE | LEE | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → MedicalVisitorsService.assignVisitorRole → AuthzGrantsService.assignRole → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_role_assignments` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → MedicalVisitorsService.assignVisitorRole → AuthzGrantsService.assignRole → UserRoleAssignmentsRepository.create | `src/modules/authz/repositories/user-role-assignments.repository.ts:123` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → MedicalVisitorsService.assignVisitorRole → AuthzGrantsService.assignRole → UserRoleAssignmentsRepository.findActive | `src/modules/authz/repositories/user-role-assignments.repository.ts:73` |
| `iam.sessions` | LEE | LEE | POR_SQL | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `iam.users` | LEE | LEE | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor | `src/modules/pharma_lab/services/medical-visitors.service.ts:162` |
| `pharma_lab.medical_visitor_products` | BORRA | BORRA | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → VisitorsRepository.replaceProducts | `src/modules/pharma_lab/repositories/visitors.repository.ts:158` |
| `pharma_lab.medical_visitor_products` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → VisitorsRepository.replaceProducts | `src/modules/pharma_lab/repositories/visitors.repository.ts:160` |
| `pharma_lab.medical_visitor_specialties` | BORRA | BORRA | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → VisitorsRepository.replaceSpecialties | `src/modules/pharma_lab/repositories/visitors.repository.ts:113` |
| `pharma_lab.medical_visitor_specialties` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → VisitorsRepository.replaceSpecialties | `src/modules/pharma_lab/repositories/visitors.repository.ts:115` |
| `pharma_lab.medical_visitors` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → VisitorsRepository.createVisitor | `src/modules/pharma_lab/repositories/visitors.repository.ts:92` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → VisitorsRepository.findVisitorByUser | `src/modules/pharma_lab/repositories/visitors.repository.ts:44` |
| `pharma_lab.pharma_lab_link_events` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → OrganizationRepository.appendLinkEvent | `src/modules/pharma_lab/repositories/organization.repository.ts:170` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → PharmaLabAccessService.requireActiveLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.pharma_products` | LEE | LEE | DIRECTA | MedicalVisitorsController.create → MedicalVisitorsService.createVisitor → MedicalVisitorsService.assertProductsBelongToLab → CatalogRepository.findProductsByIds | `src/modules/pharma_lab/repositories/catalog.repository.ts:37` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateMedicalVisitorDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta creada por la organización | `src/modules/pharma_lab/dto/visitors.dto.ts:27` |
| `fullName` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:35` |
| `internalCode` | `string` | Sí | longitud máxima 64 | `@IsString()` `@MaxLength(64)` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:43` |
| `photoUrl` | `string` | No | longitud máxima 1024 | `@IsOptional()` `@IsString()` `@MaxLength(1024)` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:52` |
| `position` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:61` |
| `supervisorStaffId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:69` |
| `branchId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:77` |
| `region` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:86` |
| `commercialArea` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:95` |
| `assignedZone` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:104` |
| `startedOn` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:111` |
| `endedOn` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:119` |
| `specialtyConceptIds` | `array<string>` | No | formato uuid; máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` `@ArrayMaxSize(50)` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:129` |
| `pharmaProductIds` | `array<string>` | No | formato uuid; máximo 200 elemento(s) | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` `@ArrayMaxSize(200)` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:139` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "fullName": "Nombre de ejemplo",
  "internalCode": "CODIGO_EJEMPLO",
  "startedOn": "2026-07-31"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Cuenta no encontrada; ResourceNotFoundException: Rol no encontrado |
| 409 | `CONFLICT` | ConflictException: La cuenta ya está registrada como visitador; ConflictException: El código interno ya está en uso en el laboratorio; ConflictException: El usuario ya tiene ese rol asignado y activo en ese ámbito |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El laboratorio no está activo; PreconditionFailedException: Algún producto no pertenece al catálogo del laboratorio; PreconditionFailedException: Indique el rol a asignar por `roleId` o por `roleCode`; PreconditionFailedException: El rol no es asignable; PreconditionFailedException: Un rol de ámbito global se asigna sin tenant, sede ni consultorio; PreconditionFailedException: validFrom debe ser anterior a validTo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:MedicalVisitorsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/products

- **Origen:** CONTRATO
- **Nombre:** Fijar los productos que el visitador representa
- **Bloque:** —
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalVisitorsController.setProducts` — `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:104`

### Qué es y para qué sirve (negocio)

Fijar los productos que el visitador representa.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/products` la atiende `MedicalVisitorsController.setProducts` (src/modules/pharma_lab/controllers/medical-visitors.controller.ts:104). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `SetVisitorProductsDto` (1 campo, 1 obligatorio). Delega en `MedicalVisitorsService.setProducts`. Crea filas en audit.audit_log, pharma_lab.medical_visitor_products. Borra de pharma_lab.medical_visitor_products. Lee audit.audit_log, iam.sessions, pharma_lab.medical_visitors, pharma_lab.pharma_labs, pharma_lab.pharma_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, medicalVisitorId | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:104` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.setProducts → MedicalVisitorsService.setProducts → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | MedicalVisitorsController.setProducts → MedicalVisitorsService.setProducts → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | MedicalVisitorsController.setProducts → MedicalVisitorsService.setProducts → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.medical_visitor_products` | BORRA | BORRA | DIRECTA | MedicalVisitorsController.setProducts → MedicalVisitorsService.setProducts → VisitorsRepository.replaceProducts | `src/modules/pharma_lab/repositories/visitors.repository.ts:158` |
| `pharma_lab.medical_visitor_products` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.setProducts → MedicalVisitorsService.setProducts → VisitorsRepository.replaceProducts | `src/modules/pharma_lab/repositories/visitors.repository.ts:160` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | MedicalVisitorsController.setProducts → MedicalVisitorsService.setProducts → PharmaLabAccessService.requireVisitorOfLab → VisitorsRepository.findVisitor | `src/modules/pharma_lab/repositories/visitors.repository.ts:30` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | MedicalVisitorsController.setProducts → MedicalVisitorsService.setProducts → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.pharma_products` | LEE | LEE | DIRECTA | MedicalVisitorsController.setProducts → MedicalVisitorsService.setProducts → MedicalVisitorsService.assertProductsBelongToLab → CatalogRepository.findProductsByIds | `src/modules/pharma_lab/repositories/catalog.repository.ts:37` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `medicalVisitorId` | path | Sí | `string` | — |

### Cuerpo — DTO `SetVisitorProductsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmaProductIds` | `array<string>` | Sí | formato uuid; máximo 200 elemento(s) | `@IsArray()` `@IsUUID('4', { each: true })` `@ArrayMaxSize(200)` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:178` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "pharmaProductIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "pharmaProductIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Visitador no encontrado en el laboratorio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Algún producto no pertenece al catálogo del laboratorio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:MedicalVisitorsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/relink

- **Origen:** CONTRATO
- **Nombre:** Revincular a un visitador con nueva autorización
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalVisitorsController.relink` — `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:169`

### Qué es y para qué sirve (negocio)

Revincular a un visitador con nueva autorización.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/relink` la atiende `MedicalVisitorsController.relink` (src/modules/pharma_lab/controllers/medical-visitors.controller.ts:169). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `RelinkMedicalVisitorDto` (2 campos, 2 obligatorios). Delega en `MedicalVisitorsService.relinkVisitor`. Crea filas en audit.audit_log, authz.user_role_assignments, pharma_lab.pharma_lab_link_events. Actualiza iam.users, pharma_lab.medical_visitors. Lee audit.audit_log, authz.roles, authz.user_role_assignments, iam.sessions, iam.users, pharma_lab.medical_visitors, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:169` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, medicalVisitorId | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:169` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.relink → MedicalVisitorsService.relinkVisitor → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | MedicalVisitorsController.relink → MedicalVisitorsService.relinkVisitor → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.roles` | LEE | LEE | DIRECTA | MedicalVisitorsController.relink → MedicalVisitorsService.relinkVisitor → MedicalVisitorsService.assignVisitorRole → AuthzGrantsService.assignRole → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_role_assignments` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.relink → MedicalVisitorsService.relinkVisitor → MedicalVisitorsService.assignVisitorRole → AuthzGrantsService.assignRole → UserRoleAssignmentsRepository.create | `src/modules/authz/repositories/user-role-assignments.repository.ts:123` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | MedicalVisitorsController.relink → MedicalVisitorsService.relinkVisitor → MedicalVisitorsService.assignVisitorRole → AuthzGrantsService.assignRole → UserRoleAssignmentsRepository.findActive | `src/modules/authz/repositories/user-role-assignments.repository.ts:73` |
| `iam.sessions` | LEE | LEE | POR_SQL | MedicalVisitorsController.relink → MedicalVisitorsService.relinkVisitor → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | MedicalVisitorsController.relink → MedicalVisitorsService.relinkVisitor | `src/modules/pharma_lab/services/medical-visitors.service.ts:618` |
| `iam.users` | LEE | LEE | DIRECTA | MedicalVisitorsController.relink → MedicalVisitorsService.relinkVisitor | `src/modules/pharma_lab/services/medical-visitors.service.ts:616` |
| `pharma_lab.medical_visitors` | ESCRIBE | ACTUALIZA | POR_TIPO | MedicalVisitorsController.relink → MedicalVisitorsService.relinkVisitor | `src/modules/pharma_lab/services/medical-visitors.service.ts:605` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | MedicalVisitorsController.relink → MedicalVisitorsService.relinkVisitor → PharmaLabAccessService.requireVisitorOfLab → VisitorsRepository.findVisitor | `src/modules/pharma_lab/repositories/visitors.repository.ts:30` |
| `pharma_lab.pharma_lab_link_events` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.relink → MedicalVisitorsService.relinkVisitor → OrganizationRepository.appendLinkEvent | `src/modules/pharma_lab/repositories/organization.repository.ts:170` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | MedicalVisitorsController.relink → MedicalVisitorsService.relinkVisitor → PharmaLabAccessService.requireActiveLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `medicalVisitorId` | path | Sí | `string` | — |

### Cuerpo — DTO `RelinkMedicalVisitorDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `startedOn` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:203` |
| `authorization` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:211` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "startedOn": "2026-07-31",
  "authorization": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "startedOn": "2026-07-31",
  "authorization": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Visitador no encontrado en el laboratorio; ResourceNotFoundException: Rol no encontrado |
| 409 | `CONFLICT` | ConflictException: El visitador ya está vinculado; ConflictException: El usuario ya tiene ese rol asignado y activo en ese ámbito |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El laboratorio no está activo; PreconditionFailedException: Indique el rol a asignar por `roleId` o por `roleCode`; PreconditionFailedException: El rol no es asignable; PreconditionFailedException: Un rol de ámbito global se asigna sin tenant, sede ni consultorio; PreconditionFailedException: validFrom debe ser anterior a validTo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:MedicalVisitorsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/specialties

- **Origen:** CONTRATO
- **Nombre:** Fijar las especialidades que el visitador visita
- **Bloque:** —
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalVisitorsController.setSpecialties` — `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:121`

### Qué es y para qué sirve (negocio)

Fijar las especialidades que el visitador visita.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PUT /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/specialties` la atiende `MedicalVisitorsController.setSpecialties` (src/modules/pharma_lab/controllers/medical-visitors.controller.ts:121). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `SetVisitorSpecialtiesDto` (1 campo, 1 obligatorio). Delega en `MedicalVisitorsService.setSpecialties`. Crea filas en audit.audit_log, pharma_lab.medical_visitor_specialties. Borra de pharma_lab.medical_visitor_specialties. Lee audit.audit_log, iam.sessions, pharma_lab.medical_visitors, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:121` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, medicalVisitorId | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:121` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.setSpecialties → MedicalVisitorsService.setSpecialties → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | MedicalVisitorsController.setSpecialties → MedicalVisitorsService.setSpecialties → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | MedicalVisitorsController.setSpecialties → MedicalVisitorsService.setSpecialties → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.medical_visitor_specialties` | BORRA | BORRA | DIRECTA | MedicalVisitorsController.setSpecialties → MedicalVisitorsService.setSpecialties → VisitorsRepository.replaceSpecialties | `src/modules/pharma_lab/repositories/visitors.repository.ts:113` |
| `pharma_lab.medical_visitor_specialties` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.setSpecialties → MedicalVisitorsService.setSpecialties → VisitorsRepository.replaceSpecialties | `src/modules/pharma_lab/repositories/visitors.repository.ts:115` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | MedicalVisitorsController.setSpecialties → MedicalVisitorsService.setSpecialties → PharmaLabAccessService.requireVisitorOfLab → VisitorsRepository.findVisitor | `src/modules/pharma_lab/repositories/visitors.repository.ts:30` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | MedicalVisitorsController.setSpecialties → MedicalVisitorsService.setSpecialties → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `medicalVisitorId` | path | Sí | `string` | — |

### Cuerpo — DTO `SetVisitorSpecialtiesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `specialtyConceptIds` | `array<string>` | Sí | formato uuid; máximo 50 elemento(s) | `@IsArray()` `@IsUUID('4', { each: true })` `@ArrayMaxSize(50)` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:190` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "specialtyConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "specialtyConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Visitador no encontrado en el laboratorio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:MedicalVisitorsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/unlink

- **Origen:** CONTRATO
- **Nombre:** Desvincular al visitador y revocar sus accesos
- **Bloque:** —
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalVisitorsController.unlink` — `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:143`

### Qué es y para qué sirve (negocio)

Desvincular al visitador y revocar sus accesos.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/unlink` la atiende `MedicalVisitorsController.unlink` (src/modules/pharma_lab/controllers/medical-visitors.controller.ts:143). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `UnlinkDto` (2 campos, 1 obligatorio). Delega en `MedicalVisitorsService.unlinkVisitor`. Crea filas en audit.audit_log, pharma_lab.medical_visitor_products, pharma_lab.pharma_lab_link_events, pharma_lab.pharma_lab_notices, pharma_lab.visit_request_events. Actualiza authz.user_role_assignments, iam.refresh_tokens, iam.sessions, iam.users, pharma_lab.medical_visitors, pharma_lab.pharma_lab_staff, pharma_lab.visit_requests. Borra de pharma_lab.medical_visitor_products. Lee audit.audit_log, authz.roles, authz.user_role_assignments, iam.sessions, iam.users, pharma_lab.medical_visitors, pharma_lab.pharma_lab_staff, pharma_lab.pharma_labs y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:143` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, medicalVisitorId | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:143` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.roles` | LEE | LEE | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → MedicalVisitorsService.revokeVisitorRole → RolesRepository.findByCode | `src/modules/authz/repositories/roles.repository.ts:72` |
| `authz.user_role_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → MedicalVisitorsService.revokeVisitorRole → UserRoleAssignmentsRepository.revoke | `src/modules/authz/repositories/user-role-assignments.repository.ts:166` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → MedicalVisitorsService.revokeVisitorRole → UserRoleAssignmentsRepository.findActive | `src/modules/authz/repositories/user-role-assignments.repository.ts:73` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → VisitorsRepository.revokeRefreshTokens | `src/modules/pharma_lab/repositories/visitors.repository.ts:229` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → VisitorsRepository.revokeSessions | `src/modules/pharma_lab/repositories/visitors.repository.ts:199` |
| `iam.sessions` | LEE | LEE | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → VisitorsRepository.revokeRefreshTokens | `src/modules/pharma_lab/repositories/visitors.repository.ts:223` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor | `src/modules/pharma_lab/services/medical-visitors.service.ts:473` |
| `iam.users` | LEE | LEE | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor | `src/modules/pharma_lab/services/medical-visitors.service.ts:471` |
| `pharma_lab.medical_visitor_products` | BORRA | BORRA | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → VisitorsRepository.replaceProducts | `src/modules/pharma_lab/repositories/visitors.repository.ts:158` |
| `pharma_lab.medical_visitor_products` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → VisitorsRepository.replaceProducts | `src/modules/pharma_lab/repositories/visitors.repository.ts:160` |
| `pharma_lab.medical_visitors` | ESCRIBE | ACTUALIZA | POR_TIPO | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor | `src/modules/pharma_lab/services/medical-visitors.service.ts:439` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → PharmaLabAccessService.requireVisitorOfLab → VisitorsRepository.findVisitor | `src/modules/pharma_lab/repositories/visitors.repository.ts:30` |
| `pharma_lab.pharma_lab_link_events` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → OrganizationRepository.appendLinkEvent | `src/modules/pharma_lab/repositories/organization.repository.ts:170` |
| `pharma_lab.pharma_lab_notices` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → PharmaLabNotificationsService.notify | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:58` |
| `pharma_lab.pharma_lab_staff` | ESCRIBE | ACTUALIZA | POR_TIPO | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor | `src/modules/pharma_lab/services/medical-visitors.service.ts:463` |
| `pharma_lab.pharma_lab_staff` | LEE | LEE | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → OrganizationRepository.findStaffByUser | `src/modules/pharma_lab/repositories/organization.repository.ts:101` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.visit_request_events` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → VisitsRepository.appendRequestEvent | `src/modules/pharma_lab/repositories/visits.repository.ts:187` |
| `pharma_lab.visit_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor | `src/modules/pharma_lab/services/medical-visitors.service.ts:496` |
| `pharma_lab.visit_requests` | LEE | LEE | DIRECTA | MedicalVisitorsController.unlink → MedicalVisitorsService.unlinkVisitor → VisitsRepository.listOpenRequestsOfVisitor | `src/modules/pharma_lab/repositories/visits.repository.ts:133` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `medicalVisitorId` | path | Sí | `string` | — |

### Cuerpo — DTO `UnlinkDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:244` |
| `effectiveOn` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/pharma_lab/dto/organization.dto.ts:252` |

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
  "effectiveOn": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<UnlinkResultDto>` · DTO `UnlinkResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `revokedSessions` | `number` | Sí | — | — | Sesiones activas cerradas | `src/modules/pharma_lab/dto/common.dto.ts:33` |
| `revokedRefreshTokens` | `number` | Sí | — | — | Tokens de refresco revocados | `src/modules/pharma_lab/dto/common.dto.ts:39` |
| `cancelledVisitRequests` | `number` | No | — | — | Solicitudes pendientes canceladas | `src/modules/pharma_lab/dto/common.dto.ts:45` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Visitador no encontrado en el laboratorio |
| 409 | `CONFLICT` | ConflictException: El visitador ya está desvinculado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:MedicalVisitorsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/verifications

- **Origen:** CONTRATO
- **Nombre:** Registrar las verificaciones del visitador
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalVisitorsController.verify` — `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:82`

### Qué es y para qué sirve (negocio)

Registrar las verificaciones del visitador.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/medical-visitors/{medicalVisitorId}/verifications` la atiende `MedicalVisitorsController.verify` (src/modules/pharma_lab/controllers/medical-visitors.controller.ts:82). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `VerifyMedicalVisitorDto` (3 campos, 0 obligatorios). Delega en `MedicalVisitorsService.verifyVisitor`. Crea filas en audit.audit_log. Actualiza pharma_lab.medical_visitors. Lee audit.audit_log, iam.sessions, pharma_lab.medical_visitors, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:82` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, medicalVisitorId | `src/modules/pharma_lab/controllers/medical-visitors.controller.ts:82` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | MedicalVisitorsController.verify → MedicalVisitorsService.verifyVisitor → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | MedicalVisitorsController.verify → MedicalVisitorsService.verifyVisitor → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | MedicalVisitorsController.verify → MedicalVisitorsService.verifyVisitor → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.medical_visitors` | ESCRIBE | ACTUALIZA | POR_TIPO | MedicalVisitorsController.verify → MedicalVisitorsService.verifyVisitor | `src/modules/pharma_lab/services/medical-visitors.service.ts:291` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | MedicalVisitorsController.verify → MedicalVisitorsService.verifyVisitor → PharmaLabAccessService.requireVisitorOfLab → VisitorsRepository.findVisitor | `src/modules/pharma_lab/repositories/visitors.repository.ts:30` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | MedicalVisitorsController.verify → MedicalVisitorsService.verifyVisitor → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `medicalVisitorId` | path | Sí | `string` | — |

### Cuerpo — DTO `VerifyMedicalVisitorDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `identityVerificationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:150` |
| `contractVerificationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:158` |
| `credentialVerificationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/visitors.dto.ts:166` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "identityVerificationConceptId": "00000000-0000-4000-8000-000000000001",
  "contractVerificationConceptId": "00000000-0000-4000-8000-000000000001",
  "credentialVerificationConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Visitador no encontrado en el laboratorio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:MedicalVisitorsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. GET /pharma-labs/{pharmaLabId}/pharmacovigilance/reports

- **Origen:** CONTRATO
- **Nombre:** Listar los reportes del laboratorio
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacovigilanceController.listReports` — `src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:80`

### Qué es y para qué sirve (negocio)

Listar los reportes del laboratorio.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}/pharmacovigilance/reports` la atiende `PharmacovigilanceController.listReports` (src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:80). Exige sesión con alguno de los roles PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN. Delega en `PharmacovigilanceService.listReports`. Lee pharma_lab.pharma_labs, pharma_lab.pharmacovigilance_reports.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:80` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:80` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmacovigilanceController.listReports → PharmacovigilanceService.listReports → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.pharmacovigilance_reports` | LEE | LEE | DIRECTA | PharmacovigilanceController.listReports → PharmacovigilanceService.listReports → PharmacovigilanceRepository.listReports | `src/modules/pharma_lab/repositories/pharmacovigilance.repository.ts:64` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmacovigilanceReports[]>` · DTO `PharmacovigilanceReports`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:22` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio responsable del producto. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:28` |
| `pharmaProductId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_product_id', type: 'uuid' })` | Producto involucrado. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:34` |
| `caseCode` | `string` | Sí | — | `@Property({ fieldName: 'case_code', columnType: 'varchar' })` | Código de caso, legible y único por laboratorio. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:40` |
| `batchNumber` | `string` | No | — | `@Property({ fieldName: 'batch_number', columnType: 'varchar', nullable: true, })` | Lote. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:50` |
| `eventDate` | `string` | Sí | — | `@Property({ fieldName: 'event_date', columnType: 'date' })` | Fecha del evento. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:56` |
| `eventTypeConceptId` | `string` | Sí | — | `@Property({ fieldName: 'event_type_concept_id', type: 'uuid' })` | Tipo de evento. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:62` |
| `description` | `string` | Sí | — | `@Property({ columnType: 'text' })` | Descripción clínica del evento, sin datos identificables. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:68` |
| `severityConceptId` | `string` | Sí | — | `@Property({ fieldName: 'severity_concept_id', type: 'uuid' })` | Nivel de gravedad. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:74` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado del reporte. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:80` |
| `reporterTypeConceptId` | `string` | Sí | — | `@Property({ fieldName: 'reporter_type_concept_id', type: 'uuid' })` | Tipo de reportante: doctor, farmacia u organización. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:86` |
| `reporterUserId` | `string` | Sí | — | `@Property({ fieldName: 'reporter_user_id', type: 'uuid' })` | Cuenta que envió el reporte. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:92` |
| `reporterTenantId` | `string` | No | — | `@Property({ fieldName: 'reporter_tenant_id', type: 'uuid', nullable: true })` | Organización del reportante, cuando la hay. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:98` |
| `subjectPseudonym` | `string` | No | — | `@Property({ fieldName: 'subject_pseudonym', columnType: 'varchar', nullable: true, })` | Seudónimo del caso. Nunca un identificador de paciente del sistema. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:108` |
| `subjectAgeYears` | `number` | No | — | `@Property({ fieldName: 'subject_age_years', columnType: 'int', nullable: true, })` | Edad del sujeto en años, como dato epidemiológico agregado. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:118` |
| `subjectSexConceptId` | `string` | No | — | `@Property({ fieldName: 'subject_sex_concept_id', type: 'uuid', nullable: true, })` | Sexo del sujeto, como dato epidemiológico agregado. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:128` |
| `receivedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'received_at', columnType: 'timestamptz' })` | Momento de recepción. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:134` |
| `closedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'closed_at', columnType: 'timestamptz', nullable: true, })` | Momento del cierre. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:144` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:150` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:156` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:162` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:168` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:174` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmacovigilanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /pharma-labs/{pharmaLabId}/pharmacovigilance/reports

- **Origen:** CONTRATO
- **Nombre:** Enviar un reporte de farmacovigilancia
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacovigilanceController.createReport` — `src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:53`

### Qué es y para qué sirve (negocio)

Enviar un reporte de farmacovigilancia.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/pharmacovigilance/reports` la atiende `PharmacovigilanceController.createReport` (src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:53). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN, PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, BUSINESS_ADMIN. Valida el cuerpo como `CreatePharmacovigilanceReportDto` (11 campos, 6 obligatorios). Delega en `PharmacovigilanceService.createReport`. Crea filas en audit.audit_log, pharma_lab.pharma_lab_notices, pharma_lab.pharmacovigilance_actions, pharma_lab.pharmacovigilance_reports. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_lab_staff, pharma_lab.pharma_labs, pharma_lab.pharma_products, pharma_lab.pharmacovigilance_reports.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN, PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, BUSINESS_ADMIN | `src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:53` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmacovigilanceController.createReport → PharmacovigilanceService.createReport → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmacovigilanceController.createReport → PharmacovigilanceService.createReport → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmacovigilanceController.createReport → PharmacovigilanceService.createReport → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_lab_notices` | ESCRIBE | CREA | DIRECTA | PharmacovigilanceController.createReport → PharmacovigilanceService.createReport → PharmaLabNotificationsService.notifyAll → PharmaLabNotificationsService.notify | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:58` |
| `pharma_lab.pharma_lab_staff` | LEE | LEE | DIRECTA | PharmacovigilanceController.createReport → PharmacovigilanceService.createReport → PharmaLabOrganizationService.listActiveStaffUserIds → OrganizationRepository.listStaff | `src/modules/pharma_lab/repositories/organization.repository.ts:133` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmacovigilanceController.createReport → PharmacovigilanceService.createReport → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.pharma_products` | LEE | LEE | DIRECTA | PharmacovigilanceController.createReport → PharmacovigilanceService.createReport → CatalogRepository.findProduct | `src/modules/pharma_lab/repositories/catalog.repository.ts:22` |
| `pharma_lab.pharmacovigilance_actions` | ESCRIBE | CREA | DIRECTA | PharmacovigilanceController.createReport → PharmacovigilanceService.createReport → PharmacovigilanceRepository.appendAction | `src/modules/pharma_lab/repositories/pharmacovigilance.repository.ts:101` |
| `pharma_lab.pharmacovigilance_reports` | ESCRIBE | CREA | DIRECTA | PharmacovigilanceController.createReport → PharmacovigilanceService.createReport → PharmacovigilanceRepository.createReport | `src/modules/pharma_lab/repositories/pharmacovigilance.repository.ts:82` |
| `pharma_lab.pharmacovigilance_reports` | LEE | LEE | DIRECTA | PharmacovigilanceController.createReport → PharmacovigilanceService.createReport → PharmacovigilanceService.nextCaseCode → PharmacovigilanceRepository.countReports | `src/modules/pharma_lab/repositories/pharmacovigilance.repository.ts:50` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePharmacovigilanceReportDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmaProductId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:26` |
| `batchNumber` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:35` |
| `eventDate` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:42` |
| `eventTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:49` |
| `description` | `string` | Sí | longitud máxima 4000 | `@IsString()` `@MaxLength(4000)` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:57` |
| `severityConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:64` |
| `reporterTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:71` |
| `reporterTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:79` |
| `subjectPseudonym` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | Seudónimo, nunca un id de paciente | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:88` |
| `subjectAgeYears` | `number` | No | mínimo 0; máximo 130 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(130)` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:98` |
| `subjectSexConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:106` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "pharmaProductId": "00000000-0000-4000-8000-000000000001",
  "eventDate": "2026-07-31",
  "eventTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "reporterTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Producto no encontrado en el catálogo del laboratorio |
| 409 | `CONFLICT` | ConflictException: No se pudo asignar un código de caso libre |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmacovigilanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. GET /pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}

- **Origen:** CONTRATO
- **Nombre:** Consultar un reporte con su trazabilidad
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacovigilanceController.getReport` — `src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:90`

### Qué es y para qué sirve (negocio)

Consultar un reporte con su trazabilidad.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}` la atiende `PharmacovigilanceController.getReport` (src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:90). Exige sesión con alguno de los roles PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN. Delega en `PharmacovigilanceService.getReportDetail`. Lee pharma_lab.pharma_labs, pharma_lab.pharmacovigilance_actions, pharma_lab.pharmacovigilance_reports.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, reportId | `src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:90` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmacovigilanceController.getReport → PharmacovigilanceService.getReportDetail → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.pharmacovigilance_actions` | LEE | LEE | DIRECTA | PharmacovigilanceController.getReport → PharmacovigilanceService.getReportDetail → PharmacovigilanceRepository.listActions | `src/modules/pharma_lab/repositories/pharmacovigilance.repository.ts:124` |
| `pharma_lab.pharmacovigilance_reports` | LEE | LEE | DIRECTA | PharmacovigilanceController.getReport → PharmacovigilanceService.getReportDetail → PharmacovigilanceService.requireReport → PharmacovigilanceRepository.findReport | `src/modules/pharma_lab/repositories/pharmacovigilance.repository.ts:23` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `reportId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<{ /** El reporte. */ report: PharmacovigilanceReports; /** Acciones en orden cronológico. */ actions: PharmacovigilanceActions[]; }>` · DTO `PharmacovigilanceReports`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:22` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio responsable del producto. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:28` |
| `pharmaProductId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_product_id', type: 'uuid' })` | Producto involucrado. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:34` |
| `caseCode` | `string` | Sí | — | `@Property({ fieldName: 'case_code', columnType: 'varchar' })` | Código de caso, legible y único por laboratorio. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:40` |
| `batchNumber` | `string` | No | — | `@Property({ fieldName: 'batch_number', columnType: 'varchar', nullable: true, })` | Lote. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:50` |
| `eventDate` | `string` | Sí | — | `@Property({ fieldName: 'event_date', columnType: 'date' })` | Fecha del evento. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:56` |
| `eventTypeConceptId` | `string` | Sí | — | `@Property({ fieldName: 'event_type_concept_id', type: 'uuid' })` | Tipo de evento. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:62` |
| `description` | `string` | Sí | — | `@Property({ columnType: 'text' })` | Descripción clínica del evento, sin datos identificables. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:68` |
| `severityConceptId` | `string` | Sí | — | `@Property({ fieldName: 'severity_concept_id', type: 'uuid' })` | Nivel de gravedad. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:74` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado del reporte. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:80` |
| `reporterTypeConceptId` | `string` | Sí | — | `@Property({ fieldName: 'reporter_type_concept_id', type: 'uuid' })` | Tipo de reportante: doctor, farmacia u organización. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:86` |
| `reporterUserId` | `string` | Sí | — | `@Property({ fieldName: 'reporter_user_id', type: 'uuid' })` | Cuenta que envió el reporte. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:92` |
| `reporterTenantId` | `string` | No | — | `@Property({ fieldName: 'reporter_tenant_id', type: 'uuid', nullable: true })` | Organización del reportante, cuando la hay. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:98` |
| `subjectPseudonym` | `string` | No | — | `@Property({ fieldName: 'subject_pseudonym', columnType: 'varchar', nullable: true, })` | Seudónimo del caso. Nunca un identificador de paciente del sistema. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:108` |
| `subjectAgeYears` | `number` | No | — | `@Property({ fieldName: 'subject_age_years', columnType: 'int', nullable: true, })` | Edad del sujeto en años, como dato epidemiológico agregado. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:118` |
| `subjectSexConceptId` | `string` | No | — | `@Property({ fieldName: 'subject_sex_concept_id', type: 'uuid', nullable: true, })` | Sexo del sujeto, como dato epidemiológico agregado. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:128` |
| `receivedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'received_at', columnType: 'timestamptz' })` | Momento de recepción. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:134` |
| `closedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'closed_at', columnType: 'timestamptz', nullable: true, })` | Momento del cierre. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:144` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:150` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:156` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:162` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:168` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/pharmacovigilance_reports.entity.ts:174` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Reporte de farmacovigilancia no encontrado en el laboratorio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmacovigilanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}/actions

- **Origen:** CONTRATO
- **Nombre:** Registrar una acción de seguimiento
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmacovigilanceController.addAction` — `src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:106`

### Qué es y para qué sirve (negocio)

Registrar una acción de seguimiento.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/pharmacovigilance/reports/{reportId}/actions` la atiende `PharmacovigilanceController.addAction` (src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:106). Exige sesión con alguno de los roles PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `AddPharmacovigilanceActionDto` (5 campos, 3 obligatorios). Delega en `PharmacovigilanceService.addAction`. Crea filas en audit.audit_log, pharma_lab.pharmacovigilance_actions. Actualiza pharma_lab.pharmacovigilance_reports. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_labs, pharma_lab.pharmacovigilance_reports.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, reportId | `src/modules/pharma_lab/controllers/pharmacovigilance.controller.ts:106` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmacovigilanceController.addAction → PharmacovigilanceService.addAction → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmacovigilanceController.addAction → PharmacovigilanceService.addAction → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmacovigilanceController.addAction → PharmacovigilanceService.addAction → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmacovigilanceController.addAction → PharmacovigilanceService.addAction → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.pharmacovigilance_actions` | ESCRIBE | CREA | DIRECTA | PharmacovigilanceController.addAction → PharmacovigilanceService.addAction → PharmacovigilanceRepository.appendAction | `src/modules/pharma_lab/repositories/pharmacovigilance.repository.ts:101` |
| `pharma_lab.pharmacovigilance_reports` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmacovigilanceController.addAction → PharmacovigilanceService.addAction | `src/modules/pharma_lab/services/pharmacovigilance.service.ts:221` |
| `pharma_lab.pharmacovigilance_reports` | LEE | LEE | DIRECTA | PharmacovigilanceController.addAction → PharmacovigilanceService.addAction → PharmacovigilanceService.requireReport → PharmacovigilanceRepository.findReport | `src/modules/pharma_lab/repositories/pharmacovigilance.repository.ts:23` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `reportId` | path | Sí | `string` | — |

### Cuerpo — DTO `AddPharmacovigilanceActionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `actionConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:116` |
| `newStatusConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:123` |
| `detail` | `string` | Sí | longitud máxima 4000 | `@IsString()` `@MaxLength(4000)` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:131` |
| `authorityName` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:140` |
| `authorityReference` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/pharmacovigilance.dto.ts:149` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "actionConceptId": "00000000-0000-4000-8000-000000000001",
  "newStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "detail": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "actionConceptId": "00000000-0000-4000-8000-000000000001",
  "newStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "detail": "valor-ejemplo",
  "authorityName": "Nombre de ejemplo",
  "authorityReference": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Reporte de farmacovigilancia no encontrado en el laboratorio |
| 409 | `CONFLICT` | ConflictException: La transición de estado del reporte no está permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmacovigilanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. GET /pharma-labs/{pharmaLabId}/products

- **Origen:** CONTRATO
- **Nombre:** Listar el catálogo de medicamentos
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaCatalogController.listProducts` — `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:74`

### Qué es y para qué sirve (negocio)

Listar el catálogo de medicamentos.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}/products` la atiende `PharmaCatalogController.listProducts` (src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:74). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, MEDICAL_VISITOR, PLATFORM_ADMIN. Delega en `PharmaCatalogService.listProducts`. Lee pharma_lab.pharma_labs, pharma_lab.pharma_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, MEDICAL_VISITOR, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:74` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:74` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaCatalogController.listProducts → PharmaCatalogService.listProducts → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.pharma_products` | LEE | LEE | DIRECTA | PharmaCatalogController.listProducts → PharmaCatalogService.listProducts → CatalogRepository.listProducts | `src/modules/pharma_lab/repositories/catalog.repository.ts:51` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmaProducts[]>` · DTO `PharmaProducts`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:18` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio propietario del registro. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:24` |
| `tradeName` | `string` | Sí | — | `@Property({ fieldName: 'trade_name', columnType: 'varchar' })` | Nombre comercial. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:30` |
| `activeIngredient` | `string` | Sí | — | `@Property({ fieldName: 'active_ingredient', columnType: 'varchar' })` | Principio activo. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:36` |
| `presentation` | `string` | No | — | `@Property({ columnType: 'varchar', nullable: true })` | Presentación (caja de 20 comprimidos, frasco de 100 ml…). | `src/modules/pharma_lab/entities/pharma_products.entity.ts:42` |
| `concentration` | `string` | No | — | `@Property({ columnType: 'varchar', nullable: true })` | Concentración. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:48` |
| `pharmaceuticalForm` | `string` | No | — | `@Property({ fieldName: 'pharmaceutical_form', columnType: 'varchar', nullable: true, })` | Forma farmacéutica. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:58` |
| `administrationRoute` | `string` | No | — | `@Property({ fieldName: 'administration_route', columnType: 'varchar', nullable: true, })` | Vía de administración. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:68` |
| `authorizedIndication` | `string` | No | — | `@Property({ fieldName: 'authorized_indication', columnType: 'text', nullable: true, })` | Indicación autorizada. Es lo único que puede difundirse como indicación. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:78` |
| `manufacturerName` | `string` | No | — | `@Property({ fieldName: 'manufacturer_name', columnType: 'varchar', nullable: true, })` | Laboratorio fabricante, cuando difiere del titular del registro. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:88` |
| `regulatoryStatusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'regulatory_status_concept_id', type: 'uuid' })` | Estado regulatorio: investigación, desarrollo, evaluación, aprobado, comercializado, suspendido o retirado. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:95` |
| `sanitaryRegistryNumber` | `string` | No | — | `@Property({ fieldName: 'sanitary_registry_number', columnType: 'varchar', nullable: true, })` | Número de registro sanitario. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:105` |
| `approvedOn` | `string` | No | — | `@Property({ fieldName: 'approved_on', columnType: 'date', nullable: true })` | Fecha de aprobación. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:111` |
| `registryExpiresOn` | `string` | No | — | `@Property({ fieldName: 'registry_expires_on', columnType: 'date', nullable: true, })` | Fecha de vencimiento del registro. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:121` |
| `authorizedCountries` | `array<string>` | No | — | `@Property({ fieldName: 'authorized_countries', type: 'json', columnType: 'jsonb', nullable: true, })` | Países autorizados (códigos ISO 3166-1 alfa-2). | `src/modules/pharma_lab/entities/pharma_products.entity.ts:132` |
| `technicalDocumentation` | `object` | No | — | `@Property({ fieldName: 'technical_documentation', type: 'json', columnType: 'jsonb', nullable: true, })` | Documentación técnica asociada (referencias del almacén documental). | `src/modules/pharma_lab/entities/pharma_products.entity.ts:143` |
| `disclosureLevelConceptId` | `string` | Sí | — | `@Property({ fieldName: 'disclosure_level_concept_id', type: 'uuid' })` | Nivel de divulgación: pública, profesional, interna o confidencial. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:149` |
| `versionNo` | `number` | Sí | — | `@Property({ fieldName: 'version_no', columnType: 'int' })` | Número de versión del registro; se incrementa en cada cambio publicado. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:155` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:161` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:167` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:173` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:179` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/pharma_products.entity.ts:185` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. POST /pharma-labs/{pharmaLabId}/products

- **Origen:** CONTRATO
- **Nombre:** Registrar un medicamento en el catálogo
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaCatalogController.createProduct` — `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:56`

### Qué es y para qué sirve (negocio)

Registrar un medicamento en el catálogo.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/products` la atiende `PharmaCatalogController.createProduct` (src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:56). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. Valida el cuerpo como `CreatePharmaProductDto` (14 campos, 4 obligatorios). Delega en `PharmaCatalogService.createProduct`. Crea filas en audit.audit_log, pharma_lab.pharma_products. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:56` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:56` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmaCatalogController.createProduct → PharmaCatalogService.createProduct → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmaCatalogController.createProduct → PharmaCatalogService.createProduct → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmaCatalogController.createProduct → PharmaCatalogService.createProduct → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaCatalogController.createProduct → PharmaCatalogService.createProduct → PharmaLabAccessService.requireActiveLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.pharma_products` | ESCRIBE | CREA | DIRECTA | PharmaCatalogController.createProduct → PharmaCatalogService.createProduct → CatalogRepository.createProduct | `src/modules/pharma_lab/repositories/catalog.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePharmaProductDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tradeName` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:21` |
| `activeIngredient` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:29` |
| `presentation` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:38` |
| `concentration` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:47` |
| `pharmaceuticalForm` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:56` |
| `administrationRoute` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:65` |
| `authorizedIndication` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:74` |
| `manufacturerName` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:83` |
| `regulatoryStatusConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:90` |
| `sanitaryRegistryNumber` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:99` |
| `approvedOn` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:107` |
| `registryExpiresOn` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:115` |
| `authorizedCountries` | `array<string>` | No | longitud mínima 2; longitud máxima 2; máximo 200 elemento(s) | `@IsOptional()` `@IsArray()` `@Length(2, 2, { each: true })` `@ArrayMaxSize(200)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:125` |
| `disclosureLevelConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:132` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tradeName": "Nombre de ejemplo",
  "activeIngredient": "valor-ejemplo",
  "regulatoryStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "disclosureLevelConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El laboratorio no está activo; PreconditionFailedException: No se puede declarar una indicación autorizada en un producto que no está aprobado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. PATCH /pharma-labs/{pharmaLabId}/products/{productId}

- **Origen:** CONTRATO
- **Nombre:** Actualizar un medicamento
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaCatalogController.updateProduct` — `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:89`

### Qué es y para qué sirve (negocio)

Actualizar un medicamento.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PATCH /pharma-labs/{pharmaLabId}/products/{productId}` la atiende `PharmaCatalogController.updateProduct` (src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:89). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. Valida el cuerpo como `UpdatePharmaProductDto` (7 campos, 0 obligatorios). Delega en `PharmaCatalogService.updateProduct`. Crea filas en audit.audit_log. Actualiza pharma_lab.pharma_products. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_labs, pharma_lab.pharma_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:89` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, productId | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:89` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmaCatalogController.updateProduct → PharmaCatalogService.updateProduct → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmaCatalogController.updateProduct → PharmaCatalogService.updateProduct → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmaCatalogController.updateProduct → PharmaCatalogService.updateProduct → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaCatalogController.updateProduct → PharmaCatalogService.updateProduct → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.pharma_products` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmaCatalogController.updateProduct → PharmaCatalogService.updateProduct | `src/modules/pharma_lab/services/pharma-catalog.service.ts:165` |
| `pharma_lab.pharma_products` | LEE | LEE | DIRECTA | PharmaCatalogController.updateProduct → PharmaCatalogService.updateProduct → PharmaCatalogService.requireProduct → CatalogRepository.findProduct | `src/modules/pharma_lab/repositories/catalog.repository.ts:22` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `productId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdatePharmaProductDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `presentation` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:144` |
| `concentration` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:153` |
| `authorizedIndication` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:162` |
| `sanitaryRegistryNumber` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:171` |
| `registryExpiresOn` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:179` |
| `authorizedCountries` | `array<string>` | No | longitud mínima 2; longitud máxima 2; máximo 200 elemento(s) | `@IsOptional()` `@IsArray()` `@Length(2, 2, { each: true })` `@ArrayMaxSize(200)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:189` |
| `disclosureLevelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:197` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Producto no encontrado en el catálogo del laboratorio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se puede declarar una indicación autorizada en un producto que no está aprobado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /pharma-labs/{pharmaLabId}/products/{productId}/status

- **Origen:** CONTRATO
- **Nombre:** Cambiar el estado regulatorio de un medicamento
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaCatalogController.changeProductStatus` — `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:107`

### Qué es y para qué sirve (negocio)

Cambiar el estado regulatorio de un medicamento.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/products/{productId}/status` la atiende `PharmaCatalogController.changeProductStatus` (src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:107). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN. Valida el cuerpo como `ChangeProductStatusDto` (2 campos, 2 obligatorios). Delega en `PharmaCatalogService.changeProductStatus`. Crea filas en audit.audit_log. Actualiza pharma_lab.pharma_products. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_labs, pharma_lab.pharma_products.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:107` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, productId | `src/modules/pharma_lab/controllers/pharma-catalog.controller.ts:107` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmaCatalogController.changeProductStatus → PharmaCatalogService.changeProductStatus → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmaCatalogController.changeProductStatus → PharmaCatalogService.changeProductStatus → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmaCatalogController.changeProductStatus → PharmaCatalogService.changeProductStatus → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaCatalogController.changeProductStatus → PharmaCatalogService.changeProductStatus → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.pharma_products` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmaCatalogController.changeProductStatus → PharmaCatalogService.changeProductStatus | `src/modules/pharma_lab/services/pharma-catalog.service.ts:230` |
| `pharma_lab.pharma_products` | LEE | LEE | DIRECTA | PharmaCatalogController.changeProductStatus → PharmaCatalogService.changeProductStatus → PharmaCatalogService.requireProduct → CatalogRepository.findProduct | `src/modules/pharma_lab/repositories/catalog.repository.ts:22` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `productId` | path | Sí | `string` | — |

### Cuerpo — DTO `ChangeProductStatusDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `regulatoryStatusConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:207` |
| `reason` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | — | `src/modules/pharma_lab/dto/catalog.dto.ts:215` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "regulatoryStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "regulatoryStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Producto no encontrado en el catálogo del laboratorio |
| 409 | `CONFLICT` | ConflictException: La transición de estado regulatorio no está permitida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. GET /pharma-labs/{pharmaLabId}/regulatory-documents

- **Origen:** CONTRATO
- **Nombre:** Listar los documentos del laboratorio
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RegulatoryDocumentsController.list` — `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:77`

### Qué es y para qué sirve (negocio)

Listar los documentos del laboratorio.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}/regulatory-documents` la atiende `RegulatoryDocumentsController.list` (src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:77). Exige sesión con alguno de los roles REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. Delega en `RegulatoryDocumentsService.listDocuments`. Lee pharma_lab.pharma_labs, pharma_lab.regulatory_documents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:77` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.list → RegulatoryDocumentsService.listDocuments → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.regulatory_documents` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.list → RegulatoryDocumentsService.listDocuments → RegulatoryRepository.listDocuments | `src/modules/pharma_lab/repositories/regulatory.repository.ts:39` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RegulatoryDocuments[]>` · DTO `RegulatoryDocuments`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:17` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio propietario. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:23` |
| `pharmaProductId` | `string` | No | — | `@Property({ fieldName: 'pharma_product_id', type: 'uuid', nullable: true })` | Producto al que respalda, si aplica. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:29` |
| `medicalVisitorId` | `string` | No | — | `@Property({ fieldName: 'medical_visitor_id', type: 'uuid', nullable: true })` | Visitador al que respalda, si aplica (contrato, credenciales). | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:35` |
| `name` | `string` | Sí | — | `@Property({ columnType: 'varchar' })` | Nombre del documento. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:41` |
| `documentTypeConceptId` | `string` | Sí | — | `@Property({ fieldName: 'document_type_concept_id', type: 'uuid' })` | Tipo documental. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:47` |
| `code` | `string` | No | — | `@Property({ columnType: 'varchar', nullable: true })` | Código del documento. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:53` |
| `currentVersion` | `string` | Sí | — | `@Property({ fieldName: 'current_version', columnType: 'varchar' })` | Versión vigente. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:59` |
| `issuerName` | `string` | No | — | `@Property({ fieldName: 'issuer_name', columnType: 'varchar', nullable: true })` | Entidad emisora. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:65` |
| `issuedOn` | `string` | No | — | `@Property({ fieldName: 'issued_on', columnType: 'date', nullable: true })` | Fecha de emisión. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:71` |
| `expiresOn` | `string` | No | — | `@Property({ fieldName: 'expires_on', columnType: 'date', nullable: true })` | Fecha de vencimiento. Alimenta la alerta por vencimiento (spec 5626). | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:77` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado: vigente, próximo a vencer, vencido, sustituido o invalidado. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:83` |
| `ownerStaffId` | `string` | No | — | `@Property({ fieldName: 'owner_staff_id', type: 'uuid', nullable: true })` | Responsable del documento. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:89` |
| `disclosureLevelConceptId` | `string` | Sí | — | `@Property({ fieldName: 'disclosure_level_concept_id', type: 'uuid' })` | Nivel de confidencialidad. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:95` |
| `expiryAlertDays` | `number` | Sí | — | `@Property({ fieldName: 'expiry_alert_days', columnType: 'int' })` | Días de antelación con que se avisa el vencimiento. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:101` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:107` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:113` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:119` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:125` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:131` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:RegulatoryDocumentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. POST /pharma-labs/{pharmaLabId}/regulatory-documents

- **Origen:** CONTRATO
- **Nombre:** Registrar un documento con su primera versión
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RegulatoryDocumentsController.create` — `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:60`

### Qué es y para qué sirve (negocio)

Registrar un documento con su primera versión.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/regulatory-documents` la atiende `RegulatoryDocumentsController.create` (src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:60). Exige sesión con alguno de los roles REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. Valida el cuerpo como `CreateRegulatoryDocumentDto` (15 campos, 6 obligatorios). Delega en `RegulatoryDocumentsService.createDocument`. Crea filas en audit.audit_log, pharma_lab.regulatory_document_versions, pharma_lab.regulatory_documents. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:60` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:60` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | RegulatoryDocumentsController.create → RegulatoryDocumentsService.createDocument → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.create → RegulatoryDocumentsService.createDocument → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | RegulatoryDocumentsController.create → RegulatoryDocumentsService.createDocument → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.create → RegulatoryDocumentsService.createDocument → PharmaLabAccessService.requireActiveLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.regulatory_document_versions` | ESCRIBE | CREA | DIRECTA | RegulatoryDocumentsController.create → RegulatoryDocumentsService.createDocument → RegulatoryRepository.createVersion | `src/modules/pharma_lab/repositories/regulatory.repository.ts:99` |
| `pharma_lab.regulatory_documents` | ESCRIBE | CREA | DIRECTA | RegulatoryDocumentsController.create → RegulatoryDocumentsService.createDocument → RegulatoryRepository.createDocument | `src/modules/pharma_lab/repositories/regulatory.repository.ts:81` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateRegulatoryDocumentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:21` |
| `documentTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:28` |
| `code` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:37` |
| `version` | `string` | Sí | longitud máxima 32 | `@IsString()` `@MaxLength(32)` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:45` |
| `issuerName` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:54` |
| `issuedOn` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:62` |
| `expiresOn` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:70` |
| `pharmaProductId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:78` |
| `medicalVisitorId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:86` |
| `ownerStaffId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:94` |
| `disclosureLevelConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:101` |
| `expiryAlertDays` | `number` | No | mínimo 1; máximo 365 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(365)` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:111` |
| `fileName` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:119` |
| `storageKey` | `string` | Sí | longitud máxima 512 | `@IsString()` `@MaxLength(512)` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:127` |
| `contentType` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:136` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo",
  "documentTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "version": "v1",
  "disclosureLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "fileName": "Nombre de ejemplo",
  "storageKey": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El laboratorio no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:RegulatoryDocumentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. GET /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}

- **Origen:** CONTRATO
- **Nombre:** Consultar un documento y sus versiones
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RegulatoryDocumentsController.getOne` — `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:86`

### Qué es y para qué sirve (negocio)

Consultar un documento y sus versiones.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}` la atiende `RegulatoryDocumentsController.getOne` (src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:86). Exige sesión con alguno de los roles REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. Delega en `RegulatoryDocumentsService.getDocument`. Crea filas en pharma_lab.regulatory_document_access_log. Lee pharma_lab.pharma_labs, pharma_lab.regulatory_document_versions, pharma_lab.regulatory_documents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, documentId | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:86` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.getOne → RegulatoryDocumentsService.getDocument → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.regulatory_document_access_log` | ESCRIBE | CREA | DIRECTA | RegulatoryDocumentsController.getOne → RegulatoryDocumentsService.getDocument → RegulatoryRepository.appendAccess | `src/modules/pharma_lab/repositories/regulatory.repository.ts:153` |
| `pharma_lab.regulatory_document_versions` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.getOne → RegulatoryDocumentsService.getDocument → RegulatoryRepository.listVersions | `src/modules/pharma_lab/repositories/regulatory.repository.ts:134` |
| `pharma_lab.regulatory_documents` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.getOne → RegulatoryDocumentsService.getDocument → RegulatoryDocumentsService.requireDocument → RegulatoryRepository.findDocument | `src/modules/pharma_lab/repositories/regulatory.repository.ts:25` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `documentId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<{ /** El documento. */ document: RegulatoryDocuments; /** Versiones, de la más reciente a la más antigua. */ versions: RegulatoryDocumentVersions[]; }>` · DTO `RegulatoryDocuments`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:17` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio propietario. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:23` |
| `pharmaProductId` | `string` | No | — | `@Property({ fieldName: 'pharma_product_id', type: 'uuid', nullable: true })` | Producto al que respalda, si aplica. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:29` |
| `medicalVisitorId` | `string` | No | — | `@Property({ fieldName: 'medical_visitor_id', type: 'uuid', nullable: true })` | Visitador al que respalda, si aplica (contrato, credenciales). | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:35` |
| `name` | `string` | Sí | — | `@Property({ columnType: 'varchar' })` | Nombre del documento. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:41` |
| `documentTypeConceptId` | `string` | Sí | — | `@Property({ fieldName: 'document_type_concept_id', type: 'uuid' })` | Tipo documental. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:47` |
| `code` | `string` | No | — | `@Property({ columnType: 'varchar', nullable: true })` | Código del documento. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:53` |
| `currentVersion` | `string` | Sí | — | `@Property({ fieldName: 'current_version', columnType: 'varchar' })` | Versión vigente. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:59` |
| `issuerName` | `string` | No | — | `@Property({ fieldName: 'issuer_name', columnType: 'varchar', nullable: true })` | Entidad emisora. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:65` |
| `issuedOn` | `string` | No | — | `@Property({ fieldName: 'issued_on', columnType: 'date', nullable: true })` | Fecha de emisión. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:71` |
| `expiresOn` | `string` | No | — | `@Property({ fieldName: 'expires_on', columnType: 'date', nullable: true })` | Fecha de vencimiento. Alimenta la alerta por vencimiento (spec 5626). | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:77` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado: vigente, próximo a vencer, vencido, sustituido o invalidado. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:83` |
| `ownerStaffId` | `string` | No | — | `@Property({ fieldName: 'owner_staff_id', type: 'uuid', nullable: true })` | Responsable del documento. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:89` |
| `disclosureLevelConceptId` | `string` | Sí | — | `@Property({ fieldName: 'disclosure_level_concept_id', type: 'uuid' })` | Nivel de confidencialidad. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:95` |
| `expiryAlertDays` | `number` | Sí | — | `@Property({ fieldName: 'expiry_alert_days', columnType: 'int' })` | Días de antelación con que se avisa el vencimiento. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:101` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:107` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:113` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:119` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:125` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/regulatory_documents.entity.ts:131` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Documento no encontrado en el laboratorio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:RegulatoryDocumentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. GET /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/access-log

- **Origen:** CONTRATO
- **Nombre:** Registro de consultas y descargas
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RegulatoryDocumentsController.accessLog` — `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:159`

### Qué es y para qué sirve (negocio)

Registro de consultas y descargas.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/access-log` la atiende `RegulatoryDocumentsController.accessLog` (src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:159). Exige sesión con alguno de los roles REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. Delega en `RegulatoryDocumentsService.listAccessLog`. Lee pharma_lab.pharma_labs, pharma_lab.regulatory_document_access_log, pharma_lab.regulatory_documents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:159` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, documentId | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.accessLog → RegulatoryDocumentsService.listAccessLog → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.regulatory_document_access_log` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.accessLog → RegulatoryDocumentsService.listAccessLog → RegulatoryRepository.listAccesses | `src/modules/pharma_lab/repositories/regulatory.repository.ts:171` |
| `pharma_lab.regulatory_documents` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.accessLog → RegulatoryDocumentsService.listAccessLog → RegulatoryDocumentsService.requireDocument → RegulatoryRepository.findDocument | `src/modules/pharma_lab/repositories/regulatory.repository.ts:25` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `documentId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RegulatoryDocumentAccessLog[]>` · DTO `RegulatoryDocumentAccessLog`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/regulatory_document_access_log.entity.ts:18` |
| `regulatoryDocumentId` | `string` | Sí | — | `@Property({ fieldName: 'regulatory_document_id', type: 'uuid' })` | Documento consultado. | `src/modules/pharma_lab/entities/regulatory_document_access_log.entity.ts:24` |
| `regulatoryDocumentVersionId` | `string` | No | — | `@Property({ fieldName: 'regulatory_document_version_id', type: 'uuid', nullable: true, })` | Versión concreta consultada o descargada. | `src/modules/pharma_lab/entities/regulatory_document_access_log.entity.ts:34` |
| `accessKind` | `string` | Sí | — | `@Property({ fieldName: 'access_kind', columnType: 'varchar' })` | Qué se hizo: `VIEW` o `DOWNLOAD`. | `src/modules/pharma_lab/entities/regulatory_document_access_log.entity.ts:40` |
| `actorUserId` | `string` | Sí | — | `@Property({ fieldName: 'actor_user_id', type: 'uuid' })` | Quién accedió. | `src/modules/pharma_lab/entities/regulatory_document_access_log.entity.ts:46` |
| `accessedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'accessed_at', columnType: 'timestamptz' })` | Momento del acceso. | `src/modules/pharma_lab/entities/regulatory_document_access_log.entity.ts:52` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/regulatory_document_access_log.entity.ts:58` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Documento no encontrado en el laboratorio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:RegulatoryDocumentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/invalidate

- **Origen:** CONTRATO
- **Nombre:** Invalidar el documento sin borrarlo
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RegulatoryDocumentsController.invalidate` — `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:142`

### Qué es y para qué sirve (negocio)

Invalidar el documento sin borrarlo.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/invalidate` la atiende `RegulatoryDocumentsController.invalidate` (src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:142). Exige sesión con alguno de los roles REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. Valida el cuerpo como `InvalidateDocumentDto` (1 campo, 1 obligatorio). Delega en `RegulatoryDocumentsService.invalidateDocument`. Crea filas en audit.audit_log. Actualiza pharma_lab.regulatory_document_versions, pharma_lab.regulatory_documents. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_labs, pharma_lab.regulatory_document_versions, pharma_lab.regulatory_documents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:142` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, documentId | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:142` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | RegulatoryDocumentsController.invalidate → RegulatoryDocumentsService.invalidateDocument → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.invalidate → RegulatoryDocumentsService.invalidateDocument → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | RegulatoryDocumentsController.invalidate → RegulatoryDocumentsService.invalidateDocument → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.invalidate → RegulatoryDocumentsService.invalidateDocument → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.regulatory_document_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | RegulatoryDocumentsController.invalidate → RegulatoryDocumentsService.invalidateDocument | `src/modules/pharma_lab/services/regulatory-documents.service.ts:214` |
| `pharma_lab.regulatory_document_versions` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.invalidate → RegulatoryDocumentsService.invalidateDocument → RegulatoryRepository.findCurrentVersion | `src/modules/pharma_lab/repositories/regulatory.repository.ts:117` |
| `pharma_lab.regulatory_documents` | ESCRIBE | ACTUALIZA | POR_TIPO | RegulatoryDocumentsController.invalidate → RegulatoryDocumentsService.invalidateDocument | `src/modules/pharma_lab/services/regulatory-documents.service.ts:209` |
| `pharma_lab.regulatory_documents` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.invalidate → RegulatoryDocumentsService.invalidateDocument → RegulatoryDocumentsService.requireDocument → RegulatoryRepository.findDocument | `src/modules/pharma_lab/repositories/regulatory.repository.ts:25` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `documentId` | path | Sí | `string` | — |

### Cuerpo — DTO `InvalidateDocumentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | longitud máxima 1000 | `@IsString()` `@MaxLength(1000)` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:207` |

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

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Documento no encontrado en el laboratorio |
| 409 | `CONFLICT` | ConflictException: El documento ya está invalidado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:RegulatoryDocumentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions

- **Origen:** CONTRATO
- **Nombre:** Sustituir el documento por una versión nueva
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RegulatoryDocumentsController.addVersion` — `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:102`

### Qué es y para qué sirve (negocio)

Sustituir el documento por una versión nueva.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions` la atiende `RegulatoryDocumentsController.addVersion` (src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:102). Exige sesión con alguno de los roles REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. Valida el cuerpo como `AddDocumentVersionDto` (7 campos, 4 obligatorios). Delega en `RegulatoryDocumentsService.addVersion`. Crea filas en audit.audit_log, pharma_lab.regulatory_document_versions. Actualiza pharma_lab.regulatory_document_versions, pharma_lab.regulatory_documents. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_labs, pharma_lab.regulatory_document_versions, pharma_lab.regulatory_documents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:102` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, documentId | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:102` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | RegulatoryDocumentsController.addVersion → RegulatoryDocumentsService.addVersion → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.addVersion → RegulatoryDocumentsService.addVersion → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | RegulatoryDocumentsController.addVersion → RegulatoryDocumentsService.addVersion → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.addVersion → RegulatoryDocumentsService.addVersion → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.regulatory_document_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | RegulatoryDocumentsController.addVersion → RegulatoryDocumentsService.addVersion | `src/modules/pharma_lab/services/regulatory-documents.service.ts:149` |
| `pharma_lab.regulatory_document_versions` | ESCRIBE | CREA | DIRECTA | RegulatoryDocumentsController.addVersion → RegulatoryDocumentsService.addVersion → RegulatoryRepository.createVersion | `src/modules/pharma_lab/repositories/regulatory.repository.ts:99` |
| `pharma_lab.regulatory_document_versions` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.addVersion → RegulatoryDocumentsService.addVersion → RegulatoryRepository.findCurrentVersion | `src/modules/pharma_lab/repositories/regulatory.repository.ts:117` |
| `pharma_lab.regulatory_documents` | ESCRIBE | ACTUALIZA | POR_TIPO | RegulatoryDocumentsController.addVersion → RegulatoryDocumentsService.addVersion | `src/modules/pharma_lab/services/regulatory-documents.service.ts:167` |
| `pharma_lab.regulatory_documents` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.addVersion → RegulatoryDocumentsService.addVersion → RegulatoryDocumentsService.requireDocument → RegulatoryRepository.findDocument | `src/modules/pharma_lab/repositories/regulatory.repository.ts:25` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `documentId` | path | Sí | `string` | — |

### Cuerpo — DTO `AddDocumentVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `version` | `string` | Sí | longitud máxima 32 | `@IsString()` `@MaxLength(32)` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:147` |
| `fileName` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:155` |
| `storageKey` | `string` | Sí | longitud máxima 512 | `@IsString()` `@MaxLength(512)` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:163` |
| `contentType` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:172` |
| `issuedOn` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:180` |
| `expiresOn` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:188` |
| `changeReason` | `string` | Sí | longitud máxima 1000 | `@IsString()` `@MaxLength(1000)` | — | `src/modules/pharma_lab/dto/regulatory.dto.ts:196` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "version": "v2",
  "fileName": "Nombre de ejemplo",
  "storageKey": "valor-ejemplo",
  "changeReason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Documento no encontrado en el laboratorio |
| 409 | `CONFLICT` | ConflictException: Un documento invalidado no admite versiones nuevas |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:RegulatoryDocumentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions/{versionId}/download

- **Origen:** CONTRATO
- **Nombre:** Registrar la descarga de una versión
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RegulatoryDocumentsController.download` — `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:120`

### Qué es y para qué sirve (negocio)

Registrar la descarga de una versión.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/regulatory-documents/{documentId}/versions/{versionId}/download` la atiende `RegulatoryDocumentsController.download` (src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:120). Exige sesión con alguno de los roles REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. Delega en `RegulatoryDocumentsService.registerDownload`. Crea filas en audit.audit_log, pharma_lab.regulatory_document_access_log. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_labs, pharma_lab.regulatory_document_versions, pharma_lab.regulatory_documents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:120` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, documentId, versionId | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:120` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | RegulatoryDocumentsController.download → RegulatoryDocumentsService.registerDownload → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.download → RegulatoryDocumentsService.registerDownload → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | RegulatoryDocumentsController.download → RegulatoryDocumentsService.registerDownload → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.download → RegulatoryDocumentsService.registerDownload → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.regulatory_document_access_log` | ESCRIBE | CREA | DIRECTA | RegulatoryDocumentsController.download → RegulatoryDocumentsService.registerDownload → RegulatoryRepository.appendAccess | `src/modules/pharma_lab/repositories/regulatory.repository.ts:153` |
| `pharma_lab.regulatory_document_versions` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.download → RegulatoryDocumentsService.registerDownload → RegulatoryRepository.listVersions | `src/modules/pharma_lab/repositories/regulatory.repository.ts:134` |
| `pharma_lab.regulatory_documents` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.download → RegulatoryDocumentsService.registerDownload → RegulatoryDocumentsService.requireDocument → RegulatoryRepository.findDocument | `src/modules/pharma_lab/repositories/regulatory.repository.ts:25` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `documentId` | path | Sí | `string` | — |
| `versionId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RegulatoryDocumentVersions>` · DTO `RegulatoryDocumentVersions`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:18` |
| `regulatoryDocumentId` | `string` | Sí | — | `@Property({ fieldName: 'regulatory_document_id', type: 'uuid' })` | Documento al que pertenece. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:24` |
| `version` | `string` | Sí | — | `@Property({ columnType: 'varchar' })` | Etiqueta de versión. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:30` |
| `storageKey` | `string` | Sí | — | `@Property({ fieldName: 'storage_key', columnType: 'varchar' })` | Referencia del archivo en el almacén. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:36` |
| `fileName` | `string` | Sí | — | `@Property({ fieldName: 'file_name', columnType: 'varchar' })` | Nombre visible del archivo. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:42` |
| `contentType` | `string` | No | — | `@Property({ fieldName: 'content_type', columnType: 'varchar', nullable: true, })` | Tipo MIME. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:52` |
| `issuedOn` | `string` | No | — | `@Property({ fieldName: 'issued_on', columnType: 'date', nullable: true })` | Fecha de emisión de esta versión. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:58` |
| `expiresOn` | `string` | No | — | `@Property({ fieldName: 'expires_on', columnType: 'date', nullable: true })` | Fecha de vencimiento de esta versión. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:64` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado de la versión: vigente, sustituida o invalidada. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:70` |
| `changeReason` | `string` | No | — | `@Property({ fieldName: 'change_reason', columnType: 'text', nullable: true })` | Motivo de la sustitución o invalidación. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:76` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:82` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:88` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:94` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:100` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/regulatory_document_versions.entity.ts:106` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Documento no encontrado en el laboratorio; ResourceNotFoundException: Versión no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:RegulatoryDocumentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 37. POST /pharma-labs/{pharmaLabId}/regulatory-documents/expirations/review

- **Origen:** CONTRATO
- **Nombre:** Revisar vencimientos y notificar al personal
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RegulatoryDocumentsController.reviewExpirations` — `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:169`

### Qué es y para qué sirve (negocio)

Revisar vencimientos y notificar al personal.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/regulatory-documents/expirations/review` la atiende `RegulatoryDocumentsController.reviewExpirations` (src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:169). Exige sesión con alguno de los roles REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN. Delega en `RegulatoryDocumentsService.reviewExpirations`. Crea filas en pharma_lab.pharma_lab_notices. Actualiza pharma_lab.regulatory_documents. Lee pharma_lab.pharma_lab_staff, pharma_lab.pharma_labs, pharma_lab.regulatory_documents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: REGULATORY_AFFAIRS, PHARMA_LAB_ADMIN, LEGAL_COUNSEL, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:169` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/regulatory-documents.controller.ts:169` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_lab_notices` | ESCRIBE | CREA | DIRECTA | RegulatoryDocumentsController.reviewExpirations → RegulatoryDocumentsService.reviewExpirations → PharmaLabNotificationsService.notifyAll → PharmaLabNotificationsService.notify | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:58` |
| `pharma_lab.pharma_lab_staff` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.reviewExpirations → RegulatoryDocumentsService.reviewExpirations → PharmaLabOrganizationService.listActiveStaffUserIds → OrganizationRepository.listStaff | `src/modules/pharma_lab/repositories/organization.repository.ts:133` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.reviewExpirations → RegulatoryDocumentsService.reviewExpirations → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.regulatory_documents` | ESCRIBE | ACTUALIZA | POR_TIPO | RegulatoryDocumentsController.reviewExpirations → RegulatoryDocumentsService.reviewExpirations | `src/modules/pharma_lab/services/regulatory-documents.service.ts:383` |
| `pharma_lab.regulatory_documents` | LEE | LEE | DIRECTA | RegulatoryDocumentsController.reviewExpirations → RegulatoryDocumentsService.reviewExpirations → RegulatoryRepository.listExpiringDocuments | `src/modules/pharma_lab/repositories/regulatory.repository.ts:59` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<{ /** Documentos que pasaron a «próximo a vencer». */ expiring: number; /** Documentos que pasaron a «vencido». */ expired: number; }>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:RegulatoryDocumentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. GET /pharma-labs/{pharmaLabId}/staff

- **Origen:** CONTRATO
- **Nombre:** Listar el personal del laboratorio
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabsController.listStaff` — `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:120`

### Qué es y para qué sirve (negocio)

Listar el personal del laboratorio.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}/staff` la atiende `PharmaLabsController.listStaff` (src/modules/pharma_lab/controllers/pharma-labs.controller.ts:120). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Delega en `PharmaLabOrganizationService.listStaff`. Lee pharma_lab.pharma_lab_staff, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:120` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:120` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_lab_staff` | LEE | LEE | DIRECTA | PharmaLabsController.listStaff → PharmaLabOrganizationService.listStaff → OrganizationRepository.listStaff | `src/modules/pharma_lab/repositories/organization.repository.ts:133` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaLabsController.listStaff → PharmaLabOrganizationService.listStaff → PharmaLabAccessService.requireAdministeredLab → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmaLabStaff[]>` · DTO `PharmaLabStaff`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:18` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio al que pertenece. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:24` |
| `userId` | `string` | Sí | — | `@Property({ fieldName: 'user_id', type: 'uuid' })` | Cuenta de la plataforma asociada al colaborador. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:30` |
| `staffTypeConceptId` | `string` | Sí | — | `@Property({ fieldName: 'staff_type_concept_id', type: 'uuid' })` | Tipo de personal. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:36` |
| `roleCode` | `string` | No | — | `@Property({ fieldName: 'role_code', columnType: 'varchar', nullable: true })` | Rol funcional asignado dentro de la organización (código de `authz`). | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:42` |
| `position` | `string` | No | — | `@Property({ columnType: 'varchar', nullable: true })` | Cargo. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:48` |
| `area` | `string` | No | — | `@Property({ columnType: 'varchar', nullable: true })` | Área. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:54` |
| `branchId` | `string` | No | — | `@Property({ fieldName: 'branch_id', type: 'uuid', nullable: true })` | Sede de trabajo. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:60` |
| `workSchedule` | `string` | No | — | `@Property({ fieldName: 'work_schedule', columnType: 'varchar', nullable: true, })` | Jornada (completa, parcial, por horas…). | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:70` |
| `hiredOn` | `string` | Sí | — | `@Property({ fieldName: 'hired_on', columnType: 'date' })` | Fecha de ingreso. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:76` |
| `endedOn` | `string` | No | — | `@Property({ fieldName: 'ended_on', columnType: 'date', nullable: true })` | Fecha de baja, cuando el colaborador fue desvinculado. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:82` |
| `permissions` | `array<string>` | No | — | `@Property({ type: 'json', columnType: 'jsonb', nullable: true })` | Permisos concedidos, más finos que el rol. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:88` |
| `credentialVerificationConceptId` | `string` | Sí | — | `@Property({ fieldName: 'credential_verification_concept_id', type: 'uuid' })` | Estado de verificación de credenciales profesionales, cuando corresponde. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:94` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado de la vinculación (activa, terminada, suspendida). | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:100` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:106` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:112` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:118` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:124` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/pharma_lab_staff.entity.ts:130` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El laboratorio no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 39. POST /pharma-labs/{pharmaLabId}/staff

- **Origen:** CONTRATO
- **Nombre:** Vincular personal al laboratorio
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabsController.linkStaff` — `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:103`

### Qué es y para qué sirve (negocio)

Vincular personal al laboratorio.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/staff` la atiende `PharmaLabsController.linkStaff` (src/modules/pharma_lab/controllers/pharma-labs.controller.ts:103). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `LinkStaffDto` (9 campos, 3 obligatorios). Delega en `PharmaLabOrganizationService.linkStaff`. Crea filas en audit.audit_log, pharma_lab.pharma_lab_link_events, pharma_lab.pharma_lab_staff. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_lab_staff, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:103` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:103` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmaLabsController.linkStaff → PharmaLabOrganizationService.linkStaff → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmaLabsController.linkStaff → PharmaLabOrganizationService.linkStaff → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmaLabsController.linkStaff → PharmaLabOrganizationService.linkStaff → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_lab_link_events` | ESCRIBE | CREA | DIRECTA | PharmaLabsController.linkStaff → PharmaLabOrganizationService.linkStaff → OrganizationRepository.appendLinkEvent | `src/modules/pharma_lab/repositories/organization.repository.ts:170` |
| `pharma_lab.pharma_lab_staff` | ESCRIBE | CREA | DIRECTA | PharmaLabsController.linkStaff → PharmaLabOrganizationService.linkStaff → OrganizationRepository.createStaff | `src/modules/pharma_lab/repositories/organization.repository.ts:151` |
| `pharma_lab.pharma_lab_staff` | LEE | LEE | DIRECTA | PharmaLabsController.linkStaff → PharmaLabOrganizationService.linkStaff → OrganizationRepository.findStaffByUser | `src/modules/pharma_lab/repositories/organization.repository.ts:101` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaLabsController.linkStaff → PharmaLabOrganizationService.linkStaff → PharmaLabAccessService.requireAdministeredLab → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo — DTO `LinkStaffDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/organization.dto.ts:145` |
| `staffTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/organization.dto.ts:152` |
| `roleCode` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:161` |
| `position` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:170` |
| `area` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:179` |
| `branchId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/organization.dto.ts:187` |
| `workSchedule` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:196` |
| `hiredOn` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/pharma_lab/dto/organization.dto.ts:203` |
| `permissions` | `array<string>` | No | máximo 100 elemento(s) | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` `@ArrayMaxSize(100)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:213` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "staffTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "hiredOn": "2026-07-31"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 409 | `CONFLICT` | ConflictException: La cuenta ya está vinculada al laboratorio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El laboratorio no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 40. PATCH /pharma-labs/{pharmaLabId}/staff/{staffId}/permissions

- **Origen:** CONTRATO
- **Nombre:** Cambiar los permisos de un colaborador
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabsController.updatePermissions` — `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:130`

### Qué es y para qué sirve (negocio)

Cambiar los permisos de un colaborador.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PATCH /pharma-labs/{pharmaLabId}/staff/{staffId}/permissions` la atiende `PharmaLabsController.updatePermissions` (src/modules/pharma_lab/controllers/pharma-labs.controller.ts:130). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `UpdateStaffPermissionsDto` (2 campos, 2 obligatorios). Delega en `PharmaLabOrganizationService.updateStaffPermissions`. Crea filas en audit.audit_log, pharma_lab.pharma_lab_link_events. Actualiza pharma_lab.pharma_lab_staff. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_lab_staff, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:130` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, staffId | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:130` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmaLabsController.updatePermissions → PharmaLabOrganizationService.updateStaffPermissions → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmaLabsController.updatePermissions → PharmaLabOrganizationService.updateStaffPermissions → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmaLabsController.updatePermissions → PharmaLabOrganizationService.updateStaffPermissions → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_lab_link_events` | ESCRIBE | CREA | DIRECTA | PharmaLabsController.updatePermissions → PharmaLabOrganizationService.updateStaffPermissions → OrganizationRepository.appendLinkEvent | `src/modules/pharma_lab/repositories/organization.repository.ts:170` |
| `pharma_lab.pharma_lab_staff` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmaLabsController.updatePermissions → PharmaLabOrganizationService.updateStaffPermissions | `src/modules/pharma_lab/services/pharma-lab-organization.service.ts:302` |
| `pharma_lab.pharma_lab_staff` | LEE | LEE | DIRECTA | PharmaLabsController.updatePermissions → PharmaLabOrganizationService.updateStaffPermissions → PharmaLabAccessService.requireAdministeredLab → OrganizationRepository.findStaffByUser | `src/modules/pharma_lab/repositories/organization.repository.ts:101` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaLabsController.updatePermissions → PharmaLabOrganizationService.updateStaffPermissions → PharmaLabAccessService.requireAdministeredLab → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `staffId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateStaffPermissionsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `permissions` | `array<string>` | Sí | máximo 100 elemento(s) | `@IsArray()` `@IsString({ each: true })` `@ArrayMaxSize(100)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:225` |
| `reason` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:233` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "permissions": [
    "valor-ejemplo"
  ],
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "permissions": [
    "valor-ejemplo"
  ],
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Ficha de personal no encontrada en el laboratorio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El laboratorio no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 41. POST /pharma-labs/{pharmaLabId}/staff/{staffId}/unlink

- **Origen:** CONTRATO
- **Nombre:** Desvincular a un colaborador
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabsController.unlinkStaff` — `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:152`

### Qué es y para qué sirve (negocio)

Desvincular a un colaborador.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/staff/{staffId}/unlink` la atiende `PharmaLabsController.unlinkStaff` (src/modules/pharma_lab/controllers/pharma-labs.controller.ts:152). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `UnlinkDto` (2 campos, 1 obligatorio). Delega en `PharmaLabOrganizationService.unlinkStaff`. Crea filas en audit.audit_log, pharma_lab.pharma_lab_link_events. Actualiza pharma_lab.pharma_lab_staff. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_lab_staff, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:152` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, staffId | `src/modules/pharma_lab/controllers/pharma-labs.controller.ts:152` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmaLabsController.unlinkStaff → PharmaLabOrganizationService.unlinkStaff → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmaLabsController.unlinkStaff → PharmaLabOrganizationService.unlinkStaff → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmaLabsController.unlinkStaff → PharmaLabOrganizationService.unlinkStaff → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_lab_link_events` | ESCRIBE | CREA | DIRECTA | PharmaLabsController.unlinkStaff → PharmaLabOrganizationService.unlinkStaff → OrganizationRepository.appendLinkEvent | `src/modules/pharma_lab/repositories/organization.repository.ts:170` |
| `pharma_lab.pharma_lab_staff` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmaLabsController.unlinkStaff → PharmaLabOrganizationService.unlinkStaff | `src/modules/pharma_lab/services/pharma-lab-organization.service.ts:355` |
| `pharma_lab.pharma_lab_staff` | LEE | LEE | DIRECTA | PharmaLabsController.unlinkStaff → PharmaLabOrganizationService.unlinkStaff → PharmaLabAccessService.requireAdministeredLab → OrganizationRepository.findStaffByUser | `src/modules/pharma_lab/repositories/organization.repository.ts:101` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaLabsController.unlinkStaff → PharmaLabOrganizationService.unlinkStaff → PharmaLabAccessService.requireAdministeredLab → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `staffId` | path | Sí | `string` | — |

### Cuerpo — DTO `UnlinkDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | — | `src/modules/pharma_lab/dto/organization.dto.ts:244` |
| `effectiveOn` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/pharma_lab/dto/organization.dto.ts:252` |

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
  "effectiveOn": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Ficha de personal no encontrada en el laboratorio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El laboratorio no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 42. GET /pharma-labs/{pharmaLabId}/visitor-posts

- **Origen:** CONTRATO
- **Nombre:** Listar las publicaciones propuestas
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabSocialController.listPosts` — `src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:82`

### Qué es y para qué sirve (negocio)

Listar las publicaciones propuestas.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/{pharmaLabId}/visitor-posts` la atiende `PharmaLabSocialController.listPosts` (src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:82). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Delega en `PharmaSocialService.listSubmissions`. Lee pharma_lab.pharma_labs, pharma_lab.visitor_post_submissions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:82` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:82` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaLabSocialController.listPosts → PharmaSocialService.listSubmissions → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.visitor_post_submissions` | LEE | LEE | DIRECTA | PharmaLabSocialController.listPosts → PharmaSocialService.listSubmissions → AnalyticsRepository.listPostSubmissions | `src/modules/pharma_lab/repositories/analytics.repository.ts:96` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VisitorPostSubmissions[]>` · DTO `VisitorPostSubmissions`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:19` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio que autoriza. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:25` |
| `medicalVisitorId` | `string` | Sí | — | `@Property({ fieldName: 'medical_visitor_id', type: 'uuid' })` | Visitador autor. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:31` |
| `body` | `string` | Sí | — | `@Property({ columnType: 'text' })` | Cuerpo propuesto. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:37` |
| `informationalMaterialId` | `string` | No | — | `@Property({ fieldName: 'informational_material_id', type: 'uuid', nullable: true, })` | Material científico aprobado que acompaña la publicación. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:47` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado del trámite. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:53` |
| `decisionRationale` | `string` | No | — | `@Property({ fieldName: 'decision_rationale', columnType: 'text', nullable: true, })` | Fundamento de la decisión. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:63` |
| `decidedByUserId` | `string` | No | — | `@Property({ fieldName: 'decided_by_user_id', type: 'uuid', nullable: true })` | Quién decidió. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:69` |
| `decidedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'decided_at', columnType: 'timestamptz', nullable: true, })` | Momento de la decisión. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:79` |
| `socialPostId` | `string` | No | — | `@Property({ fieldName: 'social_post_id', type: 'uuid', nullable: true })` | Publicación creada al aprobarse. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:85` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:91` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:97` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:103` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:109` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/visitor_post_submissions.entity.ts:115` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabSocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 43. POST /pharma-labs/{pharmaLabId}/visitor-posts/{submissionId}/decision

- **Origen:** CONTRATO
- **Nombre:** Aprobar o rechazar la publicación propuesta
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabSocialController.decidePost` — `src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:92`

### Qué es y para qué sirve (negocio)

Aprobar o rechazar la publicación propuesta.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/{pharmaLabId}/visitor-posts/{submissionId}/decision` la atiende `PharmaLabSocialController.decidePost` (src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:92). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `DecideVisitorPostDto` (2 campos, 2 obligatorios). Delega en `PharmaSocialService.decide`. Crea filas en audit.audit_log, community.public_profiles, community.social_posts, pharma_lab.pharma_lab_notices. Actualiza pharma_lab.visitor_post_submissions. Lee audit.audit_log, community.public_profiles, iam.sessions, pharma_lab.medical_visitors, pharma_lab.pharma_labs, pharma_lab.visitor_post_submissions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, submissionId | `src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:92` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmaLabSocialController.decidePost → PharmaSocialService.decide → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmaLabSocialController.decidePost → PharmaSocialService.decide → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | PharmaLabSocialController.decidePost → PharmaSocialService.decide → PharmaSocialService.ensurePublicProfile | `src/modules/pharma_lab/services/pharma-social.service.ts:273` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PharmaLabSocialController.decidePost → PharmaSocialService.decide → PharmaSocialService.ensurePublicProfile | `src/modules/pharma_lab/services/pharma-social.service.ts:266` |
| `community.social_posts` | ESCRIBE | CREA | DIRECTA | PharmaLabSocialController.decidePost → PharmaSocialService.decide | `src/modules/pharma_lab/services/pharma-social.service.ts:186` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmaLabSocialController.decidePost → PharmaSocialService.decide → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | PharmaLabSocialController.decidePost → PharmaSocialService.decide → PharmaLabAccessService.requireVisitorOfLab → VisitorsRepository.findVisitor | `src/modules/pharma_lab/repositories/visitors.repository.ts:30` |
| `pharma_lab.pharma_lab_notices` | ESCRIBE | CREA | DIRECTA | PharmaLabSocialController.decidePost → PharmaSocialService.decide → PharmaLabNotificationsService.notify | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:58` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaLabSocialController.decidePost → PharmaSocialService.decide → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.visitor_post_submissions` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmaLabSocialController.decidePost → PharmaSocialService.decide | `src/modules/pharma_lab/services/pharma-social.service.ts:172` |
| `pharma_lab.visitor_post_submissions` | LEE | LEE | DIRECTA | PharmaLabSocialController.decidePost → PharmaSocialService.decide → AnalyticsRepository.findPostSubmission | `src/modules/pharma_lab/repositories/analytics.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `submissionId` | path | Sí | `string` | — |

### Cuerpo — DTO `DecideVisitorPostDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `statusConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/social.dto.ts:36` |
| `rationale` | `string` | Sí | longitud máxima 1000 | `@IsString()` `@MaxLength(1000)` | — | `src/modules/pharma_lab/dto/social.dto.ts:44` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "rationale": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "rationale": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Propuesta no encontrada; ResourceNotFoundException: Visitador no encontrado en el laboratorio |
| 409 | `CONFLICT` | ConflictException: La propuesta ya fue resuelta |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La decisión debe ser aprobar o rechazar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabSocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 44. POST /pharma-labs/notices/{noticeId}/read

- **Origen:** CONTRATO
- **Nombre:** Marcar un aviso como leído
- **Bloque:** —
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabNoticesController.markRead` — `src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts:50`

### Qué es y para qué sirve (negocio)

Marcar un aviso como leído.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/notices/{noticeId}/read` la atiende `PharmaLabNoticesController.markRead` (src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts:50). Exige sesión; el controlador no declara roles. Delega en `PharmaLabNotificationsService.markRead`. Actualiza pharma_lab.pharma_lab_notices. Lee pharma_lab.pharma_lab_notices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: noticeId | `src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts:50` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_lab_notices` | ESCRIBE | ACTUALIZA | POR_TIPO | PharmaLabNoticesController.markRead → PharmaLabNotificationsService.markRead | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:122` |
| `pharma_lab.pharma_lab_notices` | LEE | LEE | DIRECTA | PharmaLabNoticesController.markRead → PharmaLabNotificationsService.markRead | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:117` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `noticeId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aviso no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabNoticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 45. GET /pharma-labs/notices/mine

- **Origen:** CONTRATO
- **Nombre:** Avisos del laboratorio dirigidos a mi cuenta
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabNoticesController.listMine` — `src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts:41`

### Qué es y para qué sirve (negocio)

Avisos del laboratorio dirigidos a mi cuenta.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/notices/mine` la atiende `PharmaLabNoticesController.listMine` (src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts:41). Exige sesión; el controlador no declara roles. Delega en `PharmaLabNotificationsService.listOwn`. Lee pharma_lab.pharma_lab_notices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharma_lab/controllers/pharma-lab-notices.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_lab_notices` | LEE | LEE | DIRECTA | PharmaLabNoticesController.listMine → PharmaLabNotificationsService.listOwn | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:101` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PharmaLabNotices[]>` · DTO `PharmaLabNotices`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:32` |
| `recipientUserId` | `string` | Sí | — | `@Property({ fieldName: 'recipient_user_id', type: 'uuid' })` | Cuenta destinataria. | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:38` |
| `tenantId` | `string` | No | — | `@Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true })` | Organización bajo la que se emite, cuando aplica. | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:44` |
| `templateCode` | `string` | Sí | — | `@Property({ fieldName: 'template_code', columnType: 'varchar' })` | Código estable de plantilla, con el que la interfaz rotula el aviso. | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:50` |
| `subject` | `string` | Sí | — | `@Property({ columnType: 'varchar' })` | Asunto legible. | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:56` |
| `bodyText` | `string` | Sí | — | `@Property({ fieldName: 'body_text', columnType: 'text' })` | Cuerpo legible. | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:62` |
| `relatedResourceType` | `string` | Sí | — | `@Property({ fieldName: 'related_resource_type', columnType: 'varchar' })` | Tipo del recurso que originó el aviso (`visit_request`, `regulatory_document`…). | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:68` |
| `relatedResourceId` | `string` | Sí | — | `@Property({ fieldName: 'related_resource_id', type: 'uuid' })` | Identificador de ese recurso. | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:74` |
| `isRead` | `boolean` | Sí | — | `@Property({ fieldName: 'is_read', type: 'boolean' })` | Si la persona ya lo leyó. | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:80` |
| `readAt` | `string` | No | formato date-time | `@Property({ fieldName: 'read_at', columnType: 'timestamptz', nullable: true })` | Momento de la lectura. | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:86` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:92` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:98` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:104` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:110` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/pharma_lab_notices.entity.ts:116` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabNoticesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 46. GET /pharma-labs/reference/concepts

- **Origen:** CONTRATO
- **Nombre:** Diccionario de conceptos del laboratorio farmacéutico
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabReferenceController.listConcepts` — `src/modules/pharma_lab/controllers/pharma-lab-reference.controller.ts:34`

### Qué es y para qué sirve (negocio)

Diccionario de conceptos del laboratorio farmacéutico.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /pharma-labs/reference/concepts` la atiende `PharmaLabReferenceController.listConcepts` (src/modules/pharma_lab/controllers/pharma-lab-reference.controller.ts:34). Exige sesión; el controlador no declara roles. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/pharma_lab/controllers/pharma-lab-reference.controller.ts:34` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/pharma_lab/controllers/pharma-lab-reference.controller.ts:34`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `PharmaLabConcept[]`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabReferenceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 47. POST /pharma-labs/visitor-posts

- **Origen:** CONTRATO
- **Nombre:** Proponer una publicación como visitador
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PharmaLabSocialController.submitPost` — `src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:65`

### Qué es y para qué sirve (negocio)

Proponer una publicación como visitador.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /pharma-labs/visitor-posts` la atiende `PharmaLabSocialController.submitPost` (src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:65). Exige sesión con alguno de los roles MEDICAL_VISITOR. Valida el cuerpo como `SubmitVisitorPostDto` (2 campos, 1 obligatorio). Delega en `PharmaSocialService.submit`. Crea filas en audit.audit_log, pharma_lab.visitor_post_submissions. Lee audit.audit_log, iam.sessions, pharma_lab.informational_materials, pharma_lab.medical_visitors, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MEDICAL_VISITOR | `src/modules/pharma_lab/controllers/pharma-lab-social.controller.ts:65` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PharmaLabSocialController.submitPost → PharmaSocialService.submit → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PharmaLabSocialController.submitPost → PharmaSocialService.submit → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PharmaLabSocialController.submitPost → PharmaSocialService.submit → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.informational_materials` | LEE | LEE | DIRECTA | PharmaLabSocialController.submitPost → PharmaSocialService.submit → CatalogRepository.findMaterial | `src/modules/pharma_lab/repositories/catalog.repository.ts:87` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | PharmaLabSocialController.submitPost → PharmaSocialService.submit → PharmaLabAccessService.requireOperatingVisitor → VisitorsRepository.findVisitorByUser | `src/modules/pharma_lab/repositories/visitors.repository.ts:44` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | PharmaLabSocialController.submitPost → PharmaSocialService.submit → PharmaLabAccessService.requireOperatingVisitor → PharmaLabAccessService.requireVisitorOperable → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.visitor_post_submissions` | ESCRIBE | CREA | DIRECTA | PharmaLabSocialController.submitPost → PharmaSocialService.submit → AnalyticsRepository.createPostSubmission | `src/modules/pharma_lab/repositories/analytics.repository.ts:64` |

### Cuerpo — DTO `SubmitVisitorPostDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `body` | `string` | Sí | longitud máxima 4000 | `@IsString()` `@MaxLength(4000)` | — | `src/modules/pharma_lab/dto/social.dto.ts:18` |
| `informationalMaterialId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/social.dto.ts:26` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "body": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "body": "valor-ejemplo",
  "informationalMaterialId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La cuenta no corresponde a un visitador médico; ResourceNotFoundException: Material informativo no encontrado en el laboratorio |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El visitador no tiene una vinculación activa con un laboratorio; PreconditionFailedException: El laboratorio del visitador no está activo; PreconditionFailedException: Solo se puede adjuntar material científico aprobado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:PharmaLabSocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 48. GET /visit-agenda/blocks

- **Origen:** CONTRATO
- **Nombre:** Listar los bloqueos vigentes
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitAgendaController.listBlocks` — `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:98`

### Qué es y para qué sirve (negocio)

Listar los bloqueos vigentes.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /visit-agenda/blocks` la atiende `VisitAgendaController.listBlocks` (src/modules/pharma_lab/controllers/visit-agenda.controller.ts:98). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `VisitAgendaService.listBlocks`. Lee pharma_lab.doctor_visit_blocks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:98` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.doctor_visit_blocks` | LEE | LEE | DIRECTA | VisitAgendaController.listBlocks → VisitAgendaService.listBlocks → AgendaRepository.listActiveBlocks | `src/modules/pharma_lab/repositories/agenda.repository.ts:132` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DoctorVisitBlocks[]>` · DTO `DoctorVisitBlocks`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/doctor_visit_blocks.entity.ts:18` |
| `doctorUserId` | `string` | Sí | — | `@Property({ fieldName: 'doctor_user_id', type: 'uuid' })` | Doctor que bloquea. | `src/modules/pharma_lab/entities/doctor_visit_blocks.entity.ts:24` |
| `pharmaLabId` | `string` | No | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid', nullable: true })` | Laboratorio bloqueado, si el bloqueo es institucional. | `src/modules/pharma_lab/entities/doctor_visit_blocks.entity.ts:30` |
| `medicalVisitorId` | `string` | No | — | `@Property({ fieldName: 'medical_visitor_id', type: 'uuid', nullable: true })` | Visitador bloqueado, si el bloqueo es individual. | `src/modules/pharma_lab/entities/doctor_visit_blocks.entity.ts:36` |
| `reason` | `string` | Sí | — | `@Property({ columnType: 'text' })` | Razón justificada del bloqueo. | `src/modules/pharma_lab/entities/doctor_visit_blocks.entity.ts:42` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado del bloqueo: vigente o levantado. | `src/modules/pharma_lab/entities/doctor_visit_blocks.entity.ts:48` |
| `liftedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'lifted_at', columnType: 'timestamptz', nullable: true, })` | Momento en que se levantó el bloqueo. | `src/modules/pharma_lab/entities/doctor_visit_blocks.entity.ts:58` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/doctor_visit_blocks.entity.ts:64` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/doctor_visit_blocks.entity.ts:70` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/doctor_visit_blocks.entity.ts:76` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/doctor_visit_blocks.entity.ts:82` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/doctor_visit_blocks.entity.ts:88` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitAgendaController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 49. POST /visit-agenda/blocks

- **Origen:** CONTRATO
- **Nombre:** Bloquear un laboratorio o un visitador
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitAgendaController.createBlock` — `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:81`

### Qué es y para qué sirve (negocio)

Bloquear un laboratorio o un visitador.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-agenda/blocks` la atiende `VisitAgendaController.createBlock` (src/modules/pharma_lab/controllers/visit-agenda.controller.ts:81). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `CreateVisitBlockDto` (3 campos, 1 obligatorio). Delega en `VisitAgendaService.createBlock`. Crea filas en audit.audit_log, pharma_lab.doctor_visit_blocks. Lee audit.audit_log, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitAgendaController.createBlock → VisitAgendaService.createBlock → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitAgendaController.createBlock → VisitAgendaService.createBlock → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitAgendaController.createBlock → VisitAgendaService.createBlock → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.doctor_visit_blocks` | ESCRIBE | CREA | DIRECTA | VisitAgendaController.createBlock → VisitAgendaService.createBlock → AgendaRepository.createBlock | `src/modules/pharma_lab/repositories/agenda.repository.ts:103` |

### Cuerpo — DTO `CreateVisitBlockDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pharmaLabId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:182` |
| `medicalVisitorId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:190` |
| `reason` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:198` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "pharmaLabId": "00000000-0000-4000-8000-000000000001",
  "medicalVisitorId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique el laboratorio o el visitador a bloquear |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitAgendaController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 50. POST /visit-agenda/blocks/{blockId}/lift

- **Origen:** CONTRATO
- **Nombre:** Levantar un bloqueo
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitAgendaController.liftBlock` — `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:108`

### Qué es y para qué sirve (negocio)

Levantar un bloqueo.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-agenda/blocks/{blockId}/lift` la atiende `VisitAgendaController.liftBlock` (src/modules/pharma_lab/controllers/visit-agenda.controller.ts:108). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `VisitAgendaService.liftBlock`. Crea filas en audit.audit_log. Actualiza pharma_lab.doctor_visit_blocks. Lee audit.audit_log, iam.sessions, pharma_lab.doctor_visit_blocks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:108` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: blockId | `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:108` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitAgendaController.liftBlock → VisitAgendaService.liftBlock → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitAgendaController.liftBlock → VisitAgendaService.liftBlock → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitAgendaController.liftBlock → VisitAgendaService.liftBlock → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.doctor_visit_blocks` | ESCRIBE | ACTUALIZA | POR_TIPO | VisitAgendaController.liftBlock → VisitAgendaService.liftBlock | `src/modules/pharma_lab/services/visit-agenda.service.ts:268` |
| `pharma_lab.doctor_visit_blocks` | LEE | LEE | DIRECTA | VisitAgendaController.liftBlock → VisitAgendaService.liftBlock → AgendaRepository.findBlock | `src/modules/pharma_lab/repositories/agenda.repository.ts:118` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `blockId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Bloqueo no encontrado |
| 409 | `CONFLICT` | ConflictException: El bloqueo ya estaba levantado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitAgendaController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 51. GET /visit-agenda/doctors/{doctorUserId}

- **Origen:** CONTRATO
- **Nombre:** Consultar la agenda de visitas de un doctor
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitAgendaController.getDoctorAgenda` — `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:71`

### Qué es y para qué sirve (negocio)

Consultar la agenda de visitas de un doctor.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /visit-agenda/doctors/{doctorUserId}` la atiende `VisitAgendaController.getDoctorAgenda` (src/modules/pharma_lab/controllers/visit-agenda.controller.ts:71). Exige sesión con alguno de los roles MEDICAL_VISITOR, PHARMA_LAB_ADMIN, PRACTITIONER, CLINICIAN. Delega en `VisitAgendaService.getPublishedAgenda`. Lee pharma_lab.doctor_visit_policies, pharma_lab.doctor_visit_windows.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MEDICAL_VISITOR, PHARMA_LAB_ADMIN, PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:71` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: doctorUserId | `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:71` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.doctor_visit_policies` | LEE | LEE | DIRECTA | VisitAgendaController.getDoctorAgenda → VisitAgendaService.getPublishedAgenda → AgendaRepository.findPolicy | `src/modules/pharma_lab/repositories/agenda.repository.ts:25` |
| `pharma_lab.doctor_visit_windows` | LEE | LEE | DIRECTA | VisitAgendaController.getDoctorAgenda → VisitAgendaService.getPublishedAgenda → AgendaRepository.listWindows | `src/modules/pharma_lab/repositories/agenda.repository.ts:57` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `doctorUserId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublishedAgenda>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El doctor no tiene agenda de visitas habilitada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitAgendaController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 52. GET /visit-agenda/me

- **Origen:** CONTRATO
- **Nombre:** Consultar la propia agenda de visitas
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitAgendaController.getOwn` — `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:60`

### Qué es y para qué sirve (negocio)

Consultar la propia agenda de visitas.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /visit-agenda/me` la atiende `VisitAgendaController.getOwn` (src/modules/pharma_lab/controllers/visit-agenda.controller.ts:60). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `VisitAgendaService.getPublishedAgenda`. Lee pharma_lab.doctor_visit_policies, pharma_lab.doctor_visit_windows.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:60` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.doctor_visit_policies` | LEE | LEE | DIRECTA | VisitAgendaController.getOwn → VisitAgendaService.getPublishedAgenda → AgendaRepository.findPolicy | `src/modules/pharma_lab/repositories/agenda.repository.ts:25` |
| `pharma_lab.doctor_visit_windows` | LEE | LEE | DIRECTA | VisitAgendaController.getOwn → VisitAgendaService.getPublishedAgenda → AgendaRepository.listWindows | `src/modules/pharma_lab/repositories/agenda.repository.ts:57` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublishedAgenda>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El doctor no tiene agenda de visitas habilitada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitAgendaController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 53. PUT /visit-agenda/me

- **Origen:** CONTRATO
- **Nombre:** Configurar la agenda de visitas del doctor
- **Bloque:** —
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitAgendaController.putPolicy` — `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:44`

### Qué es y para qué sirve (negocio)

Configurar la agenda de visitas del doctor.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PUT /visit-agenda/me` la atiende `VisitAgendaController.putPolicy` (src/modules/pharma_lab/controllers/visit-agenda.controller.ts:44). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `PutVisitPolicyDto` (16 campos, 6 obligatorios). Delega en `VisitAgendaService.putPolicy`. Crea filas en audit.audit_log, pharma_lab.doctor_visit_policies, pharma_lab.doctor_visit_windows. Actualiza pharma_lab.doctor_visit_policies. Borra de pharma_lab.doctor_visit_windows. Lee audit.audit_log, iam.sessions, pharma_lab.doctor_visit_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-agenda.controller.ts:44` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitAgendaController.putPolicy → VisitAgendaService.putPolicy → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitAgendaController.putPolicy → VisitAgendaService.putPolicy → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitAgendaController.putPolicy → VisitAgendaService.putPolicy → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.doctor_visit_policies` | ESCRIBE | ACTUALIZA | POR_TIPO | VisitAgendaController.putPolicy → VisitAgendaService.putPolicy | `src/modules/pharma_lab/services/visit-agenda.service.ts:129` |
| `pharma_lab.doctor_visit_policies` | ESCRIBE | CREA | DIRECTA | VisitAgendaController.putPolicy → VisitAgendaService.putPolicy → AgendaRepository.createPolicy | `src/modules/pharma_lab/repositories/agenda.repository.ts:39` |
| `pharma_lab.doctor_visit_policies` | LEE | LEE | DIRECTA | VisitAgendaController.putPolicy → VisitAgendaService.putPolicy → AgendaRepository.findPolicy | `src/modules/pharma_lab/repositories/agenda.repository.ts:25` |
| `pharma_lab.doctor_visit_windows` | BORRA | BORRA | DIRECTA | VisitAgendaController.putPolicy → VisitAgendaService.putPolicy → AgendaRepository.replaceWindows | `src/modules/pharma_lab/repositories/agenda.repository.ts:78` |
| `pharma_lab.doctor_visit_windows` | ESCRIBE | CREA | DIRECTA | VisitAgendaController.putPolicy → VisitAgendaService.putPolicy → AgendaRepository.replaceWindows | `src/modules/pharma_lab/repositories/agenda.repository.ts:80` |

### Cuerpo — DTO `PutVisitPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:93` |
| `timeZone` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:102` |
| `autoConfirm` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:110` |
| `maxVisitsPerDay` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:119` |
| `minNoticeHours` | `number` | No | mínimo 0; máximo 720 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(720)` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:129` |
| `rescheduleCutoffHours` | `number` | No | mínimo 0; máximo 720 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(720)` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:139` |
| `allowedSpecialtyConceptIds` | `array<string>` | No | formato uuid; máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` `@ArrayMaxSize(50)` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:149` |
| `maxDurationMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:159` |
| `windows` | `array<VisitWindowDto>` | Sí | máximo 50 elemento(s) | `@IsArray()` `@ArrayNotEmpty()` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => VisitWindowDto)` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:171` |
| `windows[].weekday` | `number` | Sí | mínimo 0; máximo 6 | `@IsInt()` `@Min(0)` `@Max(6)` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:28` |
| `windows[].startTime` | `string` | Sí | patrón runtime /^([01]\d\|2[0-3]):[0-5]\d$/ | `@Matches(/^([01]\d\|2[0-3]):[0-5]\d$/, { message: 'startTime debe ser HH:MM' })` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:35` |
| `windows[].endTime` | `string` | Sí | patrón runtime /^([01]\d\|2[0-3]):[0-5]\d$/ | `@Matches(/^([01]\d\|2[0-3]):[0-5]\d$/, { message: 'endTime debe ser HH:MM' })` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:42` |
| `windows[].slotDurationMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:51` |
| `windows[].modalityConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:58` |
| `windows[].location` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:67` |
| `windows[].maxVisits` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | — | `src/modules/pharma_lab/dto/agenda.dto.ts:76` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La hora de fin debe ser posterior a la de inicio; PreconditionFailedException: Dos ventanas del mismo día se superponen |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitAgendaController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 54. POST /visit-records

- **Origen:** CONTRATO
- **Nombre:** Registrar la visita realizada
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRecordsController.create` — `src/modules/pharma_lab/controllers/visit-records.controller.ts:47`

### Qué es y para qué sirve (negocio)

Registrar la visita realizada.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-records` la atiende `VisitRecordsController.create` (src/modules/pharma_lab/controllers/visit-records.controller.ts:47). Exige sesión con alguno de los roles MEDICAL_VISITOR. Valida el cuerpo como `CreateVisitRecordDto` (13 campos, 4 obligatorios). Delega en `VisitRecordsService.createRecord`. Crea filas en audit.audit_log, pharma_lab.pharma_lab_notices, pharma_lab.visit_record_materials, pharma_lab.visit_records, pharma_lab.visit_request_events, pharma_lab.visit_survey_responses. Actualiza pharma_lab.visit_requests. Lee audit.audit_log, iam.sessions, pharma_lab.informational_materials, pharma_lab.medical_visitors, pharma_lab.pharma_labs, pharma_lab.visit_records, pharma_lab.visit_requests, pharma_lab.visit_surveys.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MEDICAL_VISITOR | `src/modules/pharma_lab/controllers/visit-records.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitRecordsController.create → VisitRecordsService.createRecord → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitRecordsController.create → VisitRecordsService.createRecord → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitRecordsController.create → VisitRecordsService.createRecord → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.informational_materials` | LEE | LEE | DIRECTA | VisitRecordsController.create → VisitRecordsService.createRecord → VisitRecordsService.resolveApprovedMaterials → CatalogRepository.findMaterialsByIds | `src/modules/pharma_lab/repositories/catalog.repository.ts:102` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | VisitRecordsController.create → VisitRecordsService.createRecord → PharmaLabAccessService.requireOperatingVisitor → VisitorsRepository.findVisitorByUser | `src/modules/pharma_lab/repositories/visitors.repository.ts:44` |
| `pharma_lab.pharma_lab_notices` | ESCRIBE | CREA | DIRECTA | VisitRecordsController.create → VisitRecordsService.createRecord → PharmaLabNotificationsService.notify | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:58` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | VisitRecordsController.create → VisitRecordsService.createRecord → PharmaLabAccessService.requireOperatingVisitor → PharmaLabAccessService.requireVisitorOperable → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.visit_record_materials` | ESCRIBE | CREA | DIRECTA | VisitRecordsController.create → VisitRecordsService.createRecord → VisitsRepository.createRecordMaterial | `src/modules/pharma_lab/repositories/visits.repository.ts:299` |
| `pharma_lab.visit_records` | ESCRIBE | CREA | DIRECTA | VisitRecordsController.create → VisitRecordsService.createRecord → VisitsRepository.createRecord | `src/modules/pharma_lab/repositories/visits.repository.ts:245` |
| `pharma_lab.visit_records` | LEE | LEE | DIRECTA | VisitRecordsController.create → VisitRecordsService.createRecord → VisitsRepository.findRecordByRequest | `src/modules/pharma_lab/repositories/visits.repository.ts:234` |
| `pharma_lab.visit_request_events` | ESCRIBE | CREA | DIRECTA | VisitRecordsController.create → VisitRecordsService.createRecord → VisitsRepository.appendRequestEvent | `src/modules/pharma_lab/repositories/visits.repository.ts:187` |
| `pharma_lab.visit_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | VisitRecordsController.create → VisitRecordsService.createRecord | `src/modules/pharma_lab/services/visit-records.service.ts:180` |
| `pharma_lab.visit_requests` | LEE | LEE | DIRECTA | VisitRecordsController.create → VisitRecordsService.createRecord → VisitsRepository.findRequest | `src/modules/pharma_lab/repositories/visits.repository.ts:33` |
| `pharma_lab.visit_survey_responses` | ESCRIBE | CREA | DIRECTA | VisitRecordsController.create → VisitRecordsService.createRecord → VisitRecordsService.issueSurveyIfApplicable → SurveysRepository.createResponse | `src/modules/pharma_lab/repositories/surveys.repository.ts:186` |
| `pharma_lab.visit_surveys` | LEE | LEE | DIRECTA | VisitRecordsController.create → VisitRecordsService.createRecord → VisitRecordsService.issueSurveyIfApplicable → SurveysRepository.findApplicableSurvey | `src/modules/pharma_lab/repositories/surveys.repository.ts:59` |

### Cuerpo — DTO `CreateVisitRecordDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `visitRequestId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:202` |
| `occurredAt` | `string` | Sí | formato date-time | `@IsDateString()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:209` |
| `location` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:218` |
| `topicsDiscussed` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:227` |
| `questions` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:236` |
| `commitments` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:245` |
| `nextAction` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:254` |
| `observations` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:263` |
| `visitorAttendanceConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:270` |
| `doctorAttendanceConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:277` |
| `materials` | `array<VisitMaterialDto>` | No | máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => VisitMaterialDto)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:288` |
| `materials[].informationalMaterialId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:184` |
| `materials[].wasHandedOver` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:192` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "visitRequestId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "visitorAttendanceConceptId": "00000000-0000-4000-8000-000000000001",
  "doctorAttendanceConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La cuenta no corresponde a un visitador médico; ResourceNotFoundException: Solicitud no encontrada; ResourceNotFoundException: Material informativo no encontrado en el laboratorio |
| 409 | `CONFLICT` | ConflictException: La visita ya fue registrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El visitador no tiene una vinculación activa con un laboratorio; PreconditionFailedException: El laboratorio del visitador no está activo; PreconditionFailedException: Solo se registra una visita confirmada; PreconditionFailedException: Un visitador no puede compartir material que no está aprobado; PreconditionFailedException: El material no estaba vigente en la fecha de la visita |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 55. POST /visit-records/{visitRecordId}/confirm

- **Origen:** CONTRATO
- **Nombre:** Confirmar que la visita ocurrió
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRecordsController.confirm` — `src/modules/pharma_lab/controllers/visit-records.controller.ts:72`

### Qué es y para qué sirve (negocio)

Confirmar que la visita ocurrió.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-records/{visitRecordId}/confirm` la atiende `VisitRecordsController.confirm` (src/modules/pharma_lab/controllers/visit-records.controller.ts:72). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `ConfirmVisitRecordDto` (2 campos, 1 obligatorio). Delega en `VisitRecordsService.confirmRecord`. Crea filas en audit.audit_log. Actualiza pharma_lab.visit_records. Lee audit.audit_log, iam.sessions, pharma_lab.visit_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-records.controller.ts:72` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: visitRecordId | `src/modules/pharma_lab/controllers/visit-records.controller.ts:72` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitRecordsController.confirm → VisitRecordsService.confirmRecord → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitRecordsController.confirm → VisitRecordsService.confirmRecord → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitRecordsController.confirm → VisitRecordsService.confirmRecord → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.visit_records` | ESCRIBE | ACTUALIZA | POR_TIPO | VisitRecordsController.confirm → VisitRecordsService.confirmRecord | `src/modules/pharma_lab/services/visit-records.service.ts:254` |
| `pharma_lab.visit_records` | LEE | LEE | DIRECTA | VisitRecordsController.confirm → VisitRecordsService.confirmRecord → VisitRecordsService.requireDoctorRecord → VisitsRepository.findRecord | `src/modules/pharma_lab/repositories/visits.repository.ts:220` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `visitRecordId` | path | Sí | `string` | — |

### Cuerpo — DTO `ConfirmVisitRecordDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `occurred` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:298` |
| `note` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:307` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "occurred": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "occurred": true,
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Registro de visita no encontrado |
| 409 | `CONFLICT` | ConflictException: El registro ya fue resuelto |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 56. POST /visit-records/{visitRecordId}/rating

- **Origen:** CONTRATO
- **Nombre:** Calificar la visita completada
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRecordsController.rate` — `src/modules/pharma_lab/controllers/visit-records.controller.ts:89`

### Qué es y para qué sirve (negocio)

Calificar la visita completada.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-records/{visitRecordId}/rating` la atiende `VisitRecordsController.rate` (src/modules/pharma_lab/controllers/visit-records.controller.ts:89). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `RateVisitDto` (9 campos, 1 obligatorio). Delega en `VisitRecordsService.rateVisit`. Crea filas en audit.audit_log, pharma_lab.pharma_lab_notices, pharma_lab.visit_ratings. Lee audit.audit_log, iam.sessions, pharma_lab.medical_visitors, pharma_lab.visit_ratings, pharma_lab.visit_records, pharma_lab.visit_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-records.controller.ts:89` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: visitRecordId | `src/modules/pharma_lab/controllers/visit-records.controller.ts:89` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitRecordsController.rate → VisitRecordsService.rateVisit → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitRecordsController.rate → VisitRecordsService.rateVisit → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitRecordsController.rate → VisitRecordsService.rateVisit → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | VisitRecordsController.rate → VisitRecordsService.rateVisit → VisitorsRepository.findVisitor | `src/modules/pharma_lab/repositories/visitors.repository.ts:30` |
| `pharma_lab.pharma_lab_notices` | ESCRIBE | CREA | DIRECTA | VisitRecordsController.rate → VisitRecordsService.rateVisit → PharmaLabNotificationsService.notify | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:58` |
| `pharma_lab.visit_ratings` | ESCRIBE | CREA | DIRECTA | VisitRecordsController.rate → VisitRecordsService.rateVisit → VisitsRepository.createRating | `src/modules/pharma_lab/repositories/visits.repository.ts:348` |
| `pharma_lab.visit_ratings` | LEE | LEE | DIRECTA | VisitRecordsController.rate → VisitRecordsService.rateVisit → VisitsRepository.findRating | `src/modules/pharma_lab/repositories/visits.repository.ts:337` |
| `pharma_lab.visit_records` | LEE | LEE | DIRECTA | VisitRecordsController.rate → VisitRecordsService.rateVisit → VisitRecordsService.requireDoctorRecord → VisitsRepository.findRecord | `src/modules/pharma_lab/repositories/visits.repository.ts:220` |
| `pharma_lab.visit_requests` | LEE | LEE | DIRECTA | VisitRecordsController.rate → VisitRecordsService.rateVisit → VisitsRepository.findRequest | `src/modules/pharma_lab/repositories/visits.repository.ts:33` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `visitRecordId` | path | Sí | `string` | — |

### Cuerpo — DTO `RateVisitDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kindConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:318` |
| `punctuality` | `number` | No | mínimo 1; máximo 5 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(5)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:328` |
| `informationQuality` | `number` | No | mínimo 1; máximo 5 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(5)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:338` |
| `clarity` | `number` | No | mínimo 1; máximo 5 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(5)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:348` |
| `relevance` | `number` | No | mínimo 1; máximo 5 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(5)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:358` |
| `professionalConduct` | `number` | No | mínimo 1; máximo 5 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(5)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:368` |
| `materialUsefulness` | `number` | No | mínimo 1; máximo 5 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(5)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:378` |
| `overallSatisfaction` | `number` | No | mínimo 1; máximo 5 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(5)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:388` |
| `comment` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:397` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "kindConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Registro de visita no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe una calificación de esa naturaleza para la visita |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se califica una visita completada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 57. GET /visit-records/inbox

- **Origen:** CONTRATO
- **Nombre:** Listar las visitas recibidas
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRecordsController.listInbox` — `src/modules/pharma_lab/controllers/visit-records.controller.ts:64`

### Qué es y para qué sirve (negocio)

Listar las visitas recibidas.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /visit-records/inbox` la atiende `VisitRecordsController.listInbox` (src/modules/pharma_lab/controllers/visit-records.controller.ts:64). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `VisitRecordsService.listDoctorRecords`. Lee pharma_lab.visit_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-records.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.visit_records` | LEE | LEE | DIRECTA | VisitRecordsController.listInbox → VisitRecordsService.listDoctorRecords → VisitsRepository.listRecordsByDoctor | `src/modules/pharma_lab/repositories/visits.repository.ts:281` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VisitRecords[]>` · DTO `VisitRecords`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/visit_records.entity.ts:18` |
| `visitRequestId` | `string` | Sí | — | `@Property({ fieldName: 'visit_request_id', type: 'uuid', unique: true })` | Solicitud de la que nace el registro. | `src/modules/pharma_lab/entities/visit_records.entity.ts:24` |
| `doctorUserId` | `string` | Sí | — | `@Property({ fieldName: 'doctor_user_id', type: 'uuid' })` | Doctor visitado. | `src/modules/pharma_lab/entities/visit_records.entity.ts:30` |
| `medicalVisitorId` | `string` | Sí | — | `@Property({ fieldName: 'medical_visitor_id', type: 'uuid' })` | Visitador. | `src/modules/pharma_lab/entities/visit_records.entity.ts:36` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio representado. | `src/modules/pharma_lab/entities/visit_records.entity.ts:42` |
| `occurredAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })` | Momento en que se realizó. | `src/modules/pharma_lab/entities/visit_records.entity.ts:48` |
| `location` | `string` | No | — | `@Property({ columnType: 'varchar', nullable: true })` | Lugar. | `src/modules/pharma_lab/entities/visit_records.entity.ts:54` |
| `modalityConceptId` | `string` | Sí | — | `@Property({ fieldName: 'modality_concept_id', type: 'uuid' })` | Modalidad efectiva. | `src/modules/pharma_lab/entities/visit_records.entity.ts:60` |
| `topicsDiscussed` | `string` | No | — | `@Property({ fieldName: 'topics_discussed', columnType: 'text', nullable: true, })` | Temas tratados. | `src/modules/pharma_lab/entities/visit_records.entity.ts:70` |
| `questions` | `string` | No | — | `@Property({ columnType: 'text', nullable: true })` | Preguntas realizadas por el doctor. | `src/modules/pharma_lab/entities/visit_records.entity.ts:76` |
| `commitments` | `string` | No | — | `@Property({ columnType: 'text', nullable: true })` | Compromisos asumidos. | `src/modules/pharma_lab/entities/visit_records.entity.ts:82` |
| `nextAction` | `string` | No | — | `@Property({ fieldName: 'next_action', columnType: 'text', nullable: true })` | Próxima acción acordada. | `src/modules/pharma_lab/entities/visit_records.entity.ts:88` |
| `observations` | `string` | No | — | `@Property({ columnType: 'text', nullable: true })` | Observaciones. | `src/modules/pharma_lab/entities/visit_records.entity.ts:94` |
| `visitorAttendanceConceptId` | `string` | Sí | — | `@Property({ fieldName: 'visitor_attendance_concept_id', type: 'uuid' })` | Asistencia del visitador. | `src/modules/pharma_lab/entities/visit_records.entity.ts:100` |
| `doctorAttendanceConceptId` | `string` | Sí | — | `@Property({ fieldName: 'doctor_attendance_concept_id', type: 'uuid' })` | Asistencia del doctor. | `src/modules/pharma_lab/entities/visit_records.entity.ts:106` |
| `confirmationConceptId` | `string` | Sí | — | `@Property({ fieldName: 'confirmation_concept_id', type: 'uuid' })` | Estado de confirmación por parte del doctor (spec 5502). | `src/modules/pharma_lab/entities/visit_records.entity.ts:112` |
| `confirmedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'confirmed_at', columnType: 'timestamptz', nullable: true, })` | Momento de la confirmación del doctor. | `src/modules/pharma_lab/entities/visit_records.entity.ts:122` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/visit_records.entity.ts:128` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/visit_records.entity.ts:134` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/visit_records.entity.ts:140` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/visit_records.entity.ts:146` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/visit_records.entity.ts:152` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 58. GET /visit-records/labs/{pharmaLabId}

- **Origen:** CONTRATO
- **Nombre:** Historial de visitas del laboratorio
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRecordsController.listLabRecords` — `src/modules/pharma_lab/controllers/visit-records.controller.ts:107`

### Qué es y para qué sirve (negocio)

Historial de visitas del laboratorio.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /visit-records/labs/{pharmaLabId}` la atiende `VisitRecordsController.listLabRecords` (src/modules/pharma_lab/controllers/visit-records.controller.ts:107). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Delega en `VisitRecordsService.listLabRecords`. Lee pharma_lab.pharma_labs, pharma_lab.visit_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/visit-records.controller.ts:107` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/visit-records.controller.ts:107` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | VisitRecordsController.listLabRecords → VisitRecordsService.listLabRecords → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.visit_records` | LEE | LEE | DIRECTA | VisitRecordsController.listLabRecords → VisitRecordsService.listLabRecords → VisitsRepository.listRecordsByLab | `src/modules/pharma_lab/repositories/visits.repository.ts:263` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VisitRecords[]>` · DTO `VisitRecords`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/visit_records.entity.ts:18` |
| `visitRequestId` | `string` | Sí | — | `@Property({ fieldName: 'visit_request_id', type: 'uuid', unique: true })` | Solicitud de la que nace el registro. | `src/modules/pharma_lab/entities/visit_records.entity.ts:24` |
| `doctorUserId` | `string` | Sí | — | `@Property({ fieldName: 'doctor_user_id', type: 'uuid' })` | Doctor visitado. | `src/modules/pharma_lab/entities/visit_records.entity.ts:30` |
| `medicalVisitorId` | `string` | Sí | — | `@Property({ fieldName: 'medical_visitor_id', type: 'uuid' })` | Visitador. | `src/modules/pharma_lab/entities/visit_records.entity.ts:36` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio representado. | `src/modules/pharma_lab/entities/visit_records.entity.ts:42` |
| `occurredAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })` | Momento en que se realizó. | `src/modules/pharma_lab/entities/visit_records.entity.ts:48` |
| `location` | `string` | No | — | `@Property({ columnType: 'varchar', nullable: true })` | Lugar. | `src/modules/pharma_lab/entities/visit_records.entity.ts:54` |
| `modalityConceptId` | `string` | Sí | — | `@Property({ fieldName: 'modality_concept_id', type: 'uuid' })` | Modalidad efectiva. | `src/modules/pharma_lab/entities/visit_records.entity.ts:60` |
| `topicsDiscussed` | `string` | No | — | `@Property({ fieldName: 'topics_discussed', columnType: 'text', nullable: true, })` | Temas tratados. | `src/modules/pharma_lab/entities/visit_records.entity.ts:70` |
| `questions` | `string` | No | — | `@Property({ columnType: 'text', nullable: true })` | Preguntas realizadas por el doctor. | `src/modules/pharma_lab/entities/visit_records.entity.ts:76` |
| `commitments` | `string` | No | — | `@Property({ columnType: 'text', nullable: true })` | Compromisos asumidos. | `src/modules/pharma_lab/entities/visit_records.entity.ts:82` |
| `nextAction` | `string` | No | — | `@Property({ fieldName: 'next_action', columnType: 'text', nullable: true })` | Próxima acción acordada. | `src/modules/pharma_lab/entities/visit_records.entity.ts:88` |
| `observations` | `string` | No | — | `@Property({ columnType: 'text', nullable: true })` | Observaciones. | `src/modules/pharma_lab/entities/visit_records.entity.ts:94` |
| `visitorAttendanceConceptId` | `string` | Sí | — | `@Property({ fieldName: 'visitor_attendance_concept_id', type: 'uuid' })` | Asistencia del visitador. | `src/modules/pharma_lab/entities/visit_records.entity.ts:100` |
| `doctorAttendanceConceptId` | `string` | Sí | — | `@Property({ fieldName: 'doctor_attendance_concept_id', type: 'uuid' })` | Asistencia del doctor. | `src/modules/pharma_lab/entities/visit_records.entity.ts:106` |
| `confirmationConceptId` | `string` | Sí | — | `@Property({ fieldName: 'confirmation_concept_id', type: 'uuid' })` | Estado de confirmación por parte del doctor (spec 5502). | `src/modules/pharma_lab/entities/visit_records.entity.ts:112` |
| `confirmedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'confirmed_at', columnType: 'timestamptz', nullable: true, })` | Momento de la confirmación del doctor. | `src/modules/pharma_lab/entities/visit_records.entity.ts:122` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/visit_records.entity.ts:128` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/visit_records.entity.ts:134` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/visit_records.entity.ts:140` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/visit_records.entity.ts:146` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/visit_records.entity.ts:152` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 59. GET /visit-records/labs/{pharmaLabId}/rating-summary

- **Origen:** CONTRATO
- **Nombre:** Resultados agregados de las calificaciones del laboratorio
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRecordsController.ratingSummary` — `src/modules/pharma_lab/controllers/visit-records.controller.ts:117`

### Qué es y para qué sirve (negocio)

Resultados agregados de las calificaciones del laboratorio.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /visit-records/labs/{pharmaLabId}/rating-summary` la atiende `VisitRecordsController.ratingSummary` (src/modules/pharma_lab/controllers/visit-records.controller.ts:117). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN. Delega en `VisitRecordsService.getRatingAggregate`. Lee pharma_lab.pharma_labs, pharma_lab.visit_ratings, pharma_lab.visit_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/visit-records.controller.ts:117` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/visit-records.controller.ts:117` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | VisitRecordsController.ratingSummary → VisitRecordsService.getRatingAggregate → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.visit_ratings` | LEE | LEE | DIRECTA | VisitRecordsController.ratingSummary → VisitRecordsService.getRatingAggregate → VisitsRepository.listInternalRatings | `src/modules/pharma_lab/repositories/visits.repository.ts:368` |
| `pharma_lab.visit_records` | LEE | LEE | DIRECTA | VisitRecordsController.ratingSummary → VisitRecordsService.getRatingAggregate → VisitsRepository.listRecordsByLab | `src/modules/pharma_lab/repositories/visits.repository.ts:263` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RatingAggregate>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 60. POST /visit-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitar una visita médica a un doctor
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRequestsController.create` — `src/modules/pharma_lab/controllers/visit-requests.controller.ts:50`

### Qué es y para qué sirve (negocio)

Solicitar una visita médica a un doctor.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-requests` la atiende `VisitRequestsController.create` (src/modules/pharma_lab/controllers/visit-requests.controller.ts:50). Exige sesión con alguno de los roles MEDICAL_VISITOR. Valida el cuerpo como `CreateVisitRequestDto` (11 campos, 6 obligatorios). Delega en `VisitRequestsService.createRequest`. Crea filas en audit.audit_log, pharma_lab.pharma_lab_notices, pharma_lab.visit_request_events, pharma_lab.visit_request_topics, pharma_lab.visit_requests. Lee audit.audit_log, iam.sessions, pharma_lab.doctor_visit_blocks, pharma_lab.doctor_visit_policies, pharma_lab.doctor_visit_windows, pharma_lab.medical_visitor_products, pharma_lab.medical_visitor_specialties, pharma_lab.medical_visitors y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MEDICAL_VISITOR | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitRequestsController.create → VisitRequestsService.createRequest → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.doctor_visit_blocks` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitAgendaService.assertVisitorAccepted → AgendaRepository.findApplicableBlock | `src/modules/pharma_lab/repositories/agenda.repository.ts:154` |
| `pharma_lab.doctor_visit_policies` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitAgendaService.assertVisitorAccepted → AgendaRepository.findPolicy | `src/modules/pharma_lab/repositories/agenda.repository.ts:25` |
| `pharma_lab.doctor_visit_windows` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitAgendaService.assertSlotAvailable → AgendaRepository.listWindows | `src/modules/pharma_lab/repositories/agenda.repository.ts:57` |
| `pharma_lab.medical_visitor_products` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitRequestsService.assertTopicsAuthorized → VisitorsRepository.listAuthorizedProducts | `src/modules/pharma_lab/repositories/visitors.repository.ts:185` |
| `pharma_lab.medical_visitor_specialties` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitorsRepository.listSpecialties | `src/modules/pharma_lab/repositories/visitors.repository.ts:139` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → PharmaLabAccessService.requireOperatingVisitor → VisitorsRepository.findVisitorByUser | `src/modules/pharma_lab/repositories/visitors.repository.ts:44` |
| `pharma_lab.pharma_lab_notices` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → PharmaLabNotificationsService.notify | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:58` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → PharmaLabAccessService.requireOperatingVisitor → PharmaLabAccessService.requireVisitorOperable → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.pharma_products` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitRequestsService.assertTopicsAuthorized → CatalogRepository.findProductsByIds | `src/modules/pharma_lab/repositories/catalog.repository.ts:37` |
| `pharma_lab.visit_request_events` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitsRepository.appendRequestEvent | `src/modules/pharma_lab/repositories/visits.repository.ts:187` |
| `pharma_lab.visit_request_topics` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitsRepository.createTopic | `src/modules/pharma_lab/repositories/visits.repository.ts:150` |
| `pharma_lab.visit_requests` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitsRepository.createRequest | `src/modules/pharma_lab/repositories/visits.repository.ts:47` |
| `pharma_lab.visit_requests` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitAgendaService.assertSlotAvailable → VisitsRepository.listOccupyingRequests | `src/modules/pharma_lab/repositories/visits.repository.ts:115` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:123` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts → DoctorCalendarRepository.findPractitionerProfileId | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:60` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts → DoctorCalendarRepository.findPractitionerProfileId | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:53` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts → DoctorCalendarRepository.findPractitionerProfileId | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:58` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:108` |
| `scheduling.calendar_absences` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:84` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | VisitRequestsController.create → VisitRequestsService.createRequest → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:103` |

### Cuerpo — DTO `CreateVisitRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `doctorUserId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:46` |
| `doctorTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:54` |
| `reason` | `string` | Sí | longitud máxima 1000 | `@IsString()` `@MaxLength(1000)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:62` |
| `requestedStartAt` | `string` | Sí | formato date-time | `@IsDateString()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:69` |
| `durationMinutes` | `number` | Sí | mínimo 5; máximo 240 | `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:78` |
| `modalityConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:85` |
| `location` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:94` |
| `observations` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:103` |
| `topics` | `array<VisitTopicDto>` | Sí | máximo 20 elemento(s) | `@IsArray()` `@ArrayNotEmpty()` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => VisitTopicDto)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:114` |
| `topics[].pharmaProductId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:27` |
| `topics[].topic` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:36` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La cuenta no corresponde a un visitador médico |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El visitador no tiene una vinculación activa con un laboratorio; PreconditionFailedException: El laboratorio del visitador no está activo; PreconditionFailedException: El doctor bloqueó las visitas de este laboratorio o visitador; PreconditionFailedException: El doctor solo recibe visitadores de determinadas especialidades; PreconditionFailedException: El visitador no está autorizado a representar alguno de los productos del temario; PreconditionFailedException: Alguno de los productos del temario está suspendido o retirado; PreconditionFailedException: El doctor no recibe visitas de laboratorio; PreconditionFailedException: La visita debe solicitarse con al menos {policy.minNoticeHours} horas de antelación; PreconditionFailedException: La duración máxima admitida es de {policy.maxDurationMinutes} minutos; PreconditionFailedException: El horario solicitado queda fuera de las ventanas de visita del doctor; PreconditionFailedException: La modalidad solicitada no coincide con la de la ventana de visita; PreconditionFailedException: El doctor ya alcanzó el máximo de visitas para ese día; PreconditionFailedException: El horario se superpone con otra visita ya registrada; PreconditionFailedException: La ventana de visita ya está completa; PreconditionFailedException: El horario se superpone con la agenda clínica del doctor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 61. GET /visit-requests/{visitRequestId}

- **Origen:** CONTRATO
- **Nombre:** Consultar una solicitud con su bitácora
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRequestsController.getOne` — `src/modules/pharma_lab/controllers/visit-requests.controller.ts:83`

### Qué es y para qué sirve (negocio)

Consultar una solicitud con su bitácora.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /visit-requests/{visitRequestId}` la atiende `VisitRequestsController.getOne` (src/modules/pharma_lab/controllers/visit-requests.controller.ts:83). Exige sesión con alguno de los roles MEDICAL_VISITOR, PRACTITIONER, CLINICIAN. Delega en `VisitRequestsService.getRequestDetail`. Lee pharma_lab.medical_visitors, pharma_lab.visit_request_events, pharma_lab.visit_request_topics, pharma_lab.visit_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MEDICAL_VISITOR, PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: visitRequestId | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:83` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | VisitRequestsController.getOne → VisitRequestsService.getRequestDetail → VisitorsRepository.findVisitorByUser | `src/modules/pharma_lab/repositories/visitors.repository.ts:44` |
| `pharma_lab.visit_request_events` | LEE | LEE | DIRECTA | VisitRequestsController.getOne → VisitRequestsService.getRequestDetail → VisitsRepository.listRequestEvents | `src/modules/pharma_lab/repositories/visits.repository.ts:205` |
| `pharma_lab.visit_request_topics` | LEE | LEE | DIRECTA | VisitRequestsController.getOne → VisitRequestsService.getRequestDetail → VisitsRepository.listTopics | `src/modules/pharma_lab/repositories/visits.repository.ts:172` |
| `pharma_lab.visit_requests` | LEE | LEE | DIRECTA | VisitRequestsController.getOne → VisitRequestsService.getRequestDetail → VisitsRepository.findRequest | `src/modules/pharma_lab/repositories/visits.repository.ts:33` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `visitRequestId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<{ /** La solicitud. */ request: VisitRequests; /** Productos o temas declarados. */ topics: VisitRequestTopics[]; /** Bitácora de transiciones. */ events: VisitRequestEvents[]; }>` · DTO `VisitRequests`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:20` |
| `medicalVisitorId` | `string` | Sí | — | `@Property({ fieldName: 'medical_visitor_id', type: 'uuid' })` | Visitador solicitante. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:26` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio al que representa en esta visita. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:32` |
| `doctorUserId` | `string` | Sí | — | `@Property({ fieldName: 'doctor_user_id', type: 'uuid' })` | Doctor visitado. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:38` |
| `doctorTenantId` | `string` | No | — | `@Property({ fieldName: 'doctor_tenant_id', type: 'uuid', nullable: true })` | Organización del doctor bajo la que se atiende la visita. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:44` |
| `reason` | `string` | Sí | — | `@Property({ columnType: 'text' })` | Motivo de la visita. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:50` |
| `requestedStartAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'requested_start_at', columnType: 'timestamptz' })` | Inicio solicitado, en UTC. La zona horaria aplicada se guarda aparte para poder reconstruir lo que vio quien solicitó. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:57` |
| `durationMinutes` | `number` | Sí | — | `@Property({ fieldName: 'duration_minutes', columnType: 'int' })` | Duración solicitada, en minutos. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:63` |
| `timeZone` | `string` | Sí | — | `@Property({ fieldName: 'time_zone', columnType: 'varchar' })` | Zona horaria aplicada (la del doctor o la de su organización, spec 5379). | `src/modules/pharma_lab/entities/visit_requests.entity.ts:69` |
| `modalityConceptId` | `string` | Sí | — | `@Property({ fieldName: 'modality_concept_id', type: 'uuid' })` | Modalidad solicitada. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:75` |
| `location` | `string` | No | — | `@Property({ columnType: 'varchar', nullable: true })` | Ubicación o enlace acordado. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:81` |
| `attachments` | `object` | No | — | `@Property({ type: 'json', columnType: 'jsonb', nullable: true })` | Documentación adjunta a la solicitud (referencias del almacén documental). | `src/modules/pharma_lab/entities/visit_requests.entity.ts:87` |
| `observations` | `string` | No | — | `@Property({ columnType: 'text', nullable: true })` | Observaciones del visitador. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:93` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado de la visita, dentro de la lista cerrada de spec 5382-5394. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:99` |
| `proposedStartAt` | `string` | No | formato date-time | `@Property({ fieldName: 'proposed_start_at', columnType: 'timestamptz', nullable: true, })` | Horario propuesto por el doctor como alternativa (spec 5373). | `src/modules/pharma_lab/entities/visit_requests.entity.ts:109` |
| `confirmedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'confirmed_at', columnType: 'timestamptz', nullable: true, })` | Momento de la confirmación. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:119` |
| `closedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'closed_at', columnType: 'timestamptz', nullable: true, })` | Momento de la cancelación o el rechazo. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:129` |
| `rescheduledFromId` | `string` | No | — | `@Property({ fieldName: 'rescheduled_from_id', type: 'uuid', nullable: true, })` | Solicitud de la que ésta es reprogramación, si la hay. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:139` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:145` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:151` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:157` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:163` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:169` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 62. POST /visit-requests/{visitRequestId}/accept

- **Origen:** CONTRATO
- **Nombre:** Aceptar la visita
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRequestsController.accept` — `src/modules/pharma_lab/controllers/visit-requests.controller.ts:101`

### Qué es y para qué sirve (negocio)

Aceptar la visita.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-requests/{visitRequestId}/accept` la atiende `VisitRequestsController.accept` (src/modules/pharma_lab/controllers/visit-requests.controller.ts:101). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `VisitDecisionDto` (1 campo, 0 obligatorios). Delega en `VisitRequestsService.accept`. Crea filas en audit.audit_log, pharma_lab.pharma_lab_notices, pharma_lab.visit_request_events. Actualiza pharma_lab.visit_requests. Lee audit.audit_log, iam.sessions, pharma_lab.medical_visitors, pharma_lab.visit_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:101` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: visitRequestId | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:101` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.accept → VisitRequestsService.accept → VisitRequestsService.transitionByDoctor → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitRequestsController.accept → VisitRequestsService.accept → VisitRequestsService.transitionByDoctor → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitRequestsController.accept → VisitRequestsService.accept → VisitRequestsService.transitionByDoctor → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | VisitRequestsController.accept → VisitRequestsService.accept → VisitRequestsService.transitionByDoctor → VisitRequestsService.notifyVisitor → VisitorsRepository.findVisitor | `src/modules/pharma_lab/repositories/visitors.repository.ts:30` |
| `pharma_lab.pharma_lab_notices` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.accept → VisitRequestsService.accept → VisitRequestsService.transitionByDoctor → VisitRequestsService.notifyVisitor → PharmaLabNotificationsService.notify | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:58` |
| `pharma_lab.visit_request_events` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.accept → VisitRequestsService.accept → VisitRequestsService.transitionByDoctor → VisitsRepository.appendRequestEvent | `src/modules/pharma_lab/repositories/visits.repository.ts:187` |
| `pharma_lab.visit_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | VisitRequestsController.accept → VisitRequestsService.accept → VisitRequestsService.transitionByDoctor | `src/modules/pharma_lab/services/visit-requests.service.ts:687` |
| `pharma_lab.visit_requests` | LEE | LEE | DIRECTA | VisitRequestsController.accept → VisitRequestsService.accept → VisitRequestsService.transitionByDoctor → VisitRequestsService.requireDoctorRequest → VisitsRepository.findRequest | `src/modules/pharma_lab/repositories/visits.repository.ts:33` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `visitRequestId` | path | Sí | `string` | — |

### Cuerpo — DTO `VisitDecisionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `note` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:126` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
| 409 | `CONFLICT` | ConflictException: La solicitud está en un estado final y ya no admite cambios; ConflictException: La transición solicitada no está permitida para el estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 63. POST /visit-requests/{visitRequestId}/cancel

- **Origen:** CONTRATO
- **Nombre:** Cancelar la visita
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRequestsController.cancel` — `src/modules/pharma_lab/controllers/visit-requests.controller.ts:186`

### Qué es y para qué sirve (negocio)

Cancelar la visita.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-requests/{visitRequestId}/cancel` la atiende `VisitRequestsController.cancel` (src/modules/pharma_lab/controllers/visit-requests.controller.ts:186). Exige sesión con alguno de los roles MEDICAL_VISITOR, PRACTITIONER, CLINICIAN. Valida el cuerpo como `CancelVisitDto` (1 campo, 1 obligatorio). Delega en `VisitRequestsService.cancel`. Crea filas en audit.audit_log, pharma_lab.pharma_lab_notices, pharma_lab.visit_request_events. Actualiza pharma_lab.visit_requests. Lee audit.audit_log, iam.sessions, pharma_lab.doctor_visit_policies, pharma_lab.doctor_visit_windows, pharma_lab.medical_visitors, pharma_lab.visit_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MEDICAL_VISITOR, PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:186` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: visitRequestId | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:186` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.cancel → VisitRequestsService.cancel → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitRequestsController.cancel → VisitRequestsService.cancel → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitRequestsController.cancel → VisitRequestsService.cancel → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.doctor_visit_policies` | LEE | LEE | DIRECTA | VisitRequestsController.cancel → VisitRequestsService.cancel → VisitAgendaService.getPublishedAgenda → AgendaRepository.findPolicy | `src/modules/pharma_lab/repositories/agenda.repository.ts:25` |
| `pharma_lab.doctor_visit_windows` | LEE | LEE | DIRECTA | VisitRequestsController.cancel → VisitRequestsService.cancel → VisitAgendaService.getPublishedAgenda → AgendaRepository.listWindows | `src/modules/pharma_lab/repositories/agenda.repository.ts:57` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | VisitRequestsController.cancel → VisitRequestsService.cancel → VisitorsRepository.findVisitorByUser | `src/modules/pharma_lab/repositories/visitors.repository.ts:44` |
| `pharma_lab.pharma_lab_notices` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.cancel → VisitRequestsService.cancel → PharmaLabNotificationsService.notify | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:58` |
| `pharma_lab.visit_request_events` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.cancel → VisitRequestsService.cancel → VisitsRepository.appendRequestEvent | `src/modules/pharma_lab/repositories/visits.repository.ts:187` |
| `pharma_lab.visit_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | VisitRequestsController.cancel → VisitRequestsService.cancel | `src/modules/pharma_lab/services/visit-requests.service.ts:540` |
| `pharma_lab.visit_requests` | LEE | LEE | DIRECTA | VisitRequestsController.cancel → VisitRequestsService.cancel → VisitsRepository.findRequest | `src/modules/pharma_lab/repositories/visits.repository.ts:33` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `visitRequestId` | path | Sí | `string` | — |

### Cuerpo — DTO `CancelVisitDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:174` |

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

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada; ResourceNotFoundException: El doctor no tiene agenda de visitas habilitada |
| 409 | `CONFLICT` | ConflictException: La solicitud está en un estado final y ya no admite cambios; ConflictException: La transición solicitada no está permitida para el estado actual |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El plazo para reprogramar o cancelar venció ({cutoffHours} horas antes del inicio) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 64. POST /visit-requests/{visitRequestId}/propose-time

- **Origen:** CONTRATO
- **Nombre:** Proponer otro horario
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRequestsController.proposeTime` — `src/modules/pharma_lab/controllers/visit-requests.controller.ts:152`

### Qué es y para qué sirve (negocio)

Proponer otro horario.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-requests/{visitRequestId}/propose-time` la atiende `VisitRequestsController.proposeTime` (src/modules/pharma_lab/controllers/visit-requests.controller.ts:152). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `ProposeVisitTimeDto` (2 campos, 1 obligatorio). Delega en `VisitRequestsService.proposeTime`. Crea filas en audit.audit_log, pharma_lab.pharma_lab_notices, pharma_lab.visit_request_events. Actualiza pharma_lab.visit_requests. Lee audit.audit_log, iam.sessions, pharma_lab.doctor_visit_policies, pharma_lab.doctor_visit_windows, pharma_lab.medical_visitors, pharma_lab.visit_requests, procedures_perioperative.procedure_cases, profiles.health_practitioner_profiles y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:152` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: visitRequestId | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:152` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.doctor_visit_policies` | LEE | LEE | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → VisitAgendaService.assertSlotAvailable → AgendaRepository.findPolicy | `src/modules/pharma_lab/repositories/agenda.repository.ts:25` |
| `pharma_lab.doctor_visit_windows` | LEE | LEE | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → VisitAgendaService.assertSlotAvailable → AgendaRepository.listWindows | `src/modules/pharma_lab/repositories/agenda.repository.ts:57` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → VisitRequestsService.notifyVisitor → VisitorsRepository.findVisitor | `src/modules/pharma_lab/repositories/visitors.repository.ts:30` |
| `pharma_lab.pharma_lab_notices` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → VisitRequestsService.notifyVisitor → PharmaLabNotificationsService.notify | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:58` |
| `pharma_lab.visit_request_events` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → VisitsRepository.appendRequestEvent | `src/modules/pharma_lab/repositories/visits.repository.ts:187` |
| `pharma_lab.visit_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime | `src/modules/pharma_lab/services/visit-requests.service.ts:377` |
| `pharma_lab.visit_requests` | LEE | LEE | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → VisitRequestsService.requireDoctorRequest → VisitsRepository.findRequest | `src/modules/pharma_lab/repositories/visits.repository.ts:33` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:123` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts → DoctorCalendarRepository.findPractitionerProfileId | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:60` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts → DoctorCalendarRepository.findPractitionerProfileId | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:53` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts → DoctorCalendarRepository.findPractitionerProfileId | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:58` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:108` |
| `scheduling.calendar_absences` | LEE | LEE | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:84` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | VisitRequestsController.proposeTime → VisitRequestsService.proposeTime → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:103` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `visitRequestId` | path | Sí | `string` | — |

### Cuerpo — DTO `ProposeVisitTimeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `proposedStartAt` | `string` | Sí | formato date-time | `@IsDateString()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:136` |
| `note` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:145` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "proposedStartAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "proposedStartAt": "2026-07-31T12:00:00.000Z",
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
| 409 | `CONFLICT` | ConflictException: La solicitud está en un estado final y ya no admite cambios; ConflictException: La transición solicitada no está permitida para el estado actual |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El doctor no recibe visitas de laboratorio; PreconditionFailedException: La visita debe solicitarse con al menos {policy.minNoticeHours} horas de antelación; PreconditionFailedException: La duración máxima admitida es de {policy.maxDurationMinutes} minutos; PreconditionFailedException: El horario solicitado queda fuera de las ventanas de visita del doctor; PreconditionFailedException: La modalidad solicitada no coincide con la de la ventana de visita; PreconditionFailedException: El doctor ya alcanzó el máximo de visitas para ese día; PreconditionFailedException: El horario se superpone con otra visita ya registrada; PreconditionFailedException: La ventana de visita ya está completa; PreconditionFailedException: El horario se superpone con la agenda clínica del doctor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 65. POST /visit-requests/{visitRequestId}/reject

- **Origen:** CONTRATO
- **Nombre:** Rechazar la visita
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRequestsController.reject` — `src/modules/pharma_lab/controllers/visit-requests.controller.ts:118`

### Qué es y para qué sirve (negocio)

Rechazar la visita.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-requests/{visitRequestId}/reject` la atiende `VisitRequestsController.reject` (src/modules/pharma_lab/controllers/visit-requests.controller.ts:118). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `VisitDecisionDto` (1 campo, 0 obligatorios). Delega en `VisitRequestsService.reject`. Crea filas en audit.audit_log, pharma_lab.pharma_lab_notices, pharma_lab.visit_request_events. Actualiza pharma_lab.visit_requests. Lee audit.audit_log, iam.sessions, pharma_lab.medical_visitors, pharma_lab.visit_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:118` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: visitRequestId | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:118` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.reject → VisitRequestsService.reject → VisitRequestsService.transitionByDoctor → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitRequestsController.reject → VisitRequestsService.reject → VisitRequestsService.transitionByDoctor → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitRequestsController.reject → VisitRequestsService.reject → VisitRequestsService.transitionByDoctor → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | VisitRequestsController.reject → VisitRequestsService.reject → VisitRequestsService.transitionByDoctor → VisitRequestsService.notifyVisitor → VisitorsRepository.findVisitor | `src/modules/pharma_lab/repositories/visitors.repository.ts:30` |
| `pharma_lab.pharma_lab_notices` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.reject → VisitRequestsService.reject → VisitRequestsService.transitionByDoctor → VisitRequestsService.notifyVisitor → PharmaLabNotificationsService.notify | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:58` |
| `pharma_lab.visit_request_events` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.reject → VisitRequestsService.reject → VisitRequestsService.transitionByDoctor → VisitsRepository.appendRequestEvent | `src/modules/pharma_lab/repositories/visits.repository.ts:187` |
| `pharma_lab.visit_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | VisitRequestsController.reject → VisitRequestsService.reject → VisitRequestsService.transitionByDoctor | `src/modules/pharma_lab/services/visit-requests.service.ts:687` |
| `pharma_lab.visit_requests` | LEE | LEE | DIRECTA | VisitRequestsController.reject → VisitRequestsService.reject → VisitRequestsService.transitionByDoctor → VisitRequestsService.requireDoctorRequest → VisitsRepository.findRequest | `src/modules/pharma_lab/repositories/visits.repository.ts:33` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `visitRequestId` | path | Sí | `string` | — |

### Cuerpo — DTO `VisitDecisionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `note` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:126` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
| 409 | `CONFLICT` | ConflictException: La solicitud está en un estado final y ya no admite cambios; ConflictException: La transición solicitada no está permitida para el estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 66. POST /visit-requests/{visitRequestId}/request-info

- **Origen:** CONTRATO
- **Nombre:** Solicitar información adicional al visitador
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRequestsController.requestInfo` — `src/modules/pharma_lab/controllers/visit-requests.controller.ts:135`

### Qué es y para qué sirve (negocio)

Solicitar información adicional al visitador.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-requests/{visitRequestId}/request-info` la atiende `VisitRequestsController.requestInfo` (src/modules/pharma_lab/controllers/visit-requests.controller.ts:135). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `VisitDecisionDto` (1 campo, 0 obligatorios). Delega en `VisitRequestsService.requestInfo`. Crea filas en audit.audit_log, pharma_lab.pharma_lab_notices, pharma_lab.visit_request_events. Lee audit.audit_log, iam.sessions, pharma_lab.medical_visitors, pharma_lab.visit_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:135` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: visitRequestId | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:135` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.requestInfo → VisitRequestsService.requestInfo → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitRequestsController.requestInfo → VisitRequestsService.requestInfo → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitRequestsController.requestInfo → VisitRequestsService.requestInfo → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | VisitRequestsController.requestInfo → VisitRequestsService.requestInfo → VisitRequestsService.notifyVisitor → VisitorsRepository.findVisitor | `src/modules/pharma_lab/repositories/visitors.repository.ts:30` |
| `pharma_lab.pharma_lab_notices` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.requestInfo → VisitRequestsService.requestInfo → VisitRequestsService.notifyVisitor → PharmaLabNotificationsService.notify | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:58` |
| `pharma_lab.visit_request_events` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.requestInfo → VisitRequestsService.requestInfo → VisitsRepository.appendRequestEvent | `src/modules/pharma_lab/repositories/visits.repository.ts:187` |
| `pharma_lab.visit_requests` | LEE | LEE | DIRECTA | VisitRequestsController.requestInfo → VisitRequestsService.requestInfo → VisitRequestsService.requireDoctorRequest → VisitsRepository.findRequest | `src/modules/pharma_lab/repositories/visits.repository.ts:33` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `visitRequestId` | path | Sí | `string` | — |

### Cuerpo — DTO `VisitDecisionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `note` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:126` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
| 409 | `CONFLICT` | ConflictException: La solicitud está en un estado final y ya no admite cambios |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 67. POST /visit-requests/{visitRequestId}/reschedule

- **Origen:** CONTRATO
- **Nombre:** Reprogramar la visita dentro del plazo permitido
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRequestsController.reschedule` — `src/modules/pharma_lab/controllers/visit-requests.controller.ts:169`

### Qué es y para qué sirve (negocio)

Reprogramar la visita dentro del plazo permitido.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-requests/{visitRequestId}/reschedule` la atiende `VisitRequestsController.reschedule` (src/modules/pharma_lab/controllers/visit-requests.controller.ts:169). Exige sesión con alguno de los roles MEDICAL_VISITOR. Valida el cuerpo como `RescheduleVisitDto` (2 campos, 2 obligatorios). Delega en `VisitRequestsService.reschedule`. Crea filas en audit.audit_log, pharma_lab.pharma_lab_notices, pharma_lab.visit_request_events. Actualiza pharma_lab.visit_requests. Lee audit.audit_log, iam.sessions, pharma_lab.doctor_visit_policies, pharma_lab.doctor_visit_windows, pharma_lab.medical_visitors, pharma_lab.pharma_labs, pharma_lab.visit_requests, procedures_perioperative.procedure_cases y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MEDICAL_VISITOR | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:169` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: visitRequestId | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:169` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitRequestsController.reschedule → VisitRequestsService.reschedule → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.doctor_visit_policies` | LEE | LEE | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → VisitAgendaService.assertSlotAvailable → AgendaRepository.findPolicy | `src/modules/pharma_lab/repositories/agenda.repository.ts:25` |
| `pharma_lab.doctor_visit_windows` | LEE | LEE | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → VisitAgendaService.assertSlotAvailable → AgendaRepository.listWindows | `src/modules/pharma_lab/repositories/agenda.repository.ts:57` |
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → PharmaLabAccessService.requireOperatingVisitor → VisitorsRepository.findVisitorByUser | `src/modules/pharma_lab/repositories/visitors.repository.ts:44` |
| `pharma_lab.pharma_lab_notices` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → PharmaLabNotificationsService.notify | `src/modules/pharma_lab/services/pharma-lab-notifications.service.ts:58` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → PharmaLabAccessService.requireOperatingVisitor → PharmaLabAccessService.requireVisitorOperable → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.visit_request_events` | ESCRIBE | CREA | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → VisitsRepository.appendRequestEvent | `src/modules/pharma_lab/repositories/visits.repository.ts:187` |
| `pharma_lab.visit_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | VisitRequestsController.reschedule → VisitRequestsService.reschedule | `src/modules/pharma_lab/services/visit-requests.service.ts:449` |
| `pharma_lab.visit_requests` | LEE | LEE | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → VisitRequestsService.requireVisitorRequest → VisitsRepository.findRequest | `src/modules/pharma_lab/repositories/visits.repository.ts:33` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:123` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts → DoctorCalendarRepository.findPractitionerProfileId | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:60` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts → DoctorCalendarRepository.findPractitionerProfileId | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:53` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts → DoctorCalendarRepository.findPractitionerProfileId | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:58` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:108` |
| `scheduling.calendar_absences` | LEE | LEE | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:84` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | VisitRequestsController.reschedule → VisitRequestsService.reschedule → VisitAgendaService.assertSlotAvailable → DoctorCalendarRepository.findConflicts | `src/modules/pharma_lab/repositories/doctor-calendar.repository.ts:103` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `visitRequestId` | path | Sí | `string` | — |

### Cuerpo — DTO `RescheduleVisitDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requestedStartAt` | `string` | Sí | formato date-time | `@IsDateString()` | — | `src/modules/pharma_lab/dto/visits.dto.ts:155` |
| `reason` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | — | `src/modules/pharma_lab/dto/visits.dto.ts:163` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "requestedStartAt": "2026-07-31T12:00:00.000Z",
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "requestedStartAt": "2026-07-31T12:00:00.000Z",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La cuenta no corresponde a un visitador médico; ResourceNotFoundException: Solicitud no encontrada |
| 409 | `CONFLICT` | ConflictException: La solicitud está en un estado final y ya no admite cambios; ConflictException: La transición solicitada no está permitida para el estado actual |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El visitador no tiene una vinculación activa con un laboratorio; PreconditionFailedException: El laboratorio del visitador no está activo; PreconditionFailedException: El doctor no recibe visitas de laboratorio; PreconditionFailedException: La visita debe solicitarse con al menos {policy.minNoticeHours} horas de antelación; PreconditionFailedException: La duración máxima admitida es de {policy.maxDurationMinutes} minutos; PreconditionFailedException: El horario solicitado queda fuera de las ventanas de visita del doctor; PreconditionFailedException: La modalidad solicitada no coincide con la de la ventana de visita; PreconditionFailedException: El doctor ya alcanzó el máximo de visitas para ese día; PreconditionFailedException: El horario se superpone con otra visita ya registrada; PreconditionFailedException: La ventana de visita ya está completa; PreconditionFailedException: El horario se superpone con la agenda clínica del doctor; PreconditionFailedException: El plazo para reprogramar o cancelar venció ({cutoffHours} horas antes del inicio) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 68. GET /visit-requests/inbox

- **Origen:** CONTRATO
- **Nombre:** Listar las solicitudes de visita recibidas
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRequestsController.listInbox` — `src/modules/pharma_lab/controllers/visit-requests.controller.ts:75`

### Qué es y para qué sirve (negocio)

Listar las solicitudes de visita recibidas.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /visit-requests/inbox` la atiende `VisitRequestsController.listInbox` (src/modules/pharma_lab/controllers/visit-requests.controller.ts:75). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `VisitRequestsService.listDoctorRequests`. Lee pharma_lab.visit_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.visit_requests` | LEE | LEE | DIRECTA | VisitRequestsController.listInbox → VisitRequestsService.listDoctorRequests → VisitsRepository.listRequestsByDoctor | `src/modules/pharma_lab/repositories/visits.repository.ts:85` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VisitRequests[]>` · DTO `VisitRequests`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:20` |
| `medicalVisitorId` | `string` | Sí | — | `@Property({ fieldName: 'medical_visitor_id', type: 'uuid' })` | Visitador solicitante. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:26` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio al que representa en esta visita. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:32` |
| `doctorUserId` | `string` | Sí | — | `@Property({ fieldName: 'doctor_user_id', type: 'uuid' })` | Doctor visitado. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:38` |
| `doctorTenantId` | `string` | No | — | `@Property({ fieldName: 'doctor_tenant_id', type: 'uuid', nullable: true })` | Organización del doctor bajo la que se atiende la visita. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:44` |
| `reason` | `string` | Sí | — | `@Property({ columnType: 'text' })` | Motivo de la visita. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:50` |
| `requestedStartAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'requested_start_at', columnType: 'timestamptz' })` | Inicio solicitado, en UTC. La zona horaria aplicada se guarda aparte para poder reconstruir lo que vio quien solicitó. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:57` |
| `durationMinutes` | `number` | Sí | — | `@Property({ fieldName: 'duration_minutes', columnType: 'int' })` | Duración solicitada, en minutos. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:63` |
| `timeZone` | `string` | Sí | — | `@Property({ fieldName: 'time_zone', columnType: 'varchar' })` | Zona horaria aplicada (la del doctor o la de su organización, spec 5379). | `src/modules/pharma_lab/entities/visit_requests.entity.ts:69` |
| `modalityConceptId` | `string` | Sí | — | `@Property({ fieldName: 'modality_concept_id', type: 'uuid' })` | Modalidad solicitada. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:75` |
| `location` | `string` | No | — | `@Property({ columnType: 'varchar', nullable: true })` | Ubicación o enlace acordado. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:81` |
| `attachments` | `object` | No | — | `@Property({ type: 'json', columnType: 'jsonb', nullable: true })` | Documentación adjunta a la solicitud (referencias del almacén documental). | `src/modules/pharma_lab/entities/visit_requests.entity.ts:87` |
| `observations` | `string` | No | — | `@Property({ columnType: 'text', nullable: true })` | Observaciones del visitador. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:93` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado de la visita, dentro de la lista cerrada de spec 5382-5394. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:99` |
| `proposedStartAt` | `string` | No | formato date-time | `@Property({ fieldName: 'proposed_start_at', columnType: 'timestamptz', nullable: true, })` | Horario propuesto por el doctor como alternativa (spec 5373). | `src/modules/pharma_lab/entities/visit_requests.entity.ts:109` |
| `confirmedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'confirmed_at', columnType: 'timestamptz', nullable: true, })` | Momento de la confirmación. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:119` |
| `closedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'closed_at', columnType: 'timestamptz', nullable: true, })` | Momento de la cancelación o el rechazo. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:129` |
| `rescheduledFromId` | `string` | No | — | `@Property({ fieldName: 'rescheduled_from_id', type: 'uuid', nullable: true, })` | Solicitud de la que ésta es reprogramación, si la hay. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:139` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:145` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:151` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:157` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:163` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:169` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 69. GET /visit-requests/mine

- **Origen:** CONTRATO
- **Nombre:** Listar las propias solicitudes de visita
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitRequestsController.listMine` — `src/modules/pharma_lab/controllers/visit-requests.controller.ts:67`

### Qué es y para qué sirve (negocio)

Listar las propias solicitudes de visita.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /visit-requests/mine` la atiende `VisitRequestsController.listMine` (src/modules/pharma_lab/controllers/visit-requests.controller.ts:67). Exige sesión con alguno de los roles MEDICAL_VISITOR. Delega en `VisitRequestsService.listOwnRequests`. Lee pharma_lab.medical_visitors, pharma_lab.visit_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MEDICAL_VISITOR | `src/modules/pharma_lab/controllers/visit-requests.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.medical_visitors` | LEE | LEE | DIRECTA | VisitRequestsController.listMine → VisitRequestsService.listOwnRequests → VisitorsRepository.findVisitorByUser | `src/modules/pharma_lab/repositories/visitors.repository.ts:44` |
| `pharma_lab.visit_requests` | LEE | LEE | DIRECTA | VisitRequestsController.listMine → VisitRequestsService.listOwnRequests → VisitsRepository.listRequestsByVisitor | `src/modules/pharma_lab/repositories/visits.repository.ts:65` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VisitRequests[]>` · DTO `VisitRequests`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:20` |
| `medicalVisitorId` | `string` | Sí | — | `@Property({ fieldName: 'medical_visitor_id', type: 'uuid' })` | Visitador solicitante. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:26` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio al que representa en esta visita. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:32` |
| `doctorUserId` | `string` | Sí | — | `@Property({ fieldName: 'doctor_user_id', type: 'uuid' })` | Doctor visitado. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:38` |
| `doctorTenantId` | `string` | No | — | `@Property({ fieldName: 'doctor_tenant_id', type: 'uuid', nullable: true })` | Organización del doctor bajo la que se atiende la visita. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:44` |
| `reason` | `string` | Sí | — | `@Property({ columnType: 'text' })` | Motivo de la visita. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:50` |
| `requestedStartAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'requested_start_at', columnType: 'timestamptz' })` | Inicio solicitado, en UTC. La zona horaria aplicada se guarda aparte para poder reconstruir lo que vio quien solicitó. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:57` |
| `durationMinutes` | `number` | Sí | — | `@Property({ fieldName: 'duration_minutes', columnType: 'int' })` | Duración solicitada, en minutos. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:63` |
| `timeZone` | `string` | Sí | — | `@Property({ fieldName: 'time_zone', columnType: 'varchar' })` | Zona horaria aplicada (la del doctor o la de su organización, spec 5379). | `src/modules/pharma_lab/entities/visit_requests.entity.ts:69` |
| `modalityConceptId` | `string` | Sí | — | `@Property({ fieldName: 'modality_concept_id', type: 'uuid' })` | Modalidad solicitada. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:75` |
| `location` | `string` | No | — | `@Property({ columnType: 'varchar', nullable: true })` | Ubicación o enlace acordado. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:81` |
| `attachments` | `object` | No | — | `@Property({ type: 'json', columnType: 'jsonb', nullable: true })` | Documentación adjunta a la solicitud (referencias del almacén documental). | `src/modules/pharma_lab/entities/visit_requests.entity.ts:87` |
| `observations` | `string` | No | — | `@Property({ columnType: 'text', nullable: true })` | Observaciones del visitador. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:93` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado de la visita, dentro de la lista cerrada de spec 5382-5394. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:99` |
| `proposedStartAt` | `string` | No | formato date-time | `@Property({ fieldName: 'proposed_start_at', columnType: 'timestamptz', nullable: true, })` | Horario propuesto por el doctor como alternativa (spec 5373). | `src/modules/pharma_lab/entities/visit_requests.entity.ts:109` |
| `confirmedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'confirmed_at', columnType: 'timestamptz', nullable: true, })` | Momento de la confirmación. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:119` |
| `closedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'closed_at', columnType: 'timestamptz', nullable: true, })` | Momento de la cancelación o el rechazo. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:129` |
| `rescheduledFromId` | `string` | No | — | `@Property({ fieldName: 'rescheduled_from_id', type: 'uuid', nullable: true, })` | Solicitud de la que ésta es reprogramación, si la hay. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:139` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:145` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:151` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:157` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:163` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/visit_requests.entity.ts:169` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La cuenta no corresponde a un visitador médico |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 70. GET /visit-surveys/labs/{pharmaLabId}

- **Origen:** CONTRATO
- **Nombre:** Listar las encuestas del laboratorio
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitSurveysController.list` — `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:65`

### Qué es y para qué sirve (negocio)

Listar las encuestas del laboratorio.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /visit-surveys/labs/{pharmaLabId}` la atiende `VisitSurveysController.list` (src/modules/pharma_lab/controllers/visit-surveys.controller.ts:65). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, PLATFORM_ADMIN. Delega en `VisitSurveysService.listSurveys`. Lee pharma_lab.pharma_labs, pharma_lab.visit_surveys.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:65` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:65` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | VisitSurveysController.list → VisitSurveysService.listSurveys → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.visit_surveys` | LEE | LEE | DIRECTA | VisitSurveysController.list → VisitSurveysService.listSurveys → SurveysRepository.listSurveys | `src/modules/pharma_lab/repositories/surveys.repository.ts:34` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VisitSurveys[]>` · DTO `VisitSurveys`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:17` |
| `pharmaLabId` | `string` | Sí | — | `@Property({ fieldName: 'pharma_lab_id', type: 'uuid' })` | Laboratorio que la configura. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:23` |
| `title` | `string` | Sí | — | `@Property({ columnType: 'varchar' })` | Título. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:29` |
| `medicalVisitorId` | `string` | No | — | `@Property({ fieldName: 'medical_visitor_id', type: 'uuid', nullable: true })` | Visitador al que se acota, si aplica. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:35` |
| `pharmaProductId` | `string` | No | — | `@Property({ fieldName: 'pharma_product_id', type: 'uuid', nullable: true })` | Producto al que se acota, si aplica. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:41` |
| `campaignCode` | `string` | No | — | `@Property({ fieldName: 'campaign_code', columnType: 'varchar', nullable: true, })` | Campaña a la que se acota. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:51` |
| `specialtyConceptId` | `string` | No | — | `@Property({ fieldName: 'specialty_concept_id', type: 'uuid', nullable: true })` | Especialidad a la que se acota. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:57` |
| `validFrom` | `string` | Sí | — | `@Property({ fieldName: 'valid_from', columnType: 'date' })` | Inicio de vigencia. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:63` |
| `validTo` | `string` | No | — | `@Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })` | Fin de vigencia. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:69` |
| `sendDelayHours` | `number` | Sí | — | `@Property({ fieldName: 'send_delay_hours', columnType: 'int' })` | Horas después de la visita en que se envía. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:75` |
| `reminderCount` | `number` | Sí | — | `@Property({ fieldName: 'reminder_count', columnType: 'int' })` | Cantidad de recordatorios programados. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:81` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado de la encuesta. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:87` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:93` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:99` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:105` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:111` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/visit_surveys.entity.ts:117` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitSurveysController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 71. POST /visit-surveys/labs/{pharmaLabId}

- **Origen:** CONTRATO
- **Nombre:** Configurar una encuesta posterior a la visita
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitSurveysController.create` — `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:47`

### Qué es y para qué sirve (negocio)

Configurar una encuesta posterior a la visita.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-surveys/labs/{pharmaLabId}` la atiende `VisitSurveysController.create` (src/modules/pharma_lab/controllers/visit-surveys.controller.ts:47). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `CreateVisitSurveyDto` (14 campos, 5 obligatorios). Delega en `VisitSurveysService.createSurvey`. Crea filas en audit.audit_log, pharma_lab.visit_survey_questions, pharma_lab.visit_surveys. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_labs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId | `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:47` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitSurveysController.create → VisitSurveysService.createSurvey → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitSurveysController.create → VisitSurveysService.createSurvey → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitSurveysController.create → VisitSurveysService.createSurvey → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | VisitSurveysController.create → VisitSurveysService.createSurvey → PharmaLabAccessService.requireActiveLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.visit_survey_questions` | ESCRIBE | CREA | DIRECTA | VisitSurveysController.create → VisitSurveysService.createSurvey → SurveysRepository.createQuestion | `src/modules/pharma_lab/repositories/surveys.repository.ts:100` |
| `pharma_lab.visit_surveys` | ESCRIBE | CREA | DIRECTA | VisitSurveysController.create → VisitSurveysService.createSurvey → SurveysRepository.createSurvey | `src/modules/pharma_lab/repositories/surveys.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateVisitSurveyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `title` | `string` | Sí | longitud máxima 255 | `@IsString()` `@MaxLength(255)` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:63` |
| `medicalVisitorId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:71` |
| `pharmaProductId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:79` |
| `campaignCode` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:88` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:96` |
| `validFrom` | `string` | Sí | formato date | `@IsDateString()` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:103` |
| `validTo` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:111` |
| `sendDelayHours` | `number` | No | mínimo 0; máximo 720 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(720)` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:121` |
| `reminderCount` | `number` | No | mínimo 0; máximo 5 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(5)` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:131` |
| `questions` | `array<SurveyQuestionDto>` | Sí | máximo 40 elemento(s) | `@IsArray()` `@ArrayNotEmpty()` `@ArrayMaxSize(40)` `@ValidateNested({ each: true })` `@Type(() => SurveyQuestionDto)` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:142` |
| `questions[].prompt` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:27` |
| `questions[].answerTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:34` |
| `questions[].isRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:42` |
| `questions[].options` | `array<string>` | No | máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` `@ArrayMaxSize(20)` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:52` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<CreatedResourceDto>` · DTO `CreatedResourceDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso creado. | `src/modules/pharma_lab/dto/common.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El laboratorio no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitSurveysController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 72. POST /visit-surveys/labs/{pharmaLabId}/{surveyId}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar una encuesta
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitSurveysController.close` — `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:75`

### Qué es y para qué sirve (negocio)

Cerrar una encuesta.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-surveys/labs/{pharmaLabId}/{surveyId}/close` la atiende `VisitSurveysController.close` (src/modules/pharma_lab/controllers/visit-surveys.controller.ts:75). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, PLATFORM_ADMIN. Delega en `VisitSurveysService.closeSurvey`. Crea filas en audit.audit_log. Actualiza pharma_lab.visit_surveys. Lee audit.audit_log, iam.sessions, pharma_lab.pharma_labs, pharma_lab.visit_surveys.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, surveyId | `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:75` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitSurveysController.close → VisitSurveysService.closeSurvey → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitSurveysController.close → VisitSurveysService.closeSurvey → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitSurveysController.close → VisitSurveysService.closeSurvey → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | VisitSurveysController.close → VisitSurveysService.closeSurvey → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.visit_surveys` | ESCRIBE | ACTUALIZA | POR_TIPO | VisitSurveysController.close → VisitSurveysService.closeSurvey | `src/modules/pharma_lab/services/visit-surveys.service.ts:158` |
| `pharma_lab.visit_surveys` | LEE | LEE | DIRECTA | VisitSurveysController.close → VisitSurveysService.closeSurvey → VisitSurveysService.requireSurvey → SurveysRepository.findSurvey | `src/modules/pharma_lab/repositories/surveys.repository.ts:23` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `surveyId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Encuesta no encontrada en el laboratorio |
| 409 | `CONFLICT` | ConflictException: La encuesta ya está cerrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitSurveysController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 73. GET /visit-surveys/labs/{pharmaLabId}/{surveyId}/results

- **Origen:** CONTRATO
- **Nombre:** Resultados agregados de la encuesta
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitSurveysController.results` — `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:92`

### Qué es y para qué sirve (negocio)

Resultados agregados de la encuesta.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /visit-surveys/labs/{pharmaLabId}/{surveyId}/results` la atiende `VisitSurveysController.results` (src/modules/pharma_lab/controllers/visit-surveys.controller.ts:92). Exige sesión con alguno de los roles PHARMA_LAB_ADMIN, PLATFORM_ADMIN. Delega en `VisitSurveysService.getResults`. Lee pharma_lab.pharma_labs, pharma_lab.visit_survey_answers, pharma_lab.visit_survey_questions, pharma_lab.visit_survey_responses, pharma_lab.visit_surveys.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PHARMA_LAB_ADMIN, PLATFORM_ADMIN | `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pharmaLabId, surveyId | `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:92` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.pharma_labs` | LEE | LEE | DIRECTA | VisitSurveysController.results → VisitSurveysService.getResults → PharmaLabAccessService.requireLab → OrganizationRepository.findLab | `src/modules/pharma_lab/repositories/organization.repository.ts:21` |
| `pharma_lab.visit_survey_answers` | LEE | LEE | DIRECTA | VisitSurveysController.results → VisitSurveysService.getResults → SurveysRepository.listAnswers | `src/modules/pharma_lab/repositories/surveys.repository.ts:255` |
| `pharma_lab.visit_survey_questions` | LEE | LEE | DIRECTA | VisitSurveysController.results → VisitSurveysService.getResults → SurveysRepository.listQuestions | `src/modules/pharma_lab/repositories/surveys.repository.ts:122` |
| `pharma_lab.visit_survey_responses` | LEE | LEE | DIRECTA | VisitSurveysController.results → VisitSurveysService.getResults → SurveysRepository.listSubmittedResponses | `src/modules/pharma_lab/repositories/surveys.repository.ts:226` |
| `pharma_lab.visit_surveys` | LEE | LEE | DIRECTA | VisitSurveysController.results → VisitSurveysService.getResults → VisitSurveysService.requireSurvey → SurveysRepository.findSurvey | `src/modules/pharma_lab/repositories/surveys.repository.ts:23` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pharmaLabId` | path | Sí | `string` | — |
| `surveyId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SurveyResults>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Laboratorio no encontrado; ResourceNotFoundException: Encuesta no encontrada en el laboratorio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitSurveysController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 74. GET /visit-surveys/pending

- **Origen:** CONTRATO
- **Nombre:** Listar las encuestas pendientes de responder
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitSurveysController.listPending` — `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:107`

### Qué es y para qué sirve (negocio)

Listar las encuestas pendientes de responder.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /visit-surveys/pending` la atiende `VisitSurveysController.listPending` (src/modules/pharma_lab/controllers/visit-surveys.controller.ts:107). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `VisitSurveysService.listPendingForDoctor`. Lee pharma_lab.visit_survey_responses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:107` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.visit_survey_responses` | LEE | LEE | DIRECTA | VisitSurveysController.listPending → VisitSurveysService.listPendingForDoctor → SurveysRepository.listPendingResponses | `src/modules/pharma_lab/repositories/surveys.repository.ts:168` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VisitSurveyResponses[]>` · DTO `VisitSurveyResponses`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:19` |
| `visitSurveyId` | `string` | Sí | — | `@Property({ fieldName: 'visit_survey_id', type: 'uuid' })` | Encuesta emitida. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:25` |
| `visitRecordId` | `string` | Sí | — | `@Property({ fieldName: 'visit_record_id', type: 'uuid' })` | Visita que la origina. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:31` |
| `doctorUserId` | `string` | Sí | — | `@Property({ fieldName: 'doctor_user_id', type: 'uuid' })` | Único destinatario autorizado a responder. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:37` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado: pendiente o enviada. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:43` |
| `issuedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'issued_at', columnType: 'timestamptz' })` | Momento del envío al doctor. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:49` |
| `submittedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'submitted_at', columnType: 'timestamptz', nullable: true, })` | Momento en que el doctor respondió. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:59` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:65` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:71` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:77` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:83` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:89` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitSurveysController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 75. GET /visit-surveys/responses/{responseId}

- **Origen:** CONTRATO
- **Nombre:** Consultar el cuestionario a responder
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitSurveysController.getQuestionnaire` — `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:117`

### Qué es y para qué sirve (negocio)

Consultar el cuestionario a responder.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /visit-surveys/responses/{responseId}` la atiende `VisitSurveysController.getQuestionnaire` (src/modules/pharma_lab/controllers/visit-surveys.controller.ts:117). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `VisitSurveysService.getQuestionnaire`. Lee pharma_lab.visit_survey_questions, pharma_lab.visit_survey_responses, pharma_lab.visit_surveys.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:117` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: responseId | `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:117` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `pharma_lab.visit_survey_questions` | LEE | LEE | DIRECTA | VisitSurveysController.getQuestionnaire → VisitSurveysService.getQuestionnaire → SurveysRepository.listQuestions | `src/modules/pharma_lab/repositories/surveys.repository.ts:122` |
| `pharma_lab.visit_survey_responses` | LEE | LEE | DIRECTA | VisitSurveysController.getQuestionnaire → VisitSurveysService.getQuestionnaire → SurveysRepository.findResponse | `src/modules/pharma_lab/repositories/surveys.repository.ts:140` |
| `pharma_lab.visit_surveys` | LEE | LEE | DIRECTA | VisitSurveysController.getQuestionnaire → VisitSurveysService.getQuestionnaire → SurveysRepository.findSurvey | `src/modules/pharma_lab/repositories/surveys.repository.ts:23` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `responseId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<{ /** El envío. */ response: VisitSurveyResponses; /** La encuesta. */ survey: VisitSurveys; /** Preguntas en orden. */ questions: VisitSurveyQuestions[]; }>` · DTO `VisitSurveyResponses`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | `@PrimaryKey({ type: 'uuid' })` | Identificador único de la instancia. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:19` |
| `visitSurveyId` | `string` | Sí | — | `@Property({ fieldName: 'visit_survey_id', type: 'uuid' })` | Encuesta emitida. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:25` |
| `visitRecordId` | `string` | Sí | — | `@Property({ fieldName: 'visit_record_id', type: 'uuid' })` | Visita que la origina. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:31` |
| `doctorUserId` | `string` | Sí | — | `@Property({ fieldName: 'doctor_user_id', type: 'uuid' })` | Único destinatario autorizado a responder. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:37` |
| `statusConceptId` | `string` | Sí | — | `@Property({ fieldName: 'status_concept_id', type: 'uuid' })` | Estado: pendiente o enviada. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:43` |
| `issuedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'issued_at', columnType: 'timestamptz' })` | Momento del envío al doctor. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:49` |
| `submittedAt` | `string` | No | formato date-time | `@Property({ fieldName: 'submitted_at', columnType: 'timestamptz', nullable: true, })` | Momento en que el doctor respondió. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:59` |
| `createdAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'created_at', columnType: 'timestamptz' })` | Fecha y hora en que se creó el registro. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:65` |
| `updatedAt` | `string` | Sí | formato date-time | `@Property({ fieldName: 'updated_at', columnType: 'timestamptz' })` | Fecha y hora de la última actualización. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:71` |
| `createdByUserId` | `string` | No | — | `@Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a created by user. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:77` |
| `updatedByUserId` | `string` | No | — | `@Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })` | Identificador asociado a updated by user. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:83` |
| `rowVersion` | `number` | Sí | — | `@Property({ fieldName: 'row_version', columnType: 'int', version: true })` | Versión usada para controlar actualizaciones concurrentes. | `src/modules/pharma_lab/entities/visit_survey_responses.entity.ts:89` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuesta no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitSurveysController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 76. POST /visit-surveys/responses/{responseId}

- **Origen:** CONTRATO
- **Nombre:** Responder la encuesta de la visita
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VisitSurveysController.submit` — `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:135`

### Qué es y para qué sirve (negocio)

Responder la encuesta de la visita.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /visit-surveys/responses/{responseId}` la atiende `VisitSurveysController.submit` (src/modules/pharma_lab/controllers/visit-surveys.controller.ts:135). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `SubmitSurveyResponseDto` (5 campos, 2 obligatorios). Delega en `VisitSurveysService.submitResponse`. Crea filas en audit.audit_log, pharma_lab.visit_survey_answers. Actualiza pharma_lab.visit_survey_responses. Lee audit.audit_log, iam.sessions, pharma_lab.visit_survey_questions, pharma_lab.visit_survey_responses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:135` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: responseId | `src/modules/pharma_lab/controllers/visit-surveys.controller.ts:135` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | VisitSurveysController.submit → VisitSurveysService.submitResponse → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | VisitSurveysController.submit → VisitSurveysService.submitResponse → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | VisitSurveysController.submit → VisitSurveysService.submitResponse → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `pharma_lab.visit_survey_answers` | ESCRIBE | CREA | DIRECTA | VisitSurveysController.submit → VisitSurveysService.submitResponse → SurveysRepository.createAnswer | `src/modules/pharma_lab/repositories/surveys.repository.ts:204` |
| `pharma_lab.visit_survey_questions` | LEE | LEE | DIRECTA | VisitSurveysController.submit → VisitSurveysService.submitResponse → SurveysRepository.listQuestions | `src/modules/pharma_lab/repositories/surveys.repository.ts:122` |
| `pharma_lab.visit_survey_responses` | ESCRIBE | ACTUALIZA | POR_TIPO | VisitSurveysController.submit → VisitSurveysService.submitResponse | `src/modules/pharma_lab/services/visit-surveys.service.ts:310` |
| `pharma_lab.visit_survey_responses` | LEE | LEE | DIRECTA | VisitSurveysController.submit → VisitSurveysService.submitResponse → SurveysRepository.findResponse | `src/modules/pharma_lab/repositories/surveys.repository.ts:140` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `responseId` | path | Sí | `string` | — |

### Cuerpo — DTO `SubmitSurveyResponseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `answers` | `array<SurveyAnswerDto>` | Sí | máximo 40 elemento(s) | `@IsArray()` `@ArrayNotEmpty()` `@ArrayMaxSize(40)` `@ValidateNested({ each: true })` `@Type(() => SurveyAnswerDto)` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:193` |
| `answers[].visitSurveyQuestionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:152` |
| `answers[].numericValue` | `number` | No | mínimo 0; máximo 10 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(10)` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:162` |
| `answers[].booleanValue` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:170` |
| `answers[].textValue` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/pharma_lab/dto/surveys.dto.ts:179` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "answers": [
    {
      "visitSurveyQuestionId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<TransitionResultDto>` · DTO `TransitionResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del recurso afectado. | `src/modules/pharma_lab/dto/common.dto.ts:18` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto del estado en que quedó el recurso. | `src/modules/pharma_lab/dto/common.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuesta no encontrada |
| 409 | `CONFLICT` | ConflictException: La encuesta ya fue respondida |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Faltan respuestas obligatorias; PreconditionFailedException: Alguna respuesta no corresponde a una pregunta de esta encuesta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/pharma_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo `pharma_lab` — etapa `ctrl:VisitSurveysController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

