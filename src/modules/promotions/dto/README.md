# DTO de promociones

Contratos de entrada/salida con `class-validator` y anotaciones Swagger, en un único archivo
(`promotions.dto.ts`) porque los 13 casos de uso comparten vocabulario (miembro, importe, premio).

## Convenciones

- **Puntos e importes como cadena decimal** (`@IsNumberString`): el modelo usa `numeric`, y pasarlos
  por `number` introduciría error de coma flotante en dinero y en saldos.
- **Fechas** ISO-8601 (`@IsISO8601()`), convertidas a `Date` en el servicio.
- **Enums de dominio por código legible** (`POINTS`, `PERCENTAGE`, `SINGLE_USE`, `FIRST_BOOKING`…);
  el servicio los traduce al `*_concept_id` del catálogo.
- **Colecciones anidadas** (`tiers`, `earningRules`, `rules`) con `@ValidateNested({ each: true })` y
  `@Type`. `tiers` y `rules` llevan `@ArrayMinSize(1)`: un programa sin niveles no puede colocar a
  nadie y una promoción sin reglas no descuenta nada.
- **Lotes acotados** (`@Max(1000)` en `quantity` y en `batchSize`): emitir cupones y barrer puntos
  son operaciones transaccionales, y un lote sin techo mantendría la transacción abierta demasiado.

## Clave de idempotencia

`EarnPointsDto` y `RedeemPointsDto` la reciben **obligatoria**. Es el contrato con quien llama: sin
ella no hay forma de distinguir un segundo evento real de la reentrega del primero. Las demás claves
del módulo las deriva el servicio (del bono de bienvenida, de la entrada vencida, del referido, de
la redención revertida) porque ahí sí hay un identificador natural.

## DTO por área

| Área | Entrada | Respuesta |
| --- | --- | --- |
| Programa | `CreateLoyaltyProgramDto` (+ `LoyaltyTierDto`, `EarningRuleDto`) | `LoyaltyProgramResponseDto` |
| Membresía | `EnrollMemberDto` | `MembershipResponseDto` |
| Puntos | `EarnPointsDto`, `RedeemPointsDto` | `PointsLedgerResponseDto`, `RecomputeBalanceResponseDto` |
| Expiración | `ExpirePointsDto` | `ExpirePointsResponseDto` |
| Promoción | `CreatePromotionDto` (+ `DiscountRuleDto`) | `PromotionResponseDto` |
| Cupones | `IssueCouponsDto` | `IssueCouponsResponseDto` |
| Redención | `ValidateCouponDto`, `CreateRedemptionDto`, `ApplyDiscountDto`, `ReverseRedemptionDto` | `ValidateCouponResponseDto`, `RedemptionResponseDto`, `ApplyDiscountResponseDto`, `ReverseRedemptionResponseDto` |
| Referidos | `CreateReferralDto`, `QualifyReferralDto` | `ReferralResponseDto`, `QualifyReferralResponseDto` |

`CreateRedemptionDto` extiende `ValidateCouponDto`: redimir es validar y además dejar constancia, y
heredar evita que los dos contratos se separen con el tiempo.

## Campos que no se aceptan

`pointsBalance`, `lifetimePoints`, `redemptionCount`, `version` y el código del cupón o del referido
son derivados o generados: el cliente los recibe, nunca los envía. El referidor tampoco viaja en el
cuerpo — sale del token.

## Respuestas con `duplicate`

`PointsLedgerResponseDto` y `ApplyDiscountResponseDto` incluyen `duplicate`. Sin él, quien reintenta
no distinguiría "se aplicó ahora" de "ya estaba aplicado", que es exactamente lo que necesita saber
un worker que reentrega eventos.

## Ejemplo de solicitud

```json
POST /loyalty/memberships/{id}/points/earn
{
  "earningRuleId": "22222222-2222-2222-2222-222222222222",
  "idempotencyKey": "booking-completed:9f2c…",
  "sourceType": "appointment_booking",
  "sourceRefId": "33333333-3333-3333-3333-333333333333"
}
```

## Ejemplo de respuesta

```json
{
  "ledgerEntryId": "44444444-4444-4444-4444-444444444444",
  "membershipId": "11111111-1111-1111-1111-111111111111",
  "points": "20.00",
  "balanceAfter": "70.00",
  "lifetimePoints": "70.00",
  "currentTierId": "55555555-5555-5555-5555-555555555555",
  "duplicate": false
}
```

`points` puede no coincidir con lo que declara la regla: el multiplicador del nivel actual ya está
aplicado.
