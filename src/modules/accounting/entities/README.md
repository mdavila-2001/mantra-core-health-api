# src / modules / accounting / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `account_determination_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `account_groups.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `accounting_document_links.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `accounts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `accrual_objects.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `accrual_postings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `accrual_schedule_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `asset_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `asset_classes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `asset_components.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `asset_depreciations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `asset_postings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `asset_valuations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `assets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `clearing_documents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `clearing_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `company_bank_accounts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `controlling_areas.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `cost_center_maps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `cost_centers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `depreciation_areas.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `employee_payments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `exchange_rates.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `fiscal_periods.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `fiscal_years.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `functional_areas.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `infrastructure_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `internal_orders.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `journal_entry_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `journal_transactions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `ledger_entries.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `liabilities.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `liability_payments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `liability_postings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `liability_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `open_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `profit_centers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `purchases.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `sales.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `segments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `subledger_accounts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `transaction_files.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
