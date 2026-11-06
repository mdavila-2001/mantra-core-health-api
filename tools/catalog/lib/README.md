# tools / catalog / lib

Groups **lib**-related components and keeps this system responsibility cohesive.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `tsentities.mjs` | Automatización ejecutable de mantenimiento. |
| `vault.mjs` | Automatización ejecutable de mantenimiento. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
