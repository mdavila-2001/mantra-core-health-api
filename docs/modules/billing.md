<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/billing/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver docs/progress/ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `billing`

**Fuente:** [`src/modules/billing/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/billing/README.md)
· 4 controllers · 12 services · 10 repositories · 22 entidades · 13 DTO

---

# Módulo Billing (17)

Facturación al paciente (CxC), cuentas por pagar (CxP), contabilización a ledger,
conciliación bancaria, morosidad, planes de pago y KPIs financieros. Implementa los
12 casos de uso UC-17-01..12 del spec `casos_uso_17_billing.puml`.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/billing -name '*.controller.ts' | wc -l
  find src/modules/billing -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/billing -name '*.entity.ts' | wc -l
  find src/modules/billing -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **4 controllers, 21 rutas HTTP, 22 entidades y 12 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`PracticeModule`, `SurveysModule`).

Entidades (`tableName`, 22 de 22 archivos `*.entity.ts`): `bill_lines`, `billing_document_links`, `bills`, `budget_lines`, `budgets`, `dunning_items`, `dunning_runs`, `financial_kpi_snapshots`, `invoice_lines`, `invoices`, `patient_statements`, `payable_payment_allocations`, `payments_made`, `payments_received`, `quotation_installments`, `quotations`, `receivable_payment_allocations`, `reimbursements`, `service_catalog`, `tax_codes`, `tax_periods`, `vendors`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /billing/documents/:id\\:post-to-ledger` | SECURITY_ADMIN | `billing-operations` |
| `POST /billing/reconciliation\\:clear` | SECURITY_ADMIN | `billing-operations` |
| `POST /billing/dunning-runs\\:execute` | SECURITY_ADMIN | `billing-operations` |
| `POST /billing/internal/dunning-runs/run-due` | SYSTEM, SECURITY_ADMIN | `billing-operations` |
| `POST /billing/kpi-snapshots\\:compute` | SECURITY_ADMIN | `billing-operations` |
| `POST /billing/bills` | SECURITY_ADMIN | `billing-payables` |
| `POST /billing/payments-made\\:execute` | SECURITY_ADMIN | `billing-payables` |
| `GET /billing/invoices` | SECURITY_ADMIN | `billing-receivables` |
| `GET /billing/invoices/:id` | SECURITY_ADMIN | `billing-receivables` |
| `GET /billing/patient-statements` | SECURITY_ADMIN | `billing-receivables` |
| `POST /billing/invoices\\:issue-from-encounter` | SECURITY_ADMIN | `billing-receivables` |
| `POST /billing/payments-received\\:apply` | SECURITY_ADMIN | `billing-receivables` |
| `POST /billing/invoices/:id\\:credit-note` | SECURITY_ADMIN | `billing-receivables` |
| `POST /billing/reimbursements\\:link` | SECURITY_ADMIN | `billing-receivables` |
| `POST /billing/patient-statements\\:generate` | SECURITY_ADMIN | `billing-receivables` |
| `POST /billing/payment-plans` | SECURITY_ADMIN | `billing-receivables` |
| `GET /billing/service-catalog` | sesión | `billing-service-catalog` |
| `POST /billing/service-catalog` | SECURITY_ADMIN, PRACTITIONER, CLINICIAN | `billing-service-catalog` |
| `PATCH /billing/service-catalog/:id` | PRACTITIONER, CLINICIAN, SECURITY_ADMIN | `billing-service-catalog` |
| `GET /billing/service-catalog/procedure-specialties` | sesión | `billing-service-catalog` |
| `GET /billing/service-catalog/procedures` | sesión | `billing-service-catalog` |

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
- Cobros/pagos: la suma asignada (más retención en CxP) no puede exceder el monto;
  cada factura destino debe existir y tener saldo; estado → `PARTIALLY_PAID`/`PAID`.
- Nota de crédito: crea factura de reverso (total negativo) y baja el saldo de la
  original; el reverso no puede exceder el saldo salvo `writeOff`.
- Bills: vendor activo, sin doble captura de `bill_number`, three-way match (línea
  con orden de compra requiere recepción de bienes).
- Posting idempotente por documento (`transaction_id` no puede fijarse dos veces).
- Statement/dunning/KPI: unicidad lógica (periodo, `run_number`, clave de KPI).
- Plan de pagos: la suma de cuotas debe igualar el saldo origen.

## Permisos

Todos los endpoints requieren rol `SECURITY_ADMIN` (`SUPERADMIN` es comodín).

## Conceptos

`src/modules/billing/billing.concepts.ts` — `BILL` (ids) y `BILLING_CONCEPT_SEEDS`
(seeds). Estados de factura/bill, métodos de pago, estados de pago, tipos de vínculo
de documento, estados de reembolso y de morosidad.

## Logs

Pino estructurado por operación (`billing.invoice.issue`, `billing.payment-received.apply`,
etc.), inicio y éxito; rechazos de regla de negocio en `warn`/excepción. Sin PHI ni secretos.

## Tests

- Unit: `services/*.service.spec.ts` (mockean repos/EM) y `controllers/*.controller.spec.ts`
  (mockean servicios). `NODE_OPTIONS=--experimental-vm-modules npx jest src/modules/billing`.
- Smoke: `test/smoke/modules/billing.smoke.ts` (`BILLING_SMOKE`).

