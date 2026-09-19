# src / modules / pharma_lab / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo                                    | Responsabilidad                                    |
| ------------------------------------------ | -------------------------------------------------- |
| `doctor_visit_blocks.entity.ts`            | Mapeo de una entidad persistente y sus relaciones. |
| `doctor_visit_policies.entity.ts`          | Mapeo de una entidad persistente y sus relaciones. |
| `doctor_visit_windows.entity.ts`           | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts`                                 | Punto de exportación pública de la carpeta.        |
| `informational_materials.entity.ts`        | Mapeo de una entidad persistente y sus relaciones. |
| `material_approvals.entity.ts`             | Mapeo de una entidad persistente y sus relaciones. |
| `material_assets.entity.ts`                | Mapeo de una entidad persistente y sus relaciones. |
| `medical_visitor_products.entity.ts`       | Mapeo de una entidad persistente y sus relaciones. |
| `medical_visitor_specialties.entity.ts`    | Mapeo de una entidad persistente y sus relaciones. |
| `medical_visitors.entity.ts`               | Mapeo de una entidad persistente y sus relaciones. |
| `pharma_cost_allocations.entity.ts`        | Mapeo de una entidad persistente y sus relaciones. |
| `pharma_lab_link_events.entity.ts`         | Mapeo de una entidad persistente y sus relaciones. |
| `pharma_lab_staff.entity.ts`               | Mapeo de una entidad persistente y sus relaciones. |
| `pharma_labs.entity.ts`                    | Mapeo de una entidad persistente y sus relaciones. |
| `pharma_products.entity.ts`                | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacovigilance_actions.entity.ts`      | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacovigilance_reports.entity.ts`      | Mapeo de una entidad persistente y sus relaciones. |
| `regulatory_document_access_log.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `regulatory_document_versions.entity.ts`   | Mapeo de una entidad persistente y sus relaciones. |
| `regulatory_documents.entity.ts`           | Mapeo de una entidad persistente y sus relaciones. |
| `visit_ratings.entity.ts`                  | Mapeo de una entidad persistente y sus relaciones. |
| `visit_record_materials.entity.ts`         | Mapeo de una entidad persistente y sus relaciones. |
| `visit_records.entity.ts`                  | Mapeo de una entidad persistente y sus relaciones. |
| `visit_request_events.entity.ts`           | Mapeo de una entidad persistente y sus relaciones. |
| `visit_request_topics.entity.ts`           | Mapeo de una entidad persistente y sus relaciones. |
| `visit_requests.entity.ts`                 | Mapeo de una entidad persistente y sus relaciones. |
| `visit_survey_answers.entity.ts`           | Mapeo de una entidad persistente y sus relaciones. |
| `visit_survey_questions.entity.ts`         | Mapeo de una entidad persistente y sus relaciones. |
| `visit_survey_responses.entity.ts`         | Mapeo de una entidad persistente y sus relaciones. |
| `visit_surveys.entity.ts`                  | Mapeo de una entidad persistente y sus relaciones. |
| `visitor_post_submissions.entity.ts`       | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
