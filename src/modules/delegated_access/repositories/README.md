# Repositorios — delegated_access

Acceso a datos stateless: cada método recibe el `EntityManager` activo como primer
parámetro para que el servicio controle la unidad de trabajo y la transacción. No
contienen reglas de negocio, solo construcción de consultas y materialización. Los
`em.create(...)` usan `{ partial: true }` y `createdBy(actor.id)`; nunca fijan
`rowVersion`.

| Repositorio | Entidad |
|-------------|---------|
| `OrganizationUserAssignmentsRepository` | `organization_user_assignments` |
| `DelegatedPermissionSetsRepository` | `delegated_permission_sets` |
| `DelegatedPermissionSetItemsRepository` | `delegated_permission_set_items` |
| `PractitionerDelegateAssignmentsRepository` | `practitioner_delegate_assignments` |
| `DelegatedAccessApprovalRequestsRepository` | `delegated_access_approval_requests` |
| `DelegatedAccessGrantsRepository` | `delegated_access_grants` |
| `DelegationEventsRepository` | `delegation_events` (ledger append-only) |
