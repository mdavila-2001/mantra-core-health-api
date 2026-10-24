<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `public`

- **Bloque:** —
- **Operaciones:** 2 (2 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 2
- **Tablas distintas que tocan:** 11
- **Respuestas de error y detalle contractual:** `openapi/endpoints/public.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/public/profiles/f/{slug}/products` | Productos que ofrece una farmacia, desde su ficha pública | BAJO | 9 | pública |
| 2 | GET | `/public/profiles/o/{slug}/services` | Servicios que ofrece una organización, desde su ficha pública | BAJO | 4 | pública |

---

## 1. GET /public/profiles/f/{slug}/products

- **Origen:** CONTRATO
- **Nombre:** Productos que ofrece una farmacia, desde su ficha pública
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PublicCatalogController.pharmacyProducts` — `src/modules/public/presentation/controllers/public-catalog.controller.ts:44`

### Qué es y para qué sirve (negocio)

Productos que ofrece una farmacia, desde su ficha pública.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /public/profiles/f/{slug}/products` la atiende `PublicCatalogController.pharmacyProducts` (src/modules/public/presentation/controllers/public-catalog.controller.ts:44). Es una ruta pública: no exige token. Delega en `PublicCatalogService.pharmacyProducts`. Lee community.public_profiles, pharmacy_inventory.inventory_locations, pharmacy_inventory.inventory_stock_positions, pharmacy.pharmacies, pharmacy.pharmacy_price_lists, pharmacy.pharmacy_product_prices, pharmacy.pharmacy_products, pharmacy.pharmacy_sites y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/public/presentation/controllers/public-catalog.controller.ts:44` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/public/presentation/controllers/public-catalog.controller.ts:44` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogService.typeProfile → PublicCatalogRepository.findVisibleProfileBySlug | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:75` |
| `pharmacy_inventory.inventory_locations` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:157` |
| `pharmacy_inventory.inventory_stock_positions` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:157` |
| `pharmacy.pharmacies` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:157` |
| `pharmacy.pharmacy_price_lists` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:157` |
| `pharmacy.pharmacy_product_prices` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:157` |
| `pharmacy.pharmacy_products` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:157` |
| `pharmacy.pharmacy_sites` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:157` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PublicCatalogController.pharmacyProducts → PublicCatalogService.pharmacyProducts → PublicCatalogRepository.findPharmacyProducts | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:157` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |
| `cursor` | query | No | `string` | Cursor opaco de la página anterior |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicPharmacyProductPageDto>` · DTO `PublicPharmacyProductPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PublicPharmacyProductDto>` | Sí | — | — | — | `src/modules/public/presentation/dto/public-catalog.dto.ts:138` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/public/presentation/dto/public-catalog.dto.ts:83` |
| `items[].genericName` | `string` | Sí | — | — | El genérico: es por lo que busca quien lleva una receta. | `src/modules/public/presentation/dto/public-catalog.dto.ts:87` |
| `items[].brandName` | `string` | Sí | admite null | — | La marca concreta, o `null` si vende el genérico. | `src/modules/public/presentation/dto/public-catalog.dto.ts:91` |
| `items[].presentation` | `string` | Sí | admite null | — | Concentración y presentación publicadas, o `null`. | `src/modules/public/presentation/dto/public-catalog.dto.ts:95` |
| `items[].therapeuticGroup` | `string` | Sí | admite null | — | Siempre `null` por ahora: el grupo terapéutico no es columna del modelo y derivarlo del ATC no está decidido. No se inventa. | `src/modules/public/presentation/dto/public-catalog.dto.ts:102` |
| `items[].price` | `string` | Sí | admite null | — | Precio de esta farmacia, texto exacto. `null` = sin precio publicado. | `src/modules/public/presentation/dto/public-catalog.dto.ts:106` |
| `items[].currency` | `string` | Sí | admite null | — | — | `src/modules/public/presentation/dto/public-catalog.dto.ts:109` |
| `items[].inStock` | `boolean` | Sí | — | — | Si lo tiene ahora. Un agotado se lista rotulado, no se esconde. | `src/modules/public/presentation/dto/public-catalog.dto.ts:113` |
| `items[].requiresPrescription` | `boolean` | Sí | — | — | — | `src/modules/public/presentation/dto/public-catalog.dto.ts:116` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/public/presentation/dto/public-catalog.dto.ts:141` |
| `totalHint` | `number` | Sí | admite null | — | — | `src/modules/public/presentation/dto/public-catalog.dto.ts:144` |
| `generatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/public/presentation/dto/public-catalog.dto.ts:147` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/public.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Public catalog module — etapa `ctrl:PublicCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /public/profiles/o/{slug}/services

- **Origen:** CONTRATO
- **Nombre:** Servicios que ofrece una organización, desde su ficha pública
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PublicCatalogController.organizationServices` — `src/modules/public/presentation/controllers/public-catalog.controller.ts:30`

### Qué es y para qué sirve (negocio)

Servicios que ofrece una organización, desde su ficha pública.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /public/profiles/o/{slug}/services` la atiende `PublicCatalogController.organizationServices` (src/modules/public/presentation/controllers/public-catalog.controller.ts:30). Es una ruta pública: no exige token. Delega en `PublicCatalogService.organizationServices`. Lee billing.service_catalog, community.public_profiles, practice.practices, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/public/presentation/controllers/public-catalog.controller.ts:30` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/public/presentation/controllers/public-catalog.controller.ts:30` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | POR_SQL | PublicCatalogController.organizationServices → PublicCatalogService.organizationServices → PublicCatalogRepository.findOfferedServices | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:106` |
| `community.public_profiles` | LEE | LEE | POR_SQL | PublicCatalogController.organizationServices → PublicCatalogService.organizationServices → PublicCatalogService.typeProfile → PublicCatalogRepository.findVisibleProfileBySlug | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:75` |
| `practice.practices` | LEE | LEE | POR_SQL | PublicCatalogController.organizationServices → PublicCatalogService.organizationServices → PublicCatalogRepository.findOfferedServices | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:106` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PublicCatalogController.organizationServices → PublicCatalogService.organizationServices → PublicCatalogRepository.findOfferedServices | `src/modules/public/infrastructure/repositories/public-catalog.repository.ts:106` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |
| `cursor` | query | No | `string` | Cursor opaco de la página anterior |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicOfferedServicePageDto>` · DTO `PublicOfferedServicePageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PublicOfferedServiceDto>` | Sí | — | — | — | `src/modules/public/presentation/dto/public-catalog.dto.ts:122` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/public/presentation/dto/public-catalog.dto.ts:51` |
| `items[].code` | `string` | Sí | — | — | El código del catálogo. | `src/modules/public/presentation/dto/public-catalog.dto.ts:55` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/public/presentation/dto/public-catalog.dto.ts:58` |
| `items[].description` | `string` | Sí | admite null | — | Qué incluye, cuando la organización lo escribió. | `src/modules/public/presentation/dto/public-catalog.dto.ts:62` |
| `items[].price` | `string` | Sí | admite null | — | Precio de referencia como texto exacto, o `null` si no hay uno definido (un `default_price` en cero es «Definí el precio», no «gratis»). | `src/modules/public/presentation/dto/public-catalog.dto.ts:69` |
| `items[].currency` | `string` | Sí | admite null | — | Código de la moneda (`BOB`), o `null` cuando no hay precio. | `src/modules/public/presentation/dto/public-catalog.dto.ts:73` |
| `items[].isActive` | `boolean` | Sí | — | — | Un servicio dado de baja se sigue listando, rotulado. | `src/modules/public/presentation/dto/public-catalog.dto.ts:77` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/public/presentation/dto/public-catalog.dto.ts:125` |
| `totalHint` | `number` | Sí | admite null | — | Sin conteo: contar todo el catálogo por pedido no se justifica. | `src/modules/public/presentation/dto/public-catalog.dto.ts:129` |
| `generatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/public/presentation/dto/public-catalog.dto.ts:132` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/public.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Public catalog module — etapa `ctrl:PublicCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

