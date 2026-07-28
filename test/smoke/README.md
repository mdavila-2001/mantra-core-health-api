# test / smoke

Agrupa los componentes relacionados con **smoke** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Subcarpetas

- [`modules/`](./modules/README.md): componentes de modules.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `registry.ts` | Implementación o recurso de soporte de esta carpeta. |
| `smoke-kit.ts` | Implementación o recurso de soporte de esta carpeta. |
| `smoke.int-spec.ts` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
