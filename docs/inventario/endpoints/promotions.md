<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `promotions`

- **Bloque:** Marketing y Crecimiento (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)
- **Operaciones:** 20 (19 en el contrato, 1 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 13 · BAJO 7
- **Tablas distintas que tocan:** 14
- **Respuestas de error y detalle contractual:** `openapi/endpoints/promotions.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | DESCONOCIDO | `/` | El tenant del contexto, que acota el programa del portal. Mismo criterio que el listado de programas: sin `X-Tenant-Id` no se sabe de qué programa se está hablando, y elegir uno por nosotros sería inventar. | BAJO | 0 | sesión (sin roles) |
| 2 | POST | `/checkout/{orderId}/apply-discount` | Aplicar un descuento al intento de pago del checkout | MEDIO | 6 | CASHIER, PROMOTIONS_ADMIN |
| 3 | POST | `/coupons/validate` | Validar un cupón contra una orden | BAJO | 4 | CASHIER, PROMOTIONS_ADMIN |
| 4 | POST | `/loyalty/jobs/expire-points` | Barrer los puntos vencidos de un programa | MEDIO | 5 | SYSTEM |
| 5 | GET | `/loyalty/me` | Mi membresía de lealtad y mi saldo de puntos | BAJO | 3 | PATIENT |
| 6 | GET | `/loyalty/me/points` | Mis movimientos de puntos, más nuevos primero | BAJO | 3 | PATIENT |
| 7 | POST | `/loyalty/me/points/redeem` | Canjear puntos de mi propia membresía | MEDIO | 4 | PATIENT |
| 8 | POST | `/loyalty/memberships/{id}/points/earn` | Acumular puntos por un evento de la aplicación | MEDIO | 6 | SYSTEM, PROMOTIONS_ADMIN |
| 9 | POST | `/loyalty/memberships/{id}/points/redeem` | Canjear puntos | MEDIO | 4 | MEMBER, PROMOTIONS_ADMIN |
| 10 | POST | `/loyalty/memberships/{id}/recompute` | Reproyectar saldo y nivel desde el ledger | BAJO | 4 | SYSTEM, PROMOTIONS_ADMIN |
| 11 | GET | `/loyalty/programs` | Listar programas de lealtad activos | BAJO | 1 | SYSTEM, PROMOTIONS_ADMIN, MARKETING_MANAGER |
| 12 | POST | `/loyalty/programs` | Crear un programa de lealtad con niveles y reglas | MEDIO | 4 | PROMOTIONS_ADMIN, MARKETING_MANAGER |
| 13 | POST | `/loyalty/programs/{id}/memberships` | Inscribir a un miembro en el programa | MEDIO | 6 | PROMOTIONS_ADMIN, MEMBER |
| 14 | POST | `/promotions` | Crear una promoción con sus reglas de descuento | MEDIO | 3 | PROMOTIONS_ADMIN, MARKETING_MANAGER |
| 15 | POST | `/promotions/{id}/coupons/batch` | Emitir un lote de cupones | MEDIO | 3 | PROMOTIONS_ADMIN, MARKETING_MANAGER |
| 16 | GET | `/promotions/me` | Mis promociones vigentes | BAJO | 4 | PATIENT |
| 17 | POST | `/redemptions` | Redimir un cupón y registrar la redención | MEDIO | 5 | CASHIER, PROMOTIONS_ADMIN |
| 18 | POST | `/redemptions/{id}/reverse` | Revertir una redención por devolución o cancelación | MEDIO | 10 | CASHIER, PROMOTIONS_ADMIN |
| 19 | POST | `/referral-programs/{id}/referrals` | Generar el código de referido del miembro | MEDIO | 3 | MEMBER, PROMOTIONS_ADMIN |
| 20 | POST | `/referrals/{id}/qualify` | Calificar el referido y premiar a ambas partes | MEDIO | 13 | SYSTEM, PROMOTIONS_ADMIN |

---

## 1. DESCONOCIDO /

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** El tenant del contexto, que acota el programa del portal. Mismo criterio que el listado de programas: sin `X-Tenant-Id` no se sabe de qué programa se está hablando, y elegir uno por nosotros sería inventar.
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.requireTenant` — `src/modules/promotions/controllers/loyalty.controller.ts:185`

### Qué es y para qué sirve (negocio)

El tenant del contexto, que acota el programa del portal. Mismo criterio que el listado de programas: sin `X-Tenant-Id` no se sabe de qué programa se está hablando, y elegir uno por nosotros sería inventar. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DESCONOCIDO /` la atiende `LoyaltyController.requireTenant` (src/modules/promotions/controllers/loyalty.controller.ts:185). Exige sesión; el controlador no declara roles. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/promotions/controllers/loyalty.controller.ts:185` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/promotions/controllers/loyalty.controller.ts:185`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `string`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Se requiere X-Tenant-Id para operar sobre la membresía de lealtad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `ctrl:LoyaltyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /checkout/{orderId}/apply-discount

- **Origen:** CONTRATO
- **Nombre:** Aplicar un descuento al intento de pago del checkout
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PromotionsController.applyDiscount` — `src/modules/promotions/controllers/promotions.controller.ts:151`

### Qué es y para qué sirve (negocio)

Aplicar un descuento al intento de pago del checkout. Caso de uso UC-51-10: Descuento en checkout. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /checkout/{orderId}/apply-discount` la atiende `PromotionsController.applyDiscount` (src/modules/promotions/controllers/promotions.controller.ts:151). Exige sesión con alguno de los roles CASHIER, PROMOTIONS_ADMIN. Valida el cuerpo como `ApplyDiscountDto` (7 campos, 4 obligatorios). Delega en `PromotionsDiscountsService.applyDiscount`. Crea filas en promotions.redemptions. Actualiza promotions.coupons. Lee promotions.coupons, promotions.discount_rules, promotions.promotions, promotions.redemptions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CASHIER, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/promotions.controller.ts:151` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: orderId | `src/modules/promotions/controllers/promotions.controller.ts:151` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.coupons` | ESCRIBE | ACTUALIZA | POR_TIPO | PromotionsController.applyDiscount → PromotionsDiscountsService.applyDiscount | `src/modules/promotions/services/promotions-discounts.service.ts:513` |
| `promotions.coupons` | LEE | LEE | DIRECTA | PromotionsController.applyDiscount → PromotionsDiscountsService.applyDiscount → PromotionsDiscountsService.evaluateCouponForUpdate → PromotionsDiscountsRepository.findCouponByCode | `src/modules/promotions/repositories/promotions-discounts.repository.ts:495` |
| `promotions.discount_rules` | LEE | LEE | DIRECTA | PromotionsController.applyDiscount → PromotionsDiscountsService.applyDiscount → PromotionsDiscountsRepository.findRulesByPromotion | `src/modules/promotions/repositories/promotions-discounts.repository.ts:359` |
| `promotions.promotions` | LEE | LEE | DIRECTA | PromotionsController.applyDiscount → PromotionsDiscountsService.applyDiscount → PromotionsDiscountsRepository.findPromotionById | `src/modules/promotions/repositories/promotions-discounts.repository.ts:280` |
| `promotions.redemptions` | ESCRIBE | CREA | DIRECTA | PromotionsController.applyDiscount → PromotionsDiscountsService.applyDiscount → PromotionsDiscountsRepository.createRedemption | `src/modules/promotions/repositories/promotions-discounts.repository.ts:540` |
| `promotions.redemptions` | LEE | LEE | DIRECTA | PromotionsController.applyDiscount → PromotionsDiscountsService.applyDiscount → PromotionsDiscountsRepository.findRedemptionByIntent | `src/modules/promotions/repositories/promotions-discounts.repository.ts:622` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay que indicar el cupón o la promoción automática a aplicar; PreconditionFailedException: {rejection}; PreconditionFailedException: Ninguna regla aplica al importe de la orden; PreconditionFailedException: La promoción alcanzó su límite de redenciones; PreconditionFailedException: El usuario alcanzó su límite de redenciones en la promoción; PreconditionFailedException: La promoción agotó su presupuesto; PreconditionFailedException: La promoción no está activa; PreconditionFailedException: La promoción está fuera de vigencia; PreconditionFailedException: Ninguna regla de la promoción aplica al importe de la orden |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:332` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `UC-51-10`

---

## 3. POST /coupons/validate

- **Origen:** CONTRATO
- **Nombre:** Validar un cupón contra una orden
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PromotionsController.validateCoupon` — `src/modules/promotions/controllers/promotions.controller.ts:116`

### Qué es y para qué sirve (negocio)

Validar un cupón contra una orden. Caso de uso UC-51-09: Validar y redimir cupón. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /coupons/validate` la atiende `PromotionsController.validateCoupon` (src/modules/promotions/controllers/promotions.controller.ts:116). Exige sesión con alguno de los roles CASHIER, PROMOTIONS_ADMIN. Valida el cuerpo como `ValidateCouponDto` (4 campos, 4 obligatorios). Delega en `PromotionsDiscountsService.validateCoupon`. Lee promotions.coupons, promotions.discount_rules, promotions.promotions, promotions.redemptions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CASHIER, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/promotions.controller.ts:116` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.coupons` | LEE | LEE | DIRECTA | PromotionsController.validateCoupon → PromotionsDiscountsService.validateCoupon → PromotionsDiscountsRepository.findCouponByCode | `src/modules/promotions/repositories/promotions-discounts.repository.ts:495` |
| `promotions.discount_rules` | LEE | LEE | DIRECTA | PromotionsController.validateCoupon → PromotionsDiscountsService.validateCoupon → PromotionsDiscountsRepository.findRulesByPromotion | `src/modules/promotions/repositories/promotions-discounts.repository.ts:359` |
| `promotions.promotions` | LEE | LEE | DIRECTA | PromotionsController.validateCoupon → PromotionsDiscountsService.validateCoupon → PromotionsDiscountsRepository.findPromotionById | `src/modules/promotions/repositories/promotions-discounts.repository.ts:280` |
| `promotions.redemptions` | LEE | LEE | DIRECTA | PromotionsController.validateCoupon → PromotionsDiscountsService.validateCoupon → PromotionsDiscountsService.perUserRejection → PromotionsDiscountsRepository.findRedemptionsByRedeemer | `src/modules/promotions/repositories/promotions-discounts.repository.ts:597` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:312` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `UC-51-09`

---

## 4. POST /loyalty/jobs/expire-points

- **Origen:** CONTRATO
- **Nombre:** Barrer los puntos vencidos de un programa
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.expirePoints` — `src/modules/promotions/controllers/loyalty.controller.ts:302`

### Qué es y para qué sirve (negocio)

Barrer los puntos vencidos de un programa. Caso de uso UC-51-06: Barrido de puntos vencidos. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /loyalty/jobs/expire-points` la atiende `LoyaltyController.expirePoints` (src/modules/promotions/controllers/loyalty.controller.ts:302). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `ExpirePointsDto` (2 campos, 1 obligatorio). Delega en `PromotionsLoyaltyService.expirePoints`. Crea filas en promotions.points_ledger_entries. Actualiza promotions.loyalty_memberships. Lee promotions.loyalty_memberships, promotions.loyalty_programs, promotions.points_ledger_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/promotions/controllers/loyalty.controller.ts:302` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.loyalty_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | LoyaltyController.expirePoints → PromotionsLoyaltyService.expirePoints | `src/modules/promotions/services/promotions-loyalty.service.ts:790` |
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.expirePoints → PromotionsLoyaltyService.expirePoints → PromotionsLoyaltyRepository.findMembershipsForSweep | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:547` |
| `promotions.loyalty_programs` | LEE | LEE | DIRECTA | LoyaltyController.expirePoints → PromotionsLoyaltyService.expirePoints → PromotionsLoyaltyService.loadProgramInScope → PromotionsLoyaltyRepository.findProgramById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:335` |
| `promotions.points_ledger_entries` | ESCRIBE | CREA | DIRECTA | LoyaltyController.expirePoints → PromotionsLoyaltyService.expirePoints → PromotionsLoyaltyRepository.createLedgerEntry | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:571` |
| `promotions.points_ledger_entries` | LEE | LEE | DIRECTA | LoyaltyController.expirePoints → PromotionsLoyaltyService.expirePoints → PromotionsLoyaltyRepository.findExpirableEntries | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:693` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:118` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `UC-51-06`

---

## 5. GET /loyalty/me

- **Origen:** CONTRATO
- **Nombre:** Mi membresía de lealtad y mi saldo de puntos
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.myLoyalty` — `src/modules/promotions/controllers/loyalty.controller.ts:111`

### Qué es y para qué sirve (negocio)

Mi membresía de lealtad y mi saldo de puntos. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /loyalty/me` la atiende `LoyaltyController.myLoyalty` (src/modules/promotions/controllers/loyalty.controller.ts:111). Exige sesión con alguno de los roles PATIENT. Delega en `PromotionsLoyaltyService.myLoyalty`. Lee promotions.loyalty_memberships, promotions.loyalty_programs, promotions.loyalty_tiers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/promotions/controllers/loyalty.controller.ts:111` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.myLoyalty → PromotionsLoyaltyService.myLoyalty → PromotionsLoyaltyService.findOwnMembership → PromotionsLoyaltyRepository.findMembershipsByMemberRef | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:616` |
| `promotions.loyalty_programs` | LEE | LEE | DIRECTA | LoyaltyController.myLoyalty → PromotionsLoyaltyService.myLoyalty → PromotionsLoyaltyService.findOwnMembership → PromotionsLoyaltyRepository.findActivePrograms | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:369` |
| `promotions.loyalty_tiers` | LEE | LEE | DIRECTA | LoyaltyController.myLoyalty → PromotionsLoyaltyService.myLoyalty → PromotionsLoyaltyRepository.findTiersByProgram | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:408` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyLoyaltyResponseDto>` · DTO `MyLoyaltyResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `enrolled` | `boolean` | Sí | — | — | Si el titular tiene membresía en el programa | `src/modules/promotions/dto/promotions.dto.ts:1593` |
| `membership` | `MyLoyaltyMembershipDto` | No | — | — | — | `src/modules/promotions/dto/promotions.dto.ts:1596` |
| `membership.membershipId` | `string` | No | formato uuid | — | — | `src/modules/promotions/dto/promotions.dto.ts:1555` |
| `membership.programName` | `string` | No | — | — | Nombre del programa | `src/modules/promotions/dto/promotions.dto.ts:1558` |
| `membership.pointsCurrencyName` | `string` | No | — | — | Cómo se llaman las unidades del programa («puntos») | `src/modules/promotions/dto/promotions.dto.ts:1563` |
| `membership.pointsBalance` | `string` | No | — | — | Saldo disponible, como texto exacto | `src/modules/promotions/dto/promotions.dto.ts:1566` |
| `membership.lifetimePoints` | `string` | No | — | — | Acumulado de por vida, como texto exacto | `src/modules/promotions/dto/promotions.dto.ts:1569` |
| `membership.tier` | `MyLoyaltyTierDto` | No | — | — | — | `src/modules/promotions/dto/promotions.dto.ts:1572` |
| `membership.tier.code` | `string` | No | — | — | Código del nivel | `src/modules/promotions/dto/promotions.dto.ts:1540` |
| `membership.tier.name` | `string` | No | — | — | Nombre del nivel | `src/modules/promotions/dto/promotions.dto.ts:1543` |
| `membership.tier.multiplier` | `string` | No | — | — | Cuánto multiplica la acumulación | `src/modules/promotions/dto/promotions.dto.ts:1546` |
| `membership.tier.minPoints` | `string` | No | — | — | Puntos de por vida desde los que se alcanza | `src/modules/promotions/dto/promotions.dto.ts:1549` |
| `membership.enrolledAt` | `string` | No | formato date-time | — | Cuándo se inscribió | `src/modules/promotions/dto/promotions.dto.ts:1575` |
| `membership.active` | `boolean` | No | — | — | Si la membresía está activa. Se publica el hecho y no el concepto: el uuid de terminología es interno. | `src/modules/promotions/dto/promotions.dto.ts:1581` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene perfil de paciente; PreconditionFailedException: Se requiere X-Tenant-Id para operar sobre la membresía de lealtad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:215` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `ctrl:LoyaltyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /loyalty/me/points

- **Origen:** CONTRATO
- **Nombre:** Mis movimientos de puntos, más nuevos primero
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.myPoints` — `src/modules/promotions/controllers/loyalty.controller.ts:127`

### Qué es y para qué sirve (negocio)

Mis movimientos de puntos, más nuevos primero. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /loyalty/me/points` la atiende `LoyaltyController.myPoints` (src/modules/promotions/controllers/loyalty.controller.ts:127). Exige sesión con alguno de los roles PATIENT. Delega en `PromotionsLoyaltyService.myPointsLedger`. Lee promotions.loyalty_memberships, promotions.loyalty_programs, promotions.points_ledger_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/promotions/controllers/loyalty.controller.ts:127` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.myPoints → PromotionsLoyaltyService.myPointsLedger → PromotionsLoyaltyService.findOwnMembership → PromotionsLoyaltyRepository.findMembershipsByMemberRef | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:616` |
| `promotions.loyalty_programs` | LEE | LEE | DIRECTA | LoyaltyController.myPoints → PromotionsLoyaltyService.myPointsLedger → PromotionsLoyaltyService.findOwnMembership → PromotionsLoyaltyRepository.findActivePrograms | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:369` |
| `promotions.points_ledger_entries` | LEE | LEE | DIRECTA | LoyaltyController.myPoints → PromotionsLoyaltyService.myPointsLedger → PromotionsLoyaltyRepository.findLedgerPageByMembership | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:643` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco devuelto por la página anterior |
| `limit` | query | No | `number` | Movimientos por página (1..100, por defecto 20) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyPointsLedgerPageResponseDto>` · DTO `MyPointsLedgerPageResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `entries` | `array<MyPointsLedgerEntryDto>` | Sí | — | — | — | `src/modules/promotions/dto/promotions.dto.ts:1663` |
| `entries[].entryId` | `string` | Sí | formato uuid | — | — | `src/modules/promotions/dto/promotions.dto.ts:1602` |
| `entries[].direction` | `string` | No | — | — | Hacia dónde mueve los puntos, como código del catálogo (POINTS_EARN, POINTS_REDEEM, POINTS_EXPIRE, POINTS_ADJUST). Se omite si el concepto no pertenece a ese catálogo: antes que publicar un uuid interno, no se dice. | `src/modules/promotions/dto/promotions.dto.ts:1608` |
| `entries[].points` | `string` | Sí | — | — | Siempre positivo; el signo lo dice la dirección | `src/modules/promotions/dto/promotions.dto.ts:1613` |
| `entries[].reason` | `string` | No | — | — | Por qué se movieron, como código del catálogo (REASON_*). Se omite con el mismo criterio que `direction`. | `src/modules/promotions/dto/promotions.dto.ts:1619` |
| `entries[].balanceAfter` | `string` | No | — | — | Saldo que quedó después | `src/modules/promotions/dto/promotions.dto.ts:1622` |
| `entries[].expiresAt` | `string` | No | formato date-time | — | Cuándo vencen estos puntos | `src/modules/promotions/dto/promotions.dto.ts:1625` |
| `entries[].occurredAt` | `string` | Sí | formato date-time | — | Cuándo ocurrió el movimiento | `src/modules/promotions/dto/promotions.dto.ts:1628` |
| `nextCursor` | `string` | No | — | — | Cursor de la página siguiente; ausente si no hay más | `src/modules/promotions/dto/promotions.dto.ts:1668` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene perfil de paciente; PreconditionFailedException: Cursor de movimientos inválido; PreconditionFailedException: Se requiere X-Tenant-Id para operar sobre la membresía de lealtad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:239` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `ctrl:LoyaltyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /loyalty/me/points/redeem

- **Origen:** CONTRATO
- **Nombre:** Canjear puntos de mi propia membresía
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.redeemOwnPoints` — `src/modules/promotions/controllers/loyalty.controller.ts:154`

### Qué es y para qué sirve (negocio)

Canjear puntos de mi propia membresía. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /loyalty/me/points/redeem` la atiende `LoyaltyController.redeemOwnPoints` (src/modules/promotions/controllers/loyalty.controller.ts:154). Exige sesión con alguno de los roles PATIENT. Valida el cuerpo como `RedeemPointsDto` (3 campos, 2 obligatorios). Delega en `PromotionsLoyaltyService.redeemOwnPoints`. Crea filas en promotions.points_ledger_entries. Lee promotions.loyalty_memberships, promotions.loyalty_programs, promotions.points_ledger_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/promotions/controllers/loyalty.controller.ts:154` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.redeemOwnPoints → PromotionsLoyaltyService.redeemOwnPoints → PromotionsLoyaltyService.findOwnMembership → PromotionsLoyaltyRepository.findMembershipsByMemberRef | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:616` |
| `promotions.loyalty_programs` | LEE | LEE | DIRECTA | LoyaltyController.redeemOwnPoints → PromotionsLoyaltyService.redeemOwnPoints → PromotionsLoyaltyService.findOwnMembership → PromotionsLoyaltyRepository.findActivePrograms | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:369` |
| `promotions.points_ledger_entries` | ESCRIBE | CREA | DIRECTA | LoyaltyController.redeemOwnPoints → PromotionsLoyaltyService.redeemOwnPoints → PromotionsLoyaltyService.redeemPoints → PromotionsLoyaltyRepository.createLedgerEntry | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:571` |
| `promotions.points_ledger_entries` | LEE | LEE | DIRECTA | LoyaltyController.redeemOwnPoints → PromotionsLoyaltyService.redeemOwnPoints → PromotionsLoyaltyRepository.findLedgerEntryByKey | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:597` |

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
| `membershipId` | `string` | Sí | formato uuid | — | — | `src/modules/promotions/dto/promotions.dto.ts:532` |
| `points` | `string` | Sí | — | — | Puntos del movimiento | `src/modules/promotions/dto/promotions.dto.ts:538` |
| `balanceAfter` | `string` | Sí | — | — | Saldo tras el movimiento | `src/modules/promotions/dto/promotions.dto.ts:544` |
| `lifetimePoints` | `string` | Sí | — | — | Puntos de por vida tras el movimiento | `src/modules/promotions/dto/promotions.dto.ts:550` |
| `currentTierId` | `string` | No | formato uuid | — | Nivel actual tras recalcular | `src/modules/promotions/dto/promotions.dto.ts:559` |
| `duplicate` | `boolean` | Sí | — | — | true si la clave de idempotencia ya se había usado | `src/modules/promotions/dto/promotions.dto.ts:567` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La clave de idempotencia pertenece a otro canje; ConflictException: La clave de idempotencia pertenece a otro movimiento |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene perfil de paciente; PreconditionFailedException: No tiene una membresía de lealtad en este programa; PreconditionFailedException: El canje debe ser de puntos positivos; PreconditionFailedException: La membresía no está activa; PreconditionFailedException: Saldo de puntos insuficiente; PreconditionFailedException: Se requiere X-Tenant-Id para operar sobre la membresía de lealtad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:256` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `ctrl:LoyaltyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /loyalty/memberships/{id}/points/earn

- **Origen:** CONTRATO
- **Nombre:** Acumular puntos por un evento de la aplicación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.earnPoints` — `src/modules/promotions/controllers/loyalty.controller.ts:237`

### Qué es y para qué sirve (negocio)

Acumular puntos por un evento de la aplicación. Caso de uso UC-51-03: Acumular puntos (idempotente). Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /loyalty/memberships/{id}/points/earn` la atiende `LoyaltyController.earnPoints` (src/modules/promotions/controllers/loyalty.controller.ts:237). Exige sesión con alguno de los roles SYSTEM, PROMOTIONS_ADMIN. Valida el cuerpo como `EarnPointsDto` (5 campos, 2 obligatorios). Delega en `PromotionsLoyaltyService.earnPoints`. Crea filas en promotions.points_ledger_entries. Lee promotions.earning_rules, promotions.loyalty_memberships, promotions.loyalty_programs, promotions.loyalty_tiers, promotions.points_ledger_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/loyalty.controller.ts:237` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/loyalty.controller.ts:237` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.earning_rules` | LEE | LEE | DIRECTA | LoyaltyController.earnPoints → PromotionsLoyaltyService.earnPoints → PromotionsLoyaltyRepository.findEarningRuleById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:460` |
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.earnPoints → PromotionsLoyaltyService.earnPoints → PromotionsLoyaltyService.lockMembershipInScope → PromotionsLoyaltyRepository.findMembershipById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:515` |
| `promotions.loyalty_programs` | LEE | LEE | DIRECTA | LoyaltyController.earnPoints → PromotionsLoyaltyService.earnPoints → PromotionsLoyaltyService.lockMembershipInScope → PromotionsLoyaltyRepository.findProgramById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:335` |
| `promotions.loyalty_tiers` | LEE | LEE | DIRECTA | LoyaltyController.earnPoints → PromotionsLoyaltyService.earnPoints → PromotionsLoyaltyRepository.findTiersByProgram | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:408` |
| `promotions.points_ledger_entries` | ESCRIBE | CREA | DIRECTA | LoyaltyController.earnPoints → PromotionsLoyaltyService.earnPoints → PromotionsLoyaltyRepository.createLedgerEntry | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:571` |
| `promotions.points_ledger_entries` | LEE | LEE | DIRECTA | LoyaltyController.earnPoints → PromotionsLoyaltyService.earnPoints → PromotionsLoyaltyRepository.findLedgerEntryByKey | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:597` |

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
| `membershipId` | `string` | Sí | formato uuid | — | — | `src/modules/promotions/dto/promotions.dto.ts:532` |
| `points` | `string` | Sí | — | — | Puntos del movimiento | `src/modules/promotions/dto/promotions.dto.ts:538` |
| `balanceAfter` | `string` | Sí | — | — | Saldo tras el movimiento | `src/modules/promotions/dto/promotions.dto.ts:544` |
| `lifetimePoints` | `string` | Sí | — | — | Puntos de por vida tras el movimiento | `src/modules/promotions/dto/promotions.dto.ts:550` |
| `currentTierId` | `string` | No | formato uuid | — | Nivel actual tras recalcular | `src/modules/promotions/dto/promotions.dto.ts:559` |
| `duplicate` | `boolean` | Sí | — | — | true si la clave de idempotencia ya se había usado | `src/modules/promotions/dto/promotions.dto.ts:567` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La clave de idempotencia pertenece a otro movimiento |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La membresía no está activa; PreconditionFailedException: La regla pertenece a otro programa; PreconditionFailedException: La regla de acumulación no está activa; PreconditionFailedException: La regla de acumulación está fuera de vigencia; PreconditionFailedException: La regla no otorga puntos; PreconditionFailedException: La regla alcanzó su tope en el periodo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:89` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `UC-51-03`

---

## 9. POST /loyalty/memberships/{id}/points/redeem

- **Origen:** CONTRATO
- **Nombre:** Canjear puntos
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.redeemPoints` — `src/modules/promotions/controllers/loyalty.controller.ts:259`

### Qué es y para qué sirve (negocio)

Canjear puntos. Caso de uso UC-51-04: Canjear puntos (idempotente). Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /loyalty/memberships/{id}/points/redeem` la atiende `LoyaltyController.redeemPoints` (src/modules/promotions/controllers/loyalty.controller.ts:259). Exige sesión con alguno de los roles MEMBER, PROMOTIONS_ADMIN. Valida el cuerpo como `RedeemPointsDto` (3 campos, 2 obligatorios). Delega en `PromotionsLoyaltyService.redeemPoints`. Crea filas en promotions.points_ledger_entries. Lee promotions.loyalty_memberships, promotions.loyalty_programs, promotions.points_ledger_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MEMBER, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/loyalty.controller.ts:259` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/loyalty.controller.ts:259` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.redeemPoints → PromotionsLoyaltyService.redeemPoints → PromotionsLoyaltyService.lockMembershipInScope → PromotionsLoyaltyRepository.findMembershipById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:515` |
| `promotions.loyalty_programs` | LEE | LEE | DIRECTA | LoyaltyController.redeemPoints → PromotionsLoyaltyService.redeemPoints → PromotionsLoyaltyService.lockMembershipInScope → PromotionsLoyaltyRepository.findProgramById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:335` |
| `promotions.points_ledger_entries` | ESCRIBE | CREA | DIRECTA | LoyaltyController.redeemPoints → PromotionsLoyaltyService.redeemPoints → PromotionsLoyaltyRepository.createLedgerEntry | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:571` |
| `promotions.points_ledger_entries` | LEE | LEE | DIRECTA | LoyaltyController.redeemPoints → PromotionsLoyaltyService.redeemPoints → PromotionsLoyaltyRepository.findLedgerEntryByKey | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:597` |

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
| `membershipId` | `string` | Sí | formato uuid | — | — | `src/modules/promotions/dto/promotions.dto.ts:532` |
| `points` | `string` | Sí | — | — | Puntos del movimiento | `src/modules/promotions/dto/promotions.dto.ts:538` |
| `balanceAfter` | `string` | Sí | — | — | Saldo tras el movimiento | `src/modules/promotions/dto/promotions.dto.ts:544` |
| `lifetimePoints` | `string` | Sí | — | — | Puntos de por vida tras el movimiento | `src/modules/promotions/dto/promotions.dto.ts:550` |
| `currentTierId` | `string` | No | formato uuid | — | Nivel actual tras recalcular | `src/modules/promotions/dto/promotions.dto.ts:559` |
| `duplicate` | `boolean` | Sí | — | — | true si la clave de idempotencia ya se había usado | `src/modules/promotions/dto/promotions.dto.ts:567` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La clave de idempotencia pertenece a otro movimiento |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El canje debe ser de puntos positivos; PreconditionFailedException: La membresía no está activa; PreconditionFailedException: Saldo de puntos insuficiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:90` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `UC-51-04`

---

## 10. POST /loyalty/memberships/{id}/recompute

- **Origen:** CONTRATO
- **Nombre:** Reproyectar saldo y nivel desde el ledger
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.recomputeBalance` — `src/modules/promotions/controllers/loyalty.controller.ts:281`

### Qué es y para qué sirve (negocio)

Reproyectar saldo y nivel desde el ledger. Caso de uso UC-51-05: Reproyectar saldo y nivel. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /loyalty/memberships/{id}/recompute` la atiende `LoyaltyController.recomputeBalance` (src/modules/promotions/controllers/loyalty.controller.ts:281). Exige sesión con alguno de los roles SYSTEM, PROMOTIONS_ADMIN. Delega en `PromotionsLoyaltyService.recomputeBalance`. Lee promotions.loyalty_memberships, promotions.loyalty_programs, promotions.loyalty_tiers, promotions.points_ledger_entries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/loyalty.controller.ts:281` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/loyalty.controller.ts:281` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.recomputeBalance → PromotionsLoyaltyService.recomputeBalance → PromotionsLoyaltyService.lockMembershipInScope → PromotionsLoyaltyRepository.findMembershipById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:515` |
| `promotions.loyalty_programs` | LEE | LEE | DIRECTA | LoyaltyController.recomputeBalance → PromotionsLoyaltyService.recomputeBalance → PromotionsLoyaltyService.lockMembershipInScope → PromotionsLoyaltyRepository.findProgramById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:335` |
| `promotions.loyalty_tiers` | LEE | LEE | DIRECTA | LoyaltyController.recomputeBalance → PromotionsLoyaltyService.recomputeBalance → PromotionsLoyaltyRepository.findTiersByProgram | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:408` |
| `promotions.points_ledger_entries` | LEE | LEE | DIRECTA | LoyaltyController.recomputeBalance → PromotionsLoyaltyService.recomputeBalance → PromotionsLoyaltyRepository.findLedgerByMembership | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:665` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:108` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `UC-51-05`

---

## 11. GET /loyalty/programs

- **Origen:** CONTRATO
- **Nombre:** Listar programas de lealtad activos
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.listActivePrograms` — `src/modules/promotions/controllers/loyalty.controller.ts:69`

### Qué es y para qué sirve (negocio)

Listar programas de lealtad activos. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /loyalty/programs` la atiende `LoyaltyController.listActivePrograms` (src/modules/promotions/controllers/loyalty.controller.ts:69). Exige sesión con alguno de los roles SYSTEM, PROMOTIONS_ADMIN, MARKETING_MANAGER. Delega en `PromotionsLoyaltyService.listActivePrograms`. Lee promotions.loyalty_programs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PROMOTIONS_ADMIN, MARKETING_MANAGER | `src/modules/promotions/controllers/loyalty.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Se requiere X-Tenant-Id para listar programas de lealtad |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:130` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `ctrl:LoyaltyController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /loyalty/programs

- **Origen:** CONTRATO
- **Nombre:** Crear un programa de lealtad con niveles y reglas
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.createProgram` — `src/modules/promotions/controllers/loyalty.controller.ts:196`

### Qué es y para qué sirve (negocio)

Crear un programa de lealtad con niveles y reglas. Caso de uso UC-51-01: Programa de lealtad con niveles y reglas. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /loyalty/programs` la atiende `LoyaltyController.createProgram` (src/modules/promotions/controllers/loyalty.controller.ts:196). Exige sesión con alguno de los roles PROMOTIONS_ADMIN, MARKETING_MANAGER. Valida el cuerpo como `CreateLoyaltyProgramDto` (28 campos, 8 obligatorios). Delega en `PromotionsLoyaltyService.createProgram`. Crea filas en promotions.earning_rules, promotions.loyalty_programs, promotions.loyalty_tiers. Lee promotions.loyalty_programs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PROMOTIONS_ADMIN, MARKETING_MANAGER | `src/modules/promotions/controllers/loyalty.controller.ts:196` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un programa con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una política de vencimiento ROLLING necesita días de vigencia; PreconditionFailedException: Una regla de puntos necesita pointsAmount; PreconditionFailedException: Una regla de crédito necesita creditAmount |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:67` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `UC-51-01`

---

## 13. POST /loyalty/programs/{id}/memberships

- **Origen:** CONTRATO
- **Nombre:** Inscribir a un miembro en el programa
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.enrollMember` — `src/modules/promotions/controllers/loyalty.controller.ts:215`

### Qué es y para qué sirve (negocio)

Inscribir a un miembro en el programa. Caso de uso UC-51-02: Inscribir miembro. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /loyalty/programs/{id}/memberships` la atiende `LoyaltyController.enrollMember` (src/modules/promotions/controllers/loyalty.controller.ts:215). Exige sesión con alguno de los roles PROMOTIONS_ADMIN, MEMBER. Valida el cuerpo como `EnrollMemberDto` (3 campos, 2 obligatorios). Delega en `PromotionsLoyaltyService.enrollMember`. Crea filas en promotions.loyalty_memberships, promotions.points_ledger_entries. Actualiza promotions.loyalty_memberships. Lee promotions.loyalty_memberships, promotions.loyalty_programs, promotions.loyalty_tiers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PROMOTIONS_ADMIN, MEMBER | `src/modules/promotions/controllers/loyalty.controller.ts:215` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/loyalty.controller.ts:215` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.loyalty_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | LoyaltyController.enrollMember → PromotionsLoyaltyService.enrollMember | `src/modules/promotions/services/promotions-loyalty.service.ts:390` |
| `promotions.loyalty_memberships` | ESCRIBE | CREA | DIRECTA | LoyaltyController.enrollMember → PromotionsLoyaltyService.enrollMember → PromotionsLoyaltyRepository.createMembership | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:476` |
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.enrollMember → PromotionsLoyaltyService.enrollMember → PromotionsLoyaltyRepository.findMembershipByMember | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:500` |
| `promotions.loyalty_programs` | LEE | LEE | DIRECTA | LoyaltyController.enrollMember → PromotionsLoyaltyService.enrollMember → PromotionsLoyaltyService.loadProgramInScope → PromotionsLoyaltyRepository.findProgramById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:335` |
| `promotions.loyalty_tiers` | LEE | LEE | DIRECTA | LoyaltyController.enrollMember → PromotionsLoyaltyService.enrollMember → PromotionsLoyaltyRepository.findTiersByProgram | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:408` |
| `promotions.points_ledger_entries` | ESCRIBE | CREA | DIRECTA | LoyaltyController.enrollMember → PromotionsLoyaltyService.enrollMember → PromotionsLoyaltyRepository.createLedgerEntry | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:571` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El programa no está activo; PreconditionFailedException: El programa no tiene niveles definidos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:77` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `UC-51-02`

---

## 14. POST /promotions

- **Origen:** CONTRATO
- **Nombre:** Crear una promoción con sus reglas de descuento
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PromotionsController.createPromotion` — `src/modules/promotions/controllers/promotions.controller.ts:77`

### Qué es y para qué sirve (negocio)

Crear una promoción con sus reglas de descuento. Caso de uso UC-51-07: Promoción con reglas de descuento. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /promotions` la atiende `PromotionsController.createPromotion` (src/modules/promotions/controllers/promotions.controller.ts:77). Exige sesión con alguno de los roles PROMOTIONS_ADMIN, MARKETING_MANAGER. Valida el cuerpo como `CreatePromotionDto` (25 campos, 8 obligatorios). Delega en `PromotionsDiscountsService.createPromotion`. Crea filas en promotions.discount_rules, promotions.promotions. Lee promotions.promotions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PROMOTIONS_ADMIN, MARKETING_MANAGER | `src/modules/promotions/controllers/promotions.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.discount_rules` | ESCRIBE | CREA | DIRECTA | PromotionsController.createPromotion → PromotionsDiscountsService.createPromotion → PromotionsDiscountsRepository.createDiscountRule | `src/modules/promotions/repositories/promotions-discounts.repository.ts:328` |
| `promotions.promotions` | ESCRIBE | CREA | DIRECTA | PromotionsController.createPromotion → PromotionsDiscountsService.createPromotion → PromotionsDiscountsRepository.createPromotion | `src/modules/promotions/repositories/promotions-discounts.repository.ts:248` |
| `promotions.promotions` | LEE | LEE | DIRECTA | PromotionsController.createPromotion → PromotionsDiscountsService.createPromotion → PromotionsDiscountsRepository.findPromotionByCode | `src/modules/promotions/repositories/promotions-discounts.repository.ts:314` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una promoción con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La promoción debe terminar después de empezar; PreconditionFailedException: Una regla PERCENTAGE necesita porcentaje; PreconditionFailedException: El porcentaje debe estar entre 0 y 100; PreconditionFailedException: Una regla FIXED necesita importe; PreconditionFailedException: Una regla BOGO necesita buyQuantity y getQuantity |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:288` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `UC-51-07`

---

## 15. POST /promotions/{id}/coupons/batch

- **Origen:** CONTRATO
- **Nombre:** Emitir un lote de cupones
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PromotionsController.issueCoupons` — `src/modules/promotions/controllers/promotions.controller.ts:94`

### Qué es y para qué sirve (negocio)

Emitir un lote de cupones. Caso de uso UC-51-08: Emitir lote de cupones. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /promotions/{id}/coupons/batch` la atiende `PromotionsController.issueCoupons` (src/modules/promotions/controllers/promotions.controller.ts:94). Exige sesión con alguno de los roles PROMOTIONS_ADMIN, MARKETING_MANAGER. Valida el cuerpo como `IssueCouponsDto` (8 campos, 2 obligatorios). Delega en `PromotionsDiscountsService.issueCoupons`. Crea filas en promotions.coupons. Lee promotions.coupons, promotions.promotions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PROMOTIONS_ADMIN, MARKETING_MANAGER | `src/modules/promotions/controllers/promotions.controller.ts:94` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/promotions.controller.ts:94` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.coupons` | ESCRIBE | CREA | DIRECTA | PromotionsController.issueCoupons → PromotionsDiscountsService.issueCoupons → PromotionsDiscountsRepository.createCoupon | `src/modules/promotions/repositories/promotions-discounts.repository.ts:468` |
| `promotions.coupons` | LEE | LEE | DIRECTA | PromotionsController.issueCoupons → PromotionsDiscountsService.issueCoupons → PromotionsDiscountsService.generateCouponCodes → PromotionsDiscountsRepository.findCouponsByCodes | `src/modules/promotions/repositories/promotions-discounts.repository.ts:527` |
| `promotions.promotions` | LEE | LEE | DIRECTA | PromotionsController.issueCoupons → PromotionsDiscountsService.issueCoupons → PromotionsDiscountsRepository.findPromotionById | `src/modules/promotions/repositories/promotions-discounts.repository.ts:280` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: No se pudieron generar códigos de cupón libres |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un cupón PERSONAL necesita miembro asignado; PreconditionFailedException: Un cupón PERSONAL se emite de uno en uno; PreconditionFailedException: La promoción no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:298` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `UC-51-08`

---

## 16. GET /promotions/me

- **Origen:** CONTRATO
- **Nombre:** Mis promociones vigentes
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PromotionsController.listMine` — `src/modules/promotions/controllers/promotions.controller.ts:62`

### Qué es y para qué sirve (negocio)

Mis promociones vigentes. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /promotions/me` la atiende `PromotionsController.listMine` (src/modules/promotions/controllers/promotions.controller.ts:62). Exige sesión con alguno de los roles PATIENT. Delega en `PromotionsReadService.listMine`. Lee promotions.coupons, promotions.discount_rules, promotions.promotions, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/promotions/controllers/promotions.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.coupons` | LEE | LEE | DIRECTA | PromotionsController.listMine → PromotionsReadService.listMine → PromotionsDiscountsRepository.findPersonalCoupons | `src/modules/promotions/repositories/promotions-discounts.repository.ts:428` |
| `promotions.discount_rules` | LEE | LEE | DIRECTA | PromotionsController.listMine → PromotionsReadService.listMine → PromotionsDiscountsRepository.findRulesByPromotions | `src/modules/promotions/repositories/promotions-discounts.repository.ts:403` |
| `promotions.promotions` | LEE | LEE | DIRECTA | PromotionsController.listMine → PromotionsReadService.listMine → PromotionsDiscountsRepository.findCurrentPromotions | `src/modules/promotions/repositories/promotions-discounts.repository.ts:378` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PromotionsController.listMine → PromotionsReadService.listMine → PromotionsDiscountsRepository.findConcepts | `src/modules/promotions/repositories/promotions-discounts.repository.ts:455` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyPromotionsResponseDto>` · DTO `MyPromotionsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MyPromotionDto>` | Sí | — | — | — | `src/modules/promotions/dto/promotions.dto.ts:1769` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/promotions/dto/promotions.dto.ts:1730` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/promotions/dto/promotions.dto.ts:1734` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/promotions/dto/promotions.dto.ts:1738` |
| `items[].description` | `string` | No | admite null | — | — | `src/modules/promotions/dto/promotions.dto.ts:1742` |
| `items[].type` | `PromotionConceptDto` | No | admite null | — | — | `src/modules/promotions/dto/promotions.dto.ts:1746` |
| `items[].type.code` | `string` | No | — | — | — | sin fuente |
| `items[].type.display` | `string` | No | — | — | — | sin fuente |
| `items[].validFrom` | `string` | No | formato date-time; admite null | — | — | `src/modules/promotions/dto/promotions.dto.ts:1750` |
| `items[].validTo` | `string` | No | formato date-time; admite null | — | — | `src/modules/promotions/dto/promotions.dto.ts:1754` |
| `items[].discounts` | `array<MyPromotionDiscountDto>` | Sí | — | — | — | `src/modules/promotions/dto/promotions.dto.ts:1758` |
| `items[].discounts[].type` | `PromotionConceptDto` | No | admite null | — | — | `src/modules/promotions/dto/promotions.dto.ts:1688` |
| `items[].discounts[].type.code` | `string` | No | — | — | — | sin fuente |
| `items[].discounts[].type.display` | `string` | No | — | — | — | sin fuente |
| `items[].discounts[].percentage` | `string` | No | admite null | — | — | `src/modules/promotions/dto/promotions.dto.ts:1692` |
| `items[].discounts[].fixedAmount` | `string` | No | admite null | — | — | `src/modules/promotions/dto/promotions.dto.ts:1696` |
| `items[].discounts[].currency` | `PromotionConceptDto` | No | admite null | — | — | `src/modules/promotions/dto/promotions.dto.ts:1700` |
| `items[].discounts[].currency.code` | `string` | No | — | — | — | sin fuente |
| `items[].discounts[].currency.display` | `string` | No | — | — | — | sin fuente |
| `items[].discounts[].minPurchaseAmount` | `string` | No | admite null | — | — | `src/modules/promotions/dto/promotions.dto.ts:1704` |
| `items[].discounts[].maxDiscountAmount` | `string` | No | admite null | — | — | `src/modules/promotions/dto/promotions.dto.ts:1708` |
| `items[].discounts[].appliesTo` | `PromotionConceptDto` | No | admite null | — | — | `src/modules/promotions/dto/promotions.dto.ts:1712` |
| `items[].discounts[].appliesTo.code` | `string` | No | — | — | — | sin fuente |
| `items[].discounts[].appliesTo.display` | `string` | No | — | — | — | sin fuente |
| `items[].coupons` | `array<MyPromotionCouponDto>` | Sí | — | — | — | `src/modules/promotions/dto/promotions.dto.ts:1762` |
| `items[].coupons[].code` | `string` | Sí | — | — | — | `src/modules/promotions/dto/promotions.dto.ts:1719` |
| `items[].coupons[].validTo` | `string` | No | formato date-time; admite null | — | — | `src/modules/promotions/dto/promotions.dto.ts:1723` |
| `count` | `number` | Sí | — | — | — | `src/modules/promotions/dto/promotions.dto.ts:1773` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:376` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `ctrl:PromotionsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /redemptions

- **Origen:** CONTRATO
- **Nombre:** Redimir un cupón y registrar la redención
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PromotionsController.redeemCoupon` — `src/modules/promotions/controllers/promotions.controller.ts:134`

### Qué es y para qué sirve (negocio)

Redimir un cupón y registrar la redención. Caso de uso UC-51-09: Validar y redimir cupón. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /redemptions` la atiende `PromotionsController.redeemCoupon` (src/modules/promotions/controllers/promotions.controller.ts:134). Exige sesión con alguno de los roles CASHIER, PROMOTIONS_ADMIN. Valida el cuerpo como `CreateRedemptionDto` (8 campos, 4 obligatorios). Delega en `PromotionsDiscountsService.redeemCoupon`. Crea filas en promotions.redemptions. Lee promotions.coupons, promotions.discount_rules, promotions.promotions, promotions.redemptions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CASHIER, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/promotions.controller.ts:134` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.coupons` | LEE | LEE | DIRECTA | PromotionsController.redeemCoupon → PromotionsDiscountsService.redeemCoupon → PromotionsDiscountsService.evaluateCouponForUpdate → PromotionsDiscountsRepository.findCouponByCode | `src/modules/promotions/repositories/promotions-discounts.repository.ts:495` |
| `promotions.discount_rules` | LEE | LEE | DIRECTA | PromotionsController.redeemCoupon → PromotionsDiscountsService.redeemCoupon → PromotionsDiscountsService.evaluateCouponForUpdate → PromotionsDiscountsRepository.findRulesByPromotion | `src/modules/promotions/repositories/promotions-discounts.repository.ts:359` |
| `promotions.promotions` | LEE | LEE | DIRECTA | PromotionsController.redeemCoupon → PromotionsDiscountsService.redeemCoupon → PromotionsDiscountsService.evaluateCouponForUpdate → PromotionsDiscountsRepository.findPromotionById | `src/modules/promotions/repositories/promotions-discounts.repository.ts:280` |
| `promotions.redemptions` | ESCRIBE | CREA | DIRECTA | PromotionsController.redeemCoupon → PromotionsDiscountsService.redeemCoupon → PromotionsDiscountsRepository.createRedemption | `src/modules/promotions/repositories/promotions-discounts.repository.ts:540` |
| `promotions.redemptions` | LEE | LEE | DIRECTA | PromotionsController.redeemCoupon → PromotionsDiscountsService.redeemCoupon → PromotionsDiscountsService.evaluateCouponForUpdate → PromotionsDiscountsService.assertLimits → PromotionsDiscountsRepository.findAppliedRedemptions | `src/modules/promotions/repositories/promotions-discounts.repository.ts:610` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {rejection}; PreconditionFailedException: Ninguna regla aplica al importe de la orden; PreconditionFailedException: La promoción alcanzó su límite de redenciones; PreconditionFailedException: El usuario alcanzó su límite de redenciones en la promoción; PreconditionFailedException: La promoción agotó su presupuesto |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:322` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `UC-51-09`

---

## 18. POST /redemptions/{id}/reverse

- **Origen:** CONTRATO
- **Nombre:** Revertir una redención por devolución o cancelación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PromotionsController.reverseRedemption` — `src/modules/promotions/controllers/promotions.controller.ts:171`

### Qué es y para qué sirve (negocio)

Revertir una redención por devolución o cancelación. Caso de uso UC-51-11: Revertir redención. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /redemptions/{id}/reverse` la atiende `PromotionsController.reverseRedemption` (src/modules/promotions/controllers/promotions.controller.ts:171). Exige sesión con alguno de los roles CASHIER, PROMOTIONS_ADMIN. Valida el cuerpo como `ReverseRedemptionDto` (3 campos, 1 obligatorio). Delega en `PromotionsDiscountsService.reverseRedemption`. Crea filas en promotions.points_ledger_entries. Actualiza promotions.coupons, promotions.loyalty_memberships, promotions.redemptions. Lee promotions.coupons, promotions.loyalty_memberships, promotions.loyalty_programs, promotions.points_ledger_entries, promotions.promotions, promotions.redemptions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CASHIER, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/promotions.controller.ts:171` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/promotions.controller.ts:171` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.coupons` | ESCRIBE | ACTUALIZA | POR_TIPO | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption | `src/modules/promotions/services/promotions-discounts.service.ts:611` |
| `promotions.coupons` | LEE | LEE | DIRECTA | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption → PromotionsDiscountsRepository.findCouponForUpdate | `src/modules/promotions/repositories/promotions-discounts.repository.ts:518` |
| `promotions.loyalty_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption | `src/modules/promotions/services/promotions-discounts.service.ts:655` |
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption → PromotionsDiscountsService.lockMembershipOfTenant → PromotionsLoyaltyRepository.findMembershipById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:515` |
| `promotions.loyalty_programs` | LEE | LEE | DIRECTA | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption → PromotionsDiscountsService.lockMembershipOfTenant → PromotionsLoyaltyRepository.findProgramById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:335` |
| `promotions.points_ledger_entries` | ESCRIBE | CREA | DIRECTA | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption → PromotionsLoyaltyRepository.createLedgerEntry | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:571` |
| `promotions.points_ledger_entries` | LEE | LEE | DIRECTA | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption → PromotionsLoyaltyRepository.findLedgerEntryByKey | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:597` |
| `promotions.promotions` | LEE | LEE | DIRECTA | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption → PromotionsDiscountsRepository.findPromotionById | `src/modules/promotions/repositories/promotions-discounts.repository.ts:280` |
| `promotions.redemptions` | ESCRIBE | ACTUALIZA | POR_TIPO | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption | `src/modules/promotions/services/promotions-discounts.service.ts:661` |
| `promotions.redemptions` | LEE | LEE | DIRECTA | PromotionsController.reverseRedemption → PromotionsDiscountsService.reverseRedemption → PromotionsDiscountsRepository.findRedemptionById | `src/modules/promotions/repositories/promotions-discounts.repository.ts:569` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La redención ya no está aplicada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:348` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `UC-51-11`

---

## 19. POST /referral-programs/{id}/referrals

- **Origen:** CONTRATO
- **Nombre:** Generar el código de referido del miembro
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.createReferral` — `src/modules/promotions/controllers/loyalty.controller.ts:322`

### Qué es y para qué sirve (negocio)

Generar el código de referido del miembro. Caso de uso UC-51-12: Generar código de referido. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /referral-programs/{id}/referrals` la atiende `LoyaltyController.createReferral` (src/modules/promotions/controllers/loyalty.controller.ts:322). Exige sesión con alguno de los roles MEMBER, PROMOTIONS_ADMIN. Valida el cuerpo como `PromotionsCreateReferralDto` (1 campo, 0 obligatorios). Delega en `PromotionsLoyaltyService.createReferral`. Crea filas en promotions.member_referrals. Lee promotions.member_referrals, promotions.referral_programs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MEMBER, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/loyalty.controller.ts:322` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/loyalty.controller.ts:322` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `promotions.member_referrals` | ESCRIBE | CREA | DIRECTA | LoyaltyController.createReferral → PromotionsLoyaltyService.createReferral → PromotionsLoyaltyRepository.createReferral | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:728` |
| `promotions.member_referrals` | LEE | LEE | DIRECTA | LoyaltyController.createReferral → PromotionsLoyaltyService.createReferral → PromotionsLoyaltyRepository.findReferralsByReferrer | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:791` |
| `promotions.referral_programs` | LEE | LEE | DIRECTA | LoyaltyController.createReferral → PromotionsLoyaltyService.createReferral → PromotionsLoyaltyRepository.findReferralProgramById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:717` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: No se pudo generar un código de referido libre |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El programa de referidos no está activo; PreconditionFailedException: El programa de referidos está fuera de vigencia; PreconditionFailedException: El usuario alcanzó su máximo de referidos en el programa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:187` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `UC-51-12`

---

## 20. POST /referrals/{id}/qualify

- **Origen:** CONTRATO
- **Nombre:** Calificar el referido y premiar a ambas partes
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LoyaltyController.qualifyReferral` — `src/modules/promotions/controllers/loyalty.controller.ts:343`

### Qué es y para qué sirve (negocio)

Calificar el referido y premiar a ambas partes. Caso de uso UC-51-13: Calificar y recompensar. Dentro del módulo (descripción del modelo, en inglés): «The rewards and discount engine end users asked for: loyalty programs with tiers and a points ledger, promotions with flexible discount rules, single/multi-use coupons and promo codes with redemption tracking…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/promotions/README.md:61`) · MODELO (`Mantra Core Health Context/modules/diagram_51_promotions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /referrals/{id}/qualify` la atiende `LoyaltyController.qualifyReferral` (src/modules/promotions/controllers/loyalty.controller.ts:343). Exige sesión con alguno de los roles SYSTEM, PROMOTIONS_ADMIN. Valida el cuerpo como `QualifyReferralDto` (4 campos, 4 obligatorios). Delega en `PromotionsLoyaltyService.qualifyReferral`. Crea filas en payments.wallet_ledger_entries, payments.wallets, promotions.points_ledger_entries. Actualiza payments.wallets, promotions.member_referrals. Lee payments.wallet_ledger_entries, payments.wallets, promotions.loyalty_memberships, promotions.loyalty_programs, promotions.loyalty_tiers, promotions.member_referrals, promotions.points_ledger_entries, promotions.referral_programs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PROMOTIONS_ADMIN | `src/modules/promotions/controllers/loyalty.controller.ts:343` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/promotions/controllers/loyalty.controller.ts:343` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.wallet_ledger_entries` | ESCRIBE | CREA | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralWalletCredit → WalletsService.creditWallet → PaymentsWalletsRepository.createWalletLedgerEntry | `src/modules/payments/repositories/payments-wallets.repository.ts:99` |
| `payments.wallet_ledger_entries` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralWalletCredit → WalletsService.creditWallet → PaymentsWalletsRepository.findWalletLedgerEntryByKey | `src/modules/payments/repositories/payments-wallets.repository.ts:91` |
| `payments.wallets` | ESCRIBE | ACTUALIZA | POR_TIPO | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralWalletCredit → WalletsService.creditWallet | `src/modules/payments/services/wallets.service.ts:107` |
| `payments.wallets` | ESCRIBE | CREA | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralWalletCredit → WalletsService.creditWallet → PaymentsWalletsRepository.createWallet | `src/modules/payments/repositories/payments-wallets.repository.ts:68` |
| `payments.wallets` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralWalletCredit → WalletsService.creditWallet → PaymentsWalletsRepository.findWalletForUpdate | `src/modules/payments/repositories/payments-wallets.repository.ts:54` |
| `promotions.loyalty_memberships` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralPoints → PromotionsLoyaltyService.lockMembershipInScope → PromotionsLoyaltyRepository.findMembershipById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:515` |
| `promotions.loyalty_programs` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralPoints → PromotionsLoyaltyService.lockMembershipInScope → PromotionsLoyaltyRepository.findProgramById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:335` |
| `promotions.loyalty_tiers` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralPoints → PromotionsLoyaltyRepository.findTiersByProgram | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:408` |
| `promotions.member_referrals` | ESCRIBE | ACTUALIZA | POR_TIPO | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral | `src/modules/promotions/services/promotions-loyalty.service.ts:995` |
| `promotions.member_referrals` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyRepository.findReferralById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:764` |
| `promotions.points_ledger_entries` | ESCRIBE | CREA | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralPoints → PromotionsLoyaltyRepository.createLedgerEntry | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:571` |
| `promotions.points_ledger_entries` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyService.awardReferral → PromotionsLoyaltyService.awardReferralPoints → PromotionsLoyaltyRepository.findLedgerEntryByKey | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:597` |
| `promotions.referral_programs` | LEE | LEE | DIRECTA | LoyaltyController.qualifyReferral → PromotionsLoyaltyService.qualifyReferral → PromotionsLoyaltyRepository.findReferralProgramById | `src/modules/promotions/repositories/promotions-loyalty.repository.ts:717` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El referido ya fue calificado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un usuario no puede referirse a sí mismo; PreconditionFailedException: El evento recibido no es el que califica en este programa; PreconditionFailedException: El programa de referidos no define moneda para el crédito de billetera |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/promotions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/promotions/controllers/promotions.controller.spec.ts:188` |

### Flujos

- Módulo 51 — Lealtad, Descuentos, Cupones y Referidos — etapa `UC-51-13`

---

