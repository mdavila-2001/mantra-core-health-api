# src / modules / chart / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `care_plan_activities.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `care_plans.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `chart_template_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `clinical_note_headers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `clinical_note_signatures.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `clinical_note_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `document_record_files.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `document_records.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `note_release_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `physical_exam_findings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `specialty_chart_templates.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
