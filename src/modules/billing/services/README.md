# Billing · Services

Casos de uso del módulo. Cada servicio inyecta `EntityManager`
(`@mikro-orm/postgresql`), sus repositorios y `PinoLogger`. Escrituras dentro de
`this.em.transactional(async (tx) => {...})`; flush del padre antes de crear hijos.
Excepciones de dominio (`ResourceNotFoundException` 404, `ConflictException` 409,
`PreconditionFailedException` 422).

| Servicio | UC | Responsabilidad |
|----------|----|-----------------|
| `InvoicesService` | 01, 03, 11 | Emisión de factura, nota de crédito, plan de pagos |
| `PaymentsReceivedService` | 02 | Cobro con asignación multi-factura |
| `BillsService` | 04 | Registro de factura de proveedor (three-way match) |
| `PaymentsMadeService` | 05 | Pago a proveedor con asignación |
| `LedgerService` | 06 | Contabilización (posting) idempotente por documento |
| `ReconciliationService` | 07 | Conciliación de pagos vía compensación |
| `ReimbursementsService` | 08 | Vínculo de reembolso de seguro |
| `PatientStatementsService` | 09 | Estado de cuenta del paciente |
| `DunningService` | 10 | Ciclo de morosidad (run + items) |
| `KpiSnapshotsService` | 12 | Snapshot de KPI financiero (append-only) |

Tests unitarios en `*.service.spec.ts` (mockean repos/EM; `em.transactional`
simulado como `(cb) => cb(tx)`).
