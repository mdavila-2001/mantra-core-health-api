# Billing · Repositories

Acceso a datos del esquema `billing`. Repositorios **stateless**: cada método recibe
el `EntityManager` activo como primer parámetro para que el servicio controle la
transacción y el orden de flush (las FK son columnas uuid planas; MikroORM no ordena
inserts entre entidades no relacionadas).

| Repositorio | Entidades |
|-------------|-----------|
| `InvoicesRepository` | `invoices`, `invoice_lines` |
| `BillsRepository` | `bills`, `bill_lines`, lectura de `vendors` |
| `PaymentsReceivedRepository` | `payments_received`, `receivable_payment_allocations` |
| `PaymentsMadeRepository` | `payments_made`, `payable_payment_allocations` |
| `BillingDocumentLinksRepository` | `billing_document_links` (solo-inserción) |
| `ReimbursementsRepository` | `reimbursements` |
| `PatientStatementsRepository` | `patient_statements` |
| `DunningRepository` | `dunning_runs`, `dunning_items` (solo-inserción) |
| `KpiSnapshotsRepository` | `financial_kpi_snapshots` (append-only) |

Convenciones: `em.create(..., { partial: true })`; `rowVersion` nunca se fija (DEFAULT
en BD); auditoría vía `createdBy(actor.id)` en entidades con `updated_at`, o
`createdAt`/`createdByUserId` explícitos en las de solo-inserción.
