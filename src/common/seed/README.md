# src / common / seed

Agrupa los componentes relacionados con **seed** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `concept-seed.ts` | Implementación o recurso de soporte de esta carpeta. |
| `module-concepts.ts` | Implementación o recurso de soporte de esta carpeta. |
| `seed.module.ts` | Composición de dependencias del módulo NestJS. |
| `terminology-seed.service.ts` | Casos de uso y reglas de negocio. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
