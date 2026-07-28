# src / modules / billing / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `bill_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `billing_document_links.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `bills.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `budget_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `budgets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dunning_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dunning_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `financial_kpi_snapshots.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `invoice_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `invoices.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `patient_statements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payable_payment_allocations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payments_made.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payments_received.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `receivable_payment_allocations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `reimbursements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `service_catalog.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tax_codes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tax_periods.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `vendors.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
