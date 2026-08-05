# src / modules / redis runtime / services

Casos de uso, reglas de negocio y coordinación transaccional.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `redis-runtime.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `redis-runtime.service.ts` | Casos de uso y reglas de negocio. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
