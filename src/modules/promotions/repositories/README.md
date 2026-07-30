# Repositorios de promociones

Acceso a `promotions.*` con MikroORM. Sin reglas de negocio.

## Fuente de datos

PostgreSQL, schema `promotions`. Entidades generadas por introspección. Las altas usan
`em.create(..., { partial: true })` **sin flush**: lo cierra la transacción del servicio.

## Repositorios

| Repositorio | Tablas | Métodos destacados |
| --- | --- | --- |
| `PromotionsLoyaltyRepository` | `loyalty_programs`, `loyalty_tiers`, `earning_rules`, `loyalty_memberships`, `points_ledger_entries`, `referral_programs`, `member_referrals` | `createProgram`, `findProgramByCode`, `createTier`, `findTiersByProgram`, `createEarningRule`, `createMembership`, `findMembershipByMember`, `findMembershipForUpdate`, `findMembershipsForSweep`, `createLedgerEntry`, `findLedgerEntryByKey`, `findLedgerByMembership`, `findEarnEntriesInPeriod`, `findExpirableEntries`, `createReferral`, `findReferralByCode`, `findReferralForUpdate`, `findReferralsByReferrer` |
| `PromotionsDiscountsRepository` | `promotions`, `discount_rules`, `coupons`, `redemptions` | `createPromotion`, `findPromotionForUpdate`, `findPromotionByCode`, `createDiscountRule`, `findRulesByPromotion`, `createCoupon`, `findCouponByCodeForUpdate`, `findCouponsByCodes`, `createRedemption`, `findRedemptionForUpdate`, `findRedemptionsByRedeemer`, `findAppliedRedemptions`, `findRedemptionByIntent` |

La división separa lo que el miembro **acumula** de lo que el negocio **descuenta**: comparten
tenant y miembro, pero no ciclo de vida.

## Lecturas con bloqueo

`findMembershipForUpdate`, `findCouponByCodeForUpdate`, `findCouponForUpdate`,
`findPromotionForUpdate`, `findRedemptionForUpdate` y `findReferralForUpdate` usan
`LockMode.PESSIMISTIC_WRITE`. Todas preceden a mutar un contador (saldo, `redemption_count`) o a una
transición de estado que no debe intercalarse.

`findMembershipsForSweep` usa `LockMode.PESSIMISTIC_PARTIAL_WRITE` (FOR UPDATE SKIP LOCKED): el
barrido de expiración corre por lotes y saltar una membresía que otra pasada ya tiene tomada es
justamente lo correcto.

## Idempotencia

`findLedgerEntryByKey` es la consulta más usada del módulo: cada movimiento de puntos se busca por
su clave antes de escribirse. La UNIQUE sobre `idempotency_key` sigue siendo la garantía real ante
concurrencia; esta lectura sólo convierte el reintento en una respuesta en vez de un error.

`findRedemptionByIntent` cumple el mismo papel para el descuento de checkout, por el par
intento-promoción.

## Lecturas por clave natural

`findProgramByCode`, `findPromotionByCode` (tenant + código), `findCouponByCode` y
`findReferralByCode` (códigos globales) anticipan el conflicto de la UNIQUE para devolver un error
de dominio; `findCouponsByCodes` deja que la generación de lotes reintente antes de chocar con ella.

## Consultas de agregación

`findAppliedRedemptions` y `findRedemptionsByRedeemer` devuelven las redenciones vigentes de la
promoción: el servicio cuenta y suma en memoria para los topes y el presupuesto.
`findEarnEntriesInPeriod` acota el ledger de una regla a su ventana para verificar el tope por
periodo. `findLedgerByMembership` trae el ledger completo, que es lo que exige recomputar el saldo
desde la fuente de verdad.

## Rendimiento

Consultas por PK, FK, clave natural o clave de idempotencia, todas indexadas. Sin N+1: nada recorre
relaciones fila por fila.

## Pruebas

Se ejercitan desde los specs de servicio, donde van mockeados. La cobertura real de los bloqueos,
del SKIP LOCKED y de las UNIQUE llega con las pruebas de integración.
