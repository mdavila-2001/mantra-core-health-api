# src / modules / consent / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `consent_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `consent_evidence.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `consent_provisions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `consents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `hipaa_authorizations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `patient_objections.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `privacy_restrictions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `processing_legal_bases.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `processing_purposes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `treatment_informed_consents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
