# Repositorios de publicidad

Acceso a `ads.*` con MikroORM. Sin reglas de negocio.

## Fuente de datos

PostgreSQL, schema `ads`. Entidades generadas por introspección. Las altas usan
`em.create(..., { partial: true })` **sin flush**: lo cierra la transacción del servicio.

## Repositorios

| Repositorio | Área | Métodos destacados |
| --- | --- | --- |
| `AdsAccountsRepository` | Business managers, cuentas, socios, conexiones, identidades, sincronización | `createBusinessManager`, `findBusinessManagerByRef`, `createAdAccount`, `findAdAccountForUpdate`, `createAccountUser`, `findPartnerByRef`, `findActiveRelationshipForUpdate`, `createConnection`, `findConnectionByExternalAccount`, `findIdentityAsset`, `findActiveAssignmentForUpdate`, `upsertCheckpoint`, `createSyncRun` |
| `AdsCampaignsRepository` | Jerarquía, segmentación, audiencias, presupuesto, aprendizaje | `createCampaign`, `findCampaignForUpdate`, `createAdSet`, `findAdSetsForRule`, `createPlacement`, `createCreative`, `createCreativeAsset`, `createAd`, `findAdForUpdate`, `createTargetingSpec`, `createCustomAudience`, `createLookalikeSpec`, `createBudgetSchedule`, `findActiveSchedules`, `upsertAttributionSettings`, `createLearningSnapshot` |
| `AdsDataRepository` | Política de datos, insights, conversiones, catálogo | `createEventPolicy`, `findActiveEventPolicy`, `findFieldRules`, `createInsightRun`, `createFactRow`, `findInsightsDaily`, `createInsightsDaily`, `createBillingEvent`, `findInsightsInPeriod`, `findDedupForUpdate`, `createServerEvent`, `createEventUserData`, `createBlockedEvent`, `createOfflineSet`, `findProductByRetailerId`, `countProducts`, `countSetMembers`, `createFeedRunLog` |
| `AdsOptimizationRepository` | Experimentos, reglas, moderación, facturación, leads | `createExperiment`, `createVariant`, `findRuleForUpdate`, `createRuleExecution`, `createReviewEvent`, `findReviewEventByExternalId`, `createViolation`, `findOpenViolations`, `createAppeal`, `findAppealByViolation`, `createInvoice`, `findInvoiceForPeriod`, `createInvoiceLine`, `findSubmissionByExternalId`, `createAnswer`, `createDeliveryEvent` |

Cuatro repositorios para un módulo de 74 tablas: la división sigue el ciclo de vida real —lo que se
**configura**, lo que se **construye**, lo que se **mide** y lo que se **optimiza y cobra**— y no el
schema, que aquí es uno solo.

## Lecturas con bloqueo

`findAdAccountForUpdate` (el gasto acumulado es un contador que tocan varios lotes de ingesta),
`findCampaignForUpdate`, `findAdSetForUpdate`, `findAdForUpdate`, `findConnectionForUpdate`,
`findCatalogForUpdate`, `findFeedForUpdate`, `findDedupForUpdate`, `findViolationForUpdate`,
`findRuleForUpdate`, `findExperimentForUpdate` y `findOfflineSetForUpdate` usan
`LockMode.PESSIMISTIC_WRITE`.

`findActiveRelationshipForUpdate` y `findActiveAssignmentForUpdate` filtran por vigencia abierta
(`valid_to`/`effective_to` nulos) y bloquean: abrir dos vigencias en paralelo dejaría sin respuesta
la pregunta de qué está vigente hoy.

`findAdSetsForRule` usa `LockMode.PESSIMISTIC_PARTIAL_WRITE` (FOR UPDATE SKIP LOCKED): las reglas se
evalúan en paralelo por cuenta y saltar lo que otra pasada ya tiene tomado es lo correcto.

## Lecturas de idempotencia

`findAdAccountByRef`, `findBusinessManagerByRef`, `findPartnerByRef`,
`findConnectionByExternalAccount`, `findIdentityAsset`, `findProductByRetailerId`,
`findReviewEventByExternalId`, `findSubmissionByExternalId`, `findInvoiceByNumber` y
`findInvoiceForPeriod` anticipan la UNIQUE correspondiente. Es lo que convierte la reentrega de un
webhook o la repetición de un feed en una respuesta en vez de un error.

## Upserts

`upsertCheckpoint` y `upsertAttributionSettings` reciben la fila existente (o `null`) y deciden
entre mutar y crear. El repositorio no consulta por su cuenta: quien conoce el criterio de búsqueda
es el servicio, y así la lectura entra en la misma transacción que la escritura.

## Contadores derivados

`countProducts` y `countSetMembers` existen para recalcular `item_count` y `product_count` después
de una corrida de feed. Son `COUNT` sobre índice, no carga de colecciones.

## Rendimiento

Consultas por PK, FK, clave natural o identificador externo, todas indexadas. Las de rango
(`findInsightsInPeriod`, `findBillingEventsInPeriod`) filtran por fecha, que en el modelo lleva BRIN.
Sin N+1: nada recorre relaciones fila por fila.

## Pruebas

Se ejercitan desde los specs de servicio, donde van mockeados. La cobertura real de los bloqueos,
del SKIP LOCKED y de las UNIQUE llega con las pruebas de integración.
