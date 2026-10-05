# Módulo Billing (17)

Facturación al paciente (CxC), cuentas por pagar (CxP), contabilización a ledger,
conciliación bancaria, morosidad, planes de pago y KPIs financieros. Expone los 12
casos de uso UC-17-01..12, tres lecturas de soporte y rutas de catálogo. La
[revisión de 2026-10-05](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/billing.md)
documenta los límites de autorización, dinero e idempotencia.

## Endpoints (UC → ruta)

| UC | Método y ruta | Controller | Servicio |
|----|---------------|-----------|----------|
| UC-17-01 | `POST /billing/invoices:issue-from-encounter` | Receivables | `InvoicesService.issueFromEncounter` |
| UC-17-02 | `POST /billing/payments-received:apply` | Receivables | `PaymentsReceivedService.apply` |
| UC-17-03 | `POST /billing/invoices/{id}:credit-note` | Receivables | `InvoicesService.creditNote` |
| UC-17-04 | `POST /billing/bills` | Payables | `BillsService.register` |
| UC-17-05 | `POST /billing/payments-made:execute` | Payables | `PaymentsMadeService.execute` |
| UC-17-06 | `POST /billing/documents/{id}:post-to-ledger` | Operations | `LedgerService.postToLedger` |
| UC-17-07 | `POST /billing/reconciliation:clear` | Operations | `ReconciliationService.clear` |
| UC-17-08 | `POST /billing/reimbursements:link` | Receivables | `ReimbursementsService.link` |
| UC-17-09 | `POST /billing/patient-statements:generate` | Receivables | `PatientStatementsService.generate` |
| UC-17-10 | `POST /billing/dunning-runs:execute` | Operations | `DunningService.execute` |
| UC-17-11 | `POST /billing/payment-plans` | Receivables | `InvoicesService.createPaymentPlan` |
| UC-17-12 | `POST /billing/kpi-snapshots:compute` | Operations | `KpiSnapshotsService.compute` |

Las rutas de acción usan `:` literal, escapado en el decorador (`invoices\\:issue-from-encounter`).

## Entidades

`invoices`, `invoice_lines`, `bills`, `bill_lines`, `payments_received`,
`receivable_payment_allocations`, `payments_made`, `payable_payment_allocations`,
`billing_document_links`, `reimbursements`, `patient_statements`, `dunning_runs`,
`dunning_items`, `financial_kpi_snapshots` (+ catálogos `vendors`, `service_catalog`,
`tax_codes`, `budgets`, `tax_periods` sin endpoint propio en este módulo).

## Reglas de negocio

- Totales de factura derivados de líneas (`base = cantidad*precio - descuento`,
  `total = subtotal + impuestos`); `balance = total - paid_total`.
- Cobros/pagos: el código limita la suma asignada (más retención en CxP) contra el
  monto y actualiza los saldos. Descuentos, signos y pertenencia de práctica todavía
  requieren el endurecimiento registrado en el informe antes de considerarlos una
  garantía contable completa.
- Nota de crédito: crea factura de reverso (total negativo) y baja el saldo de la
  original; el reverso no puede exceder el saldo salvo `writeOff`.
- Bills: vendor activo, sin doble captura de `bill_number`, three-way match (línea
  con orden de compra requiere recepción de bienes).
- Posting idempotente por documento (`transaction_id` no puede fijarse dos veces).
- Statement/dunning/KPI: unicidad lógica (periodo, `run_number`, clave de KPI).
- Plan de pagos: la suma de cuotas debe igualar el saldo origen.

## Permisos

Las operaciones financieras requieren `SECURITY_ADMIN` (`SUPERADMIN` es comodín).
El catálogo tiene lectura abierta y altas/ediciones con roles administrativos o
clínicos, con comprobaciones específicas de práctica. El rol no sustituye la
verificación de práctica/documento en los otros writes; ver BILL-01.

## Conceptos

`src/modules/billing/billing.concepts.ts` — `BILL` (ids) y `BILLING_CONCEPT_SEEDS`
(seeds). Estados de factura/bill, métodos de pago, estados de pago, tipos de vínculo
de documento, estados de reembolso y de morosidad.

## Logs

Pino estructurado por operación (`billing.invoice.issue`, `billing.payment-received.apply`,
etc.), inicio y éxito; rechazos de regla de negocio en `warn`/excepción. Sin PHI ni secretos.

## Tests

- Unit: `services/*.service.spec.ts` (mockean repos/EM) y `controllers/*.controller.spec.ts`
  (mockean servicios). La pasada dirigida del 2026-10-05 ejecutó `corepack yarn test
  src/modules/billing --runInBand --silent`: 16 suites y 94 tests pasan.
- Smoke: `test/smoke/modules/billing.smoke.ts` (`BILLING_SMOKE`).
