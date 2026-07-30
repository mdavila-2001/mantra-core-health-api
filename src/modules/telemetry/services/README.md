# src / modules / telemetry / services

Casos de uso, reglas de negocio y coordinación transaccional.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `telemetry-consent.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `telemetry-consent.service.ts` | Casos de uso y reglas de negocio. |
| `telemetry-events.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `telemetry-events.service.ts` | Casos de uso y reglas de negocio. |
| `telemetry-governance.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `telemetry-governance.service.ts` | Casos de uso y reglas de negocio. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
