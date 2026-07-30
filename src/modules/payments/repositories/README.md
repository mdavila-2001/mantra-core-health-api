# Repositorios de payments

Encapsulan el acceso a `payments.*` con MikroORM. **Sin reglas de negocio**: construyen y leen
entidades; las precondiciones viven en los servicios.

## Fuente de datos

PostgreSQL, schema `payments`. Las entidades están generadas por introspección; los repositorios
solo las instancian con `em.create(..., { partial: true })` y **sin flush** — el `flush` lo hace la
transacción del servicio al cerrar.

## Repositorios

| Repositorio | Tablas | Métodos |
| --- | --- | --- |
| `PaymentIntentsRepository` | `payment_intents` | `create`, `findById`, `findByIdempotencyKey`, `findByIdForUpdate` |
| `PaymentFlowRepository` | `fx_rate_locks`, `risk_assessments`, `payment_splits`, `payment_checkout_sessions`, `cashier_payment_contexts`, `payment_debts` | `createFxLock`, `findActiveFxLock`, `createRiskAssessment`, `findLatestRiskAssessment`, `createSplit`, `findSplitsByIntent`, `createCheckoutSession`, `createCashierContext`, `findDebtForUpdate` |
| `PaymentTransactionsRepository` | `payment_transactions`, `refunds`, `payment_cancellation_requests` | `create`, `findById`, `findByIdForUpdate`, `findByGatewayRef`, `findByIntent`, `createRefund`, `findRefundsByTransaction`, `createCancellation` |
| `PaymentOperationsRepository` | `fee_schedules`, `transaction_fees`, `gateway_settlements`, `settlement_lines`, `payouts`, `payout_items`, `reconciliation_runs`, `provider_reconciliation_records`, `reconciliation_exceptions` | altas de cada tabla + `findFeeScheduleByCode`, `findSettlementByRef` |

`PaymentFlowRepository` y `PaymentOperationsRepository` agrupan varias tablas porque ninguna es
raíz de agregado por sí sola: todas cuelgan del intent, de la sesión o de una transacción, y
siempre se escriben en la misma transacción que estos.

## Lecturas con bloqueo

`findByIdForUpdate` (intents y transacciones) y `findDebtForUpdate` usan
`LockMode.PESSIMISTIC_WRITE` — el `SELECT ... FOR UPDATE` que exigen los casos de uso. Serializan a
los escritores concurrentes en vez de dejar que uno falle al hacer flush por `row_version`.

## Lecturas por clave natural

`findByIdempotencyKey`, `findByGatewayRef`, `findSettlementByRef` y `findFeeScheduleByCode` existen
para resolver reintentos y correlaciones: permiten responder con el recurso existente en vez de
chocar contra la constraint. **La UNIQUE sigue siendo la garantía real** frente a dos peticiones
simultáneas; estas lecturas solo mejoran la respuesta.

## Auditoría

Todas las altas aplican `createdBy(actorUserId)`, que rellena `created_at`/`updated_at` y el autor.
`row_version` no se toca: la base tiene `DEFAULT 1` y MikroORM la gestiona como columna de versión.

## Rendimiento

Consultas por PK o por columna indexada (clave natural/FK). No hay N+1: los servicios que necesitan
colecciones piden una sola lista (`findSplitsByIntent`, `findRefundsByTransaction`) y agregan en
memoria.

## Pruebas

Se ejercitan indirectamente desde los specs de servicio, donde van mockeados. No hay specs de
repositorio aislados: sin base real solo se estaría verificando el doble de MikroORM, no la consulta.
La cobertura real de las consultas llega con las pruebas de integración (testcontainers).
