# src / modules / pharmacy / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `pharmacies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_external_product_mappings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_integration_connections.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_licenses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_price_lists.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_product_identifiers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_product_prices.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_products.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `pharmacy_sites.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
