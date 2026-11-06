# src / common / http

Groups **http**-related components and keeps this system responsibility cohesive.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `http-dispatcher.service.ts` | Use cases and business rules. |
| `ssrf-guard.ts` | Support implementation or resource for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
