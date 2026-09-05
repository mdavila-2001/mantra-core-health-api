# tools

Herramientas de mantenimiento, auditoría y automatización del repositorio.

## Contenido

### Subcarpetas

- [`catalog/`](./catalog/README.md): componentes de catalog.
- [`documentation/`](./documentation/README.md): componentes de documentation.
- [`postman/`](./postman/README.md): componentes de postman.
- [`alovida/`](./alovida/README.md): componentes de alovida.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `wire-module.mjs` | Automatización ejecutable de mantenimiento. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
