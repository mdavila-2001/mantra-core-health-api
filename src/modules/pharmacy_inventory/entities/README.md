# src / modules / pharmacy inventory / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Public export barrel for this folder. |
| `inventory_count_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `inventory_count_sessions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `inventory_ledger_entries.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `inventory_locations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `inventory_lots.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `inventory_recall_holds.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `inventory_reservation_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `inventory_reservations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `inventory_serials.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `inventory_stock_positions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `medication_dispensation_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `medication_dispensations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_goods_receipt_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_goods_receipts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_inventory_sync_batches.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_inventory_sync_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_purchase_order_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_purchase_orders.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_suppliers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `purchase_quotations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
