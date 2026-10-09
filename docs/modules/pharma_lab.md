<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/pharma_lab/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `pharma_lab`

**Fuente:** [`src/modules/pharma_lab/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharma_lab/README.md)
· 12 controllers · 13 services · 10 repositories · 31 entidades · 11 DTO

---

# Módulo `pharma_lab`

Gestiona laboratorios farmacéuticos, personal y visitadores, agenda y registros de visita, catálogo de productos, farmacovigilancia, documentación regulatoria y analítica.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/pharma_lab -name '*.controller.ts' | wc -l
  find src/modules/pharma_lab -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/pharma_lab -name '*.entity.ts' | wc -l
  find src/modules/pharma_lab -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **12 controllers, 76 rutas HTTP, 31 entidad y 13 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`AuditModule`, `AuthzModule`).

Entidades (`tableName`, 31 de 31 archivos `*.entity.ts`): `doctor_visit_blocks`, `doctor_visit_policies`, `doctor_visit_windows`, `informational_materials`, `material_approvals`, `material_assets`, `medical_visitor_products`, `medical_visitor_specialties`, `medical_visitors`, `pharma_cost_allocations`, `pharma_lab_link_events`, `pharma_lab_notices`, `pharma_lab_staff`, `pharma_labs`, `pharma_products`, `pharmacovigilance_actions`, `pharmacovigilance_reports`, `regulatory_document_access_log`, `regulatory_document_versions`, `regulatory_documents`, `visit_ratings`, `visit_record_materials`, `visit_records`, `visit_request_events`, `visit_request_topics`, `visit_requests`, `visit_survey_answers`, `visit_survey_questions`, `visit_survey_responses`, `visit_surveys`, `visitor_post_submissions`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /pharma-labs/:pharmaLabId/medical-visitors` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `medical-visitors` |
| `GET /pharma-labs/:pharmaLabId/medical-visitors` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `medical-visitors` |
| `POST /pharma-labs/:pharmaLabId/medical-visitors/:medicalVisitorId/verifications` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `medical-visitors` |
| `PUT /pharma-labs/:pharmaLabId/medical-visitors/:medicalVisitorId/products` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `medical-visitors` |
| `PUT /pharma-labs/:pharmaLabId/medical-visitors/:medicalVisitorId/specialties` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `medical-visitors` |
| `POST /pharma-labs/:pharmaLabId/medical-visitors/:medicalVisitorId/unlink` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `medical-visitors` |
| `POST /pharma-labs/:pharmaLabId/medical-visitors/:medicalVisitorId/relink` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `medical-visitors` |
| `POST /pharma-labs/:pharmaLabId/products` | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `pharma-catalog` |
| `GET /pharma-labs/:pharmaLabId/products` | PHARMA_LAB_ADMIN,
    REGULATORY_AFFAIRS,
    MEDICAL_VISITOR,
    PLATFORM_ADMIN, | `pharma-catalog` |
| `PATCH /pharma-labs/:pharmaLabId/products/:productId` | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `pharma-catalog` |
| `POST /pharma-labs/:pharmaLabId/products/:productId/status` | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `pharma-catalog` |
| `POST /pharma-labs/:pharmaLabId/materials` | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `pharma-catalog` |
| `GET /pharma-labs/:pharmaLabId/materials` | PHARMA_LAB_ADMIN,
    REGULATORY_AFFAIRS,
    MEDICAL_VISITOR,
    PLATFORM_ADMIN, | `pharma-catalog` |
| `POST /pharma-labs/:pharmaLabId/materials/:materialId/assets` | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `pharma-catalog` |
| `GET /pharma-labs/:pharmaLabId/materials/:materialId/assets` | PHARMA_LAB_ADMIN,
    REGULATORY_AFFAIRS,
    MEDICAL_VISITOR,
    PLATFORM_ADMIN, | `pharma-catalog` |
| `POST /pharma-labs/:pharmaLabId/materials/:materialId/submit` | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `pharma-catalog` |
| `POST /pharma-labs/:pharmaLabId/materials/:materialId/decision` | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `pharma-catalog` |
| `GET /pharma-labs/:pharmaLabId/materials/:materialId/approvals` | PHARMA_LAB_ADMIN, REGULATORY_AFFAIRS, PLATFORM_ADMIN | `pharma-catalog` |
| `GET /pharma-labs/notices/mine` | sesión | `pharma-lab-notices` |
| `POST /pharma-labs/notices/:noticeId/read` | sesión | `pharma-lab-notices` |
| `GET /pharma-labs/reference/concepts` | sesión | `pharma-lab-reference` |
| `POST /pharma-labs/visitor-posts` | MEDICAL_VISITOR | `pharma-lab-social` |
| `GET /pharma-labs/:pharmaLabId/visitor-posts` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `pharma-lab-social` |
| `POST /pharma-labs/:pharmaLabId/visitor-posts/:submissionId/decision` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `pharma-lab-social` |
| `POST /pharma-labs/:pharmaLabId/cost-allocations` | PHARMA_LAB_ADMIN, ACCOUNTANT, FINANCE, PLATFORM_ADMIN | `pharma-lab-social` |
| `GET /pharma-labs/:pharmaLabId/cost-allocations/report` | PHARMA_LAB_ADMIN, ACCOUNTANT, FINANCE, PLATFORM_ADMIN | `pharma-lab-social` |
| `POST /pharma-labs` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `pharma-labs` |
| `GET /pharma-labs` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `pharma-labs` |
| `GET /pharma-labs/:pharmaLabId` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `pharma-labs` |
| `PATCH /pharma-labs/:pharmaLabId` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `pharma-labs` |
| `POST /pharma-labs/:pharmaLabId/staff` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `pharma-labs` |
| `GET /pharma-labs/:pharmaLabId/staff` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `pharma-labs` |
| `PATCH /pharma-labs/:pharmaLabId/staff/:staffId/permissions` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `pharma-labs` |
| `POST /pharma-labs/:pharmaLabId/staff/:staffId/unlink` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `pharma-labs` |
| `GET /pharma-labs/:pharmaLabId/link-events` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `pharma-labs` |
| `POST /pharma-labs/:pharmaLabId/pharmacovigilance/reports` | PRACTITIONER,
    CLINICIAN,
    PHARMACOVIGILANCE_OFFICER,
    PHARMA_LAB_ADMIN,
    BUSINESS_ADMIN, | `pharmacovigilance` |
| `GET /pharma-labs/:pharmaLabId/pharmacovigilance/reports` | PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN | `pharmacovigilance` |
| `GET /pharma-labs/:pharmaLabId/pharmacovigilance/reports/:reportId` | PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN | `pharmacovigilance` |
| `POST /pharma-labs/:pharmaLabId/pharmacovigilance/reports/:reportId/actions` | PHARMACOVIGILANCE_OFFICER, PHARMA_LAB_ADMIN, PLATFORM_ADMIN | `pharmacovigilance` |
| `POST /pharma-labs/:pharmaLabId/regulatory-documents` | REGULATORY_AFFAIRS,
  PHARMA_LAB_ADMIN,
  LEGAL_COUNSEL,
  PLATFORM_ADMIN, | `regulatory-documents` |
| `GET /pharma-labs/:pharmaLabId/regulatory-documents` | REGULATORY_AFFAIRS,
  PHARMA_LAB_ADMIN,
  LEGAL_COUNSEL,
  PLATFORM_ADMIN, | `regulatory-documents` |
| `GET /pharma-labs/:pharmaLabId/regulatory-documents/:documentId` | REGULATORY_AFFAIRS,
  PHARMA_LAB_ADMIN,
  LEGAL_COUNSEL,
  PLATFORM_ADMIN, | `regulatory-documents` |
| `POST /pharma-labs/:pharmaLabId/regulatory-documents/:documentId/versions` | REGULATORY_AFFAIRS,
  PHARMA_LAB_ADMIN,
  LEGAL_COUNSEL,
  PLATFORM_ADMIN, | `regulatory-documents` |
| `POST /pharma-labs/:pharmaLabId/regulatory-documents/:documentId/versions/:versionId/download` | REGULATORY_AFFAIRS,
  PHARMA_LAB_ADMIN,
  LEGAL_COUNSEL,
  PLATFORM_ADMIN, | `regulatory-documents` |
| `POST /pharma-labs/:pharmaLabId/regulatory-documents/:documentId/invalidate` | REGULATORY_AFFAIRS,
  PHARMA_LAB_ADMIN,
  LEGAL_COUNSEL,
  PLATFORM_ADMIN, | `regulatory-documents` |
| `GET /pharma-labs/:pharmaLabId/regulatory-documents/:documentId/access-log` | REGULATORY_AFFAIRS,
  PHARMA_LAB_ADMIN,
  LEGAL_COUNSEL,
  PLATFORM_ADMIN, | `regulatory-documents` |
| `POST /pharma-labs/:pharmaLabId/regulatory-documents/expirations/review` | REGULATORY_AFFAIRS,
  PHARMA_LAB_ADMIN,
  LEGAL_COUNSEL,
  PLATFORM_ADMIN, | `regulatory-documents` |
| `PUT /visit-agenda/me` | PRACTITIONER, CLINICIAN | `visit-agenda` |
| `GET /visit-agenda/me` | PRACTITIONER, CLINICIAN | `visit-agenda` |
| `GET /visit-agenda/doctors/:doctorUserId` | MEDICAL_VISITOR, PHARMA_LAB_ADMIN, PRACTITIONER, CLINICIAN | `visit-agenda` |
| `POST /visit-agenda/blocks` | PRACTITIONER, CLINICIAN | `visit-agenda` |
| `GET /visit-agenda/blocks` | PRACTITIONER, CLINICIAN | `visit-agenda` |
| `POST /visit-agenda/blocks/:blockId/lift` | PRACTITIONER, CLINICIAN | `visit-agenda` |
| `POST /visit-records` | MEDICAL_VISITOR | `visit-records` |
| `GET /visit-records/inbox` | PRACTITIONER, CLINICIAN | `visit-records` |
| `POST /visit-records/:visitRecordId/confirm` | PRACTITIONER, CLINICIAN | `visit-records` |
| `POST /visit-records/:visitRecordId/rating` | PRACTITIONER, CLINICIAN | `visit-records` |
| `GET /visit-records/labs/:pharmaLabId` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `visit-records` |
| `GET /visit-records/labs/:pharmaLabId/rating-summary` | PHARMA_LAB_ADMIN, BUSINESS_ADMIN, PLATFORM_ADMIN | `visit-records` |
| `POST /visit-requests` | MEDICAL_VISITOR | `visit-requests` |
| `GET /visit-requests/mine` | MEDICAL_VISITOR | `visit-requests` |
| `GET /visit-requests/inbox` | PRACTITIONER, CLINICIAN | `visit-requests` |
| `GET /visit-requests/:visitRequestId` | MEDICAL_VISITOR, PRACTITIONER, CLINICIAN | `visit-requests` |
| `POST /visit-requests/:visitRequestId/accept` | PRACTITIONER, CLINICIAN | `visit-requests` |
| `POST /visit-requests/:visitRequestId/reject` | PRACTITIONER, CLINICIAN | `visit-requests` |
| `POST /visit-requests/:visitRequestId/request-info` | PRACTITIONER, CLINICIAN | `visit-requests` |
| `POST /visit-requests/:visitRequestId/propose-time` | PRACTITIONER, CLINICIAN | `visit-requests` |
| `POST /visit-requests/:visitRequestId/reschedule` | MEDICAL_VISITOR | `visit-requests` |
| `POST /visit-requests/:visitRequestId/cancel` | MEDICAL_VISITOR, PRACTITIONER, CLINICIAN | `visit-requests` |
| `POST /visit-surveys/labs/:pharmaLabId` | PHARMA_LAB_ADMIN, PLATFORM_ADMIN | `visit-surveys` |
| `GET /visit-surveys/labs/:pharmaLabId` | PHARMA_LAB_ADMIN, PLATFORM_ADMIN | `visit-surveys` |
| `POST /visit-surveys/labs/:pharmaLabId/:surveyId/close` | PHARMA_LAB_ADMIN, PLATFORM_ADMIN | `visit-surveys` |
| `GET /visit-surveys/labs/:pharmaLabId/:surveyId/results` | PHARMA_LAB_ADMIN, PLATFORM_ADMIN | `visit-surveys` |
| `GET /visit-surveys/pending` | PRACTITIONER, CLINICIAN | `visit-surveys` |
| `GET /visit-surveys/responses/:responseId` | PRACTITIONER, CLINICIAN | `visit-surveys` |
| `POST /visit-surveys/responses/:responseId` | PRACTITIONER, CLINICIAN | `visit-surveys` |

## Contenido

### Subcarpetas

- [`controllers/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharma_lab/controllers/README.md): Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.
- [`dto/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharma_lab/dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`entities/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharma_lab/entities/README.md): Entidades y relaciones que representan el modelo persistente.
- [`repositories/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharma_lab/repositories/README.md): Consultas y operaciones de persistencia aisladas de la lógica de negocio.
- [`services/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/pharma_lab/services/README.md): Casos de uso, reglas de negocio y coordinación transaccional.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `pharma_lab.concepts.ts` | Implementación o recurso de soporte de esta carpeta. |
| `pharma_lab.module.ts` | Composición de dependencias del módulo NestJS. |
| `pharma_lab.roles.ts` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

## Pruebas y revisión

`corepack yarn test src/modules/pharma_lab --runInBand --silent` aprobó 10 suites y 120 pruebas. La guardia de alcance limita cada laboratorio a su personal activo, visitadores operativos o roles de red. Ver [auditoría backend](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/pharma_lab.md).
