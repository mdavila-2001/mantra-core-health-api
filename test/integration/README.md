# test / integration

Agrupa los componentes relacionados con **integration** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `common.int-spec.ts` | Implementación o recurso de soporte de esta carpeta. |
| `harness.ts` | Implementación o recurso de soporte de esta carpeta. |
| `iam.int-spec.ts` | Implementación o recurso de soporte de esta carpeta. |
| `rls.int-spec.ts` | Implementación o recurso de soporte de esta carpeta. |
| `seed.int-spec.ts` | Implementación o recurso de soporte de esta carpeta. |
| `terminology.int-spec.ts` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
