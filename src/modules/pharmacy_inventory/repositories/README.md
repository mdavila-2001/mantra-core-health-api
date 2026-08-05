# Repositorios — pharmacy_inventory

Acceso a datos **stateless** de `pharmacy_inventory`. Cada método recibe el
`EntityManager` activo como primer parámetro para que el servicio controle la
unidad de trabajo y la transacción (y los repos sean triviales de mockear).

Los FKs son columnas `uuid` planas (no relaciones ORM): MikroORM no ordena
inserts, por lo que los servicios hacen `flush` entre padre e hijo. Todo
`em.create(...)` usa `{ partial: true }` y omite `rowVersion` (DEFAULT 1 en BD).

| Repositorio | Tabla(s) | Notas |
| --- | --- | --- |
| `SuppliersRepository` | `pharmacy_suppliers` | Bootstrap de proveedor. |
| `LocationsRepository` | `inventory_locations` | Bootstrap de ubicación. |
| `LotsRepository` | `inventory_lots` | Upsert por (producto, lot_number). |
| `StockPositionsRepository` | `inventory_stock_positions` | Upsert aplicativo por clave lógica. |
| `LedgerRepository` | `inventory_ledger_entries` | Append-only; `nextSequence` por farmacia. |
| `PurchaseOrdersRepository` | `pharmacy_purchase_orders` + líneas | UC-25-01. |
| `GoodsReceiptsRepository` | `pharmacy_goods_receipts` + líneas | UC-25-02. |
| `ReservationsRepository` | `inventory_reservations` + líneas | UC-25-04/05. |
| `DispensationsRepository` | `medication_dispensations` + líneas | UC-25-03/11. |
| `CountSessionsRepository` | `inventory_count_sessions` + líneas | UC-25-06/07. |
| `RecallHoldsRepository` | `inventory_recall_holds` | UC-25-08/09. |
| `SerialsRepository` | `inventory_serials` | Seriales (opcional). |
| `SyncRepository` | `pharmacy_inventory_sync_batches` + items | UC-25-12. |
