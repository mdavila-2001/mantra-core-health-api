# src / common / tenant

Agrupa los componentes relacionados con **tenant** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `system-read-scope.ts` | `withSystemRead`: contexto de sistema acotado a una lectura de autenticación (login y renovación), restaurado en `finally`. `withSystemWrite`: el análogo para UNA escritura sin organización en ese mismo límite (el bloqueo de cuenta de `iam.account_lockouts`): vuelca lo pendiente antes de abrir el contexto y lo escrito antes de cerrarlo, exige transacción y lo restaura en `finally`. |
| `tenant-context.interceptor.spec.ts` | Pruebas unitarias del componente homónimo. |
| `tenant-context.interceptor.ts` | Implementación o recurso de soporte de esta carpeta. |
| `tenant-context.ts` | Implementación o recurso de soporte de esta carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
