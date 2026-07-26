# Servicios — Consent

Dueños de la unidad de trabajo. Inyectan `EntityManager` (`@mikro-orm/postgresql`)
y usan `this.em.transactional(async (tx) => {...})` para escrituras, haciendo
`flush` del padre antes de crear hijos (FK uuid planas → MikroORM no ordena
inserts). Validan precondiciones y lanzan excepciones de dominio
(`ResourceNotFoundException`, `ConflictException`, `PreconditionFailedException`).

| Servicio | UCs | Responsabilidad |
|----------|-----|-----------------|
| `ConsentsService` | 01, 02, 09 | Capturar, retirar y enmendar provisiones de consentimientos |
| `HipaaAuthorizationsService` | 04, 05 | Otorgar y revocar autorizaciones HIPAA |
| `PatientObjectionsService` | 03, 12 | Registrar objeción (+ restricción include UC-07) y resolverla |
| `PrivacyRestrictionsService` | 07 | Aplicar restricción de privacidad |
| `ProcessingLegalBasesService` | 06 | Versionar base legal (supersede la vigente) |
| `TreatmentInformedConsentsService` | 08 | Firmar consentimiento informado de tratamiento |
| `ConsentEvidenceService` | 10 | Registrar evidencia inmutable (append-only) |
| `ConsentSweepService` | 11 | Barrido de expiraciones por tipo |

Cada transición de estado deja un evento append-only vía `ConsentEventsRepository`.
Estados/tipos provienen de `CONS` (conceptos del módulo) o de `SEED.tenantId` /
`CONCEPTS.*` transversales. Tests: `*.service.spec.ts` con repos/em mockeados.
