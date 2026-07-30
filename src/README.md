# src

Agrupa los componentes relacionados con **src** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

### Subcarpetas

- [`common/`](./common/README.md): componentes de common.
- [`logging/`](./logging/README.md): componentes de logging.
- [`modules/`](./modules/README.md): componentes de modules.
- [`orm/`](./orm/README.md): componentes de orm.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `app.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `app.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `app.module.ts` | Composición de dependencias del módulo NestJS. |
| `app.service.ts` | Casos de uso y reglas de negocio. |
| `main.ts` | Implementación o recurso de soporte de esta carpeta. |
| `mikro-orm.config.ts` | Configuración tipada del componente. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
