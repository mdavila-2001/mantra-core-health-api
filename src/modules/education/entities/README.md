# src / modules / education / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

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
| `index.ts` | Public export barrel for this folder. |
| `instructors.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lesson_progress.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lessons.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
