# src / modules / insurance / services

Casos de uso, reglas de negocio y coordinación transaccional.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `appeals.service.ts` | Casos de uso y reglas de negocio. |
| `broker-commission.service.ts` | Casos de uso y reglas de negocio. |
| `claims.service.ts` | Casos de uso y reglas de negocio. |
| `coverage.service.ts` | Casos de uso y reglas de negocio. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `insurance-backbone.service.ts` | Casos de uso y reglas de negocio. |
| `insurance-read.service.ts` | Casos de uso y reglas de negocio. |
| `prior-auth.service.ts` | Casos de uso y reglas de negocio. |
| `reconciliation.service.ts` | Casos de uso y reglas de negocio. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
