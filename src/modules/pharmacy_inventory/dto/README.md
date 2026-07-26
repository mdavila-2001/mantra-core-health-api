# DTOs — pharmacy_inventory

Contratos de entrada/salida validados con `class-validator` + `class-transformer`
y documentados con `@nestjs/swagger`. Los `*_concept_id` no se exponen en los DTOs
de entrada: el servicio los resuelve desde `pharmacy_inventory.concepts.ts`.

Las cantidades se reciben como `number` y el servicio las materializa como
`numeric` (string) al persistir. Los ids de FK cross-schema (producto, sede,
paciente, tenant) llegan del cliente y se validan como UUID.

| DTO | Endpoint | UC |
| --- | --- | --- |
| `CreateSupplierDto` | POST /pharmacy/:pharmacyId/suppliers | bootstrap |
| `CreateLocationDto` | POST /pharmacy/:siteId/inventory-locations | bootstrap |
| `CreatePurchaseOrderDto` | POST /pharmacy/:pharmacyId/purchase-orders | UC-25-01 |
| `CreateGoodsReceiptDto` | POST /pharmacy/:pharmacyId/goods-receipts | UC-25-02 |
| `CreateDispensationDto` | POST /pharmacy/:pharmacyId/dispensations | UC-25-03 |
| `CreateReservationDto` | POST /pharmacy/:pharmacyId/reservations | UC-25-04 |
| `CreateCountSessionDto` | POST /pharmacy/:siteId/count-sessions | UC-25-06 |
| `ApproveCountSessionDto` | POST /pharmacy/count-sessions/:id/approve | UC-25-07 |
| `CreateRecallHoldDto` | POST /pharmacy/recall-holds | UC-25-08 |
| `ReleaseRecallHoldDto` | POST /pharmacy/recall-holds/:id/release | UC-25-09 |
| `CreateTransferDto` | POST /pharmacy/:pharmacyId/transfers | UC-25-10 |
| `ReverseDispensationDto` | POST /pharmacy/dispensations/:id/reverse | UC-25-11 |
| `CreateSyncBatchDto` | POST /internal/inventory-sync-batches | bootstrap |
| `responses.dto.ts` | (respuestas) | todas |
