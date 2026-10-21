<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `promotions`

- **Bloque:** Marketing y Crecimiento (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)
- **Operaciones:** 15 (15 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 13 · BAJO 2
- **Tablas distintas que tocan:** 13
- **Respuestas de error y detalle contractual:** `openapi/endpoints/promotions.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/checkout/{orderId}/apply-discount` | Aplicar un descuento al intento de pago del checkout | MEDIO | 6 | CASHIER, PROMOTIONS_ADMIN |
| 2 | POST | `/coupons/validate` | Validar un cupón contra una orden | BAJO | 4 | CASHIER, PROMOTIONS_ADMIN |
| 3 | POST | `/loyalty/jobs/expire-points` | Barrer los puntos vencidos de un programa | MEDIO | 4 | SYSTEM |
| 4 | POST | `/loyalty/memberships/{id}/points/earn` | Acumular puntos por un evento de la aplicación | MEDIO | 7 | SYSTEM, PROMOTIONS_ADMIN |
| 5 | POST | `/loyalty/memberships/{id}/points/redeem` | Canjear puntos | MEDIO | 4 | MEMBER, PROMOTIONS_ADMIN |
| 6 | POST | `/loyalty/memberships/{id}/recompute` | Reproyectar saldo y nivel desde el ledger | MEDIO | 4 | SYSTEM, PROMOTIONS_ADMIN |
| 7 | GET | `/loyalty/programs` | Listar programas de lealtad activos | BAJO | 1 | SYSTEM, PROMOTIONS_ADMIN, MARKETING_MANAGER |
| 8 | POST | `/loyalty/programs` | Crear un programa de lealtad con niveles y reglas | MEDIO | 4 | PROMOTIONS_ADMIN, MARKETING_MANAGER |
| 9 | POST | `/loyalty/programs/{id}/memberships` | Inscribir a un miembro en el programa | MEDIO | 6 | PROMOTIONS_ADMIN, MEMBER |
| 10 | POST | `/promotions` | Crear una promoción con sus reglas de descuento | MEDIO | 3 | PROMOTIONS_ADMIN, MARKETING_MANAGER |
| 11 | POST | `/promotions/{id}/coupons/batch` | Emitir un lote de cupones | MEDIO | 3 | PROMOTIONS_ADMIN, MARKETING_MANAGER |
| 12 | POST | `/redemptions` | Redimir un cupón y registrar la redención | MEDIO | 5 | CASHIER, PROMOTIONS_ADMIN |
| 13 | POST | `/redemptions/{id}/reverse` | Revertir una redención por devolución o cancelación | MEDIO | 8 | CASHIER, PROMOTIONS_ADMIN |
| 14 | POST | `/referral-programs/{id}/referrals` | Generar el código de referido del miembro | MEDIO | 3 | MEMBER, PROMOTIONS_ADMIN |
| 15 | POST | `/referrals/{id}/qualify` | Calificar el referido y premiar a ambas partes | MEDIO | 13 | SYSTEM, PROMOTIONS_ADMIN |

---

## 1. POST /checkout/{orderId}/apply-discount

- **Origen:** CONTRATO
- **Nombre:** Aplicar un descuento al intento de pago del checkout
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PromotionsController.applyDiscount` — `src/modules/promotions/controllers/promotions.controller.ts:96`

### Qué es y para qué sirve (negocio)

Aplicar un descuento al intento de pago del checkout. Caso de uso UC-51-10: Descuento en checkout. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /checkout/{orderId}/apply-discount` la atiende `PromotionsController.applyDiscount` (src/modules/promotions/controllers/promotions.controller.ts:96). Exige sesión con alguno de los roles CASHIER, PROMOTIONS_ADMIN. Valida el cuerpo como `ApplyDiscountDto` (7 campos, 4 obligatorios). Delega en `PromotionsDiscountsService.applyDiscount`. Crea filas en promotions.redemptions. Actualiza promotions.coupons. Lee promotions.coupons, promotions.discount_rules, promotions.promotions, promotions.redemptions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CASHIER, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/promotions.controller.ts:96` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: orderId | `src/modules/promotions/controllers/promotions.controller.ts:96` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.coupons` | ESCRIBE | ACTUALIZA | POR_TIPO | PromotionsController.applyDiscount → PromotionsDiscountsService.applyDiscount | `src/modules/promotions/services/promotions-discounts.service.ts:465` |
| `promotions.coupons` | LEE | LEE | DIRECTA | PromotionsController.applyDiscount → PromotionsDiscountsService.applyDiscount → PromotionsDiscountsService.evaluateCouponForUpdate → PromotionsDiscountsRepository.findCouponByCodeForUpdate | `src/modules/promotions/repositories/promotions-discounts.repository.ts:406` |
| `promotions.discount_rules` | LEE | LEE | DIRECTA | PromotionsController.applyDiscount → PromotionsDiscountsService.applyDiscount → PromotionsDiscountsRepository.findRulesByPromotion | `src/modules/promotions/repositories/promotions-discounts.repository.ts:358` |
| `promotions.promotions` | LEE | LEE | DIRECTA | PromotionsController.applyDiscount → PromotionsDiscountsService.applyDiscount → PromotionsDiscountsRepository.findPromotionForUpdate | `src/modules/promotions/repositories/promotions-discounts.repository.ts:293` |
| `promotions.redemptions` | ESCRIBE | CREA | DIRECTA | PromotionsController.applyDiscount → PromotionsDiscountsService.applyDiscount → PromotionsDiscountsRepository.createRedemption | `src/modules/promotions/repositories/promotions-discounts.repository.ts:443` |
| `promotions.redemptions` | LEE | LEE | DIRECTA | PromotionsController.applyDiscount → PromotionsDiscountsService.applyDiscount → PromotionsDiscountsRepository.findRedemptionByIntent | `src/modules/promotions/repositories/promotions-discounts.repository.ts:514` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `orderId` | path | Sí | `string` | — |

### Cuerpo — DTO `ApplyDiscountDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `paymentIntentId` | `string` | Sí | formato uuid | `@IsUUID()` | Intento de pago sobre el que se descuenta | `src/modules/promotions/dto/promotions.dto.ts:1251` |
| `orderAmount` | `string` | Sí | — | `@IsNumberString()` | Importe bruto del intento, como cadena decimal | `src/modules/promotions/dto/promotions.dto.ts:1260` |
| `redeemerType` | `string` | Sí | valores: USER, PATIENT | `@IsIn(REWARD_MEMBER_TYPES)` | — | `src/modules/promotions/dto/promotions.dto.ts:1267` |
| `redeemerRefId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/promotions/dto/promotions.dto.ts:1274` |
| `couponCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código del cupón cuando el descuento lo exige | `src/modules/promotions/dto/promotions.dto.ts:1285` |
| `promotionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Promoción automática a aplicar | `src/modules/promotions/dto/promotions.dto.ts:1296` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/promotions/dto/promotions.dto.ts:1304` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "paymentIntentId": "00000000-0000-4000-8000-000000000001",
  "orderAmount": "valor-ejemplo",
  "redeemerType": "USER",
  "redeemerRefId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "paymentIntentId": "00000000-0000-4000-8000-000000000001",
  "orderAmount": "valor-ejemplo",
  "redeemerType": "USER",
  "redeemerRefId": "00000000-0000-4000-8000-000000000001",
  "couponCode": "CODIGO_EJEMPLO",
  "promotionId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ApplyDiscountResponseDto>` · DTO `ApplyDiscountResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `redemptionId` | `string` | Sí | formato uuid | — | Identificador asociado a redemption. | `src/modules/promotions/dto/promotions.dto.ts:1315` |
| `paymentIntentId` | `string` | Sí | formato uuid | — | Identificador asociado a payment intent. | `src/modules/promotions/dto/promotions.dto.ts:1321` |
| `discountAmount` | `string` | Sí | — | — | Descuento aplicado | `src/modules/promotions/dto/promotions.dto.ts:1327` |
| `netAmount` | `string` | Sí | — | — | Importe neto resultante para el intento de pago | `src/modules/promotions/dto/promotions.dto.ts:1335` |
| `duplicate` | `boolean` | Sí | — | — | true si el descuento ya estaba aplicado a este intento | `src/modules/promotions/dto/promotions.dto.ts:1343` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:221` |

### Flujos

_Se completa en la fase de flujos._

---

## 2. POST /coupons/validate

- **Origen:** CONTRATO
- **Nombre:** Validar un cupón contra una orden
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PromotionsController.validateCoupon` — `src/modules/promotions/controllers/promotions.controller.ts:70`

### Qué es y para qué sirve (negocio)

Validar un cupón contra una orden. Caso de uso UC-51-09: Validar y redimir cupón. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /coupons/validate` la atiende `PromotionsController.validateCoupon` (src/modules/promotions/controllers/promotions.controller.ts:70). Exige sesión con alguno de los roles CASHIER, PROMOTIONS_ADMIN. Valida el cuerpo como `ValidateCouponDto` (4 campos, 4 obligatorios). Delega en `PromotionsDiscountsService.validateCoupon`. Lee promotions.coupons, promotions.discount_rules, promotions.promotions, promotions.redemptions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CASHIER, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/promotions.controller.ts:70` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.coupons` | LEE | LEE | DIRECTA | PromotionsController.validateCoupon → PromotionsDiscountsService.validateCoupon → PromotionsDiscountsRepository.findCouponByCode | `src/modules/promotions/repositories/promotions-discounts.repository.ts:398` |
| `promotions.discount_rules` | LEE | LEE | DIRECTA | PromotionsController.validateCoupon → PromotionsDiscountsService.validateCoupon → PromotionsDiscountsRepository.findRulesByPromotion | `src/modules/promotions/repositories/promotions-discounts.repository.ts:358` |
| `promotions.promotions` | LEE | LEE | DIRECTA | PromotionsController.validateCoupon → PromotionsDiscountsService.validateCoupon → PromotionsDiscountsRepository.findPromotionById | `src/modules/promotions/repositories/promotions-discounts.repository.ts:279` |
| `promotions.redemptions` | LEE | LEE | DIRECTA | PromotionsController.validateCoupon → PromotionsDiscountsService.validateCoupon → PromotionsDiscountsService.perUserRejection → PromotionsDiscountsRepository.findRedemptionsByRedeemer | `src/modules/promotions/repositories/promotions-discounts.repository.ts:489` |

### Cuerpo — DTO `ValidateCouponDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del cupón | `src/modules/promotions/dto/promotions.dto.ts:1108` |
| `orderAmount` | `string` | Sí | — | `@IsNumberString()` | Importe de la orden, como cadena decimal | `src/modules/promotions/dto/promotions.dto.ts:1115` |
| `redeemerType` | `string` | Sí | valores: USER, PATIENT | `@IsIn(REWARD_MEMBER_TYPES)` | — | `src/modules/promotions/dto/promotions.dto.ts:1122` |
| `redeemerRefId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/promotions/dto/promotions.dto.ts:1129` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "orderAmount": "valor-ejemplo",
  "redeemerType": "USER",
  "redeemerRefId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "orderAmount": "valor-ejemplo",
  "redeemerType": "USER",
  "redeemerRefId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ValidateCouponResponseDto>` · DTO `ValidateCouponResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `valid` | `boolean` | Sí | — | — | ¿El cupón puede usarse en esta orden? | `src/modules/promotions/dto/promotions.dto.ts:1140` |
| `reason` | `string` | No | — | — | Motivo del rechazo cuando no es válido | `src/modules/promotions/dto/promotions.dto.ts:1148` |
| `promotionId` | `string` | No | formato uuid | — | Identificador asociado a promotion. | `src/modules/promotions/dto/promotions.dto.ts:1154` |
| `discountRuleId` | `string` | No | formato uuid | — | Regla que da el mejor descuento | `src/modules/promotions/dto/promotions.dto.ts:1163` |
| `discountAmount` | `string` | No | — | — | Descuento que se aplicaría | `src/modules/promotions/dto/promotions.dto.ts:1169` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:201` |

### Flujos

_Se completa en la fase de flujos._

---

## 3. POST /loyalty/jobs/expire-points

- **Origen:** CONTRATO
- **Nombre:** Barrer los puntos vencidos de un programa
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.expirePoints` — `src/modules/promotions/controllers/loyalty.controller.ts:164`

### Qué es y para qué sirve (negocio)

Barrer los puntos vencidos de un programa. Caso de uso UC-51-06: Barrido de puntos vencidos. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /loyalty/jobs/expire-points` la atiende `LoyaltyController.expirePoints` (src/modules/promotions/controllers/loyalty.controller.ts:164). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `ExpirePointsDto` (2 campos, 1 obligatorio). Delega en `PromotionsLoyaltyService.expirePoints`. Crea filas en promotions.points_ledger_entries. Actualiza promotions.loyalty_memberships. Lee promotions.loyalty_memberships, promotions.points_ledger_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/promotions/controllers/loyalty.controller.ts:164` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.loyalty_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | LoyaltyController.expirePoints → PromotionsLoyaltyService.expirePoints | `src/modules/promotions/services/promotions-loyalty.service.ts:706` |
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.expirePoints → PromotionsLoyaltyService.expirePoints → PromotionsLoyaltyRepository.findMembershipsForSweep | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:536` |
| `promotions.points_ledger_entries` | ESCRIBE | CREA | DIRECTA | LoyaltyController.expirePoints → PromotionsLoyaltyService.expirePoints → PromotionsLoyaltyRepository.createLedgerEntry | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:560` |
| `promotions.points_ledger_entries` | LEE | LEE | DIRECTA | LoyaltyController.expirePoints → PromotionsLoyaltyService.expirePoints → PromotionsLoyaltyRepository.findExpirableEntries | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:622` |

### Cuerpo — DTO `ExpirePointsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `loyaltyProgramId` | `string` | Sí | formato uuid | `@IsUUID()` | Programa cuyas membresías se barren | `src/modules/promotions/dto/promotions.dto.ts:623` |
| `batchSize` | `number` | No | mínimo 1; máximo 1000 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(1000)` | Tamaño del lote | `src/modules/promotions/dto/promotions.dto.ts:633` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "loyaltyProgramId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "loyaltyProgramId": "00000000-0000-4000-8000-000000000001",
  "batchSize": 100
}
```

</details>

### Respuesta — `Promise<ExpirePointsResponseDto>` · DTO `ExpirePointsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `scanned` | `number` | Sí | — | — | Membresías revisadas en este lote | `src/modules/promotions/dto/promotions.dto.ts:644` |
| `affected` | `number` | Sí | — | — | Membresías a las que se les expiraron puntos | `src/modules/promotions/dto/promotions.dto.ts:650` |
| `pointsExpired` | `string` | Sí | — | — | Total de puntos expirados | `src/modules/promotions/dto/promotions.dto.ts:656` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:107` |

### Flujos

_Se completa en la fase de flujos._

---

## 4. POST /loyalty/memberships/{id}/points/earn

- **Origen:** CONTRATO
- **Nombre:** Acumular puntos por un evento de la aplicación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.earnPoints` — `src/modules/promotions/controllers/loyalty.controller.ts:114`

### Qué es y para qué sirve (negocio)

Acumular puntos por un evento de la aplicación. Caso de uso UC-51-03: Acumular puntos (idempotente). Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:12`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /loyalty/memberships/{id}/points/earn` la atiende `LoyaltyController.earnPoints` (src/modules/promotions/controllers/loyalty.controller.ts:114). Exige sesión con alguno de los roles SYSTEM, PROMOTIONS_ADMIN. Valida el cuerpo como `EarnPointsDto` (5 campos, 2 obligatorios). Delega en `PromotionsLoyaltyService.earnPoints`. Crea filas en promotions.points_ledger_entries. Actualiza promotions.loyalty_memberships. Lee promotions.earning_rules, promotions.loyalty_memberships, promotions.loyalty_programs, promotions.loyalty_tiers, promotions.points_ledger_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/loyalty.controller.ts:114` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/loyalty.controller.ts:114` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.earning_rules` | LEE | LEE | DIRECTA | LoyaltyController.earnPoints → PromotionsLoyaltyService.earnPoints → PromotionsLoyaltyRepository.findEarningRuleById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:460` |
| `promotions.loyalty_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | LoyaltyController.earnPoints → PromotionsLoyaltyService.earnPoints | `src/modules/promotions/services/promotions-loyalty.service.ts:482` |
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.earnPoints → PromotionsLoyaltyService.earnPoints → PromotionsLoyaltyRepository.findMembershipForUpdate | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:512` |
| `promotions.loyalty_programs` | LEE | LEE | DIRECTA | LoyaltyController.earnPoints → PromotionsLoyaltyService.earnPoints → PromotionsLoyaltyRepository.findProgramById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:335` |
| `promotions.loyalty_tiers` | LEE | LEE | DIRECTA | LoyaltyController.earnPoints → PromotionsLoyaltyService.earnPoints → PromotionsLoyaltyRepository.findTiersByProgram | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:408` |
| `promotions.points_ledger_entries` | ESCRIBE | CREA | DIRECTA | LoyaltyController.earnPoints → PromotionsLoyaltyService.earnPoints → PromotionsLoyaltyRepository.createLedgerEntry | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:560` |
| `promotions.points_ledger_entries` | LEE | LEE | DIRECTA | LoyaltyController.earnPoints → PromotionsLoyaltyService.earnPoints → PromotionsLoyaltyRepository.findLedgerEntryByKey | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:586` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `EarnPointsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `earningRuleId` | `string` | Sí | formato uuid | `@IsUUID()` | Regla que justifica la acumulación | `src/modules/promotions/dto/promotions.dto.ts:440` |
| `idempotencyKey` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Clave de idempotencia; un reintento con la misma clave no acumula dos veces | `src/modules/promotions/dto/promotions.dto.ts:452` |
| `sourceType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo del origen del evento | `src/modules/promotions/dto/promotions.dto.ts:464` |
| `sourceRefId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Identificador del evento de origen | `src/modules/promotions/dto/promotions.dto.ts:475` |
| `occurredAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo ocurrió el evento | `src/modules/promotions/dto/promotions.dto.ts:486` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "earningRuleId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "earningRuleId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo",
  "sourceType": "valor-ejemplo",
  "sourceRefId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<PointsLedgerResponseDto>` · DTO `PointsLedgerResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ledgerEntryId` | `string` | Sí | formato uuid | — | Entrada del ledger | `src/modules/promotions/dto/promotions.dto.ts:526` |
| `membershipId` | `string` | Sí | formato uuid | — | Identificador asociado a membership. | `src/modules/promotions/dto/promotions.dto.ts:532` |
| `points` | `string` | Sí | — | — | Puntos del movimiento | `src/modules/promotions/dto/promotions.dto.ts:538` |
| `balanceAfter` | `string` | Sí | — | — | Saldo tras el movimiento | `src/modules/promotions/dto/promotions.dto.ts:544` |
| `lifetimePoints` | `string` | Sí | — | — | Puntos de por vida tras el movimiento | `src/modules/promotions/dto/promotions.dto.ts:550` |
| `currentTierId` | `string` | No | formato uuid | — | Nivel actual tras recalcular | `src/modules/promotions/dto/promotions.dto.ts:559` |
| `duplicate` | `boolean` | Sí | — | — | true si la clave de idempotencia ya se había usado | `src/modules/promotions/dto/promotions.dto.ts:567` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:78` |

### Flujos

_Se completa en la fase de flujos._

---

## 5. POST /loyalty/memberships/{id}/points/redeem

- **Origen:** CONTRATO
- **Nombre:** Canjear puntos
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.redeemPoints` — `src/modules/promotions/controllers/loyalty.controller.ts:131`

### Qué es y para qué sirve (negocio)

Canjear puntos. Caso de uso UC-51-04: Canjear puntos (idempotente). Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /loyalty/memberships/{id}/points/redeem` la atiende `LoyaltyController.redeemPoints` (src/modules/promotions/controllers/loyalty.controller.ts:131). Exige sesión con alguno de los roles MEMBER, PROMOTIONS_ADMIN. Valida el cuerpo como `RedeemPointsDto` (3 campos, 2 obligatorios). Delega en `PromotionsLoyaltyService.redeemPoints`. Crea filas en promotions.points_ledger_entries. Actualiza promotions.loyalty_memberships. Lee promotions.loyalty_memberships, promotions.points_ledger_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MEMBER, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/loyalty.controller.ts:131` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/loyalty.controller.ts:131` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.loyalty_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | LoyaltyController.redeemPoints → PromotionsLoyaltyService.redeemPoints | `src/modules/promotions/services/promotions-loyalty.service.ts:562` |
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.redeemPoints → PromotionsLoyaltyService.redeemPoints → PromotionsLoyaltyRepository.findMembershipForUpdate | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:512` |
| `promotions.points_ledger_entries` | ESCRIBE | CREA | DIRECTA | LoyaltyController.redeemPoints → PromotionsLoyaltyService.redeemPoints → PromotionsLoyaltyRepository.createLedgerEntry | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:560` |
| `promotions.points_ledger_entries` | LEE | LEE | DIRECTA | LoyaltyController.redeemPoints → PromotionsLoyaltyService.redeemPoints → PromotionsLoyaltyRepository.findLedgerEntryByKey | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:586` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RedeemPointsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `points` | `string` | Sí | — | `@IsNumberString()` | Puntos a canjear | `src/modules/promotions/dto/promotions.dto.ts:496` |
| `idempotencyKey` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Clave de idempotencia del canje | `src/modules/promotions/dto/promotions.dto.ts:507` |
| `awardType` | `string` | No | valores: POINTS, WALLET_CREDIT | `@IsOptional()` `@IsIn(AWARD_TYPES)` | — | `src/modules/promotions/dto/promotions.dto.ts:515` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "points": "valor-ejemplo",
  "idempotencyKey": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "points": "valor-ejemplo",
  "idempotencyKey": "valor-ejemplo",
  "awardType": "POINTS"
}
```

</details>

### Respuesta — `Promise<PointsLedgerResponseDto>` · DTO `PointsLedgerResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ledgerEntryId` | `string` | Sí | formato uuid | — | Entrada del ledger | `src/modules/promotions/dto/promotions.dto.ts:526` |
| `membershipId` | `string` | Sí | formato uuid | — | Identificador asociado a membership. | `src/modules/promotions/dto/promotions.dto.ts:532` |
| `points` | `string` | Sí | — | — | Puntos del movimiento | `src/modules/promotions/dto/promotions.dto.ts:538` |
| `balanceAfter` | `string` | Sí | — | — | Saldo tras el movimiento | `src/modules/promotions/dto/promotions.dto.ts:544` |
| `lifetimePoints` | `string` | Sí | — | — | Puntos de por vida tras el movimiento | `src/modules/promotions/dto/promotions.dto.ts:550` |
| `currentTierId` | `string` | No | formato uuid | — | Nivel actual tras recalcular | `src/modules/promotions/dto/promotions.dto.ts:559` |
| `duplicate` | `boolean` | Sí | — | — | true si la clave de idempotencia ya se había usado | `src/modules/promotions/dto/promotions.dto.ts:567` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:79` |

### Flujos

_Se completa en la fase de flujos._

---

## 6. POST /loyalty/memberships/{id}/recompute

- **Origen:** CONTRATO
- **Nombre:** Reproyectar saldo y nivel desde el ledger
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.recomputeBalance` — `src/modules/promotions/controllers/loyalty.controller.ts:148`

### Qué es y para qué sirve (negocio)

Reproyectar saldo y nivel desde el ledger. Caso de uso UC-51-05: Reproyectar saldo y nivel. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /loyalty/memberships/{id}/recompute` la atiende `LoyaltyController.recomputeBalance` (src/modules/promotions/controllers/loyalty.controller.ts:148). Exige sesión con alguno de los roles SYSTEM, PROMOTIONS_ADMIN. Delega en `PromotionsLoyaltyService.recomputeBalance`. Actualiza promotions.loyalty_memberships. Lee promotions.loyalty_memberships, promotions.loyalty_tiers, promotions.points_ledger_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/loyalty.controller.ts:148` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/loyalty.controller.ts:148` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.loyalty_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | LoyaltyController.recomputeBalance → PromotionsLoyaltyService.recomputeBalance | `src/modules/promotions/services/promotions-loyalty.service.ts:602` |
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.recomputeBalance → PromotionsLoyaltyService.recomputeBalance → PromotionsLoyaltyRepository.findMembershipForUpdate | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:512` |
| `promotions.loyalty_tiers` | LEE | LEE | DIRECTA | LoyaltyController.recomputeBalance → PromotionsLoyaltyService.recomputeBalance → PromotionsLoyaltyRepository.findTiersByProgram | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:408` |
| `promotions.points_ledger_entries` | LEE | LEE | DIRECTA | LoyaltyController.recomputeBalance → PromotionsLoyaltyService.recomputeBalance → PromotionsLoyaltyRepository.findLedgerByMembership | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:594` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RecomputeBalanceResponseDto>` · DTO `RecomputeBalanceResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `membershipId` | `string` | Sí | formato uuid | — | Identificador asociado a membership. | `src/modules/promotions/dto/promotions.dto.ts:582` |
| `pointsBalance` | `string` | Sí | — | — | Saldo reproyectado desde el ledger | `src/modules/promotions/dto/promotions.dto.ts:588` |
| `lifetimePoints` | `string` | Sí | — | — | Valor de lifetime points mantenido por la instancia. | `src/modules/promotions/dto/promotions.dto.ts:594` |
| `currentTierId` | `string` | No | formato uuid | — | Identificador asociado a current tier. | `src/modules/promotions/dto/promotions.dto.ts:600` |
| `tierChanged` | `boolean` | Sí | — | — | true si el nivel cambió al recalcular | `src/modules/promotions/dto/promotions.dto.ts:606` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:97` |

### Flujos

_Se completa en la fase de flujos._

---

## 7. GET /loyalty/programs

- **Origen:** CONTRATO
- **Nombre:** Listar programas de lealtad activos
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.listActivePrograms` — `src/modules/promotions/controllers/loyalty.controller.ts:57`

### Qué es y para qué sirve (negocio)

Listar programas de lealtad activos. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /loyalty/programs` la atiende `LoyaltyController.listActivePrograms` (src/modules/promotions/controllers/loyalty.controller.ts:57). Exige sesión con alguno de los roles SYSTEM, PROMOTIONS_ADMIN, MARKETING_MANAGER. Delega en `PromotionsLoyaltyService.listActivePrograms`. Lee promotions.loyalty_programs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PROMOTIONS_ADMIN, MARKETING_MANAGER | `src/modules/promotions/controllers/loyalty.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.loyalty_programs` | LEE | LEE | DIRECTA | LoyaltyController.listActivePrograms → PromotionsLoyaltyService.listActivePrograms → PromotionsLoyaltyRepository.findActivePrograms | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:369` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | Tamaño máximo del lote |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListActiveLoyaltyProgramsResponseDto>` · DTO `ListActiveLoyaltyProgramsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `programs` | `array<ActiveLoyaltyProgramSummaryDto>` | Sí | — | — | Valor de programs mantenido por la instancia. | `src/modules/promotions/dto/promotions.dto.ts:703` |
| `programs[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/promotions/dto/promotions.dto.ts:682` |
| `programs[].code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/promotions/dto/promotions.dto.ts:688` |
| `programs[].name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/promotions/dto/promotions.dto.ts:694` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:119` |

### Flujos

_Se completa en la fase de flujos._

---

## 8. POST /loyalty/programs

- **Origen:** CONTRATO
- **Nombre:** Crear un programa de lealtad con niveles y reglas
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.createProgram` — `src/modules/promotions/controllers/loyalty.controller.ts:83`

### Qué es y para qué sirve (negocio)

Crear un programa de lealtad con niveles y reglas. Caso de uso UC-51-01: Programa de lealtad con niveles y reglas. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:10`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /loyalty/programs` la atiende `LoyaltyController.createProgram` (src/modules/promotions/controllers/loyalty.controller.ts:83). Exige sesión con alguno de los roles PROMOTIONS_ADMIN, MARKETING_MANAGER. Valida el cuerpo como `CreateLoyaltyProgramDto` (28 campos, 8 obligatorios). Delega en `PromotionsLoyaltyService.createProgram`. Crea filas en promotions.earning_rules, promotions.loyalty_programs, promotions.loyalty_tiers. Lee promotions.loyalty_programs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PROMOTIONS_ADMIN, MARKETING_MANAGER | `src/modules/promotions/controllers/loyalty.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.earning_rules` | ESCRIBE | CREA | DIRECTA | LoyaltyController.createProgram → PromotionsLoyaltyService.createProgram → PromotionsLoyaltyRepository.createEarningRule | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:426` |
| `promotions.loyalty_programs` | ESCRIBE | CREA | DIRECTA | LoyaltyController.createProgram → PromotionsLoyaltyService.createProgram → PromotionsLoyaltyRepository.createProgram | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:305` |
| `promotions.loyalty_programs` | LEE | LEE | DIRECTA | LoyaltyController.createProgram → PromotionsLoyaltyService.createProgram → PromotionsLoyaltyRepository.findProgramByCode | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:351` |
| `promotions.loyalty_tiers` | ESCRIBE | CREA | DIRECTA | LoyaltyController.createProgram → PromotionsLoyaltyService.createProgram → PromotionsLoyaltyRepository.createTier | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:387` |

### Cuerpo — DTO `CreateLoyaltyProgramDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/promotions/dto/promotions.dto.ts:215` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del programa, único por tenant | `src/modules/promotions/dto/promotions.dto.ts:226` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/promotions/dto/promotions.dto.ts:234` |
| `programType` | `string` | Sí | valores: POINTS, TIERED | `@IsIn(['POINTS', 'TIERED'])` | — | `src/modules/promotions/dto/promotions.dto.ts:241` |
| `pointsCurrencyName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Nombre de la moneda de puntos ("Estrellas") | `src/modules/promotions/dto/promotions.dto.ts:252` |
| `pointToCurrencyRate` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Cuánto vale un punto en moneda, como cadena decimal | `src/modules/promotions/dto/promotions.dto.ts:262` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/promotions/dto/promotions.dto.ts:270` |
| `expiryPolicy` | `string` | No | valores: NEVER, ROLLING | `@IsOptional()` `@IsIn(['NEVER', 'ROLLING'])` | — | `src/modules/promotions/dto/promotions.dto.ts:278` |
| `pointsExpiryDays` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Días de vigencia de los puntos; obligatorio si la política es ROLLING | `src/modules/promotions/dto/promotions.dto.ts:290` |
| `tiers` | `array<LoyaltyTierDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => LoyaltyTierDto)` | Niveles del programa, al menos uno | `src/modules/promotions/dto/promotions.dto.ts:303` |
| `tiers[].code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/promotions/dto/promotions.dto.ts:49` |
| `tiers[].name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/promotions/dto/promotions.dto.ts:57` |
| `tiers[].minPoints` | `string` | Sí | — | `@IsNumberString()` | Puntos de por vida a partir de los cuales aplica el nivel | `src/modules/promotions/dto/promotions.dto.ts:66` |
| `tiers[].multiplier` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Multiplicador de acumulación del nivel | `src/modules/promotions/dto/promotions.dto.ts:76` |
| `tiers[].benefitsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Beneficios del nivel | `src/modules/promotions/dto/promotions.dto.ts:84` |
| `earningRules` | `array<EarningRuleDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => EarningRuleDto)` | Reglas de acumulación | `src/modules/promotions/dto/promotions.dto.ts:316` |
| `earningRules[].code` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/promotions/dto/promotions.dto.ts:111` |
| `earningRules[].name` | `string` | No | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/promotions/dto/promotions.dto.ts:119` |
| `earningRules[].eventType` | `string` | No | valores: BOOKING_COMPLETED, COURSE_COMPLETED, REVIEW_POSTED, STREAK | `@IsIn(APP_EVENTS)` | — | `src/modules/promotions/dto/promotions.dto.ts:126` |
| `earningRules[].awardType` | `string` | No | valores: POINTS, WALLET_CREDIT | `@IsIn(AWARD_TYPES)` | — | `src/modules/promotions/dto/promotions.dto.ts:133` |
| `earningRules[].pointsAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Puntos que otorga; obligatorio si el premio es POINTS | `src/modules/promotions/dto/promotions.dto.ts:143` |
| `earningRules[].creditAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Crédito que otorga; obligatorio si el premio es WALLET_CREDIT | `src/modules/promotions/dto/promotions.dto.ts:154` |
| `earningRules[].currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/promotions/dto/promotions.dto.ts:162` |
| `earningRules[].conditionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Condición adicional evaluada por el worker | `src/modules/promotions/dto/promotions.dto.ts:172` |
| `earningRules[].capPerPeriod` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Máximo de acumulaciones por periodo | `src/modules/promotions/dto/promotions.dto.ts:181` |
| `earningRules[].capPeriod` | `string` | No | valores: DAY, WEEK, MONTH | `@IsOptional()` `@IsIn(CAP_PERIODS)` | — | `src/modules/promotions/dto/promotions.dto.ts:189` |
| `earningRules[].validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/promotions/dto/promotions.dto.ts:197` |
| `earningRules[].validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/promotions/dto/promotions.dto.ts:205` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "programType": "POINTS",
  "tiers": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "minPoints": "valor-ejemplo"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "programType": "POINTS",
  "pointsCurrencyName": "BOB",
  "pointToCurrencyRate": "BOB",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "expiryPolicy": "NEVER",
  "pointsExpiryDays": 1,
  "tiers": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "minPoints": "valor-ejemplo",
      "multiplier": "valor-ejemplo",
      "benefitsJson": {}
    }
  ],
  "earningRules": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "eventType": "BOOKING_COMPLETED",
      "awardType": "POINTS",
      "pointsAmount": "valor-ejemplo",
      "creditAmount": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001",
      "conditionJson": {},
      "capPerPeriod": 1,
      "capPeriod": "DAY",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

</details>

### Respuesta — `Promise<LoyaltyProgramResponseDto>` · DTO `LoyaltyProgramResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/promotions/dto/promotions.dto.ts:327` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/promotions/dto/promotions.dto.ts:333` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/promotions/dto/promotions.dto.ts:339` |
| `tierIds` | `array<string>` | Sí | formato uuid | — | Niveles creados, de menor a mayor umbral | `src/modules/promotions/dto/promotions.dto.ts:349` |
| `earningRuleIds` | `array<string>` | Sí | formato uuid | — | Valor de earning rule ids mantenido por la instancia. | `src/modules/promotions/dto/promotions.dto.ts:355` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:56` |

### Flujos

_Se completa en la fase de flujos._

---

## 9. POST /loyalty/programs/{id}/memberships

- **Origen:** CONTRATO
- **Nombre:** Inscribir a un miembro en el programa
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.enrollMember` — `src/modules/promotions/controllers/loyalty.controller.ts:97`

### Qué es y para qué sirve (negocio)

Inscribir a un miembro en el programa. Caso de uso UC-51-02: Inscribir miembro. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:11`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /loyalty/programs/{id}/memberships` la atiende `LoyaltyController.enrollMember` (src/modules/promotions/controllers/loyalty.controller.ts:97). Exige sesión con alguno de los roles PROMOTIONS_ADMIN, MEMBER. Valida el cuerpo como `EnrollMemberDto` (3 campos, 2 obligatorios). Delega en `PromotionsLoyaltyService.enrollMember`. Crea filas en promotions.loyalty_memberships, promotions.points_ledger_entries. Actualiza promotions.loyalty_memberships. Lee promotions.loyalty_memberships, promotions.loyalty_programs, promotions.loyalty_tiers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PROMOTIONS_ADMIN, MEMBER | `src/modules/promotions/controllers/loyalty.controller.ts:97` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/loyalty.controller.ts:97` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.loyalty_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | LoyaltyController.enrollMember → PromotionsLoyaltyService.enrollMember | `src/modules/promotions/services/promotions-loyalty.service.ts:325` |
| `promotions.loyalty_memberships` | ESCRIBE | CREA | DIRECTA | LoyaltyController.enrollMember → PromotionsLoyaltyService.enrollMember → PromotionsLoyaltyRepository.createMembership | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:476` |
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.enrollMember → PromotionsLoyaltyService.enrollMember → PromotionsLoyaltyRepository.findMembershipByMember | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:500` |
| `promotions.loyalty_programs` | LEE | LEE | DIRECTA | LoyaltyController.enrollMember → PromotionsLoyaltyService.enrollMember → PromotionsLoyaltyRepository.findProgramById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:335` |
| `promotions.loyalty_tiers` | LEE | LEE | DIRECTA | LoyaltyController.enrollMember → PromotionsLoyaltyService.enrollMember → PromotionsLoyaltyRepository.findTiersByProgram | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:408` |
| `promotions.points_ledger_entries` | ESCRIBE | CREA | DIRECTA | LoyaltyController.enrollMember → PromotionsLoyaltyService.enrollMember → PromotionsLoyaltyRepository.createLedgerEntry | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:560` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `EnrollMemberDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `memberType` | `string` | Sí | valores: USER, PATIENT | `@IsIn(REWARD_MEMBER_TYPES)` | — | `src/modules/promotions/dto/promotions.dto.ts:369` |
| `memberRefId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/promotions/dto/promotions.dto.ts:376` |
| `signupBonusPoints` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Puntos de bienvenida a acreditar con el alta | `src/modules/promotions/dto/promotions.dto.ts:386` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "memberType": "USER",
  "memberRefId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "memberType": "USER",
  "memberRefId": "00000000-0000-4000-8000-000000000001",
  "signupBonusPoints": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<MembershipResponseDto>` · DTO `MembershipResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/promotions/dto/promotions.dto.ts:397` |
| `currentTierId` | `string` | No | formato uuid | — | Identificador asociado a current tier. | `src/modules/promotions/dto/promotions.dto.ts:403` |
| `pointsBalance` | `string` | Sí | — | — | Saldo de puntos | `src/modules/promotions/dto/promotions.dto.ts:409` |
| `lifetimePoints` | `string` | Sí | — | — | Puntos acumulados de por vida | `src/modules/promotions/dto/promotions.dto.ts:415` |
| `alreadyEnrolled` | `boolean` | Sí | — | — | true si ya estaba inscrito: la inscripción es idempotente | `src/modules/promotions/dto/promotions.dto.ts:423` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:66` |

### Flujos

_Se completa en la fase de flujos._

---

## 10. POST /promotions

- **Origen:** CONTRATO
- **Nombre:** Crear una promoción con sus reglas de descuento
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PromotionsController.createPromotion` — `src/modules/promotions/controllers/promotions.controller.ts:41`

### Qué es y para qué sirve (negocio)

Crear una promoción con sus reglas de descuento. Caso de uso UC-51-07: Promoción con reglas de descuento. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /promotions` la atiende `PromotionsController.createPromotion` (src/modules/promotions/controllers/promotions.controller.ts:41). Exige sesión con alguno de los roles PROMOTIONS_ADMIN, MARKETING_MANAGER. Valida el cuerpo como `CreatePromotionDto` (25 campos, 8 obligatorios). Delega en `PromotionsDiscountsService.createPromotion`. Crea filas en promotions.discount_rules, promotions.promotions. Lee promotions.promotions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PROMOTIONS_ADMIN, MARKETING_MANAGER | `src/modules/promotions/controllers/promotions.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.discount_rules` | ESCRIBE | CREA | DIRECTA | PromotionsController.createPromotion → PromotionsDiscountsService.createPromotion → PromotionsDiscountsRepository.createDiscountRule | `src/modules/promotions/repositories/promotions-discounts.repository.ts:327` |
| `promotions.promotions` | ESCRIBE | CREA | DIRECTA | PromotionsController.createPromotion → PromotionsDiscountsService.createPromotion → PromotionsDiscountsRepository.createPromotion | `src/modules/promotions/repositories/promotions-discounts.repository.ts:247` |
| `promotions.promotions` | LEE | LEE | DIRECTA | PromotionsController.createPromotion → PromotionsDiscountsService.createPromotion → PromotionsDiscountsRepository.findPromotionByCode | `src/modules/promotions/repositories/promotions-discounts.repository.ts:313` |

### Cuerpo — DTO `CreatePromotionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/promotions/dto/promotions.dto.ts:824` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código de la promoción, único por tenant | `src/modules/promotions/dto/promotions.dto.ts:835` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/promotions/dto/promotions.dto.ts:843` |
| `promotionType` | `string` | Sí | valores: AUTOMATIC, COUPON | `@IsIn(['AUTOMATIC', 'COUPON'])` | — | `src/modules/promotions/dto/promotions.dto.ts:850` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/promotions/dto/promotions.dto.ts:858` |
| `campaignRefId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Campaña de marketing asociada | `src/modules/promotions/dto/promotions.dto.ts:869` |
| `priority` | `number` | No | — | `@IsOptional()` `@IsInt()` | Prioridad frente a promociones que se solapan | `src/modules/promotions/dto/promotions.dto.ts:880` |
| `stackable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | ¿Puede combinarse con otras promociones? | `src/modules/promotions/dto/promotions.dto.ts:891` |
| `budgetAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Presupuesto total de descuento | `src/modules/promotions/dto/promotions.dto.ts:899` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/promotions/dto/promotions.dto.ts:907` |
| `totalRedemptionLimit` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Redenciones totales permitidas | `src/modules/promotions/dto/promotions.dto.ts:916` |
| `perUserLimit` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Redenciones permitidas por usuario | `src/modules/promotions/dto/promotions.dto.ts:925` |
| `validFrom` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/promotions/dto/promotions.dto.ts:932` |
| `validTo` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/promotions/dto/promotions.dto.ts:939` |
| `rules` | `array<DiscountRuleDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => DiscountRuleDto)` | Reglas de descuento, al menos una | `src/modules/promotions/dto/promotions.dto.ts:952` |
| `rules[].discountType` | `string` | Sí | valores: PERCENTAGE, FIXED, BOGO | `@IsIn(DISCOUNT_TYPES)` | — | `src/modules/promotions/dto/promotions.dto.ts:730` |
| `rules[].percentage` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Porcentaje 0-100; obligatorio si el tipo es PERCENTAGE | `src/modules/promotions/dto/promotions.dto.ts:740` |
| `rules[].fixedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Importe fijo; obligatorio si el tipo es FIXED | `src/modules/promotions/dto/promotions.dto.ts:750` |
| `rules[].currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/promotions/dto/promotions.dto.ts:758` |
| `rules[].maxDiscountAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Tope del descuento resultante | `src/modules/promotions/dto/promotions.dto.ts:766` |
| `rules[].minPurchaseAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Compra mínima para que la regla aplique | `src/modules/promotions/dto/promotions.dto.ts:776` |
| `rules[].appliesTo` | `string` | No | valores: ORDER, ITEM, CATEGORY | `@IsOptional()` `@IsIn(DISCOUNT_TARGETS)` | — | `src/modules/promotions/dto/promotions.dto.ts:784` |
| `rules[].targetFilterJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Filtro de los ítems alcanzados | `src/modules/promotions/dto/promotions.dto.ts:792` |
| `rules[].buyQuantity` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Unidades a comprar; obligatorio si el tipo es BOGO | `src/modules/promotions/dto/promotions.dto.ts:803` |
| `rules[].getQuantity` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Unidades bonificadas; obligatorio si el tipo es BOGO | `src/modules/promotions/dto/promotions.dto.ts:814` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "promotionType": "AUTOMATIC",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "rules": [
    {
      "discountType": "PERCENTAGE"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "promotionType": "AUTOMATIC",
  "description": "Texto descriptivo de ejemplo",
  "campaignRefId": "00000000-0000-4000-8000-000000000001",
  "priority": 0,
  "stackable": false,
  "budgetAmount": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "totalRedemptionLimit": 1,
  "perUserLimit": 1,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "rules": [
    {
      "discountType": "PERCENTAGE",
      "percentage": "valor-ejemplo",
      "fixedAmount": "valor-ejemplo",
      "currencyConceptId": "00000000-0000-4000-8000-000000000001",
      "maxDiscountAmount": "valor-ejemplo",
      "minPurchaseAmount": "valor-ejemplo",
      "appliesTo": "ORDER",
      "targetFilterJson": {},
      "buyQuantity": 1,
      "getQuantity": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<PromotionResponseDto>` · DTO `PromotionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/promotions/dto/promotions.dto.ts:963` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/promotions/dto/promotions.dto.ts:969` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/promotions/dto/promotions.dto.ts:975` |
| `ruleIds` | `array<string>` | Sí | formato uuid | — | Valor de rule ids mantenido por la instancia. | `src/modules/promotions/dto/promotions.dto.ts:981` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:177` |

### Flujos

_Se completa en la fase de flujos._

---

## 11. POST /promotions/{id}/coupons/batch

- **Origen:** CONTRATO
- **Nombre:** Emitir un lote de cupones
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PromotionsController.issueCoupons` — `src/modules/promotions/controllers/promotions.controller.ts:53`

### Qué es y para qué sirve (negocio)

Emitir un lote de cupones. Caso de uso UC-51-08: Emitir lote de cupones. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /promotions/{id}/coupons/batch` la atiende `PromotionsController.issueCoupons` (src/modules/promotions/controllers/promotions.controller.ts:53). Exige sesión con alguno de los roles PROMOTIONS_ADMIN, MARKETING_MANAGER. Valida el cuerpo como `IssueCouponsDto` (8 campos, 2 obligatorios). Delega en `PromotionsDiscountsService.issueCoupons`. Crea filas en promotions.coupons. Lee promotions.coupons, promotions.promotions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PROMOTIONS_ADMIN, MARKETING_MANAGER | `src/modules/promotions/controllers/promotions.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/promotions.controller.ts:53` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.coupons` | ESCRIBE | CREA | DIRECTA | PromotionsController.issueCoupons → PromotionsDiscountsService.issueCoupons → PromotionsDiscountsRepository.createCoupon | `src/modules/promotions/repositories/promotions-discounts.repository.ts:371` |
| `promotions.coupons` | LEE | LEE | DIRECTA | PromotionsController.issueCoupons → PromotionsDiscountsService.issueCoupons → PromotionsDiscountsService.generateCouponCodes → PromotionsDiscountsRepository.findCouponsByCodes | `src/modules/promotions/repositories/promotions-discounts.repository.ts:430` |
| `promotions.promotions` | LEE | LEE | DIRECTA | PromotionsController.issueCoupons → PromotionsDiscountsService.issueCoupons → PromotionsDiscountsRepository.findPromotionById | `src/modules/promotions/repositories/promotions-discounts.repository.ts:279` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `IssueCouponsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `couponType` | `string` | Sí | valores: PUBLIC, SINGLE_USE, PERSONAL, BATCH | `@IsIn(COUPON_TYPES)` | — | `src/modules/promotions/dto/promotions.dto.ts:999` |
| `quantity` | `number` | Sí | mínimo 1; máximo 1000 | `@IsInt()` `@Min(1)` `@Max(1000)` | Cupones a emitir | `src/modules/promotions/dto/promotions.dto.ts:1008` |
| `codePrefix` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | Prefijo del código generado | `src/modules/promotions/dto/promotions.dto.ts:1020` |
| `maxRedemptions` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Redenciones permitidas por cupón | `src/modules/promotions/dto/promotions.dto.ts:1032` |
| `assignedMemberType` | `string` | No | valores: USER, PATIENT | `@IsOptional()` `@IsIn(REWARD_MEMBER_TYPES)` | Sólo para cupones PERSONAL | `src/modules/promotions/dto/promotions.dto.ts:1043` |
| `assignedMemberRefId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sólo para cupones PERSONAL | `src/modules/promotions/dto/promotions.dto.ts:1054` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/promotions/dto/promotions.dto.ts:1062` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/promotions/dto/promotions.dto.ts:1070` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "couponType": "PUBLIC",
  "quantity": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "couponType": "PUBLIC",
  "quantity": 1,
  "codePrefix": "CODIGO_EJEMPLO",
  "maxRedemptions": 1,
  "assignedMemberType": "USER",
  "assignedMemberRefId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<IssueCouponsResponseDto>` · DTO `IssueCouponsResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `promotionId` | `string` | Sí | formato uuid | — | Identificador asociado a promotion. | `src/modules/promotions/dto/promotions.dto.ts:1081` |
| `issued` | `number` | Sí | — | — | Cupones emitidos | `src/modules/promotions/dto/promotions.dto.ts:1087` |
| `codes` | `array<string>` | Sí | — | — | Códigos generados | `src/modules/promotions/dto/promotions.dto.ts:1093` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:187` |

### Flujos

_Se completa en la fase de flujos._

---

## 12. POST /redemptions

- **Origen:** CONTRATO
- **Nombre:** Redimir un cupón y registrar la redención
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PromotionsController.redeemCoupon` — `src/modules/promotions/controllers/promotions.controller.ts:84`

### Qué es y para qué sirve (negocio)

Redimir un cupón y registrar la redención. Caso de uso UC-51-09: Validar y redimir cupón. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /redemptions` la atiende `PromotionsController.redeemCoupon` (src/modules/promotions/controllers/promotions.controller.ts:84). Exige sesión con alguno de los roles CASHIER, PROMOTIONS_ADMIN. Valida el cuerpo como `CreateRedemptionDto` (8 campos, 4 obligatorios). Delega en `PromotionsDiscountsService.redeemCoupon`. Crea filas en promotions.redemptions. Lee promotions.coupons, promotions.discount_rules, promotions.promotions, promotions.redemptions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CASHIER, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/promotions.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.coupons` | LEE | LEE | DIRECTA | PromotionsController.redeemCoupon → PromotionsDiscountsService.redeemCoupon → PromotionsDiscountsService.evaluateCouponForUpdate → PromotionsDiscountsRepository.findCouponByCodeForUpdate | `src/modules/promotions/repositories/promotions-discounts.repository.ts:406` |
| `promotions.discount_rules` | LEE | LEE | DIRECTA | PromotionsController.redeemCoupon → PromotionsDiscountsService.redeemCoupon → PromotionsDiscountsService.evaluateCouponForUpdate → PromotionsDiscountsRepository.findRulesByPromotion | `src/modules/promotions/repositories/promotions-discounts.repository.ts:358` |
| `promotions.promotions` | LEE | LEE | DIRECTA | PromotionsController.redeemCoupon → PromotionsDiscountsService.redeemCoupon → PromotionsDiscountsService.evaluateCouponForUpdate → PromotionsDiscountsRepository.findPromotionForUpdate | `src/modules/promotions/repositories/promotions-discounts.repository.ts:293` |
| `promotions.redemptions` | ESCRIBE | CREA | DIRECTA | PromotionsController.redeemCoupon → PromotionsDiscountsService.redeemCoupon → PromotionsDiscountsRepository.createRedemption | `src/modules/promotions/repositories/promotions-discounts.repository.ts:443` |
| `promotions.redemptions` | LEE | LEE | DIRECTA | PromotionsController.redeemCoupon → PromotionsDiscountsService.redeemCoupon → PromotionsDiscountsService.evaluateCouponForUpdate → PromotionsDiscountsService.assertLimits → PromotionsDiscountsRepository.findAppliedRedemptions | `src/modules/promotions/repositories/promotions-discounts.repository.ts:502` |

### Cuerpo — DTO `CreateRedemptionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del cupón | `src/modules/promotions/dto/promotions.dto.ts:1108` |
| `orderAmount` | `string` | Sí | — | `@IsNumberString()` | Importe de la orden, como cadena decimal | `src/modules/promotions/dto/promotions.dto.ts:1115` |
| `redeemerType` | `string` | Sí | valores: USER, PATIENT | `@IsIn(REWARD_MEMBER_TYPES)` | — | `src/modules/promotions/dto/promotions.dto.ts:1122` |
| `redeemerRefId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/promotions/dto/promotions.dto.ts:1129` |
| `orderRefType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo de la orden | `src/modules/promotions/dto/promotions.dto.ts:1181` |
| `orderRefId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/promotions/dto/promotions.dto.ts:1189` |
| `paymentIntentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/promotions/dto/promotions.dto.ts:1197` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/promotions/dto/promotions.dto.ts:1205` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "orderAmount": "valor-ejemplo",
  "redeemerType": "USER",
  "redeemerRefId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "orderAmount": "valor-ejemplo",
  "redeemerType": "USER",
  "redeemerRefId": "00000000-0000-4000-8000-000000000001",
  "orderRefType": "valor-ejemplo",
  "orderRefId": "00000000-0000-4000-8000-000000000001",
  "paymentIntentId": "00000000-0000-4000-8000-000000000001",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<RedemptionResponseDto>` · DTO `RedemptionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/promotions/dto/promotions.dto.ts:1216` |
| `promotionId` | `string` | Sí | formato uuid | — | Identificador asociado a promotion. | `src/modules/promotions/dto/promotions.dto.ts:1222` |
| `discountAmount` | `string` | Sí | — | — | Descuento aplicado | `src/modules/promotions/dto/promotions.dto.ts:1228` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/promotions/dto/promotions.dto.ts:1234` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:211` |

### Flujos

_Se completa en la fase de flujos._

---

## 13. POST /redemptions/{id}/reverse

- **Origen:** CONTRATO
- **Nombre:** Revertir una redención por devolución o cancelación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PromotionsController.reverseRedemption` — `src/modules/promotions/controllers/promotions.controller.ts:112`

### Qué es y para qué sirve (negocio)

Revertir una redención por devolución o cancelación. Caso de uso UC-51-11: Revertir redención. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /redemptions/{id}/reverse` la atiende `PromotionsController.reverseRedemption` (src/modules/promotions/controllers/promotions.controller.ts:112). Exige sesión con alguno de los roles CASHIER, PROMOTIONS_ADMIN. Valida el cuerpo como `ReverseRedemptionDto` (3 campos, 1 obligatorio). Delega en `PromotionsDiscountsService.reverseRedemption`. Crea filas en promotions.points_ledger_entries. Actualiza promotions.coupons, promotions.loyalty_memberships, promotions.redemptions. Lee promotions.coupons, promotions.loyalty_memberships, promotions.points_ledger_entries, promotions.redemptions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CASHIER, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/promotions.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/promotions.controller.ts:112` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.coupons` | ESCRIBE | ACTUALIZA | POR_TIPO | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption | `src/modules/promotions/services/promotions-discounts.service.ts:545` |
| `promotions.coupons` | LEE | LEE | DIRECTA | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption → PromotionsDiscountsRepository.findCouponForUpdate | `src/modules/promotions/repositories/promotions-discounts.repository.ts:421` |
| `promotions.loyalty_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption | `src/modules/promotions/services/promotions-discounts.service.ts:591` |
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption → PromotionsLoyaltyRepository.findMembershipForUpdate | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:512` |
| `promotions.points_ledger_entries` | ESCRIBE | CREA | DIRECTA | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption → PromotionsLoyaltyRepository.createLedgerEntry | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:560` |
| `promotions.points_ledger_entries` | LEE | LEE | DIRECTA | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption → PromotionsLoyaltyRepository.findLedgerEntryByKey | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:586` |
| `promotions.redemptions` | ESCRIBE | ACTUALIZA | POR_TIPO | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption | `src/modules/promotions/services/promotions-discounts.service.ts:597` |
| `promotions.redemptions` | LEE | LEE | DIRECTA | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption → PromotionsDiscountsRepository.findRedemptionForUpdate | `src/modules/promotions/repositories/promotions-discounts.repository.ts:475` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReverseRedemptionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | valores: REFUND, CANCEL | `@IsIn(['REFUND', 'CANCEL'])` | — | `src/modules/promotions/dto/promotions.dto.ts:1360` |
| `membershipId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Membresía a la que devolver los puntos, si la redención fue por puntos | `src/modules/promotions/dto/promotions.dto.ts:1372` |
| `restorePoints` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Puntos a restituir | `src/modules/promotions/dto/promotions.dto.ts:1380` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "REFUND"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "REFUND",
  "membershipId": "00000000-0000-4000-8000-000000000001",
  "restorePoints": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ReverseRedemptionResponseDto>` · DTO `ReverseRedemptionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `redemptionId` | `string` | Sí | formato uuid | — | Identificador asociado a redemption. | `src/modules/promotions/dto/promotions.dto.ts:1391` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/promotions/dto/promotions.dto.ts:1397` |
| `ledgerEntryId` | `string` | No | formato uuid | — | Entrada de compensación en el ledger | `src/modules/promotions/dto/promotions.dto.ts:1406` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:237` |

### Flujos

_Se completa en la fase de flujos._

---

## 14. POST /referral-programs/{id}/referrals

- **Origen:** CONTRATO
- **Nombre:** Generar el código de referido del miembro
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.createReferral` — `src/modules/promotions/controllers/loyalty.controller.ts:180`

### Qué es y para qué sirve (negocio)

Generar el código de referido del miembro. Caso de uso UC-51-12: Generar código de referido. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /referral-programs/{id}/referrals` la atiende `LoyaltyController.createReferral` (src/modules/promotions/controllers/loyalty.controller.ts:180). Exige sesión con alguno de los roles MEMBER, PROMOTIONS_ADMIN. Valida el cuerpo como `PromotionsCreateReferralDto` (1 campo, 0 obligatorios). Delega en `PromotionsLoyaltyService.createReferral`. Crea filas en promotions.member_referrals. Lee promotions.member_referrals, promotions.referral_programs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MEMBER, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/loyalty.controller.ts:180` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/loyalty.controller.ts:180` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.member_referrals` | ESCRIBE | CREA | DIRECTA | LoyaltyController.createReferral → PromotionsLoyaltyService.createReferral → PromotionsLoyaltyRepository.createReferral | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:657` |
| `promotions.member_referrals` | LEE | LEE | DIRECTA | LoyaltyController.createReferral → PromotionsLoyaltyService.createReferral → PromotionsLoyaltyRepository.findReferralsByReferrer | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:709` |
| `promotions.referral_programs` | LEE | LEE | DIRECTA | LoyaltyController.createReferral → PromotionsLoyaltyService.createReferral → PromotionsLoyaltyRepository.findReferralProgramById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:646` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PromotionsCreateReferralDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `refereeContact` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Contacto del referido (email o teléfono) | `src/modules/promotions/dto/promotions.dto.ts:1426` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "refereeContact": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ReferralResponseDto>` · DTO `ReferralResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/promotions/dto/promotions.dto.ts:1437` |
| `referralCode` | `string` | Sí | — | — | Código a compartir | `src/modules/promotions/dto/promotions.dto.ts:1443` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/promotions/dto/promotions.dto.ts:1449` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:155` |

### Flujos

_Se completa en la fase de flujos._

---

## 15. POST /referrals/{id}/qualify

- **Origen:** CONTRATO
- **Nombre:** Calificar el referido y premiar a ambas partes
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.qualifyReferral` — `src/modules/promotions/controllers/loyalty.controller.ts:196`

### Qué es y para qué sirve (negocio)

Calificar el referido y premiar a ambas partes. Caso de uso UC-51-13: Calificar y recompensar. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /referrals/{id}/qualify` la atiende `LoyaltyController.qualifyReferral` (src/modules/promotions/controllers/loyalty.controller.ts:196). Exige sesión con alguno de los roles SYSTEM, PROMOTIONS_ADMIN. Valida el cuerpo como `QualifyReferralDto` (4 campos, 4 obligatorios). Delega en `PromotionsLoyaltyService.qualifyReferral`. Crea filas en payments.wallet_ledger_entries, payments.wallets, promotions.points_ledger_entries. Actualiza payments.wallets, promotions.loyalty_memberships, promotions.member_referrals. Lee payments.wallet_ledger_entries, payments.wallets, promotions.loyalty_memberships, promotions.loyalty_tiers, promotions.member_referrals, promotions.points_ledger_entries, promotions.referral_programs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/loyalty.controller.ts:196` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/loyalty.controller.ts:196` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.wallet_ledger_entries` | ESCRIBE | CREA | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralWalletCredit → WalletsService.creditWallet → PaymentsWalletsRepository.createWalletLedgerEntry | `src/modules/payments/repositories/payments-wallets.repository.ts:99` |
| `payments.wallet_ledger_entries` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralWalletCredit → WalletsService.creditWallet → PaymentsWalletsRepository.findWalletLedgerEntryByKey | `src/modules/payments/repositories/payments-wallets.repository.ts:91` |
| `payments.wallets` | ESCRIBE | ACTUALIZA | POR_TIPO | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralWalletCredit → WalletsService.creditWallet | `src/modules/payments/services/wallets.service.ts:109` |
| `payments.wallets` | ESCRIBE | CREA | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralWalletCredit → WalletsService.creditWallet → PaymentsWalletsRepository.createWallet | `src/modules/payments/repositories/payments-wallets.repository.ts:68` |
| `payments.wallets` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralWalletCredit → WalletsService.creditWallet → PaymentsWalletsRepository.findWalletForUpdate | `src/modules/payments/repositories/payments-wallets.repository.ts:54` |
| `promotions.loyalty_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralPoints | `src/modules/promotions/services/promotions-loyalty.service.ts:1007` |
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralPoints → PromotionsLoyaltyRepository.findMembershipForUpdate | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:512` |
| `promotions.loyalty_tiers` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralPoints → PromotionsLoyaltyRepository.findTiersByProgram | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:408` |
| `promotions.member_referrals` | ESCRIBE | ACTUALIZA | POR_TIPO | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral | `src/modules/promotions/services/promotions-loyalty.service.ts:896` |
| `promotions.member_referrals` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyRepository.findReferralForUpdate | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:696` |
| `promotions.points_ledger_entries` | ESCRIBE | CREA | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralPoints → PromotionsLoyaltyRepository.createLedgerEntry | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:560` |
| `promotions.points_ledger_entries` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralPoints → PromotionsLoyaltyRepository.findLedgerEntryByKey | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:586` |
| `promotions.referral_programs` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyRepository.findReferralProgramById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:646` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `QualifyReferralDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `refereeUserId` | `string` | Sí | formato uuid | `@IsUUID()` | Usuario referido que cumplió el evento | `src/modules/promotions/dto/promotions.dto.ts:1465` |
| `qualifyingEvent` | `string` | Sí | valores: SIGNUP, FIRST_BOOKING, FIRST_PAYMENT | `@IsIn(['SIGNUP', 'FIRST_BOOKING', 'FIRST_PAYMENT'])` | — | `src/modules/promotions/dto/promotions.dto.ts:1472` |
| `referrerMembershipId` | `string` | Sí | formato uuid | `@IsUUID()` | Membresía de lealtad del referidor | `src/modules/promotions/dto/promotions.dto.ts:1482` |
| `refereeMembershipId` | `string` | Sí | formato uuid | `@IsUUID()` | Membresía de lealtad del referido | `src/modules/promotions/dto/promotions.dto.ts:1492` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "refereeUserId": "00000000-0000-4000-8000-000000000001",
  "qualifyingEvent": "SIGNUP",
  "referrerMembershipId": "00000000-0000-4000-8000-000000000001",
  "refereeMembershipId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "refereeUserId": "00000000-0000-4000-8000-000000000001",
  "qualifyingEvent": "SIGNUP",
  "referrerMembershipId": "00000000-0000-4000-8000-000000000001",
  "refereeMembershipId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<QualifyReferralResponseDto>` · DTO `QualifyReferralResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `referralId` | `string` | Sí | formato uuid | — | Identificador asociado a referral. | `src/modules/promotions/dto/promotions.dto.ts:1503` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/promotions/dto/promotions.dto.ts:1509` |
| `referrerLedgerEntryId` | `string` | No | formato uuid | — | Entrada del ledger del referidor | `src/modules/promotions/dto/promotions.dto.ts:1518` |
| `refereeLedgerEntryId` | `string` | No | formato uuid | — | Entrada del ledger del referido | `src/modules/promotions/dto/promotions.dto.ts:1527` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:156` |

### Flujos

_Se completa en la fase de flujos._

---

