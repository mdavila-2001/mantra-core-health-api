# src / modules / erp / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `business_partner_bank_accounts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `business_partner_relationships.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `business_partner_roles.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `business_partner_tax_registrations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `business_partners.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_accounting_terms.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_amendments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_approval_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_approval_steps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_clause_instances.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_clauses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_documents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_line_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_milestones.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_object_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_obligation_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_obligations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_parties.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_payment_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_renewals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_team_members.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_terminations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contract_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contracts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `departments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `employee_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `employees.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `employment_records.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `enterprise_document_flow.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `goods_receipt_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `goods_receipts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `invoice_match_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `invoice_match_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lease_accounting_links.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lease_cash_flows.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lease_contracts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lease_objects.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lease_valuations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `performance_reviews.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `positions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `projects.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `purchase_order_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `purchase_orders.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `purchase_requisition_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `purchase_requisitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `sales_order_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `sales_orders.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `service_entry_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `service_entry_sheets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `time_off_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `wbs_elements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
