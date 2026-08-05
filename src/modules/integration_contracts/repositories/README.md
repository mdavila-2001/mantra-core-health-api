# Repositorios — integration_contracts

Repositorios **stateless**: cada método recibe el `EntityManager` activo como
primer parámetro, de modo que el servicio controla la unidad de trabajo/transacción
y varios repositorios participan en el mismo `flush`. No contienen reglas de
negocio: solo construcción de consultas y `em.create(...)` con `{ partial: true }`.

| Repositorio | Entidad | Responsabilidad |
|-------------|---------|-----------------|
| `ContractsRepository` | `integration_contracts` | Alta y búsqueda por id / (código, proveedor) |
| `ContractVersionsRepository` | `integration_contract_versions` | Alta, `maxVersionNumber`, versión ACTIVE vigente |
| `AuthProfilesRepository` | `integration_auth_profiles` | Alta y búsqueda de perfiles de autenticación |
| `WebhookSubscriptionsRepository` | `contract_webhook_subscriptions` | Alta, detección de duplicados, activas por contrato |
| `ExchangeRecordsRepository` | `integration_exchange_records` | Alta y búsqueda de registros de intercambio |
| `ExchangeAttemptsRepository` | `integration_exchange_attempts` | Alta, `maxAttemptNumber`, último intento |
| `IdempotencyRecordsRepository` | `integration_idempotency_records` | Alta y búsqueda por (contrato, clave) |
| `SyncCursorsRepository` | `integration_sync_cursors` | Alta y búsqueda por (contrato, scope) |
| `DeliveryEvidenceRepository` | `webhook_delivery_evidence` | Alta de evidencia de entrega |

Notas: `rowVersion` nunca se fija (DEFAULT 1 en BD). Las entidades con auditoría
completa usan `createdBy(actorUserId)`; las de solo `createdAt` fijan la marca
explícitamente.
