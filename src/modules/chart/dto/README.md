# src / modules / chart / dto

Contratos de entrada y salida, validación y documentación de la API.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `care-plans.dto.ts` | Contratos validados de entrada y salida. |
| `documents.dto.ts` | Contratos validados de entrada y salida. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `notes.dto.ts` | Contratos validados de entrada y salida. |
| `templates.dto.ts` | Contratos validados de entrada y salida. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
