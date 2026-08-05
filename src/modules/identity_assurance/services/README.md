# src / modules / identity assurance / services

Casos de uso, reglas de negocio y coordinación transaccional.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `identity-assertions.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-assertions.service.ts` | Casos de uso y reglas de negocio. |
| `identity-authorities.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-authorities.service.ts` | Casos de uso y reglas de negocio. |
| `identity-cases.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-cases.service.ts` | Casos de uso y reglas de negocio. |
| `identity-checks.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-checks.service.ts` | Casos de uso y reglas de negocio. |
| `identity-manual-review.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-manual-review.service.ts` | Casos de uso y reglas de negocio. |
| `identity-policies.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-policies.service.ts` | Casos de uso y reglas de negocio. |
| `index.ts` | Punto de exportación pública de la carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
