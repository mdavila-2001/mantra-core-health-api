# src / modules / chart / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

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
| `index.ts` | Punto de exportación pública de la carpeta. |
| `note_release_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `physical_exam_findings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `specialty_chart_templates.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
