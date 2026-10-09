# src / modules / scheduling / state

Agrupa los componentes relacionados con **state** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo                         | Responsabilidad                                      |
| ------------------------------- | ---------------------------------------------------- |
| `booking-state-machine.spec.ts` | Pruebas unitarias del componente homónimo.           |
| `booking-state-machine.ts`      | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
