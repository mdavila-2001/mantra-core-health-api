# src / modules / pharma_lab / repositories

Consultas y operaciones de persistencia aisladas de la lógica de negocio.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `agenda.repository.ts` | Acceso a datos aislado de la lógica de negocio. |
| `analytics.repository.ts` | Acceso a datos aislado de la lógica de negocio. |
| `catalog.repository.ts` | Acceso a datos aislado de la lógica de negocio. |
| `doctor-calendar.repository.ts` | Acceso a datos aislado de la lógica de negocio. |
| `index.ts` | Public export barrel for this folder. |
| `organization.repository.ts` | Acceso a datos aislado de la lógica de negocio. |
| `pharmacovigilance.repository.ts` | Acceso a datos aislado de la lógica de negocio. |
| `regulatory.repository.ts` | Acceso a datos aislado de la lógica de negocio. |
| `surveys.repository.ts` | Acceso a datos aislado de la lógica de negocio. |
| `visitors.repository.ts` | Acceso a datos aislado de la lógica de negocio. |
| `visits.repository.ts` | Acceso a datos aislado de la lógica de negocio. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
