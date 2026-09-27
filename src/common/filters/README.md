# src / common / filters

Traducción centralizada de errores a respuestas de transporte.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `all-exceptions.filter.ts` | Implementación o recurso de soporte de esta carpeta. |
| `validation-exception.factory.ts` | `exceptionFactory` del `ValidationPipe` global: `details.violations` (textos, compatibles) + `details.fields` (ruta completa por campo). |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
