<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `promotions`

Referencia exhaustiva de 15 operación(es) del módulo `promotions`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `loyalty`, `promotions`
- **Controladores:** `LoyaltyController`, `PromotionsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /checkout/{orderId}/apply-discount](#1-post-checkout-orderid-apply-discount) — Aplicar un descuento al intento de pago del checkout
2. [POST /coupons/validate](#2-post-coupons-validate) — Validar un cupón contra una orden
3. [POST /loyalty/jobs/expire-points](#3-post-loyalty-jobs-expire-points) — Barrer los puntos vencidos de un programa
4. [POST /loyalty/memberships/{id}/points/earn](#4-post-loyalty-memberships-id-points-earn) — Acumular puntos por un evento de la aplicación
5. [POST /loyalty/memberships/{id}/points/redeem](#5-post-loyalty-memberships-id-points-redeem) — Canjear puntos
6. [POST /loyalty/memberships/{id}/recompute](#6-post-loyalty-memberships-id-recompute) — Reproyectar saldo y nivel desde el ledger
7. [GET /loyalty/programs](#7-get-loyalty-programs) — Listar programas de lealtad activos
8. [POST /loyalty/programs](#8-post-loyalty-programs) — Crear un programa de lealtad con niveles y reglas
9. [POST /loyalty/programs/{id}/memberships](#9-post-loyalty-programs-id-memberships) — Inscribir a un miembro en el programa
10. [POST /promotions](#10-post-promotions) — Crear una promoción con sus reglas de descuento
11. [POST /promotions/{id}/coupons/batch](#11-post-promotions-id-coupons-batch) — Emitir un lote de cupones
12. [POST /redemptions](#12-post-redemptions) — Redimir un cupón y registrar la redención
13. [POST /redemptions/{id}/reverse](#13-post-redemptions-id-reverse) — Revertir una redención por devolución o cancelación
14. [POST /referral-programs/{id}/referrals](#14-post-referral-programs-id-referrals) — Generar el código de referido del miembro
15. [POST /referrals/{id}/qualify](#15-post-referrals-id-qualify) — Calificar el referido y premiar a ambas partes

---

## 1. POST /checkout/{orderId}/apply-discount

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `promotions`
- **Nombre:** Aplicar un descuento al intento de pago del checkout
- **Operation ID:** `PromotionsController_applyDiscount`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PromotionsController.applyDiscount](../../src/modules/promotions/controllers/promotions.controller.ts)

### Descripción de negocio

Idempotente por el par intento-promoción.


### Descripción del sistema

NestJS resuelve `POST /checkout/{orderId}/apply-discount` en `PromotionsController_applyDiscount`. El controlador delega en `PromotionsDiscountsService.applyDiscount`. Valida el body como `ApplyDiscountDto` y consume `application/json`. El tipo de retorno estático es `Promise<ApplyDiscountResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `orderId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ApplyDiscountDto`; los campos opcionales se omiten.

```http
POST /checkout/00000000-0000-4000-8000-000000000001/apply-discount HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "paymentIntentId": "00000000-0000-4000-8000-000000000001",
  "orderAmount": "valor-ejemplo",
  "redeemerType": "USER",
  "redeemerRefId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CASHIER`, `PROMOTIONS_ADMIN`.
- Deben ser UUID válidos: `orderId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `paymentIntentId` | Sí | `string` | formato `uuid` | Intento de pago sobre el que se descuenta | `00000000-0000-4000-8000-000000000001` |
| `orderAmount` | Sí | `string` | Sin restricción adicional declarada | Importe bruto del intento, como cadena decimal | `valor-ejemplo` |
| `redeemerType` | Sí | `string` | valores: `USER`, `PATIENT` | Sin descripción específica en el contrato OpenAPI. | `USER` |
| `redeemerRefId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `couponCode` | No | `string` | longitud máxima 100 | Código del cupón cuando el descuento lo exige | `CODIGO_EJEMPLO` |
| `promotionId` | No | `string` | formato `uuid` | Promoción automática a aplicar | `00000000-0000-4000-8000-000000000001` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /checkout/00000000-0000-4000-8000-000000000001/apply-discount HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ApplyDiscountResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ApplyDiscountResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ApplyDiscountResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ApplyDiscountResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ApplyDiscountResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ApplyDiscountResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ApplyDiscountResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ApplyDiscountResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ApplyDiscountResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ApplyDiscountResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ApplyDiscountResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "redemptionId": "00000000-0000-4000-8000-000000000001",
  "paymentIntentId": "00000000-0000-4000-8000-000000000001",
  "discountAmount": "valor-ejemplo",
  "netAmount": "valor-ejemplo",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `redemptionId` | Sí | `string` | formato `uuid` | Identificador asociado a redemption. | `00000000-0000-4000-8000-000000000001` |
| `paymentIntentId` | Sí | `string` | formato `uuid` | Identificador asociado a payment intent. | `00000000-0000-4000-8000-000000000001` |
| `discountAmount` | Sí | `string` | Sin restricción adicional declarada | Descuento aplicado | `valor-ejemplo` |
| `netAmount` | Sí | `string` | Sin restricción adicional declarada | Importe neto resultante para el intento de pago | `valor-ejemplo` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si el descuento ya estaba aplicado a este intento | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CASHIER, PROMOTIONS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Promoción no encontrada | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 404 | `NOT_FOUND` | Cupón no encontrado | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 404 | `NOT_FOUND` | Promoción del cupón no encontrada | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Hay que indicar el cupón o la promoción automática a aplicar | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | Ninguna regla de la promoción aplica al importe de la orden | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | rejection | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | Ninguna regla aplica al importe de la orden | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | La promoción alcanzó su límite de redenciones | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | El usuario alcanzó su límite de redenciones en la promoción | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | La promoción agotó su presupuesto | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | La promoción no está activa | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | La promoción está fuera de vigencia | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/checkout/{orderId}/apply-discount"
}
```

---

## 2. POST /coupons/validate

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `promotions`
- **Nombre:** Validar un cupón contra una orden
- **Operation ID:** `PromotionsController_validateCoupon`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PromotionsController.validateCoupon](../../src/modules/promotions/controllers/promotions.controller.ts)

### Descripción de negocio

No muta nada: informa si sirve y cuánto descontaría.


### Descripción del sistema

NestJS resuelve `POST /coupons/validate` en `PromotionsController_validateCoupon`. El controlador delega en `PromotionsDiscountsService.validateCoupon`. Valida el body como `ValidateCouponDto` y consume `application/json`. El tipo de retorno estático es `Promise<ValidateCouponResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ValidateCouponDto`; los campos opcionales se omiten.

```http
POST /coupons/validate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "orderAmount": "valor-ejemplo",
  "redeemerType": "USER",
  "redeemerRefId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CASHIER`, `PROMOTIONS_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Código del cupón | `CODIGO_EJEMPLO` |
| `orderAmount` | Sí | `string` | Sin restricción adicional declarada | Importe de la orden, como cadena decimal | `valor-ejemplo` |
| `redeemerType` | Sí | `string` | valores: `USER`, `PATIENT` | Sin descripción específica en el contrato OpenAPI. | `USER` |
| `redeemerRefId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /coupons/validate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "orderAmount": "valor-ejemplo",
  "redeemerType": "USER",
  "redeemerRefId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ValidateCouponResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ValidateCouponResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ValidateCouponResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ValidateCouponResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ValidateCouponResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ValidateCouponResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ValidateCouponResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ValidateCouponResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ValidateCouponResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ValidateCouponResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "valid": true,
  "reason": "Texto descriptivo de ejemplo",
  "promotionId": "00000000-0000-4000-8000-000000000001",
  "discountRuleId": "00000000-0000-4000-8000-000000000001",
  "discountAmount": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `valid` | Sí | `boolean` | Sin restricción adicional declarada | ¿El cupón puede usarse en esta orden? | `true` |
| `reason` | No | `string` | Sin restricción adicional declarada | Motivo del rechazo cuando no es válido | `Texto descriptivo de ejemplo` |
| `promotionId` | No | `string` | formato `uuid` | Identificador asociado a promotion. | `00000000-0000-4000-8000-000000000001` |
| `discountRuleId` | No | `string` | formato `uuid` | Regla que da el mejor descuento | `00000000-0000-4000-8000-000000000001` |
| `discountAmount` | No | `string` | Sin restricción adicional declarada | Descuento que se aplicaría | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CASHIER, PROMOTIONS_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/coupons/validate"
}
```

---

## 3. POST /loyalty/jobs/expire-points

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `loyalty`
- **Nombre:** Barrer los puntos vencidos de un programa
- **Operation ID:** `LoyaltyController_expirePoints`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LoyaltyController.expirePoints](../../src/modules/promotions/controllers/loyalty.controller.ts)

### Descripción de negocio

Procesa por lotes con SKIP LOCKED; expirar dos veces el mismo lote no acumula.


### Descripción del sistema

NestJS resuelve `POST /loyalty/jobs/expire-points` en `LoyaltyController_expirePoints`. El controlador delega en `PromotionsLoyaltyService.expirePoints`. Valida el body como `ExpirePointsDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExpirePointsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExpirePointsDto`; los campos opcionales se omiten.

```http
POST /loyalty/jobs/expire-points HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "loyaltyProgramId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `loyaltyProgramId` | Sí | `string` | formato `uuid` | Programa cuyas membresías se barren | `00000000-0000-4000-8000-000000000001` |
| `batchSize` | No | `number` | mínimo 1; máximo 1000 | Tamaño del lote | `100` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /loyalty/jobs/expire-points HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "loyaltyProgramId": "00000000-0000-4000-8000-000000000001",
  "batchSize": 100
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ExpirePointsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExpirePointsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExpirePointsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExpirePointsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExpirePointsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExpirePointsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExpirePointsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExpirePointsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExpirePointsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExpirePointsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "scanned": 1,
  "affected": 1,
  "pointsExpired": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `scanned` | Sí | `number` | Sin restricción adicional declarada | Membresías revisadas en este lote | `1` |
| `affected` | Sí | `number` | Sin restricción adicional declarada | Membresías a las que se les expiraron puntos | `1` |
| `pointsExpired` | Sí | `string` | Sin restricción adicional declarada | Total de puntos expirados | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/loyalty/jobs/expire-points"
}
```

---

## 4. POST /loyalty/memberships/{id}/points/earn

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `loyalty`
- **Nombre:** Acumular puntos por un evento de la aplicación
- **Operation ID:** `LoyaltyController_earnPoints`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LoyaltyController.earnPoints](../../src/modules/promotions/controllers/loyalty.controller.ts)

### Descripción de negocio

Idempotente por `idempotencyKey`: reentregar el evento no acumula dos veces.


### Descripción del sistema

NestJS resuelve `POST /loyalty/memberships/{id}/points/earn` en `LoyaltyController_earnPoints`. El controlador delega en `PromotionsLoyaltyService.earnPoints`. Valida el body como `EarnPointsDto` y consume `application/json`. El tipo de retorno estático es `Promise<PointsLedgerResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EarnPointsDto`; los campos opcionales se omiten.

```http
POST /loyalty/memberships/00000000-0000-4000-8000-000000000001/points/earn HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "earningRuleId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `PROMOTIONS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `earningRuleId` | Sí | `string` | formato `uuid` | Regla que justifica la acumulación | `00000000-0000-4000-8000-000000000001` |
| `idempotencyKey` | Sí | `string` | longitud máxima 200 | Clave de idempotencia; un reintento con la misma clave no acumula dos veces | `valor-ejemplo` |
| `sourceType` | No | `string` | longitud máxima 100 | Tipo del origen del evento | `valor-ejemplo` |
| `sourceRefId` | No | `string` | formato `uuid` | Identificador del evento de origen | `00000000-0000-4000-8000-000000000001` |
| `occurredAt` | No | `string` | formato `date-time` | Cuándo ocurrió el evento | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /loyalty/memberships/00000000-0000-4000-8000-000000000001/points/earn HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "earningRuleId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo",
  "sourceType": "valor-ejemplo",
  "sourceRefId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PointsLedgerResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ledgerEntryId": "00000000-0000-4000-8000-000000000001",
  "membershipId": "00000000-0000-4000-8000-000000000001",
  "points": "valor-ejemplo",
  "balanceAfter": "valor-ejemplo",
  "lifetimePoints": "valor-ejemplo",
  "currentTierId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ledgerEntryId` | Sí | `string` | formato `uuid` | Entrada del ledger | `00000000-0000-4000-8000-000000000001` |
| `membershipId` | Sí | `string` | formato `uuid` | Identificador asociado a membership. | `00000000-0000-4000-8000-000000000001` |
| `points` | Sí | `string` | Sin restricción adicional declarada | Puntos del movimiento | `valor-ejemplo` |
| `balanceAfter` | Sí | `string` | Sin restricción adicional declarada | Saldo tras el movimiento | `valor-ejemplo` |
| `lifetimePoints` | Sí | `string` | Sin restricción adicional declarada | Puntos de por vida tras el movimiento | `valor-ejemplo` |
| `currentTierId` | No | `string` | formato `uuid` | Nivel actual tras recalcular | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si la clave de idempotencia ya se había usado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PROMOTIONS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 404 | `NOT_FOUND` | Regla de acumulación no encontrada | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La membresía no está activa | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 422 | `PRECONDITION_FAILED` | La regla pertenece a otro programa | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 422 | `PRECONDITION_FAILED` | La regla de acumulación no está activa | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 422 | `PRECONDITION_FAILED` | La regla de acumulación está fuera de vigencia | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 422 | `PRECONDITION_FAILED` | La regla no otorga puntos | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 422 | `PRECONDITION_FAILED` | La regla alcanzó su tope en el periodo | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/loyalty/memberships/{id}/points/earn"
}
```

---

## 5. POST /loyalty/memberships/{id}/points/redeem

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `loyalty`
- **Nombre:** Canjear puntos
- **Operation ID:** `LoyaltyController_redeemPoints`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LoyaltyController.redeemPoints](../../src/modules/promotions/controllers/loyalty.controller.ts)

### Descripción de negocio

Idempotente por `idempotencyKey`; el saldo nunca queda negativo.


### Descripción del sistema

NestJS resuelve `POST /loyalty/memberships/{id}/points/redeem` en `LoyaltyController_redeemPoints`. El controlador delega en `PromotionsLoyaltyService.redeemPoints`. Valida el body como `RedeemPointsDto` y consume `application/json`. El tipo de retorno estático es `Promise<PointsLedgerResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RedeemPointsDto`; los campos opcionales se omiten.

```http
POST /loyalty/memberships/00000000-0000-4000-8000-000000000001/points/redeem HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "points": "valor-ejemplo",
  "idempotencyKey": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MEMBER`, `PROMOTIONS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `points` | Sí | `string` | Sin restricción adicional declarada | Puntos a canjear | `valor-ejemplo` |
| `idempotencyKey` | Sí | `string` | longitud máxima 200 | Clave de idempotencia del canje | `valor-ejemplo` |
| `awardType` | No | `string` | valores: `POINTS`, `WALLET_CREDIT` | Sin descripción específica en el contrato OpenAPI. | `POINTS` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /loyalty/memberships/00000000-0000-4000-8000-000000000001/points/redeem HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "points": "valor-ejemplo",
  "idempotencyKey": "valor-ejemplo",
  "awardType": "POINTS"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PointsLedgerResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PointsLedgerResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ledgerEntryId": "00000000-0000-4000-8000-000000000001",
  "membershipId": "00000000-0000-4000-8000-000000000001",
  "points": "valor-ejemplo",
  "balanceAfter": "valor-ejemplo",
  "lifetimePoints": "valor-ejemplo",
  "currentTierId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ledgerEntryId` | Sí | `string` | formato `uuid` | Entrada del ledger | `00000000-0000-4000-8000-000000000001` |
| `membershipId` | Sí | `string` | formato `uuid` | Identificador asociado a membership. | `00000000-0000-4000-8000-000000000001` |
| `points` | Sí | `string` | Sin restricción adicional declarada | Puntos del movimiento | `valor-ejemplo` |
| `balanceAfter` | Sí | `string` | Sin restricción adicional declarada | Saldo tras el movimiento | `valor-ejemplo` |
| `lifetimePoints` | Sí | `string` | Sin restricción adicional declarada | Puntos de por vida tras el movimiento | `valor-ejemplo` |
| `currentTierId` | No | `string` | formato `uuid` | Nivel actual tras recalcular | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si la clave de idempotencia ya se había usado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MEMBER, PROMOTIONS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El canje debe ser de puntos positivos | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 422 | `PRECONDITION_FAILED` | La membresía no está activa | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 422 | `PRECONDITION_FAILED` | Saldo de puntos insuficiente | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/loyalty/memberships/{id}/points/redeem"
}
```

---

## 6. POST /loyalty/memberships/{id}/recompute

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `loyalty`
- **Nombre:** Reproyectar saldo y nivel desde el ledger
- **Operation ID:** `LoyaltyController_recomputeBalance`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LoyaltyController.recomputeBalance](../../src/modules/promotions/controllers/loyalty.controller.ts)

### Descripción de negocio

El ledger es la fuente de verdad; el saldo de la membresía es derivado.


### Descripción del sistema

NestJS resuelve `POST /loyalty/memberships/{id}/recompute` en `LoyaltyController_recomputeBalance`. El controlador delega en `PromotionsLoyaltyService.recomputeBalance`. No recibe body. El tipo de retorno estático es `Promise<RecomputeBalanceResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /loyalty/memberships/00000000-0000-4000-8000-000000000001/recompute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `PROMOTIONS_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /loyalty/memberships/00000000-0000-4000-8000-000000000001/recompute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RecomputeBalanceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RecomputeBalanceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RecomputeBalanceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RecomputeBalanceResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RecomputeBalanceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RecomputeBalanceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RecomputeBalanceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RecomputeBalanceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RecomputeBalanceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RecomputeBalanceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "membershipId": "00000000-0000-4000-8000-000000000001",
  "pointsBalance": "valor-ejemplo",
  "lifetimePoints": "valor-ejemplo",
  "currentTierId": "00000000-0000-4000-8000-000000000001",
  "tierChanged": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `membershipId` | Sí | `string` | formato `uuid` | Identificador asociado a membership. | `00000000-0000-4000-8000-000000000001` |
| `pointsBalance` | Sí | `string` | Sin restricción adicional declarada | Saldo reproyectado desde el ledger | `valor-ejemplo` |
| `lifetimePoints` | Sí | `string` | Sin restricción adicional declarada | Valor de lifetime points mantenido por la instancia. | `valor-ejemplo` |
| `currentTierId` | No | `string` | formato `uuid` | Identificador asociado a current tier. | `00000000-0000-4000-8000-000000000001` |
| `tierChanged` | Sí | `boolean` | Sin restricción adicional declarada | true si el nivel cambió al recalcular | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PROMOTIONS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/loyalty/memberships/{id}/recompute"
}
```

---

## 7. GET /loyalty/programs

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `loyalty`
- **Nombre:** Listar programas de lealtad activos
- **Operation ID:** `LoyaltyController_listActivePrograms`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LoyaltyController.listActivePrograms](../../src/modules/promotions/controllers/loyalty.controller.ts)

### Descripción de negocio

Listar programas de lealtad activos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-51-06 (descubrimiento). `loyalty/jobs/expire-points` exige un `loyaltyProgramId` puntual y no existía forma de listar qué programas activos barrer; este endpoint alimenta ese descubrimiento.

### Descripción del sistema

NestJS resuelve `GET /loyalty/programs` en `LoyaltyController_listActivePrograms`. El controlador delega en `PromotionsLoyaltyService.listActivePrograms`. No recibe body. El tipo de retorno estático es `Promise<ListActiveLoyaltyProgramsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tamaño máximo del lote | `100` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /loyalty/programs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `PROMOTIONS_ADMIN`, `MARKETING_MANAGER`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /loyalty/programs?limit=100 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListActiveLoyaltyProgramsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListActiveLoyaltyProgramsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListActiveLoyaltyProgramsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListActiveLoyaltyProgramsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListActiveLoyaltyProgramsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListActiveLoyaltyProgramsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListActiveLoyaltyProgramsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "programs": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `programs` | Sí | `array<ActiveLoyaltyProgramSummaryDto>` | Sin restricción adicional declarada | Valor de programs mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo"}]` |
| `programs[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `programs[].code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `programs[].name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PROMOTIONS_ADMIN, MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/loyalty/programs"
}
```

---

## 8. POST /loyalty/programs

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `loyalty`
- **Nombre:** Crear un programa de lealtad con niveles y reglas
- **Operation ID:** `LoyaltyController_createProgram`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LoyaltyController.createProgram](../../src/modules/promotions/controllers/loyalty.controller.ts)

### Descripción de negocio

Crear un programa de lealtad con niveles y reglas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /loyalty/programs` en `LoyaltyController_createProgram`. El controlador delega en `PromotionsLoyaltyService.createProgram`. Valida el body como `CreateLoyaltyProgramDto` y consume `application/json`. El tipo de retorno estático es `Promise<LoyaltyProgramResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateLoyaltyProgramDto`; los campos opcionales se omiten.

```http
POST /loyalty/programs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PROMOTIONS_ADMIN`, `MARKETING_MANAGER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código del programa, único por tenant | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `programType` | Sí | `string` | valores: `POINTS`, `TIERED` | Sin descripción específica en el contrato OpenAPI. | `POINTS` |
| `pointsCurrencyName` | No | `string` | longitud máxima 100 | Nombre de la moneda de puntos ("Estrellas") | `BOB` |
| `pointToCurrencyRate` | No | `string` | Sin restricción adicional declarada | Cuánto vale un punto en moneda, como cadena decimal | `BOB` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `expiryPolicy` | No | `string` | valores: `NEVER`, `ROLLING` | Sin descripción específica en el contrato OpenAPI. | `NEVER` |
| `pointsExpiryDays` | No | `number` | mínimo 1 | Días de vigencia de los puntos; obligatorio si la política es ROLLING | `1` |
| `tiers` | Sí | `array<LoyaltyTierDto>` | mínimo 1 elemento(s) | Niveles del programa, al menos uno | `[{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","minPoints":"valor-ejemplo","multiplier":"valor-ejemplo","benefitsJson":{}}]` |
| `tiers[].code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `tiers[].name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `tiers[].minPoints` | Sí | `string` | Sin restricción adicional declarada | Puntos de por vida a partir de los cuales aplica el nivel | `valor-ejemplo` |
| `tiers[].multiplier` | No | `string` | Sin restricción adicional declarada | Multiplicador de acumulación del nivel | `valor-ejemplo` |
| `tiers[].benefitsJson` | No | `object` | Sin restricción adicional declarada | Beneficios del nivel | `{}` |
| `earningRules` | No | `array<EarningRuleDto>` | Sin restricción adicional declarada | Reglas de acumulación | `[{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","eventType":"BOOKING_COMPLETED","awardType":"POINTS","pointsAmount":"valor-ejemplo","creditAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001","conditionJson":{},"capPerPeriod":1,"capPeriod":"DAY","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `earningRules[].code` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `earningRules[].name` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `earningRules[].eventType` | No | `string` | valores: `BOOKING_COMPLETED`, `COURSE_COMPLETED`, `REVIEW_POSTED`, `STREAK` | Sin descripción específica en el contrato OpenAPI. | `BOOKING_COMPLETED` |
| `earningRules[].awardType` | No | `string` | valores: `POINTS`, `WALLET_CREDIT` | Sin descripción específica en el contrato OpenAPI. | `POINTS` |
| `earningRules[].pointsAmount` | No | `string` | Sin restricción adicional declarada | Puntos que otorga; obligatorio si el premio es POINTS | `valor-ejemplo` |
| `earningRules[].creditAmount` | No | `string` | Sin restricción adicional declarada | Crédito que otorga; obligatorio si el premio es WALLET_CREDIT | `valor-ejemplo` |
| `earningRules[].currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `earningRules[].conditionJson` | No | `object` | Sin restricción adicional declarada | Condición adicional evaluada por el worker | `{}` |
| `earningRules[].capPerPeriod` | No | `number` | mínimo 1 | Máximo de acumulaciones por periodo | `1` |
| `earningRules[].capPeriod` | No | `string` | valores: `DAY`, `WEEK`, `MONTH` | Sin descripción específica en el contrato OpenAPI. | `DAY` |
| `earningRules[].validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `earningRules[].validTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /loyalty/programs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<LoyaltyProgramResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LoyaltyProgramResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LoyaltyProgramResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LoyaltyProgramResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LoyaltyProgramResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LoyaltyProgramResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LoyaltyProgramResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LoyaltyProgramResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LoyaltyProgramResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LoyaltyProgramResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "tierIds": [
    "valor-ejemplo"
  ],
  "earningRuleIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `tierIds` | Sí | `array<string>` | formato `uuid` | Niveles creados, de menor a mayor umbral | `["valor-ejemplo"]` |
| `earningRuleIds` | Sí | `array<string>` | formato `uuid` | Valor de earning rule ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PROMOTIONS_ADMIN, MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un programa con ese código | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una política de vencimiento ROLLING necesita días de vigencia | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 422 | `PRECONDITION_FAILED` | Una regla de puntos necesita pointsAmount | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 422 | `PRECONDITION_FAILED` | Una regla de crédito necesita creditAmount | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/loyalty/programs"
}
```

---

## 9. POST /loyalty/programs/{id}/memberships

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `loyalty`
- **Nombre:** Inscribir a un miembro en el programa
- **Operation ID:** `LoyaltyController_enrollMember`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LoyaltyController.enrollMember](../../src/modules/promotions/controllers/loyalty.controller.ts)

### Descripción de negocio

Idempotente: repetir la llamada devuelve la membresía existente.


### Descripción del sistema

NestJS resuelve `POST /loyalty/programs/{id}/memberships` en `LoyaltyController_enrollMember`. El controlador delega en `PromotionsLoyaltyService.enrollMember`. Valida el body como `EnrollMemberDto` y consume `application/json`. El tipo de retorno estático es `Promise<MembershipResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EnrollMemberDto`; los campos opcionales se omiten.

```http
POST /loyalty/programs/00000000-0000-4000-8000-000000000001/memberships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "memberType": "USER",
  "memberRefId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PROMOTIONS_ADMIN`, `MEMBER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `memberType` | Sí | `string` | valores: `USER`, `PATIENT` | Sin descripción específica en el contrato OpenAPI. | `USER` |
| `memberRefId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `signupBonusPoints` | No | `string` | Sin restricción adicional declarada | Puntos de bienvenida a acreditar con el alta | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /loyalty/programs/00000000-0000-4000-8000-000000000001/memberships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "memberType": "USER",
  "memberRefId": "00000000-0000-4000-8000-000000000001",
  "signupBonusPoints": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MembershipResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MembershipResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MembershipResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "currentTierId": "00000000-0000-4000-8000-000000000001",
  "pointsBalance": "valor-ejemplo",
  "lifetimePoints": "valor-ejemplo",
  "alreadyEnrolled": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `currentTierId` | No | `string` | formato `uuid` | Identificador asociado a current tier. | `00000000-0000-4000-8000-000000000001` |
| `pointsBalance` | Sí | `string` | Sin restricción adicional declarada | Saldo de puntos | `valor-ejemplo` |
| `lifetimePoints` | Sí | `string` | Sin restricción adicional declarada | Puntos acumulados de por vida | `valor-ejemplo` |
| `alreadyEnrolled` | Sí | `boolean` | Sin restricción adicional declarada | true si ya estaba inscrito: la inscripción es idempotente | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PROMOTIONS_ADMIN, MEMBER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Programa de lealtad no encontrado | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El programa no está activo | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 422 | `PRECONDITION_FAILED` | El programa no tiene niveles definidos | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/loyalty/programs/{id}/memberships"
}
```

---

## 10. POST /promotions

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `promotions`
- **Nombre:** Crear una promoción con sus reglas de descuento
- **Operation ID:** `PromotionsController_createPromotion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PromotionsController.createPromotion](../../src/modules/promotions/controllers/promotions.controller.ts)

### Descripción de negocio

Crear una promoción con sus reglas de descuento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /promotions` en `PromotionsController_createPromotion`. El controlador delega en `PromotionsDiscountsService.createPromotion`. Valida el body como `CreatePromotionDto` y consume `application/json`. El tipo de retorno estático es `Promise<PromotionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePromotionDto`; los campos opcionales se omiten.

```http
POST /promotions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PROMOTIONS_ADMIN`, `MARKETING_MANAGER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código de la promoción, único por tenant | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `promotionType` | Sí | `string` | valores: `AUTOMATIC`, `COUPON` | Sin descripción específica en el contrato OpenAPI. | `AUTOMATIC` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `campaignRefId` | No | `string` | formato `uuid` | Campaña de marketing asociada | `00000000-0000-4000-8000-000000000001` |
| `priority` | No | `number` | Sin restricción adicional declarada | Prioridad frente a promociones que se solapan | `0` |
| `stackable` | No | `boolean` | Sin restricción adicional declarada | ¿Puede combinarse con otras promociones? | `false` |
| `budgetAmount` | No | `string` | Sin restricción adicional declarada | Presupuesto total de descuento | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `totalRedemptionLimit` | No | `number` | mínimo 1 | Redenciones totales permitidas | `1` |
| `perUserLimit` | No | `number` | mínimo 1 | Redenciones permitidas por usuario | `1` |
| `validFrom` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `rules` | Sí | `array<DiscountRuleDto>` | mínimo 1 elemento(s) | Reglas de descuento, al menos una | `[{"discountType":"PERCENTAGE","percentage":"valor-ejemplo","fixedAmount":"valor-ejemplo","currencyConceptId":"00000000-0000-4000-8000-000000000001","maxDiscountAmount":"valor-ejemplo","minPurchaseAmount":"valor-ejemplo","appliesTo":"ORDER","targetFilterJson":{},"buyQuantity":1,"getQuantity":1}]` |
| `rules[].discountType` | Sí | `string` | valores: `PERCENTAGE`, `FIXED`, `BOGO` | Sin descripción específica en el contrato OpenAPI. | `PERCENTAGE` |
| `rules[].percentage` | No | `string` | Sin restricción adicional declarada | Porcentaje 0-100; obligatorio si el tipo es PERCENTAGE | `valor-ejemplo` |
| `rules[].fixedAmount` | No | `string` | Sin restricción adicional declarada | Importe fijo; obligatorio si el tipo es FIXED | `valor-ejemplo` |
| `rules[].currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `rules[].maxDiscountAmount` | No | `string` | Sin restricción adicional declarada | Tope del descuento resultante | `valor-ejemplo` |
| `rules[].minPurchaseAmount` | No | `string` | Sin restricción adicional declarada | Compra mínima para que la regla aplique | `valor-ejemplo` |
| `rules[].appliesTo` | No | `string` | valores: `ORDER`, `ITEM`, `CATEGORY` | Sin descripción específica en el contrato OpenAPI. | `ORDER` |
| `rules[].targetFilterJson` | No | `object` | Sin restricción adicional declarada | Filtro de los ítems alcanzados | `{}` |
| `rules[].buyQuantity` | No | `number` | mínimo 1 | Unidades a comprar; obligatorio si el tipo es BOGO | `1` |
| `rules[].getQuantity` | No | `number` | mínimo 1 | Unidades bonificadas; obligatorio si el tipo es BOGO | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /promotions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PromotionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PromotionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PromotionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PromotionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PromotionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PromotionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PromotionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PromotionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PromotionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PromotionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "ruleIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `ruleIds` | Sí | `array<string>` | formato `uuid` | Valor de rule ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PROMOTIONS_ADMIN, MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una promoción con ese código | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La promoción debe terminar después de empezar | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | Una regla PERCENTAGE necesita porcentaje | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | El porcentaje debe estar entre 0 y 100 | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | Una regla FIXED necesita importe | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | Una regla BOGO necesita buyQuantity y getQuantity | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/promotions"
}
```

---

## 11. POST /promotions/{id}/coupons/batch

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `promotions`
- **Nombre:** Emitir un lote de cupones
- **Operation ID:** `PromotionsController_issueCoupons`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PromotionsController.issueCoupons](../../src/modules/promotions/controllers/promotions.controller.ts)

### Descripción de negocio

Los códigos se generan aleatorios y únicos; la promoción debe estar activa.


### Descripción del sistema

NestJS resuelve `POST /promotions/{id}/coupons/batch` en `PromotionsController_issueCoupons`. El controlador delega en `PromotionsDiscountsService.issueCoupons`. Valida el body como `IssueCouponsDto` y consume `application/json`. El tipo de retorno estático es `Promise<IssueCouponsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IssueCouponsDto`; los campos opcionales se omiten.

```http
POST /promotions/00000000-0000-4000-8000-000000000001/coupons/batch HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "couponType": "PUBLIC",
  "quantity": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PROMOTIONS_ADMIN`, `MARKETING_MANAGER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `couponType` | Sí | `string` | valores: `PUBLIC`, `SINGLE_USE`, `PERSONAL`, `BATCH` | Sin descripción específica en el contrato OpenAPI. | `PUBLIC` |
| `quantity` | Sí | `number` | mínimo 1; máximo 1000 | Cupones a emitir | `1` |
| `codePrefix` | No | `string` | longitud máxima 20 | Prefijo del código generado | `CODIGO_EJEMPLO` |
| `maxRedemptions` | No | `number` | mínimo 1 | Redenciones permitidas por cupón | `1` |
| `assignedMemberType` | No | `string` | valores: `USER`, `PATIENT` | Sólo para cupones PERSONAL | `USER` |
| `assignedMemberRefId` | No | `string` | formato `uuid` | Sólo para cupones PERSONAL | `00000000-0000-4000-8000-000000000001` |
| `validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /promotions/00000000-0000-4000-8000-000000000001/coupons/batch HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IssueCouponsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IssueCouponsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IssueCouponsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IssueCouponsResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IssueCouponsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IssueCouponsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IssueCouponsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IssueCouponsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IssueCouponsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IssueCouponsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IssueCouponsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "promotionId": "00000000-0000-4000-8000-000000000001",
  "issued": 1,
  "codes": [
    "CODIGO_EJEMPLO"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `promotionId` | Sí | `string` | formato `uuid` | Identificador asociado a promotion. | `00000000-0000-4000-8000-000000000001` |
| `issued` | Sí | `number` | Sin restricción adicional declarada | Cupones emitidos | `1` |
| `codes` | Sí | `array<string>` | Sin restricción adicional declarada | Códigos generados | `["CODIGO_EJEMPLO"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PROMOTIONS_ADMIN, MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Promoción no encontrada | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 409 | `CONFLICT` | No se pudieron generar códigos de cupón libres | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un cupón PERSONAL necesita miembro asignado | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | Un cupón PERSONAL se emite de uno en uno | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | La promoción no está activa | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/promotions/{id}/coupons/batch"
}
```

---

## 12. POST /redemptions

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `promotions`
- **Nombre:** Redimir un cupón y registrar la redención
- **Operation ID:** `PromotionsController_redeemCoupon`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PromotionsController.redeemCoupon](../../src/modules/promotions/controllers/promotions.controller.ts)

### Descripción de negocio

Redimir un cupón y registrar la redención. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /redemptions` en `PromotionsController_redeemCoupon`. El controlador delega en `PromotionsDiscountsService.redeemCoupon`. Valida el body como `CreateRedemptionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RedemptionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateRedemptionDto`; los campos opcionales se omiten.

```http
POST /redemptions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "orderAmount": "valor-ejemplo",
  "redeemerType": "USER",
  "redeemerRefId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CASHIER`, `PROMOTIONS_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Código del cupón | `CODIGO_EJEMPLO` |
| `orderAmount` | Sí | `string` | Sin restricción adicional declarada | Importe de la orden, como cadena decimal | `valor-ejemplo` |
| `redeemerType` | Sí | `string` | valores: `USER`, `PATIENT` | Sin descripción específica en el contrato OpenAPI. | `USER` |
| `redeemerRefId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `orderRefType` | No | `string` | longitud máxima 100 | Tipo de la orden | `valor-ejemplo` |
| `orderRefId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `paymentIntentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /redemptions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RedemptionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RedemptionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RedemptionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RedemptionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RedemptionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RedemptionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RedemptionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RedemptionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RedemptionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RedemptionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "promotionId": "00000000-0000-4000-8000-000000000001",
  "discountAmount": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `promotionId` | Sí | `string` | formato `uuid` | Identificador asociado a promotion. | `00000000-0000-4000-8000-000000000001` |
| `discountAmount` | Sí | `string` | Sin restricción adicional declarada | Descuento aplicado | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CASHIER, PROMOTIONS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cupón no encontrado | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 404 | `NOT_FOUND` | Promoción del cupón no encontrada | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | rejection | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | Ninguna regla aplica al importe de la orden | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | La promoción alcanzó su límite de redenciones | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | El usuario alcanzó su límite de redenciones en la promoción | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 422 | `PRECONDITION_FAILED` | La promoción agotó su presupuesto | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/redemptions"
}
```

---

## 13. POST /redemptions/{id}/reverse

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `promotions`
- **Nombre:** Revertir una redención por devolución o cancelación
- **Operation ID:** `PromotionsController_reverseRedemption`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PromotionsController.reverseRedemption](../../src/modules/promotions/controllers/promotions.controller.ts)

### Descripción de negocio

Libera el uso del cupón y compensa los puntos con una entrada de ajuste.


### Descripción del sistema

NestJS resuelve `POST /redemptions/{id}/reverse` en `PromotionsController_reverseRedemption`. El controlador delega en `PromotionsDiscountsService.reverseRedemption`. Valida el body como `ReverseRedemptionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReverseRedemptionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReverseRedemptionDto`; los campos opcionales se omiten.

```http
POST /redemptions/00000000-0000-4000-8000-000000000001/reverse HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "REFUND"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CASHIER`, `PROMOTIONS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | valores: `REFUND`, `CANCEL` | Sin descripción específica en el contrato OpenAPI. | `REFUND` |
| `membershipId` | No | `string` | formato `uuid` | Membresía a la que devolver los puntos, si la redención fue por puntos | `00000000-0000-4000-8000-000000000001` |
| `restorePoints` | No | `string` | Sin restricción adicional declarada | Puntos a restituir | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /redemptions/00000000-0000-4000-8000-000000000001/reverse HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "REFUND",
  "membershipId": "00000000-0000-4000-8000-000000000001",
  "restorePoints": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReverseRedemptionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReverseRedemptionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReverseRedemptionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReverseRedemptionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReverseRedemptionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReverseRedemptionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReverseRedemptionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReverseRedemptionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReverseRedemptionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReverseRedemptionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReverseRedemptionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "redemptionId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "ledgerEntryId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `redemptionId` | Sí | `string` | formato `uuid` | Identificador asociado a redemption. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `ledgerEntryId` | No | `string` | formato `uuid` | Entrada de compensación en el ledger | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CASHIER, PROMOTIONS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Redención no encontrada | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 409 | `CONFLICT` | La redención ya no está aplicada | Excepción explícita en src/modules/promotions/services/promotions-discounts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/redemptions/{id}/reverse"
}
```

---

## 14. POST /referral-programs/{id}/referrals

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `loyalty`
- **Nombre:** Generar el código de referido del miembro
- **Operation ID:** `LoyaltyController_createReferral`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LoyaltyController.createReferral](../../src/modules/promotions/controllers/loyalty.controller.ts)

### Descripción de negocio

El referidor es el usuario autenticado.


### Descripción del sistema

NestJS resuelve `POST /referral-programs/{id}/referrals` en `LoyaltyController_createReferral`. El controlador delega en `PromotionsLoyaltyService.createReferral`. Valida el body como `PromotionsCreateReferralDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReferralResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PromotionsCreateReferralDto`; los campos opcionales se omiten.

```http
POST /referral-programs/00000000-0000-4000-8000-000000000001/referrals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MEMBER`, `PROMOTIONS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `refereeContact` | No | `string` | longitud máxima 200 | Contacto del referido (email o teléfono) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /referral-programs/00000000-0000-4000-8000-000000000001/referrals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "refereeContact": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReferralResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReferralResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReferralResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "referralCode": "CODIGO_EJEMPLO",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `referralCode` | Sí | `string` | Sin restricción adicional declarada | Código a compartir | `CODIGO_EJEMPLO` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MEMBER, PROMOTIONS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Programa de referidos no encontrado | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 409 | `CONFLICT` | No se pudo generar un código de referido libre | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El programa de referidos no está activo | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 422 | `PRECONDITION_FAILED` | El programa de referidos está fuera de vigencia | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 422 | `PRECONDITION_FAILED` | El usuario alcanzó su máximo de referidos en el programa | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/referral-programs/{id}/referrals"
}
```

---

## 15. POST /referrals/{id}/qualify

- **Módulo:** `promotions`
- **Etiqueta OpenAPI:** `loyalty`
- **Nombre:** Calificar el referido y premiar a ambas partes
- **Operation ID:** `LoyaltyController_qualifyReferral`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LoyaltyController.qualifyReferral](../../src/modules/promotions/controllers/loyalty.controller.ts)

### Descripción de negocio

Idempotente por referido: reentregar el evento no duplica la recompensa.


### Descripción del sistema

NestJS resuelve `POST /referrals/{id}/qualify` en `LoyaltyController_qualifyReferral`. El controlador delega en `PromotionsLoyaltyService.qualifyReferral`. Valida el body como `QualifyReferralDto` y consume `application/json`. El tipo de retorno estático es `Promise<QualifyReferralResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `QualifyReferralDto`; los campos opcionales se omiten.

```http
POST /referrals/00000000-0000-4000-8000-000000000001/qualify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "refereeUserId": "00000000-0000-4000-8000-000000000001",
  "qualifyingEvent": "SIGNUP",
  "referrerMembershipId": "00000000-0000-4000-8000-000000000001",
  "refereeMembershipId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `PROMOTIONS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `refereeUserId` | Sí | `string` | formato `uuid` | Usuario referido que cumplió el evento | `00000000-0000-4000-8000-000000000001` |
| `qualifyingEvent` | Sí | `string` | valores: `SIGNUP`, `FIRST_BOOKING`, `FIRST_PAYMENT` | Sin descripción específica en el contrato OpenAPI. | `SIGNUP` |
| `referrerMembershipId` | Sí | `string` | formato `uuid` | Membresía de lealtad del referidor | `00000000-0000-4000-8000-000000000001` |
| `refereeMembershipId` | Sí | `string` | formato `uuid` | Membresía de lealtad del referido | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /referrals/00000000-0000-4000-8000-000000000001/qualify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "refereeUserId": "00000000-0000-4000-8000-000000000001",
  "qualifyingEvent": "SIGNUP",
  "referrerMembershipId": "00000000-0000-4000-8000-000000000001",
  "refereeMembershipId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<QualifyReferralResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<QualifyReferralResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<QualifyReferralResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<QualifyReferralResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<QualifyReferralResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<QualifyReferralResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<QualifyReferralResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<QualifyReferralResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<QualifyReferralResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<QualifyReferralResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `QualifyReferralResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "referralId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "referrerLedgerEntryId": "00000000-0000-4000-8000-000000000001",
  "refereeLedgerEntryId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `referralId` | Sí | `string` | formato `uuid` | Identificador asociado a referral. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `referrerLedgerEntryId` | No | `string` | formato `uuid` | Entrada del ledger del referidor | `00000000-0000-4000-8000-000000000001` |
| `refereeLedgerEntryId` | No | `string` | formato `uuid` | Entrada del ledger del referido | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PROMOTIONS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Referido no encontrado | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 404 | `NOT_FOUND` | Programa de referidos no encontrado | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 404 | `NOT_FOUND` | Membresía de la recompensa no encontrada | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 409 | `CONFLICT` | El referido ya fue calificado | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un usuario no puede referirse a sí mismo | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 422 | `PRECONDITION_FAILED` | El evento recibido no es el que califica en este programa | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 422 | `PRECONDITION_FAILED` | El programa de referidos no define moneda para el crédito de billetera | Excepción explícita en src/modules/promotions/services/promotions-loyalty.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/referrals/{id}/qualify"
}
```

---

