# tools / redesa

Agrupa los componentes relacionados con **redesa** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `coverage-report.mjs` | Automatización ejecutable de mantenimiento. |
| `guardrails.mjs` | Automatización ejecutable de mantenimiento. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
