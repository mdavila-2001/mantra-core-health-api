# Módulo 42 — Payments

Cobros con pasarela: intención de pago, checkout, procesamiento contra el gateway,
reembolsos, anulaciones y las operaciones de cierre (tarifas, liquidaciones, payouts
y conciliación).

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

- **Idempotencia del intent**: el servicio consulta por tenant y clave antes de crear. El índice
  versionado actual es global sobre `idempotency_key`, por lo que la semántica entre tenants debe
  acordarse antes de afirmarla como idempotencia por tenant; ver la [revisión de pagos](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/payments.md#pay-05--media--contrato-de-idempotencia-por-tenant-contradice-el-índice-único-global).
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

## Pendiente

La proyección eventual vía `messaging.outbox_events` (read models, search, time series) queda
para el módulo 35, que aún no está implementado. El callback verifica HMAC por conexión, pero
todavía no consume la configuración de endpoint, ventana de replay y CIDR modelada en DDL; los
flujos de payout tampoco ejecutan un adaptador de proveedor. El detalle y plan están en la
[revisión de pagos](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/payments.md).
