# src / modules / identity assurance / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

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
| `index.ts` | Punto de exportación pública de la carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
