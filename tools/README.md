# tools

Herramientas de mantenimiento, auditoría y automatización del repositorio.

## Contents

### Subdirectories

- [`catalog/`](./catalog/README.md): componentes de catalog.
- [`documentation/`](./documentation/README.md): componentes de documentation.
- [`postman/`](./postman/README.md): componentes de postman.
- [`alovida/`](./alovida/README.md): componentes de alovida.

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `wire-module.mjs` | Automatización ejecutable de mantenimiento. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
