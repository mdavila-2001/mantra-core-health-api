# src / modules / procedures perioperative / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `anesthesia_airway_assessments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `anesthesia_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `anesthesia_plans.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `implant_identifiers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `instrument_sets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `operating_room_utilization_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `operative_findings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `operative_reports.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `operative_steps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pacu_assessments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pacu_stays.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `postoperative_followups.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `postoperative_orders.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `preoperative_assessments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `preoperative_orders.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `preoperative_risk_scores.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_body_sites.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_cancellations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_case_diagnoses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_case_locations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_case_milestones.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_case_status_history.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_case_team_members.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_cases.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_charge_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_complications.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_devices.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_implants.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_medication_uses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_outcomes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_performers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `procedure_specimens.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `sterility_verification_checks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `sterilization_loads.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `surgical_safety_checklists.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `surgical_safety_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `surgical_safety_responses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
