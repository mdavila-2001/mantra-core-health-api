# src / modules / pharmacy inventory / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Punto de exportación pública de la carpeta. |
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

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
