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
| `clinical-forms-seed.service.ts` | Siembra el catálogo de formularios clínicos estándar por especialidad (carril R2-5). |
| `bo-geography.catalog.ts` | Los nueve departamentos de Bolivia y los derivadores deterministas de sus ids. |
| `bo-geography-seed.service.ts` | Siembra `VS_BO_DEPARTMENT`: el conjunto, su versión vigente y los nueve miembros. Lo lee el registro público para «departamento que emitió tu documento». |
| `data/clinical-forms/` | El contenido de ese catálogo: un `.json` por formulario, con su ficha de procedencia. Tiene su propio `README.md`. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
