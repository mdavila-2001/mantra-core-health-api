# Módulo 42 — Payments

Cobros con pasarela: intención de pago, checkout, procesamiento contra el gateway,
reembolsos, anulaciones y las operaciones de cierre (tarifas, liquidaciones, payouts
y conciliación).

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/payments -name '*.controller.ts' | wc -l
  find src/modules/payments -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/payments -name '*.entity.ts' | wc -l
  find src/modules/payments -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **3 controllers, 14 rutas HTTP, 53 entidades y 5 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

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
| `POST /payments/fee-schedules` | PAYMENTS_ADMIN | `payments-operations` |
| `POST /payments/settlements/import` | PAYMENTS_ADMIN | `payments-operations` |
| `POST /payments/payouts` | PAYMENTS_ADMIN | `payments-operations` |
| `POST /payments/reconciliation-runs` | PAYMENTS_ADMIN | `payments-operations` |
| `POST /payments/transactions/:id/status-inquiry` | PAYMENTS_ADMIN | `payments-transactions` |
| `POST /payments/transactions/:id/refunds` | PAYMENTS_ADMIN | `payments-transactions` |
| `POST /payments/transactions/:id/cancellation-requests` | PAYMENTS_ADMIN, CASHIER | `payments-transactions` |

## Casos de uso cubiertos (14)

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

- **Idempotencia del intent**: `idempotency_key` única por tenant. Un reintento devuelve el
  intent existente con `reused=true`; nunca genera un segundo cobro.
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

63 pruebas unitarias entre servicios y controladores:
`yarn test --testPathPatterns=payments`.

## Pendiente

La proyección eventual vía `messaging.outbox_events` (read models, search, time series) queda
para el módulo 35, que aún no está implementado. Los servicios dejan el estado consistente en
PostgreSQL; la publicación del evento se añadirá cuando exista el outbox.
