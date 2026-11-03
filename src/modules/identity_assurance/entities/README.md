# src / modules / identity assurance / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `identity_assertions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `identity_authorities.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `identity_authority_endpoints.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `identity_check_results.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `identity_checks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `identity_evidence_records.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `identity_fraud_signals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `identity_manual_review_cases.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `identity_verification_attempts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `identity_verification_cases.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `identity_verification_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
