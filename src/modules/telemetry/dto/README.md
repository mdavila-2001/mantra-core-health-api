# src / modules / telemetry / dto

Contratos de entrada y salida, validación y documentación de la API.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `activity-event.dto.ts` | Contratos validados de entrada y salida. |
| `analytics-subject.dto.ts` | Contratos validados de entrada y salida. |
| `client-context.dto.ts` | Contratos validados de entrada y salida. |
| `conversion-event.dto.ts` | Contratos validados de entrada y salida. |
| `disclosure-acceptance.dto.ts` | Contratos validados de entrada y salida. |
| `disclosure-version.dto.ts` | Contratos validados de entrada y salida. |
| `event-schema.dto.ts` | Contratos validados de entrada y salida. |
| `funnel.dto.ts` | Contratos validados de entrada y salida. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `session-journey.dto.ts` | Contratos validados de entrada y salida. |
| `tracking-consent.dto.ts` | Contratos validados de entrada y salida. |
| `tracking-purpose.dto.ts` | Contratos validados de entrada y salida. |
| `web-vital.dto.ts` | Contratos validados de entrada y salida. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
