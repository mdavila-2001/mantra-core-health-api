# src / modules / system ops / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `accepted_risks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `anonymization_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `assessment_control_results.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `assessment_findings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `backup_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `breach_notifications.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `cross_border_transfer_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `data_classifications.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `data_domains.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `data_residency_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `draft_records.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `encryption_keys.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `entity_registry.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_registry.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `governance_change_log.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `key_rotation_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `legal_holds.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `operational_framework_controls.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `operational_frameworks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `partition_specs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `record_revisions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `remediation_actions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `remediation_plans.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `restore_test_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `retention_executions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `retention_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `security_incidents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tenant_residency_bindings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `workload_assessments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `write_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
