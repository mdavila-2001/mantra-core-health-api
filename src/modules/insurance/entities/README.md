# src / modules / insurance / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `broker_carrier_agreements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `broker_clients.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `broker_commission_statements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `claim_adjudication_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `claim_appeal_decisions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `claim_disputes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `claim_line_adjudications.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `claim_reversals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `coordination_of_benefits.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `coverage_dependents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `coverage_eligibility_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `coverage_eligibility_responses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `employer_groups.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `insurance_brokers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `insurance_carriers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `insurance_claim_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `insurance_claims.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `insurance_plan_benefits.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `insurance_plans.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `insurance_products.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `insurance_reconciliation_batches.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `insurance_reconciliation_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `network_provider_memberships.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `patient_coverages.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `patient_explanations_of_benefit.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `prior_authorization_determinations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `prior_authorization_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `prior_authorization_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_networks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
