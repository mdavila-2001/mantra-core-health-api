# tools / catalog / lib

Agrupa los componentes relacionados con **lib** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `tsentities.mjs` | Automatización ejecutable de mantenimiento. |
| `vault.mjs` | Automatización ejecutable de mantenimiento. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
