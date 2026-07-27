# Repositorios de ERP

Acceso a `erp.*` con MikroORM. Sin reglas de negocio.

## Fuente de datos

PostgreSQL, schema `erp`. Entidades generadas por introspección. Las altas usan
`em.create(..., { partial: true })` **sin flush**: lo cierra la transacción del servicio.

## Repositorios

| Repositorio | Tablas | Métodos destacados |
| --- | --- | --- |
| `ErpContractsRepository` | `business_partners`, `business_partner_bank_accounts`, `contracts`, `contract_approval_requests`, `contract_amendments`, `contract_renewals`, `contract_terminations`, `contract_payment_schedules` | `createPartner`, `findPartnerByNumber`, `createBankAccount`, `findBankAccountForUpdate`, `createContract`, `findContractByNumber`, `findContractByIdForUpdate`, `createApprovalRequest`, `createAmendment`, `createRenewal`, `createTermination`, `createPaymentSchedule`, `findSchedulesByContract` |
| `ErpOperationsRepository` | `employees`, `time_off_requests`, `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items`, `service_entry_sheets`, `invoice_match_runs`, `sales_orders`, `lease_valuations` | `createEmployee`, `createTimeOffRequest`, `findTimeOffForUpdate`, `findOverlappingTimeOff`, `createPurchaseOrder`, `findPurchaseOrderForUpdate`, `createPurchaseOrderItem`, `findItemsByPurchaseOrder`, `createGoodsReceipt`, `createGoodsReceiptItem`, `createServiceEntrySheet`, `createInvoiceMatchRun`, `createSalesOrder`, `createLeaseValuation` |

La división separa el frente contractual (socio y contrato, que gobiernan lo pactado) del
operativo (lo que se ejecuta contra ese acuerdo).

## Lecturas con bloqueo

`findContractByIdForUpdate`, `findBankAccountForUpdate`, `findTimeOffForUpdate` y
`findPurchaseOrderForUpdate` usan `LockMode.PESSIMISTIC_WRITE`: todas preceden a una transición de
estado que no debe intercalarse con otra petición.

## Lecturas por clave natural

`findPartnerByNumber` y `findContractByNumber` (tenant + número) anticipan el conflicto de la UNIQUE
para devolver un error de dominio. La constraint sigue siendo la garantía real ante concurrencia.

## Consultas de solape

`findOverlappingTimeOff` cruza el rango pedido contra las ausencias del empleado en estados que
bloquean (`requested`, `approved`), usando solape real: la solicitud existente empieza antes del fin
pedido y termina después del inicio pedido.

## Agregación

`findItemsByPurchaseOrder` y `findSchedulesByContract` devuelven la colección completa de un
agregado acotado (líneas de una orden, cuotas de un contrato). El servicio suma en memoria: son
conjuntos pequeños por definición y evita una consulta de agregación por cada verificación.

## Rendimiento

Consultas por PK, FK o clave natural indexada. Sin N+1: nada recorre relaciones fila por fila.

## Pruebas

Se ejercitan desde los specs de servicio, donde van mockeados. La cobertura real de las consultas
—y del comportamiento de los bloqueos y del solape— llega con las pruebas de integración.
