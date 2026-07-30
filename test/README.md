# test

Pruebas automatizadas, configuración y utilidades de verificación.

## Contenido

### Subcarpetas

- [`integration/`](./integration/README.md): componentes de integration.
- [`smoke/`](./smoke/README.md): componentes de smoke.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `app.e2e-spec.ts` | Implementación o recurso de soporte de esta carpeta. |
| `jest-e2e.json` | Configuración o datos estructurados de soporte. |
| `jest-integration.json` | Configuración o datos estructurados de soporte. |
| `jest-smoke.json` | Configuración o datos estructurados de soporte. |
| `tsconfig.integration.json` | Configuración o datos estructurados de soporte. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
