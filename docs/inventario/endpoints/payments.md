<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `payments`

- **Bloque:** Financiero y ERP (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)
- **Operaciones:** 14 (14 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 1 · MEDIO 12 · BAJO 1
- **Tablas distintas que tocan:** 19
- **Respuestas de error y detalle contractual:** `openapi/endpoints/payments.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/payments/callbacks/{callbackPath}` | Recibir el callback/webhook del gateway (idempotente) | ALTO | 6 | pública |
| 2 | POST | `/payments/checkout-sessions` | Abrir una sesión de checkout con contexto de cajero | MEDIO | 4 | PAYMENTS_ADMIN, CASHIER |
| 3 | POST | `/payments/fee-schedules` | Publicar una versión del tarifario | MEDIO | 3 | PAYMENTS_ADMIN |
| 4 | POST | `/payments/intents` | Crear una intención de pago idempotente | MEDIO | 2 | PAYMENTS_ADMIN, CASHIER |
| 5 | POST | `/payments/intents/{id}/fx-lock` | Bloquear el tipo de cambio de la intención | MEDIO | 4 | PAYMENTS_ADMIN |
| 6 | POST | `/payments/intents/{id}/risk-assessment` | Registrar la evaluación de riesgo y 3-D Secure | MEDIO | 3 | PAYMENTS_ADMIN |
| 7 | POST | `/payments/intents/{id}/splits` | Repartir el cobro entre cuentas conectadas | MEDIO | 3 | PAYMENTS_ADMIN |
| 8 | POST | `/payments/intents/{id}/transactions` | Procesar la transacción contra el gateway (authorize/capture) | MEDIO | 5 | PAYMENTS_ADMIN, CASHIER |
| 9 | POST | `/payments/payouts` | Ejecutar un payout a una cuenta conectada | MEDIO | 2 | PAYMENTS_ADMIN |
| 10 | POST | `/payments/reconciliation-runs` | Conciliar gateway contra ledger y abrir excepciones | MEDIO | 5 | PAYMENTS_ADMIN |
| 11 | POST | `/payments/settlements/import` | Importar la liquidación del gateway | MEDIO | 5 | PAYMENTS_ADMIN |
| 12 | POST | `/payments/transactions/{id}/cancellation-requests` | Solicitar la anulación del cobro | MEDIO | 2 | PAYMENTS_ADMIN, CASHIER |
| 13 | POST | `/payments/transactions/{id}/refunds` | Emitir un reembolso total o parcial | MEDIO | 3 | PAYMENTS_ADMIN |
| 14 | POST | `/payments/transactions/{id}/status-inquiry` | Consultar el estado de la transacción en el gateway | BAJO | 1 | PAYMENTS_ADMIN |

---

## 1. POST /payments/callbacks/{callbackPath}

- **Origen:** CONTRATO
- **Nombre:** Recibir el callback/webhook del gateway (idempotente)
- **Bloque:** Financiero y ERP
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PaymentsOperationsController.applyCallback` — `src/modules/payments/controllers/payments-operations.controller.ts:94`

### Qué es y para qué sirve (negocio)

Recibir el callback/webhook del gateway (idempotente). Caso de uso UC-42-06: Recibir callback del gateway (idempotente). Dentro del módulo (descripción del modelo, en inglés): «A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/payments/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_42_payments.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /payments/callbacks/{callbackPath}` la atiende `PaymentsOperationsController.applyCallback` (src/modules/payments/controllers/payments-operations.controller.ts:94). Es una ruta pública: no exige token. Valida el cuerpo como `GatewayCallbackDto` (4 campos, 2 obligatorios). Delega en `PaymentsTransactionsService.applyCallback`. Crea filas en payments.payment_webhook_events. Actualiza payments.payment_intents, payments.payment_transactions. Lee payments.payment_intents, payments.payment_transactions, payments.payment_webhook_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/payments/controllers/payments-operations.controller.ts:94` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.payment_intents` | ESCRIBE | ACTUALIZA | POR_TIPO | PaymentsOperationsController.applyCallback → PaymentsTransactionsService.applyCallback | `src/modules/payments/services/payments-transactions.service.ts:389` |
| `payments.payment_intents` | LEE | LEE | DIRECTA | PaymentsOperationsController.applyCallback → PaymentsTransactionsService.applyCallback → PaymentIntentsRepository.findByIdForUpdate | `src/modules/payments/repositories/payment-intents.repository.ts:128` |
| `payments.payment_transactions` | ESCRIBE | ACTUALIZA | POR_TIPO | PaymentsOperationsController.applyCallback → PaymentsTransactionsService.applyCallback | `src/modules/payments/services/payments-transactions.service.ts:369` |
| `payments.payment_transactions` | LEE | LEE | DIRECTA | PaymentsOperationsController.applyCallback → PaymentsTransactionsService.applyCallback → PaymentTransactionsRepository.findByGatewayRef | `src/modules/payments/repositories/payment-transactions.repository.ts:246` |
| `payments.payment_webhook_events` | ESCRIBE | CREA | DIRECTA | PaymentsOperationsController.applyCallback → PaymentsTransactionsService.applyCallback → PaymentTransactionsRepository.recordWebhookEvent | `src/modules/payments/repositories/payment-transactions.repository.ts:344` |
| `payments.payment_webhook_events` | LEE | LEE | DIRECTA | PaymentsOperationsController.applyCallback → PaymentsTransactionsService.applyCallback → PaymentTransactionsRepository.findWebhookEventByRef | `src/modules/payments/repositories/payment-transactions.repository.ts:327` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `callbackPath` | path | Sí | `string` | — |

### Cuerpo — DTO `GatewayCallbackDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `gatewayTransactionRef` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Referencia de la transacción en el gateway | `src/modules/payments/dto/payment-transaction.dto.ts:115` |
| `outcome` | `string` | Sí | valores: CAPTURED, FAILED, AUTHORIZED | `@IsIn(['CAPTURED', 'FAILED', 'AUTHORIZED'])` | Resultado informado por el gateway | `src/modules/payments/dto/payment-transaction.dto.ts:125` |
| `authorizationCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código de autorización | `src/modules/payments/dto/payment-transaction.dto.ts:134` |
| `signature` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Firma del proveedor para verificar el origen | `src/modules/payments/dto/payment-transaction.dto.ts:145` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "gatewayTransactionRef": "valor-ejemplo",
  "outcome": "CAPTURED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "gatewayTransactionRef": "valor-ejemplo",
  "outcome": "CAPTURED",
  "authorizationCode": "CODIGO_EJEMPLO",
  "signature": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CallbackResultDto>` · DTO `CallbackResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `transactionId` | `string` | Sí | formato uuid | — | Transacción correlacionada | `src/modules/payments/dto/payment-transaction.dto.ts:156` |
| `duplicate` | `boolean` | Sí | — | — | true si el callback ya se había aplicado antes | `src/modules/payments/dto/payment-transaction.dto.ts:164` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/payments/dto/payment-transaction.dto.ts:170` |
| `applied` | `boolean` | Sí | — | — | true si el evento cambió el estado local de la transacción | `src/modules/payments/dto/payment-transaction.dto.ts:179` |
| `decision` | `string` | Sí | valores: aplicar, duplicado, obsoleto, contradiccion | — | Cómo se interpretó el evento frente al estado ya conocido | `src/modules/payments/dto/payment-transaction.dto.ts:188` |
| `reconciliationRequired` | `boolean` | Sí | — | — | true si el proveedor afirmó algo incompatible con un estado terminal y hace falta conciliar | `src/modules/payments/dto/payment-transaction.dto.ts:197` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: Firma del webhook inválida |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No hay transacción para la referencia informada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/payments.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/payments-fixture.ts:106` |
| CONTROLADOR | `src/modules/payments/controllers/payments-intents.controller.spec.ts:200` |

### Flujos

- Módulo 42 — Payments — etapa `UC-42-06`

---

## 2. POST /payments/checkout-sessions

- **Origen:** CONTRATO
- **Nombre:** Abrir una sesión de checkout con contexto de cajero
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PaymentsOperationsController.openCheckout` — `src/modules/payments/controllers/payments-operations.controller.ts:60`

### Qué es y para qué sirve (negocio)

Abrir una sesión de checkout con contexto de cajero. Caso de uso UC-42-02: Abrir sesión de checkout con contexto de cajero. Dentro del módulo (descripción del modelo, en inglés): «A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/payments/README.md:46`) · MODELO (`Mantra Core Health Context/modules/diagram_42_payments.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /payments/checkout-sessions` la atiende `PaymentsOperationsController.openCheckout` (src/modules/payments/controllers/payments-operations.controller.ts:60). Exige sesión con alguno de los roles PAYMENTS_ADMIN, CASHIER. Valida el cuerpo como `OpenCheckoutSessionDto` (12 campos, 5 obligatorios). Delega en `PaymentsCheckoutService.openSession`. Crea filas en payments.cashier_payment_contexts, payments.payment_checkout_sessions. Actualiza payments.payment_debts. Lee payments.payment_debts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PAYMENTS_ADMIN, CASHIER | `src/modules/payments/controllers/payments-operations.controller.ts:60` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.cashier_payment_contexts` | ESCRIBE | CREA | DIRECTA | PaymentsOperationsController.openCheckout → PaymentsCheckoutService.openSession → PaymentFlowRepository.createCashierContext | `src/modules/payments/repositories/payment-flow.repository.ts:399` |
| `payments.payment_checkout_sessions` | ESCRIBE | CREA | DIRECTA | PaymentsOperationsController.openCheckout → PaymentsCheckoutService.openSession → PaymentFlowRepository.createCheckoutSession | `src/modules/payments/repositories/payment-flow.repository.ts:368` |
| `payments.payment_debts` | ESCRIBE | ACTUALIZA | POR_TIPO | PaymentsOperationsController.openCheckout → PaymentsCheckoutService.openSession | `src/modules/payments/services/payments-checkout.service.ts:113` |
| `payments.payment_debts` | LEE | LEE | DIRECTA | PaymentsOperationsController.openCheckout → PaymentsCheckoutService.openSession → PaymentFlowRepository.findDebtForUpdate | `src/modules/payments/repositories/payment-flow.repository.ts:420` |

### Cuerpo — DTO `OpenCheckoutSessionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/payments/dto/payment-flow.dto.ts:21` |
| `gatewayConnectionId` | `string` | Sí | formato uuid | `@IsUUID()` | Conexión del gateway habilitada para el canal | `src/modules/payments/dto/payment-flow.dto.ts:31` |
| `paymentDebtId` | `string` | Sí | formato uuid | `@IsUUID()` | Deuda que se va a cobrar | `src/modules/payments/dto/payment-flow.dto.ts:38` |
| `redirectUrl` | `string` | Sí | formato uri | `@IsUrl({ require_tld: false })` | URL a la que se redirige al pagador | `src/modules/payments/dto/payment-flow.dto.ts:45` |
| `expiresAt` | `string` | Sí | formato date-time | `@IsISO8601()` | Vencimiento de la sesión | `src/modules/payments/dto/payment-flow.dto.ts:52` |
| `paymentIntentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Intent asociado, si ya existe | `src/modules/payments/dto/payment-flow.dto.ts:63` |
| `cashierUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cajero que abre la sesión (contexto POS) | `src/modules/payments/dto/payment-flow.dto.ts:74` |
| `cashRegisterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Caja registradora | `src/modules/payments/dto/payment-flow.dto.ts:82` |
| `siteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sede | `src/modules/payments/dto/payment-flow.dto.ts:90` |
| `shiftReference` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Referencia del turno de caja | `src/modules/payments/dto/payment-flow.dto.ts:99` |
| `successReturnUrl` | `string` | No | formato url | `@IsOptional()` `@IsUrl({ require_tld: false })` | — | `src/modules/payments/dto/payment-flow.dto.ts:107` |
| `failureReturnUrl` | `string` | No | formato url | `@IsOptional()` `@IsUrl({ require_tld: false })` | — | `src/modules/payments/dto/payment-flow.dto.ts:115` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "gatewayConnectionId": "00000000-0000-4000-8000-000000000001",
  "paymentDebtId": "00000000-0000-4000-8000-000000000001",
  "redirectUrl": "https://example.com/recurso",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "gatewayConnectionId": "00000000-0000-4000-8000-000000000001",
  "paymentDebtId": "00000000-0000-4000-8000-000000000001",
  "redirectUrl": "https://example.com/recurso",
  "expiresAt": "2026-07-31T12:00:00.000Z",
  "paymentIntentId": "00000000-0000-4000-8000-000000000001",
  "cashierUserId": "00000000-0000-4000-8000-000000000001",
  "cashRegisterId": "00000000-0000-4000-8000-000000000001",
  "siteId": "00000000-0000-4000-8000-000000000001",
  "shiftReference": "valor-ejemplo",
  "successReturnUrl": "https://example.com/recurso",
  "failureReturnUrl": "https://example.com/recurso"
}
```

</details>

### Respuesta — `Promise< CheckoutSessionResponseDto & { /** * Valor de session token mantenido por la instancia. */ sessionToken: string; } >` · DTO `CheckoutSessionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/payments/dto/payment-flow.dto.ts:126` |
| `paymentDebtId` | `string` | Sí | formato uuid | — | Identificador asociado a payment debt. | `src/modules/payments/dto/payment-flow.dto.ts:132` |
| `redirectUrl` | `string` | Sí | — | — | Valor de redirect url mantenido por la instancia. | `src/modules/payments/dto/payment-flow.dto.ts:138` |
| `expiresAt` | `string` | Sí | formato date-time | — | Valor de expires at mantenido por la instancia. | `src/modules/payments/dto/payment-flow.dto.ts:144` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/payments/dto/payment-flow.dto.ts:150` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Deuda no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La deuda ya tiene un checkout abierto; PreconditionFailedException: La deuda ya está saldada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/payments.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/payments/controllers/payments-intents.controller.spec.ts:190` |

### Flujos

- Módulo 42 — Payments — etapa `UC-42-02`

---

## 3. POST /payments/fee-schedules

- **Origen:** CONTRATO
- **Nombre:** Publicar una versión del tarifario
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PaymentsOperationsController.createFeeSchedule` — `src/modules/payments/controllers/payments-operations.controller.ts:113`

### Qué es y para qué sirve (negocio)

Publicar una versión del tarifario. Caso de uso UC-42-10: Publicar versión del tarifario. Dentro del módulo (descripción del modelo, en inglés): «A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/payments/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_42_payments.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /payments/fee-schedules` la atiende `PaymentsOperationsController.createFeeSchedule` (src/modules/payments/controllers/payments-operations.controller.ts:113). Exige sesión con alguno de los roles PAYMENTS_ADMIN. Valida el cuerpo como `CreateFeeScheduleDto` (9 campos, 5 obligatorios). Delega en `PaymentsOperationsService.createFeeSchedule`. Crea filas en payments.fee_schedules. Actualiza payments.fee_schedules. Lee payments.fee_schedules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PAYMENTS_ADMIN | `src/modules/payments/controllers/payments-operations.controller.ts:113` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.fee_schedules` | ESCRIBE | ACTUALIZA | POR_TIPO | PaymentsOperationsController.createFeeSchedule → PaymentsOperationsService.createFeeSchedule | `src/modules/payments/services/payments-operations.service.ts:98` |
| `payments.fee_schedules` | ESCRIBE | CREA | DIRECTA | PaymentsOperationsController.createFeeSchedule → PaymentsOperationsService.createFeeSchedule → PaymentOperationsRepository.createFeeSchedule | `src/modules/payments/repositories/payment-operations.repository.ts:332` |
| `payments.fee_schedules` | LEE | LEE | DIRECTA | PaymentsOperationsController.createFeeSchedule → PaymentsOperationsService.createFeeSchedule → PaymentOperationsRepository.findFeeScheduleByCode | `src/modules/payments/repositories/payment-operations.repository.ts:361` |

### Cuerpo — DTO `CreateFeeScheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/payments/dto/payment-operations.dto.ts:26` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código único de la tarifa dentro del tenant | `src/modules/payments/dto/payment-operations.dto.ts:37` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/payments/dto/payment-operations.dto.ts:45` |
| `feeType` | `string` | Sí | valores: GATEWAY, PLATFORM | `@IsIn(['GATEWAY', 'PLATFORM'])` | Quién cobra la tarifa | `src/modules/payments/dto/payment-operations.dto.ts:55` |
| `method` | `string` | Sí | valores: PERCENTAGE, FIXED | `@IsIn(['PERCENTAGE', 'FIXED'])` | Modo de cálculo | `src/modules/payments/dto/payment-operations.dto.ts:65` |
| `percentage` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Porcentaje cuando method=PERCENTAGE | `src/modules/payments/dto/payment-operations.dto.ts:76` |
| `fixedAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Importe fijo cuando method=FIXED | `src/modules/payments/dto/payment-operations.dto.ts:87` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/payments/dto/payment-operations.dto.ts:95` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/payments/dto/payment-operations.dto.ts:103` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "feeType": "GATEWAY",
  "method": "PERCENTAGE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "feeType": "GATEWAY",
  "method": "PERCENTAGE",
  "percentage": "2.9",
  "fixedAmount": "0.30",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<FeeScheduleResponseDto>` · DTO `FeeScheduleResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/payments/dto/payment-operations.dto.ts:114` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/payments/dto/payment-operations.dto.ts:120` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/payments/dto/payment-operations.dto.ts:126` |
| `supersededId` | `string` | No | — | — | Id de la versión anterior que quedó superseded, si existía | `src/modules/payments/dto/payment-operations.dto.ts:135` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una tarifa porcentual exige `percentage`; PreconditionFailedException: Una tarifa fija exige `fixedAmount` |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/payments.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/payments/controllers/payments-intents.controller.spec.ts:213` |

### Flujos

- Módulo 42 — Payments — etapa `UC-42-10`

---

## 4. POST /payments/intents

- **Origen:** CONTRATO
- **Nombre:** Crear una intención de pago idempotente
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PaymentsIntentsController.createIntent` — `src/modules/payments/controllers/payments-intents.controller.ts:54`

### Qué es y para qué sirve (negocio)

Crear una intención de pago idempotente. Caso de uso UC-42-01: Crear intención de pago idempotente. Dentro del módulo (descripción del modelo, en inglés): «A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/payments/README.md:45`) · MODELO (`Mantra Core Health Context/modules/diagram_42_payments.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /payments/intents` la atiende `PaymentsIntentsController.createIntent` (src/modules/payments/controllers/payments-intents.controller.ts:54). Exige sesión con alguno de los roles PAYMENTS_ADMIN, CASHIER. Valida el cuerpo como `CreatePaymentIntentDto` (12 campos, 6 obligatorios). Delega en `PaymentsIntentsService.createIntent`. Crea filas en payments.payment_intents. Lee payments.payment_intents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PAYMENTS_ADMIN, CASHIER | `src/modules/payments/controllers/payments-intents.controller.ts:54` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.payment_intents` | ESCRIBE | CREA | DIRECTA | PaymentsIntentsController.createIntent → PaymentsIntentsService.createIntent → PaymentIntentsRepository.create | `src/modules/payments/repositories/payment-intents.repository.ts:72` |
| `payments.payment_intents` | LEE | LEE | DIRECTA | PaymentsIntentsController.createIntent → PaymentsIntentsService.createIntent → PaymentIntentsRepository.findByIdempotencyKey | `src/modules/payments/repositories/payment-intents.repository.ts:115` |

### Cuerpo — DTO `CreatePaymentIntentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant propietario del cobro | `src/modules/payments/dto/payment-intent.dto.ts:27` |
| `gatewayId` | `string` | Sí | formato uuid | `@IsUUID()` | Gateway a través del cual se cobrará | `src/modules/payments/dto/payment-intent.dto.ts:37` |
| `amount` | `string` | Sí | — | `@IsNumberString()` | Importe a cobrar, como cadena decimal para no perder precisión | `src/modules/payments/dto/payment-intent.dto.ts:48` |
| `currency` | `string` | Sí | valores: BOB, USD | `@IsIn(['BOB', 'USD'])` | Moneda ISO-4217 del cobro | `src/modules/payments/dto/payment-intent.dto.ts:58` |
| `purpose` | `string` | Sí | valores: INVOICE, DEBT, OTHER | `@IsIn(PAYMENT_PURPOSES as readonly string[])` | Propósito del cobro | `src/modules/payments/dto/payment-intent.dto.ts:65` |
| `idempotencyKey` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Clave de idempotencia del cliente. Repetirla devuelve el intent existente en lugar de cobrar dos veces. | `src/modules/payments/dto/payment-intent.dto.ts:77` |
| `gatewayConnectionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Conexión concreta del gateway | `src/modules/payments/dto/payment-intent.dto.ts:88` |
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Práctica que origina el cobro | `src/modules/payments/dto/payment-intent.dto.ts:99` |
| `invoiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Factura que se está cobrando | `src/modules/payments/dto/payment-intent.dto.ts:110` |
| `sourceRefType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo del recurso de origen (referencia polimórfica) | `src/modules/payments/dto/payment-intent.dto.ts:121` |
| `sourceRefId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del recurso de origen | `src/modules/payments/dto/payment-intent.dto.ts:132` |
| `expiresAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Vencimiento del intent | `src/modules/payments/dto/payment-intent.dto.ts:143` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "gatewayId": "00000000-0000-4000-8000-000000000001",
  "amount": "150.00",
  "currency": "BOB",
  "purpose": "INVOICE",
  "idempotencyKey": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "gatewayId": "00000000-0000-4000-8000-000000000001",
  "amount": "150.00",
  "currency": "BOB",
  "purpose": "INVOICE",
  "idempotencyKey": "valor-ejemplo",
  "gatewayConnectionId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "invoiceId": "00000000-0000-4000-8000-000000000001",
  "sourceRefType": "valor-ejemplo",
  "sourceRefId": "00000000-0000-4000-8000-000000000001",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<PaymentIntentResponseDto>` · DTO `PaymentIntentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/payments/dto/payment-intent.dto.ts:152` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/payments/dto/payment-intent.dto.ts:158` |
| `amount` | `string` | Sí | — | — | Valor de amount mantenido por la instancia. | `src/modules/payments/dto/payment-intent.dto.ts:164` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concepto de estado del intent | `src/modules/payments/dto/payment-intent.dto.ts:170` |
| `idempotencyKey` | `string` | Sí | — | — | Clave de idempotencia con la que se creó | `src/modules/payments/dto/payment-intent.dto.ts:176` |
| `reused` | `boolean` | Sí | — | — | true si la petición reutilizó un intent ya existente (reintento idempotente) | `src/modules/payments/dto/payment-intent.dto.ts:185` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/payments.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-003.int-spec.ts:54` |
| INTEGRACION | `test/integration/hardening/mch-019.int-spec.ts:65` |
| INTEGRACION | `test/integration/hardening/payments-fixture.ts:66` |
| CONTROLADOR | `src/modules/payments/controllers/payments-intents.controller.spec.ts:49` |

### Flujos

- Módulo 42 — Payments — etapa `UC-42-01`

---

## 5. POST /payments/intents/{id}/fx-lock

- **Origen:** CONTRATO
- **Nombre:** Bloquear el tipo de cambio de la intención
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PaymentsIntentsController.lockFxRate` — `src/modules/payments/controllers/payments-intents.controller.ts:75`

### Qué es y para qué sirve (negocio)

Bloquear el tipo de cambio de la intención. Caso de uso UC-42-03: Bloquear tipo de cambio. Dentro del módulo (descripción del modelo, en inglés): «A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/payments/README.md:47`) · MODELO (`Mantra Core Health Context/modules/diagram_42_payments.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /payments/intents/{id}/fx-lock` la atiende `PaymentsIntentsController.lockFxRate` (src/modules/payments/controllers/payments-intents.controller.ts:75). Exige sesión con alguno de los roles PAYMENTS_ADMIN. Valida el cuerpo como `CreateFxLockDto` (5 campos, 4 obligatorios). Delega en `PaymentsIntentsService.lockFxRate`. Crea filas en payments.fx_rate_locks. Actualiza payments.payment_intents. Lee payments.fx_rate_locks, payments.payment_intents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PAYMENTS_ADMIN | `src/modules/payments/controllers/payments-intents.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/payments/controllers/payments-intents.controller.ts:75` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.fx_rate_locks` | ESCRIBE | CREA | DIRECTA | PaymentsIntentsController.lockFxRate → PaymentsIntentsService.lockFxRate → PaymentFlowRepository.createFxLock | `src/modules/payments/repositories/payment-flow.repository.ts:248` |
| `payments.fx_rate_locks` | LEE | LEE | DIRECTA | PaymentsIntentsController.lockFxRate → PaymentsIntentsService.lockFxRate → PaymentFlowRepository.findActiveFxLock | `src/modules/payments/repositories/payment-flow.repository.ts:271` |
| `payments.payment_intents` | ESCRIBE | ACTUALIZA | POR_TIPO | PaymentsIntentsController.lockFxRate → PaymentsIntentsService.lockFxRate | `src/modules/payments/services/payments-intents.service.ts:202` |
| `payments.payment_intents` | LEE | LEE | DIRECTA | PaymentsIntentsController.lockFxRate → PaymentsIntentsService.lockFxRate → PaymentIntentsRepository.findByIdForUpdate | `src/modules/payments/repositories/payment-intents.repository.ts:128` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateFxLockDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fromCurrency` | `string` | Sí | valores: BOB, USD | `@IsIn(['BOB', 'USD'])` | Moneda de origen | `src/modules/payments/dto/payment-flow.dto.ts:160` |
| `toCurrency` | `string` | Sí | valores: BOB, USD | `@IsIn(['BOB', 'USD'])` | Moneda destino | `src/modules/payments/dto/payment-flow.dto.ts:167` |
| `lockedRate` | `string` | Sí | — | `@IsNumberString()` | Cotización bloqueada | `src/modules/payments/dto/payment-flow.dto.ts:174` |
| `expiresAt` | `string` | Sí | formato date-time | `@IsISO8601()` | Vigencia del bloqueo | `src/modules/payments/dto/payment-flow.dto.ts:181` |
| `providerRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia del proveedor de FX | `src/modules/payments/dto/payment-flow.dto.ts:190` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fromCurrency": "BOB",
  "toCurrency": "BOB",
  "lockedRate": "6.96",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fromCurrency": "BOB",
  "toCurrency": "BOB",
  "lockedRate": "6.96",
  "expiresAt": "2026-07-31T12:00:00.000Z",
  "providerRef": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<FxLockResponseDto>` · DTO `FxLockResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/payments/dto/payment-flow.dto.ts:201` |
| `paymentIntentId` | `string` | Sí | formato uuid | — | Identificador asociado a payment intent. | `src/modules/payments/dto/payment-flow.dto.ts:207` |
| `lockedRate` | `string` | Sí | — | — | Valor de locked rate mantenido por la instancia. | `src/modules/payments/dto/payment-flow.dto.ts:213` |
| `convertedAmount` | `string` | Sí | — | — | Importe del intent recalculado a la moneda destino | `src/modules/payments/dto/payment-flow.dto.ts:221` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Intención de pago no encontrada |
| 409 | `CONFLICT` | ConflictException: La intención ya tiene un bloqueo de cambio vigente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El bloqueo de cambio exige monedas distintas; PreconditionFailedException: Solo se puede bloquear el cambio de una intención pendiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/payments.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/payments/controllers/payments-intents.controller.spec.ts:60` |

### Flujos

- Módulo 42 — Payments — etapa `UC-42-03`

---

## 6. POST /payments/intents/{id}/risk-assessment

- **Origen:** CONTRATO
- **Nombre:** Registrar la evaluación de riesgo y 3-D Secure
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PaymentsIntentsController.assessRisk` — `src/modules/payments/controllers/payments-intents.controller.ts:93`

### Qué es y para qué sirve (negocio)

Registrar la evaluación de riesgo y 3-D Secure. Caso de uso UC-42-04: Evaluar riesgo y 3-D Secure. Dentro del módulo (descripción del modelo, en inglés): «A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/payments/README.md:48`) · MODELO (`Mantra Core Health Context/modules/diagram_42_payments.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /payments/intents/{id}/risk-assessment` la atiende `PaymentsIntentsController.assessRisk` (src/modules/payments/controllers/payments-intents.controller.ts:93). Exige sesión con alguno de los roles PAYMENTS_ADMIN. Valida el cuerpo como `CreateRiskAssessmentDto` (5 campos, 2 obligatorios). Delega en `PaymentsIntentsService.assessRisk`. Crea filas en payments.risk_assessments. Actualiza payments.payment_intents. Lee payments.payment_intents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PAYMENTS_ADMIN | `src/modules/payments/controllers/payments-intents.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/payments/controllers/payments-intents.controller.ts:93` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.payment_intents` | ESCRIBE | ACTUALIZA | POR_TIPO | PaymentsIntentsController.assessRisk → PaymentsIntentsService.assessRisk | `src/modules/payments/services/payments-intents.service.ts:255` |
| `payments.payment_intents` | LEE | LEE | DIRECTA | PaymentsIntentsController.assessRisk → PaymentsIntentsService.assessRisk → PaymentIntentsRepository.findByIdForUpdate | `src/modules/payments/repositories/payment-intents.repository.ts:128` |
| `payments.risk_assessments` | ESCRIBE | CREA | DIRECTA | PaymentsIntentsController.assessRisk → PaymentsIntentsService.assessRisk → PaymentFlowRepository.createRiskAssessment | `src/modules/payments/repositories/payment-flow.repository.ts:288` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateRiskAssessmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `riskScore` | `string` | Sí | — | `@IsNumberString()` | Score de riesgo (0-100) | `src/modules/payments/dto/payment-flow.dto.ts:239` |
| `decision` | `string` | Sí | valores: APPROVE, REVIEW, DECLINE | `@IsIn(RISK_DECISIONS as readonly string[])` | Decisión del motor | `src/modules/payments/dto/payment-flow.dto.ts:246` |
| `threeDsAuthenticated` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true si el pagador completó 3-D Secure | `src/modules/payments/dto/payment-flow.dto.ts:256` |
| `providerRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia del proveedor antifraude | `src/modules/payments/dto/payment-flow.dto.ts:265` |
| `signals` | `object` | No | — | `@IsOptional()` | Señales crudas del motor (se persisten como jsonb) | `src/modules/payments/dto/payment-flow.dto.ts:274` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "riskScore": "12.5",
  "decision": "APPROVE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "riskScore": "12.5",
  "decision": "APPROVE",
  "threeDsAuthenticated": true,
  "providerRef": "valor-ejemplo",
  "signals": {}
}
```

</details>

### Respuesta — `Promise<RiskAssessmentResponseDto>` · DTO `RiskAssessmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/payments/dto/payment-flow.dto.ts:285` |
| `paymentIntentId` | `string` | Sí | formato uuid | — | Identificador asociado a payment intent. | `src/modules/payments/dto/payment-flow.dto.ts:291` |
| `decision` | `string` | Sí | valores: APPROVE, REVIEW, DECLINE | — | Valor de decision mantenido por la instancia. | `src/modules/payments/dto/payment-flow.dto.ts:297` |
| `riskLevel` | `string` | Sí | valores: LOW, MEDIUM, HIGH | — | Nivel derivado del score | `src/modules/payments/dto/payment-flow.dto.ts:306` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Intención de pago no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/payments.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-003.int-spec.ts:69` |
| INTEGRACION | `test/integration/hardening/mch-019.int-spec.ts:80` |
| INTEGRACION | `test/integration/hardening/payments-fixture.ts:79` |
| CONTROLADOR | `src/modules/payments/controllers/payments-intents.controller.spec.ts:74` |

### Flujos

- Módulo 42 — Payments — etapa `UC-42-04`

---

## 7. POST /payments/intents/{id}/splits

- **Origen:** CONTRATO
- **Nombre:** Repartir el cobro entre cuentas conectadas
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PaymentsIntentsController.addSplit` — `src/modules/payments/controllers/payments-intents.controller.ts:131`

### Qué es y para qué sirve (negocio)

Repartir el cobro entre cuentas conectadas. Caso de uso UC-42-11: Reparto multi-party. Dentro del módulo (descripción del modelo, en inglés): «A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/payments/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_42_payments.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /payments/intents/{id}/splits` la atiende `PaymentsIntentsController.addSplit` (src/modules/payments/controllers/payments-intents.controller.ts:131). Exige sesión con alguno de los roles PAYMENTS_ADMIN. Valida el cuerpo como `CreateSplitDto` (6 campos, 2 obligatorios). Delega en `PaymentsIntentsService.addSplit`. Crea filas en payments.payment_splits. Lee payments.payment_intents, payments.payment_splits.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PAYMENTS_ADMIN | `src/modules/payments/controllers/payments-intents.controller.ts:131` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/payments/controllers/payments-intents.controller.ts:131` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.payment_intents` | LEE | LEE | DIRECTA | PaymentsIntentsController.addSplit → PaymentsIntentsService.addSplit → PaymentIntentsRepository.findByIdForUpdate | `src/modules/payments/repositories/payment-intents.repository.ts:128` |
| `payments.payment_splits` | ESCRIBE | CREA | DIRECTA | PaymentsIntentsController.addSplit → PaymentsIntentsService.addSplit → PaymentFlowRepository.createSplit | `src/modules/payments/repositories/payment-flow.repository.ts:325` |
| `payments.payment_splits` | LEE | LEE | DIRECTA | PaymentsIntentsController.addSplit → PaymentsIntentsService.addSplit → PaymentFlowRepository.findSplitsByIntent | `src/modules/payments/repositories/payment-flow.repository.ts:354` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateSplitDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `payeeConnectedAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta conectada que recibe el reparto | `src/modules/payments/dto/payment-flow.dto.ts:322` |
| `splitType` | `string` | Sí | valores: AMOUNT, PERCENTAGE | `@IsIn(['AMOUNT', 'PERCENTAGE'])` | Modo de reparto | `src/modules/payments/dto/payment-flow.dto.ts:332` |
| `amount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Importe fijo cuando splitType=AMOUNT | `src/modules/payments/dto/payment-flow.dto.ts:340` |
| `percentage` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Porcentaje cuando splitType=PERCENTAGE | `src/modules/payments/dto/payment-flow.dto.ts:351` |
| `isPlatformFee` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true si el reparto es la comisión de la plataforma | `src/modules/payments/dto/payment-flow.dto.ts:361` |
| `destinationWalletId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Wallet destino | `src/modules/payments/dto/payment-flow.dto.ts:369` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "payeeConnectedAccountId": "00000000-0000-4000-8000-000000000001",
  "splitType": "AMOUNT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "payeeConnectedAccountId": "00000000-0000-4000-8000-000000000001",
  "splitType": "AMOUNT",
  "amount": "valor-ejemplo",
  "percentage": "15.00",
  "isPlatformFee": true,
  "destinationWalletId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SplitResponseDto>` · DTO `SplitResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/payments/dto/payment-flow.dto.ts:380` |
| `paymentIntentId` | `string` | Sí | formato uuid | — | Identificador asociado a payment intent. | `src/modules/payments/dto/payment-flow.dto.ts:386` |
| `amount` | `string` | Sí | — | — | Importe resuelto del reparto | `src/modules/payments/dto/payment-flow.dto.ts:392` |
| `isPlatformFee` | `boolean` | Sí | — | — | Valor de is platform fee mantenido por la instancia. | `src/modules/payments/dto/payment-flow.dto.ts:398` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Intención de pago no encontrada |
| 409 | `CONFLICT` | ConflictException: Los repartos superan el importe de la intención |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un reparto por importe exige `amount`; PreconditionFailedException: Un reparto por porcentaje exige `percentage` |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/payments.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/payments/controllers/payments-intents.controller.spec.ts:102` |

### Flujos

- Módulo 42 — Payments — etapa `UC-42-11`

---

## 8. POST /payments/intents/{id}/transactions

- **Origen:** CONTRATO
- **Nombre:** Procesar la transacción contra el gateway (authorize/capture)
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PaymentsIntentsController.processTransaction` — `src/modules/payments/controllers/payments-intents.controller.ts:111`

### Qué es y para qué sirve (negocio)

Procesar la transacción contra el gateway (authorize/capture). Caso de uso UC-42-05: Procesar transacción (authorize/capture/sale). Dentro del módulo (descripción del modelo, en inglés): «A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/payments/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_42_payments.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /payments/intents/{id}/transactions` la atiende `PaymentsIntentsController.processTransaction` (src/modules/payments/controllers/payments-intents.controller.ts:111). Exige sesión con alguno de los roles PAYMENTS_ADMIN, CASHIER. Valida el cuerpo como `ProcessTransactionDto` (4 campos, 1 obligatorio). Delega en `PaymentsTransactionsService.processTransaction`. Crea filas en payments.payment_transactions. Actualiza payments.payment_intents. Lee payments.payment_intents, payments.payment_transactions, payments.risk_assessments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PAYMENTS_ADMIN, CASHIER | `src/modules/payments/controllers/payments-intents.controller.ts:111` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/payments/controllers/payments-intents.controller.ts:111` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.payment_intents` | ESCRIBE | ACTUALIZA | POR_TIPO | PaymentsIntentsController.processTransaction → PaymentsTransactionsService.processTransaction | `src/modules/payments/services/payments-transactions.service.ts:219` |
| `payments.payment_intents` | LEE | LEE | DIRECTA | PaymentsIntentsController.processTransaction → PaymentsTransactionsService.processTransaction → PaymentIntentsRepository.findByIdForUpdate | `src/modules/payments/repositories/payment-intents.repository.ts:128` |
| `payments.payment_transactions` | ESCRIBE | CREA | DIRECTA | PaymentsIntentsController.processTransaction → PaymentsTransactionsService.processTransaction → PaymentTransactionsRepository.create | `src/modules/payments/repositories/payment-transactions.repository.ts:196` |
| `payments.payment_transactions` | LEE | LEE | DIRECTA | PaymentsIntentsController.processTransaction → PaymentsTransactionsService.processTransaction → PaymentTransactionsRepository.findPendingByIntent | `src/modules/payments/repositories/payment-transactions.repository.ts:300` |
| `payments.risk_assessments` | LEE | LEE | DIRECTA | PaymentsIntentsController.processTransaction → PaymentsTransactionsService.processTransaction → PaymentFlowRepository.findLatestRiskAssessment | `src/modules/payments/repositories/payment-flow.repository.ts:310` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ProcessTransactionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `operation` | `string` | Sí | valores: AUTHORIZE, CAPTURE, SALE | `@IsIn(TRANSACTION_OPERATIONS as readonly string[])` | Operación a ejecutar | `src/modules/payments/dto/payment-transaction.dto.ts:39` |
| `amount` | `string` | No | patrón runtime POSITIVE_MONEY_REGEX | `@IsOptional()` `@IsNumberString()` `@Matches(POSITIVE_MONEY_REGEX, { message: POSITIVE_MONEY_MESSAGE })` | Importe a procesar. Si se omite se toma el del intent. | `src/modules/payments/dto/payment-transaction.dto.ts:51` |
| `gatewayTransactionRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia devuelta por el gateway | `src/modules/payments/dto/payment-transaction.dto.ts:60` |
| `authorizationCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código de autorización del emisor | `src/modules/payments/dto/payment-transaction.dto.ts:69` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "operation": "AUTHORIZE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "operation": "AUTHORIZE",
  "amount": "150.00",
  "gatewayTransactionRef": "valor-ejemplo",
  "authorizationCode": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<TransactionResponseDto>` · DTO `TransactionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/payments/dto/payment-transaction.dto.ts:80` |
| `paymentIntentId` | `string` | Sí | formato uuid | — | Identificador asociado a payment intent. | `src/modules/payments/dto/payment-transaction.dto.ts:86` |
| `amount` | `string` | Sí | — | — | Valor de amount mantenido por la instancia. | `src/modules/payments/dto/payment-transaction.dto.ts:92` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/payments/dto/payment-transaction.dto.ts:98` |
| `gatewayTransactionRef` | `string` | No | — | — | Valor de gateway transaction ref mantenido por la instancia. | `src/modules/payments/dto/payment-transaction.dto.ts:104` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Intención de pago no encontrada |
| 409 | `CONFLICT` | ConflictException: La intención ya fue cobrada; ConflictException: La intención tiene una operación abierta en el gateway; ConflictException: El importe excede el saldo pendiente de la intención; ConflictException: La captura excede el importe autorizado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La intención está cancelada; PreconditionFailedException: La intención requiere evaluación de riesgo antes de cobrar; PreconditionFailedException: El motor de riesgo rechazó la intención; PreconditionFailedException: El importe a procesar debe ser mayor que cero |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/payments.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-003.int-spec.ts:78` |
| INTEGRACION | `test/integration/hardening/mch-019.int-spec.ts:94` |
| INTEGRACION | `test/integration/hardening/payments-fixture.ts:93` |
| CONTROLADOR | `src/modules/payments/controllers/payments-intents.controller.spec.ts:88` |

### Flujos

- Módulo 42 — Payments — etapa `UC-42-05`

---

## 9. POST /payments/payouts

- **Origen:** CONTRATO
- **Nombre:** Ejecutar un payout a una cuenta conectada
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PaymentsOperationsController.executePayout` — `src/modules/payments/controllers/payments-operations.controller.ts:147`

### Qué es y para qué sirve (negocio)

Ejecutar un payout a una cuenta conectada. Caso de uso UC-42-13: Ejecutar payout a cuenta conectada. Dentro del módulo (descripción del modelo, en inglés): «A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/payments/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_42_payments.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /payments/payouts` la atiende `PaymentsOperationsController.executePayout` (src/modules/payments/controllers/payments-operations.controller.ts:147). Exige sesión con alguno de los roles PAYMENTS_ADMIN. Valida el cuerpo como `CreatePayoutDto` (12 campos, 9 obligatorios). Delega en `PaymentsOperationsService.executePayout`. Crea filas en payments.payout_items, payments.payouts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PAYMENTS_ADMIN | `src/modules/payments/controllers/payments-operations.controller.ts:147` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.payout_items` | ESCRIBE | CREA | DIRECTA | PaymentsOperationsController.executePayout → PaymentsOperationsService.executePayout → PaymentOperationsRepository.createPayoutItem | `src/modules/payments/repositories/payment-operations.repository.ts:522` |
| `payments.payouts` | ESCRIBE | CREA | DIRECTA | PaymentsOperationsController.executePayout → PaymentsOperationsService.executePayout → PaymentOperationsRepository.createPayout | `src/modules/payments/repositories/payment-operations.repository.ts:492` |

### Cuerpo — DTO `CreatePayoutDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/payments/dto/payment-operations.dto.ts:323` |
| `payeeRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Cuenta conectada destinataria | `src/modules/payments/dto/payment-operations.dto.ts:330` |
| `gatewayId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/payments/dto/payment-operations.dto.ts:337` |
| `currency` | `string` | Sí | valores: BOB, USD | `@IsIn(['BOB', 'USD'])` | — | `src/modules/payments/dto/payment-operations.dto.ts:344` |
| `periodStart` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/payments/dto/payment-operations.dto.ts:351` |
| `periodEnd` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/payments/dto/payment-operations.dto.ts:358` |
| `items` | `array<PayoutItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => PayoutItemDto)` | Ítems a liquidar | `src/modules/payments/dto/payment-operations.dto.ts:368` |
| `items[].sourceRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Transacción que origina el ítem | `src/modules/payments/dto/payment-operations.dto.ts:289` |
| `items[].amount` | `string` | Sí | — | `@IsNumberString()` | — | `src/modules/payments/dto/payment-operations.dto.ts:296` |
| `items[].commissionAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/payments/dto/payment-operations.dto.ts:304` |
| `items[].description` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/payments/dto/payment-operations.dto.ts:313` |
| `gatewayPayoutRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia del payout en el gateway | `src/modules/payments/dto/payment-operations.dto.ts:377` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "payeeRefId": "00000000-0000-4000-8000-000000000001",
  "gatewayId": "00000000-0000-4000-8000-000000000001",
  "currency": "BOB",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "periodEnd": "2026-07-31T12:00:00.000Z",
  "items": [
    {
      "sourceRefId": "00000000-0000-4000-8000-000000000001",
      "amount": "100.00"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "payeeRefId": "00000000-0000-4000-8000-000000000001",
  "gatewayId": "00000000-0000-4000-8000-000000000001",
  "currency": "BOB",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "periodEnd": "2026-07-31T12:00:00.000Z",
  "items": [
    {
      "sourceRefId": "00000000-0000-4000-8000-000000000001",
      "amount": "100.00",
      "commissionAmount": "5.00",
      "description": "Texto descriptivo de ejemplo"
    }
  ],
  "gatewayPayoutRef": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<PayoutResponseDto>` · DTO `PayoutResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/payments/dto/payment-operations.dto.ts:388` |
| `amount` | `string` | Sí | — | — | Suma de los ítems | `src/modules/payments/dto/payment-operations.dto.ts:394` |
| `itemCount` | `number` | Sí | — | — | Valor de item count mantenido por la instancia. | `src/modules/payments/dto/payment-operations.dto.ts:400` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/payments/dto/payment-operations.dto.ts:406` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El importe neto del payout debe ser positivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/payments.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/payments/controllers/payments-intents.controller.spec.ts:239` |

### Flujos

- Módulo 42 — Payments — etapa `UC-42-13`

---

## 10. POST /payments/reconciliation-runs

- **Origen:** CONTRATO
- **Nombre:** Conciliar gateway contra ledger y abrir excepciones
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PaymentsOperationsController.runReconciliation` — `src/modules/payments/controllers/payments-operations.controller.ts:164`

### Qué es y para qué sirve (negocio)

Conciliar gateway contra ledger y abrir excepciones. Caso de uso UC-42-14: Conciliar gateway vs ledger. Dentro del módulo (descripción del modelo, en inglés): «A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/payments/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_42_payments.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /payments/reconciliation-runs` la atiende `PaymentsOperationsController.runReconciliation` (src/modules/payments/controllers/payments-operations.controller.ts:164). Exige sesión con alguno de los roles PAYMENTS_ADMIN. Valida el cuerpo como `CreateReconciliationRunDto` (11 campos, 10 obligatorios). Delega en `PaymentsOperationsService.runReconciliation`. Crea filas en payments.provider_reconciliation_records, payments.reconciliation_exceptions, payments.reconciliation_runs. Actualiza payments.reconciliation_runs. Lee payments.payment_transactions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PAYMENTS_ADMIN | `src/modules/payments/controllers/payments-operations.controller.ts:164` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.payment_transactions` | LEE | LEE | DIRECTA | PaymentsOperationsController.runReconciliation → PaymentsOperationsService.runReconciliation → PaymentTransactionsRepository.findByGatewayRef | `src/modules/payments/repositories/payment-transactions.repository.ts:246` |
| `payments.provider_reconciliation_records` | ESCRIBE | CREA | DIRECTA | PaymentsOperationsController.runReconciliation → PaymentsOperationsService.runReconciliation → PaymentOperationsRepository.createReconciliationRecord | `src/modules/payments/repositories/payment-operations.repository.ts:615` |
| `payments.reconciliation_exceptions` | ESCRIBE | CREA | DIRECTA | PaymentsOperationsController.runReconciliation → PaymentsOperationsService.runReconciliation → PaymentOperationsRepository.createReconciliationException | `src/modules/payments/repositories/payment-operations.repository.ts:645` |
| `payments.reconciliation_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | PaymentsOperationsController.runReconciliation → PaymentsOperationsService.runReconciliation | `src/modules/payments/services/payments-operations.service.ts:372` |
| `payments.reconciliation_runs` | ESCRIBE | CREA | DIRECTA | PaymentsOperationsController.runReconciliation → PaymentsOperationsService.runReconciliation → PaymentOperationsRepository.createReconciliationRun | `src/modules/payments/repositories/payment-operations.repository.ts:548` |

### Cuerpo — DTO `CreateReconciliationRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/payments/dto/payment-operations.dto.ts:457` |
| `gatewayId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/payments/dto/payment-operations.dto.ts:464` |
| `gatewayConnectionId` | `string` | Sí | formato uuid | `@IsUUID()` | Conexión de la que provienen los registros | `src/modules/payments/dto/payment-operations.dto.ts:474` |
| `periodStart` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/payments/dto/payment-operations.dto.ts:481` |
| `periodEnd` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/payments/dto/payment-operations.dto.ts:488` |
| `providerRecords` | `array<ProviderRecordDto>` | Sí | — | `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ProviderRecordDto)` | Extracto del proveedor | `src/modules/payments/dto/payment-operations.dto.ts:500` |
| `providerRecords[].externalTransactionId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Id de la transacción en el proveedor | `src/modules/payments/dto/payment-operations.dto.ts:417` |
| `providerRecords[].providerAmount` | `string` | Sí | — | `@IsNumberString()` | — | `src/modules/payments/dto/payment-operations.dto.ts:424` |
| `providerRecords[].providerStatusCode` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | Código de estado informado por el proveedor | `src/modules/payments/dto/payment-operations.dto.ts:432` |
| `providerRecords[].providerCurrencyCode` | `string` | Sí | valores: BOB, USD | `@IsIn(['BOB', 'USD'])` | — | `src/modules/payments/dto/payment-operations.dto.ts:439` |
| `providerRecords[].providerFeeAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/payments/dto/payment-operations.dto.ts:447` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "gatewayId": "00000000-0000-4000-8000-000000000001",
  "gatewayConnectionId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "periodEnd": "2026-07-31T12:00:00.000Z",
  "providerRecords": [
    {
      "externalTransactionId": "00000000-0000-4000-8000-000000000001",
      "providerAmount": "150.00",
      "providerStatusCode": "CODIGO_EJEMPLO",
      "providerCurrencyCode": "BOB"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "gatewayId": "00000000-0000-4000-8000-000000000001",
  "gatewayConnectionId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "periodEnd": "2026-07-31T12:00:00.000Z",
  "providerRecords": [
    {
      "externalTransactionId": "00000000-0000-4000-8000-000000000001",
      "providerAmount": "150.00",
      "providerStatusCode": "CODIGO_EJEMPLO",
      "providerCurrencyCode": "BOB",
      "providerFeeAmount": "4.65"
    }
  ]
}
```

</details>

### Respuesta — `Promise<ReconciliationRunResponseDto>` · DTO `ReconciliationRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/payments/dto/payment-operations.dto.ts:511` |
| `matchedCount` | `number` | Sí | — | — | Registros que casaron con una transacción local | `src/modules/payments/dto/payment-operations.dto.ts:519` |
| `unmatchedCount` | `number` | Sí | — | — | Registros sin contraparte local | `src/modules/payments/dto/payment-operations.dto.ts:525` |
| `exceptionCount` | `number` | Sí | — | — | Excepciones abiertas por el descuadre | `src/modules/payments/dto/payment-operations.dto.ts:531` |
| `totalGateway` | `string` | Sí | — | — | Total informado por el proveedor | `src/modules/payments/dto/payment-operations.dto.ts:540` |
| `totalLedger` | `string` | Sí | — | — | Total según el ledger local | `src/modules/payments/dto/payment-operations.dto.ts:549` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/payments/dto/payment-operations.dto.ts:555` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/payments.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/payments/controllers/payments-intents.controller.spec.ts:249` |

### Flujos

- Módulo 42 — Payments — etapa `UC-42-14`

---

## 11. POST /payments/settlements/import

- **Origen:** CONTRATO
- **Nombre:** Importar la liquidación del gateway
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PaymentsOperationsController.importSettlement` — `src/modules/payments/controllers/payments-operations.controller.ts:130`

### Qué es y para qué sirve (negocio)

Importar la liquidación del gateway. Caso de uso UC-42-12: Importar liquidación del gateway. Dentro del módulo (descripción del modelo, en inglés): «A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/payments/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_42_payments.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /payments/settlements/import` la atiende `PaymentsOperationsController.importSettlement` (src/modules/payments/controllers/payments-operations.controller.ts:130). Exige sesión con alguno de los roles PAYMENTS_ADMIN. Valida el cuerpo como `ImportSettlementDto` (12 campos, 8 obligatorios). Delega en `PaymentsOperationsService.importSettlement`. Crea filas en payments.gateway_settlements, payments.settlement_lines. Actualiza payments.payment_transactions. Lee payments.gateway_settlements, payments.payment_transactions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PAYMENTS_ADMIN | `src/modules/payments/controllers/payments-operations.controller.ts:130` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.gateway_settlements` | ESCRIBE | CREA | DIRECTA | PaymentsOperationsController.importSettlement → PaymentsOperationsService.importSettlement → PaymentOperationsRepository.createSettlement | `src/modules/payments/repositories/payment-operations.repository.ts:434` |
| `payments.gateway_settlements` | LEE | LEE | DIRECTA | PaymentsOperationsController.importSettlement → PaymentsOperationsService.importSettlement → PaymentOperationsRepository.findSettlementByRef | `src/modules/payments/repositories/payment-operations.repository.ts:456` |
| `payments.payment_transactions` | ESCRIBE | ACTUALIZA | POR_TIPO | PaymentsOperationsController.importSettlement → PaymentsOperationsService.importSettlement | `src/modules/payments/services/payments-operations.service.ts:195` |
| `payments.payment_transactions` | LEE | LEE | DIRECTA | PaymentsOperationsController.importSettlement → PaymentsOperationsService.importSettlement → PaymentTransactionsRepository.findByIdForUpdate | `src/modules/payments/repositories/payment-transactions.repository.ts:230` |
| `payments.settlement_lines` | ESCRIBE | CREA | DIRECTA | PaymentsOperationsController.importSettlement → PaymentsOperationsService.importSettlement → PaymentOperationsRepository.createSettlementLine | `src/modules/payments/repositories/payment-operations.repository.ts:470` |

### Cuerpo — DTO `ImportSettlementDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `gatewayId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/payments/dto/payment-operations.dto.ts:179` |
| `settlementRef` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Referencia del lote en el gateway (única) | `src/modules/payments/dto/payment-operations.dto.ts:190` |
| `grossAmount` | `string` | Sí | — | `@IsNumberString()` | — | `src/modules/payments/dto/payment-operations.dto.ts:197` |
| `feeAmount` | `string` | Sí | — | `@IsNumberString()` | — | `src/modules/payments/dto/payment-operations.dto.ts:204` |
| `netAmount` | `string` | Sí | — | `@IsNumberString()` | — | `src/modules/payments/dto/payment-operations.dto.ts:211` |
| `currency` | `string` | Sí | valores: BOB, USD | `@IsIn(['BOB', 'USD'])` | — | `src/modules/payments/dto/payment-operations.dto.ts:218` |
| `settledAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/payments/dto/payment-operations.dto.ts:226` |
| `lines` | `array<SettlementLineDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => SettlementLineDto)` | Detalle de la liquidación | `src/modules/payments/dto/payment-operations.dto.ts:239` |
| `lines[].paymentTransactionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Transacción liquidada | `src/modules/payments/dto/payment-operations.dto.ts:146` |
| `lines[].refundId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Reembolso liquidado | `src/modules/payments/dto/payment-operations.dto.ts:154` |
| `lines[].amount` | `string` | Sí | — | `@IsNumberString()` | — | `src/modules/payments/dto/payment-operations.dto.ts:161` |
| `lines[].feeAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/payments/dto/payment-operations.dto.ts:169` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "gatewayId": "00000000-0000-4000-8000-000000000001",
  "settlementRef": "valor-ejemplo",
  "grossAmount": "1500.00",
  "feeAmount": "46.50",
  "netAmount": "1453.50",
  "currency": "BOB",
  "lines": [
    {
      "amount": "150.00"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "gatewayId": "00000000-0000-4000-8000-000000000001",
  "settlementRef": "valor-ejemplo",
  "grossAmount": "1500.00",
  "feeAmount": "46.50",
  "netAmount": "1453.50",
  "currency": "BOB",
  "settledAt": "2026-07-31T12:00:00.000Z",
  "lines": [
    {
      "paymentTransactionId": "00000000-0000-4000-8000-000000000001",
      "refundId": "00000000-0000-4000-8000-000000000001",
      "amount": "150.00",
      "feeAmount": "4.65"
    }
  ]
}
```

</details>

### Respuesta — `Promise<SettlementResponseDto>` · DTO `SettlementResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/payments/dto/payment-operations.dto.ts:250` |
| `settlementRef` | `string` | Sí | — | — | Valor de settlement ref mantenido por la instancia. | `src/modules/payments/dto/payment-operations.dto.ts:256` |
| `lineCount` | `number` | Sí | — | — | Líneas importadas | `src/modules/payments/dto/payment-operations.dto.ts:262` |
| `settledTransactions` | `number` | Sí | — | — | Transacciones marcadas como liquidadas | `src/modules/payments/dto/payment-operations.dto.ts:268` |
| `duplicate` | `boolean` | Sí | — | — | true si el lote ya estaba importado (reintento idempotente) | `src/modules/payments/dto/payment-operations.dto.ts:276` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/payments.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/payments/controllers/payments-intents.controller.spec.ts:226` |

### Flujos

- Módulo 42 — Payments — etapa `UC-42-12`

---

## 12. POST /payments/transactions/{id}/cancellation-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitar la anulación del cobro
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PaymentsTransactionsController.requestCancellation` — `src/modules/payments/controllers/payments-transactions.controller.ts:80`

### Qué es y para qué sirve (negocio)

Solicitar la anulación del cobro. Caso de uso UC-42-09: Solicitar anulación. Dentro del módulo (descripción del modelo, en inglés): «A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/payments/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_42_payments.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /payments/transactions/{id}/cancellation-requests` la atiende `PaymentsTransactionsController.requestCancellation` (src/modules/payments/controllers/payments-transactions.controller.ts:80). Exige sesión con alguno de los roles PAYMENTS_ADMIN, CASHIER. Valida el cuerpo como `CreateCancellationDto` (4 campos, 3 obligatorios). Delega en `PaymentsTransactionsService.requestCancellation`. Crea filas en payments.payment_cancellation_requests. Lee payments.payment_transactions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PAYMENTS_ADMIN, CASHIER | `src/modules/payments/controllers/payments-transactions.controller.ts:80` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/payments/controllers/payments-transactions.controller.ts:80` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.payment_cancellation_requests` | ESCRIBE | CREA | DIRECTA | PaymentsTransactionsController.requestCancellation → PaymentsTransactionsService.requestCancellation → PaymentTransactionsRepository.createCancellation | `src/modules/payments/repositories/payment-transactions.repository.ts:381` |
| `payments.payment_transactions` | LEE | LEE | DIRECTA | PaymentsTransactionsController.requestCancellation → PaymentsTransactionsService.requestCancellation → PaymentTransactionsRepository.findByIdForUpdate | `src/modules/payments/repositories/payment-transactions.repository.ts:230` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateCancellationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/payments/dto/payment-transaction.dto.ts:270` |
| `gatewayConnectionId` | `string` | Sí | formato uuid | `@IsUUID()` | Conexión del gateway sobre la que se pide la anulación | `src/modules/payments/dto/payment-transaction.dto.ts:280` |
| `requestNumber` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Número de solicitud, único por tenant | `src/modules/payments/dto/payment-transaction.dto.ts:291` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Detalle del motivo | `src/modules/payments/dto/payment-transaction.dto.ts:300` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "gatewayConnectionId": "00000000-0000-4000-8000-000000000001",
  "requestNumber": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "gatewayConnectionId": "00000000-0000-4000-8000-000000000001",
  "requestNumber": "valor-ejemplo",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<CancellationResponseDto>` · DTO `CancellationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/payments/dto/payment-transaction.dto.ts:311` |
| `requestNumber` | `string` | Sí | — | — | Valor de request number mantenido por la instancia. | `src/modules/payments/dto/payment-transaction.dto.ts:317` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/payments/dto/payment-transaction.dto.ts:323` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Transacción no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La transacción está liquidada; corresponde un reembolso en vez de una anulación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/payments.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/payments/controllers/payments-intents.controller.spec.ts:148` |

### Flujos

- Módulo 42 — Payments — etapa `UC-42-09`

---

## 13. POST /payments/transactions/{id}/refunds

- **Origen:** CONTRATO
- **Nombre:** Emitir un reembolso total o parcial
- **Bloque:** Financiero y ERP
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PaymentsTransactionsController.refund` — `src/modules/payments/controllers/payments-transactions.controller.ts:62`

### Qué es y para qué sirve (negocio)

Emitir un reembolso total o parcial. Caso de uso UC-42-08: Reembolso total o parcial. Dentro del módulo (descripción del modelo, en inglés): «A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/payments/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_42_payments.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /payments/transactions/{id}/refunds` la atiende `PaymentsTransactionsController.refund` (src/modules/payments/controllers/payments-transactions.controller.ts:62). Exige sesión con alguno de los roles PAYMENTS_ADMIN. Valida el cuerpo como `CreateRefundDto` (3 campos, 1 obligatorio). Delega en `PaymentsTransactionsService.refund`. Crea filas en payments.refunds. Lee payments.payment_transactions, payments.refunds.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PAYMENTS_ADMIN | `src/modules/payments/controllers/payments-transactions.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/payments/controllers/payments-transactions.controller.ts:62` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.payment_transactions` | LEE | LEE | DIRECTA | PaymentsTransactionsController.refund → PaymentsTransactionsService.refund → PaymentTransactionsRepository.findByIdForUpdate | `src/modules/payments/repositories/payment-transactions.repository.ts:230` |
| `payments.refunds` | ESCRIBE | CREA | DIRECTA | PaymentsTransactionsController.refund → PaymentsTransactionsService.refund → PaymentTransactionsRepository.createRefund | `src/modules/payments/repositories/payment-transactions.repository.ts:271` |
| `payments.refunds` | LEE | LEE | DIRECTA | PaymentsTransactionsController.refund → PaymentsTransactionsService.refund → PaymentTransactionsRepository.findRefundsByTransaction | `src/modules/payments/repositories/payment-transactions.repository.ts:367` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateRefundDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `amount` | `string` | Sí | patrón runtime POSITIVE_MONEY_REGEX | `@IsNumberString()` `@Matches(POSITIVE_MONEY_REGEX, { message: POSITIVE_MONEY_MESSAGE })` | Importe a reembolsar (parcial o total) | `src/modules/payments/dto/payment-transaction.dto.ts:211` |
| `gatewayRefundRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia del reembolso en el gateway | `src/modules/payments/dto/payment-transaction.dto.ts:222` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo libre del reembolso | `src/modules/payments/dto/payment-transaction.dto.ts:231` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "amount": "50.00"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "amount": "50.00",
  "gatewayRefundRef": "valor-ejemplo",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<RefundResponseDto>` · DTO `RefundResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/payments/dto/payment-transaction.dto.ts:242` |
| `paymentTransactionId` | `string` | Sí | formato uuid | — | Identificador asociado a payment transaction. | `src/modules/payments/dto/payment-transaction.dto.ts:248` |
| `amount` | `string` | Sí | — | — | Valor de amount mantenido por la instancia. | `src/modules/payments/dto/payment-transaction.dto.ts:254` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/payments/dto/payment-transaction.dto.ts:260` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Transacción no encontrada |
| 409 | `CONFLICT` | ConflictException: El reembolso excede el importe capturado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se puede reembolsar una transacción capturada o liquidada; PreconditionFailedException: El importe del reembolso debe ser mayor que cero |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/payments.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-003.int-spec.ts:218` |
| INTEGRACION | `test/integration/hardening/payments-fixture.ts:112` |
| CONTROLADOR | `src/modules/payments/controllers/payments-intents.controller.spec.ts:138` |

### Flujos

- Módulo 42 — Payments — etapa `UC-42-08`

---

## 14. POST /payments/transactions/{id}/status-inquiry

- **Origen:** CONTRATO
- **Nombre:** Consultar el estado de la transacción en el gateway
- **Bloque:** Financiero y ERP
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PaymentsTransactionsController.inquireStatus` — `src/modules/payments/controllers/payments-transactions.controller.ts:41`

### Qué es y para qué sirve (negocio)

Consultar el estado de la transacción en el gateway. Caso de uso UC-42-07: Consulta independiente de estado. Dentro del módulo (descripción del modelo, en inglés): «A provider-agnostic payment layer supporting multiple gateways (card, wallet, bank transfer, local rails).» Dominio: Financiero y ERP.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/payments/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_42_payments.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:31`)

### Cómo se atiende (sistema)

`POST /payments/transactions/{id}/status-inquiry` la atiende `PaymentsTransactionsController.inquireStatus` (src/modules/payments/controllers/payments-transactions.controller.ts:41). Exige sesión con alguno de los roles PAYMENTS_ADMIN. Delega en `PaymentsTransactionsService.inquireStatus`. Lee payments.payment_transactions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PAYMENTS_ADMIN | `src/modules/payments/controllers/payments-transactions.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/payments/controllers/payments-transactions.controller.ts:41` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `payments.payment_transactions` | LEE | LEE | DIRECTA | PaymentsTransactionsController.inquireStatus → PaymentsTransactionsService.inquireStatus → PaymentTransactionsRepository.findByIdForUpdate | `src/modules/payments/repositories/payment-transactions.repository.ts:230` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusInquiryResponseDto>` · DTO `StatusInquiryResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `transactionId` | `string` | Sí | formato uuid | — | Identificador asociado a transaction. | `src/modules/payments/dto/payment-transaction.dto.ts:332` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/payments/dto/payment-transaction.dto.ts:338` |
| `reconciled` | `boolean` | Sí | — | — | true si la consulta cambió el estado local | `src/modules/payments/dto/payment-transaction.dto.ts:344` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Transacción no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/payments.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-003.int-spec.ts:169` |
| CONTROLADOR | `src/modules/payments/controllers/payments-intents.controller.spec.ts:128` |

### Flujos

- Módulo 42 — Payments — etapa `UC-42-07`

---

