# src / modules / promotions / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `coupons.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `discount_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `earning_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `loyalty_memberships.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `loyalty_programs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `loyalty_tiers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `member_referrals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `points_ledger_entries.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `promotions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `redemptions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `referral_programs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
