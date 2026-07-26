# Billing · Controllers

Capa fina sobre `@Controller('billing')`: validan parámetros (`ParseUUIDPipe`),
exigen rol (`@Roles('SECURITY_ADMIN')`), toman el actor (`@CurrentUser()`) y delegan
en el servicio. Rutas de acción con `:` literal escapado (`\\:`).

| Controller | Endpoints (UC) |
|------------|----------------|
| `BillingReceivablesController` | invoices:issue-from-encounter (01), payments-received:apply (02), invoices/{id}:credit-note (03), reimbursements:link (08), patient-statements:generate (09), payment-plans (11) |
| `BillingPayablesController` | bills (04), payments-made:execute (05) |
| `BillingOperationsController` | documents/{id}:post-to-ledger (06), reconciliation:clear (07), dunning-runs:execute (10), kpi-snapshots:compute (12) |

Tests unitarios en `*.controller.spec.ts` (mockean el servicio; verifican delegación
con los argumentos correctos).
