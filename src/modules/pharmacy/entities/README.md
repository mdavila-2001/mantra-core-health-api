# src / modules / pharmacy / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Public export barrel for this folder. |
| `pharmacies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_external_product_mappings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_integration_connections.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_licenses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_price_lists.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_product_identifiers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_product_prices.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_products.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_sites.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
