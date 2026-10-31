# Repositorios — delegated_access

Acceso a datos stateless: cada método recibe el `EntityManager` activo como primer
parámetro para que el servicio controle la unidad de trabajo y la transacción. No
contienen reglas de negocio, solo construcción de consultas y materialización. Los
`em.create(...)` usan `{ partial: true }` y `createdBy(actor.id)`; nunca fijan
`rowVersion`.

| Repositorio                                 | Entidad                                                                                                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OrganizationUserAssignmentsRepository`     | `organization_user_assignments`                                                                                                                            |
| `DelegatedPermissionSetsRepository`         | `delegated_permission_sets`                                                                                                                                |
| `DelegatedPermissionSetItemsRepository`     | `delegated_permission_set_items`                                                                                                                           |
| `PractitionerDelegateAssignmentsRepository` | `practitioner_delegate_assignments`                                                                                                                        |
| `DelegatedAccessApprovalRequestsRepository` | `delegated_access_approval_requests`                                                                                                                       |
| `DelegatedAccessGrantsRepository`           | `delegated_access_grants`                                                                                                                                  |
| `DelegationEventsRepository`                | `delegation_events` (ledger append-only)                                                                                                                   |
| `GovernanceRulesRepository`                 | `governance_rules` (reglas L1 de la organización; se retiran, no se borran)                                                                                |
| `SodRepository`                             | `sod_rules`, `sod_exceptions` (segregación de funciones; lectura de vencidas entre organizaciones con `withSystemRead`)                                    |
| `FourEyesRepository`                        | `four_eyes_requests` (`consume` atómico: una sola vez)                                                                                                     |
| `AccessReviewRepository`                    | `access_review_campaigns`, `access_review_items`                                                                                                           |
| `LifecycleRepository`                       | `lifecycle_cases`, `handover_items`                                                                                                                        |
| `PatientRestrictionFlagsRepository`         | `patient_restriction_flags` (lectura en lote por paciente)                                                                                                 |
| `AccessDecisionLogRepository`               | `access_decision_log` (WORM: solo anexa y lee)                                                                                                             |
| `GrantUsageStatsRepository`                 | `grant_usage_stats` (UPSERT que suma, con `withSystemWrite`)                                                                                               |
| `AccessAnomaliesRepository`                 | `access_anomalies` (alta idempotente por ventana)                                                                                                          |
| `GovernanceQueriesRepository`               | Lecturas agregadas: administradores de seguridad, uso por concesión, decisiones negadas, pacientes vistos, emergencias, cuatro ojos y bandeja del revisor. |
| `HandoverWorkRepository`                    | Lo que una persona tiene en las manos al irse: conversaciones, tareas, citas pendientes y cuentas que supervisa; solo escribe el puntero de asignación |
