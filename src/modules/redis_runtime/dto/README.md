# src / modules / redis runtime / dto

Contratos de entrada y salida, validación y documentación de la API.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `acquire-lock.dto.ts` | Contratos validados de entrada y salida. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `redis-responses.dto.ts` | Contratos validados de entrada y salida. |
| `release-lock.query.ts` | Implementación o recurso de soporte de esta carpeta. |
| `set-cache.dto.ts` | Contratos validados de entrada y salida. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
