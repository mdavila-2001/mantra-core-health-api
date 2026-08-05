# src / modules / consent / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `consent_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `consent_evidence.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `consent_provisions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `consents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `hipaa_authorizations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `patient_objections.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `privacy_restrictions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `processing_legal_bases.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `processing_purposes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `treatment_informed_consents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
