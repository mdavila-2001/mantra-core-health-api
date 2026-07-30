# src / modules / document store / services

Casos de uso, reglas de negocio y coordinación transaccional.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `document-store.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `document-store.service.ts` | Casos de uso y reglas de negocio. |
| `index.ts` | Punto de exportación pública de la carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
