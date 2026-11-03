# src / modules / promotions / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo                           | Responsabilidad                                    |
| --------------------------------- | -------------------------------------------------- |
| `coupons.entity.ts`               | Mapeo de una entidad persistente y sus relaciones. |
| `discount_rules.entity.ts`        | Mapeo de una entidad persistente y sus relaciones. |
| `earning_rules.entity.ts`         | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts`                        | Public export barrel for this folder.        |
| `loyalty_memberships.entity.ts`   | Mapeo de una entidad persistente y sus relaciones. |
| `loyalty_programs.entity.ts`      | Mapeo de una entidad persistente y sus relaciones. |
| `loyalty_tiers.entity.ts`         | Mapeo de una entidad persistente y sus relaciones. |
| `member_referrals.entity.ts`      | Mapeo de una entidad persistente y sus relaciones. |
| `points_ledger_entries.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `promotions.entity.ts`            | Mapeo de una entidad persistente y sus relaciones. |
| `redemptions.entity.ts`           | Mapeo de una entidad persistente y sus relaciones. |
| `referral_programs.entity.ts`     | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
