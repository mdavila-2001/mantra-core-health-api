<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `payments`

Referencia exhaustiva de 14 operación(es) del módulo `payments`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `payments`, `payments-intents`, `payments-transactions`
- **Controladores:** `PaymentsIntentsController`, `PaymentsOperationsController`, `PaymentsTransactionsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /payments/callbacks/{callbackPath}](#1-post-payments-callbacks-callbackpath) — Recibir el callback/webhook del gateway (idempotente)
2. [POST /payments/checkout-sessions](#2-post-payments-checkout-sessions) — Abrir una sesión de checkout con contexto de cajero
3. [POST /payments/fee-schedules](#3-post-payments-fee-schedules) — Publicar una versión del tarifario
4. [POST /payments/intents](#4-post-payments-intents) — Crear una intención de pago idempotente
5. [POST /payments/intents/{id}/fx-lock](#5-post-payments-intents-id-fx-lock) — Bloquear el tipo de cambio de la intención
6. [POST /payments/intents/{id}/risk-assessment](#6-post-payments-intents-id-risk-assessment) — Registrar la evaluación de riesgo y 3-D Secure
7. [POST /payments/intents/{id}/splits](#7-post-payments-intents-id-splits) — Repartir el cobro entre cuentas conectadas
8. [POST /payments/intents/{id}/transactions](#8-post-payments-intents-id-transactions) — Procesar la transacción contra el gateway (authorize/capture)
9. [POST /payments/payouts](#9-post-payments-payouts) — Ejecutar un payout a una cuenta conectada
10. [POST /payments/reconciliation-runs](#10-post-payments-reconciliation-runs) — Conciliar gateway contra ledger y abrir excepciones
11. [POST /payments/settlements/import](#11-post-payments-settlements-import) — Importar la liquidación del gateway
12. [POST /payments/transactions/{id}/cancellation-requests](#12-post-payments-transactions-id-cancellation-requests) — Solicitar la anulación del cobro
13. [POST /payments/transactions/{id}/refunds](#13-post-payments-transactions-id-refunds) — Emitir un reembolso total o parcial
14. [POST /payments/transactions/{id}/status-inquiry](#14-post-payments-transactions-id-status-inquiry) — Consultar el estado de la transacción en el gateway

---

## 1. POST /payments/callbacks/{callbackPath}

- **Módulo:** `payments`
- **Etiqueta OpenAPI:** `payments`
- **Nombre:** Recibir el callback/webhook del gateway (idempotente)
- **Operation ID:** `PaymentsOperationsController_applyCallback`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PaymentsOperationsController.applyCallback](../../src/modules/payments/controllers/payments-operations.controller.ts)

### Descripción de negocio

Reintentos del proveedor devuelven `duplicate=true` sin reaplicar efectos.

Contexto declarado en el controlador: UC-42-06. El gateway no presenta un token de usuario, así que la ruta es pública: la autenticidad se verifica con la firma del proveedor y la correlación por referencia externa, no con el guard de sesión.

### Descripción del sistema

NestJS resuelve `POST /payments/callbacks/{callbackPath}` en `PaymentsOperationsController_applyCallback`. El controlador delega en `PaymentsTransactionsService.applyCallback`. Valida el body como `GatewayCallbackDto` y consume `application/json`. El tipo de retorno estático es `Promise<CallbackResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `callbackPath` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `GatewayCallbackDto`; los campos opcionales se omiten.

```http
POST /payments/callbacks/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "gatewayTransactionRef": "valor-ejemplo",
  "outcome": "CAPTURED"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `gatewayTransactionRef` | Sí | `string` | longitud máxima 200 | Referencia de la transacción en el gateway | `valor-ejemplo` |
| `outcome` | Sí | `string` | valores: `CAPTURED`, `FAILED`, `AUTHORIZED` | Resultado informado por el gateway | `CAPTURED` |
| `authorizationCode` | No | `string` | longitud máxima 100 | Código de autorización | `CODIGO_EJEMPLO` |
| `signature` | No | `string` | longitud máxima 500 | Firma del proveedor para verificar el origen | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /payments/callbacks/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "gatewayTransactionRef": "valor-ejemplo",
  "outcome": "CAPTURED",
  "authorizationCode": "CODIGO_EJEMPLO",
  "signature": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CallbackResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CallbackResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CallbackResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CallbackResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CallbackResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CallbackResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CallbackResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CallbackResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CallbackResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CallbackResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CallbackResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "transactionId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "applied": true,
  "decision": "aplicar",
  "reconciliationRequired": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `transactionId` | Sí | `string` | formato `uuid` | Transacción correlacionada | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si el callback ya se había aplicado antes | `true` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `applied` | Sí | `boolean` | Sin restricción adicional declarada | true si el evento cambió el estado local de la transacción | `true` |
| `decision` | Sí | `string` | valores: `aplicar`, `duplicado`, `obsoleto`, `contradiccion` | Cómo se interpretó el evento frente al estado ya conocido | `aplicar` |
| `reconciliationRequired` | Sí | `boolean` | Sin restricción adicional declarada | true si el proveedor afirmó algo incompatible con un estado terminal y hace falta conciliar | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 401 | `UNAUTHENTICATED` | Firma del webhook inválida | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | No hay transacción para la referencia informada | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
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
  "path": "/payments/callbacks/{callbackPath}"
}
```

---

## 2. POST /payments/checkout-sessions

- **Módulo:** `payments`
- **Etiqueta OpenAPI:** `payments`
- **Nombre:** Abrir una sesión de checkout con contexto de cajero
- **Operation ID:** `PaymentsOperationsController_openCheckout`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PaymentsOperationsController.openCheckout](../../src/modules/payments/controllers/payments-operations.controller.ts)

### Descripción de negocio

El token de sesión se devuelve una sola vez; la base solo guarda su hash.


### Descripción del sistema

NestJS resuelve `POST /payments/checkout-sessions` en `PaymentsOperationsController_openCheckout`. El controlador delega en `PaymentsCheckoutService.openSession`. Valida el body como `OpenCheckoutSessionDto` y consume `application/json`. El tipo de retorno estático es `Promise< CheckoutSessionResponseDto & { /** * Valor de session token mantenido por la instancia. */ sessionToken: string; } >`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `OpenCheckoutSessionDto`; los campos opcionales se omiten.

```http
POST /payments/checkout-sessions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "gatewayConnectionId": "00000000-0000-4000-8000-000000000001",
  "paymentDebtId": "00000000-0000-4000-8000-000000000001",
  "redirectUrl": "https://example.com/recurso",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PAYMENTS_ADMIN`, `CASHIER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `gatewayConnectionId` | Sí | `string` | formato `uuid` | Conexión del gateway habilitada para el canal | `00000000-0000-4000-8000-000000000001` |
| `paymentDebtId` | Sí | `string` | formato `uuid` | Deuda que se va a cobrar | `00000000-0000-4000-8000-000000000001` |
| `redirectUrl` | Sí | `string` | formato `uri` | URL a la que se redirige al pagador | `https://example.com/recurso` |
| `expiresAt` | Sí | `string` | formato `date-time` | Vencimiento de la sesión | `2026-07-31T12:00:00.000Z` |
| `paymentIntentId` | No | `string` | formato `uuid` | Intent asociado, si ya existe | `00000000-0000-4000-8000-000000000001` |
| `cashierUserId` | No | `string` | formato `uuid` | Cajero que abre la sesión (contexto POS) | `00000000-0000-4000-8000-000000000001` |
| `cashRegisterId` | No | `string` | formato `uuid` | Caja registradora | `00000000-0000-4000-8000-000000000001` |
| `siteId` | No | `string` | formato `uuid` | Sede | `00000000-0000-4000-8000-000000000001` |
| `shiftReference` | No | `string` | longitud máxima 100 | Referencia del turno de caja | `valor-ejemplo` |
| `successReturnUrl` | No | `string` | formato `url` | Sin descripción específica en el contrato OpenAPI. | `https://example.com/recurso` |
| `failureReturnUrl` | No | `string` | formato `url` | Sin descripción específica en el contrato OpenAPI. | `https://example.com/recurso` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /payments/checkout-sessions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise< CheckoutSessionResponseDto & { /** * Valor de session token mantenido por la instancia. */ sessionToken: string; } >` | No |
| 400 | Operación completada correctamente. | `Promise< CheckoutSessionResponseDto & { /** * Valor de session token mantenido por la instancia. */ sessionToken: string; } >` | No |
| 401 | Operación completada correctamente. | `Promise< CheckoutSessionResponseDto & { /** * Valor de session token mantenido por la instancia. */ sessionToken: string; } >` | No |
| 403 | Operación completada correctamente. | `Promise< CheckoutSessionResponseDto & { /** * Valor de session token mantenido por la instancia. */ sessionToken: string; } >` | No |
| 409 | Operación completada correctamente. | `Promise< CheckoutSessionResponseDto & { /** * Valor de session token mantenido por la instancia. */ sessionToken: string; } >` | No |
| 413 | Operación completada correctamente. | `Promise< CheckoutSessionResponseDto & { /** * Valor de session token mantenido por la instancia. */ sessionToken: string; } >` | No |
| 422 | Operación completada correctamente. | `Promise< CheckoutSessionResponseDto & { /** * Valor de session token mantenido por la instancia. */ sessionToken: string; } >` | No |
| 429 | Operación completada correctamente. | `Promise< CheckoutSessionResponseDto & { /** * Valor de session token mantenido por la instancia. */ sessionToken: string; } >` | No |
| 500 | Operación completada correctamente. | `Promise< CheckoutSessionResponseDto & { /** * Valor de session token mantenido por la instancia. */ sessionToken: string; } >` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CheckoutSessionResponseDto & { /** * Valor de session token mantenido por la instancia. */ sessionToken: string; }`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "paymentDebtId": "00000000-0000-4000-8000-000000000001",
  "redirectUrl": "valor-ejemplo",
  "expiresAt": "2026-07-31T12:00:00.000Z",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `paymentDebtId` | Sí | `string` | formato `uuid` | Identificador asociado a payment debt. | `00000000-0000-4000-8000-000000000001` |
| `redirectUrl` | Sí | `string` | Sin restricción adicional declarada | Valor de redirect url mantenido por la instancia. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | formato `date-time` | Valor de expires at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PAYMENTS_ADMIN, CASHIER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Deuda no encontrada | Excepción explícita en src/modules/payments/services/payments-checkout.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La deuda ya tiene un checkout abierto | Excepción explícita en src/modules/payments/services/payments-checkout.service.ts |
| 422 | `PRECONDITION_FAILED` | La deuda ya está saldada | Excepción explícita en src/modules/payments/services/payments-checkout.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/payments/checkout-sessions"
}
```

---

## 3. POST /payments/fee-schedules

- **Módulo:** `payments`
- **Etiqueta OpenAPI:** `payments`
- **Nombre:** Publicar una versión del tarifario
- **Operation ID:** `PaymentsOperationsController_createFeeSchedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PaymentsOperationsController.createFeeSchedule](../../src/modules/payments/controllers/payments-operations.controller.ts)

### Descripción de negocio

Publicar una versión del tarifario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /payments/fee-schedules` en `PaymentsOperationsController_createFeeSchedule`. El controlador delega en `PaymentsOperationsService.createFeeSchedule`. Valida el body como `CreateFeeScheduleDto` y consume `application/json`. El tipo de retorno estático es `Promise<FeeScheduleResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFeeScheduleDto`; los campos opcionales se omiten.

```http
POST /payments/fee-schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "feeType": "GATEWAY",
  "method": "PERCENTAGE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PAYMENTS_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código único de la tarifa dentro del tenant | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `feeType` | Sí | `string` | valores: `GATEWAY`, `PLATFORM` | Quién cobra la tarifa | `GATEWAY` |
| `method` | Sí | `string` | valores: `PERCENTAGE`, `FIXED` | Modo de cálculo | `PERCENTAGE` |
| `percentage` | No | `string` | Sin restricción adicional declarada | Porcentaje cuando method=PERCENTAGE | `2.9` |
| `fixedAmount` | No | `string` | Sin restricción adicional declarada | Importe fijo cuando method=FIXED | `0.30` |
| `validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /payments/fee-schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FeeScheduleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FeeScheduleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FeeScheduleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FeeScheduleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FeeScheduleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FeeScheduleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FeeScheduleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FeeScheduleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FeeScheduleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FeeScheduleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "supersededId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `supersededId` | No | `string` | Sin restricción adicional declarada | Id de la versión anterior que quedó superseded, si existía | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PAYMENTS_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una tarifa porcentual exige `percentage` | Excepción explícita en src/modules/payments/services/payments-operations.service.ts |
| 422 | `PRECONDITION_FAILED` | Una tarifa fija exige `fixedAmount` | Excepción explícita en src/modules/payments/services/payments-operations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/payments/fee-schedules"
}
```

---

## 4. POST /payments/intents

- **Módulo:** `payments`
- **Etiqueta OpenAPI:** `payments-intents`
- **Nombre:** Crear una intención de pago idempotente
- **Operation ID:** `PaymentsIntentsController_createIntent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PaymentsIntentsController.createIntent](../../src/modules/payments/controllers/payments-intents.controller.ts)

### Descripción de negocio

Repetir la misma `idempotencyKey` devuelve el intent existente en lugar de generar un segundo cobro.


### Descripción del sistema

NestJS resuelve `POST /payments/intents` en `PaymentsIntentsController_createIntent`. El controlador delega en `PaymentsIntentsService.createIntent`. Valida el body como `CreatePaymentIntentDto` y consume `application/json`. El tipo de retorno estático es `Promise<PaymentIntentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePaymentIntentDto`; los campos opcionales se omiten.

```http
POST /payments/intents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "gatewayId": "00000000-0000-4000-8000-000000000001",
  "amount": "150.00",
  "currency": "BOB",
  "purpose": "INVOICE",
  "idempotencyKey": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PAYMENTS_ADMIN`, `CASHIER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Tenant propietario del cobro | `00000000-0000-4000-8000-000000000001` |
| `gatewayId` | Sí | `string` | formato `uuid` | Gateway a través del cual se cobrará | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Importe a cobrar, como cadena decimal para no perder precisión | `150.00` |
| `currency` | Sí | `string` | valores: `BOB`, `USD` | Moneda ISO-4217 del cobro | `BOB` |
| `purpose` | Sí | `string` | valores: `INVOICE`, `DEBT`, `OTHER` | Propósito del cobro | `INVOICE` |
| `idempotencyKey` | Sí | `string` | longitud máxima 200 | Clave de idempotencia del cliente. Repetirla devuelve el intent existente en lugar de cobrar dos veces. | `valor-ejemplo` |
| `gatewayConnectionId` | No | `string` | formato `uuid` | Conexión concreta del gateway | `00000000-0000-4000-8000-000000000001` |
| `practiceId` | No | `string` | formato `uuid` | Práctica que origina el cobro | `00000000-0000-4000-8000-000000000001` |
| `invoiceId` | No | `string` | formato `uuid` | Factura que se está cobrando | `00000000-0000-4000-8000-000000000001` |
| `sourceRefType` | No | `string` | longitud máxima 100 | Tipo del recurso de origen (referencia polimórfica) | `valor-ejemplo` |
| `sourceRefId` | No | `string` | formato `uuid` | Id del recurso de origen | `00000000-0000-4000-8000-000000000001` |
| `expiresAt` | No | `string` | formato `date-time` | Vencimiento del intent | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /payments/intents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PaymentIntentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PaymentIntentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PaymentIntentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PaymentIntentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PaymentIntentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PaymentIntentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PaymentIntentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PaymentIntentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PaymentIntentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PaymentIntentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "amount": 150,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo",
  "reused": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Valor de amount mantenido por la instancia. | `150` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concepto de estado del intent | `00000000-0000-4000-8000-000000000001` |
| `idempotencyKey` | Sí | `string` | Sin restricción adicional declarada | Clave de idempotencia con la que se creó | `valor-ejemplo` |
| `reused` | Sí | `boolean` | Sin restricción adicional declarada | true si la petición reutilizó un intent ya existente (reintento idempotente) | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PAYMENTS_ADMIN, CASHIER. | Roles/tenant/guards de autorización |
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
  "path": "/payments/intents"
}
```

---

## 5. POST /payments/intents/{id}/fx-lock

- **Módulo:** `payments`
- **Etiqueta OpenAPI:** `payments-intents`
- **Nombre:** Bloquear el tipo de cambio de la intención
- **Operation ID:** `PaymentsIntentsController_lockFxRate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PaymentsIntentsController.lockFxRate](../../src/modules/payments/controllers/payments-intents.controller.ts)

### Descripción de negocio

Bloquear el tipo de cambio de la intención. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /payments/intents/{id}/fx-lock` en `PaymentsIntentsController_lockFxRate`. El controlador delega en `PaymentsIntentsService.lockFxRate`. Valida el body como `CreateFxLockDto` y consume `application/json`. El tipo de retorno estático es `Promise<FxLockResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFxLockDto`; los campos opcionales se omiten.

```http
POST /payments/intents/00000000-0000-4000-8000-000000000001/fx-lock HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fromCurrency": "BOB",
  "toCurrency": "BOB",
  "lockedRate": "6.96",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PAYMENTS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fromCurrency` | Sí | `string` | valores: `BOB`, `USD` | Moneda de origen | `BOB` |
| `toCurrency` | Sí | `string` | valores: `BOB`, `USD` | Moneda destino | `BOB` |
| `lockedRate` | Sí | `string` | Sin restricción adicional declarada | Cotización bloqueada | `6.96` |
| `expiresAt` | Sí | `string` | formato `date-time` | Vigencia del bloqueo | `2026-07-31T12:00:00.000Z` |
| `providerRef` | No | `string` | longitud máxima 200 | Referencia del proveedor de FX | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /payments/intents/00000000-0000-4000-8000-000000000001/fx-lock HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fromCurrency": "BOB",
  "toCurrency": "BOB",
  "lockedRate": "6.96",
  "expiresAt": "2026-07-31T12:00:00.000Z",
  "providerRef": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FxLockResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FxLockResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FxLockResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FxLockResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FxLockResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FxLockResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FxLockResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FxLockResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FxLockResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FxLockResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FxLockResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "paymentIntentId": "00000000-0000-4000-8000-000000000001",
  "lockedRate": 6.96,
  "convertedAmount": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `paymentIntentId` | Sí | `string` | formato `uuid` | Identificador asociado a payment intent. | `00000000-0000-4000-8000-000000000001` |
| `lockedRate` | Sí | `string` | Sin restricción adicional declarada | Valor de locked rate mantenido por la instancia. | `6.96` |
| `convertedAmount` | Sí | `string` | Sin restricción adicional declarada | Importe del intent recalculado a la moneda destino | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PAYMENTS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Intención de pago no encontrada | Excepción explícita en src/modules/payments/services/payments-intents.service.ts |
| 409 | `CONFLICT` | La intención ya tiene un bloqueo de cambio vigente | Excepción explícita en src/modules/payments/services/payments-intents.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El bloqueo de cambio exige monedas distintas | Excepción explícita en src/modules/payments/services/payments-intents.service.ts |
| 422 | `PRECONDITION_FAILED` | Solo se puede bloquear el cambio de una intención pendiente | Excepción explícita en src/modules/payments/services/payments-intents.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/payments/intents/{id}/fx-lock"
}
```

---

## 6. POST /payments/intents/{id}/risk-assessment

- **Módulo:** `payments`
- **Etiqueta OpenAPI:** `payments-intents`
- **Nombre:** Registrar la evaluación de riesgo y 3-D Secure
- **Operation ID:** `PaymentsIntentsController_assessRisk`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PaymentsIntentsController.assessRisk](../../src/modules/payments/controllers/payments-intents.controller.ts)

### Descripción de negocio

Registrar la evaluación de riesgo y 3-D Secure. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /payments/intents/{id}/risk-assessment` en `PaymentsIntentsController_assessRisk`. El controlador delega en `PaymentsIntentsService.assessRisk`. Valida el body como `CreateRiskAssessmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<RiskAssessmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateRiskAssessmentDto`; los campos opcionales se omiten.

```http
POST /payments/intents/00000000-0000-4000-8000-000000000001/risk-assessment HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "riskScore": "12.5",
  "decision": "APPROVE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PAYMENTS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `riskScore` | Sí | `string` | Sin restricción adicional declarada | Score de riesgo (0-100) | `12.5` |
| `decision` | Sí | `string` | valores: `APPROVE`, `REVIEW`, `DECLINE` | Decisión del motor | `APPROVE` |
| `threeDsAuthenticated` | No | `boolean` | Sin restricción adicional declarada | true si el pagador completó 3-D Secure | `true` |
| `providerRef` | No | `string` | longitud máxima 200 | Referencia del proveedor antifraude | `valor-ejemplo` |
| `signals` | No | `object` | Sin restricción adicional declarada | Señales crudas del motor (se persisten como jsonb) | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /payments/intents/00000000-0000-4000-8000-000000000001/risk-assessment HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "riskScore": "12.5",
  "decision": "APPROVE",
  "threeDsAuthenticated": true,
  "providerRef": "valor-ejemplo",
  "signals": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RiskAssessmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RiskAssessmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RiskAssessmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RiskAssessmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RiskAssessmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RiskAssessmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RiskAssessmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RiskAssessmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RiskAssessmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RiskAssessmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RiskAssessmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "paymentIntentId": "00000000-0000-4000-8000-000000000001",
  "decision": "APPROVE",
  "riskLevel": "LOW"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `paymentIntentId` | Sí | `string` | formato `uuid` | Identificador asociado a payment intent. | `00000000-0000-4000-8000-000000000001` |
| `decision` | Sí | `string` | valores: `APPROVE`, `REVIEW`, `DECLINE` | Valor de decision mantenido por la instancia. | `APPROVE` |
| `riskLevel` | Sí | `string` | valores: `LOW`, `MEDIUM`, `HIGH` | Nivel derivado del score | `LOW` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PAYMENTS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Intención de pago no encontrada | Excepción explícita en src/modules/payments/services/payments-intents.service.ts |
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
  "path": "/payments/intents/{id}/risk-assessment"
}
```

---

## 7. POST /payments/intents/{id}/splits

- **Módulo:** `payments`
- **Etiqueta OpenAPI:** `payments-intents`
- **Nombre:** Repartir el cobro entre cuentas conectadas
- **Operation ID:** `PaymentsIntentsController_addSplit`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PaymentsIntentsController.addSplit](../../src/modules/payments/controllers/payments-intents.controller.ts)

### Descripción de negocio

Repartir el cobro entre cuentas conectadas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /payments/intents/{id}/splits` en `PaymentsIntentsController_addSplit`. El controlador delega en `PaymentsIntentsService.addSplit`. Valida el body como `CreateSplitDto` y consume `application/json`. El tipo de retorno estático es `Promise<SplitResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateSplitDto`; los campos opcionales se omiten.

```http
POST /payments/intents/00000000-0000-4000-8000-000000000001/splits HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "payeeConnectedAccountId": "00000000-0000-4000-8000-000000000001",
  "splitType": "AMOUNT"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PAYMENTS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `payeeConnectedAccountId` | Sí | `string` | formato `uuid` | Cuenta conectada que recibe el reparto | `00000000-0000-4000-8000-000000000001` |
| `splitType` | Sí | `string` | valores: `AMOUNT`, `PERCENTAGE` | Modo de reparto | `AMOUNT` |
| `amount` | No | `string` | Sin restricción adicional declarada | Importe fijo cuando splitType=AMOUNT | `valor-ejemplo` |
| `percentage` | No | `string` | Sin restricción adicional declarada | Porcentaje cuando splitType=PERCENTAGE | `15.00` |
| `isPlatformFee` | No | `boolean` | Sin restricción adicional declarada | true si el reparto es la comisión de la plataforma | `true` |
| `destinationWalletId` | No | `string` | formato `uuid` | Wallet destino | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /payments/intents/00000000-0000-4000-8000-000000000001/splits HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "payeeConnectedAccountId": "00000000-0000-4000-8000-000000000001",
  "splitType": "AMOUNT",
  "amount": "valor-ejemplo",
  "percentage": "15.00",
  "isPlatformFee": true,
  "destinationWalletId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SplitResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SplitResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SplitResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SplitResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SplitResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SplitResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SplitResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SplitResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SplitResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SplitResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SplitResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "paymentIntentId": "00000000-0000-4000-8000-000000000001",
  "amount": "valor-ejemplo",
  "isPlatformFee": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `paymentIntentId` | Sí | `string` | formato `uuid` | Identificador asociado a payment intent. | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Importe resuelto del reparto | `valor-ejemplo` |
| `isPlatformFee` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is platform fee mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PAYMENTS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Intención de pago no encontrada | Excepción explícita en src/modules/payments/services/payments-intents.service.ts |
| 409 | `CONFLICT` | Los repartos superan el importe de la intención | Excepción explícita en src/modules/payments/services/payments-intents.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un reparto por importe exige `amount` | Excepción explícita en src/modules/payments/services/payments-intents.service.ts |
| 422 | `PRECONDITION_FAILED` | Un reparto por porcentaje exige `percentage` | Excepción explícita en src/modules/payments/services/payments-intents.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/payments/intents/{id}/splits"
}
```

---

## 8. POST /payments/intents/{id}/transactions

- **Módulo:** `payments`
- **Etiqueta OpenAPI:** `payments-intents`
- **Nombre:** Procesar la transacción contra el gateway (authorize/capture)
- **Operation ID:** `PaymentsIntentsController_processTransaction`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PaymentsIntentsController.processTransaction](../../src/modules/payments/controllers/payments-intents.controller.ts)

### Descripción de negocio

Procesar la transacción contra el gateway (authorize/capture). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /payments/intents/{id}/transactions` en `PaymentsIntentsController_processTransaction`. El controlador delega en `PaymentsTransactionsService.processTransaction`. Valida el body como `ProcessTransactionDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransactionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ProcessTransactionDto`; los campos opcionales se omiten.

```http
POST /payments/intents/00000000-0000-4000-8000-000000000001/transactions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "operation": "AUTHORIZE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PAYMENTS_ADMIN`, `CASHIER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `operation` | Sí | `string` | valores: `AUTHORIZE`, `CAPTURE`, `SALE` | Operación a ejecutar | `AUTHORIZE` |
| `amount` | No | `string` | patrón runtime `POSITIVE_MONEY_REGEX` | Importe a procesar. Si se omite se toma el del intent. | `150.00` |
| `gatewayTransactionRef` | No | `string` | longitud máxima 200 | Referencia devuelta por el gateway | `valor-ejemplo` |
| `authorizationCode` | No | `string` | longitud máxima 100 | Código de autorización del emisor | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /payments/intents/00000000-0000-4000-8000-000000000001/transactions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "operation": "AUTHORIZE",
  "amount": "150.00",
  "gatewayTransactionRef": "valor-ejemplo",
  "authorizationCode": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransactionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransactionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransactionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransactionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransactionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransactionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransactionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransactionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransactionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransactionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransactionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "paymentIntentId": "00000000-0000-4000-8000-000000000001",
  "amount": 150,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "gatewayTransactionRef": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `paymentIntentId` | Sí | `string` | formato `uuid` | Identificador asociado a payment intent. | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Valor de amount mantenido por la instancia. | `150` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `gatewayTransactionRef` | No | `string` | Sin restricción adicional declarada | Valor de gateway transaction ref mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PAYMENTS_ADMIN, CASHIER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Intención de pago no encontrada | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 409 | `CONFLICT` | La intención ya fue cobrada | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 409 | `CONFLICT` | La intención tiene una operación abierta en el gateway | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 409 | `CONFLICT` | El importe excede el saldo pendiente de la intención | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 409 | `CONFLICT` | La captura excede el importe autorizado | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La intención está cancelada | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 422 | `PRECONDITION_FAILED` | La intención requiere evaluación de riesgo antes de cobrar | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 422 | `PRECONDITION_FAILED` | El motor de riesgo rechazó la intención | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 422 | `PRECONDITION_FAILED` | El importe a procesar debe ser mayor que cero | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/payments/intents/{id}/transactions"
}
```

---

## 9. POST /payments/payouts

- **Módulo:** `payments`
- **Etiqueta OpenAPI:** `payments`
- **Nombre:** Ejecutar un payout a una cuenta conectada
- **Operation ID:** `PaymentsOperationsController_executePayout`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PaymentsOperationsController.executePayout](../../src/modules/payments/controllers/payments-operations.controller.ts)

### Descripción de negocio

Ejecutar un payout a una cuenta conectada. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /payments/payouts` en `PaymentsOperationsController_executePayout`. El controlador delega en `PaymentsOperationsService.executePayout`. Valida el body como `CreatePayoutDto` y consume `application/json`. El tipo de retorno estático es `Promise<PayoutResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePayoutDto`; los campos opcionales se omiten.

```http
POST /payments/payouts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PAYMENTS_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `payeeRefId` | Sí | `string` | formato `uuid` | Cuenta conectada destinataria | `00000000-0000-4000-8000-000000000001` |
| `gatewayId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `currency` | Sí | `string` | valores: `BOB`, `USD` | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `periodStart` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `periodEnd` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items` | Sí | `array<PayoutItemDto>` | mínimo 1 elemento(s) | Ítems a liquidar | `[{"sourceRefId":"00000000-0000-4000-8000-000000000001","amount":"100.00","commissionAmount":"5.00","description":"Texto descriptivo de ejemplo"}]` |
| `items[].sourceRefId` | Sí | `string` | formato `uuid` | Transacción que origina el ítem | `00000000-0000-4000-8000-000000000001` |
| `items[].amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `100.00` |
| `items[].commissionAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `5.00` |
| `items[].description` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `gatewayPayoutRef` | No | `string` | longitud máxima 200 | Referencia del payout en el gateway | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /payments/payouts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PayoutResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PayoutResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PayoutResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PayoutResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PayoutResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PayoutResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PayoutResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PayoutResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PayoutResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PayoutResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "amount": 300,
  "itemCount": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Suma de los ítems | `300` |
| `itemCount` | Sí | `number` | Sin restricción adicional declarada | Valor de item count mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PAYMENTS_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El importe neto del payout debe ser positivo | Excepción explícita en src/modules/payments/services/payments-operations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/payments/payouts"
}
```

---

## 10. POST /payments/reconciliation-runs

- **Módulo:** `payments`
- **Etiqueta OpenAPI:** `payments`
- **Nombre:** Conciliar gateway contra ledger y abrir excepciones
- **Operation ID:** `PaymentsOperationsController_runReconciliation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PaymentsOperationsController.runReconciliation](../../src/modules/payments/controllers/payments-operations.controller.ts)

### Descripción de negocio

Conciliar gateway contra ledger y abrir excepciones. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /payments/reconciliation-runs` en `PaymentsOperationsController_runReconciliation`. El controlador delega en `PaymentsOperationsService.runReconciliation`. Valida el body como `CreateReconciliationRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReconciliationRunResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateReconciliationRunDto`; los campos opcionales se omiten.

```http
POST /payments/reconciliation-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PAYMENTS_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `gatewayId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `gatewayConnectionId` | Sí | `string` | formato `uuid` | Conexión de la que provienen los registros | `00000000-0000-4000-8000-000000000001` |
| `periodStart` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `periodEnd` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `providerRecords` | Sí | `array<ProviderRecordDto>` | Sin restricción adicional declarada | Extracto del proveedor | `[{"externalTransactionId":"00000000-0000-4000-8000-000000000001","providerAmount":"150.00","providerStatusCode":"CODIGO_EJEMPLO","providerCurrencyCode":"BOB","providerFeeAmount":"4.65"}]` |
| `providerRecords[].externalTransactionId` | Sí | `string` | longitud máxima 200 | Id de la transacción en el proveedor | `00000000-0000-4000-8000-000000000001` |
| `providerRecords[].providerAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `150.00` |
| `providerRecords[].providerStatusCode` | Sí | `string` | longitud máxima 50 | Código de estado informado por el proveedor | `CODIGO_EJEMPLO` |
| `providerRecords[].providerCurrencyCode` | Sí | `string` | valores: `BOB`, `USD` | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `providerRecords[].providerFeeAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `4.65` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /payments/reconciliation-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReconciliationRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReconciliationRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReconciliationRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReconciliationRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReconciliationRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReconciliationRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReconciliationRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReconciliationRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReconciliationRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReconciliationRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "matchedCount": 1,
  "unmatchedCount": 1,
  "exceptionCount": 1,
  "totalGateway": 1500,
  "totalLedger": 1450,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `matchedCount` | Sí | `number` | Sin restricción adicional declarada | Registros que casaron con una transacción local | `1` |
| `unmatchedCount` | Sí | `number` | Sin restricción adicional declarada | Registros sin contraparte local | `1` |
| `exceptionCount` | Sí | `number` | Sin restricción adicional declarada | Excepciones abiertas por el descuadre | `1` |
| `totalGateway` | Sí | `string` | Sin restricción adicional declarada | Total informado por el proveedor | `1500` |
| `totalLedger` | Sí | `string` | Sin restricción adicional declarada | Total según el ledger local | `1450` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PAYMENTS_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/payments/reconciliation-runs"
}
```

---

## 11. POST /payments/settlements/import

- **Módulo:** `payments`
- **Etiqueta OpenAPI:** `payments`
- **Nombre:** Importar la liquidación del gateway
- **Operation ID:** `PaymentsOperationsController_importSettlement`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PaymentsOperationsController.importSettlement](../../src/modules/payments/controllers/payments-operations.controller.ts)

### Descripción de negocio

Importar la liquidación del gateway. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /payments/settlements/import` en `PaymentsOperationsController_importSettlement`. El controlador delega en `PaymentsOperationsService.importSettlement`. Valida el body como `ImportSettlementDto` y consume `application/json`. El tipo de retorno estático es `Promise<SettlementResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ImportSettlementDto`; los campos opcionales se omiten.

```http
POST /payments/settlements/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PAYMENTS_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `gatewayId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `settlementRef` | Sí | `string` | longitud máxima 200 | Referencia del lote en el gateway (única) | `valor-ejemplo` |
| `grossAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1500.00` |
| `feeAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `46.50` |
| `netAmount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1453.50` |
| `currency` | Sí | `string` | valores: `BOB`, `USD` | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `settledAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `lines` | Sí | `array<SettlementLineDto>` | mínimo 1 elemento(s) | Detalle de la liquidación | `[{"paymentTransactionId":"00000000-0000-4000-8000-000000000001","refundId":"00000000-0000-4000-8000-000000000001","amount":"150.00","feeAmount":"4.65"}]` |
| `lines[].paymentTransactionId` | No | `string` | formato `uuid` | Transacción liquidada | `00000000-0000-4000-8000-000000000001` |
| `lines[].refundId` | No | `string` | formato `uuid` | Reembolso liquidado | `00000000-0000-4000-8000-000000000001` |
| `lines[].amount` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `150.00` |
| `lines[].feeAmount` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `4.65` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /payments/settlements/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SettlementResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SettlementResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SettlementResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SettlementResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SettlementResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SettlementResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SettlementResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SettlementResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SettlementResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SettlementResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "settlementRef": "valor-ejemplo",
  "lineCount": 1,
  "settledTransactions": 1,
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `settlementRef` | Sí | `string` | Sin restricción adicional declarada | Valor de settlement ref mantenido por la instancia. | `valor-ejemplo` |
| `lineCount` | Sí | `number` | Sin restricción adicional declarada | Líneas importadas | `1` |
| `settledTransactions` | Sí | `number` | Sin restricción adicional declarada | Transacciones marcadas como liquidadas | `1` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si el lote ya estaba importado (reintento idempotente) | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PAYMENTS_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/payments/settlements/import"
}
```

---

## 12. POST /payments/transactions/{id}/cancellation-requests

- **Módulo:** `payments`
- **Etiqueta OpenAPI:** `payments-transactions`
- **Nombre:** Solicitar la anulación del cobro
- **Operation ID:** `PaymentsTransactionsController_requestCancellation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PaymentsTransactionsController.requestCancellation](../../src/modules/payments/controllers/payments-transactions.controller.ts)

### Descripción de negocio

Solicitar la anulación del cobro. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /payments/transactions/{id}/cancellation-requests` en `PaymentsTransactionsController_requestCancellation`. El controlador delega en `PaymentsTransactionsService.requestCancellation`. Valida el body como `CreateCancellationDto` y consume `application/json`. El tipo de retorno estático es `Promise<CancellationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCancellationDto`; los campos opcionales se omiten.

```http
POST /payments/transactions/00000000-0000-4000-8000-000000000001/cancellation-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "gatewayConnectionId": "00000000-0000-4000-8000-000000000001",
  "requestNumber": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PAYMENTS_ADMIN`, `CASHIER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `gatewayConnectionId` | Sí | `string` | formato `uuid` | Conexión del gateway sobre la que se pide la anulación | `00000000-0000-4000-8000-000000000001` |
| `requestNumber` | Sí | `string` | longitud máxima 100 | Número de solicitud, único por tenant | `valor-ejemplo` |
| `reasonText` | No | `string` | longitud máxima 500 | Detalle del motivo | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /payments/transactions/00000000-0000-4000-8000-000000000001/cancellation-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "gatewayConnectionId": "00000000-0000-4000-8000-000000000001",
  "requestNumber": "valor-ejemplo",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CancellationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CancellationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CancellationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CancellationResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CancellationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CancellationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CancellationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CancellationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CancellationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CancellationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CancellationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "requestNumber": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `requestNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de request number mantenido por la instancia. | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PAYMENTS_ADMIN, CASHIER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Transacción no encontrada | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La transacción está liquidada; corresponde un reembolso en vez de una anulación | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/payments/transactions/{id}/cancellation-requests"
}
```

---

## 13. POST /payments/transactions/{id}/refunds

- **Módulo:** `payments`
- **Etiqueta OpenAPI:** `payments-transactions`
- **Nombre:** Emitir un reembolso total o parcial
- **Operation ID:** `PaymentsTransactionsController_refund`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PaymentsTransactionsController.refund](../../src/modules/payments/controllers/payments-transactions.controller.ts)

### Descripción de negocio

Emitir un reembolso total o parcial. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /payments/transactions/{id}/refunds` en `PaymentsTransactionsController_refund`. El controlador delega en `PaymentsTransactionsService.refund`. Valida el body como `CreateRefundDto` y consume `application/json`. El tipo de retorno estático es `Promise<RefundResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateRefundDto`; los campos opcionales se omiten.

```http
POST /payments/transactions/00000000-0000-4000-8000-000000000001/refunds HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "amount": "50.00"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PAYMENTS_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `amount` | Sí | `string` | patrón runtime `POSITIVE_MONEY_REGEX` | Importe a reembolsar (parcial o total) | `50.00` |
| `gatewayRefundRef` | No | `string` | longitud máxima 200 | Referencia del reembolso en el gateway | `valor-ejemplo` |
| `reasonText` | No | `string` | longitud máxima 500 | Motivo libre del reembolso | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /payments/transactions/00000000-0000-4000-8000-000000000001/refunds HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "amount": "50.00",
  "gatewayRefundRef": "valor-ejemplo",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RefundResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RefundResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RefundResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RefundResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RefundResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RefundResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RefundResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RefundResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RefundResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RefundResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RefundResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "paymentTransactionId": "00000000-0000-4000-8000-000000000001",
  "amount": 50,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `paymentTransactionId` | Sí | `string` | formato `uuid` | Identificador asociado a payment transaction. | `00000000-0000-4000-8000-000000000001` |
| `amount` | Sí | `string` | Sin restricción adicional declarada | Valor de amount mantenido por la instancia. | `50` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PAYMENTS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Transacción no encontrada | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 409 | `CONFLICT` | El reembolso excede el importe capturado | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo se puede reembolsar una transacción capturada o liquidada | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 422 | `PRECONDITION_FAILED` | El importe del reembolso debe ser mayor que cero | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/payments/transactions/{id}/refunds"
}
```

---

## 14. POST /payments/transactions/{id}/status-inquiry

- **Módulo:** `payments`
- **Etiqueta OpenAPI:** `payments-transactions`
- **Nombre:** Consultar el estado de la transacción en el gateway
- **Operation ID:** `PaymentsTransactionsController_inquireStatus`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PaymentsTransactionsController.inquireStatus](../../src/modules/payments/controllers/payments-transactions.controller.ts)

### Descripción de negocio

Confirmación independiente del callback; se usa antes de aplicar efectos contables cuando hay discrepancia.


### Descripción del sistema

NestJS resuelve `POST /payments/transactions/{id}/status-inquiry` en `PaymentsTransactionsController_inquireStatus`. El controlador delega en `PaymentsTransactionsService.inquireStatus`. No recibe body. El tipo de retorno estático es `Promise<StatusInquiryResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /payments/transactions/00000000-0000-4000-8000-000000000001/status-inquiry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PAYMENTS_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /payments/transactions/00000000-0000-4000-8000-000000000001/status-inquiry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusInquiryResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusInquiryResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusInquiryResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusInquiryResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusInquiryResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusInquiryResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusInquiryResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusInquiryResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusInquiryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusInquiryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "transactionId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "reconciled": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `transactionId` | Sí | `string` | formato `uuid` | Identificador asociado a transaction. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `reconciled` | Sí | `boolean` | Sin restricción adicional declarada | true si la consulta cambió el estado local | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PAYMENTS_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Transacción no encontrada | Excepción explícita en src/modules/payments/services/payments-transactions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/payments/transactions/{id}/status-inquiry"
}
```

---

