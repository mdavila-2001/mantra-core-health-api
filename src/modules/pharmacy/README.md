# Módulo Pharmacy (24)

Identidad de farmacia con licencias, sedes dispensadoras, catálogo de productos con
identificadores, listas de precios y precios versionados, integración externa con
mapeo de productos, retiro de catálogo y proyección al read-model.

## Endpoints (UC → ruta)

| UC | Método y ruta | Resumen |
| --- | --- | --- |
| UC-24-01 | `POST /pharmacies` | Alta de farmacia con licencia inicial (DRAFT / PENDING) |
| UC-24-02 | `POST /pharmacies/{pharmacyId}/sites` | Registrar sede dispensadora (requiere farmacia ACTIVE) |
| UC-24-03 | `POST /pharmacies/{pharmacyId}/licenses/{licenseId}/verify` | Verificar licencia y aprobar farmacia |
| UC-24-04 | `POST /pharmacies/{pharmacyId}/products` | Publicar producto con identificadores (GTIN/NDC) |
| UC-24-05 | `POST /pharmacies/{pharmacyId}/price-lists` | Crear lista de precios (pública / por aseguradora) |
| UC-24-06 | `POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/prices` | Fijar/versionar precio |
| UC-24-07 | `POST /pharmacies/{pharmacyId}/integration-connections` | Establecer conexión de integración |
| UC-24-08 | `POST /pharmacies/{pharmacyId}/integration-connections/{connId}/product-mappings` | Mapear producto a código externo |
| UC-24-09 | `DELETE /pharmacies/{pharmacyId}/products/{productId}` | Retirar (soft-delete) producto en cascada |
| UC-24-10 | `POST /pharmacies/{pharmacyId}/price-lists/{priceListId}/close` | Cerrar/expirar lista de precios |
| UC-24-11 | `POST /pharmacies/{pharmacyId}/projections` | Proyectar catálogo y precios a read-model |

### Cara de lectura (carril E2 · `/pharmacy`)

| Método y ruta | Resumen |
| --- | --- |
| `GET /pharmacy/pharmacies` | Directorio de farmacias publicadas del tenant activo |
| `GET /pharmacy/pharmacies/{id}` | Perfil de una farmacia: ficha y sedes con dirección y coordenadas |
| `GET /pharmacy/sites?search=&lat=&lng=&limit=` | Sedes publicadas, sueltas, con distancia Haversine si hay origen (carril A) |
| `GET /pharmacy/products?search=&conceptId=&pharmacyId=&limit=` | Búsqueda de productos por texto, medicamento del vademécum o farmacia (`pharmacyId`: carril A) |
| `GET /pharmacy/sites/{siteId}/prices?product=` | Precios públicos vigentes de una sede, con `requiresPrescription` por producto (carril A) |

Visible = farmacia `ACTIVE` **y** `VERIFIED` del tenant del contexto (mismo
criterio que el directorio de unidades diagnósticas); sedes y productos,
además, activos. Lo ajeno o no publicado responde el mismo `404`. Los
`*_concept_id` se sirven resueltos a `{code, display}` y la dirección de cada
sede llega en texto con sus coordenadas (`pharmacy_site → practice_site →
common.addresses`). El precio vigente respeta **tres ventanas a la vez**: lista
`ACTIVE` dentro de `valid_from`/`valid_to` **y pública**, y versión de precio
`ACTIVE` dentro de `effective_from`/`effective_to`. Una lista ligada a una
aseguradora (`insurer_tenant_id`) nunca sale por esta cara aunque esté marcada
visible: es un acuerdo entre partes, no precio de mostrador. `conceptId` de la
búsqueda es el `medication_concept_id` del vademécum (`terminology`, códigos
ATC): el mismo con que la receta identifica el fármaco.

## Entidades

`pharmacies`, `pharmacy_licenses`, `pharmacy_sites`, `pharmacy_products`,
`pharmacy_product_identifiers`, `pharmacy_price_lists`, `pharmacy_product_prices`,
`pharmacy_integration_connections`, `pharmacy_external_product_mappings` (schema
`pharmacy`).

## Reglas de negocio

- **Ciclo de verificación:** una farmacia nace en `DRAFT` con verificación
  `PENDING`. Al verificar todas sus licencias pasa a `ACTIVE` / `VERIFIED`. Las
  altas de sedes, productos, listas, precios y conexiones exigen la farmacia
  `ACTIVE` (→ `422 PreconditionFailed` si no lo está).
- **Precios versionados:** cada precio nuevo del par (lista, producto) toma
  `version_number = max+1`, se marca `effective_from = now`, y la versión previa
  vigente pasa a `SUPERSEDED` con `effective_to = now`.
- **Retiro en cascada (soft-delete):** retirar un producto lo marca `RETIRED`,
  supersede sus precios vigentes e inactiva sus mapeos externos.
- **Cierre de lista:** cerrar una lista la marca `CLOSED` (`valid_to = now`) y
  supersede todos sus precios vigentes.
- **Integración:** `connection_id` es una FK NOT NULL auto-referente; si el cliente
  no aporta una conexión externa la fila se auto-referencia por su propio id. El
  mapeo exige conexión `ACTIVE` que soporte consulta de stock o de precio.
- **Unicidad (a nivel de aplicación):** `(tenant, code)` de farmacia,
  `(pharmacy, code)` de sede/lista, `(pharmacy, product_code)` de producto,
  `(connection, product)` de mapeo → `409 Conflict`.

## Permisos

Todas las operaciones administrativas exigen rol `SECURITY_ADMIN` (guard global
+ `@Roles`). La cara de lectura (`/pharmacy/*`) no exige rol: son lecturas
publicadas, y el filtro real es la publicación más el aislamiento por tenant
que aplica el servicio — igual que el directorio de unidades diagnósticas.

## Logs

Pino estructurado con `operation: 'pharmacy.*'`; se registran inicio, éxito y
rechazos de regla de negocio. Nunca secretos ni PHI.

## Concept seeds

`PHARMACY_CONCEPT_SEEDS` (prefijo `pharmacy:`) en `pharmacy.concepts.ts`; el mapa
`PHARM` expone los UUID deterministas. Los estados genéricos se derivan de este
archivo para que el módulo sea auto-contenido.

## Tests

- Unitarios: `services/*.service.spec.ts` (mockean repos/em) y
  `controllers/pharmacy.controller.spec.ts` (mockea servicios).
- Smoke de integración: `test/smoke/modules/pharmacy.smoke.ts`
  (`PHARMACY_SMOKE`), encadena el ciclo completo sobre `ctx.vars`.
