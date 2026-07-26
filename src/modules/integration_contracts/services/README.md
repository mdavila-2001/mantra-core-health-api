# Servicios — integration_contracts

Dueños de la unidad de trabajo: inyectan `EntityManager` y escriben con
`em.transactional`; hacen `flush` del padre antes de los hijos (FKs uuid planas).
Validan precondiciones y lanzan excepciones de dominio.

| Servicio | Casos de uso | Reglas clave |
|----------|--------------|--------------|
| `IntegrationContractsService` | UC-31-01, 02, 10, 11 (retire) | Unicidad (código, proveedor); versión max+1; una sola ACTIVE; DRAFT→ACTIVE→RETIRED |
| `IntegrationAuthProfilesService` | UC-31-03, 11 (rotate) | Perfil ACTIVE; rotación → ROTATED/REVOKED; referencias de secreto, nunca plaintext |
| `IntegrationWebhooksService` | UC-31-04, 09 | Suscribir exige contrato ACTIVE; entregar registra intercambio OUTBOUND + evidencia |
| `IntegrationExchangesService` | UC-31-05, 06, 07, 08 | Idempotencia (replay/mismatch); cierre por intento; reintento solo si FAILED retryable; cursor monótono |

Unit tests (`*.spec.ts`) mockean repositorios y `EntityManager`
(`transactional: (cb) => cb(tx)`), cubriendo happy path, not-found (404), conflicto
(409) y rechazo de regla de negocio (422) por método.
