# src / modules / profiles / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo                                       | Responsabilidad                                    |
| --------------------------------------------- | -------------------------------------------------- |
| `administrator_profiles.entity.ts`            | Mapeo de una entidad persistente y sus relaciones. |
| `emergency_staff_profiles.entity.ts`          | Mapeo de una entidad persistente y sus relaciones. |
| `health_practitioner_profiles.entity.ts`      | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts`                                    | Public export barrel for this folder.        |
| `insurance_representative_profiles.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `jurisdiction_authorizations.entity.ts`       | Mapeo de una entidad persistente y sus relaciones. |
| `patient_identity_links.entity.ts`            | Mapeo de una entidad persistente y sus relaciones. |
| `patient_merge_events.entity.ts`              | Mapeo de una entidad persistente y sus relaciones. |
| `patient_portal_proxies.entity.ts`            | Mapeo de una entidad persistente y sus relaciones. |
| `patient_profiles.entity.ts`                  | Mapeo de una entidad persistente y sus relaciones. |
| `person_account_links.entity.ts`              | Mapeo de una entidad persistente y sus relaciones. |
| `person_profiles.entity.ts`                   | Mapeo de una entidad persistente y sus relaciones. |
| `persons.entity.ts`                           | Mapeo de una entidad persistente y sus relaciones. |
| `practitioner_languages.entity.ts`            | Mapeo de una entidad persistente y sus relaciones. |
| `practitioner_specialties.entity.ts`          | Mapeo de una entidad persistente y sus relaciones. |
| `professional_credentials.entity.ts`          | Mapeo de una entidad persistente y sus relaciones. |
| `provider_operator_profiles.entity.ts`        | Mapeo de una entidad persistente y sus relaciones. |
| `related_persons.entity.ts`                   | Mapeo de una entidad persistente y sus relaciones. |
| `secretary_profiles.entity.ts`                | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
