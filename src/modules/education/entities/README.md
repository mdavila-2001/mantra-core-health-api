# src / modules / education / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `assessment_attempts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `assessment_questions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `assessments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `certificates.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `cme_credit_records.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `course_cohorts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `course_instructors.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `course_modules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `course_reviews.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `course_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `courses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `enrollments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `instructors.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lesson_progress.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lessons.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
