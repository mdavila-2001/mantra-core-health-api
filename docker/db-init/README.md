# docker / db init

Groups **db init**-related components and keeps this system responsibility cohesive.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `init-mongo.sh` | Support implementation or resource for this folder. |
| `init-opensearch.sh` | Support implementation or resource for this folder. |
| `init-postgres.sh` | Support implementation or resource for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
