# Repositorios — Consent

Acceso a datos de las tablas del esquema `consent`. Son **stateless**: cada método
recibe el `EntityManager` activo como primer parámetro, de modo que el servicio
controla la unidad de trabajo y la transacción, y varios repositorios participan en
el mismo `flush` atómico. Ninguna regla de negocio vive aquí; solo consultas y
materialización de entidades.

| Repositorio | Tabla | Notas |
|-------------|-------|-------|
| `ConsentsRepository` | `consent.consents` | `findActiveByPurpose` (guard de unicidad), `findExpirable` (barrido) |
| `ConsentProvisionsRepository` | `consent.consent_provisions` | `findOpenByConsent` (soft-close) |
| `ConsentEventsRepository` | `consent.consent_events` | `record` (append-only, sin `row_version`) |
| `ConsentEvidenceRepository` | `consent.consent_evidence` | `create` (IMMUTABLE append-only) |
| `HipaaAuthorizationsRepository` | `consent.hipaa_authorizations` | `findExpirable` por `expires_at` |
| `PatientObjectionsRepository` | `consent.patient_objections` | `findOpenByPurpose` (guard de unicidad) |
| `PrivacyRestrictionsRepository` | `consent.privacy_restrictions` | `findActiveByPatient`, `findExpirable` |
| `ProcessingLegalBasesRepository` | `consent.processing_legal_bases` | `findCurrentVersion` (cierre de vigencia) |
| `TreatmentInformedConsentsRepository` | `consent.treatment_informed_consents` | alta firmada |

Cada `em.create(...)` lleva `{ partial: true }` y los campos de auditoría de
`createdBy(actorUserId)`; `row_version` se omite (lo gestiona la BD/ORM).
