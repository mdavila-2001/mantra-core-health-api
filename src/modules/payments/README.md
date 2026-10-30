# Módulo 42 — Payments

Cobros con pasarela: intención de pago, checkout, procesamiento contra el gateway,
reembolsos, anulaciones y las operaciones de cierre (tarifas, liquidaciones, payouts
y conciliación).

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-29 sobre 4e64353a más el carril INT. Repetir con:
  find src/modules/payments -name '*.controller.ts' | wc -l
  find src/modules/payments -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/payments -name '*.entity.ts' | wc -l
  find src/modules/payments -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **4 controllers, 15 rutas HTTP, 53 entidades y 7 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 53 de 53 archivos `*.entity.ts`): `callback_verification_runs`, `cash_registers`, `cashier_payment_contexts`, `connected_accounts`, `fee_schedules`, `fx_rate_locks`, `gateway_connections`, `gateway_payment_channel_mappings`, `gateway_settlements`, `installment_plans`, `installment_schedules`, `invoice_regeneration_requests`, `kyc_verifications`, `payment_cancellation_requests`, `payment_channel_catalog`, `payment_checkout_sessions`, `payment_debt_invoice_requests`, `payment_debt_lines`, `payment_debts`, `payment_disputes`, `payment_gateways`, `payment_intents`, `payment_mandates`, `payment_methods`, `payment_receipts`, `payment_splits`, `payment_status_inquiries`, `payment_transactions`, `payment_webhook_events`, `payout_items`, `payouts`, `plan_eligibility_rules`, `plan_features`, `plan_prices`, `plan_quotas`, `provider_api_attempts`, `provider_api_operations`, `provider_callback_endpoints`, `provider_callback_events`, `provider_invoice_artifacts`, `provider_reconciliation_records`, `reconciliation_exceptions`, `reconciliation_runs`, `refunds`, `risk_assessments`, `settlement_lines`, `subscription_plans`, `subscription_usage_counters`, `subscriptions`, `tips`, `transaction_fees`, `wallet_ledger_entries`, `wallets`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /payments/intents` | PAYMENTS_ADMIN, CASHIER | `payments-intents` |
| `POST /payments/intents/:id/fx-lock` | PAYMENTS_ADMIN | `payments-intents` |
| `POST /payments/intents/:id/risk-assessment` | PAYMENTS_ADMIN | `payments-intents` |
| `POST /payments/intents/:id/transactions` | PAYMENTS_ADMIN, CASHIER | `payments-intents` |
| `POST /payments/intents/:id/splits` | PAYMENTS_ADMIN | `payments-intents` |
| `POST /payments/checkout-sessions` | PAYMENTS_ADMIN, CASHIER | `payments-operations` |
| `POST /payments/callbacks/:callbackPath` | pública | `payments-operations` |
| `POST /payments/gateway-webhooks` | pública | `payments-gateway-webhooks` |
| `POST /payments/fee-schedules` | PAYMENTS_ADMIN | `payments-operations` |
| `POST /payments/settlements/import` | PAYMENTS_ADMIN | `payments-operations` |
| `POST /payments/payouts` | PAYMENTS_ADMIN | `payments-operations` |
| `POST /payments/reconciliation-runs` | PAYMENTS_ADMIN | `payments-operations` |
| `POST /payments/transactions/:id/status-inquiry` | PAYMENTS_ADMIN | `payments-transactions` |
| `POST /payments/transactions/:id/refunds` | PAYMENTS_ADMIN | `payments-transactions` |
| `POST /payments/transactions/:id/cancellation-requests` | PAYMENTS_ADMIN, CASHIER | `payments-transactions` |

## Casos de uso cubiertos (14 + receptor de la pasarela)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-42-01 | `POST /payments/intents` | Crear intención de pago idempotente |
| UC-42-02 | `POST /payments/checkout-sessions` | Abrir sesión de checkout con contexto de cajero |
| UC-42-03 | `POST /payments/intents/:id/fx-lock` | Bloquear tipo de cambio |
| UC-42-04 | `POST /payments/intents/:id/risk-assessment` | Evaluar riesgo y 3-D Secure |
| UC-42-05 | `POST /payments/intents/:id/transactions` | Procesar transacción (authorize/capture/sale) |
| UC-42-06 | `POST /payments/callbacks/:callbackPath` | Recibir callback del gateway (idempotente) |
| UC-42-07 | `POST /payments/transactions/:id/status-inquiry` | Consulta independiente de estado |
| UC-42-08 | `POST /payments/transactions/:id/refunds` | Reembolso total o parcial |
| UC-42-09 | `POST /payments/transactions/:id/cancellation-requests` | Solicitar anulación |
| UC-42-10 | `POST /payments/fee-schedules` | Publicar versión del tarifario |
| UC-42-11 | `POST /payments/intents/:id/splits` | Reparto multi-party |
| UC-42-12 | `POST /payments/settlements/import` | Importar liquidación del gateway |
| UC-42-13 | `POST /payments/payouts` | Ejecutar payout a cuenta conectada |
| UC-42-14 | `POST /payments/reconciliation-runs` | Conciliar gateway vs ledger |

## Pasarela de pagos como PSP (`payments.via_gateway`)

Carril INT: la API cobra por la pasarela de pagos ALOVIDA (`pasarelapago`, API pública
v1) como un comercio más. El flag se llama `payments.via_gateway`, vive en la variable
`PAYMENTS_VIA_GATEWAY` y **está apagado por defecto**. Apagarlo es cambiar la variable y
reiniciar; no hay un interruptor en caliente. Variables en `.env.example`
(`PAYMENTS_GATEWAY_*`); el esquema Joi está en `gateway/payments-gateway.env.ts` y con el
flag encendido el proceso no arranca sin URL base, clave `sk_…` y secreto de webhook.
Ninguna clave vive en el repositorio.

**Flag apagado (el defecto).** `POST /payments/intents` y el resto del módulo se comportan
como antes: la respuesta no lleva `gateway` y no sale ninguna llamada a la pasarela. El
receptor de webhooks responde `503 GATEWAY_WEBHOOKS_DISABLED` sin efecto (no `410`, que
deshabilitaría el endpoint en la pasarela).

**Flag encendido.**

- `POST /payments/intents` crea la intención igual que siempre, y además comprueba que la
  pasarela podría cobrarla (BOB, centavos enteros, vencimiento de 60 s a 24 h): si no, `422`
  y no queda fila. **Aquí no se cobra**: la evaluación de riesgo todavía no puede existir.
- `POST /payments/intents/:id/transactions` despacha el cobro, detrás de la MISMA compuerta
  que el camino de siempre, con las mismas funciones: estado de la intención, operación
  abierta (`assertNoBlockingOpenOperation`), evaluación de riesgo presente y no `DECLINE`
  (`assertRiskCleared`) y saldo (`assertWithinBalance`: la pasarela cobra el importe completo,
  así que algo ya capturado por el camino de siempre lo excede y no se cobra). Una intención
  `PI_PROCESSING` sin cobro en la pasarela tampoco se re-despacha (`409
  PAYMENT_INTENT_ALREADY_PROCESSING`). Si la compuerta no pasa, la pasarela no recibe ninguna
  llamada. Con la pasarela una última evaluación `REVIEW` tampoco
  deja cobrar (el camino de siempre la deja pasar, sin tocarlo). Exige `paymentMethodType`
  (`qr`, `card`, `bank_transfer`, `wallet`), sólo admite `SALE` y el importe completo, y llama
  a `POST /payment_intents` de la pasarela con
  `Idempotency-Key = mantra-pi-v1-<sha256(tenant, deuda u orden, idempotencyKey local)>`.
  La clave sale de campos persistidos, así que un reintento manda la misma. Nunca se llama
  al proveedor directo. La respuesta no tiene transacción local: `id` y `paymentIntentId` son
  los de la intención, `gatewayTransactionRef` el `pi_…` y `gateway { paymentIntentId,
  status, nextAction }` lo que el pagador tiene que hacer (QR, transferencia, formulario del
  banco). Repetir la operación sobre una intención que ya tiene su cobro lo consulta
  (`GET`), no crea otro.
- Sólo viaja lo mínimo: importe en centavos enteros, `BOB`, tipo de medio de pago, vida del
  cobro (relativa al alta persistida). Ni el id local va como metadato (el escáner de
  números de tarjeta de la pasarela puede confundir un UUID con un PAN). La
  pasarela opera en bolivianos (D-06): otra moneda, o un importe con más de 2 decimales, se
  rechazan con `422` antes de persistir; no se redondea.
- **Un resultado ambiguo no es un fallo.** Un corte, un timeout, un `5xx` o un `409
  idempotency_request_in_progress` se reintentan (hasta `PAYMENTS_GATEWAY_MAX_ATTEMPTS`) con
  la MISMA clave. Si se agotan, la API responde `504 PAYMENT_GATEWAY_RESULT_AMBIGUOUS`, la
  intención local queda pendiente sin tocar y el cliente repite la operación
  (`/transactions`): se retoma con la misma clave sin crear un segundo cobro. Un `4xx` definitivo del contrato
  corta los reintentos (`422 PAYMENT_GATEWAY_REJECTED`; `401/403` se muestran como `503`).
- Con el flag apagado, una intención con `gateway_intent_ref` no admite
  `POST /payments/intents/:id/transactions` (`409 PAYMENT_INTENT_VIA_GATEWAY`): su resultado
  llega por webhook y no hay un segundo camino hacia el proveedor.

**Receptor de webhooks** (`POST /payments/gateway-webhooks`, pública). `main.ts` conserva
los bytes crudos del cuerpo sólo de esa ruta (`gateway/payments-gateway-raw-body.ts`).
`gateway/standard-webhook-signature.ts` replica la verificación Standard Webhooks de
`@pay/webhook-signature` (HMAC `v1` y Ed25519 `v1a`); su paridad se prueba con vectores
generados por la librería de referencia. Orden de las defensas: flag, firma y ventana de la
marca de tiempo (`PAYMENTS_GATEWAY_WEBHOOK_TOLERANCE_SECONDS`, 300 por defecto; `401` con
`GATEWAY_WEBHOOK_SIGNATURE_INVALID` o `GATEWAY_CALLBACK_OUTSIDE_REPLAY_WINDOW`, y el motivo
de la librería en `details.code`), forma del evento y modo `test`/`live` de la clave,
inbox y máquina de estados.

- **Inbox**: `payment_webhook_events`, con `gateway_event_ref = pay-gateway:<webhook-id>`
  (índice único), bajo `FOR UPDATE` de la intención. Una reentrega responde
  `duplicate=true` sin repetir el efecto.
- **Estados** (`gateway/payments-gateway-status.ts`): `requires_action` → `PI_PENDING`,
  `processing` → `PI_PROCESSING`, `succeeded` → `PI_SUCCEEDED`, `failed` y `expired` →
  `PI_FAILED`, `canceled` → `PI_CANCELED`. Un hecho atrasado (`processing` tras `succeeded`)
  se ignora sin retroceder; un terminal distinto del ya conocido, o un importe que no
  coincide con el cobrado, queda archivado con `processed=false` para conciliar.
- **Deuda**: `succeeded` descuenta el importe del saldo de la deuda ligada por la sesión de
  checkout (aritmética decimal exacta): saldo cero → `DEBT_SETTLED`; saldo positivo →
  `DEBT_PENDING`. `failed`, `canceled` y `expired` cierran el checkout y devuelven la deuda
  a `DEBT_PENDING`. Sobrepago, deuda ajena o ya saldada, o varias deudas por intención no
  se resuelven por inferencia: la intención queda cobrada, la deuda no se toca y el evento
  queda sin procesar. La factura de `billing` no se actualiza desde este módulo.
- Se responde `2xx` sólo después del `COMMIT`. Un terminal de un cobro que todavía no está
  asociado responde `404` para que la pasarela reintente; un evento no terminal de un cobro
  desconocido, y cualquier tipo de evento que la API no aplica (reembolsos, contracargos,
  pagos programados, tipos nuevos), se confirma sin efecto.

Límites: la consulta por `gateway_intent_ref` no tiene índice propio; un cobro que
quedó ambiguo no tiene un proceso que lo retome solo (lo retoma el reintento del cliente);
`MAX_ATTEMPTS` y el plazo son por proceso, sin cortacircuitos.

## Entidades

`payment_intents`, `payment_checkout_sessions`, `cashier_payment_contexts`, `payment_debts`,
`fx_rate_locks`, `risk_assessments`, `payment_splits`, `payment_transactions`, `refunds`,
`payment_cancellation_requests`, `fee_schedules`, `transaction_fees`, `gateway_settlements`,
`settlement_lines`, `payouts`, `payout_items`, `reconciliation_runs`,
`provider_reconciliation_records`, `reconciliation_exceptions`.

Las entidades están **generadas por introspección** (`gen_entities.py`) y no se editan a mano.

## Flujo general

```
intent (pending)
  ├─ fx-lock            -> importe re-expresado en la moneda destino
  ├─ risk-assessment    -> approve | review | decline (decline => intent failed)
  ├─ splits             -> reparto entre cuentas conectadas
  └─ transactions       -> authorize (processing) | capture/sale (succeeded)
        ├─ callback     -> aplica el resultado del proveedor (idempotente)
        ├─ status-inquiry -> confirma cuando el callback no llegó
        ├─ refunds      -> solo sobre capturada/liquidada, acotado a lo cobrado
        └─ cancellation -> solo si no está liquidada
settlement import -> transacciones a `settled`
payouts           -> importe derivado de los ítems, neto de comisiones
reconciliation    -> registros del proveedor vs ledger; descuadres abren excepción
```

## Reglas de negocio

- **Idempotencia del intent**: el servicio consulta por tenant y clave antes de crear. El índice
  versionado actual es global sobre `idempotency_key`, así que no es una idempotencia por
  tenant.
- **Riesgo previo al cobro**: no se procesa una transacción sin evaluación de riesgo, y una
  decisión `DECLINE` bloquea el cobro.
- **Un solo bloqueo de cambio vigente** por intent, y solo mientras está `pending`.
- **Reembolso acotado**: la suma de reembolsos no puede superar el importe capturado.
- **Anulación vs reembolso**: una transacción `settled` no se anula; corresponde reembolso.
- **Tarifario versionado**: publicar una versión pasa la anterior del mismo código a `superseded`.
- **Liquidación idempotente**: `settlement_ref` única; reimportar devuelve `duplicate=true`.
- **Payout derivado**: el importe sale de los ítems menos comisiones, no del cliente.
- **Conciliación sin autocorrección**: todo descuadre abre una excepción `open` para revisión.

## Permisos

`PAYMENTS_ADMIN` en todos los endpoints; `CASHIER` además en creación de intent, checkout,
procesamiento de transacción y solicitud de anulación. El callback del gateway es `@Public()`:
no hay usuario detrás de un webhook.

## Concurrencia

`SELECT ... FOR UPDATE` sobre intent, transacción y deuda antes de mutarlos (el caso de uso lo
exige). `row_version` da bloqueo optimista automático vía MikroORM. Las UNIQUE de
`idempotency_key`, `settlement_ref` y `session_token_hash` son la garantía última.

## Logs

Todas las operaciones emiten Pino con `operation: 'payments.<área>.<acción>'`. Se registran
identificadores y estados, nunca tokens de sesión, secretos del gateway ni datos del pagador.
El token de checkout se devuelve una vez y solo se persiste su hash SHA-256.

## Pruebas

La pasada dirigida del 2026-10-05 ejecutó 7 suites y 104 tests con:
`corepack yarn test src/modules/payments --runInBand --silent`. Son pruebas unitarias; faltan
integración con PostgreSQL, RLS, carreras e integración real con proveedor.

La bandeja de webhooks de la pasarela y su concurrencia se prueban contra PostgreSQL real en
`test/integration/payments-gateway-webhook.int-spec.ts`: crea y borra una base descartable en el
Postgres del compose de desarrollo de la pasarela, aplica el DDL real de `database/SQL/42_payments`
(sólo las tablas que el servicio toca, sin las claves foráneas hacia tablas que no crea) y no levanta
`AppModule`. Se activa con `PAYMENTS_WEBHOOK_IT=local-throwaway-db`; sin él queda omitida.

## Límites conocidos

El callback verifica HMAC por conexión, pero no consume la configuración de endpoint, ventana de
replay y CIDR modelada en DDL. Los flujos de payout no ejecutan un adaptador de proveedor.- **Importes exactos**: ningún cálculo monetario pasa por `Number`. `payment-money.ts` suma,
  resta, compara, multiplica y saca porcentajes con `BigInt` sobre la cadena decimal; los
  derivados (payout, conciliación, saldo de billetera) se redondean half-up a 2 decimales. Los
  DTO acotan importes y tasas a 14 dígitos enteros y 6 decimales. `riskScore` no es dinero y
  queda aparte.
- **Checkout acotado al tenant**: la deuda se busca y bloquea por `{ id, tenantId activo,
  gatewayConnectionId }` y la intención opcional debe ser del mismo tenant y conexión. Una deuda
  o intención ajena responde 404 idéntico al de una inexistente (sin `details`). El `tenantId` del
  cuerpo debe coincidir con el tenant activo (`PAYMENTS_TENANT_MISMATCH`).
- **Secreto de webhook atado al tenant**: la referencia de `gateway_connections.webhook_secret_ref`
  sólo vale si todas sus entradas son `env:WEBHOOK_SECRET_<UUID DEL TENANT SIN GUIONES, EN
  MAYÚSCULAS>_<NOMBRE>` y la conexión es del tenant de la intención. Las conexiones existentes
  deben renombrar sus variables.
- **Callback y endpoint**: cuando la conexión de la transacción tiene endpoints en
  `provider_callback_endpoints`, la ruta debe ser la de uno activo de esa conexión, la IP de
  origen debe estar en `allowed_source_cidrs_json` (si lo declara) y, si declara
  `replay_window_seconds`, el callback debe traer `timestamp` firmado dentro de la ventana (el
  timestamp entra en los bytes firmados sólo si viene). Sin endpoints registrados para la
  conexión no hay configuración que aplicar y se conserva el comportamiento anterior.
