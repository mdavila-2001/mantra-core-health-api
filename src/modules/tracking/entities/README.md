# src / modules / tracking / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `delivery_proofs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `eta_estimates.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `milestone_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `shipment_handoffs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `shipments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `trackable_subjects.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_carriers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
